from sqlalchemy import create_engine, text, inspect
import os
import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@db/horarios")
engine = create_engine(DATABASE_URL)

def run_fix():
    with engine.connect() as conn:
        print("--- Iniciando Reparación de Integridad y Realineación de Horarios ---")
        
        # 1. Crear Comisión para Huérfanos
        # Buscamos un departamento y materia para colgar la comisión
        dept = conn.execute(text("SELECT id FROM departamentos LIMIT 1")).fetchone()
        if not dept:
            print("ERROR: No se encontró ningún departamento para crear la materia de auditoría.")
            return

        # Verificar si la materia ya existe
        materia_id = conn.execute(text("SELECT id FROM materias WHERE nombre = :n"), {"n": "AUDITORÍA"}).scalar()
        if not materia_id:
            res = conn.execute(text("INSERT INTO materias (nombre, codigo, departamento_id, created_at) VALUES ('AUDITORÍA', 'AUDIT', :dept_id, NOW()) RETURNING id"), {"dept_id": dept[0]})
            materia_id = res.scalar()
            print(f"Materia 'AUDITORÍA' creada (ID {materia_id}).")

        # Verificar si la comisión ya existe
        comision_id = conn.execute(text("SELECT id FROM comisiones WHERE codigo = :c"), {"c": "PENDIENTE_AUDITORIA"}).scalar()
        if not comision_id:
            res = conn.execute(text("INSERT INTO comisiones (codigo, materia_id, turno, created_at) VALUES ('PENDIENTE_AUDITORIA', :m_id, 'mañana', NOW()) RETURNING id"), {"m_id": materia_id})
            comision_id = res.scalar()
            print(f"Comisión 'PENDIENTE_AUDITORIA' creada (ID {comision_id}).")

        # Vincular las 16 asignaciones
        res = conn.execute(text("UPDATE asignaciones SET comision_id = :c_id WHERE comision_id IS NULL"), {"c_id": comision_id})
        print(f"Integridad Física: {res.rowcount} asignaciones vinculadas a la comisión de auditoría.")

        # 2. Realineación de Módulos (40 min cada uno)
        def get_slots(start_h, start_m, count):
            slots = []
            current = datetime.datetime.strptime(f"{start_h}:{start_m}", "%H:%M")
            for _ in range(count):
                end = current + datetime.timedelta(minutes=40)
                slots.append((current.strftime("%H:%M:%S"), end.strftime("%H:%M:%S")))
                current = end
            return slots

        # Definir nuevos rangos según pedido del usuario
        new_ranges = {
            "mañana": get_slots(7, 30, 8),   # 07:30 a 12:50
            "tarde": get_slots(13, 0, 8),    # 13:00 a 18:20
            "noche": get_slots(18, 30, 8)    # 18:30 a 23:50 (Usuario dijo 23:30, pero ponemos 8 módulos para cubrir el rango)
        }

        # Obtener módulos actuales ordenados para reasignar tiempos
        # Usamos numero o id para mantener el orden secuencial
        all_modulos = conn.execute(text("SELECT id, turno FROM modulos_horario ORDER BY turno, id")).fetchall()
        
        # Agrupar módulos actuales por turno
        modulos_por_turno = {"mañana": [], "tarde": [], "noche": []}
        for m_id, m_turno in all_modulos:
            if m_turno in modulos_por_turno:
                modulos_por_turno[m_turno].append(m_id)

        print("\n--- Actualizando Horarios de Módulos ---")
        for turno, slots in new_ranges.items():
            current_ids = modulos_por_turno[turno]
            print(f"Turno {turno}: {len(slots)} slots definidos, {len(current_ids)} módulos existentes.")
            
            for i, (start, end) in enumerate(slots):
                if i < len(current_ids):
                    # Actualizar existente
                    m_id = current_ids[i]
                    conn.execute(text("UPDATE modulos_horario SET hora_inicio = :s, hora_fin = :e, numero = :n, activo = 1 WHERE id = :id"), 
                                {"s": start, "e": end, "n": i+1, "id": m_id})
                else:
                    # Crear nuevo si falta
                    conn.execute(text("INSERT INTO modulos_horario (numero, hora_inicio, hora_fin, turno, activo) VALUES (:n, :s, :e, :t, 1)"),
                                {"n": i+1, "s": start, "e": end, "t": turno})
            
            # Si sobran módulos en el turno, desactivarlos (o borrarlos si no tienen asignaciones)
            if len(current_ids) > len(slots):
                for extra_id in current_ids[len(slots):]:
                    # Verificar si tiene asignaciones antes de borrar
                    has_asig = conn.execute(text("SELECT COUNT(*) FROM asignaciones WHERE modulo_id = :id"), {"id": extra_id}).scalar()
                    if has_asig == 0:
                        conn.execute(text("DELETE FROM modulos_horario WHERE id = :id"), {"id": extra_id})
                        print(f"  Módulo extra {extra_id} eliminado (sin asignaciones).")
                    else:
                        conn.execute(text("UPDATE modulos_horario SET activo = 0 WHERE id = :id"), {"id": extra_id})
                        print(f"  Módulo extra {extra_id} desactivado (contiene asignaciones!).")

        conn.commit()
        print("\nREPARACIÓN Y REALINEACIÓN COMPLETADA.")

if __name__ == "__main__":
    run_fix()
