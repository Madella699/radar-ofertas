import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar Ofertas — encontre o melhor preço",
  description: "Ofertas verificadas, comparação de preços e alertas inteligentes.",
  applicationName: "Radar Ofertas",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#0b1020", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
