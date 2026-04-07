# Decisiones arquitectónicas

## Propósito

Este documento recoge decisiones importantes ya tomadas en el boilerplate, por qué se tomaron y qué tradeoffs introducen.

No pretende ser un historial completo. Pretende evitar ambigüedad técnica.

## 1. Next.js App Router como base

### Decisión

Usar `Next.js` con `App Router` como capa principal de frontend y backend web.

### Motivo

- permite combinar UI, server components y route handlers
- encaja bien con un producto híbrido
- sirve tanto para marketing como para apps privadas

### Beneficio

- una sola base para varias clases de producto
- menos fricción entre frontend y backend web

### Tradeoff

- hay que vigilar qué corre en cliente y qué corre en servidor
- requiere disciplina con imports y configuración

## 2. Core pequeño + extensiones enchufables

### Decisión

Mantener el core en `src/app`, `src/components` y `src/lib`, y las variaciones de producto en `src/extensions`.

### Motivo

- evitar que el core se convierta en una vertical concreta
- permitir reutilizar la misma base en varios productos

### Beneficio

- la base crece por composición
- los cambios de producto no fuerzan refactors estructurales inmediatos

### Tradeoff

- el contrato de módulos tiene que estar bien pensado
- no todo encaja automáticamente en un módulo

## 3. Registro automático de módulos

### Decisión

Usar `scripts/sync-modules.mjs` para detectar módulos en `src/extensions` y generar `src/modules/generated.ts`.

### Motivo

- mantener un registro único y simple de módulos instalados
- evitar wiring manual repetitivo

### Beneficio

- onboarding rápido para nuevas verticales
- menos errores por imports manuales

### Tradeoff

- requiere ejecutar `npm run modules:sync`
- depende de una convención concreta de archivos

## 4. PostgreSQL como base de datos principal

### Decisión

Usar PostgreSQL como almacenamiento base.

### Motivo

- solidez operativa
- modelo relacional útil para SaaS, contenido y billing
- ecosistema maduro

### Beneficio

- buena base para workspaces, miembros, catálogo y órdenes

### Tradeoff

- exige cuidar migraciones y esquemas desde el inicio

## 5. Drizzle como capa de esquema y acceso

### Decisión

Usar Drizzle ORM.

### Motivo

- tipado explícito
- control razonable del esquema
- buena relación entre SQL y código TypeScript

### Beneficio

- contratos claros
- esquemas más auditables

### Tradeoff

- hay que mantener disciplina con migraciones y estructura del schema

## 6. Configuración separada por dominio

### Decisión

Separar el acceso al entorno en bloques:

- app
- Clerk
- database
- payments

### Motivo

- evitar imports globales que arrastren secretos o dependencias innecesarias
- reducir fallos en build

### Beneficio

- la app compila mejor
- cada servicio valida solo lo que necesita

### Tradeoff

- hay más funciones de acceso a config en lugar de un único objeto global

## 7. Inicialización lazy de base de datos

### Decisión

No conectar PostgreSQL en el import del módulo, sino cuando realmente se solicita la DB.

### Motivo

- evitar errores innecesarios en build
- desacoplar rutas simples de la infraestructura

### Beneficio

- mejor experiencia de build y arranque

### Tradeoff

- hay que tener cuidado con cuándo se llama a `getDb()`

## 8. Clerk como proveedor de identidad

### Decisión

Usar Clerk para autenticación y gestión de usuarios.

### Motivo

- reduce esfuerzo en auth base
- permite arrancar más rápido con cuenta, sesiones y componentes preconstruidos

### Beneficio

- auth fuerte desde el principio
- menos tiempo invertido en flows básicos

### Tradeoff

- dependencia de proveedor externo
- necesidad de diseñar bien la sync con la base interna

## 9. Usuario externo + representación interna

### Decisión

Mantener usuarios en Clerk y a la vez sincronizar una tabla interna `users`.

### Motivo

- la app necesita una representación propia para dominio, roles y evolución futura

### Beneficio

- no se acopla todo el dominio a Clerk
- permite evolucionar permisos y relaciones internas

### Tradeoff

- hay que mantener la sincronización correctamente
- sin webhooks, la sync es incompleta

## 10. Abstracción de pagos por provider

### Decisión

Usar un contrato común para providers de pago.

### Motivo

- evitar acoplar el producto a Stripe o PayPal de forma rígida

### Beneficio

- la API de checkout es estable
- añadir providers futuros es más barato

### Tradeoff

- el contrato común solo cubre la intersección real de capacidades

## 11. Redirects internos en checkout

### Decisión

Aceptar solo `successPath` y `cancelPath` internos.

### Motivo

- reducir riesgo de redirects arbitrarios

### Beneficio

- mayor seguridad y predictibilidad

### Tradeoff

- si un caso real necesita URLs externas, habrá que introducir allowlists explícitas

## 12. Docker y Coolify como camino de despliegue principal

### Decisión

Preparar el boilerplate para despliegue contenedorizado desde el inicio.

### Motivo

- reducir fricción entre local, staging y producción
- facilitar uso en equipos pequeños y despliegue self-hosted

### Beneficio

- camino operativo claro
- soporte tanto para Postgres interno como externo

### Tradeoff

- hay que cuidar compatibilidad de build y runtime dentro del contenedor

## Decisiones aún no cerradas del todo

- estrategia final de migraciones
- estrategia final de webhooks Clerk
- RBAC por workspace
- estrategia de testing
- observabilidad base

## Criterio para futuras decisiones

Una decisión nueva debería aprobarse si:

- reduce acoplamiento estructural
- mejora reusabilidad
- mantiene el core pequeño
- mejora operabilidad real
- no introduce complejidad que solo sirva a una única vertical

