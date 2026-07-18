export default function Loading() {
  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-label="Cargando contenido">
      <div className="max-w-3xl space-y-5">
        <div className="skeleton h-4 w-36 rounded" />
        <div className="skeleton h-12 w-full max-w-2xl rounded-lg" />
        <div className="skeleton h-6 w-full max-w-xl rounded" />
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
      <span className="sr-only">Cargando</span>
    </main>
  );
}
