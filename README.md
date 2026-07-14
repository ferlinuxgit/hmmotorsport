# Universal Boilerplate

Boilerplate de `Next.js` orientado a construir webapps universales: marketing sites, e-commerce y SaaS sobre una base común, extensible y preparada para crecer sin rehacer la arquitectura.

## Documentación

La documentación del proyecto vive en [docs/README.md](docs/README.md).

Lecturas recomendadas:

- [Visión global](docs/vision-global.md)
- [Arquitectura](docs/arquitectura.md)
- [Estado actual](docs/estado-actual.md)
- [Excelencia 10/10](docs/excelencia-10-10.md)
- [Onboarding](docs/onboarding.md)
- [Guía para IA](docs/guia-ia.md)
- [Producción](docs/produccion.md)
- [Roadmap](docs/roadmap.md)

## Stack

- `Next.js` con `App Router`
- `Tailwind CSS` + estructura compatible con `shadcn/ui`
- `PostgreSQL`
- `Drizzle ORM`
- `Better Auth` para autenticación y sesiones
- Integración de pagos con `Stripe` y `PayPal`
- Arquitectura de módulos auto-registrados

## Principios de la base

- El core vive en `src/lib`, `src/app` y `src/components`
- Las extensiones viven en `src/extensions/<modulo>`
- No hace falta modificar el core para añadir navegación, secciones o capacidades de producto
- `scripts/sync-modules.mjs` genera `src/modules/generated.ts` a partir de los módulos detectados

## Visión

La visión del proyecto es mantener un core pequeño y estable capaz de soportar varias verticales de producto:

- marketing
- commerce
- SaaS

La estrategia no es meter todo en el core, sino permitir que las diferencias de negocio vivan en módulos y que el núcleo resuelva solo las capacidades transversales.

## Arranque local

1. Copia `.env.example` a `.env`
2. Levanta PostgreSQL con `docker compose up -d`
3. Configura Better Auth (`BETTER_AUTH_SECRET` y `BETTER_AUTH_URL`)
4. Instala dependencias con `npm install`
5. Aplica migraciones con `npm run db:migrate`
6. Carga datos iniciales con `npm run db:seed`
7. Sincroniza módulos con `npm run modules:sync`
8. Ejecuta `npm run dev`

En producción configura `RATE_LIMIT_BACKEND=database`, `TRUST_PROXY_HEADERS=true` detrás de un proxy confiable y programa `npm run db:maintenance`.

## Estado actual del core

- La configuración sensible se valida en runtime de servidor, no en import global
- La conexión a PostgreSQL se inicializa de forma lazy
- La base SEO incluye metadata global, Open Graph, sitemap, robots y manifest
- Checkout solo acepta redirects internos que empiecen por `/`
- Better Auth reutiliza la tabla `users` del dominio interno y añade `accounts`, `sessions` y `verifications`
- `npm install`, `npm run lint`, `npm run typecheck` y `npm run build` ya fueron validados
- El core incluye liveness, readiness, logs estructurados y cabeceras de seguridad base
- El core incluye rate limiting distribuido para auth, checkout, analítica y endpoints administrativos
- Los webhooks son idempotentes y conservan un historial mínimo en `payment_events`
- El CI ejecuta lint, tipos, tests, build, audit, Docker build y smoke HTTP

## Despliegue con Docker y Coolify

- `Dockerfile` genera una imagen lista para producción
- `docker-compose.coolify.yml` define el stack interno de `app + postgres`
- `docker-compose.external.yml` define un stack solo app para PostgreSQL gestionado o externo
- El contenedor ejecuta migraciones al arrancar si `RUN_MIGRATIONS=true`

### Modos de base de datos

#### Base de datos interna

```env
DATABASE_MODE=internal
DATABASE_URL=
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=baseboilerplate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SSL=false
```

#### Base de datos externa

```env
DATABASE_MODE=external
DATABASE_URL=postgres://user:password@host:5432/database
```

En modo `external`, usa `docker-compose.external.yml` para evitar levantar o esperar un Postgres interno.

## Estructura

```text
src/
  app/                  # UI y route handlers
  components/           # UI base y shells
  extensions/           # módulos enchufables
  lib/
    config/             # configuración tipada
    db/                 # cliente y esquemas Drizzle
    modules/            # contratos y loader
    payments/           # abstracción de providers
```

## Extender sin tocar el core

1. Crea `src/extensions/mi-modulo/module.ts`
2. Exporta `moduleDefinition` cumpliendo `AppModule`
3. Ejecuta `npm run modules:sync`
4. El módulo aparecerá en navegación, home y dashboard

## API incluida

- `GET /api/health`
- `GET /api/live`
- `GET /api/ready`
- `GET /api/account/me`
- `GET /api/admin/users`
- `GET /api/admin/overview`
- `POST /api/analytics/events`
- `POST /api/auth/*`
- `POST /api/payments/checkout`
- `POST /api/payments/webhooks/stripe`
- `POST /api/payments/webhooks/paypal`

`POST /api/payments/checkout` requiere sesión autenticada y recibe un `priceId` interno, no importes enviados por el cliente. El backend resuelve precio/producto desde PostgreSQL, crea una orden interna y adjunta el identificador externo del proveedor.

## Auth con Better Auth

- Define `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL`
- La ruta de autenticación vive en `src/app/api/auth/[...all]/route.ts`
- La protección de rutas vive en `src/proxy.ts` y la validación fuerte en servidor
- Las cuentas autenticadas se sincronizan con la tabla `users`
- El rol admin se resuelve por la columna `role` y por `AUTH_ADMIN_EMAILS`
- Las rutas base incluidas son `/sign-in`, `/sign-up`, `/account`, `/dashboard` y `/admin`

## Backoffice y analítica

- `/admin` incluye un backoffice operativo para usuarios, sesiones, órdenes, billing, módulos, readiness y analítica.
- `GET /api/admin/overview` expone el resumen para integraciones internas protegidas por rol admin.
- El tracker de primera parte registra `page_view` en `analytics_events` mediante `POST /api/analytics/events`.
- La analítica no almacena IP por defecto y usa `sessionId` local para métricas agregadas.

## Pendientes típicos al usarla en un producto real

- Crear paneles reales para contenido, catálogo o billing
- Ampliar autorización por workspace a recursos concretos de cada producto
- Añadir reconciliación periódica de pagos además de webhooks

## Hacia la excelencia

Como boilerplate base para construir websites y webapps, la base ya alcanza un nivel de producción alto:

- despliegue reproducible
- migraciones runtime comprobadas
- healthchecks y smoke Docker reales
- validación explícita de configuración de producción
- rate limiting distribuido en endpoints sensibles
- webhooks idempotentes y auditables
- backoffice completo de operación inicial
- analítica interna de primera parte
- SEO técnico base
- observabilidad y trazabilidad iniciales

Lo que sigue faltando ya no pertenece al boilerplate genérico, sino al producto concreto que se construya encima:

- paneles reales de negocio
- métricas y alertas del entorno final
- tests de integración específicos del dominio

El detalle operativo vive en [docs/excelencia-10-10.md](docs/excelencia-10-10.md) y [docs/produccion.md](docs/produccion.md).
