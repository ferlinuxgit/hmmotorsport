# Módulos y extensiones

## Propósito

Explicar cómo crece este boilerplate sin modificar el core.

La extensibilidad es una de las decisiones más importantes del proyecto. Este documento describe el mecanismo y sus límites.

## Idea principal

El core no debería reescribirse cada vez que cambie la vertical del producto.

Para eso existe `src/extensions`.

Cada módulo describe una capacidad o vertical y el core proyecta esa definición en:

- navegación pública
- navegación privada
- bloques de marketing
- cards del dashboard
- metadata operativa

## Dónde viven los módulos

```text
src/extensions/<modulo>/module.ts
```

También se permite `module.tsx`.

## Registro automático

El script [scripts/sync-modules.mjs](../scripts/sync-modules.mjs) detecta módulos instalados y genera [src/modules/generated.ts](../src/modules/generated.ts).

Ese archivo es consumido por [src/lib/modules/loader.ts](../src/lib/modules/loader.ts).

## Contrato actual

El contrato base está en [src/lib/modules/contracts.ts](../src/lib/modules/contracts.ts).

Un módulo define:

- `key`
- `name`
- `area`
- `description`
- `navigation`
- `marketingSections`
- `dashboardCards`
- `dbTables`
- `paymentProviders`

## Significado de cada parte

### `key`

Identificador estable del módulo.

Debe ser:

- corto
- explícito
- único

### `name`

Nombre visible del módulo.

### `area`

Clasifica el módulo dentro de:

- `marketing`
- `commerce`
- `saas`
- `shared`

### `description`

Resumen corto de la capacidad que introduce.

### `navigation`

Permite inyectar enlaces en navegación.

Cada item define:

- `title`
- `href`
- `description`
- `segment`

`segment` puede ser:

- `site`
- `app`

### `marketingSections`

Define contenido proyectable en la parte pública.

### `dashboardCards`

Define cards o accesos de alto nivel dentro del dashboard.

### `dbTables`

No registra tablas automáticamente, pero documenta qué entidades de datos están relacionadas con el módulo.

### `paymentProviders`

Expresa qué providers de pago son relevantes para ese módulo.

## Flujo para crear un módulo nuevo

1. crea una carpeta en `src/extensions`
2. crea `module.ts`
3. exporta `moduleDefinition`
4. ejecuta `npm run modules:sync`
5. valida con `lint`, `typecheck` y `build`

## Ejemplo conceptual

```ts
import type { AppModule } from "@/lib/modules/contracts";

export const moduleDefinition: AppModule = {
  key: "academy",
  name: "Academy",
  area: "shared",
  description: "Cursos, lecciones y acceso a contenido premium.",
  navigation: [],
  marketingSections: [],
  dashboardCards: [],
  dbTables: ["courses", "lessons", "enrollments"],
  paymentProviders: ["stripe"]
};
```

## Qué resuelve bien el sistema actual

- añadir verticales rápidas
- proyectar capacidades en UI base
- mantener un core más limpio

## Qué no resuelve todavía

- registro automático de rutas completas por módulo
- hooks de servidor por módulo
- carga de componentes o features más complejas
- versionado o dependencia entre módulos

## Cuándo usar una extensión

Usa una extensión cuando:

- la capacidad pertenece a una vertical concreta
- modifica navegación, dashboard o marketing
- quieres encapsular un bloque funcional sin tocar el core

## Cuándo no usar una extensión

No la uses si:

- estás definiendo una capacidad transversal del sistema
- el cambio pertenece claramente a auth, config, db o payments base
- introduces una abstracción que todo el sistema necesitará

## Regla práctica

Si una funcionalidad podría desaparecer en un producto futuro sin romper la base, probablemente pertenece a una extensión.

Si la base dejaría de tener sentido sin esa funcionalidad, probablemente pertenece al core.

## Módulos actuales

### `marketing`

Intención:

- contenido público y secciones editoriales

### `commerce`

Intención:

- catálogo, precios, pedidos y checkout

### `saas`

Intención:

- workspaces, acceso y base para producto SaaS

## Riesgos a evitar

- meter demasiada lógica de negocio directamente en `module.ts`
- usar módulos como sustituto de arquitectura de dominio
- convertir el contrato de módulo en un objeto gigantesco y ambiguo

## Evolución recomendada

### Corto plazo

- documentar mejor capacidades por módulo
- estandarizar naming y convenciones

### Medio plazo

- añadir registro de rutas o features más rico
- permitir integración de server actions o servicios asociados

### Largo plazo

- diseñar un sistema más formal de extensiones si el boilerplate crece mucho

