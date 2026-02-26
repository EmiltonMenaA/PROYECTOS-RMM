# Estándares de Nombramiento - Proyecto RMM

## Índice
1. [Resumen](#resumen)
2. [Justificación](#justificación)
3. [Estándares por Contexto](#estándares-por-contexto)
4. [Ejemplos del Proyecto](#ejemplos-del-proyecto)
5. [Referencias Oficiales](#referencias-oficiales)
6. [Validación Automática](#validación-automática)

---

## Resumen

Este proyecto sigue **estándares oficiales y reconocidos por la comunidad** para JavaScript, Node.js, React y PostgreSQL. Los estándares están enforced automáticamente mediante **ESLint** y **Prettier**.

### Estándares Principales:

| Contexto | Convención | Ejemplo | Estándar |
|----------|-----------|---------|----------|
| Variables JavaScript | camelCase | `profileImage`, `activeTab` | Oficial JS |
| Funciones | camelCase | `loadProjects()`, `getInitials()` | Oficial JS |
| Clases/Constructores | PascalCase | `Pool`, `S3Client` | Oficial JS |
| Componentes React | PascalCase | `Dashboard`, `ProyectosSection` | Oficial React |
| Constantes | camelCase o UPPER_CASE* | `router`, `JWT_SECRET` | Oficial JS |
| Archivos Backend | kebab-case | `user-permissions.js`, `auth.js` | Node.js community |
| Archivos React | PascalCase | `Dashboard.jsx`, `Login.jsx` | React community |
| Tablas DB | snake_case | `users`, `project_supervisors` | PostgreSQL official |
| Columnas DB | snake_case | `password_hash`, `full_name` | PostgreSQL official |
| Endpoints API | kebab-case | `/user-permissions`, `/projects` | REST best practices |

\* UPPER_CASE para constantes de configuración del entorno (process.env)

---

## Justificación

### JavaScript/Node.js
- **Estándar Oficial**: [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
- **Comunidad**: [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- **MDN**: [JavaScript naming conventions](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Writing_style_guide/Code_style_guide/JavaScript#naming_conventions)

### React
- **Estándar Oficial**: [React Documentation - Thinking in React](https://react.dev/learn/thinking-in-react)
- **Convención**: Componentes siempre en PascalCase
- **Justificación**: Diferencia clara entre componentes React y elementos HTML

### PostgreSQL
- **Estándar Oficial**: [PostgreSQL Naming Conventions](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- **Convención Comunidad**: snake_case para tablas y columnas (evita problemas de case-sensitivity)
- **Justificación**: Compatibilidad con el estándar SQL y mejores prácticas de la comunidad

### REST API
- **Estándar**: [REST API Design Best Practices](https://restfulapi.net/resource-naming/)
- **Convención**: kebab-case para URLs, facilita la lectura y evita problemas de encoding

---

## Estándares por Contexto

### 1. Backend (Node.js/Express)

#### Variables y Constantes
```javascript
//  CORRECTO - camelCase para variables
const authHeader = req.headers.authorization;
const profileImage = user.profile_image;
const userPermissions = await getUserPermissions(userId);

//  CORRECTO - UPPER_CASE para constantes de entorno
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;

//  CORRECTO - camelCase para constantes locales
const router = express.Router();
const pool = new Pool();
```

#### Funciones
```javascript
//  CORRECTO - camelCase, verbos descriptivos
async function loadProjects() { }
function getInitials(name) { }
async function createUser(data) { }
function requireAuth(req, res, next) { }
```

#### Archivos
```javascript
//  CORRECTO - kebab-case
user-permissions.js
check-schema.js
remove-user-role.js
auth.js
projects.js
```

#### Módulos/Exports
```javascript
//  CORRECTO
module.exports = { query, pool };
const { requireAuth, requireAdmin } = require('../middleware/auth');
```

---

### 2. Frontend (React)

#### Componentes
```javascript
//  CORRECTO - PascalCase para componentes
function Dashboard({ user, onLogout }) { }
export default function ProyectosSection({ user }) { }
const ConfirmDeleteModal = ({ userName, onConfirm }) => { };
```

#### Hooks y Variables
```javascript
//  CORRECTO - camelCase
const [activeTab, setActiveTab] = useState('dashboard');
const [profileImage, setProfileImage] = useState('');
const navigate = useNavigate();
```

#### Funciones de Componente
```javascript
//  CORRECTO - camelCase, verbos descriptivos
const loadProjects = async () => { };
const getInitials = () => { };
const handleLogout = () => { };
const handleTabChange = (tab) => { };
```

#### Archivos de Componentes
```javascript
//  CORRECTO - PascalCase con extensión .jsx
Dashboard.jsx
ProyectosSection.jsx
ConfirmDeleteModal.jsx
SupervisorDashboard.jsx
```

#### Archivos Utilitarios
```javascript
// CORRECTO - camelCase
api.js
main.jsx
```

---

### 3. Base de Datos (PostgreSQL)

#### Tablas
```sql
-- CORRECTO - snake_case, plural
CREATE TABLE users (...);
CREATE TABLE projects (...);
CREATE TABLE project_supervisors (...);
CREATE TABLE user_permissions (...);
```

#### Columnas
```sql
--  CORRECTO - snake_case
password_hash
full_name
created_at
project_id
author_id
is_active
```

#### Relaciones
```sql
-- CORRECTO - <tabla>_<columna> para foreign keys
project_id REFERENCES projects(id)
user_id REFERENCES users(id)
author_id REFERENCES users(id)
```

---

### 4. API REST

#### Endpoints
```javascript
//  CORRECTO - kebab-case, sustantivos en plural
POST   /api/auth/register
POST   /api/auth/login
GET    /api/projects
GET    /api/user-permissions/:userId/permissions
GET    /api/supervisor/calendar
POST   /api/reports
```

#### Parámetros de Query
```javascript
//  CORRECTO - camelCase
?projectId=123
?startDate=2024-01-01
?endDate=2024-12-31
```

#### Campos JSON (Request/Response)
```javascript
//  CORRECTO - snake_case (compatibilidad con DB)
{
  "user_id": 1,
  "full_name": "Juan Pérez",
  "profile_image": "https://...",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Ejemplos del Proyecto

### Backend - auth.js
```javascript
// Variables y funciones: camelCase 
const express = require('express');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password, role, full_name } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  // ...
});
```

### Frontend - Dashboard.jsx
```javascript
// Componente: PascalCase 
// Variables y funciones: camelCase 
export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profileImage, setProfileImage] = useState('');
  
  const loadProjects = async () => {
    // ...
  };
  
  const getInitials = () => {
    // ...
  };
}
```

### Base de Datos - 001_create_tables.sql
```sql
-- Tablas y columnas: snake_case 
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  profile_image TEXT,
  created_at TIMESTAMP
);
```

---

## Referencias Oficiales

### JavaScript
- [MDN - JavaScript naming conventions](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Writing_style_guide/Code_style_guide/JavaScript#naming_conventions)
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html#naming)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript#naming-conventions)

### Node.js
- [Node.js Best Practices - Naming Conventions](https://github.com/goldbergyoni/nodebestpractices#2-code-patterns-and-style-practices)
- [Express.js Style Guide](https://github.com/focusaurus/express_code_structure)

### React
- [React Official Docs - Thinking in React](https://react.dev/learn/thinking-in-react)
- [React Community - Naming Conventions](https://github.com/airbnb/javascript/tree/master/react#naming)

### PostgreSQL
- [PostgreSQL Official - Identifiers](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- [PostgreSQL Naming Conventions Best Practices](https://www.cybertec-postgresql.com/en/postgresql-naming-conventions/)

### REST API
- [REST API Design - Resource Naming](https://restfulapi.net/resource-naming/)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md#71-url-structure)
- [Google API Design Guide](https://cloud.google.com/apis/design/naming_convention)

---

## Validación Automática

Los estándares de nombramiento son enforced automáticamente mediante:

### ESLint
Configurado en `.eslintrc.json` para validar:
- Uso de `camelCase` para variables y funciones
- Prohibición de `var` (usar `const` o `let`)
- Comparaciones estrictas (`===` en lugar de `==`)
- Variables no utilizadas
- Imports duplicados

### Prettier
Configurado en `.prettierrc` para formatear:
- Indentación consistente (2 espacios)
- Comillas simples para JavaScript
- Punto y coma al final de líneas
- Espacios en objetos y funciones

### Comandos de Verificación
```bash
# Backend
cd backend
npm run lint              # Verificar estándares
npm run lint:fix          # Corregir automáticamente

# Frontend
cd frontend
npm run lint              # Verificar estándares
npm run lint:fix          # Corregir automáticamente

# Todo el proyecto
.\verify-code.ps1         # Verificación completa
```

---

## Resumen de Cumplimiento

###  Estándares Implementados:
1. **Variables y funciones**: camelCase (JavaScript estándar)
2. **Componentes React**: PascalCase (React oficial)
3. **Clases**: PascalCase (JavaScript estándar)
4. **Constantes de entorno**: UPPER_CASE (Convención universal)
5. **Tablas y columnas DB**: snake_case (PostgreSQL estándar)
6. **Archivos backend**: kebab-case (Node.js comunidad)
7. **Archivos React**: PascalCase (React comunidad)
8. **Endpoints API**: kebab-case (REST best practices)

###  Herramientas de Validación:
- ESLint para JavaScript/React
- Prettier para formateo automático
- VS Code con extensiones configuradas

###  Documentación:
- Este documento detalla todos los estándares
- Justificación basada en guías oficiales
- Referencias a documentación externa
- Ejemplos del código real del proyecto

---

**Conclusión**: El proyecto sigue **estándares oficiales reconocidos** de la industria para JavaScript, Node.js, React y PostgreSQL, validados automáticamente mediante herramientas profesionales.

---

**Última actualización**: Febrero 2026
