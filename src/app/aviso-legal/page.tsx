import type { Metadata } from "next";
import Link from "next/link";
import { AvisoLegal } from "@/components/AvisoLegal";
import { FECHA_DATOS_LEGALES } from "@/lib/avisos";
import { hayQuePreguntar } from "@/lib/consentimiento";
import { metadatosDePagina } from "@/lib/marca";

export const metadata: Metadata = metadatosDePagina({
  titulo: "Aviso legal y privacidad",
  descripcion:
    "Quién hay detrás de la web, qué datos se guardan y cómo pedir que se borren.",
  ruta: "/aviso-legal",
});

/**
 * Quién responde de la web.
 *
 * Sale de variables de entorno y no del código por dos motivos. Uno, que son
 * datos personales y no tienen por qué estar en un repositorio. Y dos, que así
 * se rellenan editando el `.env` del servidor y levantando de nuevo, sin tocar
 * una línea ni esperar a un despliegue.
 *
 * La LSSI (art. 10) obliga a identificar al prestador del servicio, y el RGPD
 * a decir quién es el responsable del tratamiento y cómo ejercer los derechos.
 * Mientras falten, la página lo dice en vez de enseñar un «[COMPLETAR]», que
 * es lo que había y que daba peor impresión que no tener la página.
 *
 *     RESPONSABLE_NOMBRE="Nombre y apellidos o razón social"
 *     RESPONSABLE_CONTACTO="correo@dominio.es"
 */
const RESPONSABLE = {
  nombre: process.env.RESPONSABLE_NOMBRE?.trim() || null,
  contacto: process.env.RESPONSABLE_CONTACTO?.trim() || null,
};

const FALTAN_DATOS = !RESPONSABLE.nombre || !RESPONSABLE.contacto;

export default function PaginaAvisoLegal() {
  // El texto cambia según haya anuncios o no: decir que no hay cookies de
  // seguimiento cuando sí las hay es exactamente la clase de afirmación que
  // convierte un aviso legal en un problema.
  const conAnuncios = hayQuePreguntar();

  return (
    <div className="contenedor max-w-prose space-y-6 py-10 md:py-14">
      <h1 className="text-3xl font-bold tracking-tight">
        Aviso legal y privacidad
      </h1>

      {FALTAN_DATOS && (
      <div className="rounded-xl border-2 border-ambar-texto/30 bg-ambar-fondo p-4 text-ambar-texto">
        <p className="font-bold">Pendiente de completar</p>
        <p className="mt-1 leading-relaxed">
          Faltan los datos de quien responde de esta web. Se rellenan en el
          fichero <code>.env</code> del servidor, con{" "}
          <code>RESPONSABLE_NOMBRE</code> y <code>RESPONSABLE_CONTACTO</code>.
        </p>
      </div>
      )}

      <section>
        <h2 className="mb-2 text-xl font-bold">Quién responde de esta web</h2>
        <p className="leading-relaxed">
          {RESPONSABLE.nombre ?? "pendiente de identificar"}. Contacto:{" "}
          {RESPONSABLE.contacto ?? "pendiente"}. Es un proyecto
          personal.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Qué datos se guardan</h2>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            {conAnuncios ? (
              <>
                <strong>Si solo consultas la web</strong>, ningún dato personal
                por nuestra parte. La web se financia con anuncios de Google
                AdSense, que sí usan cookies para medir: <strong>no se cargan
                hasta que las aceptas</strong> en el aviso que sale al entrar, y
                si las rechazas la web funciona igual. Puedes cambiar de
                opinión desde el enlace del pie de página.
              </>
            ) : (
              <>
                <strong>Si solo consultas la web</strong>, ninguno. No hay
                analítica ni cookies de seguimiento.
              </>
            )}
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
          En un servidor propio. No se ceden a terceros y no se venden.
          {conAnuncios
            ? " El único servicio externo es Google AdSense, y solo si aceptas sus cookies."
            : " No hay servicios externos de analítica ni de publicidad."}
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
          copias.
          {RESPONSABLE.contacto
            ? ` Para cualquier otra cosa, escribe a ${RESPONSABLE.contacto}.`
            : " Para cualquier otra cosa, usa el formulario de contacto de la web."}
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
