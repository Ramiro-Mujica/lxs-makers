# LXS Makers

Sistema de Gestión Comercial para Emprendedores  
Parcial 2 — Diseño de Sistemas

## Stack Tecnológico

- **Frontend:** React.js + React Router
- **Backend:** FastAPI (Python)
- **Base de datos:** MySQL (phpMyAdmin)
- **Imágenes:** Cloudinary (conversión automática a WebP)
- **Autenticación:** JWT

## Estructura del Proyecto

```
lxs-makers/
├── backend/
│   ├── app/
│   │   ├── config/       # Singleton DB + Settings
│   │   ├── models/       # Clases del diagrama (SQLAlchemy)
│   │   ├── controllers/  # Rutas FastAPI (MVC)
│   │   ├── schemas/      # Validaciones Pydantic
│   │   ├── services/     # Lógica de negocio
│   │   ├── utils/        # Helpers
│   │   └── middleware/   # Auth middleware
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/   # Navbar y componentes reutilizables
│       ├── pages/        # Vistas
│       └── context/      # Estado global
└── database/
    └── lxs_makers.sql
```

## Instalación Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Completar .env con credenciales reales
uvicorn main:app --reload
```

## Instalación Frontend

```bash
cd frontend
npm install
npm run dev
```

## Base de Datos

Importar el archivo `database/lxs_makers.sql` en phpMyAdmin.
