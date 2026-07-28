import type { Metadata } from "next";
import Link from "next/link";
import { AvisoLegal } from "@/components/AvisoLegal";
import { metadatosDePagina } from "@/lib/marca";

export const metadata: Metadata = metadatosDePagina({
  titulo: "Normas de uso",
  descripcion:
    "Qué se puede publicar aquí y qué no, y cómo se modera lo que sube la gente.",
  ruta: "/normas",
});

export default function PaginaNormas() {
  return (
    <div className="mx-auto max-w-prose space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Normas de uso</h1>

      <p className="leading-relaxed">
        Esto es una web de pescadores para pescadores. Las normas son pocas y
        van de sentido común.
      </p>

      <section>
        <h2 className="mb-2 text-xl font-bold">Sube solo lo tuyo</h2>
        <p className="leading-relaxed">
          Fotos hechas por ti, de capturas tuyas. Nada de imágenes sacadas de
          internet ni de capturas de otros. Al subir una foto sigues siendo su
          dueño; solo nos das permiso para mostrarla aquí.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Respeta la ley de pesca</h2>
        <p className="leading-relaxed">
          No se admiten capturas de especies cuya pesca está prohibida ni de
          especies invasoras fuera de las áreas delimitadas, ni nada que se haya
          pescado sin licencia o en veda. Cada ficha de especie lleva su
          semáforo legal, y no está de adorno.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Sé honesto con los pesos</h2>
        <p className="leading-relaxed">
          El ranking solo vale algo si los números son reales. Inflar un peso
          para subir puestos estropea la web para todos.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Nada de faltar al respeto</h2>
        <p className="leading-relaxed">
          Ni en los nombres, ni en las notas, ni en las fotos. Tampoco se
          admiten datos personales de terceros ni publicidad.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Qué pasa si no se cumplen</h2>
        <p className="leading-relaxed">
          Se retira el contenido y, si se repite, se cierra la cuenta. Puedes
          borrar tu cuenta tú mismo cuando quieras desde{" "}
          <Link
            href="/cuenta"
            className="font-semibold text-acento underline underline-offset-2"
          >
            Mi cuenta
          </Link>
          .
        </p>
      </section>

      <AvisoLegal variante="destacado" />
    </div>
  );
}
