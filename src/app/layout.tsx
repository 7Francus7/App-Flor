import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/store/StoreContext";

export const metadata: Metadata = {
  title: "INDOOR — Gestión",
  description: "Sistema de gestión para peluquería y tienda de ropa. Historial de clientas, servicios y ventas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "INDOOR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F2F2F7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <StoreProvider>
          <div className="app-container">
            {children}
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
