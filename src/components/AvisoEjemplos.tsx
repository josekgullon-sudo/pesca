import { prisma } from "@/lib/prisma";
import type { Ambito } from "@/lib/ranking";

/**
 * Aviso de que parte de lo que se ve son capturas de muestra.
 *
 * Va donde salen las capturas —diario y ranking— y solo mientras queden. En
 * cuanto la gente registre las suyas y se retiren las de ejemplo, desaparece
 * solo.
 *
 * Existe porque un ranking vacío no engancha a nadie, pero hacer pasar
 * capturas inventadas por reales para captar registros es publicidad engañosa,
 * y con anuncios en la web todavía más. Con el aviso delante, las de muestra
 * cumplen su función —enseñar cómo va a quedar esto— sin mentirle a nadie.
 */
export async function AvisoEjemplos({ ambito = {} }: { ambito?: Ambito }) {
  const [ejemplos, reales] = await Promise.all([
    prisma.captura.count({
      where: {
        esEjemplo: true,
        ...(ambito.provinciaId ? { sitio: { provinciaId: ambito.provinciaId } } : {}),
      },
    }),
    prisma.captura.count({
      where: {
        esEjemplo: false,
        ...(ambito.provinciaId ? { sitio: { provinciaId: ambito.provinciaId } } : {}),
      },
    }),
  ]);

  if (ejemplos === 0) return null;

  return (
    <div className="rounded-xl border-2 border-ambar-texto/30 bg-ambar-fondo p-4 text-ambar-texto">
      <p className="font-bold">
        {reales === 0
          ? "Todavía no hay capturas reales: lo que ves son ejemplos"
          : `Además de las capturas reales, hay ${ejemplos} de ejemplo`}
      </p>
      <p className="mt-1 max-w-prose leading-relaxed">
        Van marcadas con la etiqueta <strong>Ejemplo</strong> y sirven para
        enseñar cómo queda esto cuando hay movimiento. No cuentan para corregir
        las abundancias de la guía, y se retiran según entren capturas de
        verdad. La primera que apuntes ya sale sin etiqueta.
      </p>
    </div>
  );
}

/** La etiqueta que acompaña a cada captura de muestra. */
export function EtiquetaEjemplo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg bg-ambar-fondo px-2 py-0.5 text-xs font-bold text-ambar-texto ${className}`}
      title="Captura de muestra, no es real"
    >
      Ejemplo
    </span>
  );
}
