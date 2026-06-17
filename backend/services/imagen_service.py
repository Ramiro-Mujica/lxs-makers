import io
import uuid
from PIL import Image
from decouple import config
from supabase import create_client

SUPABASE_URL        = config('SUPABASE_URL')
SUPABASE_SERVICE_KEY = config('SUPABASE_SERVICE_KEY')
SUPABASE_BUCKET     = config('SUPABASE_BUCKET')
MAX_ANCHO           = 1200
CALIDAD_WEBP        = 85

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def convertir_y_subir(archivo, vendedor_id, producto_id):
    imagen = Image.open(archivo)

    if imagen.mode in ('RGBA', 'P'):
        imagen = imagen.convert('RGB')

    if imagen.width > MAX_ANCHO:
        ratio  = MAX_ANCHO / imagen.width
        nuevo_alto = int(imagen.height * ratio)
        imagen = imagen.resize((MAX_ANCHO, nuevo_alto), Image.LANCZOS)

    buffer = io.BytesIO()
    imagen.save(buffer, format='WEBP', quality=CALIDAD_WEBP)
    buffer.seek(0)

    nombre_archivo = f"{vendedor_id}/{producto_id}/{uuid.uuid4()}.webp"

    supabase.storage.from_(SUPABASE_BUCKET).upload(
        path=nombre_archivo,
        file=buffer.read(),
        file_options={"content-type": "image/webp"}
    )

    url_publica = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{nombre_archivo}"
    return url_publica


def eliminar_imagen_storage(url):
    try:
        partes = url.split(f"/public/{SUPABASE_BUCKET}/")
        if len(partes) == 2:
            path = partes[1]
            supabase.storage.from_(SUPABASE_BUCKET).remove([path])
    except Exception:
        pass