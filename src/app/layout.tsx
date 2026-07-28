import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { AvisoLegal } from "@/components/AvisoLegal";
import { Cabecera } from "@/components/Cabecera";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import { NavegacionInferior } from "@/components/Navegacion";
import { FECHA_DATOS_LEGALES } from "@/lib/avisos";
import { DESCRIPCION, LEMA, NOMBRE, URL_BASE } from "@/lib/marca";

import { rutaDeSitios } from "@/lib/provincias";
import { schemaWebSite } from "@/lib/schema";
import "./globals.css";

// No usamos fuentes web a propósito: la app se abre sin cobertura y con una
// pila de fuentes del sistema el texto aparece al instante y sin descargas.
// Además así el build del VPS no depende de que Google Fonts responda.

export const metadata: Metadata = {
  // Sin esto, las URLs de Open Graph y las canónicas salen relativas y ni
  // Google ni las redes sociales las resuelven.
  metadataBase: new URL(URL_BASE),
  title: {
    default: `${NOMBRE} — ${LEMA}`,
    template: `%s · ${NOMBRE}`,
  },
  description: DESCRIPCION,
  applicationName: NOMBRE,
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: NOMBRE,
    title: `${NOMBRE} — ${LEMA}`,
    description: DESCRIPCION,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // Se usa a la orilla del agua: que quepa bien y respete el notch.
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#101714" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const rutaSitios = await rutaDeSitios();

  return (
    <html lang="es">
      <body className="antialiased">
        <DatosEstructurados schema={schemaWebSite()} />

        {/* El armazón ocupa la pantalla entera y es cada bloque el que centra
            su interior con `.contenedor`. Antes iba todo dentro de una caja de
            1152 px y en un monitor grande la web flotaba en el medio. */}
        <div className="flex min-h-dvh w-full flex-col">
          <Cabecera />

          {/* Sin márgenes propios: cada página centra lo suyo con `.contenedor`
              y así la portada puede ir a sangre, de borde a borde. */}
          <main className="flex-1">{children}</main>

          <footer className="mt-16 border-t border-borde bg-fondo-elevado py-10">
            <div className="contenedor">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,42rem)_1fr]">
                <div>
                  <p className="text-lg font-bold tracking-tight">{NOMBRE}</p>
                  <p className="mt-1 text-texto-suave">{LEMA}</p>
                  <div className="mt-4">
                    <AvisoLegal />
                  </div>
                </div>

                <nav
                  aria-label="Pie de página"
                  className="grid gap-6 sm:grid-cols-2 lg:justify-items-end"
                >
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">
                      La guía
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      <li>
                        <Link href={rutaSitios} className="hover:text-acento">
                          Dónde pescar
                        </Link>
                      </li>
                      <li>
                        <Link href="/especies" className="hover:text-acento">
                          Especies
                        </Link>
                      </li>
                      <li>
                        <Link href="/ranking" className="hover:text-acento">
                          Ranking
                        </Link>
                      </li>
                      <li>
                        <Link href="/capturas" className="hover:text-acento">
                          Capturas
                        </Link>
                      </li>
                      <li>
                        <Link href="/blog" className="hover:text-acento">
                          Blog
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">
                      Legal
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      <li>
                        <Link href="/normas" className="hover:text-acento">
                          Normas de uso
                        </Link>
                      </li>
                      <li>
                        <Link href="/aviso-legal" className="hover:text-acento">
                          Aviso legal y privacidad
                        </Link>
                      </li>
                    </ul>
                  </div>
                </nav>
              </div>

              <p className="mt-8 border-t border-borde pt-6 text-sm text-texto-suave">
                Datos legales contrastados a {FECHA_DATOS_LEGALES}. Proyecto
                personal, sin ánimo de lucro.
              </p>
            </div>
          </footer>

          <NavegacionInferior rutaSitios={rutaSitios} />
        </div>
      </body>
    </html>
  );
}
