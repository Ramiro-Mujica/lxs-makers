import io
import uuid
from PIL import Image
from decouple import config
from supabase import create_client

MAX_ANCHO    = 1200
CALIDAD_WEBP = 85


class SupabaseClientSingleton:
    """
    Singleton: garantiza una única instancia del cliente Supabase
    en toda la aplicación. Evita crear múltiples conexiones innecesarias.
    """
    _instancia = None

    def __new__(cls):
        if cls._instancia is None:
            cls._instancia = super().__new__(cls)
            cls._instancia._cliente = create_client(
                config('SUPABASE_URL'),
                config('SUPABASE_SERVICE_KEY'),
            )
        return cls._instancia

    @property
    def cliente(self):
        return self._cliente


def convertir_y_subir(archivo, vendedor_id, producto_id):
    imagen = Image.open(archivo)

    if imagen.mode in ('RGBA', 'P'):
        imagen = imagen.convert('RGB')

    if imagen.width > MAX_ANCHO:
        ratio     = MAX_ANCHO / imagen.width
        nuevo_alto = int(imagen.height * ratio)
        imagen    = imagen.resize((MAX_ANCHO, nuevo_alto), Image.LANCZOS)

    buffer = io.BytesIO()
    imagen.save(buffer, format='WEBP', quality=CALIDAD_WEBP)
    buffer.seek(0)

    nombre_archivo = f"{vendedor_id}/{producto_id}/{uuid.uuid4()}.webp"
    bucket         = config('SUPABASE_BUCKET')

    SupabaseClientSingleton().cliente.storage.from_(bucket).upload(
        path=nombre_archivo,
        file=buffer.read(),
        file_options={"content-type": "image/webp"}
    )

    url_publica = f"{config('SUPABASE_URL')}/storage/v1/object/public/{bucket}/{nombre_archivo}"
    return url_publica


def eliminar_imagen_storage(url):
    try:
        bucket  = config('SUPABASE_BUCKET')
        partes  = url.split(f"/public/{bucket}/")
        if len(partes) == 2:
            SupabaseClientSingleton().cliente.storage.from_(bucket).remove([partes[1]])
    except Exception:
        pass