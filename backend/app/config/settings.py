# app/config/settings.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_HOST:     str = "localhost"
    DB_PORT:     int = 3306
    DB_NAME:     str = "lxs_makers"
    DB_USER:     str = "root"
    DB_PASSWORD: str = ""

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY:    str = ""
    CLOUDINARY_API_SECRET: str = ""

    SECRET_KEY:                  str = "cambiar_en_produccion"
    ALGORITHM:                   str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    APP_NAME: str  = "LXS Makers"
    DEBUG:    bool = True

    class Config:
        env_file = ".env"


settings = Settings()
