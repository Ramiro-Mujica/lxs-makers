from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Centraliza toda la configuración del proyecto.
    Lee automáticamente los valores desde el archivo .env
    """
    environment: str = "development"

    secret_key: str

    db_name: str
    db_user: str
    db_password: str
    db_host: str
    db_port: str = "5432"

    supabase_url: str
    supabase_service_key: str
    supabase_bucket: str

    class Config:
        env_file = ".env"


settings = Settings()