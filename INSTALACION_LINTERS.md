# Instalación de Herramientas de Análisis Estático

Este documento describe cómo instalar y configurar las herramientas de análisis estático que se han agregado al proyecto.

## Pasos de Instalación

### 1. Instalar Dependencias

#### Backend
```powershell
cd backend
npm install
```

Esto instalará:
- `eslint` ^8.55.0
- `eslint-config-prettier` ^9.1.0
- `prettier` ^3.1.1

#### Frontend
```powershell
cd frontend
npm install
```

Esto instalará:
- `eslint` ^8.55.0
- `eslint-plugin-react` ^7.33.2
- `eslint-plugin-react-hooks` ^4.6.0
- `eslint-plugin-react-refresh` ^0.4.5
- `eslint-config-prettier` ^9.1.0
- `prettier` ^3.1.1

### 2. Configurar VS Code (Recomendado)

#### Instalar Extensiones

1. Abre VS Code
2. Ve a Extensions (Ctrl+Shift+X)
3. Busca e instala:
   - **ESLint** (dbaeumer.vscode-eslint)
   - **Prettier - Code formatter** (esbenp.prettier-vscode)

VS Code debería recomendar automáticamente estas extensiones cuando abras el workspace.

#### Configuración Automática

El archivo `.vscode/settings.json` ya está configurado con:
- Formateo automático al guardar
- Corrección automática de ESLint al guardar
- Prettier como formateador predeterminado

## Verificar la Instalación

### Opción 1: Script Global (Recomendado)

Desde la raíz del proyecto:
```powershell
.\verify-code.ps1
```

Este script verifica tanto backend como frontend.

### Opción 2: Verificación Individual

#### Backend
```powershell
cd backend
npm run code:check
```

#### Frontend
```powershell
cd frontend
npm run code:check
```

## Uso Diario

### Durante el Desarrollo

Si configuraste VS Code correctamente:
1. Escribe código normalmente
2. Al guardar (Ctrl+S), el código se formatea automáticamente
3. Los errores de ESLint aparecen con subrayado rojo en el editor

### Antes de Hacer Commit

Ejecuta la verificación completa:
```powershell
.\verify-code.ps1
```

Si hay errores, corrígelos automáticamente:
```powershell
# Backend
cd backend
npm run lint:fix
npm run format

# Frontend
cd frontend
npm run lint:fix
npm run format
```

## Comandos Disponibles

### Backend y Frontend (mismos comandos)

| Comando | Descripción |
|---------|-------------|
| `npm run lint` | Verifica el código con ESLint |
| `npm run lint:fix` | Corrige automáticamente problemas de ESLint |
| `npm run format` | Formatea el código con Prettier |
| `npm run format:check` | Verifica el formato sin modificar archivos |
| `npm run code:check` | Verificación completa (lint + format) |

## Archivos de Configuración

Los siguientes archivos de configuración se han creado:

### Backend
- `.eslintrc.json` - Configuración de ESLint
- `.prettierrc` - Configuración de Prettier
- `.eslintignore` - Archivos ignorados por ESLint
- `.prettierignore` - Archivos ignorados por Prettier

### Frontend
- `.eslintrc.json` - Configuración de ESLint (con plugins de React)
- `.prettierrc` - Configuración de Prettier
- `.eslintignore` - Archivos ignorados por ESLint
- `.prettierignore` - Archivos ignorados por Prettier

### Workspace
- `.vscode/settings.json` - Configuración de VS Code
- `.vscode/extensions.json` - Extensiones recomendadas

## Solución de Problemas

### "ESLint is not recognized"

Asegúrate de haber ejecutado `npm install` en el directorio correspondiente.

### Formateo no funciona al guardar

1. Verifica que las extensiones de ESLint y Prettier estén instaladas
2. Recarga VS Code (Ctrl+Shift+P → "Reload Window")
3. Verifica que `.vscode/settings.json` exista en la raíz del proyecto

### Conflictos entre ESLint y Prettier

No deberían ocurrir ya que usamos `eslint-config-prettier` que desactiva reglas de ESLint que entran en conflicto con Prettier.

## Documentación Completa

Para más información sobre las herramientas, configuración y estándares de código, consulta:

 **[ANALISIS_ESTATICO.md](ANALISIS_ESTATICO.md)**

---

**Siguiente paso**: Ejecuta `npm install` en backend y frontend para instalar las nuevas dependencias.
