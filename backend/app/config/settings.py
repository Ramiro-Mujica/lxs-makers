# app/config/settings.py
# Centraliza toda la configuración desde el archivo .env
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Base de datos MySQL
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "lxs_makers"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # Cloudinary (imágenes)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Seguridad JWT
    SECRET_KEY: str = "cambiar_en_produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # App
    APP_NAME: str = "LXS Makers"
    DEBUG: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
