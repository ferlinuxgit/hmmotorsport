# Sistema visual

## Progreso de navegación

La app monta un único `NavigationProgressProvider` en el layout raíz. Una barra superior accesible aparece al navegar entre
rutas internas, incluyendo cambios de query y back/forward, y termina cuando App Router confirma el nuevo estado. Enlaces
externos, descargas, hashes, nuevas pestañas y clics con modificadores no activan el indicador.

Para navegación programática se usa `useProgressRouter()` en lugar de `useRouter()` cuando `push`, `replace`, `back` o
`forward` cambian de página. `refresh()` no activa la barra porque no garantiza un cambio de URL. Un watchdog evita estados
atascados y `prefers-reduced-motion` elimina la animación sin ocultar el estado.

## Objetivo

La interfaz debe comunicar que el repositorio es una foundation técnica seria, no un producto vertical terminado. El lenguaje combina estructura editorial en marketing con minimalismo funcional en las superficies privadas.

## Principios

- una sola paleta semántica para toda la aplicación
- jerarquía mediante tipografía, espacio y divisores antes que mediante tarjetas
- contenedores únicamente cuando agrupan una unidad funcional
- una sola familia de iconos: Phosphor
- movimiento breve y motivado por feedback
- temas claro y oscuro según la preferencia del sistema
- colapso explícito a una columna por debajo de `768px`

## Tipografía

- `Manrope`: títulos, cuerpo, navegación y controles
- `IBM Plex Mono`: rutas, identificadores, cifras técnicas y metadatos
- títulos con tracking negativo entre `-0.025em` y `-0.045em`
- cuerpo con `line-height` amplio y ancho recomendado de `55ch` a `65ch`
- cifras operativas con `tabular-nums`

## Color

Los tokens viven en `src/app/globals.css` y se consumen por función:

- `background`: lienzo global
- `foreground`: texto principal
- `card`: superficie elevada o agrupada
- `primary`: acción, foco y estado positivo principal
- `secondary`: agrupación suave
- `muted`: estados neutros
- `destructive`: errores y acciones destructivas
- `border`, `input`, `ring`: estructura e interacción

No se deben introducir colores directos en componentes salvo casos de visualización de datos documentados.

## Forma y superficies

- botones e inputs: radio `8px`
- superficies principales: radio `16px`
- paneles de marketing excepcionales: radio máximo `24px`
- badges: radio `6px`
- sombras difusas y de baja opacidad
- evitar cajas anidadas y grids de tarjetas idénticas

## Interacción

- todos los controles muestran foco visible
- acciones presionadas usan una escala máxima de `0.98`
- hover no puede ser el único indicador de estado
- animaciones respetan `prefers-reduced-motion`
- loading usa skeletons que conservan el tamaño final
- errores aparecen en contexto y mediante regiones `aria-live` cuando corresponda

## Responsive

- gutters: `16px` móvil, `24px` desde `sm`
- navegación desktop a partir de `lg`
- navegación móvil dentro de un panel controlado por un botón con `aria-expanded`
- tablas administrativas permiten scroll horizontal sin comprimir columnas
- CTAs mantienen texto en una línea y pueden apilarse en móvil
- se usa `min-height: 100dvh`, nunca `100vh`, para superficies de altura completa

## Superficies

### Marketing

Puede usar más contraste de escala, composición asimétrica y paneles de demostración. Debe conservar un hero breve, un CTA principal y contenido real sobre la arquitectura.

### Auth y cuenta

Prioriza confianza, instrucciones claras, labels persistentes, helper text y errores inline. No utiliza copy interna de implementación como propuesta principal.

### Dashboard y backoffice

Prioriza densidad moderada, números tabulares, divisores, tablas semánticas y estados vacíos. Las tarjetas solo agrupan unidades operativas completas.

## Verificación

El script `scripts/check-built-styles.mjs` se ejecuta como `postbuild` y falla si el CSS de producción pierde utilities fundamentales. Cualquier cambio visual debe validarse al menos en `390x844` y `1440x1000`.
