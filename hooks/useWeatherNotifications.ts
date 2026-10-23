"use client";

import { useCallback, useEffect, useState } from "react";
import { pendingNotices, type NotifySettings, type WeatherNotice } from "@/lib/notifications";
import {
  loadNotifySettings,
  loadSentNotices,
  storeNotifySettings,
  storeSentNotices,
} from "@/lib/storage";
import type { Forecast } from "@/lib/types";

/** "unsupported": no Notification API, e.g. Safari on iPhone outside an installed app. */
export type NotifyPermission = NotificationPermission | "unsupported";

/** Sent tags older than this can no longer come back and are forgotten. */
const KEEP_SENT = 3 * 86_400;

const currentPermission = (): NotifyPermission =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;

/**
 * Shows a system notification. Android only allows them through the service worker
 * (`new Notification` throws there); without one (dev mode) the page shows it itself.
 */
async function show(notice: WeatherNotice) {
  const options: NotificationOptions = {
    body: notice.body,
    tag: notice.tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: "/" },
  };
  const registration = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
  // Right after the first visit the worker may still be installing: wait until it is active.
  if (registration)
    await (await navigator.serviceWorker.ready).showNotification(notice.title, options);
  else new Notification(notice.title, options);
}

/**
 * Local weather notifications: checked each time the forecast loads (on open, every
 * 10 minutes and when the app comes back to the foreground). There is no push server,
 * so nothing arrives while the app is closed.
 */
export function useWeatherNotifications(
  forecast: Forecast | undefined,
  place: { key: string; name: string } | null,
) {
  const [settings, setSettings] = useState<NotifySettings>(() => loadNotifySettings());
  const [permission, setPermission] = useState<NotifyPermission>(() => currentPermission());

  // The permission can be changed in the browser settings while the app is open.
  useEffect(() => {
    const onVisible = () => setPermission(currentPermission());
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const update = useCallback(async (next: NotifySettings) => {
    const wantsAny = next.rain || next.severe;
    let granted = currentPermission();
    // Ask only when the user turns something on, never on page load.
    if (wantsAny && granted === "default") granted = await Notification.requestPermission();
    setPermission(granted);
    const saved = granted === "granted" ? next : { ...next, rain: false, severe: false };
    setSettings(saved);
    storeNotifySettings(saved);
  }, []);

  const sendTest = useCallback(async () => {
    if (currentPermission() !== "granted") return;
    await show({
      tag: "test",
      title: "Atmospherix",
      body: "Os avisos estão ativos. Você será avisado assim, com o app aberto.",
    });
  }, []);

  useEffect(() => {
    if (!forecast || !place || permission !== "granted") return;
    if (!settings.rain && !settings.severe) return;
    const now = Math.floor(Date.now() / 1000);
    const sent = loadSentNotices();
    for (const [tag, at] of sent) if (now - at > KEEP_SENT) sent.delete(tag);
    const notices = pendingNotices(forecast, place, settings, now, sent);
    for (const notice of notices) sent.set(notice.tag, now);
    storeSentNotices(sent);
    notices.forEach((notice) => void show(notice).catch(() => {}));
  }, [forecast, place, settings, permission]);

  return { settings, update, permission, sendTest };
}
