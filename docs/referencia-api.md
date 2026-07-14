# Referencia API

Documento de referencia para la API actual incluida en el boilerplate.

## Objetivo

Explicar:

- qué endpoints existen hoy
- qué hacen
- qué esperan de entrada
- qué devuelven
- qué nivel de madurez tienen

## Principios

- los handlers son deliberadamente pequeños
- la lógica importante debe vivir fuera del route handler
- esta API representa una base, no una plataforma cerrada

## Endpoints actuales

### `GET /api/live`

Propósito:

- confirmar que el proceso HTTP está levantado y puede responder

Auth:

- no requerida

Uso típico:

- liveness probe de contenedor

Archivo:

- [src/app/api/live/route.ts](../src/app/api/live/route.ts)

### `GET /api/ready`

Propósito:

- exponer readiness operativa del servicio

Auth:

- no requerida

Uso típico:

- readiness probe de orquestador o reverse proxy

Archivo:

- [src/app/api/ready/route.ts](../src/app/api/ready/route.ts)

### `GET /api/health`

Propósito:

- healthcheck del servicio, base de datos y configuración de pagos requerida

Auth:

- no requerida

Respuesta esperada:

```json
{
  "status": "ok",
  "checks": {
    "app": "ok",
    "database": "ok",
    "payments": "ok"
  },
  "modules": ["marketing", "commerce", "saas"],
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

`status` puede ser `ok`, `degraded` o `error`. En producción, pagos incompletos para proveedores requeridos devuelven `degraded`.
La respuesta incluye `configurationIssues` cuando el entorno de producción usa secretos placeholder, no declara `BUILD_SHA` o tiene configuración crítica inválida.

Uso típico:

- readiness check
- verificación de módulos cargados

Estado de madurez:

- funcional como base operativa

Archivo:

- [src/app/api/health/route.ts](../src/app/api/health/route.ts)

### `GET /api/account/me`

Propósito:

- devolver la cuenta autenticada actual

Auth:

- requerida

Respuesta esperada:

```json
{
  "id": "uuid",
    "email": "user@example.com",
  "name": "User Name",
  "imageUrl": "https://...",
  "role": "user"
}
```

Errores posibles:

- `401 Unauthorized`

Uso típico:

- hidratar estado inicial de cuenta
- comprobar sesión y rol

Estado de madurez:

- funcional como base

Archivo:

- [src/app/api/account/me/route.ts](../src/app/api/account/me/route.ts)

### `GET /api/admin/users`

Propósito:

- devolver una lista inicial de usuarios internos

Auth:

- requerida

Autorización:

- requiere rol admin

Respuesta esperada:

```json
{
  "users": [
    {
      "id": "uuid",
            "email": "user@example.com",
      "name": "User Name",
      "imageUrl": "https://...",
      "role": "admin",
      "active": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "lastSignInAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

Errores posibles:

- `401 Unauthorized`
- `403 Forbidden`

Uso típico:

- panel admin inicial
- operación interna básica

Estado de madurez:

- funcional, pero todavía no es un panel admin completo

Archivo:

- [src/app/api/admin/users/route.ts](../src/app/api/admin/users/route.ts)

### `GET /api/admin/overview`

Propósito:

- devolver el resumen operativo completo del backoffice

Auth:

- requerida

Autorización:

- requiere rol admin

Incluye:

- métricas de usuarios, sesiones, workspaces, productos y órdenes
- revenue pagado agregado
- readiness de configuración de producción
- módulos instalados
- providers de pago habilitados
- analítica de los últimos 14 días
- eventos recientes

Errores posibles:

- `401 Unauthorized`
- `403 Forbidden`
- `429 Too many requests`

Archivo:

- [src/app/api/admin/overview/route.ts](../src/app/api/admin/overview/route.ts)

### `POST /api/analytics/events`

Propósito:

- registrar eventos de analítica de primera parte

Auth:

- opcional

Body esperado:

```json
{
  "eventName": "page_view",
  "sessionId": "uuid-local",
  "path": "/pricing",
  "referrer": "https://example.com",
  "properties": {
    "title": "Pricing"
  }
}
```

Reglas:

- `eventName` debe usar caracteres estables para analítica
- `path` debe ser interno y empezar por `/`
- no se almacena IP por defecto
- si existe sesión, se asocia el `userId`

Errores posibles:

- `400` por body inválido
- `429 Too many requests`

Archivo:

- [src/app/api/analytics/events/route.ts](../src/app/api/analytics/events/route.ts)

### `POST /api/auth/*`

Propósito:

- exponer el handler de Better Auth para sign-in, sign-up, sign-out y sesión

Auth:

- depende de la operación concreta

Archivo:

- [src/app/api/auth/[...all]/route.ts](../src/app/api/auth/[...all]/route.ts)

### `POST /api/payments/checkout`

Propósito:

- crear una sesión de checkout unificada para Stripe o PayPal

Auth:

- sesión autenticada requerida

Nota:

- el cliente no envía importes; el backend resuelve el precio interno desde PostgreSQL

Body esperado:

```json
{
  "provider": "stripe",
  "priceId": "00000000-0000-0000-0000-000000000000",
  "successPath": "/dashboard",
  "cancelPath": "/"
}
```

Reglas actuales:

- `provider` debe ser `stripe` o `paypal`
- `priceId` debe existir, estar activo y pertenecer al provider seleccionado
- `successPath` y `cancelPath` deben ser rutas internas que empiecen por `/` y no por `//`

Respuesta esperada:

```json
{
  "provider": "stripe",
  "sessionId": "cs_xxx",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "orderId": "00000000-0000-0000-0000-000000000000"
}
```

Comportamiento actual:

- si faltan credenciales reales del provider, puede devolver una sesión mock solo en desarrollo
- en producción, las credenciales del provider son obligatorias
- la orden queda persistida y los webhooks actualizan su estado por identificador externo

Errores posibles:

- `400` por body inválido
- errores del provider externo

Uso típico:

- checkout inicial desacoplado del proveedor

Estado de madurez:

- base de producción inicial con persistencia de orden y webhooks de provider

Archivo:

- [src/app/api/payments/checkout/route.ts](../src/app/api/payments/checkout/route.ts)

## Seguridad actual

### Auth

La protección de rutas privadas se apoya en Better Auth y en [src/proxy.ts](../src/proxy.ts).

### Rate limiting

La base incluye rate limiting para:

- operaciones mutantes de `POST /api/auth/*`
- `POST /api/payments/checkout`
- `GET /api/admin/users`
- `GET /api/admin/overview`
- `POST /api/analytics/events`

En desarrollo usa memoria por defecto. En producción, `RATE_LIMIT_BACKEND=database` activa buckets atómicos compartidos en PostgreSQL y `TRUST_PROXY_HEADERS=true` permite leer la IP que debe sobrescribir el reverse proxy confiable.

### Admin

La API admin valida:

- autenticación
- rol admin

### Checkout

El endpoint de checkout ya no acepta redirects externos arbitrarios. Solo admite rutas internas.

Los webhooks registran cada evento en `payment_events` y aplican el cambio de orden dentro de la misma transacción. Los reintentos del proveedor son idempotentes y una orden pagada no retrocede a `failed` o `cancelled`.

## Limitaciones actuales

- no existe versionado formal de API
- no hay documentación OpenAPI/Swagger
- no hay capa avanzada de errores normalizados
- falta reconciliación periódica de pagos para cubrir eventos perdidos

## Próximos pasos recomendados

1. documentar errores de forma más formal
2. añadir reconciliación periódica de pagos
3. valorar versionado de API si el proyecto crece

## Relación con el core

La API actual depende sobre todo de:

- [src/lib/auth/server.ts](../src/lib/auth/server.ts)
- [src/lib/payments/index.ts](../src/lib/payments/index.ts)
- [src/lib/modules/loader.ts](../src/lib/modules/loader.ts)
