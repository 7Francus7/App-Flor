import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/store/StoreContext";
import { ToastProvider } from "@/context/ToastContext";

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

import { InstallBanner } from "@/components/pwa/InstallBanner";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { SyncErrorBanner } from "@/components/SyncErrorBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <StoreProvider>
            <div className="app-container">
              <InstallBanner />
              {children}
              <SyncErrorBanner />
              <OfflineIndicator />
            </div>
          </StoreProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
