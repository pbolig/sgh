import subprocess
import os
import time

# CONFIGURACION
REMOTE_USER = 'root'
REMOTE_HOST = '213.136.70.104'
CONTAINER_PROD = 'sgh-db'
CONTAINER_LOCAL = 'sgh-db'
DB_USER = 'horarios_user'
DB_NAME = 'horarios'
REMOTE_TEMP_PATH = '/tmp/prod_dump.sql'

def run_cmd(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True)

def sync_from_prod():
    print("="*60)
    print("SINCRONIZADOR: PRODUCCION -> LOCAL (V1)")
    print("="*60)

    print("\n[1/4] Exportando datos en el SERVIDOR...")
    export_cmd = f"ssh {REMOTE_USER}@{REMOTE_HOST} \"docker exec -i {CONTAINER_PROD} pg_dump -U {DB_USER} -d {DB_NAME} --clean --no-owner --no-privileges --encoding=UTF8\" > prod_dump.sql"
    # Ejecutamos y esperamos
    subprocess.run(export_cmd, shell=True)
    
    if not os.path.exists("prod_dump.sql") or os.path.getsize("prod_dump.sql") < 100:
        print("❌ Error: La exportación remota falló.")
        return False

    print("[2/4] Limpiando base de datos LOCAL...")
    # Limpiar el esquema public local
    sql_cleanup = "DROP SCHEMA public CASCADE; CREATE SCHEMA public; ALTER SCHEMA public OWNER TO horarios_user;"
    clean_cmd = f"docker exec -i {CONTAINER_LOCAL} psql -U {DB_USER} -d {DB_NAME} -c \"{sql_cleanup}\""
    run_cmd(clean_cmd)

    print("[3/4] Inyectando datos en Docker LOCAL...")
    # Inyectar el dump descargado
    import_cmd = f"cmd /c \"type prod_dump.sql | docker exec -i {CONTAINER_LOCAL} psql -U {DB_USER} -d {DB_NAME}\""
    subprocess.run(import_cmd, shell=True)

    print("[4/4] Limpieza de archivos temporales...")
    if os.path.exists("prod_dump.sql"):
        os.remove("prod_dump.sql")
    
    return True

if __name__ == "__main__":
    if sync_from_prod():
        print("\n✅ EXITO: Tu base de datos local ahora es una copia exacta de Producción.")
        print("Puedes ejecutar 'python compare_db_integrity.py' para verificar.")
    else:
        print("\n❌ Hubo un error en la sincronización.")
