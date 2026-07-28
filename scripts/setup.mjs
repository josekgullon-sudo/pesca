/**
 * Prepara el proyecto para arrancarlo por primera vez:
 *   1. crea .env a partir de .env.example, con un AUTH_SECRET de verdad
 *   2. aplica las migraciones
 *   3. carga los datos semilla
 *
 * Se puede ejecutar las veces que haga falta: si ya hay .env, no lo toca.
 */

import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function ejecutar(...args) {
  execFileSync(npm, args, { stdio: "inherit" });
}

if (existsSync(".env")) {
  console.log("· .env ya existe, no lo toco");
} else {
  copyFileSync(".env.example", ".env");
  const secreto = randomBytes(32).toString("base64");
  writeFileSync(
    ".env",
    readFileSync(".env", "utf8").replace(
      /^AUTH_SECRET=.*$/m,
      `AUTH_SECRET="${secreto}"`,
    ),
  );
  console.log("· .env creado con un AUTH_SECRET nuevo");
}

console.log("\n· Aplicando migraciones…");
ejecutar("run", "db:deploy");

console.log("\n· Cargando datos semilla…");
ejecutar("run", "db:seed");

console.log(
  [
    "",
    "Listo. Arranca con:",
    "",
    "    npm run dev          para abrirlo en http://localhost:3000",
    "    npm run dev:movil    para abrirlo también desde el móvil",
    "",
    'Entra con jose@pesca.local o pareja@pesca.local y la contraseña "pesca2026".',
    "",
  ].join("\n"),
);
