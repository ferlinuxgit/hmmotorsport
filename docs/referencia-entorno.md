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
- `debug`, `info`, `warn` o `error`

### `BUILD_SHA`
- referencia opcional del build desplegado

### `RATE_LIMIT_BACKEND`
- `memory` para desarrollo o una sola instancia efímera
- `database` obligatorio en producción y compartido entre réplicas

### `TRUST_PROXY_HEADERS`
- debe ser `true` únicamente cuando un reverse proxy confiable sobrescribe los headers de IP

## Runtime Docker

### `RUN_MIGRATIONS`
- si vale `true`, ejecuta `scripts/migrate.mjs` al arrancar

### Retención
- `SESSION_RETENTION_DAYS`
- `DRAFT_ORDER_RETENTION_DAYS`
- `ANALYTICS_RETENTION_DAYS`
- `PAYMENT_EVENT_RETENTION_DAYS`
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
