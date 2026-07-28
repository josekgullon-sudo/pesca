/** Validaciones compartidas entre el registro y los ajustes de cuenta. */

export const LONGITUD_MINIMA_CONTRASENA = 10;

/**
 * Las veinte contraseñas que más aparecen en las filtraciones, en su versión
 * española e inglesa. No es una lista seria de contraseñas comprometidas, pero
 * corta de raíz lo que un bot probaría primero.
 */
const DEMASIADO_OBVIAS = new Set([
  "contrasena",
  "contraseña",
  "123456789",
  "1234567890",
  "12345678910",
  "password",
  "password1",
  "qwertyuiop",
  "1q2w3e4r5t",
  "administrador",
  "bienvenido",
  "iloveyou1",
  "princesa1",
  "futbol2024",
  "barcelona",
  "realmadrid",
  "pescasevilla",
  "abcdefghij",
  "aaaaaaaaaa",
  "0000000000",
]);

export function validarNombre(nombre: string): string | null {
  const limpio = nombre.trim();
  if (limpio.length < 2) return "El nombre es demasiado corto.";
  if (limpio.length > 40) return "El nombre no puede pasar de 40 caracteres.";
  return null;
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validarEmail(email: string): string | null {
  // Deliberadamente laxo: la comprobación de verdad es si el correo llega.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return "Ese email no parece válido.";
  }
  if (email.length > 120) return "Ese email es demasiado largo.";
  return null;
}

export function validarContrasena(
  contrasena: string,
  nombre = "",
  email = "",
): string | null {
  if (contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    return `La contraseña necesita al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`;
  }
  if (contrasena.length > 200) return "Esa contraseña es excesivamente larga.";

  const enMinusculas = contrasena.toLowerCase();
  if (DEMASIADO_OBVIAS.has(enMinusculas)) {
    return "Esa contraseña es de las primeras que se prueban. Pon otra.";
  }
  if (nombre && enMinusculas.includes(nombre.trim().toLowerCase()) && nombre.trim().length > 3) {
    return "La contraseña no puede contener tu nombre.";
  }
  const usuarioDelEmail = email.split("@")[0];
  if (usuarioDelEmail.length > 3 && enMinusculas.includes(usuarioDelEmail.toLowerCase())) {
    return "La contraseña no puede contener tu email.";
  }
  return null;
}
