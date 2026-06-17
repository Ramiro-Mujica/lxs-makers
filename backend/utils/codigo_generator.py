import random
import string


def generar_codigo_catalogo(longitud=8):
    caracteres = string.ascii_uppercase + string.digits
    return ''.join(random.choices(caracteres, k=longitud))


def generar_codigo_seguimiento():
    caracteres = string.ascii_uppercase + string.digits
    return ''.join(random.choices(caracteres, k=8))