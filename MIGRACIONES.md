# Migraciones - Proyecto RMM

Este proyecto usa migraciones SQL en `backend/migrations/`.

## Como ejecutar

Desde la carpeta `backend/`:

```bash
npm run migrate
```

Esto aplica todas las migraciones en orden alfabetico (por nombre de archivo).

## Orden actual

1. 001_create_tables.sql - Tablas base
2. 002_add_user_profile_fields.sql - Campos extra de usuario
3. 003_create_supervisor_calendar.sql - Calendario y tareas
4. 004_create_roles_and_permissions.sql - Roles y permisos
5. 005_create_user_permissions.sql - Permisos por usuario
6. 006_add_status_to_reports.sql - Status y updated_at en reportes

## Reglas para nuevas migraciones

- Usa el prefijo numerico incremental: `007_...sql`, `008_...sql`, etc.
- Agrega `IF NOT EXISTS` cuando sea posible.
- No borres migraciones anteriores.
- Si necesitas revertir cambios, crea una nueva migracion.

## Requisitos

- `DATABASE_URL` configurado en `backend/.env`
- PostgreSQL en ejecucion

## Troubleshooting

- Error de conexion: revisa `DATABASE_URL` y que la BD exista.
- Error por columna duplicada: agrega `IF NOT EXISTS` en la migracion.
- Error por tabla faltante: revisa el orden y que todas las migraciones se ejecuten.
