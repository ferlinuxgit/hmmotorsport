import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/cableado",
        destination: "/servicios/cableado-motorsport",
        permanent: true
      },
      {
        source: "/eco-puesta-punto",
        destination: "/servicios/calibracion-ecu",
        permanent: true
      },
      {
        source: "/servicios/track-support",
        destination: "/servicios/asistencia-en-carreras",
        permanent: true
      },
      {
        source: "/servicios/data-logging",
        destination: "/servicios/calibracion-ecu",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
