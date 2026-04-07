# Deploy en Coolify

## Archivos incluidos

- `Dockerfile`: construye la aplicación Next.js para producción
- `docker-compose.coolify.yml`: stack listo para Coolify con `app` y `postgres`
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
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_o_pk_test
CLERK_SECRET_KEY=sk_live_o_sk_test
DATABASE_MODE=internal
POSTGRES_DB=baseboilerplate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=una-password-segura
```

### Opción 2: Servicio app con Dockerfile

Si despliegas solo el servicio `app`, puedes conectarlo a:

- un PostgreSQL gestionado por Coolify
- un PostgreSQL externo

En ese caso usa:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_o_pk_test
CLERK_SECRET_KEY=sk_live_o_sk_test
DATABASE_MODE=external
DATABASE_URL=postgres://user:password@host:5432/database
```

## Notas operativas

- `next.config.ts` usa `output: "standalone"` para producción
- el contenedor expone `3000`
- el servicio app espera `APP_URL` correctamente definido
- Clerk requiere `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`
- la configuración sensible se valida en runtime de servidor, no en import global durante `build`
- si vas a ejecutar migraciones en despliegue, añade un job o comando separado con `npm run db:migrate`

## Recomendaciones

- no usar la contraseña por defecto en producción
- montar volumen persistente para postgres
- separar base de datos de producción si el proyecto escala o requiere backups gestionados
- mantener `DATABASE_MODE` explícito en cada entorno
