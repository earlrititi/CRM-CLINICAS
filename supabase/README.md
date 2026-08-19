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

## Migraciones

La Fase 2 introduce la migracion `20260818120000_phase_2_multi_tenant_roles.sql` con:

- `profiles`: perfil publico minimo sincronizado desde `auth.users`.
- `clinics`: tenant principal del SaaS.
- `clinic_members`: pertenencia y rol por clinica.
- `audit_logs`: base para trazabilidad de acciones importantes.
- Enums de rol/estado.
- RLS y helpers SQL para superadmin, pertenencia y roles por clinica.

La Fase 3 introduce la migracion `20260819100000_phase_3_core_models.sql` con:

- `patients`: datos administrativos de pacientes/clientes, sin historia clinica sensible.
- `professionals`: profesionales de una clinica.
- `services`: servicios reservables con duracion, precio y buffers.
- `professional_services`: servicios que puede realizar cada profesional.
- `working_hours`: horario semanal por profesional.
- `schedule_exceptions`: vacaciones, bloqueos y excepciones horarias.
- `resources`: salas, cabinas, equipos u otros recursos fisicos para fases posteriores.
- RLS por `clinic_id`, indices iniciales y restricciones de integridad.

Para aplicarla en un proyecto Supabase real:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Para probarla en local con Supabase CLI:

```bash
supabase start
supabase migration up
```

## Configuracion manual pendiente al conectar Supabase

Cuando exista el proyecto Supabase real:

1. Copiar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`.
2. Configurar la URL de callback de Auth como `http://localhost:3000/auth/callback` para desarrollo.
3. Aplicar las migraciones.
4. Crear el primer usuario desde `/login`.
5. Si ese usuario debe ser superadmin, ejecutar en Supabase SQL:

```sql
update public.profiles
set platform_role = 'superadmin'
where email = 'tu-email@dominio.com';
```
