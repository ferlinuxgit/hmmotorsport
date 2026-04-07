# Referencia de entorno

Documento de referencia para todas las variables de entorno relevantes del boilerplate.

## Objetivo

Este archivo explica:

- qué variables existen
- cuáles son obligatorias
- en qué contexto se usan
- qué comportamiento controlan

## Principio general

No todas las variables se validan al mismo tiempo.

La configuración está separada por dominios:

- app
- Clerk
- base de datos
- pagos

Esto evita que el proyecto falle por cargar secretos o infraestructura que una ruta concreta no necesita.

## Variables de aplicación

### `APP_NAME`

Propósito:

- nombre visible de la aplicación

Uso:

- branding básico
- textos del layout

Ejemplo:

```env
APP_NAME=Universal Boilerplate
```

### `APP_URL`

Propósito:

- URL base pública de la aplicación

Uso:

- construcción de URLs absolutas
- redirects de checkout
- integración con servicios externos

Ejemplo:

```env
APP_URL=http://localhost:3000
```

En producción debe apuntar al dominio real.

## Variables de Clerk

### `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

Propósito:

- clave pública de Clerk

Uso:

- integración cliente y provider

Obligatoria:

- sí

### `CLERK_SECRET_KEY`

Propósito:

- clave privada de Clerk

Uso:

- operaciones de servidor
- autenticación robusta

Obligatoria:

- sí

### `NEXT_PUBLIC_CLERK_SIGN_IN_URL`

Propósito:

- ruta de entrada al sign-in

Valor por defecto:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
```

### `NEXT_PUBLIC_CLERK_SIGN_UP_URL`

Propósito:

- ruta de entrada al sign-up

Valor por defecto:

```env
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`

Propósito:

- redirect por defecto tras login

Valor por defecto:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
```

### `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`

Propósito:

- redirect por defecto tras registro

Valor por defecto:

```env
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

## Variables de base de datos

## `DATABASE_MODE`

Propósito:

- definir si la app usa PostgreSQL interno o externo

Valores permitidos:

- `internal`
- `external`

Ejemplo:

```env
DATABASE_MODE=internal
```

### `DATABASE_URL`

Propósito:

- cadena de conexión completa a PostgreSQL

Uso:

- se usa directamente en modo `external`
- en modo `internal` puede sobrescribir la construcción automática

Ejemplo:

```env
DATABASE_URL=postgres://user:password@host:5432/database
```

### `POSTGRES_HOST`

Propósito:

- host del servicio Postgres cuando se usa modo `internal`

Valor típico:

```env
POSTGRES_HOST=postgres
```

### `POSTGRES_PORT`

Propósito:

- puerto del servicio Postgres

Valor típico:

```env
POSTGRES_PORT=5432
```

### `POSTGRES_DB`

Propósito:

- nombre de la base de datos

Valor típico:

```env
POSTGRES_DB=baseboilerplate
```

### `POSTGRES_USER`

Propósito:

- usuario de PostgreSQL

Valor típico:

```env
POSTGRES_USER=postgres
```

### `POSTGRES_PASSWORD`

Propósito:

- contraseña de PostgreSQL

Valor típico:

```env
POSTGRES_PASSWORD=postgres
```

En producción no debe usarse el valor por defecto.

### `POSTGRES_SSL`

Propósito:

- activar conexión SSL al construir la URL interna

Valores permitidos:

- `true`
- `false`

Ejemplo:

```env
POSTGRES_SSL=false
```

## Variables de pagos

### `STRIPE_SECRET_KEY`

Propósito:

- clave privada de Stripe

Uso:

- creación de checkout sessions reales

Comportamiento actual:

- si no existe, el provider devuelve una sesión mock de desarrollo

### `STRIPE_WEBHOOK_SECRET`

Propósito:

- verificación de webhooks de Stripe

Estado actual:

- prevista para evolución futura
- todavía no hay webhook implementado

### `PAYPAL_CLIENT_ID`

Propósito:

- client id de PayPal

Uso:

- autenticación OAuth del provider

### `PAYPAL_CLIENT_SECRET`

Propósito:

- secreto del client de PayPal

Uso:

- autenticación OAuth del provider

### `PAYPAL_ENVIRONMENT`

Propósito:

- seleccionar entorno de PayPal

Valores permitidos:

- `sandbox`
- `live`

Ejemplo:

```env
PAYPAL_ENVIRONMENT=sandbox
```

## Configuraciones recomendadas por entorno

## Desarrollo local

```env
APP_NAME=Universal Boilerplate
APP_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
DATABASE_MODE=internal
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=baseboilerplate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SSL=false
PAYPAL_ENVIRONMENT=sandbox
```

## Producción con Postgres interno

```env
APP_URL=https://tu-dominio.com
DATABASE_MODE=internal
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=baseboilerplate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=una-password-segura
POSTGRES_SSL=false
```

## Producción con Postgres externo

```env
APP_URL=https://tu-dominio.com
DATABASE_MODE=external
DATABASE_URL=postgres://user:password@host:5432/database
POSTGRES_SSL=true
```

## Notas importantes

- `APP_URL` debe ser correcta o los redirects absolutos fallarán
- `DATABASE_MODE` debe estar definido de forma explícita en cada entorno
- los secretos de producción no deben reutilizar valores de desarrollo
- si activas pagos reales, debes revisar también webhooks y persistencia de órdenes

## Relación con el código

La resolución actual de entorno vive principalmente en:

- [src/lib/config/env.ts](/root/projects/baseboilerplate/src/lib/config/env.ts)
- [src/lib/config/database.ts](/root/projects/baseboilerplate/src/lib/config/database.ts)

