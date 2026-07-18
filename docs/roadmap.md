# Roadmap

## Estado de la foundation

La base ya resuelve arquitectura modular, auth, PostgreSQL, pagos, webhooks, analítica propia, rate limiting, observabilidad, despliegue, UI responsive y validación automatizada. El trabajo pendiente depende principalmente del producto que se construya encima.

## Prioridad 1: primer dominio real

- sustituir enlaces de demostración por recursos y rutas del producto
- definir ownership y permisos por workspace para esos recursos
- crear onboarding que produzca el primer resultado útil
- añadir tests de integración específicos del dominio

## Prioridad 2: operación del producto

- convertir las tablas del backoffice en acciones autorizadas y auditables
- añadir paginación, filtros y búsqueda cuando el volumen lo justifique
- configurar alertas y métricas del proveedor de hosting
- definir política real de retención de analítica y datos de cuenta

## Prioridad 3: monetización

- modelar planes y derechos de acceso del producto
- añadir reconciliación periódica además de webhooks
- implementar cancelaciones, reembolsos e impuestos según mercado
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
