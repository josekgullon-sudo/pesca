/**
 * Qué demonios acabamos de descargar.
 *
 * Existe porque el script de niveles apuntaba a un fichero que resultó ser un
 * ZIP con una base de datos de Access dentro, y lo que salió por pantalla
 * fueron bytes crudos: «?d] BD-Embalses.mdbux ??qj??qj». Eso no es un error
 * útil. Un error útil dice «esto es un ZIP y dentro hay un .mdb», que es lo
 * que te permite saber qué hacer a continuación.
 */

export type Formato =
  | "csv"
  | "json"
  | "zip"
  | "excel"
  | "access"
  | "pdf"
  | "html"
  | "desconocido";

export type Diagnostico = {
  formato: Formato;
  /** Explicación en cristiano de qué es y si sirve. */
  explicacion: string;
  /** Lo que se ve dentro, si se puede saber sin descomprimir. */
  pistas: string[];
};

/** Los primeros bytes de un fichero dicen lo que es. */
export function reconocer(datos: Uint8Array): Diagnostico {
  const pistas: string[] = [];
  const inicio = new TextDecoder("latin1").decode(datos.slice(0, 2048));

  // Firmas de fichero.
  const empiezaPor = (...bytes: number[]) =>
    bytes.every((b, i) => datos[i] === b);

  if (empiezaPor(0x50, 0x4b)) {
    // PK: ZIP. Los nombres de los ficheros de dentro se leen en claro.
    // El nombre viene pegado a los bytes de alrededor —en el caso real salió
    // como «?d] BD-Embalses.mdbux»—, así que se limpia lo que sobra por los
    // lados antes de enseñarlo.
    for (const m of inicio.matchAll(/([\w .-]+\.(mdb|accdb|csv|xlsx?|txt|json))/gi)) {
      const limpio = m[1].replace(/^[\s.-]+/, "").trim();
      if (limpio && !pistas.includes(limpio)) pistas.push(limpio);
    }
    const tieneAccess = pistas.some((p) => /\.(mdb|accdb)$/i.test(p));
    return {
      formato: "zip",
      explicacion: tieneAccess
        ? "Es un ZIP y dentro lleva una base de datos de Access (.mdb). Eso no " +
          "se puede leer desde aquí sin herramientas aparte: hace falta otra " +
          "fuente que dé CSV, JSON o Excel."
        : "Es un ZIP. Habría que descomprimirlo y mirar qué trae dentro.",
      pistas,
    };
  }

  if (empiezaPor(0x25, 0x50, 0x44, 0x46)) {
    return {
      formato: "pdf",
      explicacion:
        "Es un PDF. El boletín en PDF está pensado para leerlo, no para " +
        "procesarlo: hace falta la versión de datos.",
      pistas,
    };
  }

  if (empiezaPor(0xd0, 0xcf, 0x11, 0xe0)) {
    return {
      formato: "access",
      explicacion:
        "Es un fichero binario de Microsoft (Access o Excel antiguo). Hace " +
        "falta otra fuente.",
      pistas,
    };
  }

  const recortado = inicio.trimStart();

  if (/^<!doctype html|^<html/i.test(recortado)) {
    const titulo = recortado.match(/<title[^>]*>([^<]{0,120})/i)?.[1];
    if (titulo) pistas.push(`Título de la página: ${titulo.trim()}`);
    return {
      formato: "html",
      explicacion:
        "Es una página web, no un fichero de datos. Puede que la dirección " +
        "haya cambiado y esté devolviendo el portal o un error.",
      pistas,
    };
  }

  if (/^[[{]/.test(recortado)) {
    return { formato: "json", explicacion: "Es JSON. Sirve.", pistas };
  }

  // CSV: primera línea con separadores repetidos.
  const primeraLinea = recortado.split(/\r?\n/)[0] ?? "";
  const puntoYComa = (primeraLinea.match(/;/g) ?? []).length;
  const comas = (primeraLinea.match(/,/g) ?? []).length;
  if (puntoYComa >= 2 || comas >= 2) {
    pistas.push(`Cabecera: ${primeraLinea.slice(0, 200)}`);
    return {
      formato: "csv",
      explicacion: `Es un CSV separado por «${puntoYComa >= comas ? ";" : ","}». Sirve.`,
      pistas,
    };
  }

  pistas.push(`Empieza por: ${JSON.stringify(recortado.slice(0, 120))}`);
  return {
    formato: "desconocido",
    explicacion: "No reconozco el formato.",
    pistas,
  };
}
