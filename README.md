# CRM Reservas

Base SaaS para clinicas centrada en agenda, pacientes, profesionales, servicios y reservas online.

## Stack actual

- Next.js 16 con App Router y TypeScript estricto.
- Tailwind CSS 4 para estilos.
- Supabase Auth/Database preparado con `@supabase/ssr`.
- Zod para validacion de entradas.
- ESLint y `tsc --noEmit` para verificacion local.

## Primer arranque

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`.

Sin variables de Supabase, la app compila y en desarrollo muestra el panel en modo pendiente de configuracion. En produccion, las rutas privadas no se sirven sin Supabase configurado.

Para activar login y rutas privadas reales:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

## Rutas iniciales

- `/dashboard`: panel interno protegido cuando Supabase esta configurado.
- `/login`: acceso por magic link con Supabase Auth.
- `/auth/callback`: callback de intercambio de codigo por sesion.
- `/reservar/[clinicSlug]`: base de reserva publica por clinica.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Notas de seguridad

- No se usa `service_role` ni claves privadas en el frontend.
- La proteccion de rutas usa `supabase.auth.getClaims()` en servidor.
- El acceso a `/dashboard` sin sesion solo se permite en desarrollo cuando faltan variables de Supabase.
- Las tablas publicas de Supabase deben incluir `GRANT` explicitos, RLS y politicas por tenant.
- Los datos multi-tenant se modelan con `clinic_id`.
- No se guardaran datos clinicos sensibles en el MVP.

## Estado de fases

Fase 0 completada:

- Proyecto inspeccionado.
- Stack definido sobre Next.js, TypeScript, Tailwind, Supabase SSR y Zod.
- Plan por fases documentado en `prompt.md`.

Fase 1 completada:

- TypeScript estricto y scripts base.
- Estructura `src/app`, `src/lib`, `supabase`.
- Variables de entorno documentadas en `.env.example`.
- Cliente Supabase de servidor, navegador y proxy.
- Login por magic link preparado con Supabase Auth.
- Callback de autenticacion.
- Ruta privada `/dashboard` protegida cuando Supabase esta configurado.
- Bloqueo de rutas privadas sin Supabase en produccion.
- Layout, 404, loading y error boundary base.
- Pagina publica inicial `/reservar/[clinicSlug]`.

Fase 2 completada:

- Migracion Supabase para `profiles`, `clinics`, `clinic_members` y `audit_logs`.
- Enums de roles y estados para plataforma, clinicas y miembros.
- RLS por tenant con helpers SQL para superadmin y pertenencia a clinica.
- Trigger de sincronizacion de perfil desde `auth.users`.
- Trigger de membresia owner al crear una clinica.
- Tipos TypeScript de Supabase actualizados para las tablas iniciales.
- Matriz de permisos por rol de clinica.
- Guards de servidor para usuario, rol y permiso por clinica.
- Dashboard conectado al estado de membresias de clinica.

## Siguiente fase

Fase 3: modelos principales de pacientes, profesionales, servicios, salas/recursos y base de disponibilidad.
