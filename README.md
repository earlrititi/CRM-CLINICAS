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

Sin variables de Supabase, la app compila y muestra el panel en modo pendiente de configuracion. Para activar login y rutas privadas reales:

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
- Las futuras tablas publicas de Supabase deben incluir `GRANT` explicitos, RLS y politicas por tenant.
- Los datos multi-tenant se modelaran con `clinic_id` desde la Fase 2.
- No se guardaran datos clinicos sensibles en el MVP.

## Siguiente fase

Fase 2: modelo multi-tenant inicial, roles por clinica, migraciones Supabase con RLS y guards de permisos.
