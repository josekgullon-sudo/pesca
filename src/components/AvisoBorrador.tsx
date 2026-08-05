import Link from "next/link";

/**
 * La banda que avisa de que esto es una vista previa.
 *
 * Solo la ve un administrador: para cualquier otro, una provincia sin publicar
 * responde 404. Está para poder revisar los textos y las fichas antes de
 * darle a publicar, no después.
 *
 * La página que la incluye tiene que ir además con `robots: noindex`. Google
 * nunca va a entrar aquí —no tiene sesión, así que recibe el 404—, pero si
 * algún día cambia la forma de autenticar, el noindex sigue puesto.
 */
export function AvisoBorrador({
  provincia,
  slug,
}: {
  provincia: string;
  slug: string;
}) {
  return (
    <div
      role="note"
      className="rounded-xl border-2 border-ambar-texto/40 bg-ambar-fondo p-4 text-ambar-texto"
    >
      <p className="font-bold">
        Vista previa: {provincia} todavía no está publicada
      </p>
      <p className="mt-1 max-w-prose leading-relaxed">
        Esto solo lo ves tú. Para el resto del mundo esta dirección responde
        404, y no entra en el sitemap ni en el buscador. Falta el listado de
        áreas delimitadas para especies exóticas invasoras de la provincia y
        comprobar sitio por sitio cuáles salen en él.
      </p>
      <Link
        href={`/admin/provincias/${slug}`}
        className="mt-3 inline-flex min-h-touch items-center rounded-lg bg-ambar-texto px-4 font-semibold text-ambar-fondo"
      >
        Terminar de rellenarla
      </Link>
    </div>
  );
}
