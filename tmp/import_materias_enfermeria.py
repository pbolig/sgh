import sys
import os
import json

sys.path.append('/app')

from database import SessionLocal
from models import Materia, Comision

# Datos proporcionados por el usuario
DATA = """756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;1;3;x;;x;;x;;1COMU;COMUNICACIÓN;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;1;3;x;;x;;x;;1UDI;UNIDAD DE DEFINICIÓN INSTITUCIONAL I;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;1;3;x;;x;;x;;1SPU;SALUD PÚBLICA;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;1;3;x;;x;;x;;1BHUM;BIOLOGÍA HUMANA;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;1;3;x;;x;;x;;1SCS1;SUJETO, CULTURA Y SOCIEDAD I;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;1;4;x;;x;;x;;1FCE;FUNDAMENTOS DEL CUIDADO EN ENFERMERÍA;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;1;5;x;;x;;x;;1CECF;CUIDADOS DE ENFERMERÍA EN LA COMUNIDAD Y EN LA FAMILIA;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;1;13;x;;x;;x;;1PPR1;PRÁCTICA PROFESIONALIZANTE I;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;2;3;x;;x;;;;2PSCO;PROBLEMÁTICAS SOCIO CONTEMPORÁNEAS;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;2;3;x;;x;;;;2UDI2;UNIDAD DE DEFINICIÓN INSTITUCIONAL II;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;2;4;x;;x;;;;2INSA;INFORMÁTICA EN SALUD;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;2;3;x;;x;;;;2SCS2;SUJETO, CULTURA Y SOCIEDAD II;Sujeto, Cultura Y Sociedad I
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;2;3;x;;x;;;;2BHUM2;BIOLOGÍA HUMANA II;Biología Humana
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;2;4;x;;x;;;;2BMAT;BIOSEGURIDAD Y MEDIO AMBIENTE EN EL TRABAJO;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;2;3;x;;x;;;;2FARE;FARMACOLOGÍA EN ENFERMERÍA;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;2;5;x;;x;;;;2CEAAM;CUIDADOS DE ENFERMERÍA A LOS ADULTOS Y A LOS ADULTOS MAYORES;Cuidados De Enfermería En La Comunidad Y En La Familia-Fundamentos Del Cuidado En Enfermería
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;2;13;x;;x;;;;2PPR2;PRÁCTICA PROFESIONALIZANTE II;Práctica Profesionalizante I
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;3;3;x;;;;;;3ERSO;ÉTICA Y RESPONSABILIDAD SOCIAL;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;3;3;x;;;;;;3DLLA;DERECHO Y LEGISLACIÓN LABORAL;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;3;4;x;;;;;;3INGT;INGLÉS TÉCNICO;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;3;3;x;;;;;;3OGIS;ORGANIZACIÓN Y GESTIÓN EN INSTITUCIONES DE SALUD;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;3;3;x;;;;;;3INEN;INVESTIGACIÓN EN ENFERMERÍA;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;3;4;x;;;;;;3CESM;CUIDADOS DE ENFERMERÍA EN SALUD MENTAL;
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;3;6;x;;;;;;3CENAD;CUIDADOS DE ENFERMERÍA AL NIÑO Y AL ADOLESCENTE;Cuidados De Enfermería A Los Adultos Y A Los Adultos Mayores
756/2011 - TÉCNICO SUPERIOR EN ENFERMERÍA;3;15;x;;;;;;3PPR3;PRÁCTICA PROFESIONALIZANTE III;Práctica Profesionalizante Ii"""

DEPTO_ID = 8

def import_enfermeria():
    db = SessionLocal()
    try:
        lines = DATA.strip().split('\n')
        subjects_created = []

        # Pass 1: Materias y Comisiones
        for line in lines:
            parts = line.split(';')
            if len(parts) < 11: 
                continue
            
            try:
                anio = int(parts[1])
                carga = int(parts[2])
            except ValueError:
                continue

            comm_a = parts[3].lower() == 'x'
            comm_b = parts[5].lower() == 'x' if len(parts) > 5 else False
            comm_c = parts[7].lower() == 'x' if len(parts) > 7 else False
            
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
                            turno='noche' if anio == 3 else 'tarde', # Ejemplo
                            activo=1
                        )
                        db.add(comm)
                        print(f"  Creada comisión: {c_code}")

        db.commit()

        # Pass 2: Resolver Correlativas
        all_subjects = db.query(Materia).filter(Materia.departamento_id == DEPTO_ID).all()
        name_to_code = {s.nombre.lower(): s.codigo for s in all_subjects}
        for s in all_subjects:
            name_to_code[s.codigo.lower()] = s.codigo

        for materia, raw in subjects_created:
            if not raw or raw.upper() == 'N/A':
                materia.correlativas = json.dumps([])
                continue
            
            # Limpiar y separar: El usuario usa " - " o "-"
            raw_clean = raw.replace(' - ', '|')
            raw_clean = raw_clean.replace('-', '|')
            parts_raw = [p.strip().lower() for p in raw_clean.split('|') if p.strip()]
            
            codes = []
            for p in parts_raw:
                if p in name_to_code:
                    codes.append(name_to_code[p])
                else:
                    print(f"  AVISO: No se pudo resolver correlativa '{p}' para {materia.nombre}")
            
            materia.correlativas = json.dumps(codes)
            print(f"Actualizadas correlativas para {materia.nombre}: {codes}")

        db.commit()
        print("IMPORTACIÓN ENFERMERÍA COMPLETADA")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    import_enfermeria()
