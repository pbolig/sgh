from sqlalchemy import create_engine, text

engine = create_engine('postgresql://horarios_user:horarios123@localhost:5432/horarios')
conn = engine.connect()

modules = [
    (1, '20:00', '20:40', 'noche', 1),
    (2, '20:40', '21:20', 'noche', 1),
    (3, '21:30', '22:10', 'noche', 1),
    (4, '22:10', '22:50', 'noche', 1),
    (5, '23:00', '23:40', 'noche', 1),
    (6, '23:40', '00:20', 'noche', 1)
]

try:
    for m in modules:
        conn.execute(text(
            "INSERT INTO modulos_horario (numero, hora_inicio, hora_fin, turno, activo) "
            "VALUES (:num, :start, :end, :turno, :active)"
        ), {"num": m[0], "start": m[1], "end": m[2], "turno": m[3], "active": m[4]})
    conn.commit()
    print("Módulos de turno noche insertados correctamente.")
except Exception as e:
    print(f"Error al insertar módulos: {e}")
finally:
    conn.close()
