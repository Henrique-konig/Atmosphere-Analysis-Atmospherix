/** WMO weather interpretation codes, as returned by Open-Meteo. */
const CODES: Record<number, [label: string, icon: string]> = {
  0: ["Céu limpo", "☀️"],
  1: ["Predomínio de sol", "🌤️"],
  2: ["Parcialmente nublado", "⛅"],
  3: ["Nublado", "☁️"],
  45: ["Nevoeiro", "🌫️"],
  48: ["Nevoeiro com geada", "🌫️"],
  51: ["Garoa fraca", "🌦️"],
  53: ["Garoa", "🌦️"],
  55: ["Garoa forte", "🌧️"],
  61: ["Chuva fraca", "🌦️"],
  63: ["Chuva", "🌧️"],
  65: ["Chuva forte", "🌧️"],
  66: ["Chuva congelante", "🌧️"],
  67: ["Chuva congelante forte", "🌧️"],
  71: ["Neve fraca", "🌨️"],
  73: ["Neve", "🌨️"],
  75: ["Neve forte", "❄️"],
  77: ["Grãos de neve", "🌨️"],
  80: ["Pancadas fracas", "🌦️"],
  81: ["Pancadas de chuva", "🌧️"],
  82: ["Pancadas fortes", "⛈️"],
  85: ["Pancadas de neve", "🌨️"],
  86: ["Pancadas de neve fortes", "❄️"],
  95: ["Trovoada", "⛈️"],
  96: ["Trovoada com granizo", "⛈️"],
  99: ["Trovoada com granizo forte", "⛈️"],
};

export function describeWeather(code: number): { label: string; icon: string } {
  const [label, icon] = CODES[code] ?? ["Indisponível", "❔"];
  return { label, icon };
}
