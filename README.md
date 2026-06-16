# LXS Makers

Sistema de Gestión Comercial para Emprendedores — Parcial 2

## Stack

- **Frontend:** React.js + React Router + Recharts
- **Backend:** FastAPI (Python)
- **Base de datos:** MySQL (phpMyAdmin / Workbench)
- **Imágenes:** Cloudinary (WebP automático)
- **Auth:** JWT + bcrypt

## Instalación Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Completar con tus credenciales
uvicorn main:app --reload
```

## Instalación Frontend

```bash
cd frontend
npm install
npm install recharts
npm run dev
```

## Base de Datos

Importar `database/lxs_makers.sql` en phpMyAdmin o Workbench.

## Estructura

```
lxs-makers/
├── backend/
│   ├── app/
│   │   ├── config/         # Singleton DB + Settings
│   │   ├── models/         # SQLAlchemy (Usuario, Vendedor, Administrador, Producto, Pedido, Tablero)
│   │   ├── controllers/    # FastAPI routers (MVC)
│   │   ├── schemas/        # Pydantic
│   │   ├── services/       # Cloudinary, Cron
│   │   └── utils/          # JWT, bcrypt, generador de códigos
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/     # Navbar
│       └── pages/          # Inicio, Login, Registro, PanelAdmin, PanelVendedor, Catalogo, Seguimiento
└── database/
    └── lxs_makers.sql
```
