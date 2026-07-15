# TécnicoConfianza — Plan de Implementación Full-Stack (v2)

## Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                        SUPABASE                              │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │  Auth        │  │  PostgreSQL DB  │  │    Storage     │  │
│  │  (JWT)       │  │  (via SQLAlch.) │  │  (archivos)    │  │
│  └──────────────┘  └────────────────┘  └────────────────┘  │
└───────────────────┬──────────────────────────┬───────────────┘
                    │                          │
         ┌──────────▼──────────┐   ┌──────────▼──────────┐
         │  BACKEND (Render)   │   │  FRONTEND (Vercel)   │
         │  Python / FastAPI   │◄──│  React 19 / Vite 6  │
         │  SQLAlchemy + Alembic│  │  TypeScript / Tailwind│
         └─────────────────────┘   └─────────────────────┘
```

### Flujo de Autenticación (Supabase Auth → FastAPI)
1. Frontend hace sign-in/sign-up con `@supabase/supabase-js`
2. Supabase devuelve un JWT al frontend
3. El frontend adjunta el JWT en cada request al backend (`Authorization: Bearer <token>`)
4. El backend FastAPI verifica el JWT usando `SUPABASE_JWT_SECRET` (sin llamar a Supabase)
5. El backend extrae el `user_id` (UUID de Supabase) y el `role` del token

### Flujo de Archivos (Supabase Storage)
- **Frontend** sube archivos **directamente** a Supabase Storage usando `@supabase/supabase-js`
- Supabase devuelve la URL pública del archivo
- El frontend envía esa URL al backend FastAPI para guardarla en la BD
- En **local** (dev): el backend puede tener un endpoint `/uploads` temporal

---

## Estructura de Directorios Final (Monorepo)

```
ProyectoCustomer/
├── backend/                          [NEW] FastAPI (deploy → Render)
│   ├── app/
│   │   ├── main.py                   Entry point + CORS config
│   │   ├── config.py                 Settings desde .env
│   │   ├── database.py               SQLAlchemy engine (DATABASE_URL)
│   │   ├── auth/
│   │   │   ├── supabase_jwt.py       Verificación JWT de Supabase
│   │   │   └── dependencies.py       get_current_user (FastAPI dep.)
│   │   ├── models/                   ORM tables (sin User — Supabase lo maneja)
│   │   │   ├── __init__.py
│   │   │   ├── tech_profile.py       Perfil profesional del técnico
│   │   │   ├── service_request.py    Solicitudes de servicio
│   │   │   ├── request_image.py      Fotos adjuntas a solicitudes
│   │   │   ├── proposal.py           Propuestas de técnicos
│   │   │   ├── availability.py       Bloques de disponibilidad
│   │   │   ├── service.py            Servicios activos/historial
│   │   │   └── review.py             Reseñas y calificaciones
│   │   ├── schemas/                  Pydantic (request/response)
│   │   │   ├── tech_profile.py
│   │   │   ├── service_request.py
│   │   │   ├── proposal.py
│   │   │   ├── availability.py
│   │   │   ├── service.py
│   │   │   └── review.py
│   │   └── routers/                  Endpoints REST
│   │       ├── auth_profile.py       POST /auth/profile (sync post-signup)
│   │       ├── techs.py              Perfiles técnicos + documentos
│   │       ├── requests.py           Solicitudes CRUD
│   │       ├── proposals.py          Propuestas CRUD + accept/reject
│   │       ├── availability.py       Bloques disponibilidad CRUD
│   │       ├── services.py           Servicios activos + historial
│   │       └── reviews.py            Reseñas
│   ├── alembic/                      Migraciones BD
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── .env                          Variables de entorno (local)
│   └── .env.example
│
├── frontend/ (= actual src/ + raíz Vite)  [REORGANIZE → deploy a Vercel]
│   ├── src/
│   │   ├── api/                      [NEW] Capa HTTP client
│   │   │   ├── client.ts             axios config + interceptor JWT
│   │   │   ├── auth.ts               profile sync post-signup
│   │   │   ├── techs.ts
│   │   │   ├── requests.ts
│   │   │   ├── proposals.ts
│   │   │   ├── availability.ts
│   │   │   ├── services.ts
│   │   │   └── reviews.ts
│   │   ├── store/                    [NEW] Context API
│   │   │   ├── AuthContext.tsx        Supabase session + user role
│   │   │   └── AppContext.tsx         Estado global
│   │   ├── lib/
│   │   │   ├── supabase.ts           [KEEP] cliente Supabase
│   │   │   └── storage.ts            [NEW] helpers Supabase Storage
│   │   ├── pages/                    [NEW] Páginas por ruta
│   │   ├── components/               [REWRITE] Componentes UI
│   │   ├── types/                    [REWRITE] Tipos TypeScript
│   │   ├── hooks/                    [NEW] Custom hooks
│   │   ├── App.tsx                   [REWRITE] Router + Auth guard
│   │   ├── main.tsx                  Entry point
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts                [MODIFY] proxy /api → backend
│   ├── tsconfig.json
│   └── .env                          VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
│
└── README.md
```

---

## BACKEND — Variables de Entorno

### `backend/.env.example`
```env
# Base de Datos
DATABASE_URL=postgresql://usuario@localhost:5432/proyectocustomer
# En producción → STRING de Supabase (sección Connect → SQLAlchemy)

# Supabase (para verificar JWTs)
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
# Se obtiene en: Supabase Dashboard → Settings → API → JWT Secret

# CORS
FRONTEND_URL=http://localhost:5173
# En producción → https://tu-app.vercel.app

# Uploads locales (solo dev)
UPLOAD_DIR=./uploads
```

---

## BACKEND — Modelos SQLAlchemy

> ⚠️ **Supabase gestiona la tabla `auth.users`**. Nuestros modelos referencian el UUID de Supabase como `user_id` (tipo UUID, FK lógico — no FK de BD cross-schema).

### `tech_profiles` (RF-03, RF-04, RF-05, RF-06)
```
user_id          UUID PK (= Supabase auth user UUID)
specialty        VARCHAR
experience_years INTEGER
description      TEXT
photo_url        TEXT (URL Supabase Storage)
dni_front_url    TEXT
dni_back_url     TEXT
cert_url         TEXT
verification_status  ENUM: pending | verified | rejected
rating_avg       DECIMAL(3,2) default 0
reviews_count    INTEGER default 0
created_at       TIMESTAMP
```

### `service_requests` (RF-08, RF-09, RF-11)
```
id              UUID PK
client_id       UUID (Supabase user)
title           VARCHAR
category        VARCHAR  (plumbing|electrical|hvac|gas|appliances|painting|...)
description     TEXT
address         VARCHAR
status          ENUM: open | closed | cancelled
created_at      TIMESTAMP
```

### `request_images` (RF-09)
```
id          UUID PK
request_id  UUID FK → service_requests
image_url   TEXT (URL Supabase Storage)
```

### `proposals` (RF-12, RF-13, RF-17)
```
id              UUID PK
request_id      UUID FK → service_requests
tech_id         UUID (Supabase user)
price           DECIMAL(10,2)
estimated_time  VARCHAR  (ej. "3 horas")
observations    TEXT
status          ENUM: sent | accepted | rejected
created_at      TIMESTAMP
```

### `availability_blocks` (RF-XX1, RF-XX2, RF-XX6)
```
id          UUID PK
tech_id     UUID (Supabase user)
day_label   VARCHAR  (ej. "Lunes", "2026-06-21")
start_time  TIME
end_time    TIME
status      ENUM: available | booked
created_at  TIMESTAMP
```

### `services` (RF-18, RF-19, RF-20, RF-XX5, RF-XX8)
```
id                  UUID PK
proposal_id         UUID FK → proposals
request_id          UUID FK → service_requests
tech_id             UUID (Supabase user)
client_id           UUID (Supabase user)
status              ENUM: scheduled | in_progress | completed | cancelled
scheduled_block_id  UUID FK → availability_blocks (nullable)
scheduled_start     TIMESTAMP
scheduled_end       TIMESTAMP
created_at          TIMESTAMP
```

### `reviews` (RF-22, RF-23, RF-24)
```
id          UUID PK
service_id  UUID FK → services
client_id   UUID (Supabase user)
tech_id     UUID (Supabase user)
rating      INTEGER CHECK(1-5)
comment     TEXT
created_at  TIMESTAMP
```

---

## BACKEND — Endpoints REST (FastAPI)

### Auth/Profile Sync
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | `/api/auth/sync-profile` | Sincroniza perfil post-signup (crea TechProfile si rol=tech) | Autenticado |
| GET | `/api/auth/me` | Info del usuario actual desde JWT | Autenticado |

### Técnicos (RF-04, RF-07, RF-24, RF-29, RF-30)
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/api/techs/` | Listar técnicos verificados | Público |
| GET | `/api/techs/{id}` | Perfil público del técnico + reseñas | Público |
| GET | `/api/techs/me/profile` | Mi perfil técnico | Tech |
| PUT | `/api/techs/me/profile` | Actualizar mi perfil técnico | Tech |
| POST | `/api/techs/me/documents` | Subir URLs de DNI/cert (ya subidos a Supabase Storage) | Tech |
| GET | `/api/techs/me/verification-status` | Estado de verificación | Tech |

### Solicitudes (RF-08, RF-10, RF-11, RF-27, RF-28)
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | `/api/requests/` | Crear solicitud | Client |
| GET | `/api/requests/` | Mis solicitudes | Client |
| GET | `/api/requests/available` | Solicitudes abiertas (filtradas por specialty) | Tech |
| GET | `/api/requests/{id}` | Detalle de solicitud | Client/Tech |
| PUT | `/api/requests/{id}/cancel` | Cancelar solicitud | Client |
| POST | `/api/requests/{id}/images` | Agregar URLs de fotos | Client |

### Propuestas (RF-12 a RF-17, RF-XX3, RF-XX4, RF-XX5)
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | `/api/proposals/` | Enviar propuesta | Tech |
| GET | `/api/proposals/request/{req_id}` | Ver propuestas de una solicitud | Client |
| GET | `/api/proposals/my` | Mis propuestas enviadas | Tech |
| PUT | `/api/proposals/{id}/accept` | Aceptar propuesta + seleccionar bloque → crea Service | Client |
| PUT | `/api/proposals/{id}/reject` | Rechazar propuesta | Client |

### Disponibilidad (RF-XX1, RF-XX2, RF-XX6, RF-XX7)
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/api/availability/` | Mis bloques | Tech |
| POST | `/api/availability/` | Crear bloque | Tech |
| PUT | `/api/availability/{id}` | Modificar bloque | Tech |
| DELETE | `/api/availability/{id}` | Eliminar bloque (solo si available) | Tech |
| GET | `/api/availability/tech/{tech_id}` | Bloques disponibles de un técnico | Client |

### Servicios (RF-18, RF-19, RF-20, RF-25, RF-26)
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/api/services/` | Servicios activos propios | Client/Tech |
| GET | `/api/services/{id}` | Detalle de servicio | Client/Tech |
| PUT | `/api/services/{id}/status` | Actualizar estado | Client/Tech |
| GET | `/api/services/history` | Historial completados/cancelados | Client/Tech |

### Reseñas (RF-22, RF-23, RF-24)
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | `/api/reviews/` | Calificar servicio finalizado | Client |
| GET | `/api/reviews/tech/{tech_id}` | Reseñas de un técnico | Público |

---

## FRONTEND — Variables de Entorno

### `frontend/.env.example`
```env
# Supabase (Auth + Storage)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Backend FastAPI
VITE_API_URL=http://localhost:8000
# En producción → https://tu-backend.onrender.com
```

---

## FRONTEND — Páginas (diseños Stitch)

| Página | Ruta | Diseño de referencia | Auth |
|--------|------|----------------------|------|
| `AuthPage` | `/` o `/auth` | Acceso y Registro (split-screen, toggle client/tech) | Público |
| `ClientDashboard` | `/dashboard` | Panel de Control - Cliente | Client |
| `CreateRequestPage` | `/requests/new` | Solicitud de Servicio (4 pasos) | Client |
| `RequestDetailPage` | `/requests/:id` | Detalle de Solicitud + Propuestas (con selector horario) | Client |
| `ClientServicePage` | `/services/:id` | Servicio Activo - Cliente | Client |
| `ReviewPage` | `/services/:id/review` | Calificar Servicio Finalizado | Client |
| `ClientProfilePage` | `/profile` | Gestión de Perfil - Cliente | Client |
| `TechDashboard` | `/tech/dashboard` | TécnicoConfianza (bolsa de trabajos) | Tech |
| `TechJobDetailPage` | `/tech/jobs/:id` | Enviar Propuesta + Disponibilidad | Tech |
| `TechServicePage` | `/tech/services/:id` | Gestión de Servicio Activo - Técnico | Tech |
| `AvailabilityPage` | `/tech/availability` | Gestión de Disponibilidad - Técnico | Tech |
| `TechProfilePage` | `/tech/profile` | Gestión de Perfil Técnico + Verificación | Tech |
| `TechPublicProfile` | `/techs/:id` | Perfil Público del Técnico con Reseñas | Público |
| `HistoryPage` | `/history` | Historial (integrado en dashboard) | Client/Tech |

---

## FRONTEND — Componentes Clave

- **`TopNavBar`** — con sesión Supabase, avatar, role badge
- **`AuthGuard`** — redirige a `/auth` si no hay sesión; redirige según rol post-login
- **`ProposalCard`** — muestra propuesta con selector de bloques de horario (RF-XX4)
- **`AvailabilityBlockManager`** — CRUD inline de bloques (RF-XX1/XX2)
- **`FileUploadZone`** — drag & drop → sube a Supabase Storage → retorna URL
- **`ServiceStatusStepper`** — barra de progreso del estado del servicio
- **`StarRatingInput`** — estrellas interactivas para calificar
- **`TechVerificationBadge`** — ícono de escudo/check de verificado
- **`CategoryGrid`** — grid de categorías estilo Stitch (radio buttons visuales)
- **`RequestCard`** — tarjeta de solicitud en dashboards

---

## Lógica Anti-Conflictos de Horario (RF-XX6, RF-XX7)

```
Cliente acepta propuesta (PUT /api/proposals/{id}/accept)
  Body: { selected_block_id: UUID }
    ↓
Backend — Transacción atómica:
  1. SELECT * FROM availability_blocks WHERE id=? AND status='available' FOR UPDATE
     ├── Si status='booked' → HTTP 409 "Este horario ya fue reservado, selecciona otro"
     └── Si status='available':
  2. UPDATE availability_blocks SET status='booked' WHERE id=?
  3. INSERT INTO services (scheduled_block_id, scheduled_start, scheduled_end, status='scheduled', ...)
  4. UPDATE proposals SET status='accepted' WHERE id=?
  5. UPDATE proposals SET status='rejected' WHERE request_id=? AND id != ? AND status='sent'
  6. UPDATE service_requests SET status='closed' WHERE id=?
  COMMIT
    ↓
Frontend recibe:
  - 200 OK → navega a /services/:id
  - 409 Conflict → muestra error en UI, pide reseleccionar bloque
```

---

## Despliegue

### Frontend → Vercel
```
Root Directory: frontend/
Build Command:  npm run build
Output:         dist/
Env vars:       VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
```

### Backend → Render
```
Root Directory: backend/
Runtime:        Python
Build Command:  pip install -r requirements.txt && alembic upgrade head
Start Command:  uvicorn app.main:app --host 0.0.0.0 --port $PORT
Env vars:       DATABASE_URL, SUPABASE_JWT_SECRET, FRONTEND_URL
```

### Base de Datos → Supabase PostgreSQL
- Alembic corre las migraciones contra `DATABASE_URL` de Supabase
- Supabase gestiona `auth.users` (Auth built-in)
- Nuestras tablas de negocio viven en el schema `public`

---

## Orden de Implementación

### Fase 1 — Backend Base
1. Estructura de proyecto FastAPI + configuración
2. Conexión DB + modelos SQLAlchemy + migraciones Alembic
3. Middleware de verificación JWT Supabase
4. Router `auth_profile` (sync post-signup)

### Fase 2 — Módulos de Negocio Backend
5. Router `techs` (perfil + documentos + verificación)
6. Router `requests` (CRUD + imágenes)
7. Router `proposals` (CRUD + accept/reject con anti-conflictos)
8. Router `availability` (CRUD + validaciones)
9. Router `services` (estados + historial)
10. Router `reviews` (calificación + reputación)

### Fase 3 — Frontend Base
11. Reorganizar carpetas (frontend/ estructura)
12. Supabase client + Auth Context
13. API client (axios + interceptor JWT)
14. Router + AuthGuard
15. Componentes compartidos (TopNavBar, Footer, etc.)

### Fase 4 — Páginas (por flujo completo)
16. AuthPage (login/registro, fiel a Stitch)
17. ClientDashboard
18. CreateRequestPage
19. RequestDetailPage (+ ProposalCard con horarios)
20. TechDashboard
21. TechJobDetailPage (+ disponibilidad)
22. AvailabilityPage
23. ActiveService pages (client + tech)
24. ReviewPage
25. Profile pages (client + tech)
26. TechPublicProfile

### Fase 5 — Integración y Despliegue
27. CORS + env vars para producción
28. Build Vercel + Render
29. Alembic migrate en Supabase PostgreSQL

---

## Verification Plan

### Flujo End-to-End
1. Registro de cliente (Supabase Auth) → sync-profile → dashboard cliente
2. Registro de técnico → carga DNI a Supabase Storage → envía URL al backend
3. Cliente crea solicitud con fotos (Supabase Storage) → aparece en bolsa del técnico
4. Técnico define bloques de disponibilidad
5. Técnico envía propuesta (cliente ve disponibilidad del técnico)
6. Cliente acepta propuesta + selecciona bloque → bloque queda como `booked`
7. Segundo cliente intenta el mismo bloque → recibe 409
8. Técnico actualiza: Programado → En Proceso → Finalizado
9. Cliente califica → rating_avg del técnico se actualiza
