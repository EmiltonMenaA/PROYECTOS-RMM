# Análisis Estático de Código

> **Nota**: Para información sobre estándares de nombramiento, consulta [ESTANDARES_NOMBRAMIENTO.md](ESTANDARES_NOMBRAMIENTO.md)

## Índice
1. [Herramientas Utilizadas](#herramientas-utilizadas)
2. [Justificación de la Elección](#justificación-de-la-elección)
3. [Configuración](#configuración)
4. [Uso y Comandos](#uso-y-comandos)
5. [Integración en el Flujo de Trabajo](#integración-en-el-flujo-de-trabajo)
6. [Estándares de Código Enforced](#estándares-de-código-enforced)

---

## Herramientas Utilizadas

Para este proyecto utilizamos **dos herramientas complementarias** de análisis estático:

### 1. ESLint
- **Versión:** ^8.55.0
- **Propósito:** Análisis estático de código JavaScript/JSX
- **Sitio web:** https://eslint.org/

### 2. Prettier
- **Versión:** ^3.1.1
- **Propósito:** Formateador automático de código
- **Sitio web:** https://prettier.io/

---

## Justificación de la Elección

### ¿Por qué ESLint?

1. **Estándar de la industria:** ESLint es la herramienta de linting más utilizada en el ecosistema JavaScript/Node.js
2. **Altamente configurable:** Permite personalizar reglas según las necesidades del equipo
3. **Detección de errores:** Identifica problemas potenciales antes de la ejecución:
   - Errores de sintaxis
   - Variables no utilizadas
   - Código inalcanzable
   - Problemas de lógica
4. **Soporte para React:** Con plugins oficiales para React y React Hooks
5. **Corrección automática:** Puede corregir automáticamente muchos problemas de estilo

### ¿Por qué Prettier?

1. **Formateador opinionado:** Elimina discusiones sobre estilo de código
2. **Corrección automática:** Formatea el código automáticamente sin intervención manual
3. **Integración con ESLint:** Se complementa perfectamente sin conflictos (usando `eslint-config-prettier`)
4. **Consistencia:** Garantiza que todo el código tenga el mismo formato
5. **Ahorro de tiempo:** Los desarrolladores no pierden tiempo formateando manualmente

### Complementariedad

- **ESLint:** Enfocado en la calidad del código y detección de errores
- **Prettier:** Enfocado únicamente en el formato y estilo visual
- Juntos proporcionan una solución completa para mantener código limpio y consistente

---

## Configuración

### Backend (Node.js)

#### ESLint (`.eslintrc.json`)

```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    // ... ver archivo completo en backend/.eslintrc.json
  }
}
```

**Características principales:**
- Modo estricto con configuración recomendada
- Compatibilidad con ES2021+
- Reglas para Node.js
- Integración con Prettier para evitar conflictos

#### Prettier (`.prettierrc`)

```json
{
  "semi": true,
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Frontend (React + Vite)

#### ESLint (`.eslintrc.json`)

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "plugins": [
    "react",
    "react-hooks",
    "react-refresh"
  ],
  "rules": {
    // ... ver archivo completo en frontend/.eslintrc.json
  }
}
```

**Características principales:**
- Configuración recomendada para React
- Soporte para React Hooks
- Reglas para React Refresh (Vite)
- Detección automática de la versión de React

#### Prettier (`.prettierrc`)

Configuración similar al backend con ajustes específicos para JSX.

---

## Uso y Comandos

### Backend

Navegar al directorio del backend:
```bash
cd backend
```

#### Instalar dependencias
```bash
npm install
```

#### Verificar código con ESLint
```bash
npm run lint
```

#### Corregir automáticamente problemas de ESLint
```bash
npm run lint:fix
```

#### Formatear código con Prettier
```bash
npm run format
```

#### Verificar formato sin modificar archivos
```bash
npm run format:check
```

#### Verificación completa (ESLint + Prettier)
```bash
npm run code:check
```

### Frontend

Navegar al directorio del frontend:
```bash
cd frontend
```

Los comandos son idénticos a los del backend:
```bash
npm install
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run code:check
```

---

## Integración en el Flujo de Trabajo

### Desarrollo Local

#### Antes de hacer commit
Ejecutar en ambos directorios (backend y frontend):
```bash
npm run code:check
```

Si hay errores, corregirlos automáticamente:
```bash
npm run lint:fix
npm run format
```

### Integración con Editor

#### Visual Studio Code (Recomendado)

Instalar las siguientes extensiones:
1. **ESLint** (`dbaeumer.vscode-eslint`)
2. **Prettier - Code formatter** (`esbenp.prettier-vscode`)

Agregar a `.vscode/settings.json` del workspace:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact"
  ]
}
```

Esto configurará:
- Formateo automático al guardar archivos
- Corrección automática de problemas de ESLint al guardar
- Validación en tiempo real

### Pre-commit Hooks (Recomendado para el futuro)

Considerar agregar **Husky** y **lint-staged** para ejecutar automáticamente las verificaciones antes de cada commit:

```bash
npm install --save-dev husky lint-staged
```

---

## Estándares de Código Enforced

### Reglas de Calidad (ESLint)

#### Variables y Declaraciones
-  **no-var:** Prohibido usar `var`, usar `let` o `const`
-  **prefer-const:** Usar `const` cuando la variable no se reasigna
-  **no-unused-vars:** Variables no utilizadas causan error
-  **no-duplicate-imports:** Imports duplicados no permitidos

#### Comparaciones y Lógica
-  **eqeqeq:** Usar siempre `===` y `!==` (comparación estricta)
-  **curly:** Siempre usar llaves en bloques `if`, `else`, `for`, etc.

#### Funciones
-  **prefer-arrow-callback:** Preferir arrow functions en callbacks
-  **arrow-spacing:** Espacios correctos en arrow functions

#### Código Limpio
-  **no-console:** Advertencia en uso de `console.log` (en producción evitar)
-  **no-multiple-empty-lines:** Máximo 1 línea vacía consecutiva

#### React (Solo Frontend)
-  **react-hooks/rules-of-hooks:** Reglas de Hooks respetadas
-  **react-hooks/exhaustive-deps:** Advertencia en dependencias de useEffect
- **react-refresh/only-export-components:** Optimización para Hot Reload

### Reglas de Formato (Prettier)

#### Sintaxis
-  **Punto y coma:** Requerido al final de cada declaración
-  **Comillas:** Simples (`'`) en JavaScript, dobles (`"`) en JSX
-  **Coma trailing:** Sin coma final en objetos/arrays

#### Espaciado
-  **Indentación:** 2 espacios (no tabs)
-  **Ancho de línea:** Máximo 100 caracteres
-  **Espacios en objetos:** `{ key: value }` (con espacios)
-  **Espacios en arrays:** `[1, 2, 3]` (sin espacios)

#### Otros
-  **Arrow functions:** Sin paréntesis cuando hay un solo parámetro
-  **Fin de línea:** LF (Linux/Mac style)

---

## Beneficios Obtenidos

###  Análisis Estático Automático
ESLint detecta errores potenciales antes de ejecutar el código.

###  Estándares de Nomenclatura
Las reglas de ESLint aseguran nombres de variables consistentes y descriptivos.

###  Formateo Automático
Prettier corrige automáticamente el formato del código, ahorrando tiempo y discusiones.

###  Código Consistente
Todo el equipo escribe código con el mismo estilo, facilitando la lectura y mantenimiento.

###  Detección Temprana de Errores
Problemas comunes se detectan durante el desarrollo, no en producción.

---

## Mantenimiento

### Actualización de Reglas

Las reglas pueden ajustarse editando:
- `backend/.eslintrc.json`
- `frontend/.eslintrc.json`

### Actualización de Herramientas

Verificar actualizaciones periódicamente:
```bash
npm outdated
npm update eslint prettier
```

---

## Recursos Adicionales

- [Documentación oficial de ESLint](https://eslint.org/docs/latest/)
- [Listado de reglas de ESLint](https://eslint.org/docs/latest/rules/)
- [Documentación oficial de Prettier](https://prettier.io/docs/en/index.html)
- [Opciones de configuración de Prettier](https://prettier.io/docs/en/options.html)
- [ESLint + Prettier: Integración](https://prettier.io/docs/en/integrating-with-linters.html)

---

**Última actualización:** Febrero 2026
