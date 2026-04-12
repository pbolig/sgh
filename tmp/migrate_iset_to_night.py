from sqlalchemy import create_engine, text

# Conexión a la base de datos
engine = create_engine('postgresql://horarios_user:horarios123@localhost:5432/horarios')
conn = engine.connect()

try:
    # 1. Identificar el ID de ISET (Instituto Superior de Educación Técnica N° 57)
    # Ya sabemos que es el ID 1, pero lo haremos dinámico por seguridad
    iset_res = conn.execute(text("SELECT id FROM instituciones WHERE nombre ILIKE '%Educación Técnica%'")).fetchone()
    
    if iset_res:
        iset_id = iset_res[0]
        
        # 2. Actualizar todas las comisiones de materias que pertenezcan a ISET
        # ISET -> Departamentos -> Materias -> Comisiones
        sql_update = """
        UPDATE comisiones 
        SET turno = 'noche'
        WHERE materia_id IN (
            SELECT m.id 
            FROM materias m
            JOIN departamentos d ON m.departamento_id = d.id
            WHERE d.institucion_id = :inst_id
        )
        """
        
        result = conn.execute(text(sql_update), {"inst_id": iset_id})
        conn.commit()
        
        print(f"Se actualizaron {result.rowcount} comisiones al turno 'noche' para la institución con ID {iset_id}.")
    else:
        print("No se encontró la institución 'Instituto Superior de Educación Técnica'.")

except Exception as e:
    print(f"Error durante la actualización: {e}")
finally:
    conn.close()
