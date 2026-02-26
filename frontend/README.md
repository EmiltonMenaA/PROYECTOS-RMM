# Frontend RMM — React + Vite + Tailwind CSS

Frontend moderno con React para Proyectos RMM. Conectado al backend Node.js/Express vía API REST.

## Características

- ✨ **React 18** con hooks y React Router
- ⚡ **Vite** para desarrollo rápido y builds optimizados
- 🎨 **Tailwind CSS** para estilos responsivos
- 🔐 **Autenticación JWT** — login, registro, tokens en localStorage
- 👤 **Panel de Usuario** — dashboard básico
- 👨‍💼 **Panel Administrativo** — crear usuarios, activar/desactivar
- 🔄 **Intercepción de Axios** — agrega JWT automáticamente a requests

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar .env (opcional)

Crea un archivo `.env.local` si necesitas cambiar el URL del backend:

```plaintext
VITE_API_URL=http://localhost:4000/api
```

Por defecto, usa `http://localhost:4000/api`.

## Desarrollo

```bash
npm run dev
```

Abre http://localhost:5173

**Nota:** El servidor Vite tiene un proxy configurado para `/api` que apunta a `http://localhost:4000`.

## Build para Producción

```bash
npm run build
```

Los archivos compilados quedarán en `dist/`. El backend servirá automáticamente desde ahí.

## Estructura de Carpetas

```
src/
├── components/
│   ├── Login.jsx            (formulario de login)
│   ├── Register.jsx         (crear cuenta)
│   ├── Dashboard.jsx        (panel usuario regular)
│   ├── AdminDashboard.jsx   (panel admin — crear/gestionar usuarios)
│   ├── ProtectedRoute.jsx   (wrapper para rutas privadas)
│   └── ApiDemo.jsx          (demo histórico)
├── api.js                   (servicio axios con interceptores)
├── App.jsx                  (enrutador y contexto de auth)
├── App.css                  (imports de Tailwind)
└── main.jsx                 (punto de entrada)
```

## Rutas

| Ruta         | Descripción   | Requerido    |
| ------------ | ------------- | ------------ |
| `/login`     | Login         | -            |
| `/register`  | Crear cuenta  | -            |
| `/dashboard` | Panel usuario | Auth (user)  |
| `/admin`     | Panel admin   | Auth (admin) |

## API y Autenticación

El servicio `api.js` gestiona:

- **POST /auth/register** — crear usuario
- **POST /auth/login** — login y obtén JWT
- **PATCH /auth/:id/active** — activar/desactivar (admin)

Los tokens JWT se guardan en `localStorage` y se envían automáticamente en el header `Authorization: Bearer <token>`.

## Scripts

```bash
npm run dev        # Iniciar servidor de desarrollo
npm run build      # Compilar para producción
npm run preview    # Vista previa de producción
```

## Notas

- Las contraseñas deben tener al menos 6 caracteres
- Al crear usuario sin especificar `role`, es `user` por defecto
- Solo usuarios con `role: admin` pueden acceder a `/admin`
- Al logout, se limpian tokens y datos de `localStorage`

¡Listo! 🚀
