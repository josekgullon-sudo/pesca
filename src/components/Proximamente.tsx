import Link from "next/link";

/** Pantalla puente para las secciones que aún no están construidas. */
export function Proximamente({
  titulo,
  bloque,
  descripcion,
}: {
  titulo: string;
  bloque: string;
  descripcion: string;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
      <p className="leading-relaxed text-texto-suave">{descripcion}</p>
      <p className="rounded-xl border border-borde bg-fondo-elevado p-4 leading-relaxed">
        Todavía no está montada: llega en el {bloque}.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
