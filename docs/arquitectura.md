# Arquitectura

## Resumen

La arquitectura actual sigue un patrón de núcleo estable + extensiones enchufables.

```text
UI pública / privada
        |
        v
Next.js App Router
        |
        v
Servicios del core (auth, db, payments, modules, config)
        |
        v
PostgreSQL / Clerk / Stripe / PayPal
```

## Capas principales

### 1. `src/app`

Responsabilidad:

- rutas
- layouts
- composición de páginas
- route handlers

Esta capa debe orquestar, no concentrar reglas de negocio complejas.

### 2. `src/components`

Responsabilidad:

- UI reusable
- shells de layout
- bloques compartidos

Aquí debe vivir lo que varias páginas o verticales pueden reutilizar.

### 3. `src/lib`

Responsabilidad:

- auth
- config
- db
- payments
- módulos
- utilidades de dominio transversal

Es la capa más importante del core.

### 4. `src/extensions`

Responsabilidad:

- introducir nuevas verticales
- registrar navegación
- registrar secciones de marketing
- registrar tarjetas o capacidades del dashboard

Esta es la zona natural para crecer sin tocar el núcleo.

## Mapa de carpetas

```text
src/
  app/
    (app)/             # rutas privadas
    (auth)/            # rutas de acceso
    api/               # endpoints
  components/
    account/
    auth/
    dashboard/
    layout/
    marketing/
    ui/
  extensions/
    commerce/
    marketing/
    saas/
  lib/
    auth/
    config/
    db/
    modules/
    payments/
```

## Flujo de módulos

La extensibilidad actual depende de esta secuencia:

1. se crea un módulo en `src/extensions/<modulo>/module.ts`
2. el módulo exporta `moduleDefinition`
3. `scripts/sync-modules.mjs` detecta módulos instalados
4. se regenera `src/modules/generated.ts`
5. el loader del core consume esa lista y la proyecta en navegación, secciones y dashboard

## Contrato de módulo

El contrato base está en [src/lib/modules/contracts.ts](/root/projects/baseboilerplate/src/lib/modules/contracts.ts).

Hoy un módulo puede aportar:

- `navigation`
- `marketingSections`
- `dashboardCards`
- `dbTables`
- `paymentProviders`

Eso permite que el core sea genérico y la personalización viva en extensiones.

## Capa de configuración

La configuración está separada por dominios en [src/lib/config/env.ts](/root/projects/baseboilerplate/src/lib/config/env.ts).

Actualmente existen accesos separados para:

- `getAppEnv()`
- `getClerkEnv()`
- `getDatabaseEnv()`
- `getPaymentsEnv()`

La razón de esta separación es evitar que el build o una ruta simple fallen por cargar secretos o dependencias de infraestructura que no necesita.

## Capa de base de datos

### Cliente

El acceso principal está en [src/lib/db/client.ts](/root/projects/baseboilerplate/src/lib/db/client.ts).

Características:

- inicialización lazy
- cache en desarrollo
- PostgreSQL vía `postgres`
- Drizzle como capa tipada

### Esquemas

El esquema se divide por dominio:

- [src/lib/db/schema/core.ts](/root/projects/baseboilerplate/src/lib/db/schema/core.ts)
- [src/lib/db/schema/billing.ts](/root/projects/baseboilerplate/src/lib/db/schema/billing.ts)

`core.ts` contiene identidad, workspaces y contenido.

`billing.ts` contiene productos, precios y órdenes.

## Capa de autenticación

La autenticación usa Clerk.

Piezas principales:

- provider global en [src/app/layout.tsx](/root/projects/baseboilerplate/src/app/layout.tsx)
- protección de rutas en [src/proxy.ts](/root/projects/baseboilerplate/src/proxy.ts)
- helpers de servidor en [src/lib/auth/server.ts](/root/projects/baseboilerplate/src/lib/auth/server.ts)

Flujo actual:

1. el usuario se autentica en Clerk
2. una ruta protegida obtiene la cuenta actual
3. se sincroniza o actualiza el registro interno en `users` si hay cambios
4. la app opera con una representación interna tipada

## Capa de pagos

La abstracción de pagos vive en:

- [src/lib/payments/types.ts](/root/projects/baseboilerplate/src/lib/payments/types.ts)
- [src/lib/payments/index.ts](/root/projects/baseboilerplate/src/lib/payments/index.ts)
- [src/lib/payments/providers/stripe.ts](/root/projects/baseboilerplate/src/lib/payments/providers/stripe.ts)
- [src/lib/payments/providers/paypal.ts](/root/projects/baseboilerplate/src/lib/payments/providers/paypal.ts)

El contrato actual unifica:

- input de checkout
- sesión de checkout
- provider concreto

Esto evita acoplar el resto de la app a APIs específicas de cada gateway.

## Capa de API

Endpoints actuales:

- `GET /api/health`
- `GET /api/account/me`
- `GET /api/admin/users`
- `POST /api/payments/checkout`

La intención actual es mantener route handlers pequeños y mover la lógica al core.

## Capa de despliegue

El proyecto soporta:

- desarrollo local
- contenedor Docker
- despliegue con Coolify
- base de datos interna o externa según entorno

Archivos clave:

- [Dockerfile](/root/projects/baseboilerplate/Dockerfile)
- [docker-compose.yml](/root/projects/baseboilerplate/docker-compose.yml)
- [docker-compose.coolify.yml](/root/projects/baseboilerplate/docker-compose.coolify.yml)

## Decisiones arquitectónicas importantes ya tomadas

### Separación de config por dominio

Evita imports globales que arrastren secretos o dependencias innecesarias.

### DB lazy

Evita que el proyecto falle al compilar por tocar Postgres antes de tiempo.

### Redirects internos en checkout

Reduce superficie de error y riesgo en flujos de pago.

### Extensibilidad por módulos

Permite que marketing, commerce y SaaS coexistan sin convertir el core en una vertical concreta.

## Limitaciones actuales de la arquitectura

- aún no hay migraciones versionadas
- la sincronización con Clerk no usa webhooks todavía
- RBAC sigue siendo simple
- no hay test suite automatizada
- la observabilidad es mínima

La arquitectura es buena como base. Todavía no es excelente como plataforma madura.

