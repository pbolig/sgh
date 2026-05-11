import subprocess
import os
import json
import time

# CONFIGURACION
REMOTE_USER = 'root'
REMOTE_HOST = '213.136.70.104'
CONTAINER_PROD = 'sgh-db'
CONTAINER_LOCAL = 'sgh-db'
DB_USER = 'horarios_user'
DB_NAME = 'horarios'
REMOTE_TEMP_PATH = '/tmp/temp_dump.sql'

def run_cmd(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True)

def sync_data():
    print("\n[1/4] Exportando datos locales...")
    # Usamos cmd /c para asegurar redirección correcta en Windows
    export_cmd = f"cmd /c \"docker exec -i {CONTAINER_LOCAL} pg_dump -U {DB_USER} -d {DB_NAME} --clean --no-owner --no-privileges --encoding=UTF8 > temp_dump.sql\""
    run_cmd(export_cmd)
    
    if not os.path.exists("temp_dump.sql") or os.path.getsize("temp_dump.sql") < 100:
        print("❌ Error: El dump local falló o está vacio.")
        return False

    print("[2/4] Subiendo dump al servidor (SCP)...")
    # Subir el archivo al VPS
    scp_cmd = f"scp temp_dump.sql {REMOTE_USER}@{REMOTE_HOST}:{REMOTE_TEMP_PATH}"
    subprocess.run(scp_cmd, shell=True) # Dejamos que el usuario vea el prompt de password

    print("[3/4] Limpiando y preparando base de datos remota...")
    sql_cleanup = f"DROP SCHEMA public CASCADE; CREATE SCHEMA public; ALTER SCHEMA public OWNER TO {DB_USER};"
    drop_cmd = f"ssh {REMOTE_USER}@{REMOTE_HOST} \"docker exec -i {CONTAINER_PROD} psql -h localhost -U {DB_USER} -d {DB_NAME} -c '{sql_cleanup}'\""
    run_cmd(drop_cmd)

    print("[4/4] Inyectando datos desde el archivo en el servidor...")
    # Inyectamos desde el archivo que subimos
    import_cmd = f"ssh {REMOTE_USER}@{REMOTE_HOST} \"cat {REMOTE_TEMP_PATH} | docker exec -i {CONTAINER_PROD} psql -h localhost -U {DB_USER} -d {DB_NAME}\""
    subprocess.run(import_cmd, shell=True)
    
    # Limpieza
    run_cmd(f"ssh {REMOTE_USER}@{REMOTE_HOST} \"rm {REMOTE_TEMP_PATH}\"")
    if os.path.exists("temp_dump.sql"):
        os.remove("temp_dump.sql")
    return True

def verify():
    print("\n--- VERIFICANDO SINCRONIZACION ---")
    sql = "SELECT json_object_agg(tablename, count) FROM (SELECT tablename, (xpath('/row/c/text()', query_to_xml(format('select count(*) from %I', tablename), false, true, '')))[1]::text::int as count FROM pg_catalog.pg_tables WHERE schemaname = 'public') t;"
    cmd = f"ssh {REMOTE_USER}@{REMOTE_HOST} \"docker exec -i {CONTAINER_PROD} psql -h localhost -U {DB_USER} -d {DB_NAME} -t -c \\\"{sql}\\\"\""
    
    res = run_cmd(cmd)
    result = res.stdout.strip()
    try:
        if "{" in result:
            result = result[result.find("{"):]
            return json.loads(result)
    except Exception as e:
        print(f"Error parseando resultado: {e}")
        print(f"Resultado crudo: {result}")
    return {}

def main():
    print("="*60)
    print("SISTEMA DE SINCRONIZACION MAESTRA (V3 - SCP METHOD)")
    print("="*60)
    
    if sync_data():
        print("\nProceso de carga finalizado. Verificando...")
        time.sleep(2)
        stats = verify()
        if stats and len(stats) > 0:
            print(f"✅ EXITO: Se encontraron {len(stats)} tablas sincronizadas.")
            print("Ya puedes usar 'python compare_db_integrity.py' para el detalle.")
        else:
            print("❌ ERROR: La base remota sigue vacia.")
    else:
        print("❌ El proceso se detuvo por errores locales.")

if __name__ == "__main__":
    main()
