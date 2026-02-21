# Sistema de Gestión de Proyectos RMM

Sistema web completo para la gestión de proyectos de construcción, permitiendo el seguimiento diario de obras, reportes fotográficos, asignación de personal y administración de tareas.

## Características Principales

- **Gestión de Proyectos**: Creación, asignación y seguimiento de proyectos de construcción
- **Reportes Diarios**: Supervisores pueden crear reportes con evidencia fotográfica
- **Roles y Permisos**: Sistema de autenticación con roles (Admin, Supervisor, Usuario)
- **Dashboard Administrativo**: Panel de control con estadísticas y gestión de usuarios
- **Calendario de Tareas**: Asignación y seguimiento de tareas por supervisor
- **Almacenamiento Flexible**: Soporte para almacenamiento local, Cloudinary y AWS S3
- **Búsqueda y Filtros**: Búsqueda avanzada de proyectos por nombre, estado y progreso

##  Stack Tecnológico

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool y desarrollo rápido
- **Tailwind CSS** - Framework de estilos
- **Axios** - Cliente HTTP

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación
- **Multer** - Carga de archivos

##  Estructura del Proyecto

```
ProyectoRmm/
├── backend/
│   ├── migrations/         # Migraciones SQL
│   ├── routes/             # Endpoints API
│   ├── middleware/         # Auth y validación
│   ├── storage/            # Proveedores de almacenamiento
│   ├── db/                 # Conexión a base de datos
│   ├── uploads/            # Archivos locales (desarrollo)
│   └── server.js           # Servidor principal
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── api.js          # Cliente API
│   │   └── main.jsx        # Entry point
│   └── public/             # Assets estáticos
└── setup.ps1               # Script de instalación automática
```

##  Instalación y Configuración

### Requisitos Previos
- Node.js 18 o superior
- PostgreSQL 12 o superior
- npm o yarn

### Opción 1: Instalación Automática (Windows)

```powershell
.\setup.ps1
```

Este script instala dependencias automáticamente y configura el entorno inicial.

### Opción 2: Instalación Manual

#### 1. Clonar el repositorio
```bash
git clone https://github.com/EmiltonMenaA/PROYECTOS-RMM.git
cd ProyectoRmm
```

#### 2. Configurar Backend
```bash
cd backend
npm install
copy .env.example .env
```

Editar `backend/.env` con la configuración de tu entorno:
```env
DATABASE_URL=postgresql://tu_usuario:tu_password@localhost:5432/rmm_db
JWT_SECRET=tu_secreto_jwt_seguro
PORT=4000
STORAGE_PROVIDER=local
```

#### 3. Configurar Frontend
```bash
cd ../frontend
npm install
```

#### 4. Crear Base de Datos
```sql
CREATE DATABASE rmm_db;
```

#### 5. Ejecutar Migraciones
```bash
cd ../backend
npm run migrate
```

#### 6. Crear Usuario Administrador
```bash
npm run setup
```
Sigue las instrucciones para crear el usuario admin inicial.

#### 7. Iniciar Servidores

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

##  Acceso a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Credenciales iniciales**: Las que configuraste en el paso de setup

## 📊 Migraciones de Base de Datos

Las migraciones se ejecutan automáticamente en orden:

| Migración | Descripción |
|-----------|-------------|
| `001_create_tables.sql` | Tablas base (usuarios, proyectos, reportes) |
| `002_add_user_profile_fields.sql` | Campos de perfil de usuario |
| `003_create_supervisor_calendar.sql` | Sistema de calendario y tareas |
| `004_create_roles_and_permissions.sql` | Sistema de roles y permisos |
| `005_create_user_permissions.sql` | Permisos específicos por usuario |
| `006_add_status_to_reports.sql` | Estados y timestamps en reportes |

Para más detalles, consulta [MIGRACIONES.md](MIGRACIONES.md).

##  Almacenamiento de Archivos

El sistema soporta tres proveedores de almacenamiento:

### Local (Desarrollo)
```env
STORAGE_PROVIDER=local
```
Archivos guardados en `backend/uploads/` y accesibles en `http://localhost:4000/uploads/`

### Cloudinary
```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### AWS S3
```env
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_S3_BUCKET=tu_bucket
```

##  Autenticación

La API utiliza JWT Bearer tokens:

```javascript
Authorization: Bearer <tu_token>
```

Los tokens se almacenan en `localStorage` del navegador tras el login exitoso.

##  Documentación Adicional

- **[GUIA_RAPIDA.md](GUIA_RAPIDA.md)** - Guía rápida de uso
- **[INSTRUCCIONES_EJECUCION.md](INSTRUCCIONES_EJECUCION.md)** - Pasos detallados de ejecución
- **[MIGRACIONES.md](MIGRACIONES.md)** - Documentación de migraciones SQL

##  Scripts Disponibles

### Backend
```bash
npm run dev          # Servidor desarrollo con nodemon
npm start            # Servidor producción
npm run migrate      # Ejecutar migraciones
npm run setup        # Crear usuario admin
```

### Frontend
```bash
npm run dev          # Servidor desarrollo
npm run build        # Build producción
npm run preview      # Preview build
```

##  Solución de Problemas

### Puerto 4000 ocupado
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Error de conexión PostgreSQL
Verifica que PostgreSQL esté corriendo y las credenciales en `.env` sean correctas.

### Errores de migración
Ejecuta las migraciones manualmente en orden desde `backend/migrations/`.

##  Flujo de Trabajo Git

```bash
git add .
git commit -m "Descripción del cambio"
git push origin main
```

##  Equipo de Desarrollo

Este proyecto fue desarrollado por:

- **Emilton Mena** - Desarrollo Full Stack
- **Mariana Hincapié Henao** - Desarrollo Full Stack
- **Geronimo Montes Acebedo** - Desarrollo Full Stack

##  Licencia y Derechos de Autor

© 2025 Emilton Mena, Mariana Hincapié Henao, Geronimo Montes Acebedo

Todos los derechos reservados. Este proyecto fue desarrollado como parte del Sprint 1 para el sistema de gestión de proyectos RMM.

---

**Repositorio**: [https://github.com/EmiltonMenaA/PROYECTOS-RMM](https://github.com/EmiltonMenaA/PROYECTOS-RMM)
