/**
 * Da o quita el rol de administrador a una cuenta.
 *
 *   npm run admin -- josekgullon@gmail.com          lo pone de admin
 *   npm run admin -- josekgullon@gmail.com --quitar lo deja de usuario normal
 *   npm run admin                                   enseña quién lo es ahora
 *
 * El email va como argumento y no escrito en el código a propósito: es un dato
 * personal y no tiene por qué acabar en un repositorio. Por lo mismo no se
 * mete en el seed, que además se ejecuta en cada arranque y volvería a dar el
 * rol aunque alguien lo hubiera quitado a conciencia.
 *
 * Ser administrador da acceso a /admin —escribir en el blog, cambiar fotos,
 * publicar provincias, marcar las áreas EEI— y a borrar capturas ajenas. Es
 * decir, a todo lo que toca el contenido de la guía. Conviene que lo sea el
 * menor número de gente posible.
 */
import path from "node:path";
import { prisma } from "../src/lib/prisma.ts";

async function listarAdmins() {
  const admins = await prisma.usuario.findMany({
    where: { rol: "admin" },
    select: { nombre: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  if (admins.length === 0) {
    console.log("Ahora mismo no hay ningún administrador.");
    return;
  }
  console.log(`\nAdministradores (${admins.length}):`);
  for (const a of admins) console.log(`  ${a.nombre} <${a.email}>`);
}

async function main() {
  const argumentos = process.argv.slice(2);
  const quitar = argumentos.includes("--quitar");
  const email = argumentos.find((a) => !a.startsWith("--"));

  if (!email) {
    await listarAdmins();
    console.log("\nPara dar el rol:");
    console.log("  npm run admin -- correo@ejemplo.com");
    return;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, nombre: true, email: true, rol: true },
  });

  if (!usuario) {
    console.error(`No hay ninguna cuenta con el email "${email}".`);
    console.error(
      "\nEl rol se le da a una cuenta que ya existe: primero regístrate en" +
        "\n/registro con ese correo y luego vuelve a ejecutar esto.",
    );
    const cuentas = await prisma.usuario.findMany({
      select: { email: true, rol: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    if (cuentas.length > 0) {
      console.error("\nCuentas que existen ahora:");
      for (const c of cuentas) console.error(`  ${c.email} (${c.rol})`);
    }
    process.exit(1);
  }

  const nuevoRol = quitar ? "usuario" : "admin";

  if (usuario.rol === nuevoRol) {
    console.log(
      `${usuario.nombre} <${usuario.email}> ya era ${nuevoRol}. No se ha tocado nada.`,
    );
    await listarAdmins();
    return;
  }

  // Quitarse el último administrador deja el panel inaccesible y sin forma de
  // volver a entrar salvo con este mismo script. Se avisa, pero se deja hacer:
  // puede ser justo lo que se quiere al retirar a alguien.
  if (quitar) {
    const cuantos = await prisma.usuario.count({ where: { rol: "admin" } });
    if (cuantos <= 1) {
      console.log(
        "AVISO: es el único administrador que queda. Al quitarle el rol nadie" +
          "\npodrá entrar en /admin hasta que se vuelva a dar con este script.",
      );
    }
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { rol: nuevoRol },
  });

  console.log(
    quitar
      ? `\n${usuario.nombre} <${usuario.email}> ya no es administrador.`
      : `\n${usuario.nombre} <${usuario.email}> ya es administrador.`,
  );
  if (!quitar) {
    console.log(
      "Tiene que cerrar sesión y volver a entrar: el rol viaja en la sesión y" +
        "\nla que ya tenga abierta sigue siendo la de antes.",
    );
  }

  await listarAdmins();
}

if (path.basename(process.argv[1] ?? "") === "admin.mjs") {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
