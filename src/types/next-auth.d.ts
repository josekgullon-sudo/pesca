import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Id del usuario en la tabla Usuario. Lo usa todo el diario. */
      id: string;
    } & DefaultSession["user"];
  }
}
