import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { limpiarHtml, queHacer } from "./fotos.mjs";

/**
 * Los argumentos del script de fotos.
 *
 * Se prueba porque equivocarse aquí no se deshace: al cambiar la imagen de
 * algo, la anterior se borra del disco. Si `--solo=especies` no se respetara,
 * una pasada del script se llevaría por delante las fotos de los embalses
 * puestas a mano, y no habría de dónde recuperarlas.
 */

describe("qué hay que bajar", () => {
  it("sin argumentos, las dos cosas y solo lo que falta", () => {
    assert.deepEqual(queHacer([]), { todas: false, especies: true, sitios: true });
  });

  it("--solo=especies deja los embalses en paz", () => {
    const p = queHacer(["--solo=especies"]);
    assert.equal(p.sitios, false);
    assert.equal(p.especies, true);
  });

  it("--solo=sitios deja las especies", () => {
    const p = queHacer(["--solo=sitios"]);
    assert.equal(p.especies, false);
    assert.equal(p.sitios, true);
  });

  it("--solo manda aunque venga --todas", () => {
    // Es la combinación peligrosa: rehacerlo todo, pero solo de las especies.
    const p = queHacer(["--todas", "--solo=especies"]);
    assert.deepEqual(p, { todas: true, especies: true, sitios: false });
  });

  it("un --solo mal escrito falla en vez de bajarlo todo", () => {
    // Callarse aquí sería lo peor: pides «solo especies», te lo come un typo y
    // te encuentras los embalses rehechos.
    assert.throws(() => queHacer(["--solo=embalses"]), /especies/);
    assert.throws(() => queHacer(["--solo="]), /especies/);
  });
});

describe("limpiar el HTML que trae Commons", () => {
  it("quita las etiquetas y deja el nombre del autor", () => {
    assert.equal(
      limpiarHtml('<a href="https://commons.wikimedia.org/wiki/User:X">Fulano</a>'),
      "Fulano",
    );
  });

  it("descodifica las entidades", () => {
    assert.equal(limpiarHtml("Juan &amp; Pedro"), "Juan & Pedro");
    assert.equal(limpiarHtml("&quot;foto&quot;"), '"foto"');
  });

  it("lo que se queda en nada devuelve null, no una cadena vacía", () => {
    // Así el campo de la base de datos queda a null y la ficha no pinta una
    // atribución vacía.
    assert.equal(limpiarHtml("<br/>"), null);
    assert.equal(limpiarHtml(""), null);
    assert.equal(limpiarHtml(null), null);
  });
});
