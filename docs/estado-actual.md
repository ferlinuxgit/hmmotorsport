# Estado actual

## Resumen ejecutivo

El repositorio es una foundation `10/10` dentro de su alcance: una base reutilizable, extensible y operable para iniciar
productos Next.js sin reconstruir autenticación, tenancy, backoffice, contenido, comercio, pagos, jobs, archivos ni
despliegue. No pretende sustituir las reglas, la marca o la operación específica del negocio que se construya encima.

## Validación automatizada

La calidad se comprueba con:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:e2e`
- `npm run build`
- `npm run audit`
- `TEST_DATABASE_URL=... npm run test:integration`
- build y smoke de la imagen Docker en CI

Las integraciones se ejecutan en serie contra PostgreSQL real y cubren las once migraciones, concurrencia, autorización,
jobs, invitaciones, almacenamiento, configuración runtime, contenido, comercio, entitlements, reembolsos y reconciliación.

## Capacidades incluidas

### Aplicación y experiencia

- Node.js 24 LTS fijado para desarrollo, CI y contenedores
- Next.js App Router, React y TypeScript
- Tailwind CSS con componentes coherentes y responsive
- SEO técnico, sitemap, robots, manifest e imagen Open Graph
- estados globales de error, not found y carga
- progreso de navegación global reutilizable para enlaces internos, historial y navegación programática
- accesibilidad base, skip link, foco y labels operativos

### Identidad y seguridad

- Better Auth sobre las tablas de identidad del dominio
- registro con verificación de email
- login, logout, recuperación y cambio de contraseña
- sesiones revocables y exportación de datos de cuenta
- roles globales, bloqueo del último admin y RBAC por workspace
- comprobación same-origin en mutaciones autenticadas por cookie
- límites de body, rate limiting, cabeceras de seguridad y redirects internos

### Backoffice

- resumen operativo en `/admin`
- usuarios, roles, estado y sesiones
- auditoría append-only
- workspaces, ownership, membresías e invitaciones
- jobs, intentos, cancelación y reintento
- archivos privados e integridad
- configuración runtime y feature flags con rollout y overrides
- editor de contenido con draft, publicación, archivado y SEO
- catálogo, precios de pago único y órdenes
- billing, entitlements, reembolsos y reconciliación

### Backend transversal

- PostgreSQL y Drizzle con migraciones incrementales
- jobs persistidos con `FOR UPDATE SKIP LOCKED`, deduplicación, backoff e historial
- outbox de notificaciones con SMTP y provider de consola para desarrollo
- invitaciones firmadas cuyo token nunca se persiste en claro
- almacenamiento privado local/S3 con SHA-256 y autorización por workspace
- settings y flags registrados por módulos, versionados y auditados
- analítica first-party sin IP por defecto

### Comercio y billing

- productos y precios versionados
- checkout autenticado con precio resuelto exclusivamente en servidor
- Stripe y PayPal con eventos firmados e idempotentes
- captura PayPal explícita antes de considerar una orden pagada
- reconciliación periódica de órdenes pendientes
- reembolsos asíncronos e idempotentes
- grants de entitlement y revocación al reembolsar completamente

El core de cobro es deliberadamente de pago único. `prices.interval` se conserva como punto de extensión de datos, pero la
API administrativa rechaza intervalos para no presentar una suscripción que los providers base no hayan creado.

### Operación

- PostgreSQL 18.4 como baseline para instalaciones nuevas
- liveness, readiness y health con estados diferenciados
- readiness de producción sensible a módulos instalados y credenciales obligatorias
- request ids y logs JSON
- mantenimiento y retención configurables
- Docker multi-stage, usuario no root y storage local escribible
- Compose con PostgreSQL interno o externo y variantes para Coolify
- CI con unitarios, E2E Chromium, integración PostgreSQL, build, audit, Docker y smoke HTTP

Las dependencias directas están en su última versión compatible. Se mantienen deliberadamente ESLint 9 y TypeScript 6
hasta que los plugins Next/React soporten sus siguientes majors; los tipos de Node siguen la línea 24 ejecutada y no la
línea 26 Current.

## Qué queda fuera de la foundation

Estas decisiones pertenecen al producto final y no son carencias del boilerplate:

- recursos y reglas específicas de cada negocio
- permisos finos de esos recursos
- suscripciones, impuestos y facturación fiscal del mercado elegido
- marca, copy, contenido legal y assets definitivos
- estrategia de backups, alertas y SLO del proveedor de infraestructura
- políticas regulatorias y de retención aplicables a los datos reales
- suites sandbox específicas de las cuentas Stripe/PayPal del proyecto

## Evaluación de madurez

Como boilerplate generalista: `10/10` dentro del alcance documentado.

Como producto final: la nota depende de la vertical añadida. El equipo no debe confundir una foundation operable con la
validación de negocio, seguridad regulatoria o go-live de una aplicación concreta.

## Invariantes que no deben degradarse

- toda mutación crítica mantiene autorización, validación y auditoría
- los importes de checkout nunca son fuente de verdad del cliente
- un módulo no puede sobrescribir silenciosamente claves de otro módulo
- las colecciones administrativas están filtradas y paginadas en PostgreSQL
- las migraciones son la única vía de evolución del schema
- producción no usa mocks, secretos placeholder, email de consola ni storage local
- los checks de CI permanecen verdes antes de integrar cambios
