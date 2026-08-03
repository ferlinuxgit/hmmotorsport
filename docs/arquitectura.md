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
PostgreSQL / Better Auth / Stripe / PayPal
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

El contrato base está en [src/lib/modules/contracts.ts](../src/lib/modules/contracts.ts).

Hoy un módulo puede aportar:

- `navigation`
- `marketingSections`
- `dashboardCards`
- `dbTables`
- `paymentProviders`

Eso permite que el core sea genérico y la personalización viva en extensiones.

## Capa de configuración

La configuración está separada por dominios en [src/lib/config/env.ts](../src/lib/config/env.ts).

Actualmente existen accesos separados para:

- `getAppEnv()`
- `getBetterAuthEnv()`
- `getDatabaseEnv()`
- `getPaymentsEnv()`

La razón de esta separación es evitar que el build o una ruta simple fallen por cargar secretos o dependencias de infraestructura que no necesita.

## Capa de base de datos

### Cliente

El acceso principal está en [src/lib/db/client.ts](../src/lib/db/client.ts).

Características:

- inicialización lazy
- cache en desarrollo
- PostgreSQL vía `postgres`
- Drizzle como capa tipada

### Esquemas

El esquema se divide por dominio:

- [src/lib/db/schema/core.ts](../src/lib/db/schema/core.ts)
- [src/lib/db/schema/billing.ts](../src/lib/db/schema/billing.ts)

`core.ts` contiene identidad, workspaces y contenido.

`billing.ts` contiene productos, precios y órdenes.

## Capa de autenticación

La autenticación usa Better Auth.

Piezas principales:

- provider global en [src/app/layout.tsx](../src/app/layout.tsx)
- protección de rutas en [src/proxy.ts](../src/proxy.ts)
- helpers de servidor en [src/lib/auth/server.ts](../src/lib/auth/server.ts)

Flujo actual:

1. el usuario se autentica en Better Auth
2. una ruta protegida obtiene la cuenta actual
3. se sincroniza o actualiza el registro interno en `users` si hay cambios
4. la app opera con una representación interna tipada

## Capa de pagos

La abstracción de pagos vive en:

- [src/lib/payments/types.ts](../src/lib/payments/types.ts)
- [src/lib/payments/index.ts](../src/lib/payments/index.ts)
- [src/lib/payments/providers/stripe.ts](../src/lib/payments/providers/stripe.ts)
- [src/lib/payments/providers/paypal.ts](../src/lib/payments/providers/paypal.ts)

El contrato actual unifica:

- input de checkout
- sesión de checkout
- provider concreto

Esto evita acoplar el resto de la app a APIs específicas de cada gateway.

## Capa de API

Endpoints actuales:

- `GET /api/live`
- `GET /api/ready`
- `GET /api/health`
- `GET /api/account/me`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId`
- `GET /api/admin/audit`
- `GET|POST /api/admin/workspaces`
- `GET|PATCH /api/admin/workspaces/:workspaceId`
- gestión de miembros bajo `/api/admin/workspaces/:workspaceId/members`
- `POST /api/payments/checkout`

La intención actual es mantener route handlers pequeños y mover la lógica al core.

## Capa administrativa

El backoffice separa tres responsabilidades:

- `src/app/(app)/admin`: composición de páginas protegidas
- `src/lib/admin`: consultas y mutaciones operativas
- `audit_logs`: trazabilidad persistente de mutaciones

Las extensiones registran accesos con `backofficeNavigation`, pero las reglas siguen dentro de servicios explícitos. Las
mutaciones críticas agrupan cambio y auditoría en una transacción.

## Capa de jobs

`src/lib/jobs` implementa una cola PostgreSQL. Los productores encolan con clave opcional de deduplicación; el runner
recupera locks vencidos, reclama con `SKIP LOCKED`, ejecuta handlers registrados y aplica backoff exponencial. El endpoint
interno requiere un secreto independiente y el backoffice permite operar estados terminales.

## Capa de notificaciones e invitaciones

`src/lib/notifications` separa renderizado, transporte y persistencia. Cada correo nace como una fila de `notifications` y
un job deduplicado dentro de la misma transacción que el evento de negocio. En desarrollo el provider `console` evita
dependencias externas; staging y producción requieren SMTP explícito.

Las invitaciones de workspace usan un identificador firmado con HMAC y almacenan únicamente su hash SHA-256. La URL se
reconstruye justo antes de enviar, expira, exige que la cuenta autenticada tenga el email invitado y acepta membership y
auditoría de forma atómica. Invitaciones concurrentes para el mismo workspace/email se serializan en PostgreSQL.

## Capa de almacenamiento

`src/lib/storage` expone un contrato común para filesystem local y S3-compatible. La API crea primero un registro
`pending`, valida tamaño y MIME, reclama la operación para evitar carreras, almacena el binario, calcula SHA-256 y sólo
entonces publica el asset como `ready`. Descargas y borrados vuelven a comprobar identidad o membership en servidor.

El provider local facilita desarrollo y Docker con volumen persistente. Producción exige S3-compatible para que múltiples
réplicas compartan objetos. Los binarios siguen pasando por endpoints same-origin, por lo que no se exponen credenciales,
URLs públicas ni reglas CORS del bucket al navegador.

## Capa de despliegue

El proyecto soporta:

- desarrollo local
- contenedor Docker
- despliegue con Coolify
- base de datos interna o externa según entorno

Archivos clave:

- [Dockerfile](../Dockerfile)
- [docker-compose.yml](../docker-compose.yml)
- [docker-compose.coolify.yml](../docker-compose.coolify.yml)

## Decisiones arquitectónicas importantes ya tomadas

### Separación de config por dominio

Evita imports globales que arrastren secretos o dependencias innecesarias.

### DB lazy

Evita que el proyecto falle al compilar por tocar Postgres antes de tiempo.

### Redirects internos en checkout

Reduce superficie de error y riesgo en flujos de pago.

### Extensibilidad por módulos

Permite que marketing, commerce y SaaS coexistan sin convertir el core en una vertical concreta.

## Límites deliberados de la arquitectura

- el schema inicial está versionado en una sola migración limpia
- los flujos avanzados de Better Auth se habilitan solo cuando el producto los necesita
- RBAC sigue siendo simple
- los providers de notificación adicionales a SMTP se implementan tras el contrato existente
- la observabilidad ya existe como base, pero no sustituye métricas/alertas del proyecto final

La arquitectura es buena como base. Todavía no es excelente como plataforma madura.
