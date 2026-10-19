import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atmospherix · Previsão do tempo",
  description:
    "Previsão do tempo detalhada: temperatura, chuva, vento, índice UV, sol, lua, riscos e mapa de precipitação para a sua cidade.",
  appleWebApp: { capable: true, title: "Atmospherix", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#1b3a63",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
