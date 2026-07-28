/**
 * Cambia la contraseña de una cuenta.
 *
 *   npm run contrasena -- jose@pesca.local
 *   npm run contrasena -- jose@pesca.local "la que yo quiera"
 *
 * Sin el segundo argumento genera una aleatoria y la imprime una vez. Es lo
 * recomendable: así no queda escrita en el historial del terminal.
 *
 * Existe porque la web no tiene recuperación por correo —haría falta un
 * servidor de envío— y sin esto, una contraseña olvidada dejaba la cuenta
 * inservible salvo entrando a la base de datos a mano.
 */
import { randomBytes } from "node:crypto";
import path from "node:path";
import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma.ts";

/** Legible y de sobra fuerte: 4 grupos de 4 caracteres sin ambigüedades. */
function generar() {
  const alfabeto = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(16);
  const trozos = [];
  for (let i = 0; i < 4; i++) {
    let grupo = "";
    for (let j = 0; j < 4; j++) {
      grupo += alfabeto[bytes[i * 4 + j] % alfabeto.length];
    }
    trozos.push(grupo);
  }
  return trozos.join("-");
}

async function main() {
  const [email, indicada] = process.argv.slice(2);

  if (!email) {
    console.error("Falta el email. Ejemplo:");
    console.error("  npm run contrasena -- jose@pesca.local");
    process.exit(1);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, nombre: true, email: true },
  });

  if (!usuario) {
    console.error(`No hay ninguna cuenta con el email "${email}".`);
    const cuentas = await prisma.usuario.findMany({
      select: { email: true, rol: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    if (cuentas.length > 0) {
      console.error("\nCuentas que existen:");
      for (const c of cuentas) console.error(`  ${c.email} (${c.rol})`);
    }
    process.exit(1);
  }

  if (indicada && indicada.length < 8) {
    console.error("La contraseña tiene que tener al menos 8 caracteres.");
    process.exit(1);
  }

  const nueva = indicada || generar();
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash: await hash(nueva, 12) },
  });

  console.log(`\nContraseña cambiada para ${usuario.nombre} <${usuario.email}>`);
  if (!indicada) {
    console.log(`\n    ${nueva}\n`);
    console.log("Apúntala ahora: no se vuelve a mostrar y no se puede recuperar.");
  }
}

if (path.basename(process.argv[1] ?? "") === "contrasena.mjs") {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
