import type { Metadata } from "next";
import { Ranking } from "@/components/Ranking";

export const metadata: Metadata = {
  title: "Ranking de pesca de España: las capturas más grandes",
  description:
    "Las piezas más grandes registradas, el récord de cada especie y quién va " +
    "ganando. Ranking abierto: cualquiera puede apuntar sus capturas.",
};
export const dynamic = "force-dynamic";

export default function PaginaRanking() {
  return (
    <Ranking
      titulo="Ranking de España"
      entradilla="Todo lo que se ha pescado, ordenado de varias maneras."
    />
  );
}
