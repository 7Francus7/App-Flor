"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    if (typeof window !== "undefined") {
      setIsOffline(!window.navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-red-500/90 text-white backdrop-blur-md safe-area-bottom flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-bottom-2">
      <WifiOff className="w-4 h-4" />
      <span>Estás navegando sin conexión. Algunos datos pueden no estar actualizados.</span>
    </div>
  );
}
