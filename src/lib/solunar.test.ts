import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { diaSolunar, faseLunar, indiceDePesca } from "./solunar";
import { medianocheLocal, hora } from "./fechas-solunar";

/**
 * Pruebas de la astronomía.
 *
 * Esto se prueba porque es el único sitio del proyecto donde una regresión no
 * se ve. Si alguien toca un coeficiente de la serie lunar, la web sigue
 * pintando horas con toda naturalidad; simplemente serán las horas
 * equivocadas, y nadie lo va a notar hasta que un pescador se plante en el
 * embalse a la hora que no era.
 *
 * Por eso las comprobaciones no son contra números que yo haya apuntado, que
 * sería probar que el código hace lo que hace. Son contra cosas verificables
 * por fuera: la duración del día que sale de la fórmula estándar, y las fechas
 * de luna nueva y llena, que están en cualquier efeméride.
 *
 * Referencia: embalse José Torán (Sevilla), 37,7936 N — 5,4283 O.
 */

const JOSE_TORAN = { lat: 37.7936, lon: -5.4283 };

/** Duración del día por la fórmula del ángulo horario, para contrastar. */
function duracionTeoricaHoras(latGrados: number, declinacionGrados: number) {
  const r = Math.PI / 180;
  const lat = latGrados * r;
  const dec = declinacionGrados * r;
  const h0 = -0.833 * r;
  const cosH =
    (Math.sin(h0) - Math.sin(lat) * Math.sin(dec)) /
    (Math.cos(lat) * Math.cos(dec));
  return (2 * (Math.acos(cosH) / r)) / 15;
}

function minutosEntre(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 60000;
}

describe("sol", () => {
  it("la duración del día cuadra con la fórmula estándar", () => {
    // 8 de agosto de 2026: declinación solar ≈ +16,2°.
    const d = diaSolunar(medianocheLocal(2026, 8, 8), JOSE_TORAN.lat, JOSE_TORAN.lon);
    assert.ok(d.amanecer && d.atardecer);

    const calculada = minutosEntre(d.amanecer, d.atardecer) / 60;
    const teorica = duracionTeoricaHoras(JOSE_TORAN.lat, 16.2);

    // Dos minutos de margen: la declinación de referencia va redondeada.
    assert.ok(
      Math.abs(calculada - teorica) < 2 / 60,
      `duración ${calculada.toFixed(3)} h frente a ${teorica.toFixed(3)} h teóricas`,
    );
  });

  it("el día más largo del año cae en el solsticio de junio", () => {
    let mejorDia = 0;
    let mejorDuracion = 0;
    for (let dia = 15; dia <= 30; dia++) {
      const d = diaSolunar(medianocheLocal(2026, 6, dia), JOSE_TORAN.lat, JOSE_TORAN.lon);
      if (!d.amanecer || !d.atardecer) continue;
      const dur = minutosEntre(d.amanecer, d.atardecer);
      if (dur > mejorDuracion) {
        mejorDuracion = dur;
        mejorDia = dia;
      }
    }
    // El solsticio de 2026 cae el 21 de junio.
    assert.ok(
      Math.abs(mejorDia - 21) <= 1,
      `el día más largo salió el ${mejorDia} de junio`,
    );
  });

  it("en el equinoccio el día dura unas doce horas", () => {
    const d = diaSolunar(medianocheLocal(2026, 3, 20), JOSE_TORAN.lat, JOSE_TORAN.lon);
    assert.ok(d.amanecer && d.atardecer);
    const horas = minutosEntre(d.amanecer, d.atardecer) / 60;
    // Algo más de doce por la refracción y el tamaño del disco solar.
    assert.ok(horas > 12 && horas < 12.25, `duraba ${horas.toFixed(2)} h`);
  });
});

describe("luna", () => {
  it("agosto de 2026: luna nueva el 13 y llena el 28", () => {
    let nueva = 0;
    let llena = 0;
    let anterior = faseLunar(new Date("2026-08-01T12:00:00Z")).fraccion;

    for (let dia = 2; dia <= 31; dia++) {
      const f = faseLunar(new Date(`2026-08-${String(dia).padStart(2, "0")}T12:00:00Z`));
      if (f.fraccion < anterior) nueva = dia;
      if (anterior < 0.5 && f.fraccion >= 0.5) llena = dia;
      anterior = f.fraccion;
    }

    assert.equal(nueva, 13, "la luna nueva no cae donde debe");
    assert.equal(llena, 28, "la luna llena no cae donde debe");
  });

  it("la iluminación es coherente con la fase", () => {
    // En luna nueva casi nada; en llena, casi todo.
    const enNueva = faseLunar(new Date("2026-08-13T12:00:00Z")).iluminacion;
    const enLlena = faseLunar(new Date("2026-08-28T12:00:00Z")).iluminacion;
    assert.ok(enNueva <= 3, `en luna nueva daba ${enNueva}%`);
    assert.ok(enLlena >= 97, `en luna llena daba ${enLlena}%`);
  });

  it("sale y se pone casi una hora más tarde cada día", () => {
    // La luna se retrasa unos 50 minutos diarios. Es la comprobación que
    // pilla un error de signo o de escala en la serie lunar.
    const a = diaSolunar(medianocheLocal(2026, 5, 10), JOSE_TORAN.lat, JOSE_TORAN.lon);
    const b = diaSolunar(medianocheLocal(2026, 5, 11), JOSE_TORAN.lat, JOSE_TORAN.lon);
    assert.ok(a.salidaLuna && b.salidaLuna);

    const retraso = minutosEntre(a.salidaLuna, b.salidaLuna) - 24 * 60;
    assert.ok(
      retraso > 20 && retraso < 90,
      `se retrasó ${retraso.toFixed(0)} min, y deberían ser unos 50`,
    );
  });
});

describe("periodos solunares", () => {
  const d = diaSolunar(medianocheLocal(2026, 8, 8), JOSE_TORAN.lat, JOSE_TORAN.lon);

  it("los mayores duran dos horas y los menores una", () => {
    for (const p of d.mayores) {
      assert.equal(minutosEntre(p.desde, p.hasta), 120, `mayor de ${hora(p.desde)}`);
    }
    for (const p of d.menores) {
      assert.equal(minutosEntre(p.desde, p.hasta), 60, `menor de ${hora(p.desde)}`);
    }
  });

  it("los menores van centrados en la salida y la puesta de luna", () => {
    // Es la definición: si esto deja de cumplirse, es que se han desacoplado
    // del cálculo de orto y ocaso.
    const centros = d.menores.map((p) => (p.desde.getTime() + p.hasta.getTime()) / 2);
    for (const referencia of [d.salidaLuna, d.puestaLuna]) {
      if (!referencia) continue;
      assert.ok(
        centros.some((c) => Math.abs(c - referencia.getTime()) < 60000),
        `ningún periodo menor centrado en ${hora(referencia)}`,
      );
    }
  });

  it("los mayores están separados por medio día lunar", () => {
    if (d.mayores.length < 2) return;
    const [a, b] = d.mayores;
    const separacion = minutosEntre(a.desde, b.desde) / 60;
    // Tránsito y antitránsito: unas 12,4 horas.
    assert.ok(
      separacion > 11 && separacion < 14,
      `separados ${separacion.toFixed(1)} h`,
    );
  });
});

describe("índice de pesca", () => {
  const d = diaSolunar(medianocheLocal(2026, 8, 8), JOSE_TORAN.lat, JOSE_TORAN.lon);

  it("nunca se sale de 0 a 100", () => {
    for (let dia = 1; dia <= 31; dia++) {
      const x = diaSolunar(medianocheLocal(2026, 8, dia), JOSE_TORAN.lat, JOSE_TORAN.lon);
      for (const temporada of [true, false, null]) {
        const i = indiceDePesca(x, { enTemporada: temporada });
        assert.ok(i.total >= 0 && i.total <= 100, `día ${dia}: ${i.total}`);
      }
    }
  });

  it("estar en temporada nunca baja la nota", () => {
    const dentro = indiceDePesca(d, { enTemporada: true }).total;
    const fuera = indiceDePesca(d, { enTemporada: false }).total;
    assert.ok(dentro >= fuera);
  });

  it("sin saber la temporada, esa pata no resta", () => {
    // Es la corrección que importa: «no lo sé» no puede castigar como «no».
    const sinSaber = indiceDePesca(d, { enTemporada: null });
    assert.equal(sinSaber.desglose.temporada, 0);
    assert.ok(
      sinSaber.total >= indiceDePesca(d, { enTemporada: false }).total,
      "no saber la temporada estaba puntuando peor que saber que no lo es",
    );
  });

  it("la luna puntúa más en luna nueva y llena que en los cuartos", () => {
    const nota = (mes: number, dia: number) =>
      indiceDePesca(
        diaSolunar(medianocheLocal(2026, mes, dia), JOSE_TORAN.lat, JOSE_TORAN.lon),
        { enTemporada: null },
      ).desglose.luna;

    assert.ok(nota(8, 13) > nota(8, 5), "la luna nueva no puntuaba más que el cuarto");
    assert.ok(nota(8, 28) > nota(8, 5), "la luna llena no puntuaba más que el cuarto");
  });
});

describe("husos horarios", () => {
  it("la medianoche local es medianoche local, también en el cambio de hora", () => {
    // El último domingo de octubre España pasa de UTC+2 a UTC+1. Si esto se
    // rompe, todo el calendario se desplaza una hora justo ese fin de semana.
    for (const [mes, dia] of [
      [1, 15],
      [7, 15],
      [10, 25], // el cambio de 2026
      [10, 26],
      [12, 31],
    ] as [number, number][]) {
      const m = medianocheLocal(2026, mes, dia);
      assert.equal(
        hora(m),
        "00:00",
        `${dia}/${mes} no empezaba a medianoche sino a las ${hora(m)}`,
      );
    }
  });

  it("dos días seguidos se llevan 23, 24 o 25 horas", () => {
    const a = medianocheLocal(2026, 10, 25);
    const b = medianocheLocal(2026, 10, 26);
    const horas = minutosEntre(a, b) / 60;
    assert.ok([23, 24, 25].includes(horas), `se llevaban ${horas} horas`);
  });
});
