import type { NextAuthConfig } from "next-auth";

/**
 * Configuración de NextAuth que puede correr en el runtime Edge del middleware.
 *
 * Va separada de `auth.ts` a propósito: el proveedor de credenciales consulta la
 * base de datos con Prisma, que usa un módulo nativo y no arranca en Edge. El
 * middleware solo necesita saber si hay sesión válida, y eso se resuelve leyendo
 * el JWT de la cookie, sin tocar la base de datos.
 */

export const RUTA_LOGIN = "/entrar";

/**
 * La web se ve entera sin entrar: guía, mapa, especies, diario y ranking.
 * Solo hace falta sesión para escribir, y eso son estas rutas. Las acciones de
 * servidor (guardar y borrar capturas) comprueban la sesión por su cuenta,
 * porque viajan como POST a la página en la que estás, que sí es pública.
 */
const RUTAS_QUE_PIDEN_SESION = ["/capturas/nueva", "/cuenta"];

export const authConfig = {
  pages: {
    signIn: RUTA_LOGIN,
    error: RUTA_LOGIN,
  },
  session: {
    strategy: "jwt",
    // 90 días: la app se usa a la orilla del agua y sin cobertura. Que te pida
    // la contraseña justo cuando pica algo sería absurdo.
    maxAge: 60 * 60 * 24 * 90,
  },
  // Se despliega en un VPS propio detrás de un proxy inverso.
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const haySesion = Boolean(auth?.user);
      const { pathname } = request.nextUrl;

      if (pathname.startsWith(RUTA_LOGIN) || pathname.startsWith("/registro")) {
        // Si ya has entrado, no tiene sentido ver el login ni el registro.
        if (haySesion) return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }

      if (RUTAS_QUE_PIDEN_SESION.some((r) => pathname.startsWith(r))) {
        return haySesion;
      }

      // El resto es público, fotos incluidas.
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.rol = (user as { rol?: string }).rol ?? "usuario";
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.name) session.user.name = token.name;
      session.user.rol = (token.rol as string) ?? "usuario";
      return session;
    },
  },
} satisfies NextAuthConfig;
