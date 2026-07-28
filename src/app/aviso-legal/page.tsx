import type { Metadata } from "next";
import Link from "next/link";
import { AvisoLegal } from "@/components/AvisoLegal";
import { FECHA_DATOS_LEGALES } from "@/lib/avisos";
import { metadatosDePagina } from "@/lib/marca";

export const metadata: Metadata = metadatosDePagina({
  titulo: "Aviso legal y privacidad",
  descripcion:
    "Quién hay detrás de la web, qué datos se guardan y cómo pedir que se borren.",
  ruta: "/aviso-legal",
});

/**
 * OJO, ESTO HAY QUE COMPLETARLO ANTES DE PUBLICAR.
 *
 * Una web pública que recoge emails, fotos y ubicaciones de personas está
 * sujeta al RGPD y a la LSSI. Este texto describe con honestidad lo que la
 * aplicación hace de verdad, pero los datos del responsable hay que rellenarlos
 * y conviene que alguien que sepa lo revise.
 */
const RESPONSABLE = {
  nombre: "[COMPLETAR: nombre del responsable]",
  contacto: "[COMPLETAR: email de contacto]",
};

export default function PaginaAvisoLegal() {
  return (
    <div className="contenedor max-w-prose space-y-6 py-10 md:py-14">
      <h1 className="text-3xl font-bold tracking-tight">
        Aviso legal y privacidad
      </h1>

      <div className="rounded-xl border-2 border-ambar-texto/30 bg-ambar-fondo p-4 text-ambar-texto">
        <p className="font-bold">Pendiente de completar</p>
        <p className="mt-1 leading-relaxed">
          Faltan los datos del responsable. Están marcados abajo y hay que
          rellenarlos antes de abrir la web al público.
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-xl font-bold">Quién responde de esta web</h2>
        <p className="leading-relaxed">
          {RESPONSABLE.nombre}. Contacto: {RESPONSABLE.contacto}. Es un proyecto
          personal, sin ánimo de lucro y sin publicidad.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Qué datos se guardan</h2>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            <strong>Si solo consultas la web</strong>, ninguno. No hay analítica
            ni cookies de seguimiento.
          </li>
          <li>
            <strong>Si creas una cuenta</strong>: tu nombre visible, tu email y
            tu contraseña, que se guarda cifrada con bcrypt y no se puede
            recuperar en claro. El email no se muestra a nadie ni aparece en
            ninguna dirección de la web.
          </li>
          <li>
            <strong>Si registras capturas</strong>: lo que apuntes (especie,
            sitio, peso, fecha, notas), las fotos que subas y, si lo autorizas,
            las coordenadas del móvil.
          </li>
          <li>
            <strong>Una cookie de sesión</strong> mientras estés dentro, para
            saber quién eres. Es imprescindible para el funcionamiento y no se
            usa para nada más.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Qué se ve públicamente</h2>
        <p className="leading-relaxed">
          Tu nombre visible, tus capturas, sus fotos y el sitio donde las
          pescaste. <strong>Las coordenadas exactas no</strong>: solo se enseñan
          a quien haya entrado con una cuenta. Tu email no se muestra nunca.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Dónde están</h2>
        <p className="leading-relaxed">
          En un servidor propio. No se ceden a terceros, no se venden y no hay
          servicios externos de analítica ni de publicidad.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Tus derechos</h2>
        <p className="leading-relaxed">
          Puedes acceder, rectificar y borrar tus datos. El borrado lo puedes
          hacer tú mismo desde{" "}
          <Link
            href="/cuenta"
            className="font-semibold text-acento underline underline-offset-2"
          >
            Mi cuenta
          </Link>
          : se elimina la cuenta, todas tus capturas y todas tus fotos, sin
          copias. Para cualquier otra cosa, escribe a {RESPONSABLE.contacto}.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Sobre la información de pesca</h2>
        <p className="leading-relaxed">
          Los datos de sitios, especies y normativa son orientativos y están
          contrastados a {FECHA_DATOS_LEGALES}. Las abundancias y probabilidades
          son estimaciones, no un censo oficial. Quien sale a pescar es
          responsable de cumplir la normativa vigente.
        </p>
      </section>

      <AvisoLegal variante="destacado" />
    </div>
  );
}
