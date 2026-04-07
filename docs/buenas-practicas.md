# Buenas prácticas

Documento base para mantener este boilerplate estable, extensible y reusable entre distintos tipos de producto.

## Objetivo

La base debe permitir construir nuevas aplicaciones sin reescribir el core. El criterio principal es que las nuevas capacidades se agreguen por extensión, no por acoplamiento directo.

## Principios

### 1. No modificar el core sin una razón estructural

El core incluye:

- `src/app`
- `src/components`
- `src/lib`
- `scripts`

Antes de tocar estas capas, validar si el cambio puede resolverse en `src/extensions`.

### 2. Extender por módulos

Toda funcionalidad de negocio nueva debe intentar entrar como módulo en:

```text
src/extensions/<modulo>/module.ts
```

Un módulo debe declarar:

- navegación
- secciones de marketing
- cards de dashboard
- tablas o capacidades que utiliza
- proveedores de pago requeridos

Después de crear o editar módulos, ejecutar:

```bash
npm run modules:sync
```

### 3. Mantener separación entre frontend, backend y dominio

- UI y composición visual en `src/components` y `src/app`
- lógica de dominio en `src/lib`
- acceso a datos en `src/lib/db`
- pagos en `src/lib/payments`
- configuración en `src/lib/config`

No mezclar consultas SQL, lógica de negocio o secretos directamente dentro de componentes visuales.

### 4. Proteger el entorno de servidor

Las variables sensibles deben consumirse solo desde código de servidor.

- usar `src/lib/config/env.ts` para secretos y configuración privada
- usar una capa pública separada para valores seguros de exponer

Nunca importar configuración de backend en componentes cliente.

### 5. Diseñar para multi-tenant desde el inicio

Si una funcionalidad puede pertenecer a un workspace o cuenta, modelarla así desde el principio. Evita introducir tablas o flujos “globales” si luego van a requerir aislamiento por tenant.

### 6. Evitar acoplamiento con un proveedor externo

Stripe y PayPal ya tienen una abstracción común. Si se añade otro proveedor:

- implementar un provider nuevo
- ajustarlo al contrato compartido
- evitar lógica específica del proveedor fuera de la capa de pagos

## Base de datos

### 7. Mantener esquemas por dominio

Separar tablas por contexto:

- `core.ts` para identidad, workspace y contenido base
- `billing.ts` para catálogo, precios y pedidos

Si aparece un nuevo dominio importante, crear un archivo de esquema propio.

### 8. No duplicar fuentes de verdad

Cada entidad debe tener una responsabilidad clara. Evitar guardar el mismo dato en varias tablas salvo que exista una razón explícita de cache, snapshot o auditoría.

### 9. Preparar migraciones de forma consistente

Cuando cambie el esquema:

1. actualizar Drizzle schema
2. generar migración
3. revisar nombres de tablas, columnas e índices
4. documentar el impacto si afecta módulos existentes

## API y backend

### 10. Mantener handlers pequeños

Los route handlers deben:

- validar entrada
- delegar lógica a servicios
- devolver respuestas claras

No concentrar lógica compleja dentro de `route.ts`.

### 11. Validar siempre entradas

Usar `zod` u otro mecanismo tipado en todas las entradas externas:

- body
- query params
- webhooks
- config

En flujos sensibles como pagos o redirects post-checkout, aceptar solo rutas internas o allowlists explícitas. No confiar en URLs arbitrarias enviadas por el cliente.

### 12. Preparar fallback de desarrollo, no fallback de producción

Los mocks o placeholders están bien para desarrollo local, pero deben quedar claramente delimitados y no ocultar errores reales en entornos productivos.

### 12.1. No validar secretos en import global

La configuración de servidor debe validarse cuando una ruta o servicio la necesite realmente. Evita parsear secretos al cargar módulos compartidos, porque eso rompe `build`, testing y despliegues con imagen única.

## Frontend

### 13. Mantener componentes reutilizables

Si un bloque visual puede servir a más de un módulo, ubicarlo en `src/components`. Si es específico de una vertical, mantenerlo cerca de su módulo o en una carpeta claramente asociada.

### 14. No introducir estilos aislados sin sistema

Antes de crear estilos nuevos:

- revisar tokens existentes
- reutilizar utilidades de Tailwind
- mantener consistencia en espaciado, radios, color y jerarquía visual

### 15. Favorecer composición sobre branching excesivo

Es preferible componer vistas distintas por módulo que llenar un mismo componente con múltiples condicionales de negocio.

## Mantenimiento

### 16. Documentar decisiones estructurales

Si se cambia una convención del boilerplate, registrar la decisión en `docs/` para que la siguiente app construida sobre esta base no herede ambigüedad.

### 17. No romper la extensibilidad

Antes de fusionar cambios importantes, comprobar:

- que `modules:sync` sigue funcionando
- que el core no depende de un módulo concreto
- que un módulo nuevo puede agregarse sin editar archivos base

### 18. Priorizar nombres claros

Usar nombres explícitos para:

- módulos
- tablas
- rutas
- servicios
- variables de entorno

La base debe ser legible sin contexto histórico.

## Checklist rápido para nuevos cambios

- ¿Esto puede resolverse como módulo en vez de tocar el core?
- ¿La lógica de negocio quedó fuera de la UI?
- ¿Las variables sensibles están en servidor?
- ¿La nueva tabla pertenece al dominio correcto?
- ¿La API valida entrada y salida?
- ¿El cambio mantiene la capacidad de extender sin refactor?
