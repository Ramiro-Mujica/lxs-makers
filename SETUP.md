# LXS Makers — Guía de instalación

Esta guía sirve para levantar el proyecto completo desde cero en cualquier computadora (por ejemplo, una del instituto), partiendo solo del código clonado de GitHub.

## Requisitos previos

Antes de empezar, la computadora necesita tener instalado:

- **Python 3.11** o superior ([python.org/downloads](https://www.python.org/downloads/))
- **Node.js 18** o superior ([nodejs.org](https://nodejs.org/))
- **Git** (para clonar el repositorio)

Para verificar si ya están instalados, abrí una terminal y corré:

```powershell
python --version
node --version
git --version
```

Si alguno de los tres comandos da error, hay que instalar esa herramienta antes de seguir.

## Paso 1: Clonar el repositorio

```powershell
git clone https://github.com/Ramiro-Mujica/lxs-makers.git
cd lxs-makers
```

## Paso 2: Backend (FastAPI)

### 2.1 Crear el entorno virtual

```powershell
cd backend
python -m venv venv
```

### 2.2 Activar el entorno virtual

```powershell
.\venv\Scripts\Activate.ps1
```

Si PowerShell da un error de "ejecución de scripts deshabilitada", correr antes (una sola vez):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

### 2.3 Instalar las dependencias

```powershell
pip install -r requirements.txt
```

### 2.4 Crear el archivo `.env`

Este archivo **no se sube a GitHub** (por seguridad), así que hay que crearlo a mano en cada computadora nueva. Crear un archivo llamado `.env` dentro de `backend/` con este contenido (reemplazando los valores reales de Supabase):

```
ENVIRONMENT=development

SECRET_KEY=django-insecure-lxsmakers-cambiar-en-produccion-2024

DB_NAME=postgres
DB_USER=postgres.buffzosaujvddjnrpnom
DB_PASSWORD=<contraseña real de la base, pedirla aparte>
DB_HOST=aws-1-sa-east-1.pooler.supabase.com
DB_PORT=5432

SUPABASE_URL=https://buffzosaujvddjnrpnom.supabase.co
SUPABASE_SERVICE_KEY=<service key real, pedirla aparte>
SUPABASE_BUCKET=productos
```

### 2.5 Levantar el servidor

```powershell
uvicorn app.main:app --reload
```

Debería quedar corriendo en `http://127.0.0.1:8000`. Probar en el navegador: `http://127.0.0.1:8000/salud-db` tiene que devolver que la base está conectada.

## Paso 3: Frontend (React)

Abrir **otra terminal** (dejar la del backend corriendo), y desde la raíz del proyecto:

```powershell
cd frontend
npm install
npm run dev
```

Debería quedar corriendo en `http://localhost:5173`.

## Paso 4: Crear un usuario administrador (solo la primera vez)

Si la base está vacía o es necesario un admin nuevo, abrir una **tercera terminal**, activar el venv del backend igual que en el paso 2.2, y correr:

```powershell
cd backend
python crear_admin.py
```

Va a pedir email y contraseña por consola.

## Resumen de las 3 terminales que quedan corriendo

| Terminal | Ubicación | Comando |
|---|---|---|
| Backend | `lxs-makers/backend` (con venv activado) | `uvicorn app.main:app --reload` |
| Frontend | `lxs-makers/frontend` | `npm run dev` |
| (Opcional) | `lxs-makers/backend` (con venv activado) | usada para correr comandos puntuales |

## Problemas comunes

- **Error de CORS en el navegador**: verificar que `app/main.py` tenga el `CORSMiddleware` con `http://localhost:5173` en `allow_origins`.
- **"password authentication failed"**: la contraseña en `.env` está mal copiada o desactualizada. Resetearla desde Supabase → Database → Settings.
- **Error al instalar `psycopg2-binary`**: confirmar que la versión de Python instalada sea 3.11 (algunas versiones más nuevas o muy viejas pueden no tener wheels precompilados disponibles).
