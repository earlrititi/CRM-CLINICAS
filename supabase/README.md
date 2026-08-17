# Supabase

Esta carpeta queda reservada para migraciones, seeds y documentacion de base de datos.

Reglas para las migraciones:

- Crear tablas con `clinic_id` cuando contengan datos de una clinica.
- Activar RLS en todas las tablas expuestas.
- Incluir `GRANT` explicitos para `anon`, `authenticated` y `service_role` cuando una tabla deba estar disponible por Data API.
- No usar `user_metadata` para autorizacion.
- Usar politicas con `TO authenticated` y predicados de pertenencia a clinica.
- Registrar acciones importantes en `audit_logs`.
- Guardar fechas de citas en UTC.

La Fase 2 introducira las primeras migraciones reales.
