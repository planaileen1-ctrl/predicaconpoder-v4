import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true,
  },

  // Exportar sitio estático
  output: "standalone",
};

export default nextConfig;
