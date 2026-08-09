import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { configurarAnalitica } from "./analitica";

/**
 * La configuración del contador de visitas.
 *
 * Lo que se prueba aquí es sobre todo lo que tiene que NO pasar: que sin las
 * dos variables no se envíe nada al navegador. Ese es el estado normal en
 * desarrollo, y es lo único que impide que trastear en local le meta visitas
 * inventadas a las estadísticas de la web de verdad.
 */

describe("configurar la analítica", () => {
  it("sin nada configurado, no hay analítica", () => {
    assert.equal(configurarAnalitica({}), null);
  });

  it("con solo una de las dos, tampoco", () => {
    // A medias no vale: el script sin identificador no cuenta nada, y el
    // identificador sin dirección no tiene a dónde ir.
    assert.equal(configurarAnalitica({ UMAMI_URL: "https://a.es" }), null);
    assert.equal(configurarAnalitica({ UMAMI_WEBSITE_ID: "abc" }), null);
  });

  it("una variable puesta pero vacía cuenta como no puesta", () => {
    assert.equal(
      configurarAnalitica({ UMAMI_URL: "  ", UMAMI_WEBSITE_ID: "abc" }),
      null,
    );
  });

  it("quita la barra final de la dirección", () => {
    // Copiar la dirección del navegador la trae, y el script se pide como
    // `${url}/script.js`: quedaría una doble barra.
    assert.deepEqual(
      configurarAnalitica({
        UMAMI_URL: "https://analitica.midominio.es/",
        UMAMI_WEBSITE_ID: "abc",
      }),
      { url: "https://analitica.midominio.es", idWeb: "abc" },
    );
  });

  it("con las dos puestas, se activa", () => {
    assert.deepEqual(
      configurarAnalitica({
        UMAMI_URL: "https://analitica.midominio.es",
        UMAMI_WEBSITE_ID: "abc",
      }),
      { url: "https://analitica.midominio.es", idWeb: "abc" },
    );
  });
});
