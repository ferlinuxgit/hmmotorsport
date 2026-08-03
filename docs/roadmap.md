# Roadmap

## Estado de la foundation

La base ya resuelve arquitectura modular, auth, PostgreSQL, pagos, webhooks, analítica propia, rate limiting, observabilidad, despliegue, UI responsive y validación automatizada. El trabajo pendiente depende principalmente del producto que se construya encima.

## Prioridad 1: primer dominio real

- sustituir enlaces de demostración por recursos y rutas del producto
- definir ownership y permisos por workspace para esos recursos
- crear onboarding que produzca el primer resultado útil
- añadir tests de integración específicos del dominio

## Prioridad 2: operación del producto

- extender el patrón autorizado y auditable de usuarios a cada recurso del dominio
- aplicar paginación, filtros y búsqueda a cada nueva colección administrativa
- configurar alertas y métricas del proveedor de hosting
- definir política real de retención de analítica y datos de cuenta

Ya resuelto en la foundation:

- gestión paginada de usuarios
- activación, desactivación y roles con protección anti-lockout
- auditoría transaccional
- navegación de backoffice registrada por módulos
- workspaces, ownership y membresías operables y auditados
- jobs PostgreSQL con locks, reintentos, deduplicación y backoffice
- invitaciones firmadas, revocables y aceptadas atómicamente
- notificaciones email persistentes con provider SMTP y fallback de desarrollo
- storage privado local/S3, integridad SHA-256 y autorización por workspace

## Foundation completada

- handlers de jobs para reconciliación
- configuración operativa y feature flags auditables
- exportación de cuenta y políticas de retención configurables
- contenido versionado y publicable
- catálogo, precios de pago único y órdenes
- entitlements, reembolsos y reconciliación

## Prioridad 3: monetización específica

- modelar planes y derechos adicionales del producto sobre los entitlements base
- implementar suscripciones, cancelaciones e impuestos según mercado
- probar checkout completo contra entornos sandbox de Stripe y PayPal

## Prioridad 4: contenido y marca

- sustituir nombre, copy, favicon y Open Graph por la identidad final
- completar términos y privacidad con revisión legal
- conectar un CMS solo si el flujo editorial lo necesita
- medir accesibilidad, Core Web Vitals y conversión con datos reales

## Garantías que deben mantenerse

- `lint`, tipos, tests, build, audit y guard de estilos en verde
- migraciones y seeds reproducibles
- una sola familia visual y una sola fuente de tokens
- rutas, analytics y contratos públicos sin cambios silenciosos
- lógica de vertical dentro de extensiones antes que dentro del core

## Criterio de éxito

La siguiente etapa está completa cuando una persona nueva puede crear una cuenta, obtener valor del primer recurso de negocio, pagar si corresponde y ser atendida desde el backoffice sin intervenciones manuales en base de datos.
