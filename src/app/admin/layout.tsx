import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioOpcional } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Zona de administración.
 *
 * El rol se comprueba aquí, en el layout, así que cubre todas las páginas que
 * cuelgan de /admin sin tener que repetirlo en cada una. Las acciones de
 * servidor lo comprueban además por su cuenta: viajan como POST y no pasan por
 * este árbol, así que esto solo esconde la interfaz.
 *
 * No se indexa: robots.txt ya bloquea /cuenta y compañía, y aquí se añade la
 * cabecera noindex por si acaso.
 */
export const metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};

const SECCIONES = [
  { href: "/admin", etiqueta: "Resumen" },
  { href: "/admin/articulos", etiqueta: "Artículos" },
  { href: "/admin/provincias", etiqueta: "Provincias" },
];

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await usuarioOpcional();
  if (!usuario) redirect("/entrar");
  if (!usuario.esAdmin) redirect("/");

  return (
    <div className="contenedor py-10 md:py-14">
      <header className="mb-8 border-b border-borde pb-6">
        <h1 className="titulo-pagina font-bold">Administración</h1>
        <p className="mt-1 text-texto-suave">
          Lo que se edita aquí sale publicado en la web al momento.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2">
          {SECCIONES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="inline-flex min-h-11 items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold hover:border-acento"
            >
              {s.etiqueta}
            </Link>
          ))}
        </nav>
      </header>

      {children}
    </div>
  );
}
