import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  /*
   * Pasa por el middleware todo menos los assets estáticos. Casi todo es
   * público; quién pide sesión se decide en `authorized` (auth.config.ts).
   */
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js).*)",
  ],
};
