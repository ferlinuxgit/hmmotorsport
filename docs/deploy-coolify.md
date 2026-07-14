# Deploy en Coolify

## Archivos incluidos

- `Dockerfile`: construye la aplicación Next.js para producción
- `docker-compose.coolify.yml`: stack listo para Coolify con `app` y `postgres`
- `docker-compose.external.yml`: stack solo `app` para PostgreSQL gestionado o externo
- `.env.example`: variables base para alternar entre PostgreSQL interno o externo

## Estrategia

La aplicación siempre consume una única variable efectiva: `DATABASE_URL`.

Esa URL se resuelve así:

- si `DATABASE_MODE=external`, se usa `DATABASE_URL`
- si `DATABASE_MODE=internal`, la app construye la URL usando `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER` y `POSTGRES_PASSWORD`
- si `DATABASE_MODE=internal` pero `DATABASE_URL` está definida, se prioriza `DATABASE_URL`

Esto permite:

- usar el contenedor postgres incluido
- cambiar a una base externa sin tocar código
- mover el proyecto entre local, staging y producción con solo variables de entorno

## Despliegue recomendado en Coolify

### Opción 1: Docker Compose

Usar `docker-compose.coolify.yml` como stack.

Variables mínimas:

```env
APP_URL=https://tu-dominio.com
BETTER_AUTH_SECRET=reemplazar-con-un-secreto-largo
BETTER_AUTH_URL=https://tu-dominio.com
DATABASE_MODE=internal
POSTGRES_DB=baseboilerplate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=una-password-segura
```

### Opción 2: Servicio app con Dockerfile o compose externo

Si despliegas solo el servicio `app`, puedes conectarlo a:

- un PostgreSQL gestionado por Coolify
- un PostgreSQL externo

En ese caso usa `docker-compose.external.yml` o un servicio Dockerfile con:

```env
BETTER_AUTH_SECRET=reemplazar-con-un-secreto-largo
BETTER_AUTH_URL=https://tu-dominio.com
DATABASE_MODE=external
DATABASE_URL=postgres://user:password@host:5432/database
```

## Notas operativas

- `next.config.ts` usa `output: "standalone"` para producción
- el contenedor expone `3000`
- el servicio app espera `APP_URL` correctamente definido
- Better Auth requiere `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL`
- la configuración sensible se valida en runtime de servidor, no en import global durante `build`
- el contenedor ejecuta `scripts/migrate.mjs` al arrancar si `RUN_MIGRATIONS=true`; usa `RUN_MIGRATIONS=false` si prefieres un job separado

## Recomendaciones

- no usar la contraseña por defecto en producción
- montar volumen persistente para postgres
- separar base de datos de producción si el proyecto escala o requiere backups gestionados
- mantener `DATABASE_MODE` explícito en cada entorno
