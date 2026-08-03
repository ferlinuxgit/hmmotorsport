# Modelo de datos

## Propósito

Explicar el modelo de datos actual del boilerplate, su intención y cómo está organizado.

No es un ERD formal completo, pero sí una guía práctica de lectura y evolución.

## Filosofía del modelo actual

El modelo intenta cubrir capacidades transversales desde la base:

- identidad y workspaces
- contenido público
- commerce y billing
- analítica de primera parte
- auditoría administrativa

Esto permite soportar varios tipos de producto sin rehacer las entidades fundamentales.

## Organización del schema

El schema se divide hoy en seis archivos principales:

- [src/lib/db/schema/admin.ts](../src/lib/db/schema/admin.ts)
- [src/lib/db/schema/core.ts](../src/lib/db/schema/core.ts)
- [src/lib/db/schema/billing.ts](../src/lib/db/schema/billing.ts)
- [src/lib/db/schema/configuration.ts](../src/lib/db/schema/configuration.ts)
- [src/lib/db/schema/operations.ts](../src/lib/db/schema/operations.ts)
- [src/lib/db/schema/storage.ts](../src/lib/db/schema/storage.ts)

## Dominio `storage`

### `file_assets`

Metadatos de objetos privados: workspace opcional, uploader, nombre original saneado, object key generado por servidor,
MIME, tamaño, checksum SHA-256, provider y máquina de estados `pending → uploading → ready → deleting → deleted`. Las
relaciones y el endpoint de contenido aplican autorización sin depender de la URL del objeto.

## Dominio `operations`

### `background_jobs`

Cola persistente con tipo, payload JSON, prioridad, programación, estado, locks, intentos máximos, deduplicación y último
error. El claiming usa `FOR UPDATE SKIP LOCKED` para admitir workers concurrentes.

### `background_job_attempts`

Historial inmutable de cada ejecución con worker, número de intento, estado, error y tiempos de inicio y fin.

### `notifications`

Outbox de comunicaciones con canal, destinatario, template, payload estructurado, provider, identificador externo, estado,
error y timestamps. No contiene tokens de invitación en claro.

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
- `active`
- `createdAt`
- `updatedAt`

Intención:

- permitir multi-tenancy desde el inicio

Notas:

- `ownerId` apunta a `users.id`
- la FK usa `RESTRICT`: el ownership debe transferirse antes de eliminar la identidad propietaria
- el owner también conserva una membresía explícita con rol `owner`
- la desactivación preserva relaciones y auditoría; el backoffice no expone borrado físico
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
- resolver RBAC `owner`, `admin` y `member` en recursos tenant-aware

Los servicios consultan la fila de membership por `userId`; una ausencia de relación nunca concede acceso.

## `workspace_invitations`

Invitaciones revocables y expirables para incorporar cuentas a un workspace. Guarda rol de membership, email normalizado,
hash del token, actor que invita, cuenta que acepta y estado. La aceptación comprueba firma, hash, expiración e identidad
antes de crear la membresía en la misma transacción.

## `content_pages`

Representa contenido público editable.

Campos principales:

- `id`
- `slug`
- `title`
- `summary`
- `body`
- `seoTitle`, `seoDescription`
- `status`, `version`
- `publishedAt`, `updatedAt`
- `createdAt`

Intención:

- soportar marketing pages, páginas editoriales, pricing, changelog o contenido institucional

El backoffice aplica control optimista, estados `draft`, `published` y `archived`, y sólo expone públicamente la versión
publicada en `/pages/:slug`.

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

## `entitlements`

Derechos de acceso concedidos por una orden pagada. Cada fila pertenece exactamente a un usuario o a un workspace,
invariante reforzado con un `CHECK` de PostgreSQL. El reembolso total revoca el entitlement de la orden.

## `refunds`

Solicitudes idempotentes de reembolso con importe, moneda, motivo, estado, actor, identificador del provider y último
error. Se procesan mediante jobs reintentables y el backoffice permite observar su convergencia.

## `rate_limit_buckets`

Buckets compartidos de rate limiting para despliegues con múltiples réplicas. Los registros expirados se eliminan con `npm run db:maintenance`.

## Dominio `configuration`

### `runtime_settings`

Valores operativos registrados por el core o los módulos, validados según su definición y actualizados con versión
optimista. Cada cambio conserva actor y auditoría.

### `feature_flags`

Estado global y porcentaje de rollout determinista. Las claves duplicadas entre módulos provocan un error de registro en
lugar de sobrescribirse silenciosamente.

### `workspace_feature_flag_overrides`

Override explícito por workspace, único para cada combinación `flag + workspace`.

## Dominio `admin`

## `audit_logs`

Registro append-only a nivel de aplicación para mutaciones administrativas.

Campos principales:

- `actorUserId`
- `workspaceId`
- `action`
- `entityType`
- `entityId`
- `requestId`
- `ipAddress`
- `metadata`
- `createdAt`

Las acciones de usuario y su evento de auditoría se escriben en la misma transacción. `metadata` solo conserva el antes y
después operativo; no debe recibir contraseñas, tokens, secretos ni payloads completos de proveedores.

## `orders`

Representa órdenes o intenciones de compra.

Campos principales:

- `id`
- `workspaceId`
- `userId`
- `priceId`
- `provider`
- `status`
- `total`
- `currency`
- `externalId`
- `createdAt`

Intención:

- base para persistir el ciclo comercial

Las órdenes convergen por webhooks verificados o reconciliación periódica. Los cambios son monotónicos: una orden pagada
no vuelve a estados previos. Los reembolsos pueden llevarla a `refunded_partial` o `refunded`.

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

prices
  └─ selected by ──────> orders

orders
  ├─ grants ───────────> entitlements
  ├─ has many ─────────> refunds
  └─ receives ─────────> payment_events
```

## Qué modela bien hoy

- identidad base
- multi-tenancy inicial
- contenido público
- catálogo inicial
- órdenes básicas
- entitlements, refunds y lifecycle de pago único
- configuración runtime y feature flags
- analítica interna inicial
- auditoría administrativa

## Qué todavía no modela del todo

- permisos específicos de cada recurso dentro del workspace
- política de retención y exportación de auditoría según el producto
- suscripciones, invoices e impuestos
- permisos de recursos que todavía no existan en la vertical
- organización editorial más avanzada

## Evolución recomendada

### Al añadir una vertical

- crear migraciones incrementales; nunca reescribir las ya publicadas
- asociar recursos a usuario o workspace de forma explícita
- añadir índices según consultas reales y pruebas de integración para invariantes
- ampliar auditoría a cada mutación crítica

### Al añadir suscripciones

- crear un bounded context propio para subscriptions, invoices y ciclos del provider
- no reutilizar `prices.interval` como única fuente de verdad del lifecycle
- reconciliar webhooks con consultas periódicas y mantener idempotencia

## Reglas para evolucionar el modelo

- no mezclar dominios sin necesidad
- no duplicar fuentes de verdad
- no modelar de forma “global” algo que probablemente será tenant-aware
- documentar cada ampliación importante
