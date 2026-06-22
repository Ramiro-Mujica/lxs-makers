import io
import uuid
from PIL import Image
from supabase import create_client
from app.config import settings

ANCHO_MAXIMO = 1200
CALIDAD_WEBP = 85


class SupabaseClientSingleton:
    _instancia = None

    def __new__(cls):
        if cls._instancia is None:
            cls._instancia = super().__new__(cls)
            cls._instancia._cliente = create_client(
                settings.supabase_url,
                settings.supabase_service_key,
            )
        return cls._instancia

    @property
    def cliente(self):
        return self._cliente


def convertir_y_subir(contenido: bytes, vendedor_id: str, producto_id: str) -> str:
    
    imagen = Image.open(io.BytesIO(contenido))

    if imagen.mode in ("RGBA", "P"):
        imagen = imagen.convert("RGB")

    if imagen.width > ANCHO_MAXIMO:
        ratio = ANCHO_MAXIMO / imagen.width
        nuevo_alto = int(imagen.height * ratio)
        imagen = imagen.resize((ANCHO_MAXIMO, nuevo_alto), Image.LANCZOS)

    buffer = io.BytesIO()
    imagen.save(buffer, format="WEBP", quality=CALIDAD_WEBP)
    buffer.seek(0)

    nombre_archivo = f"{vendedor_id}/{producto_id}/{uuid.uuid4()}.webp"
    bucket = settings.supabase_bucket

    SupabaseClientSingleton().cliente.storage.from_(bucket).upload(
        path=nombre_archivo,
        file=buffer.read(),
        file_options={"content-type": "image/webp"},
    )

    return f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{nombre_archivo}"


def eliminar_imagen_storage(url: str) -> None:
    
    try:
        bucket = settings.supabase_bucket
        partes = url.split(f"/public/{bucket}/")
        if len(partes) == 2:
            SupabaseClientSingleton().cliente.storage.from_(bucket).remove([partes[1]])
    except Exception:
        pass