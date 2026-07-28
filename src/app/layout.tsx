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

        <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col">
          <Cabecera />

          <main className="flex-1 px-4 py-6 md:px-6 md:py-10">{children}</main>

          <footer className="mt-8 border-t border-borde px-4 py-6 md:px-6">
            <div className="max-w-prose">
              <AvisoLegal />
            </div>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
              <span>
                Datos legales contrastados a {FECHA_DATOS_LEGALES}. Proyecto
                personal, sin ánimo de lucro.
              </span>
              <Link href="/normas" className="underline underline-offset-2">
                Normas de uso
              </Link>
              <Link href="/aviso-legal" className="underline underline-offset-2">
                Aviso legal y privacidad
              </Link>
            </p>
          </footer>

          <NavegacionInferior rutaSitios={rutaSitios} />
        </div>
      </body>
    </html>
  );
}
