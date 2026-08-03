# Referencia de entorno

Variables principales del boilerplate.

## Aplicación

### `APP_NAME`
- nombre público de la app

### `APP_DESCRIPTION`
- descripción base usada en metadata SEO

### `APP_URL`
- URL pública base
- se usa para metadata, redirects y Better Auth

## Better Auth

### `BETTER_AUTH_SECRET`
- secreto obligatorio para firmar cookies y sesiones
- debe tener al menos 32 caracteres

### `BETTER_AUTH_URL`
- URL base pública usada por Better Auth
- normalmente coincide con `APP_URL`

### `BETTER_AUTH_TRUSTED_ORIGINS`
- lista opcional separada por comas
- útil para previews, dominios alternativos o proxies

### `AUTH_ADMIN_EMAILS`
- lista opcional separada por comas
- esos emails se elevan a rol `admin`

Ejemplo:

```env
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUSTED_ORIGINS=
AUTH_ADMIN_EMAILS=admin@empresa.com,ops@empresa.com
```

## Base de datos

### `DATABASE_MODE`
- `internal` o `external`

### `DATABASE_URL`
- conexión completa cuando usas base externa

### `POSTGRES_HOST`
### `POSTGRES_PORT`
### `POSTGRES_DB`
### `POSTGRES_USER`
### `POSTGRES_PASSWORD`
### `POSTGRES_SSL`
- variables usadas para construir `DATABASE_URL` en modo `internal`

## Pagos

### Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### PayPal
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_ENVIRONMENT`

## Observabilidad

### `DEPLOYMENT_ENV`
- `development`, `staging` o `production`

### `LOG_LEVEL`

- admite `debug`, `info`, `warn`, `error` y `silent`
- `silent` está pensado para runners de test; producción debe conservar logs operativos
- `debug`, `info`, `warn` o `error`

### `BUILD_SHA`
- referencia opcional del build desplegado

### `RATE_LIMIT_BACKEND`
- `memory` para desarrollo o una sola instancia efímera
- `database` obligatorio en producción y compartido entre réplicas

### `TRUST_PROXY_HEADERS`
- debe ser `true` únicamente cuando un reverse proxy confiable sobrescribe los headers de IP

## Jobs

### `JOB_RUNNER_SECRET`
- secreto de al menos 32 caracteres para `POST /api/internal/jobs/run`

### `JOB_BATCH_SIZE`
- número de jobs procesados por invocación, entre `1` y `100`

## Email

### `EMAIL_PROVIDER`
- `console` en desarrollo; registra destinatario y asunto sin enviar
- `smtp` es obligatorio en producción

### `EMAIL_FROM`
- dirección remitente usada por Nodemailer

### `SMTP_URL`
- URL de conexión SMTP; obligatoria cuando `EMAIL_PROVIDER=smtp`
- ejemplo: `smtp://usuario:password@mail.example.com:587`

## Almacenamiento

### `STORAGE_PROVIDER`
- `local` para desarrollo; `s3` es obligatorio en producción

### `STORAGE_MAX_FILE_BYTES`
- límite por objeto, entre 1 byte y 100 MB; por defecto 10 MB

### `STORAGE_ALLOWED_MIME_TYPES`
- lista separada por comas validada tanto al crear como al subir

### `STORAGE_LOCAL_DIR`
- directorio del provider local; Docker monta `/app/.data/uploads` como volumen

### S3-compatible
- `S3_BUCKET` y `S3_REGION`
- `S3_ENDPOINT` para R2, MinIO u otros providers compatibles
- `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY` se configuran juntos; pueden omitirse con IAM
- `S3_FORCE_PATH_STYLE=true` cuando el provider lo requiera

## Runtime Docker

### `RUN_MIGRATIONS`
- si vale `true`, ejecuta `scripts/migrate.mjs` al arrancar

### Retención
- `SESSION_RETENTION_DAYS`
- `DRAFT_ORDER_RETENTION_DAYS`
- `ANALYTICS_RETENTION_DAYS`
- `PAYMENT_EVENT_RETENTION_DAYS`
- `AUDIT_LOG_RETENTION_DAYS`
- `JOB_RETENTION_DAYS`
- se aplican al ejecutar `npm run db:maintenance`

## Desarrollo local recomendado

```env
APP_NAME=Universal Boilerplate
APP_DESCRIPTION=Next.js boilerplate universal con frontend, backend, PostgreSQL, Drizzle, Better Auth, Stripe y PayPal.
APP_URL=http://localhost:3000
DEPLOYMENT_ENV=development
LOG_LEVEL=info
RATE_LIMIT_BACKEND=memory
TRUST_PROXY_HEADERS=false
BUILD_SHA=
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUSTED_ORIGINS=
AUTH_ADMIN_EMAILS=
JOB_RUNNER_SECRET=replace-with-a-job-runner-secret-of-at-least-32-characters
EMAIL_PROVIDER=console
EMAIL_FROM=noreply@example.com
SMTP_URL=
STORAGE_PROVIDER=local
STORAGE_MAX_FILE_BYTES=10485760
STORAGE_ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/csv
STORAGE_LOCAL_DIR=.data/uploads
S3_BUCKET=
S3_REGION=us-east-1
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false
DATABASE_MODE=internal
DATABASE_URL=
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=baseboilerplate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SSL=false
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_ENVIRONMENT=sandbox
RUN_MIGRATIONS=true
```
