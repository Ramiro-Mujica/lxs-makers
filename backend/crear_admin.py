"""
Script de uso único para crear el primer usuario administrador.
Equivale a 'python manage.py createsuperuser' de Django.

Uso: python crear_admin.py
"""
from getpass import getpass

from app.database import SessionLocal
from app.models.usuario import Usuario
from app.security.auth import hashear_password


def crear_admin():
    email = input("Email del administrador: ").strip().lower()
    password = getpass("Contraseña: ")

    db = SessionLocal()
    try:
        existe = db.query(Usuario).filter(Usuario.email == email).first()
        if existe:
            print("Ya existe un usuario con ese email.")
            return

        admin = Usuario(
            email=email,
            password=hashear_password(password),
            rol="administrador",
            estado="activo",
            is_staff=True,
            is_superuser=True,
        )
        db.add(admin)
        db.commit()
        print(f"Administrador creado correctamente: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    crear_admin()