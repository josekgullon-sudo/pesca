import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { construirWhere, hayFiltros, leerFiltros } from "./filtros-sitios";

/**
 * El `where` del listado de sitios.
 *
 * Se prueba por un fallo que no daba ningún error: el listado común pedía «los
 * de Cádiz» y «los de provincias publicadas» por separado, y como las dos
 * condiciones se llamaban `provincia`, la segunda machacaba entera a la
 * primera. Elegir Cádiz seguía enseñando los 23 sitios de las dos provincias,
 * con el botón de Cádiz marcado. Un filtro que no filtra y no se queja es de
 * lo más difícil de ver mirando la pantalla.
 */

describe("construir el where del listado", () => {
  it("junta el filtro de provincia con el de publicadas, sin perder ninguno", () => {
    const w = construirWhere({ provincia: "cadiz" }, { soloPublicadas: true });
    assert.deepEqual(w.provincia, { slug: "cadiz", publicada: true });
  });

  it("cada una por su cuenta también vale", () => {
    assert.deepEqual(construirWhere({ provincia: "cadiz" }).provincia, {
      slug: "cadiz",
    });
    assert.deepEqual(construirWhere({}, { soloPublicadas: true }).provincia, {
      publicada: true,
    });
  });

  it("sin ninguna de las dos, no mete la clave", () => {
    assert.equal("provincia" in construirWhere({}), false);
  });

  it("el filtro de tiempo se salta cuando se aplica después", () => {
    // Con ubicación del visitante, `tiempoCocheMin` mide desde Dos Hermanas y
    // filtrar por ahí le enseñaría «a 40 minutos» de un pueblo donde no vive.
    assert.deepEqual(construirWhere({ tiempo: 40 }).tiempoCocheMin, { lte: 40 });
    assert.equal(
      "tiempoCocheMin" in construirWhere({ tiempo: 40 }, { tiempoAparte: true }),
      false,
    );
  });
});

describe("leer los filtros de la URL", () => {
  it("se queda con lo válido y tira lo demás", () => {
    const f = leerFiltros({
      tipo: "embalse",
      tiempo: "60",
      dificultad: "inventada",
      provincia: "cadiz",
    });
    assert.equal(f.tipo, "embalse");
    assert.equal(f.tiempo, 60);
    assert.equal(f.dificultad, undefined);
    assert.equal(f.provincia, "cadiz");
  });

  it("un tiempo que no es de los ofrecidos no cuela", () => {
    assert.equal(leerFiltros({ tiempo: "999" }).tiempo, undefined);
  });

  it("la provincia cuenta como filtro puesto", () => {
    // Si no contara, el botón de «Quitar todos los filtros» no aparecería y no
    // habría forma de volver a verlas todas sin editar la dirección a mano.
    assert.equal(hayFiltros({ provincia: "cadiz" }), true);
    assert.equal(hayFiltros({}), false);
  });
});
