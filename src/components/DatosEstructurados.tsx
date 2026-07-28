import type { Schema } from "@/lib/schema";

/**
 * Pinta uno o varios bloques JSON-LD.
 *
 * `JSON.stringify` es seguro aquí porque escapamos `<`: sin eso, un nombre de
 * sitio que contuviera "</script>" cerraría la etiqueta antes de tiempo. Es el
 * único vector de inyección que tiene un script de tipo application/ld+json.
 */
export function DatosEstructurados({ schema }: { schema: Schema | Schema[] }) {
  const bloques = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {bloques.map((bloque, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(bloque).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
