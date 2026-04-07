# Visión global

## Qué es este proyecto

Este repositorio no está pensado como una app cerrada. Está pensado como una base universal sobre la que construir varias clases de producto sin rehacer arquitectura en cada nuevo proyecto.

El objetivo no es solo arrancar rápido. El objetivo es arrancar rápido sin hipotecar el futuro técnico.

## Qué tipo de producto debe soportar

La base debe servir para:

- websites de marketing
- webs híbridas con contenido y panel
- e-commerce de productos físicos o digitales
- SaaS con usuarios, workspaces y billing
- productos multi-tenant con extensiones por dominio

## Qué significa “universal” en este contexto

“Universal” no significa meter todos los casos dentro del core.

Significa:

- mantener un core pequeño y estable
- encapsular las variaciones por módulos
- separar claramente frontend, backend, datos, auth y pagos
- permitir cambiar de vertical sin reescribir la base

## Principio rector

La app debe poder crecer por extensión, no por acumulación de hacks.

Eso implica:

- el core solo resuelve capacidades compartidas
- lo específico de negocio debe ir fuera del core siempre que sea posible
- una nueva vertical no debería requerir reestructurar la base

## Capacidades base que debe aportar

### Frontend

- estructura Next.js moderna con App Router
- sistema visual consistente y reusable
- layout público y privado
- navegación extensible

### Backend

- route handlers limpios
- servicios desacoplados
- contratos tipados
- base apta para dominio y producto

### Datos

- PostgreSQL como almacenamiento principal
- Drizzle como capa de esquema y acceso
- posibilidad de usar DB interna o externa

### Identidad

- autenticación robusta
- cuentas de usuario
- administración
- camino hacia permisos más finos

### Billing

- abstracción de checkout
- compatibilidad con Stripe y PayPal
- posibilidad de añadir otros providers en el futuro

### Operación

- despliegue en Docker
- despliegue sencillo en Coolify
- documentación clara

## Filosofía de diseño

### 1. Core pequeño

El core debe contener solo lo que aporta valor transversal:

- configuración
- auth
- db
- contracts
- layout y UI base
- abstracciones compartidas

### 2. Extensiones primero

Las nuevas verticales deberían enchufarse en `src/extensions` antes de justificar cambios estructurales en el core.

### 3. Preparado para SaaS aunque no todo producto sea SaaS

Es mejor partir de un modelo que soporte usuarios, workspaces y miembros que añadir eso tarde con refactors costosos.

### 4. Preparado para monetización aunque no todo producto venda desde el día 1

Es mejor tener una capa de pagos desacoplada desde el inicio que rehacer el flujo cuando el producto necesite cobrar.

### 5. Documentación como parte del producto

Este boilerplate no será excelente si solo “funciona”. También debe explicar:

- qué hace
- cómo está organizado
- qué está resuelto
- qué no está resuelto
- cómo seguir evolucionándolo

## Qué no debe convertirse en este proyecto

No debe convertirse en:

- un monolito de condicionales por vertical
- un template rígido imposible de adaptar
- una base que compile pero no esté documentada
- una colección de features inconexas sin criterio arquitectónico

## Definición de éxito

Este boilerplate cumple su visión cuando:

- un equipo nuevo puede entenderlo rápido
- una vertical nueva puede construirse sin refactor estructural
- auth, data y pagos ya tienen una base seria
- el core se mantiene estable mientras el producto evoluciona
- la documentación reduce dudas técnicas en lugar de generarlas

