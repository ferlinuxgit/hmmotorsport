# Universal Boilerplate

Boilerplate de `Next.js` orientado a construir webapps universales: marketing sites, e-commerce y SaaS sobre una base común, extensible y preparada para crecer sin rehacer la arquitectura.

## Documentación

La documentación del proyecto vive en [docs/README.md](/root/projects/baseboilerplate/docs/README.md).

Lecturas recomendadas:

- [Visión global](/root/projects/baseboilerplate/docs/vision-global.md)
- [Arquitectura](/root/projects/baseboilerplate/docs/arquitectura.md)
- [Estado actual](/root/projects/baseboilerplate/docs/estado-actual.md)
- [Excelencia 10/10](/root/projects/baseboilerplate/docs/excelencia-10-10.md)
- [Onboarding](/root/projects/baseboilerplate/docs/onboarding.md)
- [Roadmap](/root/projects/baseboilerplate/docs/roadmap.md)

## Stack

- `Next.js` con `App Router`
- `Tailwind CSS` + estructura compatible con `shadcn/ui`
- `PostgreSQL`
- `Drizzle ORM`
- `Clerk` para autenticación y gestión de usuarios
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
3. Configura Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`)
4. Instala dependencias con `npm install`
5. Sincroniza módulos con `npm run modules:sync`
6. Ejecuta `npm run dev`

## Estado actual del core

- La configuración sensible se valida en runtime de servidor, no en import global
- La conexión a PostgreSQL se inicializa de forma lazy
- Checkout solo acepta redirects internos que empiecen por `/`
- La sincronización básica con Clerk evita escribir en base de datos en cada request si no hay cambios
- `npm install`, `npm run lint`, `npm run typecheck` y `npm run build` ya fueron validados

## Despliegue con Docker y Coolify

- `Dockerfile` genera una imagen lista para producción
- `docker-compose.coolify.yml` define el stack de `app + postgres`
- Puedes usar PostgreSQL interno o externo según `.env`

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

En modo `external`, el servicio `postgres` puede seguir existiendo en el stack pero la app no lo usará.

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
- `GET /api/account/me`
- `GET /api/admin/users`
- `POST /api/payments/checkout`

## Auth con Clerk

- Define `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`
- El provider global vive en `src/app/layout.tsx`
- La protección de rutas vive en `src/proxy.ts`
- Las cuentas autenticadas se sincronizan con la tabla `users`
- El rol admin se controla con `publicMetadata.role = "admin"` en Clerk
- Las rutas base incluidas son `/sign-in`, `/sign-up`, `/account`, `/dashboard` y `/admin`

## Pendientes típicos al usarla en un producto real

- Crear paneles reales para contenido, catálogo o billing
- Añadir autorización más fina por workspace/roles
- Añadir webhooks de Clerk para sincronización completa de usuarios
- Definir migraciones y seeds iniciales

## Hacia la excelencia

La base ya está en un estado serio y reutilizable, pero todavía no es `10/10`.

El gap principal está en:

- migraciones y seeds
- sync robusta de identidad
- RBAC más fino
- tests automatizados
- observabilidad y operación

La explicación detallada está en [docs/excelencia-10-10.md](/root/projects/baseboilerplate/docs/excelencia-10-10.md).
