# RMM — Ejecución Rápida

## Opción 1: Automática (Recomendado)

Desde PowerShell en la carpeta raíz `ProyectoRmm`:

```powershell
# Permite scripts (si es necesario)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ejecuta el script que instala todo y arranca los servidores
.\run-all.ps1
```

Esto:
1. Instala dependencias backend + frontend
2. Ejecuta migraciones (todas las SQL en backend/migrations)
3. Ejecuta setup (crea usuario admin)
4. Arranca backend (puerto 4000) y frontend (puerto 5173 o 5174) en dos ventanas PowerShell

## Opción 2: Manual (Paso a Paso)

### Backend
```powershell
cd backend

# Instalar dependencias
npm install

# Migrar BD (asegúrate de que DATABASE_URL en .env es correcto)
npm run migrate

# Setup (crea admin user)
npm run setup

# Iniciar servidor
npm run start
```
Salida esperada: `RMM backend running on port 4000`

### Frontend (en otra terminal PowerShell)
```powershell
cd frontend

# Instalar dependencias
npm install

# Iniciar dev server
npm run dev
```
Abre: http://localhost:5173

## Configuración

### Backend `.env`
Asegúrate de que `backend/.env` tiene:
```
DATABASE_URL=postgresql://usuario:password@localhost:5432/rmm_db
JWT_SECRET=tu-clave-secreta-aqui
PORT=4000
STORAGE_PROVIDER=local
```

Si no existe `.env`, cópialo desde `.env.example`:
```powershell
cd backend
copy .env.example .env
# Edita .env con tus credenciales
```

## Credenciales Iniciales

**Admin creado por `setup.js`:**
- Usuario: `admin`
- Contraseña: `Admin123!`

⚠️ **Cambia esta contraseña en producción:**
```sql
UPDATE users SET password_hash = ... WHERE username = 'admin';
```

## Pruebas

### Login
1. http://localhost:5173 → redirige a `/login`
2. Ingresa: `admin` / `Admin123!`
3. Serás redirigido a `/admin` (panel administrativo)

### Crear Usuario
- En panel admin (`/admin`), rellena el formulario y crea usuarios

### Desactivar Usuario
- Usa el endpoint REST directamente o futuro formulario en admin panel:
```bash
curl -X PATCH http://localhost:4000/api/auth/123/active \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"active": false}'
```

### Verificar Desactivación
- Login con usuario desactivado → devuelve error 403 "Account is deactivated"

## Rutas Principales

| Ruta | Descripción |
|------|-------------|
| `http://localhost:5173/login` | Login (publico) |
| `http://localhost:5173/register` | Registro (publico) |
| `http://localhost:5173/dashboard` | Dashboard usuario (protegido) |
| `http://localhost:5173/admin` | Panel admin (protegido, solo admin) |
| `http://localhost:4000/api/auth/login` | POST — login |
| `http://localhost:4000/api/auth/register` | POST — registrar |
| `http://localhost:4000/api/auth/:id/active` | PATCH — activar/desactivar (admin) |

## Solucionar Problemas

### npm install falla
- Verifica Node.js: `node --version` (debe ser v14+)
- Si aún falla, intenta: `npm cache clean --force` y reintentar

### Backend no conecta a BD
- Verifica que PostgreSQL está corriendo
- Verifica `DATABASE_URL` en `.env` (usuario, password, host, puerto, nombre de BD)
- Asegúrate de que la BD existe: `psql -c "CREATE DATABASE rmm_db;"`

### Puerto 4000 o 5173 en uso
- Cambia en `backend/.env`: `PORT=5000` (ej)
- O mata el proceso que lo usa: `netstat -ano | findstr :4000` (Windows)

### Fotos no se ven
- En local: usa `STORAGE_PROVIDER=local` y las fotos quedan en `/uploads`.
- URL de ejemplo: `http://localhost:4000/uploads/<archivo>`

### "vite" no reconocido
- Ejecuta: `npx vite` en lugar de `npm run dev`
- O: `npm exec vite`

## Próximos Pasos

- Implementar paneles de proyectos, reportes, evidencia
- Conectar almacenamiento S3 / Cloudinary
- Tests unitarios (Jest, Vitest)
- Deployment (Vercel, Heroku, Docker)
