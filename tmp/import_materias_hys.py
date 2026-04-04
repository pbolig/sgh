import sys
import os
import json

sys.path.append('/app')

from database import SessionLocal
from models import Materia, Comision
from sqlalchemy.orm import Session

DATA = """3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;1;3;x;;;;;;1FI1;FÍSICA I;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;1;3;x;;;;;;1QUI1;QUÍMICA I;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;1;2;x;;;;;;1DITE;DIBUJO TÉCNICO;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;1;3;x;;;;;;1ALG;ÁLGEBRA;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;1;2;x;;;;;;1ORL;ORGANIZACIÓN LABORAL;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;1;4;x;;;;;;1SEG1;SEGURIDAD I;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;1;4;x;;;;;;1INC1;INCENDIO I;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;1;3;x;;;;;;1HIG1;HIGIENE I;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;1;2;x;;;;;;1ANTF;ANTROPOLOGÍA FILOSÓFICA;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;1;2;x;;;;;;1COM1;COMPUTACIÓN I;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;1;2;x;;;;;;1ING1;INGLÉS I;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;2;3;x;;;;;;2FIS2;FÍSICA II;Álgebra-Física I
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;2;3;x;;;;;;2QUI2;QUÍMICA II;Química I
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;2;3;x;;;;;;2AMAT;ANÁLISIS MATEMÁTICO;Álgebra
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;2;4;x;;;;;;2SEG2;SEGURIDAD II;Seguridad I
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;2;4;x;;;;;;2HIG2;HIGIENE II;Higiene I
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;2;3;x;;;;;;2TECM;TECNOLOGÍA DE LOS MATERIALES;Física I-Química I
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;2;4;x;;;;;;2INC2;INCENDIO II;Incendio I
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;2;2;x;;;;;;2FORN;FORMACIÓN NACIONAL;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;2;2;x;;;;;;2COM2;COMPUTACIÓN II;Computación I
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;2;2;x;;;;;;2ING2;INGLÉS II;Inglés I
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;3;3;x;;;;;;3SCP;SELECCIÓN Y CAPACITACIÓN DE PERSONAL;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;3;3;x;;;;;;3LELA;LEGISLACIÓN LABORAL;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;3;4;x;;;;;;3SAM;SANEAMIENTO AMBIENTAL;Química Ii
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;3;3;x;;;;;;3PSIL;PSICOLOGÍA LABORAL;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;3;4;x;;;;;;3SEG3;SEGURIDAD III;Seguridad Ii
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;3;4;x;;;;;;3HIG3;HIGIENE III;Higiene Ii
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;3;2;x;;;;;;3ETP;ÉTICA PROFESIONAL;
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;3;2;x;;;;;;3COMA;COMPUTACIÓN APLICADA;Computación Ii
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;3;2;x;;;;;;3ING3;INGLÉS III;Inglés Ii
3012/2002 - TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO;3;3;x;;;;;;3PPR;PRÁCTICA PROFESIONAL;Computación Aplicada-Ética Profesional-Higiene Iii-Inglés Iii-Legislación Laboral-Psicología Laboral-Saneamiento Ambiental"""

DEPTO_ID = 9

def import_data():
    db = SessionLocal()
    try:
        lines = DATA.strip().split('\n')
        subjects_created = []

        # Pass 1: Create Subjects and Commissions
        for line in lines:
            parts = line.split(';')
            if len(parts) < 11: continue
            
            anio = int(parts[1])
            carga = int(parts[2])
            comm_a = parts[3].lower() == 'x'
            comm_b = len(parts) > 5 and parts[5].lower() == 'x'
            comm_c = len(parts) > 7 and parts[7].lower() == 'x'
            codigo = parts[9].strip()
            nombre = parts[10].strip()
            correlativas_raw = parts[11].strip() if len(parts) > 11 else ""

            # Materia
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

            # Commissions
            for letter, exists in [('A', comm_a), ('B', comm_b), ('C', comm_c)]:
                if exists:
                    c_code = f"{codigo}-{letter}"
                    comm = db.query(Comision).filter(Comision.codigo == c_code).first()
                    if not comm:
                        comm = Comision(
                            codigo=c_code,
                            materia_id=materia.id,
                            turno='tarde' if anio == 3 else 'mañana',
                            activo=1
                        )
                        db.add(comm)
                        print(f"  Creada comisión: {c_code}")

        db.commit()

        # Pass 2: Correlatives
        all_subjects = db.query(Materia).filter(Materia.departamento_id == DEPTO_ID).all()
        name_to_code = {s.nombre.lower(): s.codigo for s in all_subjects}
        for s in all_subjects:
            name_to_code[s.codigo.lower()] = s.codigo

        for materia, raw in subjects_created:
            if not raw or raw.upper() == 'N/A':
                materia.correlativas = json.dumps([])
                continue
            
            # Clean and split (H&S uses '-' or ' - ')
            raw_clean = raw.replace(' - ', '|')
            raw_clean = raw_clean.replace('-', '|')
            parts_raw = [p.strip().lower() for p in raw_clean.split('|') if p.strip()]
            
            codes = []
            for p in parts_raw:
                if p in name_to_code:
                    codes.append(name_to_code[p])
                else:
                    print(f"  AVISO: No se encontró correlativa '{p}' para {materia.nombre}")
            
            materia.correlativas = json.dumps(codes)
            print(f"Correlativas para {materia.nombre}: {codes}")

        db.commit()
        print("IMPORTACIÓN HYS COMPLETADA")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    import_data()
