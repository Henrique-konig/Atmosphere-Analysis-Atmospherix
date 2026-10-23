"use client";

import dynamic from "next/dynamic";
import { LocaleProvider } from "./LocaleProvider";

// The screen reads localStorage and the geolocation API, so it only renders in the browser.
const WeatherScreen = dynamic(() => import("./WeatherScreen"), {
  ssr: false,
  loading: () => (
    <main className="screen theme-cloudy-day">
      <div className="placeholder" role="status">
        <p className="hero-condition">Carregando…</p>
      </div>
    </main>
  ),
});

export default function ClientApp() {
  return (
    <LocaleProvider>
      <WeatherScreen />
    </LocaleProvider>
  );
}
