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

### `GET /api/health`

Propósito:

- healthcheck básico del servicio

Auth:

- no requerida

Respuesta esperada:

```json
{
  "status": "ok",
  "modules": ["marketing", "commerce", "saas"],
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Uso típico:

- healthcheck simple
- verificación de módulos cargados

Estado de madurez:

- básico

Archivo:

- [src/app/api/health/route.ts](/root/projects/baseboilerplate/src/app/api/health/route.ts)

### `GET /api/account/me`

Propósito:

- devolver la cuenta autenticada actual

Auth:

- requerida

Respuesta esperada:

```json
{
  "id": "uuid",
  "clerkId": "user_xxx",
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

- [src/app/api/account/me/route.ts](/root/projects/baseboilerplate/src/app/api/account/me/route.ts)

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
      "clerkId": "user_xxx",
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

- [src/app/api/admin/users/route.ts](/root/projects/baseboilerplate/src/app/api/admin/users/route.ts)

### `POST /api/payments/checkout`

Propósito:

- crear una sesión de checkout unificada para Stripe o PayPal

Auth:

- no requerida actualmente

Nota:

- esto es una base técnica, no un flujo de negocio cerrado

Body esperado:

```json
{
  "provider": "stripe",
  "amount": 29.99,
  "currency": "USD",
  "description": "Pro Plan",
  "successPath": "/dashboard",
  "cancelPath": "/"
}
```

Reglas actuales:

- `provider` debe ser `stripe` o `paypal`
- `amount` debe ser positivo
- `currency` debe tener longitud 3
- `description` debe tener al menos 3 caracteres
- `successPath` y `cancelPath` deben ser rutas internas que empiecen por `/`

Respuesta esperada:

```json
{
  "provider": "stripe",
  "sessionId": "cs_xxx",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

Comportamiento actual:

- si faltan credenciales reales del provider, puede devolver una sesión mock de desarrollo

Errores posibles:

- `400` por body inválido
- errores del provider externo

Uso típico:

- checkout inicial desacoplado del proveedor

Estado de madurez:

- buena base, no flujo completo de producción

Archivo:

- [src/app/api/payments/checkout/route.ts](/root/projects/baseboilerplate/src/app/api/payments/checkout/route.ts)

## Seguridad actual

### Auth

La protección de rutas privadas se apoya en Clerk y en [src/proxy.ts](/root/projects/baseboilerplate/src/proxy.ts).

### Admin

La API admin valida:

- autenticación
- rol admin

### Checkout

El endpoint de checkout ya no acepta redirects externos arbitrarios. Solo admite rutas internas.

## Limitaciones actuales

- no existe versionado formal de API
- no hay documentación OpenAPI/Swagger
- no hay webhooks implementados todavía
- no hay capa avanzada de errores normalizados
- el flujo de checkout todavía no persiste el ciclo completo de órdenes

## Próximos pasos recomendados

1. documentar errores de forma más formal
2. añadir webhooks de Clerk
3. añadir webhooks de Stripe
4. persistir estados de checkout y órdenes
5. valorar versionado de API si el proyecto crece

## Relación con el core

La API actual depende sobre todo de:

- [src/lib/auth/server.ts](/root/projects/baseboilerplate/src/lib/auth/server.ts)
- [src/lib/payments/index.ts](/root/projects/baseboilerplate/src/lib/payments/index.ts)
- [src/lib/modules/loader.ts](/root/projects/baseboilerplate/src/lib/modules/loader.ts)

