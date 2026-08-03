export const hmNavigation = [
  { title: "Inicio", href: "/" },
  { title: "Servicios", href: "/servicios" },
  { title: "Quiénes somos", href: "/quienes-somos" },
  { title: "Contacto", href: "/contacto" }
] as const;

export const contact = {
  electronics: {
    label: "Electrónica",
    display: "622 32 38 78",
    phone: "34622323878"
  },
  mechanics: {
    label: "Mecánica",
    display: "666 05 25 11",
    phone: "34666052511"
  },
  email: "contacto@hmmotorsport.es",
  address: "Av. de la Libertad, 160 · 03340 Albatera, Alicante",
  maps: "https://maps.app.goo.gl/mFm3VwidiAZEXdLh8",
  instagram: "https://www.instagram.com/hmmotorsport.es/"
} as const;

export type Service = {
  slug: string;
  code: string;
  title: string;
  shortTitle: string;
  description: string;
  image: string;
  imageAlt: string;
  tags: readonly string[];
  detailAvailable: boolean;
  contactArea: "electronics" | "mechanics";
};

export const services: Service[] = [
  {
    slug: "calibracion-ecu",
    code: "REMAP",
    title: "Calibración ECU, PDM y CAN Bus",
    shortTitle: "Calibración ECU",
    description: "Calibración a medida, integración de módulos y estrategias de protección orientadas a rendimiento útil y fiabilidad.",
    image: "/images/hm/calibracion-ecu.jpeg",
    imageAlt: "Equipos ECU Master en el banco de electrónica de HM Motorsport",
    tags: ["ECU", "PDM", "Dataloggers"],
    detailAvailable: true,
    contactArea: "electronics"
  },
  {
    slug: "banco-de-potencia",
    code: "DYNO",
    title: "Banco de potencia RollingDyno",
    shortTitle: "Banco de potencia",
    description: "Medición bajo carga para comprobar resultados, detectar límites y validar cada preparación con datos reales.",
    image: "/images/hm/banco-potencia.webp",
    imageAlt: "Vehículo sobre el banco de potencia de rodillos",
    tags: ["Dyno", "Validación", "Datos"],
    detailAvailable: true,
    contactArea: "electronics"
  },
  {
    slug: "cableado-motorsport",
    code: "WIRING",
    title: "Cableado Clubsport y Motorsport",
    shortTitle: "Cableado Motorsport",
    description: "Harnesses a medida, ordenados y mantenibles, fabricados para soportar vibración, temperatura y uso intensivo.",
    image: "/images/hm/cableado.jpeg",
    imageAlt: "Conectores y cableado motorsport fabricados a medida",
    tags: ["Clubsport", "Motorsport", "Race spec"],
    detailAvailable: true,
    contactArea: "electronics"
  },
  {
    slug: "preparacion-motor",
    code: "BUILD",
    title: "Motores, cajas y diferenciales",
    shortTitle: "Preparación mecánica",
    description: "Preparación y potenciación según el uso real del coche, con una base sólida y prioridades claras.",
    image: "/images/hm/motor.jpg",
    imageAlt: "Motor de altas prestaciones preparado en taller",
    tags: ["Motores", "Cambios", "Diferenciales"],
    detailAvailable: true,
    contactArea: "mechanics"
  },
  {
    slug: "fabricacion-y-montaje",
    code: "WELDING",
    title: "Fabricación y soldadura TIG",
    shortTitle: "Fabricación a medida",
    description: "Escapes, admisiones, intercoolers, radiadores, soportes y piezas que necesitan resolverse desde cero.",
    image: "/images/hm/fabricacion.jpg",
    imageAlt: "Trabajo de fabricación y soldadura TIG en HM Motorsport",
    tags: ["Escape", "Admisión", "Custom"],
    detailAvailable: true,
    contactArea: "mechanics"
  },
  {
    slug: "jaulas-antivuelco",
    code: "SAFETY",
    title: "Jaulas antivuelco",
    shortTitle: "Seguridad",
    description: "Instalación de jaulas AST adaptadas a las necesidades de calle, tandas o competición.",
    image: "/images/hm/jaula.jpeg",
    imageAlt: "Jaula antivuelco instalada en un vehículo de competición",
    tags: ["AST", "Roll cage", "Safety"],
    detailAvailable: true,
    contactArea: "mechanics"
  },
  {
    slug: "asistencia-en-carreras",
    code: "TRACK",
    title: "Asistencia en carreras",
    shortTitle: "Track support",
    description: "Soporte técnico en pista con experiencia real en rally, drift y resistencia.",
    image: "/images/hm/asistencia-pista.jpg",
    imageAlt: "Equipo técnico prestando asistencia a un coche en circuito",
    tags: ["Rally", "Drift", "Resistencia"],
    detailAvailable: true,
    contactArea: "mechanics"
  }
];

export type ServiceDetail = {
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  imageAlt: string;
  highlights: readonly string[];
  problemTitle: string;
  problemIntro: string;
  problems: readonly { title: string; text: string }[];
  outcomeTitle: string;
  outcomeText: string;
  includes: readonly { label: string; title: string; text: string }[];
  process: readonly string[];
  requirements: readonly string[];
  faqs: readonly { question: string; answer: string }[];
  contactArea: "electronics" | "mechanics";
};

export const serviceDetails: Record<string, ServiceDetail> = {
  "cableado-motorsport": {
    slug: "cableado-motorsport",
    eyebrow: "Servicio · Wiring",
    title: "Cableado Motorsport, hecho para no fallar.",
    intro: "Diseñamos y fabricamos harnesses robustos, ordenados y mantenibles. Menos averías intermitentes, diagnóstico más rápido y una instalación preparada para evolucionar.",
    image: "/images/hm/cableado.jpeg",
    imageAlt: "Conectores y cableado motorsport fabricados a medida",
    highlights: ["Arquitectura modular", "ECU · Dash · CAN", "Documentación y orden"],
    problemTitle: "Cuando el cableado falla, todo parece fallar.",
    problemIntro: "El sistema eléctrico es el sistema nervioso del coche. Un montaje sin criterio multiplica el tiempo de diagnóstico y limita cualquier evolución futura.",
    problems: [
      { title: "Vibración y calor", text: "Cortes, falsos contactos y aislamientos dañados cuando el material o el routing no son adecuados." },
      { title: "Parches acumulados", text: "Empalmes, conectores pobres y añadidos que hacen imposible seguir una lógica de instalación." },
      { title: "Señales inestables", text: "Ruido, masas mal resueltas o problemas de comunicación entre ECU, CAN, dash y sensores." },
      { title: "Diagnóstico lento", text: "Sin etiquetado, accesibilidad ni documentación, cada revisión empieza desde cero." }
    ],
    outcomeTitle: "Más rendimiento por fiabilidad.",
    outcomeText: "Muchas pérdidas de rendimiento nacen en lecturas erróneas o fallos eléctricos. Una arquitectura limpia aporta consistencia y permite trabajar con seguridad.",
    includes: [
      { label: "01 · Diseño", title: "Arquitectura", text: "Definición de alimentaciones, masas, señales, sensores, CAN y módulos antes de fabricar." },
      { label: "02 · Fabricación", title: "Harness a medida", text: "Materiales, conectores y routing pensados para vibración, temperatura y mantenimiento." },
      { label: "03 · Validación", title: "Verificación final", text: "Continuidad, aislamiento, coherencia de señales y prueba funcional de la integración." },
      { label: "04 · Entrega", title: "Documentación", text: "Etiquetado y esquema básico para reducir tiempos de mantenimiento y futuras ampliaciones." }
    ],
    process: ["Brief técnico del coche, uso y componentes", "Diseño de señales, conectores y arquitectura", "Fabricación modular y mantenible", "Integración, verificación y entrega"],
    requirements: ["Lista de ECU, dash, sensores y módulos", "Uso: calle, tandas o competición", "Fotos del vano e instalación existente", "Objetivo, presupuesto orientativo y plazo"],
    faqs: [
      { question: "¿Podéis rehacer una instalación existente?", answer: "Sí. Primero valoramos si merece la pena corregirla y ordenarla o si resulta más fiable reconstruir desde cero." },
      { question: "¿Integráis CAN, dash y módulos?", answer: "Sí. Diseñamos la arquitectura pensando en diagnóstico rápido y ampliaciones futuras." },
      { question: "¿Puede hacerse por fases?", answer: "Sí. Podemos empezar por alimentación, masas y señales críticas, y añadir módulos o sensores después." },
      { question: "¿Cuánto tarda?", answer: "Depende de la complejidad y del inventario de componentes. Con la lista y las fotos podemos dar un plazo realista." }
    ],
    contactArea: "electronics"
  },
  "calibracion-ecu": {
    slug: "calibracion-ecu",
    eyebrow: "Servicio · ECU",
    title: "Potencia útil. Márgenes seguros. Resultados repetibles.",
    intro: "Calibramos cada estrategia según el coche y su uso real. Priorizamos respuesta, control térmico y consistencia antes que una cifra aislada de potencia.",
    image: "/images/hm/calibracion-ecu.jpeg",
    imageAlt: "Equipos ECU Master en el banco de electrónica de HM Motorsport",
    highlights: ["Calle y circuito", "Control térmico", "Validación con datos"],
    problemTitle: "Calibrar no es simplemente subir presión.",
    problemIntro: "Una buena puesta a punto ajusta entrega de par, mezcla, avance, protecciones y comportamiento. Si la base no está sana, primero se corrige.",
    problems: [
      { title: "Respuesta", text: "Una entrega de par más utilizable, progresiva y fácil de controlar." },
      { title: "Consistencia", text: "El coche debe rendir de la misma forma vuelta tras vuelta, no solo durante una lanzada." },
      { title: "Seguridad", text: "Temperaturas, combustible, encendido y knock dentro de márgenes adecuados para el setup." },
      { title: "Diagnóstico", text: "Los datos permiten localizar límites reales antes de añadir hardware o exigir más al conjunto." }
    ],
    outcomeTitle: "Más rápido en la práctica.",
    outcomeText: "En muchos coches, la mejora real está en la respuesta, el par utilizable y el control térmico. Eso aporta confianza y tiempo por vuelta.",
    includes: [
      { label: "01 · Base", title: "Revisión previa", text: "Objetivo, setup, sensores, fugas, combustible, errores y coherencia de lecturas." },
      { label: "02 · Estrategia", title: "Calibración", text: "Ajuste de mapas, protecciones, respuesta y entrega de par según ECU y objetivo." },
      { label: "03 · Carga", title: "Validación", text: "Comprobación de temperaturas, estabilidad y comportamiento bajo condiciones reales." },
      { label: "04 · Entrega", title: "Recomendaciones", text: "Resumen de límites encontrados y próximos pasos si el proyecto necesita evolucionar." }
    ],
    process: ["Brief de coche, uso, objetivo y modificaciones", "Diagnóstico de base y sensores", "Calibración y ajuste de estrategia", "Validación, checklist y entrega"],
    requirements: ["Marca, modelo, año y motorización", "ECU instalada, si se conoce", "Lista completa de modificaciones", "Combustible habitual y objetivo principal"],
    faqs: [
      { question: "¿Se puede calibrar un coche de calle?", answer: "Sí, siempre que la base esté bien. Revisamos estado y sensores antes de exigir más al conjunto." },
      { question: "¿Cuánto tarda?", answer: "Depende del setup y del estado del coche. Lo concretamos después de revisar la información inicial." },
      { question: "¿Trabajáis coches para tandas o competición?", answer: "Sí. En circuito priorizamos consistencia y seguridad térmica por encima de picos puntuales." },
      { question: "¿Y si no sé qué objetivo es realista?", answer: "Cuéntanos el uso y el presupuesto. Te proponemos un plan por fases con prioridades claras." }
    ],
    contactArea: "electronics"
  },
  "banco-de-potencia": {
    slug: "banco-de-potencia",
    eyebrow: "Servicio · RollingDyno",
    title: "Medir, entender y validar antes de exigir más.",
    intro: "El banco de potencia permite trabajar bajo carga en un entorno controlado. Medimos la entrega, revisamos parámetros críticos y comprobamos si cada modificación funciona como debe.",
    image: "/images/hm/banco-potencia.webp",
    imageAlt: "Vehículo sobre el banco de potencia de rodillos de HM Motorsport",
    highlights: ["Pruebas bajo carga", "Datos comparables", "Diagnóstico técnico"],
    problemTitle: "Una cifra máxima no explica cómo funciona el coche.",
    problemIntro: "La curva completa, la repetibilidad y los datos registrados muestran mucho más que un pico de potencia. El banco ayuda a localizar límites y tomar decisiones con una base objetiva.",
    problems: [
      { title: "Entrega irregular", text: "Caídas de par, oscilaciones o zonas pobres de respuesta que en carretera resultan difíciles de aislar." },
      { title: "Temperatura", text: "Pérdida de rendimiento cuando admisión, refrigeración o lubricación dejan de trabajar dentro de margen." },
      { title: "Mezcla y encendido", text: "Valores que pueden limitar prestaciones o comprometer la fiabilidad cuando el motor trabaja bajo carga." },
      { title: "Cambios sin validar", text: "Hardware instalado sin una comparación clara que confirme su efecto real sobre el conjunto." }
    ],
    outcomeTitle: "Decisiones apoyadas en datos.",
    outcomeText: "Una medición útil sirve para comparar, diagnosticar y definir el siguiente paso. El objetivo es conocer el comportamiento del coche, no perseguir una cifra aislada.",
    includes: [
      { label: "01 · Preparación", title: "Revisión inicial", text: "Confirmamos configuración, combustible, estado básico y objetivo de la sesión antes de cargar el vehículo." },
      { label: "02 · Medición", title: "Lanzadas controladas", text: "Realizamos pruebas adaptadas al coche y registramos la evolución de potencia y par." },
      { label: "03 · Lectura", title: "Datos críticos", text: "Revisamos los canales disponibles para interpretar mezcla, presión, temperaturas y comportamiento." },
      { label: "04 · Cierre", title: "Conclusiones", text: "Explicamos los límites encontrados y qué conviene corregir, mantener o desarrollar después." }
    ],
    process: ["Definición del objetivo de la prueba", "Inspección y preparación del vehículo", "Mediciones progresivas bajo carga", "Comparación de datos y recomendaciones"],
    requirements: ["Marca, modelo, motor y tipo de transmisión", "Lista de modificaciones y calibración actual", "Combustible utilizado habitualmente", "Objetivo: diagnóstico, comparación o puesta a punto"],
    faqs: [
      { question: "¿El banco sirve solo para saber la potencia?", answer: "No. También permite estudiar la forma de entrega, comparar cambios y detectar comportamientos que requieren diagnóstico." },
      { question: "¿Puedo hacer una medición antes y después?", answer: "Sí. Es la forma más clara de comprobar el efecto de una modificación cuando las condiciones y la configuración son comparables." },
      { question: "¿Se puede probar cualquier coche?", answer: "Necesitamos conocer vehículo, transmisión, medidas y estado antes de confirmar la sesión. Así comprobamos compatibilidad y preparación necesaria." },
      { question: "¿Una sesión incluye calibración?", answer: "La medición y la calibración son alcances distintos. Si buscas puesta a punto, indícalo para planificar el trabajo completo." }
    ],
    contactArea: "electronics"
  },
  "preparacion-motor": {
    slug: "preparacion-motor",
    eyebrow: "Servicio · Powertrain",
    title: "Motor, transmisión y diferencial como un solo conjunto.",
    intro: "Planteamos la preparación mecánica según el uso, el nivel de potencia y la capacidad real del coche. Priorizamos una base coherente, mantenible y capaz de soportar el trabajo previsto.",
    image: "/images/hm/motor.jpg",
    imageAlt: "Motor de altas prestaciones preparado en el taller de HM Motorsport",
    highlights: ["Motor y periféricos", "Caja y embrague", "Diferencial y tracción"],
    problemTitle: "Más potencia descubre el siguiente punto débil.",
    problemIntro: "El motor no trabaja aislado. Refrigeración, lubricación, embrague, caja, diferencial y soportes deben responder al mismo objetivo para evitar una preparación desequilibrada.",
    problems: [
      { title: "Base desconocida", text: "Desgaste, compresión irregular o mantenimiento pendiente antes de aumentar carga y temperatura." },
      { title: "Temperatura y presión", text: "Sistemas de refrigeración o lubricación que no mantienen condiciones estables durante un uso exigente." },
      { title: "Transmisión al límite", text: "Embrague, caja o palieres dimensionados para un par inferior al que se pretende alcanzar." },
      { title: "Tracción desaprovechada", text: "Un diferencial o una puesta a punto mecánica que no convierten la potencia disponible en avance útil." }
    ],
    outcomeTitle: "Una preparación que funciona como conjunto.",
    outcomeText: "Ordenamos las prioridades para que potencia, temperatura, transmisión y mantenimiento evolucionen al mismo ritmo y de acuerdo con el presupuesto.",
    includes: [
      { label: "01 · Diagnóstico", title: "Estado de base", text: "Revisamos configuración, síntomas, historial y controles necesarios antes de definir componentes." },
      { label: "02 · Proyecto", title: "Plan mecánico", text: "Relacionamos objetivo, uso, par esperado, refrigeración, transmisión y fases de ejecución." },
      { label: "03 · Montaje", title: "Integración", text: "Ejecutamos el alcance acordado cuidando compatibilidades, accesibilidad y mantenimiento posterior." },
      { label: "04 · Puesta en marcha", title: "Comprobación", text: "Verificamos funcionamiento, fluidos, temperaturas y puntos de revisión antes de la entrega." }
    ],
    process: ["Brief de uso, potencia y presupuesto", "Diagnóstico del conjunto actual", "Propuesta de componentes y fases", "Montaje, puesta en marcha y controles"],
    requirements: ["Datos completos del vehículo y motorización", "Potencia actual y objetivo aproximado", "Uso previsto y frecuencia de circuito o competición", "Modificaciones, averías e historial de mantenimiento"],
    faqs: [
      { question: "¿Podéis preparar solo una parte del conjunto?", answer: "Sí. Podemos trabajar motor, transmisión o diferencial por separado, pero revisamos cómo afecta al resto antes de definir el alcance." },
      { question: "¿Es necesario abrir el motor?", answer: "No siempre. Depende del estado, el objetivo y la capacidad de los componentes de serie. Primero evaluamos la base." },
      { question: "¿Se puede plantear por fases?", answer: "Sí. De hecho, suele ser la forma más razonable de ordenar fiabilidad, refrigeración, transmisión y aumento de rendimiento." },
      { question: "¿Incluye la calibración electrónica?", answer: "La coordinamos cuando el proyecto lo necesita, pero se define como parte del alcance para reservar diagnosis, banco y puesta a punto." }
    ],
    contactArea: "mechanics"
  },
  "fabricacion-y-montaje": {
    slug: "fabricacion-y-montaje",
    eyebrow: "Servicio · TIG & Custom",
    title: "Fabricación a medida donde una pieza estándar no resuelve.",
    intro: "Diseñamos, adaptamos y fabricamos componentes para integrar escapes, admisiones, intercoolers, radiadores y soportes dentro de un proyecto concreto.",
    image: "/images/hm/fabricacion.jpg",
    imageAlt: "Trabajo de fabricación y soldadura TIG realizado en HM Motorsport",
    highlights: ["Medición en vehículo", "Soldadura TIG", "Integración a medida"],
    problemTitle: "Encajar no es lo mismo que integrar bien.",
    problemIntro: "Una pieza debe respetar espacio, temperatura, movimiento, accesibilidad y mantenimiento. Resolver solo la geometría suele trasladar el problema a otro punto del coche.",
    problems: [
      { title: "Espacio limitado", text: "Componentes que interfieren con carrocería, transmisión, dirección o elementos que necesitan mantenimiento." },
      { title: "Calor mal gestionado", text: "Recorridos y ubicaciones que transmiten temperatura a manguitos, cableado o zonas sensibles." },
      { title: "Tensiones y vibración", text: "Soportes rígidos o uniones mal planteadas que terminan fisurando o aflojando el montaje." },
      { title: "Pérdida de servicio", text: "Instalaciones que obligan a desmontar medio vehículo para una revisión o reparación habitual." }
    ],
    outcomeTitle: "Una pieza pensada para ese coche.",
    outcomeText: "La fabricación empieza entendiendo el sistema alrededor. Buscamos ajuste, resistencia, acceso y una terminación coherente con el uso del vehículo.",
    includes: [
      { label: "01 · Toma de datos", title: "Medición", text: "Revisamos espacio, puntos de anclaje, recorridos, movimiento y condicionantes térmicos." },
      { label: "02 · Definición", title: "Solución", text: "Acordamos geometría, materiales, uniones y posibilidad de desmontaje antes de fabricar." },
      { label: "03 · Fabricación", title: "Construcción TIG", text: "Cortamos, ajustamos y soldamos el componente de acuerdo con el alcance validado." },
      { label: "04 · Montaje", title: "Prueba final", text: "Comprobamos holguras, fijaciones, estanqueidad cuando aplica y accesibilidad del conjunto." }
    ],
    process: ["Revisión del vehículo y necesidad", "Medición y definición de la solución", "Fabricación, ajuste y soldadura", "Montaje y verificación final"],
    requirements: ["Vehículo y componente que se quiere integrar", "Objetivo y uso previsto", "Piezas ya compradas o medidas disponibles", "Limitaciones de espacio, plazo y presupuesto"],
    faqs: [
      { question: "¿Fabricáis escapes completos?", answer: "Podemos valorar líneas completas, tramos y adaptaciones. Necesitamos ver el coche y conocer uso, espacio y componentes existentes." },
      { question: "¿Podéis integrar un intercooler o radiador?", answer: "Sí, siempre que revisemos ubicación, soportes, tuberías, flujo de aire y accesibilidad como parte del mismo trabajo." },
      { question: "¿Trabajáis sobre una pieza que ya tengo?", answer: "Podemos estudiarlo. Antes comprobamos material, estado, dimensiones y si modificarla ofrece una solución fiable." },
      { question: "¿Se puede presupuestar solo con fotos?", answer: "Las fotos permiten una primera orientación, pero una fabricación precisa normalmente requiere medir o presentar el vehículo y los componentes." }
    ],
    contactArea: "mechanics"
  },
  "jaulas-antivuelco": {
    slug: "jaulas-antivuelco",
    eyebrow: "Servicio · Roll cage",
    title: "Una jaula bien integrada empieza antes del montaje.",
    intro: "Instalamos jaulas AST y planificamos su integración según el vehículo, el habitáculo y el uso previsto: calle, tandas o competición.",
    image: "/images/hm/jaula.jpeg",
    imageAlt: "Jaula antivuelco instalada en un vehículo preparado por HM Motorsport",
    highlights: ["Jaulas AST", "Integración interior", "Uso definido"],
    problemTitle: "La seguridad no admite una instalación improvisada.",
    problemIntro: "La elección de estructura y montaje debe contemplar carrocería, asientos, arneses, accesos, equipamiento y normativa aplicable al proyecto.",
    problems: [
      { title: "Uso mal definido", text: "Una configuración planteada sin diferenciar calle, track day o reglamento de competición." },
      { title: "Habitáculo incompatible", text: "Interferencias con asiento, casco, salpicadero, puertas, mandos o puntos de acceso." },
      { title: "Conjunto incompleto", text: "Jaula, asiento, arnés y anclajes seleccionados por separado sin revisar su relación." },
      { title: "Acabado y mantenimiento", text: "Montajes que dificultan inspección, protección anticorrosión o desmontaje de elementos próximos." }
    ],
    outcomeTitle: "Integración coherente con el proyecto.",
    outcomeText: "Definimos la configuración antes de intervenir para coordinar estructura, posición de conducción, equipamiento y requisitos del uso real.",
    includes: [
      { label: "01 · Definición", title: "Uso y configuración", text: "Identificamos disciplina, nivel de preparación y condicionantes reglamentarios antes de seleccionar." },
      { label: "02 · Presentación", title: "Ajuste en carrocería", text: "Comprobamos geometría, accesos, habitáculo y compatibilidad con el equipamiento existente." },
      { label: "03 · Instalación", title: "Montaje", text: "Ejecutamos el trabajo acordado cuidando uniones, apoyos, holguras y zonas próximas." },
      { label: "04 · Revisión", title: "Control del conjunto", text: "Verificamos terminación, interferencias y puntos que deben mantenerse accesibles." }
    ],
    process: ["Definición de uso y requisitos", "Selección y comprobación de compatibilidad", "Preparación del habitáculo e instalación", "Revisión de integración y entrega"],
    requirements: ["Marca, modelo, año y versión de carrocería", "Uso: calle, tandas o disciplina de competición", "Configuración de asientos, arneses e interior", "Reglamento aplicable si el vehículo compite"],
    faqs: [
      { question: "¿Una jaula sirve para calle y competición?", answer: "Depende de la configuración, el vehículo y la normativa aplicable. Hay que definir el uso antes de seleccionar e instalar." },
      { question: "¿Trabajáis con jaulas AST?", answer: "Sí. Valoramos la referencia y configuración adecuadas para el vehículo y el alcance del proyecto." },
      { question: "¿Hay que retirar todo el interior?", answer: "Depende del tipo de jaula y del montaje. Revisamos asientos, guarnecidos, salpicadero y accesos antes de presupuestar." },
      { question: "¿Gestionáis la homologación?", answer: "Primero confirmamos vehículo, configuración y uso. Con esos datos podemos indicarte qué documentación o gestión debe contemplar el proyecto." }
    ],
    contactArea: "mechanics"
  },
  "asistencia-en-carreras": {
    slug: "asistencia-en-carreras",
    eyebrow: "Servicio · Track support",
    title: "Soporte técnico para llegar a pista con un plan.",
    intro: "Preparamos y acompañamos proyectos de rally, drift y resistencia con una metodología centrada en prevención, tiempos de intervención y decisiones basadas en el estado real del coche.",
    image: "/images/hm/asistencia-pista.jpg",
    imageAlt: "Equipo técnico de HM Motorsport prestando asistencia a un coche en circuito",
    highlights: ["Rally · Drift · Resistencia", "Preparación previa", "Soporte en pista"],
    problemTitle: "En pista, cada problema cuesta tiempo útil.",
    problemIntro: "La asistencia empieza antes del evento. Revisiones, repuestos, herramientas, datos y responsabilidades deben estar definidos para poder reaccionar con criterio.",
    problems: [
      { title: "Preparación tardía", text: "Averías conocidas, consumibles o ajustes que llegan al evento sin tiempo para comprobarse." },
      { title: "Sin repuesto crítico", text: "Una pieza pequeña o un consumible detiene el programa porque no se priorizó antes de desplazarse." },
      { title: "Diagnóstico sin datos", text: "Síntomas difíciles de comparar cuando no existe una referencia previa ni registros del coche." },
      { title: "Cambios sin control", text: "Ajustes realizados entre tandas sin documentar qué se cambió ni cómo afectó al comportamiento." }
    ],
    outcomeTitle: "Más tiempo rodando, menos improvisación.",
    outcomeText: "Ordenamos preparación, medios y seguimiento para que cada decisión tenga un motivo y el equipo pueda concentrarse en el programa del evento.",
    includes: [
      { label: "01 · Plan", title: "Necesidades", text: "Definimos evento, coche, objetivos, personal, repuestos y nivel de asistencia necesario." },
      { label: "02 · Previo", title: "Preparación", text: "Revisamos puntos críticos y dejamos una base conocida antes del desplazamiento." },
      { label: "03 · Evento", title: "Asistencia técnica", text: "Realizamos controles, ajustes e intervenciones dentro del alcance y medios planificados." },
      { label: "04 · Seguimiento", title: "Cierre", text: "Registramos incidencias y prioridades para reparar, mantener o evolucionar el coche después." }
    ],
    process: ["Brief del evento, coche y objetivos", "Checklist técnico y planificación de medios", "Preparación previa y soporte en pista", "Informe de incidencias y próximos trabajos"],
    requirements: ["Disciplina, circuito o evento y fechas", "Ficha del vehículo y nivel de preparación", "Trabajo esperado antes y durante la prueba", "Repuestos, logística y personal ya disponibles"],
    faqs: [
      { question: "¿Dais asistencia en cualquier evento?", answer: "La disponibilidad y el alcance dependen de fechas, ubicación, disciplina y necesidades. Cuanto antes recibamos el calendario, mejor podremos valorarlo." },
      { question: "¿Podéis preparar el coche antes de la carrera?", answer: "Sí. Recomendamos incluir una revisión previa para llegar al evento con una base conocida y una lista de repuestos razonable." },
      { question: "¿La asistencia incluye transporte y recambios?", answer: "Se presupuestan según cada proyecto. Definimos por escrito desplazamiento, medios, consumibles, repuestos y responsabilidades." },
      { question: "¿Trabajáis rally, drift y resistencia?", answer: "Sí, valoramos proyectos de esas disciplinas adaptando el soporte a duración, reglamento y recursos del equipo." }
    ],
    contactArea: "mechanics"
  }
};

export function getServiceHref(service: Service) {
  if (service.detailAvailable) return `/servicios/${service.slug}`;
  return `/contacto?servicio=${service.slug}`;
}
