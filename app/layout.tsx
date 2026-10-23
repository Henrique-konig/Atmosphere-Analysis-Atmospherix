import type { Metadata, Viewport } from "next";
import ServiceWorker from "@/components/ServiceWorker";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atmospherix · Previsão do tempo",
  applicationName: "Atmospherix",
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
    // The boot script sets data-theme before React hydrates.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
