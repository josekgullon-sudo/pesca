import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Markdown reducido a elementos de React.
 *
 * Va a mano y no con una librería por dos razones. La primera es seguridad: no
 * se genera HTML en ningún momento, así que no hay `dangerouslySetInnerHTML` ni
 * forma de inyectar nada aunque un día el texto lo escriba alguien que no sea
 * administrador. La segunda es que hace falta muy poco —encabezados, párrafos,
 * listas, negrita, enlaces y citas— y una librería de Markdown con su
 * sanitizador pesa más que todo esto junto.
 *
 * Lo que NO admite, a propósito: HTML incrustado, imágenes, tablas y código.
 * Si algún día hace falta, se añade aquí y se sigue controlando qué entra.
 */

type Bloque =
  | { tipo: "h2" | "h3" | "parrafo" | "cita"; texto: string }
  | { tipo: "lista" | "numerada"; items: string[] };

/** Parte el texto en bloques. Un bloque termina en una línea en blanco. */
function trocear(fuente: string): Bloque[] {
  const bloques: Bloque[] = [];
  const lineas = fuente.replace(/\r\n/g, "\n").split("\n");

  let i = 0;
  while (i < lineas.length) {
    const linea = lineas[i].trim();

    if (linea === "") {
      i++;
      continue;
    }

    if (linea.startsWith("### ")) {
      bloques.push({ tipo: "h3", texto: linea.slice(4) });
      i++;
      continue;
    }
    if (linea.startsWith("## ")) {
      bloques.push({ tipo: "h2", texto: linea.slice(3) });
      i++;
      continue;
    }
    if (linea.startsWith("> ")) {
      bloques.push({ tipo: "cita", texto: linea.slice(2) });
      i++;
      continue;
    }

    if (linea.startsWith("- ")) {
      const items: string[] = [];
      while (i < lineas.length && lineas[i].trim().startsWith("- ")) {
        items.push(lineas[i].trim().slice(2));
        i++;
      }
      bloques.push({ tipo: "lista", items });
      continue;
    }

    if (/^\d+\.\s/.test(linea)) {
      const items: string[] = [];
      while (i < lineas.length && /^\d+\.\s/.test(lineas[i].trim())) {
        items.push(lineas[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      bloques.push({ tipo: "numerada", items });
      continue;
    }

    // Párrafo: se junta con las líneas siguientes hasta una en blanco, para
    // poder escribir el texto con saltos cómodos sin que salgan cortados.
    const trozos: string[] = [];
    while (i < lineas.length && lineas[i].trim() !== "") {
      const l = lineas[i].trim();
      if (l.startsWith("#") || l.startsWith("- ") || l.startsWith("> ") || /^\d+\.\s/.test(l)) {
        break;
      }
      trozos.push(l);
      i++;
    }
    bloques.push({ tipo: "parrafo", texto: trozos.join(" ") });
  }

  return bloques;
}

/**
 * Negrita y enlaces dentro de una línea. Se recorre buscando la marca más
 * cercana en vez de con una expresión regular sobre todo el texto, que con
 * anidamientos raros se vuelve imposible de seguir.
 */
function enLinea(texto: string, clave: string): ReactNode[] {
  const salida: ReactNode[] = [];
  let resto = texto;
  let n = 0;

  while (resto.length > 0) {
    const negrita = resto.indexOf("**");
    const enlace = resto.search(/\[[^\]]+\]\([^)]+\)/);

    // Se coge la marca que aparezca antes; -1 significa que no hay.
    const primero =
      negrita === -1 ? enlace : enlace === -1 ? negrita : Math.min(negrita, enlace);

    if (primero === -1) {
      salida.push(resto);
      break;
    }

    if (primero > 0) salida.push(resto.slice(0, primero));
    resto = resto.slice(primero);

    if (resto.startsWith("**")) {
      const cierre = resto.indexOf("**", 2);
      if (cierre === -1) {
        salida.push(resto);
        break;
      }
      salida.push(<strong key={`${clave}-b${n++}`}>{resto.slice(2, cierre)}</strong>);
      resto = resto.slice(cierre + 2);
      continue;
    }

    const m = /^\[([^\]]+)\]\(([^)]+)\)/.exec(resto);
    if (!m) {
      salida.push(resto[0]);
      resto = resto.slice(1);
      continue;
    }

    const [entero, rotulo, destino] = m;
    const externo = /^https?:\/\//.test(destino);
    salida.push(
      externo ? (
        <a
          key={`${clave}-a${n++}`}
          href={destino}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-acento underline underline-offset-2"
        >
          {rotulo} ↗
        </a>
      ) : (
        <Link
          key={`${clave}-a${n++}`}
          href={destino}
          className="font-semibold text-acento underline underline-offset-2"
        >
          {rotulo}
        </Link>
      ),
    );
    resto = resto.slice(entero.length);
  }

  return salida;
}

/** Convierte el Markdown reducido en elementos listos para pintar. */
export function Markdown({ children }: { children: string }) {
  const bloques = trocear(children);

  return (
    <div className="space-y-5">
      {bloques.map((b, i) => {
        const clave = `b${i}`;
        switch (b.tipo) {
          case "h2":
            return (
              <h2 key={clave} className="titulo-seccion pt-4 font-bold">
                {enLinea(b.texto, clave)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={clave} className="pt-2 text-xl font-bold">
                {enLinea(b.texto, clave)}
              </h3>
            );
          case "cita":
            return (
              <blockquote
                key={clave}
                className="border-l-4 border-acento pl-4 text-lg italic leading-relaxed text-texto-suave"
              >
                {enLinea(b.texto, clave)}
              </blockquote>
            );
          case "lista":
            return (
              <ul key={clave} className="list-disc space-y-2 pl-6 leading-relaxed">
                {b.items.map((item, j) => (
                  <li key={j}>{enLinea(item, `${clave}-${j}`)}</li>
                ))}
              </ul>
            );
          case "numerada":
            return (
              <ol key={clave} className="list-decimal space-y-2 pl-6 leading-relaxed">
                {b.items.map((item, j) => (
                  <li key={j}>{enLinea(item, `${clave}-${j}`)}</li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={clave} className="text-lg leading-relaxed">
                {enLinea(b.texto, clave)}
              </p>
            );
        }
      })}
    </div>
  );
}

/** Texto plano del artículo, para las descripciones de los metadatos. */
export function soloTexto(fuente: string): string {
  return fuente
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .join(" ")
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[->\d.]+\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
