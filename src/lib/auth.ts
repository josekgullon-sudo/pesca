import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig, RUTA_LOGIN } from "./auth.config";
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

export type UsuarioSesion = {
  id: string;
  nombre: string;
  email: string;
  avatarUrl: string | null;
};

/**
 * El usuario de la sesión, o null si se está mirando la web sin entrar.
 * Casi toda la web es pública, así que esta es la versión que usan las páginas.
 */
export async function usuarioOpcional(): Promise<UsuarioSesion | null> {
  const sesion = await auth();
  if (!sesion?.user?.id) return null;
  return {
    id: sesion.user.id,
    nombre: sesion.user.name ?? "",
    email: sesion.user.email ?? "",
    avatarUrl: sesion.user.image ?? null,
  };
}

/**
 * El usuario de la sesión, exigiéndola. Si no la hay manda al login en vez de
 * reventar: las acciones de servidor viajan como POST a páginas públicas, así
 * que el middleware no las cubre y este es el único sitio donde se comprueba.
 */
export async function usuarioActual(): Promise<UsuarioSesion> {
  const usuario = await usuarioOpcional();
  if (!usuario) redirect(RUTA_LOGIN);
  return usuario;
}
