import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { crearBuscador, interpretarFecha, normalizar } from "./niveles";

/**
 * Emparejar nuestros embalses con los del boletín.
 *
 * La primera pasada contra el boletín de verdad emparejó 48 de 52. Los cuatro
 * que no —Guadalcacín, Guadalhorce y Guadalteba, Agrio y Cazalla de la Sierra—
 * son los casos que se prueban aquí, con los nombres tal cual están en la ficha
 * y tal cual vienen en el boletín.
 *
 * Y se prueba sobre todo lo contrario: que **no** empareje cuando duda. Un
 * embalse sin barra de nivel no engaña a nadie; uno con el porcentaje del
 * vecino manda a alguien a conducir dos horas hasta un pantano que cree lleno.
 */

const fila = (nombre: string, capacidadHm3: number, volumenHm3: number) => ({
  nombre,
  capacidadHm3,
  volumenHm3,
  fecha: new Date("2026-08-04T00:00:00Z"),
});

/**
 * Nombres tal cual los escribe el boletín, copiados de una ejecución real.
 *
 * Merece la pena mirarlos con calma, porque cada uno rompe el emparejamiento
 * de una forma distinta: un romano detrás, el municipio entre paréntesis, dos
 * presas metidas en una sola entrada y una tercera del mismo complejo suelta.
 */
const BOLETIN = [
  fila("José Torán", 101, 73),
  fila("Torre del Águila", 48, 14),
  fila("Guadalcacín II", 800, 701),
  fila("Guadalhorce-Guadalteba", 279, 90),
  fila("Conde Guadalhorce", 70, 40),
  fila("Agrio (Aznalcollar)", 20, 17),
  fila("Bornos", 200, 146),
];

describe("normalizar nombres de embalse", () => {
  it("quita «embalse», los artículos y las tildes", () => {
    assert.equal(normalizar("Embalse de José Torán"), "jose toran");
    assert.equal(normalizar("JOSE TORAN"), "jose toran");
    assert.equal(normalizar("Embalse de la Torre del Águila"), "torre aguila");
  });

  it("también en plural, que es lo que rompía «Embalses del Guadalhorce»", () => {
    assert.equal(normalizar("Embalses del Guadalhorce"), "guadalhorce");
    assert.equal(normalizar("Pantanos de Cazalla"), "cazalla");
  });
});

describe("buscar un embalse en el boletín", () => {
  const { buscar } = crearBuscador(BOLETIN);

  it("empareja aunque los nombres se escriban distinto", () => {
    assert.equal(buscar("Embalse de José Torán")?.nombre, "José Torán");
    assert.equal(buscar("Embalse de la Torre del Águila")?.nombre, "Torre del Águila");
  });

  it("«Guadalcacín» encuentra a «Guadalcacín II»", () => {
    // El boletín numera las presas sucesivas; la ficha usa el nombre de siempre.
    assert.equal(buscar("Embalse de Guadalcacín")?.nombre, "Guadalcacín II");
  });

  it("no le estorba el municipio entre paréntesis", () => {
    assert.equal(buscar("Embalse del Agrio")?.nombre, "Agrio (Aznalcollar)");
  });

  it("suma los embalses comunicados de El Chorro", () => {
    // Los tres del complejo están comunicados y la ficha habla de los tres,
    // pero el boletín mete dos en una entrada y deja el otro suelto.
    const r = buscar("Guadalhorce-Guadalteba + Conde Guadalhorce");
    assert.ok(r, "no encontró el complejo");
    assert.equal(r.capacidadHm3, 279 + 70);
    assert.equal(r.volumenHm3, 90 + 40);
    assert.equal(r.nombre, "Guadalhorce-Guadalteba + Conde Guadalhorce");
  });

  it("si falta una de las partes, no devuelve la suma a medias", () => {
    // Media suma daría un porcentaje creíble y equivocado, que es lo peor.
    assert.equal(buscar("Guadalhorce-Guadalteba + Conde de Villalobos"), null);
  });

  it("dice que no cuando el embalse no viene en el boletín", () => {
    // Los pequeños no salen: Cazalla de la Sierra apenas tiene lámina.
    assert.equal(buscar("Embalse de Cazalla de la Sierra"), null);
  });

  it("no elige por prefijo cuando hay más de una candidata", () => {
    // Ninguna es exacta y las dos empiezan igual: elegir una sería a cara o
    // cruz. Se queda sin nivel hasta que alguien ponga el `nombreEnBoletin`.
    const { buscar: b } = crearBuscador([
      fila("Guadalhorce I", 126, 30),
      fila("Guadalhorce II", 20, 5),
    ]);
    assert.equal(b("Embalse del Guadalhorce"), null);
  });

  it("el nombre exacto gana al prefijo", () => {
    const { buscar: b } = crearBuscador([
      fila("Bornos", 200, 146),
      fila("Bornos Superior", 9, 2),
    ]);
    assert.equal(b("Embalse de Bornos")?.nombre, "Bornos");
  });

  it("un nombre que se queda en nada al normalizar no empareja con el primero", () => {
    // «El Embalse» normaliza a cadena vacía, y "" es prefijo de todo.
    assert.equal(buscar("El Embalse"), null);
  });
});

describe("sugerir parecidos cuando no empareja", () => {
  const { parecidosA } = crearBuscador(BOLETIN);

  it("propone lo que comparte alguna palabra", () => {
    // Esta lista es la que resolvió El Chorro: sin ella no había forma de
    // saber que el boletín junta dos de los tres embalses en una entrada.
    assert.deepEqual(parecidosA("Embalses del Guadalhorce y Guadalteba"), [
      "Guadalhorce-Guadalteba",
      "Conde Guadalhorce",
    ]);
  });

  it("no propone nada cuando de verdad no hay nada parecido", () => {
    assert.deepEqual(parecidosA("Embalse de Cazalla de la Sierra"), []);
  });
});

describe("interpretar fechas", () => {
  it("entiende el formato del boletín y el ISO", () => {
    assert.equal(interpretarFecha("04/08/2026").toISOString().slice(0, 10), "2026-08-04");
    assert.equal(interpretarFecha("2026-08-04").toISOString().slice(0, 10), "2026-08-04");
  });
});
