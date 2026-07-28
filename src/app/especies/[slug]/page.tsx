import type { Metadata } from "next";
import { Proximamente } from "@/components/Proximamente";

export const metadata: Metadata = { title: "Especie" };

export default function FichaEspecie() {
  return (
    <Proximamente
      titulo="Ficha de especie"
      bloque="bloque 4"
      descripcion="Descripción, dónde encontrarla, cómo pescarla, aparejos efectivos y el semáforo legal."
    />
  );
}
