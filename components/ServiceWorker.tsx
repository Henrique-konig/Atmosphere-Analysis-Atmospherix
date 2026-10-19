"use client";

import { useEffect } from "react";

/** Registers the service worker that makes the app installable (production only). */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Without it the site still works, just not offline or as an installed app.
    });
  }, []);
  return null;
}
