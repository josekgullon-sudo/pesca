import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  /*
   * Pasa por el middleware todo menos los assets que necesita el propio login
   * y los ficheros de la PWA.
   *
   * Ojo: /uploads NO está excluido a propósito. Las fotos de las capturas
   * viven en public/uploads y, al pasar por aquí, quedan detrás de la sesión
   * en vez de ser accesibles con solo tener la URL.
   */
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js).*)",
  ],
};
