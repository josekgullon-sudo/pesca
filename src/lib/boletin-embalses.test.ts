import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { zipSync, strToU8 } from "fflate";
import { elegirColumnas, leerBoletin } from "./boletin-embalses";

/**
 * Lo que se puede probar del lector del boletín sin tener el fichero real.
 *
 * Fabricar una base de Access de mentira no es viable, así que se prueban las
 * dos cosas que sí se pueden: que el ZIP se abre de verdad, y —lo importante—
 * que las columnas se identifican bien.
 *
 * Lo segundo se prueba con los nombres REALES, que ya conocemos de ejecutarlo
 * contra el fichero de verdad, porque ahí me equivoqué a la primera: en esta
 * base la capacidad es AGUA_TOTAL y el volumen de hoy es AGUA_ACTUAL, y yo
 * buscaba AGUA_TOTAL como si fuera el volumen. Con esa confusión todos los
 * embalses habrían salido al 100 %, que es de esos fallos que además parecen
 * verosímiles.
 */

/** Las columnas tal cual vienen en «T_Datos Embalses 1988-2026». */
const REALES = [
  "AMBITO_NOMBRE",
  "EMBALSE_NOMBRE",
  "FECHA",
  "AGUA_TOTAL",
  "AGUA_ACTUAL",
  "ELECTRICO_FLAG",
];

describe("identificar las columnas del boletín", () => {
  it("acierta con los nombres reales del fichero", () => {
    const c = elegirColumnas(REALES);
    assert.ok(c, "no reconoció ninguna columna");
    assert.equal(c.nombre, "EMBALSE_NOMBRE");
    assert.equal(c.capacidad, "AGUA_TOTAL");
    assert.equal(c.volumen, "AGUA_ACTUAL");
    assert.equal(c.fecha, "FECHA");
    assert.equal(c.ambito, "AMBITO_NOMBRE");
  });

  it("no confunde la capacidad con el volumen", () => {
    // Este es el error que hubo. Si vuelve, todos los embalses saldrían llenos.
    const c = elegirColumnas(REALES);
    assert.ok(c);
    assert.notEqual(c.capacidad, c.volumen);
    assert.notEqual(
      c.capacidad,
      "AGUA_ACTUAL",
      "AGUA_ACTUAL es lo que hay hoy, no la capacidad",
    );
  });

  it("aguanta otros nombres razonables", () => {
    const c = elegirColumnas(["nombre_embalse", "capacidad_total", "volumen_actual", "fecha"]);
    assert.ok(c);
    assert.equal(c.capacidad, "capacidad_total");
    assert.equal(c.volumen, "volumen_actual");
  });

  it("dice que no cuando faltan columnas, en vez de inventárselas", () => {
    assert.equal(elegirColumnas(["FECHA", "ELECTRICO_FLAG"]), null);
    assert.equal(elegirColumnas([]), null);
    // Sin volumen no vale, aunque haya nombre y capacidad.
    assert.equal(elegirColumnas(["EMBALSE_NOMBRE", "AGUA_TOTAL"]), null);
  });
});

describe("leer el boletín", () => {
  it("abre el ZIP y dice qué trae si no hay base de datos dentro", () => {
    const zip = zipSync({
      "leeme.txt": strToU8("esto no es una base de datos"),
      "otro.csv": strToU8("a;b;c"),
    });

    const r = leerBoletin(zip);
    assert.equal(r.filas.length, 0);
    assert.ok(r.problema, "debería explicar el problema");
    assert.match(r.problema!, /leeme\.txt/);
    assert.match(r.problema!, /otro\.csv/);
  });

  it("no revienta con un ZIP vacío", () => {
    const r = leerBoletin(zipSync({}));
    assert.equal(r.filas.length, 0);
    assert.ok(r.problema);
  });
});
