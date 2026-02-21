Proyecto RMM — Front + Backend

Resumen rapido
- Frontend React + Vite en `frontend/`
- Backend Express + PostgreSQL en `backend/`
- Migraciones SQL en `backend/migrations/`
- Carga de fotos con almacenamiento local (o Cloudinary/S3)

Estructura principal
- `frontend/` UI React (Vite)
- `backend/` API Express
- `backend/migrations/` SQL de base de datos
- `backend/uploads/` archivos locales (si STORAGE_PROVIDER=local)

Inicio rapido
1) Configurar entorno
```bash
cd backend
copy .env.example .env
```
Editar `backend/.env` con `DATABASE_URL`, `JWT_SECRET` y `STORAGE_PROVIDER`.

2) Instalar dependencias
```bash
cd backend
npm install
cd ..\frontend
npm install
```

3) Crear base de datos
```sql
CREATE DATABASE rmm_db;
```

4) Ejecutar migraciones
```bash
cd backend
npm run migrate
```

5) Crear admin
```bash
npm run setup
```

6) Levantar servidores
```bash
cd backend
npm run start
```
```bash
cd frontend
npm run dev
```

Puertos por defecto
- Frontend: http://localhost:5173 (si esta ocupado, Vite usa 5174)
- Backend: http://localhost:4000

Migraciones
Orden de ejecucion (se ejecutan por nombre):
- `001_create_tables.sql` tablas base
- `002_add_user_profile_fields.sql` campos de perfil
- `003_create_supervisor_calendar.sql` calendario y tareas
- `004_create_roles_and_permissions.sql` roles/permisos
- `005_create_user_permissions.sql` permisos por usuario
- `006_add_status_to_reports.sql` status y updated_at en reportes

Almacenamiento de fotos
- Local (dev): `STORAGE_PROVIDER=local` y accesibles en `http://localhost:4000/uploads/<archivo>`
- Cloudinary: `STORAGE_PROVIDER=cloudinary` y `CLOUDINARY_URL` valido
- S3: `STORAGE_PROVIDER=s3` y credenciales AWS

Notas
- El backend sirve el build de frontend si existe `frontend/dist`
- La API usa `Authorization: Bearer <token>`
