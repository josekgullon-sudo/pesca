import type { Metadata } from "next";
import { Ranking } from "@/components/Ranking";
import { metadatosDePagina } from "@/lib/marca";

export const metadata: Metadata = metadatosDePagina({
  titulo: "Ranking de pesca de España: las capturas más grandes",
  descripcion:
    "Las piezas más grandes registradas, el récord de cada especie y quién va " +
    "ganando. Ranking abierto: cualquiera puede apuntar sus capturas.",
  ruta: "/ranking",
});
export const dynamic = "force-dynamic";

export default function PaginaRanking() {
  return (
    <Ranking
      titulo="Ranking de España"
      entradilla="Todo lo que se ha pescado, ordenado de varias maneras."
    />
  );
}
