import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizar, interpretarFecha } from "./niveles";

/**
 * Lo único del script de niveles que se puede probar sin red: el
 * emparejamiento de nombres y la lectura de fechas.
 *
 * Se prueba porque es donde está el riesgo de verdad. Si «Embalse José Torán»
 * no empareja con «JOSE TORAN», el sitio se queda sin nivel, que es molesto
 * pero inofensivo. Si empareja con el embalse equivocado, la web enseña el
 * porcentaje de otro pantano, y eso sí manda a alguien a conducir dos horas
 * para encontrarse el agua a trescientos metros de donde aparcó.
 */

describe("emparejar nombres del boletín", () => {
  it("ignora tildes, artículos y la palabra embalse", () => {
    assert.equal(normalizar("Embalse José Torán"), normalizar("JOSE TORAN"));
    assert.equal(normalizar("Embalse de El Pintado"), normalizar("EL PINTADO"));
    assert.equal(normalizar("Embalse del Guadarranque"), normalizar("Guadarranque"));
    assert.equal(normalizar("Embalse de La Minilla"), normalizar("MINILLA"));
  });

  it("no confunde embalses distintos que se parecen", () => {
    // Los dos existen y están a cincuenta kilómetros uno de otro.
    assert.notEqual(normalizar("Embalse de Bornos"), normalizar("Embalse de Bermejales"));
    assert.notEqual(normalizar("Guadalcacín"), normalizar("Guadalhorce"));
    assert.notEqual(normalizar("Embalse de Cala"), normalizar("Embalse de Cazalla"));
  });

  it("deja algo con lo que comparar", () => {
    // Si un nombre se quedara vacío al normalizar, emparejaría con cualquier
    // otro que también quedara vacío.
    for (const n of ["Embalse de La Breña II", "El Gergal", "Río Viar"]) {
      assert.ok(normalizar(n).length > 2, `«${n}» quedó en «${normalizar(n)}»`);
    }
  });
});

describe("fechas del boletín", () => {
  it("entiende el formato español y el ISO", () => {
    assert.equal(interpretarFecha("09/08/2026").toISOString().slice(0, 10), "2026-08-09");
    assert.equal(interpretarFecha("2026-08-09").toISOString().slice(0, 10), "2026-08-09");
  });

  it("no revienta con una fecha ilegible", () => {
    assert.ok(interpretarFecha("vete a saber") instanceof Date);
    assert.ok(!Number.isNaN(interpretarFecha("").getTime()));
  });
});
