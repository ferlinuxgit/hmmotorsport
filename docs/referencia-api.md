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
    "configuration": "ok",
    "database": "ok",
    "payments": "ok",
    "jobs": "ok",
    "notifications": "ok",
    "storage": "ok"
  },
  "modules": ["marketing", "commerce", "saas"],
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

`status` puede ser `ok`, `degraded` o `error`. Jobs atrasados, entregas fallidas o pagos incompletos pueden degradar el
servicio; base de datos o configuración de producción inválidas producen error.
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

### `GET /api/account/export`

Devuelve a la cuenta autenticada un JSON descargable con su perfil, workspaces, membresías, órdenes, entitlements y
archivos. No incluye hashes, tokens de sesión, credenciales ni secretos de providers.

Uso típico:

- hidratar estado inicial de cuenta
- comprobar sesión y rol

Estado de madurez:

- funcional como base

Archivo:

- [src/app/api/account/me/route.ts](../src/app/api/account/me/route.ts)

### `GET /api/admin/users`

Propósito:

- devolver usuarios internos con búsqueda, filtros y paginación

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
  ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 1,
    "pages": 1
  }
}
```

Query params:

- `q`: email o nombre
- `role`: `all`, `user` o `admin`
- `status`: `all`, `active` o `inactive`
- `page`: desde `1`
- `pageSize`: entre `1` y `100`

Errores posibles:

- `401 Unauthorized`
- `403 Forbidden`

Uso típico:

- panel admin inicial
- operación interna básica

Estado de madurez:

- funcional y paginado

Archivo:

- [src/app/api/admin/users/route.ts](../src/app/api/admin/users/route.ts)

### `PATCH /api/admin/users/:userId`

Propósito:

- cambiar el rol o estado activo de una cuenta

Auth y autorización:

- requiere sesión y rol admin

Body:

```json
{
  "role": "admin",
  "active": true
}
```

Al menos uno de los campos debe estar presente. La operación impide retirar el propio acceso y desactivar o degradar el
último administrador activo. El cambio y `user.updated` se escriben en una sola transacción.

Errores posibles:

- `400` payload inválido
- `401` sesión ausente
- `403` rol u origen inválido
- `404` usuario inexistente
- `409` autoprotección o último administrador
- `429` rate limit

### `GET /api/admin/audit`

Propósito:

- consultar el historial paginado de acciones administrativas

Auth y autorización:

- requiere sesión y rol admin

Query params:

- `q`: acción, entidad, identificador o email del actor
- `action`: nombre exacto de acción
- `page`: desde `1`
- `pageSize`: entre `1` y `100`

### Workspaces administrativos

Endpoints:

- `GET /api/admin/workspaces`: búsqueda, estado y paginación
- `POST /api/admin/workspaces`: crea un workspace y su membership owner
- `GET /api/admin/workspaces/:workspaceId`: detalle y miembros
- `PATCH /api/admin/workspaces/:workspaceId`: nombre, slug, estado o transferencia de ownership
- `POST /api/admin/workspaces/:workspaceId/members`: añade una cuenta activa
- `PATCH /api/admin/workspaces/:workspaceId/members/:userId`: cambia rol `admin` o `member`
- `DELETE /api/admin/workspaces/:workspaceId/members/:userId`: retira una membresía
- `POST /api/admin/workspaces/:workspaceId/invitations`: crea una invitación y encola su email
- `DELETE /api/admin/workspaces/:workspaceId/invitations/:invitationId`: revoca una invitación pendiente
- `POST /api/invitations/accept`: acepta la invitación para la cuenta autenticada del mismo email

Todas las mutaciones requieren sesión admin, origen válido, rate limit y payload validado. El owner no puede degradarse ni
eliminarse mediante endpoints de membresía; debe transferirse el ownership. Cambios y auditoría comparten transacción.

Los tokens de invitación se firman, sólo se guarda su hash y nunca se devuelven desde la API administrativa. El email se
entrega de forma asíncrona mediante `background_jobs`. La aceptación rechaza enlaces manipulados, expirados, revocados,
ya consumidos o abiertos desde otra identidad.

### Archivos privados

- `POST /api/files`: reserva un asset con `filename`, `mimeType`, `sizeBytes` y `workspaceId` opcional
- `PUT /api/files/:fileId/content`: recibe el cuerpo binario y exige el MIME y tamaño declarados
- `GET /api/files/:fileId/content`: entrega el objeto tras validar cuenta o membership
- `DELETE /api/files/:fileId`: elimina el objeto y conserva metadata mínima de auditoría
- `GET /api/files`: lista assets propios o los de `?workspaceId=`
- `GET /api/admin/files`: listado administrativo paginado y filtrable

Las mutaciones requieren origen same-origin y rate limit. El servidor genera el object key, limita el body antes de
materializarlo, calcula SHA-256 y nunca acepta rutas de almacenamiento enviadas por el cliente.

### Jobs administrativos

- `GET /api/admin/jobs`: consulta paginada por estado, tipo o deduplication key
- `PATCH /api/admin/jobs/:jobId`: cancela jobs en espera o reintenta estados terminales permitidos
- `POST /api/internal/jobs/run`: protegido por `JOB_RUNNER_SECRET`; encola el sweep de reconciliación y ejecuta un batch

### Configuración runtime

- `GET /api/config`: devuelve únicamente settings públicos y flags evaluados para el subject actual
- `GET /api/admin/configuration`: lista definiciones, valores, versiones y overrides
- `PATCH /api/admin/configuration/settings/:key`: cambia un setting con `expectedVersion`
- `PATCH /api/admin/configuration/flags/:key`: cambia estado o rollout con `expectedVersion`
- `PUT|DELETE /api/admin/configuration/flags/:key/workspaces/:workspaceId`: establece o retira un override

Las claves disponibles proceden del registro de módulos; una clave desconocida o duplicada falla de forma explícita.

### Contenido

- `GET|POST /api/admin/content`: consulta o crea páginas draft
- `GET|PATCH /api/admin/content/:pageId`: obtiene y actualiza contenido, SEO, estado y versión
- `GET /pages/:slug`: render público, sólo para contenido `published`

### Comercio y billing

- `GET|POST /api/admin/commerce/products`: catálogo paginado y creación
- `GET|PATCH /api/admin/commerce/products/:productId`: detalle y edición optimista
- `POST /api/admin/commerce/products/:productId/prices`: crea un precio de pago único
- `PATCH /api/admin/commerce/prices/:priceId`: activa o desactiva un precio versionado
- `GET /api/admin/commerce/orders`: órdenes paginadas y filtrables
- `GET /api/admin/billing`: entitlements y reembolsos recientes
- `POST /api/admin/billing/orders/:orderId/refunds`: solicita un reembolso idempotente y asíncrono
- `POST /api/admin/billing/orders/:orderId/reconcile`: encola reconciliación de una orden

El campo `interval` no admite `month` o `year` en el contrato base: los adaptadores incluidos operan pagos únicos y no
simulan suscripciones.

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

- exponer el handler de Better Auth para sign-in, sign-up, verificación de email, recuperación, cambio de contraseña,
  sign-out y sesión

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

- flujo base de pago único con orden persistida, webhooks, reconciliación, reembolsos y entitlements

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
- `PATCH /api/admin/users/:userId`
- `GET /api/admin/audit`
- `GET /api/admin/overview`
- `POST /api/analytics/events`
- APIs de archivos, jobs, configuración, contenido, comercio y billing

En desarrollo usa memoria por defecto. En producción, `RATE_LIMIT_BACKEND=database` activa buckets atómicos compartidos en PostgreSQL y `TRUST_PROXY_HEADERS=true` permite leer la IP que debe sobrescribir el reverse proxy confiable.

### Admin

La API admin valida:

- autenticación
- rol admin
- origen de las mutaciones autenticadas por cookie
- tamaño y schema del payload
- autoprotección y conservación del último admin activo
- escritura transaccional del evento de auditoría

### Checkout

El endpoint de checkout ya no acepta redirects externos arbitrarios. Solo admite rutas internas.

Los webhooks registran cada evento en `payment_events` y aplican el cambio de orden dentro de la misma transacción. Los reintentos del proveedor son idempotentes y una orden pagada no retrocede a `failed` o `cancelled`.

## Límites deliberados

- no existe versionado formal porque la API todavía es interna a la aplicación
- no se genera OpenAPI automáticamente; conviene añadirlo cuando existan consumidores externos
- los errores administrativos comparten una respuesta estable, pero cada nueva vertical debe documentar sus códigos

## Relación con el core

La API actual depende sobre todo de:

- [src/lib/auth/server.ts](../src/lib/auth/server.ts)
- [src/lib/payments/index.ts](../src/lib/payments/index.ts)
- [src/lib/modules/loader.ts](../src/lib/modules/loader.ts)
