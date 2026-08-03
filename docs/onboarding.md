# Onboarding

Guía rápida para arrancar en este boilerplate y empezar a construir sin romper la base.

## Objetivo

Este proyecto está diseñado como base reusable para:

- webs estáticas o híbridas
- e-commerce
- SaaS
- productos multi-tenant

La regla principal es simple: extender sin degradar el core.

## Stack actual

- `Next.js` App Router
- `Tailwind CSS`
- base compatible con `shadcn/ui`
- `PostgreSQL`
- `Drizzle ORM`
- `Better Auth`
- `Stripe`
- `PayPal`
- despliegue con `Docker` y `Coolify`

## Estructura del proyecto

```text
src/
  app/                  # rutas, layouts y route handlers
  components/           # UI reusable
  extensions/           # módulos enchufables
  lib/
    admin/              # backoffice, consultas y mutaciones auditadas
    auth/               # auth, cuentas, roles
    config/             # acceso tipado a entorno
    db/                 # cliente y schemas
    modules/            # contratos y loader de módulos
    payments/           # providers de pago
```

## Primer arranque

1. Instala dependencias

```bash
npm install
```

2. Copia variables de entorno

```bash
cp .env.example .env
```

3. Configura como mínimo:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `APP_URL`

4. Levanta PostgreSQL local

```bash
docker compose up -d
```

5. Sincroniza módulos

```bash
npm run modules:sync
```

6. Ejecuta la app

```bash
npm run dev
```

## Comandos importantes

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run modules:sync
npm run db:generate
npm run db:migrate
```

## Qué ya está resuelto

- estructura base de frontend y backend
- dashboard base
- auth con Better Auth
- cuenta de usuario
- backoffice con usuarios, acciones y auditoría
- abstracción de pagos
- despliegue con Docker/Coolify
- modo PostgreSQL interno o externo por `.env`

## Qué sigue siendo responsabilidad del producto

- migraciones reales para nuevos cambios de esquema
- paneles funcionales de negocio
- permisos finos por workspace
- recuperación de contraseña y verificación de email si el producto lo requiere
- catálogo, billing y contenido reales
- tests de negocio

## Cómo trabajar sin romper la base

### 1. Antes de tocar el core

Pregunta primero:

- ¿esto puede vivir en `src/extensions`?
- ¿esto es UI reusable o es lógica de una vertical concreta?
- ¿esto acopla el core a un caso específico?

### 2. Dónde poner cada cosa

- componentes compartidos: `src/components`
- rutas: `src/app`
- reglas de dominio: `src/lib`
- auth: `src/lib/auth`
- db: `src/lib/db`
- pagos: `src/lib/payments`
- extensiones: `src/extensions/<modulo>`

### 3. Reglas básicas

- no meter secretos en componentes cliente
- no mezclar lógica de negocio con UI
- no usar redirects externos arbitrarios en flujos sensibles
- no hacer cambios estructurales sin documentarlos en `docs/`
- si tocas módulos, ejecutar `npm run modules:sync`

## Auth y roles

La autenticación usa `Better Auth`.

Puntos base:

- provider global en `src/app/layout.tsx`
- protección de rutas en `src/proxy.ts`
- cuenta sincronizada en tabla `users`
- admin controlado por la columna `role` y `AUTH_ADMIN_EMAILS`

Rutas incluidas:

- `/sign-in`
- `/sign-up`
- `/dashboard`
- `/account`
- `/admin`

## Base de datos

El proyecto soporta dos modos:

- `DATABASE_MODE=internal`
- `DATABASE_MODE=external`

Si usas `internal`, la app arma la conexión con `POSTGRES_*`.
Si usas `external`, la app usa `DATABASE_URL`.

## Módulos y extensibilidad

Para añadir una vertical nueva:

1. crea `src/extensions/mi-modulo/module.ts`
2. exporta `moduleDefinition`
3. ejecuta `npm run modules:sync`

Ese módulo puede inyectar:

- navegación
- secciones de marketing
- cards de dashboard
- tablas relacionadas
- providers de pago requeridos
- navegación de backoffice

## Flujo recomendado al empezar una nueva feature

1. entender si la feature pertenece al core o a una extensión
2. revisar si necesita datos nuevos o solo UI
3. si cambia DB, ajustar schema y migraciones
4. si cambia navegación o landing, revisar módulos
5. validar con:

```bash
npm run lint
npm run typecheck
npm run build
```

## Lecturas recomendadas dentro del repo

- [README.md](../README.md)
- [Buenas prácticas](./buenas-practicas.md)
- [Deploy en Coolify](./deploy-coolify.md)

## Estado actual de madurez

La base ya:

- instala
- compila
- pasa lint
- pasa typecheck

Pero todavía conviene reforzar:

- migraciones versionadas
- tests de integración de auth
- tests automatizados
- autorización más fina
