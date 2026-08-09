import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { zipSync, strToU8 } from "fflate";
import { leerBoletin } from "./boletin-embalses";

/**
 * Lo que se puede probar del lector del boletín sin tener el fichero real.
 *
 * Fabricar una base de Access de mentira no es viable, así que lo que se
 * comprueba aquí es que el ZIP se abre de verdad y que, cuando dentro no hay
 * lo esperado, el fallo lo dice con claridad en vez de reventar por dentro.
 *
 * El parseo de la base en sí se comprueba con el fichero de verdad, y por eso
 * el script tiene un modo `--probar` que enseña la tabla sin escribir nada.
 */

describe("leer el boletín", () => {
  it("abre el ZIP y dice qué trae si no hay base de datos dentro", () => {
    const zip = zipSync({
      "leeme.txt": strToU8("esto no es una base de datos"),
      "otro.csv": strToU8("a;b;c"),
    });

    const r = leerBoletin(zip);
    assert.equal(r.filas.length, 0);
    assert.ok(r.problema, "debería explicar el problema");
    // Y tiene que decir qué había dentro, que es lo que permite arreglarlo.
    assert.match(r.problema!, /leeme\.txt/);
    assert.match(r.problema!, /otro\.csv/);
  });

  it("no revienta con un ZIP vacío", () => {
    const r = leerBoletin(zipSync({}));
    assert.equal(r.filas.length, 0);
    assert.ok(r.problema);
  });
});
