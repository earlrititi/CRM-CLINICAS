Quiero que actúes como arquitecto senior full-stack y desarrollador principal. Necesito crear un CRM web tipo SaaS para vender a clínicas, centrado principalmente en un gestor de reservas y citas profesional, seguro, ligero, mantenible y escalable.

El objetivo no es crear una demo básica, sino una base realista de producto comercial que pueda evolucionar. Debes trabajar de forma secuencial, revisando primero el proyecto existente y parando cuando necesites que yo configure algo externo o tome una decisión importante.

Contexto del producto:
Quiero una aplicación web SaaS para clínicas pequeñas y medianas: fisioterapia, odontología, estética, psicología, podología, nutrición, centros médicos privados, etc. El núcleo del producto será un sistema completo de gestión de reservas, citas, pacientes/clientes, profesionales, servicios, disponibilidad y recordatorios.

Prioridades del producto:

1. Gestor de citas y reservas muy completo.
2. Seguridad y privacidad desde el diseño.
3. Aplicación ligera, rápida y eficiente.
4. Código limpio, modular y fácil de mantener.
5. Arquitectura escalable para venderlo a varios negocios.
6. Preparado para modelo SaaS con planes de suscripción.
7. Diseño profesional, moderno y usable.

Stack técnico:
Primero inspecciona el proyecto actual y dime qué stack detectas. Si ya existe un stack, respétalo salvo que haya una razón clara para cambiarlo.
Si el proyecto está vacío o no hay una decisión tomada, propón una arquitectura moderna y ligera. Mi preferencia orientativa sería:

* Frontend: Astro o Next.js con TypeScript.
* UI: Tailwind CSS.
* Base de datos: Supabase/PostgreSQL.
* Autenticación: Supabase Auth o sistema equivalente seguro.
* Validación: Zod o alternativa robusta.
* ORM/query layer: Prisma, Drizzle o cliente Supabase, eligiendo lo más simple y mantenible.
* Emails transaccionales: Resend.
* Pagos SaaS: Stripe, pero implementarlo en una fase separada.
* Deploy: Vercel, Netlify o similar.
* Tests: unitarios e integración en las partes críticas.

Antes de implementar nada:

1. Analiza la estructura del proyecto.
2. Detecta el stack actual.
3. Propón una arquitectura.
4. Define fases de implementación.
5. Indica claramente qué vas a tocar.
6. Espera mi confirmación antes de hacer cambios grandes.

Requisitos funcionales principales del gestor de citas:

A. Multiempresa / SaaS

* La aplicación debe permitir múltiples clínicas o negocios.
* Cada clínica debe tener sus propios usuarios, pacientes, servicios, profesionales, citas y configuración.
* Ninguna clínica debe poder ver datos de otra.
* Diseñar la base de datos desde el principio con separación por tenant/clinic_id.
* Preparar roles por clínica.

B. Roles de usuario
Debe haber como mínimo:

* Superadmin de la plataforma.
* Administrador de clínica.
* Recepción/gestor de citas.
* Profesional/especialista.
* Usuario solo lectura, opcional.

Cada rol debe tener permisos diferenciados.

C. Gestión de pacientes/clientes
Crear módulo de pacientes/clientes con:

* Nombre y apellidos.
* Teléfono.
* Email.
* Fecha de nacimiento opcional.
* DNI/NIE opcional.
* Notas internas.
* Etiquetas.
* Estado: activo/inactivo.
* Historial de citas.
* Fecha de alta.
* Consentimiento para comunicaciones.
* Preferencias de contacto.

Importante: evitar guardar información médica sensible salvo que sea estrictamente necesario. Diseñar el sistema pensando en privacidad y minimización de datos.

D. Gestión de profesionales
Cada clínica debe poder crear profesionales con:

* Nombre.
* Especialidad.
* Email.
* Teléfono.
* Color en calendario.
* Servicios que puede realizar.
* Horario semanal.
* Excepciones de horario.
* Días libres, vacaciones o bloqueos.
* Estado activo/inactivo.

E. Servicios
Cada clínica debe poder crear servicios:

* Nombre del servicio.
* Descripción.
* Duración.
* Precio.
* Categoría.
* Profesional/es que pueden realizarlo.
* Tiempo de preparación antes de la cita.
* Tiempo de descanso después de la cita.
* Color o icono opcional.
* Estado activo/inactivo.

F. Agenda y calendario
Crear un calendario profesional para la clínica:

* Vista diaria.
* Vista semanal.
* Vista mensual.
* Filtro por profesional.
* Filtro por servicio.
* Filtro por estado de cita.
* Colores por profesional o estado.
* Crear cita desde calendario.
* Editar cita arrastrando o cambiando fecha/hora si es viable.
* Evitar solapamientos.
* Mostrar huecos disponibles.
* Bloqueos manuales de agenda.
* Citas recurrentes, si no complica demasiado el MVP, dejar preparado para fase posterior.
* Estados de cita:

  * Pendiente.
  * Confirmada.
  * En espera.
  * Cancelada.
  * No asistió.
  * Completada.
  * Reprogramada.

G. Motor de disponibilidad
Implementar o preparar un motor de disponibilidad robusto:

* Calcular huecos disponibles según:

  * Horario del profesional.
  * Duración del servicio.
  * Buffers antes/después.
  * Bloqueos manuales.
  * Citas ya existentes.
  * Vacaciones o excepciones.
  * Recursos limitados, si se implementan salas/cabinas.
* No permitir reservas duplicadas o solapadas.
* Usar transacciones o restricciones de base de datos cuando sea necesario.
* Añadir índices de base de datos para consultas frecuentes de citas.

H. Reservas online
Preparar una página pública de reservas para cada clínica:

* URL pública por clínica, por ejemplo /reservar/[slug-clinica].
* Selección de servicio.
* Selección de profesional, opcional.
* Selección de fecha y hora disponible.
* Datos básicos del paciente.
* Confirmación de cita.
* Email de confirmación.
* Política de cancelación.
* Consentimiento de comunicaciones.
* Protección contra spam y abuso.

La reserva pública debe ser segura y no debe exponer datos internos de la clínica.

I. Panel interno de clínica
Crear un dashboard interno con:

* Citas de hoy.
* Próximas citas.
* Citas pendientes de confirmar.
* Cancelaciones recientes.
* Pacientes nuevos.
* Ocupación por profesional.
* Accesos rápidos: nueva cita, nuevo paciente, nuevo servicio, nuevo profesional.

J. Recordatorios y notificaciones
Preparar sistema de notificaciones:

* Email de confirmación de cita.
* Email de cancelación.
* Email de reprogramación.
* Recordatorio antes de la cita.
* Plantillas editables en el futuro.
* SMS o WhatsApp dejarlo preparado como integración futura, no implementarlo de entrada salvo que sea sencillo.

K. Cancelaciones y reprogramaciones
Debe poder:

* Cancelar cita.
* Reprogramar cita.
* Registrar motivo de cancelación.
* Marcar no asistencia.
* Definir política de cancelación por clínica.
* Permitir cancelación desde enlace seguro en email, si es viable.

L. Lista de espera
Preparar o implementar lista de espera:

* Paciente interesado en adelantar cita.
* Servicio deseado.
* Profesional deseado opcional.
* Rango de fechas.
* Aviso interno cuando se libera un hueco.

M. Recursos físicos
Diseñar la base para recursos físicos:

* Sala.
* Cabina.
* Equipo.
* Sillón.
* Máquina.
* Evitar que dos citas usen el mismo recurso a la vez.
  Si complica demasiado el MVP, deja la estructura preparada para fase 2.

N. Facturación y pagos
No implementar facturación completa de entrada salvo que sea fácil. Preparar para:

* Precio del servicio.
* Estado de pago:

  * No pagado.
  * Pagado.
  * Señal pagada.
  * Reembolsado.
* Integración futura con Stripe para pagos online o señales.
* Planes SaaS para cobrar a las clínicas:

  * Free trial.
  * Básico.
  * Profesional.
  * Premium.

O. CRM básico
Además de citas, preparar funciones CRM:

* Ficha de paciente.
* Historial de interacciones.
* Notas internas.
* Etiquetas.
* Segmentos.
* Última visita.
* Próxima cita.
* Pacientes inactivos.
* Acciones futuras: campañas de email, recordatorios de revisión, etc.

P. Configuración de clínica
Cada clínica debe poder configurar:

* Nombre comercial.
* Logo.
* Colores básicos.
* Dirección.
* Teléfono.
* Email.
* Horario general.
* Zona horaria.
* Política de cancelación.
* Textos legales básicos.
* URL pública de reservas.
* Servicios activos.
* Profesionales activos.

Requisitos de seguridad:

* Usar TypeScript estricto.
* Validar todos los datos de entrada en cliente y servidor.
* Nunca confiar solo en validación frontend.
* Proteger rutas privadas.
* Implementar control de permisos por rol.
* Aislar datos por clínica/tenant.
* Si se usa Supabase, usar Row Level Security cuando proceda.
* Evitar SQL injection usando queries parametrizadas/ORM seguro.
* Evitar XSS escapando contenido y evitando HTML peligroso.
* Proteger formularios públicos contra spam/rate limit.
* No exponer claves privadas en frontend.
* Usar variables de entorno.
* Añadir logs de auditoría para acciones importantes:

  * Crear cita.
  * Modificar cita.
  * Cancelar cita.
  * Borrar paciente.
  * Cambiar permisos.
* No borrar datos sensibles de forma irreversible sin confirmación.
* Preparar soft delete donde tenga sentido.
* Minimizar datos personales.
* Diseñar pensando en RGPD/privacidad desde el inicio.
* No implementar datos clínicos sensibles en el MVP salvo que yo lo pida expresamente.

Requisitos de rendimiento:

* Aplicación ligera.
* Evitar dependencias pesadas innecesarias.
* Cargar solo lo necesario.
* Paginación en tablas.
* Búsqueda eficiente.
* Índices en campos críticos:

  * clinic_id.
  * professional_id.
  * patient_id.
  * starts_at.
  * ends_at.
  * appointment_status.
* Consultas optimizadas para calendario.
* Separar componentes grandes.
* Evitar renders innecesarios.
* Preparar la app para crecer sin reescribir todo.

Modelo de datos mínimo esperado:
Diseña migraciones o esquema para entidades similares a:

* clinics
* users/profiles
* clinic_members
* roles/permissions
* patients
* professionals
* services
* professional_services
* working_hours
* schedule_exceptions
* appointments
* appointment_status_history
* appointment_notes
* resources
* appointment_resources
* waitlist_entries
* notification_templates
* notifications
* audit_logs
* subscription_plans
* clinic_subscriptions

Puedes ajustar nombres y relaciones si hay una opción mejor.

Reglas importantes de citas:

* Una cita pertenece siempre a una clínica.
* Una cita tiene paciente, servicio, profesional, fecha/hora de inicio y fin.
* No debe haber solapamiento para el mismo profesional.
* No debe haber solapamiento para el mismo recurso físico.
* La duración se calcula desde el servicio, pero puede editarse manualmente si el rol lo permite.
* Los cambios de estado deben quedar registrados.
* Las cancelaciones deben conservar historial.
* Las citas deben guardarse en UTC y mostrarse en la zona horaria de la clínica.

Interfaz deseada:

* Diseño limpio, moderno, profesional y orientado a clínicas.
* Dashboard claro.
* Calendario visual.
* Formularios rápidos.
* Botones de acción evidentes.
* Buen uso de modales/drawers.
* Estados vacíos bien diseñados.
* Mensajes de error claros.
* Responsive para tablet y móvil.
* La recepción debe poder crear una cita en pocos clics.

Flujo principal que debe funcionar en el MVP:

1. Crear una clínica.
2. Crear usuarios/miembros de clínica.
3. Crear profesionales.
4. Crear servicios.
5. Definir horarios de profesionales.
6. Crear pacientes.
7. Ver calendario.
8. Crear cita interna.
9. Editar cita.
10. Cancelar cita.
11. Confirmar cita.
12. Ver historial del paciente.
13. Acceder a una página pública de reserva.
14. Crear una reserva pública.
15. Recibir o simular email de confirmación.
16. Ver la cita en el panel interno.

Forma de trabajar:
Trabaja por fases. No hagas todo de golpe.

Fase 0: Auditoría del proyecto

* Inspecciona archivos.
* Detecta stack.
* Resume estructura.
* Identifica riesgos.
* Propón plan.
* Para y pide confirmación.

Fase 1: Base técnica

* Configuración TypeScript.
* Estructura de carpetas.
* Variables de entorno.
* Conexión a base de datos.
* Sistema de autenticación.
* Layout base.
* Rutas protegidas.

Fase 2: Multi-tenant y roles

* Clínicas.
* Miembros.
* Roles.
* Separación de datos.
* Middleware o guards de permisos.

Fase 3: Modelos principales

* Pacientes.
* Profesionales.
* Servicios.
* Horarios.
* Excepciones.

Fase 4: Motor de citas

* Crear cita.
* Editar cita.
* Cancelar cita.
* Estados.
* Validación de solapamientos.
* Historial de cambios.

Fase 5: Calendario

* Vista diaria/semanal/mensual.
* Filtros.
* Acciones rápidas.
* Diseño profesional.

Fase 6: Reservas públicas

* Página pública por clínica.
* Selección de servicio/profesional.
* Huecos disponibles.
* Formulario de paciente.
* Confirmación.

Fase 7: Notificaciones

* Emails básicos.
* Plantillas.
* Registro de notificaciones.
* Preparar recordatorios programados.

Fase 8: SaaS comercial

* Planes.
* Stripe.
* Límites por plan.
* Trial.
* Pantalla de billing.

Fase 9: Calidad, seguridad y despliegue

* Tests.
* Revisión de seguridad.
* Optimización.
* Documentación.
* Checklist de despliegue.

Cuando implementes:

* Explica brevemente cada cambio.
* Crea código limpio y modular.
* No dupliques lógica.
* Extrae servicios reutilizables.
* Añade tipos.
* Añade validaciones.
* Añade comentarios solo donde aporten valor.
* No metas dependencias innecesarias.
* No rompas funcionalidades existentes.
* Si algo requiere claves externas, crea variables .env.example y detente para que yo las configure.
* Si hay varias opciones técnicas, recomiéndame una y explica por qué.
* Si detectas una decisión de producto importante, pregúntame antes de implementarla.

Criterios de calidad:

* El proyecto debe poder ejecutarse localmente.
* Debe tener README con instrucciones.
* Debe tener .env.example.
* Debe tener migraciones o instrucciones claras de base de datos.
* Debe tener datos seed ficticios para probar.
* Debe tener manejo de errores.
* Debe tener estados de carga.
* Debe tener permisos claros.
* Debe evitar accesos cruzados entre clínicas.
* Debe ser fácil añadir nuevos módulos.

Restricciones:

* No crear una aplicación pesada o sobreingenierizada.
* No guardar datos clínicos sensibles en el MVP.
* No dejar rutas privadas sin protección.
* No dejar claves en el código.
* No usar datos reales.
* No implementar pagos reales hasta que yo confirme la configuración de Stripe.
* No implementar envío real de emails hasta que yo configure Resend o proveedor equivalente.

Resultado esperado:
Quiero que conviertas este proyecto en una base profesional de CRM SaaS para clínicas, empezando por un gestor de reservas y citas sólido. Primero analiza el proyecto y presenta el plan de implementación por fases. Después espera mi confirmación para empezar la Fase 1.
