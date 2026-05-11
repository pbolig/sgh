import subprocess
from sqlalchemy import create_engine, text

# CONFIGURACION LOCAL (Windows)
LOCAL_DB_URL = "postgresql://horarios_user:horarios123@localhost/horarios"

# CONFIGURACION REMOTA (VPS)
REMOTE_USER = 'root'
REMOTE_HOST = '213.136.70.104'
CONTAINER_PROD = 'sgh-db'
DB_USER = 'horarios_user'
DB_NAME = 'horarios'

def get_local_stats():
    stats = {}
    engine = create_engine(LOCAL_DB_URL)
    try:
        with engine.connect() as conn:
            tables = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'")).fetchall()
            for (table,) in tables:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).fetchone()[0]
                stats[table] = count
    except Exception as e:
        print(f"Error local: {e}")
    return stats

def get_remote_stats():
    stats = {}
    try:
        # 1. Obtener lista de tablas usando STDIN de Python
        sql_list = "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
        cmd_list = f"ssh {REMOTE_USER}@{REMOTE_HOST} \"docker exec -i {CONTAINER_PROD} psql -U {DB_USER} -d {DB_NAME} -t -A\""
        
        proc_list = subprocess.run(cmd_list, shell=True, input=sql_list, capture_output=True, text=True)
        tables_raw = proc_list.stdout.strip().split()
        
        if not tables_raw: return {}

        # 2. Construir SQL de conteo masivo
        queries = [f"SELECT '{t}', COUNT(*) FROM {t}" for t in tables_raw]
        big_sql = " UNION ALL ".join(queries) + ";"
        
        # 3. Ejecutar gran conteo usando STDIN de Python
        cmd_audit = f"ssh {REMOTE_USER}@{REMOTE_HOST} \"docker exec -i {CONTAINER_PROD} psql -U {DB_USER} -d {DB_NAME} -t -A\""
        proc_audit = subprocess.run(cmd_audit, shell=True, input=big_sql, capture_output=True, text=True)
        
        result_raw = proc_audit.stdout.strip().splitlines()
        
        for line in result_raw:
            if '|' in line:
                parts = line.split('|')
                table_name = parts[0].strip()
                count = int(parts[1].strip())
                stats[table_name] = count
    except Exception as e:
        print(f"Error remoto: {e}")
    return stats

def audit():
    print("\n" + "="*75)
    print("--- AUDITORIA DE INTEGRIDAD DE DATOS (LOCAL vs PRODUCCION) ---")
    print("="*75 + "\n")
    print(f"{'TABLA':<30} | {'LOCAL':<10} | {'PROD':<10} | {'ESTADO'}")
    print("-" * 75)
    
    local = get_local_stats()
    remote = get_remote_stats()
    
    if not local or not remote:
        print("❌ Error: No se pudieron obtener los datos para comparar.")
        return

    all_tables = sorted(list(set(local.keys()) & set(remote.keys())))
    
    mismatches = 0
    for table in all_tables:
        l_val = local.get(table)
        r_val = remote.get(table)
        
        l_str = str(l_val) if l_val is not None else "0"
        r_str = str(r_val) if r_val is not None else "0"
        
        status = "✅ OK" if l_val == r_val else "❌ DIFERENTE"
        if l_val != r_val: mismatches += 1
        
        print(f"{table:<30} | {l_str:<10} | {r_str:<10} | {status}")
    
    print("-" * 75)
    if mismatches == 0:
        print("\n🎉 ¡SINCRONIZACION PERFECTA! Todos los datos coinciden.")
    else:
        print(f"\n⚠️ Se encontraron {mismatches} diferencias en los conteos.")
    print("="*75 + "\n")

if __name__ == "__main__":
    audit()
