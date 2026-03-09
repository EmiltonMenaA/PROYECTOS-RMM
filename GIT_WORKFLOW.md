# Flujo de Trabajo Git y Politica de Pull Requests

## Objetivo

Definir una estrategia de ramas clara, un proceso de revision de cambios y requisitos de calidad para evitar regresiones y mantener trazabilidad.

## Estrategia de Ramas

Este repositorio utiliza **GitHub Flow**.

### Ramas

- `main`: rama estable y desplegable.
- `feature/<descripcion-corta>`: desarrollo de nuevas funcionalidades.
- `fix/<descripcion-corta>`: correcciones de defectos.
- `chore/<descripcion-corta>`: tareas de mantenimiento o infraestructura.

### Justificacion de la Estrategia

- El proyecto tiene iteraciones frecuentes y cambios pequenos/medianos, por lo que GitHub Flow reduce complejidad frente a GitFlow.
- El equipo trabaja con pull requests cortos y revisables, lo cual favorece integracion continua.
- Mantener una sola rama estable (`main`) simplifica la verificacion de calidad y el soporte.

## Proceso de Trabajo

1. Crear rama desde `main`.
2. Implementar cambios y ejecutar validaciones locales.
3. Abrir pull request hacia `main`.
4. Esperar pipeline en estado exitoso.
5. Obtener al menos una aprobacion de revision.
6. Hacer merge.

## Validaciones Obligatorias

El pull request debe cumplir todos los siguientes puntos:

- Workflow de CI en estado exitoso.
- Job `Quality Checks` exitoso.
- Job `Security Checks` exitoso.
- Minimo una aprobacion de revision de pares.

## Configuracion Recomendada en GitHub

Configurar una regla de proteccion para la rama `main` con:

- `Require a pull request before merging` habilitado.
- `Require approvals` habilitado con al menos `1` aprobacion.
- `Dismiss stale pull request approvals when new commits are pushed` habilitado.
- `Require status checks to pass before merging` habilitado.
- Checks requeridos:
  - `Quality Checks`
  - `Security Checks`
- `Require branches to be up to date before merging` habilitado.
- `Require conversation resolution before merging` habilitado.

## Comandos Locales

### Verificacion de calidad

```bash
cd backend
npm run code:check

cd ../frontend
npm run code:check
```

### Verificacion de seguridad

```bash
cd backend
npm audit --omit=dev --audit-level=high

cd ../frontend
npm audit --omit=dev --audit-level=high
```
