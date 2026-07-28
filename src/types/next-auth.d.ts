import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Id del usuario en la tabla Usuario. Lo usa todo el diario. */
      id: string;
      /** "usuario" o "admin". Los admin pueden moderar capturas ajenas. */
      rol: string;
    } & DefaultSession["user"];
  }

  interface User {
    rol?: string;
  }
}
