"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, X } from "lucide-react";
import { useState } from "react";

export function InstallBanner() {
  const { isInstallable, promptToInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black text-white dark:bg-white dark:text-black flex items-center justify-between shadow-lg safe-area-top animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 dark:bg-black/10 rounded-xl flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">Instalar INDOOR App</span>
          <span className="text-xs opacity-80">Acceso rápido y sin conexión</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={promptToInstall}
          className="bg-white text-black dark:bg-black dark:text-white px-3 py-1.5 rounded-full text-sm font-medium active:scale-95 transition-transform"
        >
          Instalar
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 opacity-60 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
