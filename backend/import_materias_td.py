import sys
import os
import json

# Agregar el path del backend para importar modelos y base de datos
sys.path.append('/app')

from database import SessionLocal
from models import Materia, Comision, Departamento
from sqlalchemy.orm import Session

DATA = """2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;1;3;x;;x;;;;1INCOM;INTRODUCCIÓN A LA COMPUTACIÓN;N/A
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;1;4;x;;x;;;;1SISP;SISTEMA DE PROGRAMACIÓN;N/A
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;1;4;x;;x;;;;1ELECG;ELECTROTECNIA GENERAL;N/A
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;1;4;x;;x;;;;1ELEC1;ELECTRÓNICA I;N/A
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;1;4;x;;x;;;;1TECD1;TÉCNICAS DIGITALES I;N/A
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;1;4;x;;x;;;;1LABM1;LABORATORIO DE MEDICIONES I;N/A
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;1;3;x;;x;;;;1ING1;INGLÉS I;N/A
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;1;2;x;;x;;;;1INTFI;INTRODUCCIÓN A LA FILOSOFÍA;N/A
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;2;4;x;;x;;;;2DISES;DISP. ENTRADA/SALIDA;Introducción A La Computación
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;2;4;x;;x;;;;2MI1;MICROPROCESADORES I;Electrotecnia General - Laboratorio De Mediciones I - Sistema De Programación - Técnicas Digitales I
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;2;4;x;;x;;;;2ELE1;ELECTRÓNICA II;Electrónica I-Electrotecnia General-Laboratorio De Mediciones I
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;2;4;x;;x;;;;2TED2;TÉCNICAS DIGITALES II;Electrotecnia General-Técnicas Digitales I
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;2;4;x;;x;;;;2LABM2;LABORATORIO DE MEDICIONES II;Electrónica I-Laboratorio De Mediciones I
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;2;4;x;;x;;;;2ELEA;ELECTRÓNICA ANALÓGICA;Electrotecnia General-Laboratorio De Mediciones I
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;2;3;x;;x;;;;2ING2;INGLÉS II;Inglés I
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;2;2;x;;x;;;;2ARS;ANAL. REALIDAD SOCIAL;
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;3;4;x;;;;;;3TECAC;TECNOL. COMPONENTES APLIC. A COMPUTACIÓN;Disp. Entrada/Salida
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;3;5;x;;;;;;3MIC2;MICROPROCESADORES II;Microprocesadores I
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;3;4;x;;;;;;3ADFC;ANAL. Y DETECCIÓN DE FALLAS EN COMPUTAD.;Electrónica Analógica-Electrónica Ii-Laboratorio De Mediciones Ii-Microprocesadores I-Técnicas Digitales Ii
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;3;4;x;;;;;;3LABM3;LABORATORIO DE MEDICIONES III;Electrónica Ii-Laboratorio De Mediciones Ii-Técnicas Digitales Ii
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;3;4;x;;;;;;3SCOM;SISTEMAS DE COMUNICACIÓN;
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;3;4;x;;;;;;3ELE3;ELECTRÓNICA III;Electrónica Ii-Laboratorio De Mediciones Ii
2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;3;3;x;;;;;;3EMP;ÉTICA Y MORAL PROFESIONAL;"""

DEPTO_ID = 10

def import_data():
    db = SessionLocal()
    try:
        lines = DATA.strip().split('\n')
        subjects_created = []

        # Pass 1: Create Subjects and Commissions
        for line in lines:
            parts = line.split(';')
            if len(parts) < 12: continue
            
            anio = int(parts[1])
            carga = int(parts[2])
            comm_a = parts[3].lower() == 'x'
            comm_b = parts[5].lower() == 'x'
            comm_c = parts[7].lower() == 'x'
            codigo = parts[9].strip()
            nombre = parts[10].strip()
            correlativas_raw = parts[11].strip() if len(parts) > 11 else ""

            # Crear o actualizar Materia
            materia = db.query(Materia).filter(Materia.codigo == codigo, Materia.departamento_id == DEPTO_ID).first()
            if not materia:
                materia = Materia(
                    nombre=nombre,
                    codigo=codigo,
                    codigo_interno=codigo,
                    anio=anio,
                    carga_horaria_modulos=carga,
                    departamento_id=DEPTO_ID,
                    activo=1
                )
                db.add(materia)
                db.flush()
                print(f"Creada materia: {nombre} ({codigo})")
            else:
                materia.anio = anio
                materia.carga_horaria_modulos = carga
                print(f"Actualizada materia: {nombre} ({codigo})")

            subjects_created.append((materia, correlativas_raw))

            # Crear Comisiones
            for letter, exists in [('A', comm_a), ('B', comm_b), ('C', comm_c)]:
                if exists:
                    c_code = f"{codigo}-{letter}"
                    comm = db.query(Comision).filter(Comision.codigo == c_code).first()
                    if not comm:
                        comm = Comision(
                            codigo=c_code,
                            materia_id=materia.id,
                            turno='mañana' if anio < 3 else 'tarde', # Ejemplo de turno
                            activo=1
                        )
                        db.add(comm)
                        print(f"  Creada comisión: {c_code}")

        db.commit()

        # Pass 2: Resolve Correlatives
        # Re-fetch all subjects in this department to build a name map
        all_subjects = db.query(Materia).filter(Materia.departamento_id == DEPTO_ID).all()
        name_to_code = {s.nombre.lower(): s.codigo for s in all_subjects}
        # Agregar variaciones comunes o códigos para fallback
        for s in all_subjects:
            name_to_code[s.codigo.lower()] = s.codigo

        for materia, raw in subjects_created:
            if not raw or raw.upper() == 'N/A':
                materia.correlativas = json.dumps([])
                continue
            
            # Limpiar y separar: El usuario usa " - " o "-"
            raw = raw.replace(' - ', '|').replace('-', '|')
            parts = [p.strip().lower() for p in raw.split('|') if p.strip()]
            
            codes = []
            for p in parts:
                if p in name_to_code:
                    codes.append(name_to_code[p])
                else:
                    print(f"  ADVERTENCIA: No se pudo resolver correlativa '{p}' para {materia.nombre}")
            
            materia.correlativas = json.dumps(codes)
            print(f"Actualizadas correlativas para {materia.nombre}: {codes}")

        db.commit()
        print("IMPORTACIÓN COMPLETADA CON ÉXITO")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    import_data()
