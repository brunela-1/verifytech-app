# VerifiTech

Plataforma de marketplace para conectar clientes con técnicos verificados (plomeros, electricistas, etc.).

## Arquitectura

```
Frontend (React 19 + Vite 6 + Tailwind) ─── FastAPI Backend ─── Supabase (Auth + PostgreSQL + Storage)
```

---

## Setup Local

### Requisitos Previos

- Node.js 18+
- Python 3.11+
- Cuenta en [Supabase](https://supabase.com)

---

### 1. Supabase — Configurar el Proyecto

1. Crea un proyecto en Supabase
2. En **Settings → API** copia:
   - `Project URL` → `VITE_SUPABASE_URL` y `DATABASE_URL` (sección Connect → SQLAlchemy)
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`
   - `JWT Secret` → `SUPABASE_JWT_SECRET`
3. Crear los **Storage Buckets** (públicos):
   - `tech-docs`
   - `request-images`
   - `profile-photos`

---

### 2. Backend (FastAPI)

```bash
cd backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores de Supabase

# Ejecutar migraciones
alembic upgrade head

# Correr el servidor
uvicorn app.main:app --reload --port 8000
```

La API estará disponible en `http://localhost:8000`  
Docs interactivos: `http://localhost:8000/docs`

---

### 3. Frontend (React + Vite)

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores de Supabase y la URL del backend

# Correr el servidor de desarrollo
npm run dev
```

La app estará en `http://localhost:3000`

---

## Variables de Entorno

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://usuario:pass@host:5432/dbname
SUPABASE_JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:8000
```

---

## Despliegue en Producción

### Frontend → Vercel
- Root Directory: `frontend/`
- Build Command: `npm run build`
- Output: `dist/`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

### Backend → Render
- Root Directory: `backend/`
- Runtime: Python
- Build Command: `pip install -r requirements.txt && alembic upgrade head`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env vars: `DATABASE_URL`, `SUPABASE_JWT_SECRET`, `FRONTEND_URL`

---

## Flujos Principales

1. **Registro** → Supabase Auth → sync-profile en FastAPI → Rol asignado
2. **Cliente crea solicitud** → fotos suben a Supabase Storage → URL guardada en BD
3. **Técnico ve bolsa de trabajos** → envía propuesta con precio y tiempo estimado
4. **Cliente acepta propuesta** → selecciona bloque de horario → Servicio creado (transacción atómica con anti-conflictos)
5. **Técnico avanza estados**: Programado → En Progreso → Finalizado
6. **Cliente califica** → rating_avg del técnico se actualiza automáticamente

---

## Estructura del Proyecto

```
ProyectoCustomer/
├── backend/          FastAPI + SQLAlchemy + Alembic
│   ├── app/
│   │   ├── auth/     JWT verification (Supabase)
│   │   ├── models/   SQLAlchemy ORM
│   │   ├── schemas/  Pydantic (request/response)
│   │   └── routers/  REST endpoints
│   └── alembic/      Migraciones de BD
└── frontend/         React 19 + Vite 6 + Tailwind CSS v4
    └── src/
        ├── api/      Axios HTTP client + interceptor JWT
        ├── components/ UI components reutilizables
        ├── lib/      Supabase client + Storage helpers
        ├── pages/    Páginas por ruta
        ├── store/    AuthContext (sesión Supabase)
        └── types/    TypeScript types
```
