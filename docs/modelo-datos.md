# Modelo de datos

## Propósito

Explicar el modelo de datos actual del boilerplate, su intención y cómo está organizado.

No es un ERD formal completo, pero sí una guía práctica de lectura y evolución.

## Filosofía del modelo actual

El modelo intenta cubrir tres necesidades desde la base:

- identidad y workspaces
- contenido público
- commerce y billing

Esto permite soportar varios tipos de producto sin rehacer las entidades fundamentales.

## Organización del schema

El schema se divide hoy en dos archivos principales:

- [src/lib/db/schema/core.ts](/root/projects/baseboilerplate/src/lib/db/schema/core.ts)
- [src/lib/db/schema/billing.ts](/root/projects/baseboilerplate/src/lib/db/schema/billing.ts)

## Dominio `core`

## `users`

Representa la cuenta interna de usuario de la aplicación.

Campos principales:

- `id`
- `clerkId`
- `email`
- `name`
- `imageUrl`
- `role`
- `active`
- `lastSignInAt`
- `createdAt`
- `updatedAt`

Intención:

- desacoplar el dominio interno de Clerk
- mantener una referencia local para permisos, relaciones y evolución futura

Notas:

- `clerkId` es único
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

## Qué todavía no modela del todo

- permisos finos por workspace
- auditoría y eventos
- suscripciones completas
- estados ricos de pago y lifecycle
- organización editorial más avanzada

## Evolución recomendada

### Fase 1

- versionar migraciones del modelo actual
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

