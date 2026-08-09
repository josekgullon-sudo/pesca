import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Las URLs de sitios colgaban de /sitios antes de que la web fuera por
   * provincias. Se redirigen de forma permanente para no perder nada de lo que
   * ya estuviera enlazado o indexado.
   *
   * Y por esto el listado común vive en /donde-pescar y no en /sitios, que era
   * el nombre evidente: /sitios lleva tiempo devolviendo un 308, y un 308 se
   * queda cacheado en el navegador para siempre. Quien pasara por la web
   * antigua tendría guardado «/sitios va a la portada» y no llegaría nunca a
   * la página nueva, sin que hubiera forma de avisarle.
   */
  async redirects() {
    return [
      { source: "/sitios", destination: "/donde-pescar", permanent: true },
      { source: "/sitios/mapa", destination: "/sevilla/mapa", permanent: true },
      { source: "/sitios/:slug", destination: "/sevilla/:slug", permanent: true },
    ];
  },
  experimental: {
    /*
     * Las acciones de servidor vienen limitadas a 1 MB de cuerpo, y por ahí se
     * suben las fotos: las de las capturas y las de las fichas. Una foto de
     * móvil pesa 3-5 MB, así que con el valor por defecto la petición se
     * rechazaba con un 413 ANTES de llegar al código —de ahí la pantalla de
     * «Application error» sin nada en el registro de la aplicación—.
     *
     * 24 MB da margen para varias fotos de una captura. Tiene que ir por encima
     * de TAMANO_MAXIMO_BYTES * (fotos por captura) de src/lib/imagenes.ts: si se
     * baja uno sin el otro, vuelve el mismo fallo silencioso.
     */
    serverActions: { bodySizeLimit: "24mb" },
  },
};

export default nextConfig;
