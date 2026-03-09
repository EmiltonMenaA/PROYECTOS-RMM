# Proyecto RMM — Guía de Ejecución

## Requisitos

- **Node.js** (v14+) — [Descargar](https://nodejs.org)
- **PostgreSQL** (v12+) — [Descargar](https://www.postgresql.org/download)
- **Git** (opcional)

## Instalación y Configuración

### 1. Clonar o descargar el proyecto

```powershell
cd 'C:\Users\aceve\Downloads\Proyecto RMM\ProyectoRmm'
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` en la carpeta `backend/`:

```powershell
cd backend
copy .env.example .env
```

Edita `backend/.env` con tus credenciales:

```plaintext
DATABASE_URL=postgresql://tu_usuario:tu_password@localhost:5432/rmm_db
JWT_SECRET=tu-clave-secreta-aqui-cambiar-en-produccion
PORT=4000
```

### 3. Crear base de datos (PostgreSQL)

```sql
-- Desde psql o pgAdmin
CREATE DATABASE rmm_db;
```

### 4. Instalar dependencias del backend

```powershell
cd backend
npm install
```

### 5. Ejecutar migraciones (crear tablas)

```powershell
# Desde la carpeta backend
cd backend
npm run migrate
```

Esto ejecuta todas las migraciones en orden:
- 001_create_tables.sql
- 002_add_user_profile_fields.sql
- 003_create_supervisor_calendar.sql
- 004_create_roles_and_permissions.sql
- 005_create_user_permissions.sql
- 006_add_status_to_reports.sql

### 6. Ejecutar setup (crear admin, añadir columnas)

```powershell
cd backend
node setup.js
```

**Salida esperada:**
```
🔧 RMM Backend Setup
====================

Step 1: Checking users table...
✓ Column is_active exists (or created)

Step 2: Checking for admin user...
Creating admin user "admin"...
✓ Admin created: { id: 1, username: 'admin', role: 'admin' }
  Username: admin
  Password: Admin123!
    CHANGE THIS PASSWORD IN PRODUCTION!

✓ Setup complete!
```

### 7. Arrancar el servidor backend

```powershell
npm run start
# o para desarrollo (reinicia automáticamente al guardar):
npm run dev
```

**Salida esperada:**
```
RMM backend running on port 4000
```

## Pruebas

### Abrir frontend

```
http://localhost:5173/login
http://localhost:5173/register
```

### Pruebas de API (PowerShell o Postman)

**1. Registrar usuario:**
```powershell
$body = @{
  username = "jdoe"
  password = "Secret123"
  role = "user"
  full_name = "John Doe"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**2. Login:**
```powershell
$body = @{
  username = "jdoe"
  password = "Secret123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$response.Content | ConvertFrom-Json
# Guarda el token para próximas peticiones
```

**3. Desactivar usuario (admin only):**
```powershell
# Primero login como admin para obtener token
$adminLogin = @{
  username = "admin"
  password = "Admin123!"
} | ConvertTo-Json

$adminResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $adminLogin

$token = ($adminResponse.Content | ConvertFrom-Json).token

# Ahora desactivar usuario (id=2, por ejemplo)
$deactivateBody = @{
  active = $false
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/auth/2/active" `
  -Method PATCH `
  -ContentType "application/json" `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Body $deactivateBody
```

**4. Intentar login con usuario desactivado (debe fallar):**
```powershell
$body = @{
  username = "jdoe"
  password = "Secret123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
# Respuesta: 403 "Account is deactivated"
```

## Endpoints API

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/health` | Verificar salud del servidor | - |
| POST | `/api/auth/register` | Registrar usuario | - |
| POST | `/api/auth/login` | Login y obtener JWT | - |
| PATCH | `/api/auth/:id/active` | Activar/desactivar usuario | Admin |
| GET | `/api/projects` | Listar proyectos | Auth |
| GET | `/api/reports` | Listar reportes | Auth |
| POST | `/api/reports` | Crear reporte con fotos | Auth |
| GET | `/api/evidence/report/:id` | Fotos de un reporte | Auth |

## Estructura de carpetas

```
backend/
  ├── server.js              (servidor principal)
  ├── setup.js               (script de configuración)
  ├── migrate.js             (ejecuta migraciones)
  ├── migrations/            (archivos SQL)
  ├── db/
  │   └── index.js           (conexión PostgreSQL)
  ├── routes/
  │   ├── auth.js            (login, register, activar/desactivar)
  │   ├── projects.js
  │   ├── reports.js
  │   └── evidence.js
  │   └── evidence.js
  ├── middleware/
  │   └── auth.js            (JWT requierung)
  ├── migrations/
  │   └── 001_create_tables.sql
  ├── package.json
  ├── .env.example
  └── .env                   (no incluir en git)

frontend/
  ├── public/
  │   ├── index.html         (página principal)
  │   ├── login.html         (login)
  │   └── ...otras páginas
  └── src/
      ├── App.jsx
      └── ...

```

## Solución de problemas

### npm no se reconoce
- Verifica que Node.js está instalado: `node --version`
- Si no aparece, reinstala Node.js desde https://nodejs.org

### Error: "DATABASE_URL not found"
- Crea un archivo `.env` en la carpeta `backend/`
- Cópialo desde `.env.example`
- Configura `DATABASE_URL` con tu cadena de conexión PostgreSQL

### Error: "ECONNREFUSED" en login test
- Verifica que PostgreSQL está corriendo
- Verifica que `DATABASE_URL` en `.env` es correcto

### Puerto 4000 ya en uso
- Cambia `PORT=4000` en `.env` a otro puerto (ej: `PORT=5000`)
- Luego accede a `http://localhost:5000`

