from database import engine
from sqlalchemy import text

def merge_calendars():
    with engine.connect() as conn:
        print("--- INICIANDO FUSION DE CALENDARIOS ---")
        
        # Obtener todas las instituciones que tienen calendarios
        insts = conn.execute(text("SELECT DISTINCT institucion_id FROM calendarios WHERE institucion_id IS NOT NULL")).fetchall()
        
        for (inst_id,) in insts:
            print(f"\nProcesando Institucion ID: {inst_id}")
            
            # Obtener todos los calendarios de esta institucion
            cals = conn.execute(text(f"""
                SELECT c.id, COUNT(e.id) as event_count 
                FROM calendarios c 
                LEFT JOIN calendario_eventos e ON c.id = e.calendario_id 
                WHERE c.institucion_id = {inst_id}
                GROUP BY c.id
                ORDER BY event_count DESC
            """)).fetchall()
            
            if len(cals) <= 1:
                print("Solo tiene un calendario o ninguno. Saltando.")
                continue
                
            # El "Survivor" es el que tiene más eventos
            survivor_id = cals[0][0]
            others = [c[0] for c in cals[1:]]
            
            print(f"Survivor: ID {survivor_id} | Redundantes: {others}")
            
            # Convertir el Survivor en puramente Institucional (null depto/carrera)
            conn.execute(text(f"UPDATE calendarios SET departamento_id = NULL, carrera_id = NULL, nombre = 'Calendario Institucional' WHERE id = {survivor_id}"))
            
            for other_id in others:
                # Mover eventos
                conn.execute(text(f"UPDATE calendario_eventos SET calendario_id = {survivor_id} WHERE calendario_id = {other_id}"))
                # Mover categorías
                conn.execute(text(f"UPDATE calendario_categorias SET calendario_id = {survivor_id} WHERE calendario_id = {other_id}"))
                # Mover notas
                conn.execute(text(f"UPDATE notas_adhesivas SET calendario_id = {survivor_id} WHERE calendario_id = {other_id}"))
                # Borrar el calendario redundante
                conn.execute(text(f"DELETE FROM calendarios WHERE id = {other_id}"))
            
            print(f"Fusion completada para Institucion {inst_id}")
            
        conn.commit()
        print("\n--- PROCESO FINALIZADO CON EXITO ---")

if __name__ == "__main__":
    merge_calendars()
