# Modelo de datos

## Propósito

Explicar el modelo de datos actual del boilerplate, su intención y cómo está organizado.

No es un ERD formal completo, pero sí una guía práctica de lectura y evolución.

## Filosofía del modelo actual

El modelo intenta cubrir tres necesidades desde la base:

- identidad y workspaces
- contenido público
- commerce y billing
- analítica de primera parte

Esto permite soportar varios tipos de producto sin rehacer las entidades fundamentales.

## Organización del schema

El schema se divide hoy en dos archivos principales:

- [src/lib/db/schema/core.ts](../src/lib/db/schema/core.ts)
- [src/lib/db/schema/billing.ts](../src/lib/db/schema/billing.ts)

## Dominio `core`

## `users`

Representa la cuenta interna de usuario de la aplicación.

Campos principales:

- `id`
- `email`
- `name`
- `imageUrl`
- `emailVerified`
- `role`
- `active`
- `lastSignInAt`
- `createdAt`
- `updatedAt`

Intención:

- desacoplar el dominio interno de Better Auth
- mantener una referencia local para permisos, relaciones y evolución futura

Notas:

- `email` es único
- el rol actual es simple: `user` o `admin`

## `workspaces`

Representa una unidad de tenancy o espacio de trabajo.

Campos principales:

- `id`
- `slug`
- `name`
- `ownerId`
- `createdAt`

Intención:

- permitir multi-tenancy desde el inicio

Notas:

- `ownerId` apunta a `users.id`
- no todo producto usará workspaces intensivamente desde el primer día, pero la base queda preparada

## `workspace_members`

Relaciona usuarios con workspaces.

Campos principales:

- `id`
- `workspaceId`
- `userId`
- `membershipRole`
- `createdAt`

Intención:

- soportar membresía por workspace
- base para RBAC futuro

Notas:

- la autorización actual todavía no explota todo este potencial

## `content_pages`

Representa contenido público editable.

Campos principales:

- `id`
- `slug`
- `title`
- `summary`
- `body`
- `publishedAt`
- `createdAt`

Intención:

- soportar marketing pages, páginas editoriales, pricing, changelog o contenido institucional

Notas:

- todavía no existe un CMS interno que gestione esta tabla

## `analytics_events`

Representa eventos de analítica de primera parte.

Campos principales:

- `id`
- `eventName`
- `sessionId`
- `userId`
- `path`
- `referrer`
- `userAgent`
- `properties`
- `createdAt`

Intención:

- medir tráfico, uso y eventos de producto sin depender obligatoriamente de terceros
- alimentar el backoffice con métricas operativas
- asociar eventos a usuario cuando existe sesión

Notas:

- no almacena IP por defecto
- `properties` no debe contener secretos, tokens, datos de pago ni payloads sensibles
- para varias réplicas no hace falta cambiar el modelo, solo cuidar el volumen y retención

## Dominio `billing`

## `products`

Representa productos comercializables.

Campos principales:

- `id`
- `workspaceId`
- `slug`
- `name`
- `description`
- `active`
- `createdAt`

Intención:

- base para catálogo de productos físicos o digitales

Notas:

- puede asociarse a un workspace, lo cual abre la puerta a modelos multi-tenant

## `prices`

Representa precios o planes asociados a un producto.

Campos principales:

- `id`
- `productId`
- `provider`
- `amount`
- `currency`
- `interval`
- `externalId`
- `createdAt`

Intención:

- separar producto de precio
- permitir coexistencia de diferentes providers y modelos de cobro

Notas:

- `externalId` sirve para mapear entidades de Stripe/PayPal u otros providers
- `interval` queda reservado para una extensión futura de suscripciones; el checkout base actual es de pago único

## `payment_events`

Registro idempotente y auditable de eventos verificados de Stripe y PayPal. La combinación `provider + eventId` es única y el registro se escribe en la misma transacción que el cambio de estado de la orden.

## `rate_limit_buckets`

Buckets compartidos de rate limiting para despliegues con múltiples réplicas. Los registros expirados se eliminan con `npm run db:maintenance`.

## `orders`

Representa órdenes o intenciones de compra.

Campos principales:

- `id`
- `workspaceId`
- `userId`
- `provider`
- `status`
- `total`
- `currency`
- `externalId`
- `createdAt`

Intención:

- base para persistir el ciclo comercial

Notas:

- todavía no existe cierre completo del flujo de órdenes por webhooks o reconciliación

## Relaciones principales

```text
users
  ├─ owns ─────────────> workspaces
  ├─ belongs to ───────> workspace_members
  └─ may create ───────> orders

workspaces
  ├─ has members ──────> workspace_members
  ├─ may own ──────────> products
  └─ may own ──────────> orders

products
  └─ has many ─────────> prices
```

## Qué modela bien hoy

- identidad base
- multi-tenancy inicial
- contenido público
- catálogo inicial
- órdenes básicas
- analítica interna inicial

## Qué todavía no modela del todo

- permisos finos por workspace
- auditoría avanzada de acciones administrativas
- suscripciones completas
- estados ricos de pago y lifecycle
- organización editorial más avanzada

## Evolución recomendada

### Fase 1

- mantener una sola migración inicial mientras el boilerplate no tenga instalaciones reales
- añadir seeds

### Fase 2

- enriquecer RBAC por workspace
- añadir tablas de billing más completas si el producto lo necesita

### Fase 3

- añadir auditoría, eventos y trazabilidad
- separar dominios adicionales si aparecen nuevos bounded contexts

## Reglas para evolucionar el modelo

- no mezclar dominios sin necesidad
- no duplicar fuentes de verdad
- no modelar de forma “global” algo que probablemente será tenant-aware
- documentar cada ampliación importante
