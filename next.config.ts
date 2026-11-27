import type { NextConfig } from "next";

// The archetype diagnostic now lives inside the public site.
const ARQUETIPOS = "/arquetiposimpar";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/testedearquetipo",
        destination: ARQUETIPOS,
        permanent: true,
      },
      {
        source: "/testedearquetipo/:path*",
        destination: ARQUETIPOS,
        permanent: true,
      },
      // Public hosts are rewritten to /site/* at the edge, so the bridge must also match there.
      {
        source: "/site/testedearquetipo",
        destination: ARQUETIPOS,
        permanent: true,
      },
      {
        source: "/site/testedearquetipo/:path*",
        destination: ARQUETIPOS,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
