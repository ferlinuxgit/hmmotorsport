# Guía para IA al Crear Proyectos con este Boilerplate

Esta guía define cómo debe trabajar una IA cuando use este boilerplate como base de un proyecto real. El objetivo es mantener una arquitectura consistente, preparada para SEO, segura y fácil de evolucionar.

## Principios de Trabajo

- Lee primero `README.md`, `docs/arquitectura.md`, `docs/modulos-y-extensiones.md`, `docs/referencia-entorno.md` y esta guía.
- No reescribas el core si una extensión puede resolver el caso.
- Mantén cambios pequeños y trazables. Cada cambio debe poder explicarse por necesidad de producto, seguridad, SEO, datos u operación.
- Respeta los scripts existentes: `modules:sync`, `lint`, `typecheck`, `test`, `build`, `db:generate`, `db:migrate` y `db:seed`.
- No introduzcas dependencias nuevas sin justificar por qué el stack actual no basta.

## Estructura Esperada

- `src/app`: rutas, layouts, route handlers y metadata específica de página.
- `src/components`: componentes reutilizables y UI.
- `src/lib`: servicios, configuración, auth, pagos, datos y utilidades compartidas.
- `src/extensions/<modulo>`: capacidades de producto desacopladas del core.
- `src/lib/db/schema`: tablas Drizzle agrupadas por dominio.
- `docs`: decisiones, operación y guías para humanos o agentes.

Si creas una vertical nueva, hazlo como módulo:

1. Crea `src/extensions/<nombre>/module.ts`.
2. Exporta `moduleDefinition` cumpliendo `AppModule`.
3. Añade navegación, secciones, cards y tablas declaradas.
4. Ejecuta `npm run modules:sync`.

## SEO por Defecto

Antes de entregar una página pública:

- Define un `title` único y una `description` clara.
- Usa una sola etiqueta `h1` por página pública.
- Mantén una jerarquía semántica de headings.
- Usa enlaces internos reales, no solo botones sin `href`.
- No indexes páginas privadas, dashboards, auth sensible ni APIs.
- Si la página es indexable, asegúrate de que puede aparecer en `sitemap.ts`.
- Usa canonical estable para evitar duplicados.
- Prepara contenido útil en HTML inicial; no dependas solo de estado cliente.

La metadata global vive en `src/app/layout.tsx`. La base SEO incluye:

- `metadataBase`
- canonical global
- Open Graph
- Twitter card
- `robots.ts`
- `sitemap.ts`
- `manifest.ts`
- imagen Open Graph generada en `opengraph-image.tsx`

Para páginas públicas nuevas, exporta metadata específica cuando el título o descripción cambien.

## Variables de Entorno

- Usa `APP_NAME`, `APP_DESCRIPTION` y `APP_URL` como fuente para branding y SEO global.
- Nunca accedas a secretos desde componentes cliente.
- Valida nuevas variables en `src/lib/config/env.ts`.
- Documenta cualquier variable nueva en `.env.example` y `docs/referencia-entorno.md`.

## Auth y Autorización

- Protege rutas privadas desde `src/proxy.ts`.
- En backend, valida sesión con helpers de `src/lib/auth`.
- Para recursos ligados a workspace, exige `hasWorkspaceRole`.
- No confíes en datos enviados por el cliente para roles, userId, importes o ownership.
- Mantén roles globales separados de roles por workspace.
- Las superficies de backoffice deben exigir `requireAdminAccount`.

## Backoffice y Analítica

- Usa [src/lib/admin/overview.ts](../src/lib/admin/overview.ts) como agregador de datos administrativos.
- No dupliques queries de métricas complejas dentro de componentes de página.
- Los eventos de analítica viven en `analytics_events`.
- Para eventos nuevos, usa nombres estables como `checkout_started`, `lead_submitted` o `workspace_created`.
- No almacenes IPs, secretos, tokens ni payloads sensibles en `properties`.
- Si necesitas analítica distribuida avanzada, conserva `POST /api/analytics/events` como contrato y cambia solo la implementación interna.

## Datos y Migraciones

- Modifica esquemas en `src/lib/db/schema`.
- Genera migraciones con `npm run db:generate`.
- Versiona siempre `drizzle/`.
- Si añades seeds, hazlos idempotentes con `onConflict`.
- No hagas queries SQL ad hoc si Drizzle cubre el caso de forma clara.

## Pagos

- El cliente nunca envía importes finales.
- El checkout debe resolver precio, producto, moneda y permisos desde base de datos.
- Usa `src/lib/payments` para proveedores.
- Al añadir un proveedor, implementa el contrato común y añade tests de webhook/mapping.
- Mantén webhooks idempotentes y verifica firmas siempre.

## UI y Accesibilidad

- Usa los componentes existentes antes de crear patrones nuevos.
- Sigue [sistema-visual.md](./sistema-visual.md) y consume tokens semánticos; no introduzcas paletas locales.
- Usa Phosphor para iconografía y no mezcles familias en el mismo producto.
- Evita grids repetidos de tarjetas cuando divisores, listas o espacio comuniquen mejor la jerarquía.
- Mantén navegación y CTAs con enlaces semánticos cuando navegan.
- Usa estados vacíos, loading y errores cuando haya datos remotos.
- Mantén contraste, foco visible y textos accionables.
- Evita meter UI de producto en la landing si pertenece a dashboard.

## Seguridad

- Ejecuta `npm audit` después de cambiar dependencias.
- No añadas `dangerouslySetInnerHTML` sin sanitización clara.
- No registres secretos ni payloads sensibles.
- Valida inputs con Zod o tipos controlados.
- Usa redirects internos cuando el usuario pueda influir en una URL.
- Aplica rate limiting en endpoints públicos, auth, checkout y operaciones administrativas.
- En producción usa `RATE_LIMIT_BACKEND=database`; reserva el backend en memoria para desarrollo y tests.

## Verificación Obligatoria

Antes de cerrar una tarea de código, ejecuta:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

Si el cambio toca Docker o despliegue:

```bash
docker build -t baseboilerplate-audit .
```

Si hay una instancia levantada:

```bash
BASE_URL=http://127.0.0.1:3000 npm run test:smoke
```

Si el cambio toca base de datos:

```bash
npm run db:generate
npm run db:migrate
```

## Checklist para una Página Pública

- Metadata propia si el contenido no coincide con la home.
- `h1` descriptivo.
- Copy visible y útil sin autenticación.
- Canonical correcto.
- Enlace incluido en navegación o sitemap si debe indexarse.
- No depende de secretos ni sesión.
- Open Graph correcto.
- Responsive validado.

## Checklist para una Funcionalidad Privada

- Ruta protegida por middleware/proxy.
- Handler valida sesión.
- Handler valida autorización por rol o workspace.
- Inputs validados.
- Rate limit aplicado si la ruta recibe tráfico de usuario o puede ser abusada.
- Queries acotadas por ownership.
- Tests mínimos de lógica crítica.
- No aparece en sitemap.
