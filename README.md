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

##  Migraciones de Base de Datos

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
- **[GIT_WORKFLOW.md](GIT_WORKFLOW.md)** - Estrategia de ramas, proceso de pull request y política de revisión
- **[ESTANDARES_NOMBRAMIENTO.md](ESTANDARES_NOMBRAMIENTO.md)** - Estándares de nombramiento y convenciones
- **[ANALISIS_ESTATICO.md](ANALISIS_ESTATICO.md)** - Análisis estático de código y estándares
- **[CONFIGURACION_COMPLETADA.md](CONFIGURACION_COMPLETADA.md)** -  Guía de uso del formateo automático

##  Calidad de Código

El proyecto utiliza **ESLint** y **Prettier** para mantener estándares de código consistentes.

###  Extensiones de VS Code Instaladas:
- **ESLint**: Validación de código en tiempo real
- **Prettier**: Formateo automático al guardar (Ctrl+S)

**El código se formatea automáticamente cuando guardas archivos.** Ver [CONFIGURACION_COMPLETADA.md](CONFIGURACION_COMPLETADA.md) para más detalles.

```bash
# Verificar todo el código
.\verify-code.ps1

# Backend - verificar y corregir
cd backend
npm run lint              # Verificar con ESLint
npm run lint:fix          # Corregir automáticamente
npm run format            # Formatear con Prettier
npm run code:check        # Verificación completa

# Frontend - verificar y corregir
cd frontend
npm run lint              # Verificar con ESLint
npm run lint:fix          # Corregir automáticamente
npm run format            # Formatear con Prettier
npm run code:check        # Verificación completa
```

**Recomendación**: Instala las extensiones de VS Code para ESLint y Prettier para formateo automático al guardar.

Para más detalles, consulta [ANALISIS_ESTATICO.md](ANALISIS_ESTATICO.md).

##  Scripts Disponibles

### Backend
```bash
npm run dev          # Servidor desarrollo con nodemon
npm start            # Servidor producción
npm run migrate      # Ejecutar migraciones
npm run setup        # Crear usuario admin
npm run lint         # Verificar código con ESLint
npm run lint:fix     # Corregir problemas de ESLint
npm run format       # Formatear código con Prettier
npm run code:check   # Verificación completa (lint + format)
```

### Frontend
```bash
npm run dev          # Servidor desarrollo
npm run build        # Build producción
npm run preview      # Preview build
npm run lint         # Verificar código con ESLint
npm run lint:fix     # Corregir problemas de ESLint
npm run format       # Formatear código con Prettier
npm run code:check   # Verificación completa (lint + format)
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

Este proyecto utiliza **GitHub Flow** con `main` como rama protegida.

Resumen operativo:

1. Crear rama desde `main` (`feature/*`, `fix/*`, `chore/*`).
2. Desarrollar cambios y validar localmente.
3. Abrir pull request hacia `main`.
4. Esperar CI en estado exitoso (`Quality Checks` y `Security Checks`).
5. Obtener al menos una aprobación de revisión.
6. Realizar merge.

Para la política completa de ramas y configuración de protección de `main`, consultar [GIT_WORKFLOW.md](GIT_WORKFLOW.md).

```bash
git add .
git commit -m "Descripción del cambio"
git push origin <tu-rama>
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
