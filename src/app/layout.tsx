import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dani IA | Dani Ricco",
  description: "Clone inteligente e memória viva do ecossistema Dani Ricco.",
  applicationName: "Dani IA",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/dani/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/dani/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/dani/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Dani IA",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers><AppShell>{children}</AppShell></Providers>
      </body>
    </html>
  );
}
