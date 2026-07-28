import type { Metadata } from "next";
import { Ranking } from "@/components/Ranking";
import { metadatosDePagina } from "@/lib/marca";

export const metadata: Metadata = metadatosDePagina({
  titulo: "Ranking de pesca de España: dónde ir a por cada especie",
  descripcion:
    "Los sitios con más black bass, carpa, barbo o lucio de cada provincia, " +
    "los que están en su mejor época y las capturas más grandes registradas.",
  ruta: "/ranking",
});
export const dynamic = "force-dynamic";

export default function PaginaRanking() {
  return (
    <Ranking
      titulo="Ranking de pesca de España"
      entradilla="Dónde ir a por cada especie, qué sitios están en su mejor época y qué ha pescado la gente. Lo primero sale de la guía; lo último, del diario."
    />
  );
}
