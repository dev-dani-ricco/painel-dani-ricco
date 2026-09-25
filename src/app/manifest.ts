import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dani IA",
    short_name: "Dani IA",
    description: "Clone inteligente e memória viva do ecossistema Dani Ricco.",
    start_url: "/inteligencia",
    scope: "/",
    display: "standalone",
    background_color: "#090909",
    theme_color: "#090909",
    orientation: "portrait-primary",
    icons: [
      { src: "/dani/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/dani/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/dani/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
