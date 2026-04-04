DATA = """2019/1983 - TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES;1;3;x;;x;;;;1INCOM;INTRODUCCIÓN A LA COMPUTACIÓN;N/A"""
parts = DATA.split(';')
for i, p in enumerate(parts):
    print(f"{i}: '{p}'")
