/** Formateo de números y fechas, siempre en español. */

export function formatearPeso(gramos: number | null): string | null {
  if (gramos === null) return null;
  if (gramos < 1000) return `${gramos} g`;
  const kg = gramos / 1000;
  // 1,2 kg se lee mejor que 1,20 kg; 12,35 kg necesita los dos decimales.
  return `${kg.toLocaleString("es-ES", { maximumFractionDigits: kg < 10 ? 2 : 1 })} kg`;
}

export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatearFechaCorta(fecha: Date): string {
  return fecha.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
