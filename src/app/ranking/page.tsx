import type { Metadata } from "next";
import { Ranking } from "@/components/Ranking";
import { metadatosDePagina } from "@/lib/marca";

export const metadata: Metadata = metadatosDePagina({
  titulo: "Ranking de pesca de España: las capturas más grandes",
  descripcion:
    "Las piezas más grandes registradas, el récord de cada especie, quién va " +
    "ganando y en qué embalses cae más. Cualquiera puede apuntar las suyas.",
  ruta: "/ranking",
});
export const dynamic = "force-dynamic";

export default function PaginaRanking() {
  return (
    <Ranking
      titulo="Ranking de pesca de España"
      entradilla="Las piezas más grandes, el récord de cada especie, quién va ganando y dónde cae más. Sale de lo que la gente apunta en el diario."
    />
  );
}
