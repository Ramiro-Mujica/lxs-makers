import random
import string

LONGITUD_CODIGO = 8


def generar_codigo_catalogo() -> str:
    caracteres = string.ascii_uppercase + string.digits
    return "".join(random.choices(caracteres, k=LONGITUD_CODIGO))


def generar_codigo_seguimiento() -> str:
    caracteres = string.ascii_uppercase + string.digits
    return "".join(random.choices(caracteres, k=LONGITUD_CODIGO))