from database import engine
from sqlalchemy import text

def deduplicate_categories():
    with engine.connect() as conn:
        print("--- INICIANDO LIMPIEZA DE CATEGORIAS DUPLICADAS ---")
        
        # 1. Obtener todos los calendarios
        cals = conn.execute(text("SELECT id FROM calendarios")).fetchall()
        
        for (cal_id,) in cals:
            print(f"\nProcesando Calendario ID: {cal_id}")
            
            # Obtener categorías de este calendario agrupadas por nombre
            cats = conn.execute(text(f"SELECT nombre, ARRAY_AGG(id) FROM calendario_categorias WHERE calendario_id = {cal_id} GROUP BY nombre")).fetchall()
            
            for nombre, ids in cats:
                if len(ids) > 1:
                    survivor_id = ids[0]
                    redundants = ids[1:]
                    print(f"  > Unificando '{nombre}': Survivor {survivor_id}, Redundantes {redundants}")
                    
                    for red_id in redundants:
                        # Reasignar eventos
                        conn.execute(text(f"UPDATE calendario_eventos SET categoria_id = {survivor_id} WHERE categoria_id = {red_id}"))
                        # Borrar categoría redundante
                        conn.execute(text(f"DELETE FROM calendario_categorias WHERE id = {red_id}"))
        
        conn.commit()
        print("\n--- LIMPIEZA COMPLETADA CON EXITO ---")

if __name__ == "__main__":
    deduplicate_categories()
