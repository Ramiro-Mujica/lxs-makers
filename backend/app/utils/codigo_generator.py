# app/utils/codigo_generator.py
import random
import string

LONGITUD_CODIGO = 8
CARACTERES      = string.ascii_uppercase + string.digits


def generar_codigo() -> str:
    """Genera un código alfanumérico de 8 caracteres en mayúsculas."""
    return "".join(random.choices(CARACTERES, k=LONGITUD_CODIGO))


def generar_codigo_unico(db, modelo, campo: str) -> str:
    """Genera un código único verificando que no exista en la base de datos."""
    while True:
        codigo = generar_codigo()
        existe = db.query(modelo).filter(getattr(modelo, campo) == codigo).first()
        if not existe:
            return codigo
