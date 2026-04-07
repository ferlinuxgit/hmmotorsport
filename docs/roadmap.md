# Roadmap

Plan técnico para llevar este boilerplate desde una base validada hasta una foundation reusable de muy alto nivel.

## Estado actual

Hoy la base ya:

- instala correctamente
- compila
- pasa `lint`
- pasa `typecheck`
- soporta Docker y Coolify
- integra Clerk
- integra PostgreSQL interno o externo
- tiene arquitectura extensible por módulos

## Objetivo

Llevar la base a un nivel `9.5/10` como boilerplate reusable para múltiples productos sin necesidad de refactors estructurales tempranos.

## Prioridad 1

### 1. Migraciones reales de base de datos

Objetivo:

- versionar el estado real del schema actual
- dejar bootstrap reproducible para cualquier entorno

Entregables:

- migración inicial Drizzle
- documentación de bootstrap
- validación de `db:generate` y `db:migrate`

### 2. Webhooks de Clerk

Objetivo:

- sincronizar altas, bajas y cambios de usuario sin depender del acceso a páginas autenticadas

Entregables:

- endpoint de webhook
- validación de firma
- sync de `users`
- actualización de rol, email, estado e imagen

### 3. Seeds iniciales

Objetivo:

- acelerar onboarding y entornos de prueba

Entregables:

- seed de workspace inicial
- seed de páginas o contenido demo
- seed opcional de productos/precios demo

## Prioridad 2

### 4. RBAC real

Objetivo:

- pasar de `user/admin` simple a permisos más útiles para SaaS y operación interna

Entregables:

- roles por workspace
- permisos por capacidad
- helpers de autorización reutilizables
- guards para server components y APIs

### 5. Onboarding funcional de producto

Objetivo:

- que un usuario nuevo no solo pueda autenticarse, sino arrancar dentro de una app usable

Entregables:

- creación automática o guiada de workspace
- selección de workspace
- estado vacío útil para dashboard

### 6. Base de admin más completa

Objetivo:

- convertir `/admin` en una plataforma mínima operativa

Entregables:

- listado paginado de usuarios
- cambio de roles
- métricas básicas
- trazabilidad mínima

## Prioridad 3

### 7. Tests automatizados

Objetivo:

- validar el boilerplate como producto base, no solo como código que compila

Entregables:

- tests unitarios de helpers críticos
- tests de integración para auth y API
- tests de payments
- smoke tests de rutas principales

### 8. CI

Objetivo:

- impedir regresiones estructurales

Entregables:

- workflow de `lint`
- workflow de `typecheck`
- workflow de `build`
- workflow opcional de tests

### 9. Observabilidad base

Objetivo:

- facilitar diagnóstico en staging y producción

Entregables:

- logging estructurado
- error boundaries
- captura centralizada de errores
- healthchecks más ricos

## Prioridad 4

### 10. Commerce real

Objetivo:

- convertir la abstracción de pagos en una base operativa para venta real

Entregables:

- webhooks de Stripe
- captura/confirmación de PayPal
- persistencia de órdenes y estados
- reconciliación básica de pagos

### 11. CMS interno mínimo

Objetivo:

- hacer útil la vertical de marketing sin depender de otro sistema

Entregables:

- CRUD de `content_pages`
- vista previa
- publicación/despublicación

### 12. Convenciones de módulos avanzadas

Objetivo:

- hacer que nuevas verticales puedan enchufarse con menos fricción

Entregables:

- contrato de módulo ampliado
- hooks de servidor por módulo
- registro de rutas/capacidades

## Checklist de salida a “9.5/10”

- migraciones versionadas listas
- webhook Clerk funcionando
- seeds reproducibles
- RBAC por workspace
- tests mínimos automatizados
- CI activa
- flujos de pago más cerrados
- documentación técnica alineada

## Orden recomendado de ejecución

1. migraciones
2. webhooks Clerk
3. seeds
4. RBAC
5. onboarding funcional
6. tests
7. CI
8. observabilidad
9. commerce real
10. CMS interno

## Criterio de éxito

Se puede considerar esta base cerca de `9.5/10` cuando:

- una persona nueva puede arrancarla sin fricción
- un producto nuevo puede reutilizar el core sin refactor estructural
- auth, datos y pagos tienen una base operativa real
- los cambios importantes quedan protegidos por validación automática
