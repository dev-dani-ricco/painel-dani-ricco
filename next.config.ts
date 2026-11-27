import type { NextConfig } from "next";

const DIAGNOSTICO_IMPAR_ORIGIN = "https://diagnostico-impar-dani-ricco.vercel.app";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/testedearquetipo",
        destination: DIAGNOSTICO_IMPAR_ORIGIN,
        permanent: true,
      },
      {
        source: "/testedearquetipo/:path*",
        destination: `${DIAGNOSTICO_IMPAR_ORIGIN}/:path*`,
        permanent: true,
      },
      // Public hosts are rewritten to /site/* at the edge, so the bridge must also match there.
      {
        source: "/site/testedearquetipo",
        destination: DIAGNOSTICO_IMPAR_ORIGIN,
        permanent: true,
      },
      {
        source: "/site/testedearquetipo/:path*",
        destination: `${DIAGNOSTICO_IMPAR_ORIGIN}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
