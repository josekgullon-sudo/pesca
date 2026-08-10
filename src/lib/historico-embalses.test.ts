import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mediana,
  medianasParaEstasFechas,
  type Medicion,
} from "./historico-embalses";

/**
 * Lo normal en un embalse para estas fechas.
 *
 * Se prueba con cuidado porque este número acaba en una nota que la gente usa
 * para decidir a dónde conduce. Un histórico mal calculado no falla de forma
 * ruidosa: enseña un «va por encima de lo normal» perfectamente creíble y
 * equivocado.
 */

const m = (nombre: string, fecha: string, porcentaje: number): Medicion => ({
  nombre,
  fecha: new Date(`${fecha}T00:00:00Z`),
  porcentaje,
});

/** Seis años de agosto, para superar el mínimo que se le exige al histórico. */
function seisAgostos(nombre: string, valores: number[]): Medicion[] {
  return valores.map((v, i) => m(nombre, `${2019 + i}-08-04`, v));
}

describe("mediana", () => {
  it("con impares, el de en medio", () => {
    assert.equal(mediana([10, 30, 20]), 20);
  });

  it("con pares, la media de los dos centrales", () => {
    assert.equal(mediana([10, 20, 30, 40]), 25);
  });

  it("no la arrastra un año raro, que es para lo que se usa", () => {
    // Un año de sequía extrema movería la media entera; la mediana, no.
    assert.equal(mediana([70, 72, 74, 76, 3]), 72);
  });

  it("sin datos, null y no un cero", () => {
    assert.equal(mediana([]), null);
  });
});

describe("la mediana de estas mismas fechas", () => {
  const referencia = new Map([["Bornos", new Date("2026-08-04T00:00:00Z")]]);

  it("coge los agostos de los años anteriores", () => {
    const r = medianasParaEstasFechas(
      seisAgostos("Bornos", [40, 45, 50, 55, 60, 65]),
      referencia,
    );
    assert.equal(r.get("Bornos"), 52.5);
  });

  it("no cuenta el año de la propia medición", () => {
    // Incluirlo sería comparar el dato consigo mismo y acercar la mediana a
    // él, que es justo lo contrario de lo que se quiere saber.
    const conEsteAnio = [
      ...seisAgostos("Bornos", [40, 40, 40, 40, 40, 40]),
      m("Bornos", "2026-08-04", 100),
      m("Bornos", "2026-07-28", 100),
    ];
    assert.equal(medianasParaEstasFechas(conEsteAnio, referencia).get("Bornos"), 40);
  });

  it("descarta lo que cae en otra época del año", () => {
    // Comparar agosto con enero no dice nada: en enero está lleno siempre.
    const mezcla = [
      ...seisAgostos("Bornos", [40, 40, 40, 40, 40, 40]),
      ...[2019, 2020, 2021].map((a) => m("Bornos", `${a}-01-15`, 95)),
    ];
    assert.equal(medianasParaEstasFechas(mezcla, referencia).get("Bornos"), 40);
  });

  it("con pocos años no devuelve nada, en vez de inventarse «lo normal»", () => {
    // Con tres años no hay «lo normal», hay tres años. Y saldría en pantalla
    // con la misma seguridad que una mediana buena.
    const pocos = [2019, 2020, 2021].map((a) => m("Bornos", `${a}-08-04`, 40));
    assert.equal(medianasParaEstasFechas(pocos, referencia).has("Bornos"), false);
  });

  it("en fin de año no se salta por el cambio de año", () => {
    // El 28 de diciembre y el 3 de enero están a seis días, no a trescientos
    // cincuenta y nueve. Sin darle la vuelta al calendario, los embalses se
    // quedaban sin histórico justo esa semana.
    const finDeAnio = new Map([["Bornos", new Date("2026-01-03T00:00:00Z")]]);
    const dicimbres = [2020, 2021, 2022, 2023, 2024, 2025].map((a) =>
      m("Bornos", `${a}-12-28`, 80),
    );
    assert.equal(medianasParaEstasFechas(dicimbres, finDeAnio).get("Bornos"), 80);
  });

  it("un embalse sin medición reciente no aparece", () => {
    const r = medianasParaEstasFechas(seisAgostos("Otro", [40, 40, 40, 40, 40, 40]), referencia);
    assert.equal(r.has("Otro"), false);
  });

  it("cada embalse con lo suyo, sin mezclarse", () => {
    const dos = new Map([
      ["Bornos", new Date("2026-08-04T00:00:00Z")],
      ["Iznájar", new Date("2026-08-04T00:00:00Z")],
    ]);
    const r = medianasParaEstasFechas(
      [
        ...seisAgostos("Bornos", [40, 40, 40, 40, 40, 40]),
        ...seisAgostos("Iznájar", [80, 80, 80, 80, 80, 80]),
      ],
      dos,
    );
    assert.equal(r.get("Bornos"), 40);
    assert.equal(r.get("Iznájar"), 80);
  });
});
