import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";

/**
 * Autenticación completa (runtime Node): añade el proveedor de credenciales,
 * que sí consulta la base de datos.
 *
 * No hay registro público. Los dos usuarios los crea el seed y punto.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const usuario = await prisma.usuario.findUnique({ where: { email } });

        // Si el email no existe igualmente comparamos contra un hash de
        // relleno, para que la respuesta tarde lo mismo y no se pueda
        // averiguar qué emails están dados de alta por el tiempo de respuesta.
        const hash =
          usuario?.passwordHash ??
          "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu";

        const correcta = await compare(password, hash);
        if (!usuario || !correcta) return null;

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.email,
          image: usuario.avatarUrl,
        };
      },
    }),
  ],
});

/**
 * Devuelve el usuario de la sesión o lanza. En páginas y acciones protegidas
 * por el middleware la sesión siempre existe; esto es la red de seguridad para
 * que TypeScript no nos obligue a comprobar `undefined` en cada sitio.
 */
export async function usuarioActual() {
  const sesion = await auth();
  if (!sesion?.user?.id) throw new Error("No hay sesión iniciada");
  return {
    id: sesion.user.id,
    nombre: sesion.user.name ?? "",
    email: sesion.user.email ?? "",
    avatarUrl: sesion.user.image ?? null,
  };
}
