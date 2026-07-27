import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { AvisoLegal } from "@/components/AvisoLegal";
import { FECHA_DATOS_LEGALES } from "@/lib/avisos";
import "./globals.css";

// No usamos fuentes web a propósito: la app se abre sin cobertura y con una
// pila de fuentes del sistema el texto aparece al instante y sin descargas.
// Además así el build del VPS no depende de que Google Fonts responda.

export const metadata: Metadata = {
  title: {
    default: "Pesca Sevilla",
    template: "%s · Pesca Sevilla",
  },
  description:
    "Guía de sitios, especies y aparejos para pescar en la provincia de Sevilla, " +
    "y diario de nuestras capturas.",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
          <header className="border-b border-borde px-4 py-4">
            <Link href="/" className="inline-flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-acento">
                Pesca Sevilla
              </span>
            </Link>
          </header>

          <main className="flex-1 px-4 py-6">{children}</main>

          <footer className="mt-8 border-t border-borde px-4 py-6">
            <AvisoLegal />
            <p className="mt-4 text-xs text-texto-suave">
              Datos legales contrastados a {FECHA_DATOS_LEGALES}. App privada,
              de uso personal.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
