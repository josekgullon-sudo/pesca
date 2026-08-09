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

/** Nombres tal cual los escribe el boletín: en mayúsculas y sin tildes. */
const BOLETIN = [
  fila("JOSE TORAN", 101, 40),
  fila("TORRE DEL AGUILA", 73, 21),
  fila("GUADALCACIN II", 800, 300),
  fila("GUADALHORCE", 126, 30),
  fila("GUADALTEBA", 153, 60),
  fila("BORNOS", 200, 128),
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
    assert.equal(buscar("Embalse de José Torán")?.nombre, "JOSE TORAN");
    assert.equal(buscar("Embalse de la Torre del Águila")?.nombre, "TORRE DEL AGUILA");
  });

  it("«Guadalcacín» encuentra a «GUADALCACIN II»", () => {
    // El boletín numera las presas sucesivas; la ficha usa el nombre de siempre.
    assert.equal(buscar("Embalse de Guadalcacín")?.nombre, "GUADALCACIN II");
  });

  it("suma los embalses comunicados de El Chorro", () => {
    const r = buscar("Guadalhorce + Guadalteba");
    assert.ok(r, "no encontró el complejo");
    assert.equal(r.capacidadHm3, 126 + 153);
    assert.equal(r.volumenHm3, 30 + 60);
    assert.equal(r.nombre, "GUADALHORCE + GUADALTEBA");
  });

  it("si falta una de las partes, no devuelve la suma a medias", () => {
    // Media suma daría un porcentaje creíble y equivocado, que es lo peor.
    assert.equal(buscar("Guadalhorce + Conde de Guadalhorce"), null);
  });

  it("dice que no cuando el embalse no viene en el boletín", () => {
    // Los pequeños no salen: Cazalla de la Sierra apenas tiene lámina.
    assert.equal(buscar("Embalse de Cazalla de la Sierra"), null);
    assert.equal(buscar("Embalse del Agrio"), null);
  });

  it("no elige por prefijo cuando hay más de una candidata", () => {
    // Ninguna es exacta y las dos empiezan igual: elegir una sería a cara o
    // cruz. Se queda sin nivel hasta que alguien ponga el `nombreEnBoletin`.
    const { buscar: b } = crearBuscador([
      fila("GUADALHORCE I", 126, 30),
      fila("GUADALHORCE II", 20, 5),
    ]);
    assert.equal(b("Embalse del Guadalhorce"), null);
  });

  it("el nombre exacto gana al prefijo", () => {
    const { buscar: b } = crearBuscador([
      fila("BORNOS", 200, 128),
      fila("BORNOS SUPERIOR", 9, 2),
    ]);
    assert.equal(b("Embalse de Bornos")?.nombre, "BORNOS");
  });

  it("un nombre que se queda en nada al normalizar no empareja con el primero", () => {
    // «El Embalse» normaliza a cadena vacía, y "" es prefijo de todo.
    assert.equal(buscar("El Embalse"), null);
  });
});

describe("sugerir parecidos cuando no empareja", () => {
  const { parecidosA } = crearBuscador(BOLETIN);

  it("propone lo que comparte alguna palabra", () => {
    assert.deepEqual(parecidosA("Embalses del Guadalhorce y Guadalteba"), [
      "GUADALHORCE",
      "GUADALTEBA",
    ]);
  });

  it("no propone nada cuando de verdad no hay nada parecido", () => {
    assert.deepEqual(parecidosA("Embalse del Agrio"), []);
  });
});

describe("interpretar fechas", () => {
  it("entiende el formato del boletín y el ISO", () => {
    assert.equal(interpretarFecha("04/08/2026").toISOString().slice(0, 10), "2026-08-04");
    assert.equal(interpretarFecha("2026-08-04").toISOString().slice(0, 10), "2026-08-04");
  });
});
