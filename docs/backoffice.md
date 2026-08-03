# Backoffice extensible

## Objetivo

El backoffice es una superficie operativa real del boilerplate. El core aporta las capacidades transversales y cada módulo
puede añadir accesos a su propia operación sin mover reglas de negocio a componentes genéricos.

La base evita un CRUD automático sobre cualquier tabla. Ese enfoque parece flexible, pero suele permitir mutaciones sin
validaciones de dominio, permisos finos o auditoría. Aquí cada acción pasa por un servicio explícito.

## Rutas incluidas

- `/admin`: resumen de usuarios, sesiones, tenants, billing, módulos, readiness y analítica
- `/admin/users`: búsqueda, filtros, paginación, cambio de rol y activación o desactivación
- `/admin/audit`: consulta paginada de acciones administrativas
- `/admin/workspaces`: creación, estado y búsqueda de tenants
- `/admin/workspaces/:workspaceId`: configuración, ownership, membresías e invitaciones por email
- `/admin/jobs`: estado, errores, cancelación y reintento de trabajo asíncrono
- `/admin/files`: búsqueda, estado, integridad y eliminación de objetos privados
- `/admin/configuration`: settings y feature flags con versiones, rollout y overrides por workspace
- `/admin/content`: páginas draft, published o archived, SEO y editor versionado
- `/admin/commerce`: catálogo, precios de pago único, órdenes y acceso a reembolsos
- `/admin/billing`: entitlements, reembolsos y reconciliación manual o programada

## Garantías de las acciones administrativas

- sesión real validada en servidor
- rol `admin` requerido en el servicio y en el route handler
- rate limiting distribuido en producción
- comprobación de origen en mutaciones autenticadas por cookie
- payload validado con Zod y límite de tamaño
- mutación y evento de auditoría en la misma transacción
- autoprotección: un admin no puede retirar su propio acceso
- protección ante lockout: no se puede desactivar o degradar el último admin activo
- bloqueo transaccional para serializar cambios críticos de administradores
- auditoría sin contraseñas, tokens ni secretos

## Extensión por módulos

Un módulo puede registrar enlaces con `backofficeNavigation`:

```ts
export const moduleDefinition: AppModule = {
  // resto del contrato
  backofficeNavigation: [
    {
      key: "academy-courses",
      title: "Cursos",
      description: "Catálogo y publicación de cursos.",
      href: "/admin/courses"
    }
  ]
};
```

El registro hace visible la superficie. La ruta, el servicio, el esquema y los permisos siguen viviendo dentro del dominio
correspondiente. Un enlace registrado nunca concede autorización por sí solo.

## Patrón para una nueva acción

1. Define el schema de entrada en el servicio del dominio.
2. Comprueba autorización global y, si aplica, pertenencia al workspace.
3. Ejecuta reglas, mutación y `audit_logs` dentro de una transacción.
4. Expón un route handler pequeño con auth, rate limit, origen y límite de body.
5. Añade pruebas unitarias de validación y una prueba de integración con PostgreSQL.
6. Registra la navegación desde la extensión.
7. Documenta el endpoint y la política de retención asociada.

## Modelo de auditoría

`audit_logs` registra actor, workspace opcional, acción estable, entidad, request id, IP operativa, metadata JSON acotada y
fecha. Los nombres de acción usan el formato `entidad.acción`, por ejemplo `user.updated`. La retención se controla con
`AUDIT_LOG_RETENTION_DAYS` y se aplica mediante `npm run db:maintenance`.

## Límites deliberados

La base administrativa transversal es funcional. Permanecen en cada producto:

- bandejas o workflows propios de la vertical
- permisos por recurso específico del dominio
- operación fiscal, impuestos y suscripciones si el negocio los necesita
- bandeja general de notificaciones, si aporta valor al equipo operativo

## Criterio de excelencia

Una nueva vertical debe poder aportar rutas y acciones administrativas sin modificar el layout del backoffice, saltarse la
autorización ni inventar otro sistema de auditoría.
