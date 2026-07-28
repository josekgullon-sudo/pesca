import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Las URLs de sitios colgaban de /sitios antes de que la web fuera por
   * provincias. Se redirigen de forma permanente para no perder nada de lo que
   * ya estuviera enlazado o indexado.
   */
  async redirects() {
    return [
      { source: "/sitios", destination: "/", permanent: true },
      { source: "/sitios/mapa", destination: "/sevilla/mapa", permanent: true },
      { source: "/sitios/:slug", destination: "/sevilla/:slug", permanent: true },
    ];
  },
  /* config options here */
};

export default nextConfig;
