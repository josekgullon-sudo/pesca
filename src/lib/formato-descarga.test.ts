import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reconocer } from "./formato-descarga";

/**
 * Reconocer qué se ha descargado.
 *
 * Se prueba porque el primer intento del script de niveles apuntaba a un ZIP
 * con una base de datos de Access dentro, y lo que salió por pantalla fueron
 * bytes crudos. Un error que no dice qué ha pasado hace perder una tarde.
 */

const bytes = (...b: number[]) => new Uint8Array(b);
const texto = (s: string) => new TextEncoder().encode(s);

function pegar(a: Uint8Array, b: Uint8Array) {
  const r = new Uint8Array(a.length + b.length);
  r.set(a);
  r.set(b, a.length);
  return r;
}

describe("reconocer lo descargado", () => {
  it("un ZIP con Access dentro, que es lo que nos pasó", () => {
    // Cabecera PK y, en claro, el nombre del fichero de dentro.
    const d = reconocer(
      pegar(bytes(0x50, 0x4b, 0x03, 0x04), texto("  BD-Embalses.mdb")),
    );
    assert.equal(d.formato, "zip");
    assert.ok(d.pistas.includes("BD-Embalses.mdb"), "no vio el .mdb de dentro");
    assert.match(d.explicacion, /Access/);
  });

  it("un CSV con punto y coma", () => {
    const d = reconocer(
      texto("EMBALSE;CAPACIDAD;AGUA;FECHA\nJOSE TORAN;101;80;09/08/2026"),
    );
    assert.equal(d.formato, "csv");
    assert.match(d.explicacion, /;/);
  });

  it("un CSV con comas", () => {
    const d = reconocer(texto("nombre,capacidad,volumen\nBornos,200,128"));
    assert.equal(d.formato, "csv");
  });

  it("JSON", () => {
    assert.equal(reconocer(texto('[{"nombre":"Bornos"}]')).formato, "json");
    assert.equal(reconocer(texto('{"embalses":[]}')).formato, "json");
  });

  it("una página de error en vez del fichero", () => {
    const d = reconocer(
      texto("<!DOCTYPE html><html><head><title>404 no encontrado</title>"),
    );
    assert.equal(d.formato, "html");
    assert.ok(d.pistas.some((p) => p.includes("404")));
  });

  it("un PDF", () => {
    const d = reconocer(pegar(bytes(0x25, 0x50, 0x44, 0x46), texto("-1.7")));
    assert.equal(d.formato, "pdf");
  });

  it("y si no lo reconoce, enseña por dónde empieza en vez de callarse", () => {
    const d = reconocer(texto("bla bla sin separadores"));
    assert.equal(d.formato, "desconocido");
    assert.ok(d.pistas.length > 0);
  });
});
