import type { Metadata } from "next";
import { Proximamente } from "@/components/Proximamente";

export const metadata: Metadata = { title: "Registrar captura" };

export default function NuevaCaptura() {
  return (
    <Proximamente
      titulo="Registrar captura"
      bloque="bloque 5"
      descripcion="El formulario rápido con foto, GPS y hora automáticos."
    />
  );
}
