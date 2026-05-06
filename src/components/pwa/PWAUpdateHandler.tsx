"use client";

import { useEffect } from "react";

export function PWAUpdateHandler() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // When new SW takes control (after skipWaiting), reload to get fresh assets
    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Poll for SW updates every 60s so clients don't wait 24h
    let registration: ServiceWorkerRegistration | null = null;
    navigator.serviceWorker.ready.then((reg) => {
      registration = reg;
      const interval = setInterval(() => {
        reg.update().catch(() => {});
      }, 60_000);
      return () => clearInterval(interval);
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}
