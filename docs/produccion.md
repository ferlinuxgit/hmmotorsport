# Producción

Guía operativa para tratar este boilerplate como una base lista para producción al arrancar una nueva web.

## Objetivo

La meta no es que el boilerplate sustituya el trabajo de producto, sino que la base salga con:

- despliegue reproducible
- checks automatizados
- healthchecks útiles
- observabilidad mínima seria
- SEO técnico base
- documentación suficiente para no improvisar

## Qué ya resuelve la base

- `lint`, `typecheck`, unitarios, E2E, integración PostgreSQL, `build` y `audit`
- build Docker reproducible
- runtime fijado en Node.js 24 LTS y PostgreSQL 18.4
- smoke test de imagen en CI
- smoke test HTTP reutilizable con `npm run test:smoke`
- migraciones versionadas y copiadas al runtime
- `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `icon` y `opengraph-image`
- `GET /api/live` para liveness
- `GET /api/ready` para readiness
- `GET /api/health` con checks de base de datos y pagos
- `x-request-id` en requests y respuestas del core
- cabeceras de seguridad HTTP base
- logs estructurados JSON en servidor
- rate limiting distribuido en PostgreSQL para auth, checkout, analítica y endpoints administrativos
- webhooks de pago idempotentes con historial de eventos
- política de retención ejecutable con `npm run db:maintenance`
- validación de readiness de producción para secretos, base de datos y `BUILD_SHA`
- backoffice con métricas operativas, billing, módulos, usuarios, readiness y analítica
- analítica de primera parte con endpoint propio y tracker cliente
- jobs PostgreSQL con deduplicación, locks, reintentos e historial de intentos
- reconciliación periódica, reembolsos asíncronos y entitlements
- email SMTP obligatorio y storage S3 obligatorio en producción

## Qué debe definir cada proyecto construido encima

- contenido real, copy y assets de marca
- metadata específica por página pública
- favicon e imagen Open Graph definitivas
- proveedores externos y sus secretos reales
- estrategia de backups del Postgres real
- alertas del proveedor de hosting y base de datos

## Variables operativas importantes

- `APP_URL`
- `APP_NAME`
- `APP_DESCRIPTION`
- `DEPLOYMENT_ENV`
- `LOG_LEVEL`
- `BUILD_SHA`
- `RUN_MIGRATIONS`
- `RATE_LIMIT_BACKEND=database`
- `TRUST_PROXY_HEADERS=true`
- `JOB_RUNNER_SECRET`
- `EMAIL_PROVIDER=smtp`
- `EMAIL_FROM`
- `SMTP_URL`
- `STORAGE_PROVIDER=s3`
- `S3_BUCKET`
- `S3_REGION`
- credenciales IAM o `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY`
- `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` si el módulo Stripe está instalado
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `PAYPAL_WEBHOOK_ID` si PayPal está instalado

## Go-Live Checklist

1. Configurar `.env` o secretos del entorno con valores reales.
2. Ejecutar `npm run verify`.
3. Verificar que `docker build -t baseboilerplate-audit .` pasa.
4. Levantar el contenedor y comprobar `GET /api/live`.
5. Ejecutar `BASE_URL=https://tu-dominio.com npm run test:smoke`.
6. Comprobar `GET /api/health` y revisar `checks`.
7. Validar que `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `icon` y `opengraph-image` responden.
8. Registrar el `BUILD_SHA` del despliegue.
9. Confirmar que Better Auth, Stripe y PayPal usan secretos reales.
10. Confirmar que las migraciones automáticas están habilitadas o que existe un job separado.
11. Entrar en `/admin` con un usuario admin y comprobar usuarios, órdenes, readiness y analítica.
12. Programar `node scripts/maintenance.mjs` diariamente con las retenciones definidas en el entorno.
13. Programar `npm run jobs:run` con la frecuencia requerida y comprobar `/admin/jobs`.
14. Crear una invitación de prueba y confirmar entrega SMTP, aceptación y eventos en `/admin/audit`.
15. Subir, abrir y eliminar un archivo desde un workspace; confirmar objeto, checksum y auditoría.
16. Ejecutar `TEST_DATABASE_URL=... npm run test:integration` contra una base desechable antes del primer go-live.
17. Confirmar que el scheduler ejecuta `npm run jobs:run` al menos cada cinco minutos para reconciliar órdenes pendientes.

## Recuperación básica

- Si falla `ready` pero `live` sigue en `ok`, revisar primero conectividad a base de datos y secretos de pagos.
- Si `health.checks.configuration` falla en producción, revisar secretos placeholder, `APP_URL`, `BETTER_AUTH_SECRET`, contraseña de Postgres y `BUILD_SHA`.
- Si falla el arranque tras una migración, desactiva `RUN_MIGRATIONS` y ejecuta migración controlada fuera del contenedor.
- Si un webhook deja de cerrar órdenes, revisar logs por `requestId`, firmas y `/admin/jobs`; la reconciliación debe hacer
  converger las órdenes pendientes aunque un evento se pierda.

## Criterio práctico de 10/10 para esta base

Se puede considerar una base `10/10` cuando:

- el core se despliega sin pasos ambiguos
- el contenedor se puede comprobar con healthchecks reales
- el estado operativo es visible por logs y endpoints
- la superficie pública sale con SEO técnico base
- la siguiente web puede arrancar sin rehacer autenticación, billing, deploy ni observabilidad
