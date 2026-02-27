// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════

import { state } from './state.js';

// ── Temperature conversion ──────────────────────────────
export function toF(c) { return Math.round(c * 9 / 5 + 32); }
export function tempStr(c) {
  const val = state.unit === 'C' ? Math.round(c) : toF(c);
  return `${val}°${state.unit}`;
}

// ── WMO weather code → theme name ──────────────────────
export function wmoToTheme(code) {
  if (code === 0 || code === 1) return 'sunny';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'foggy';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 85 && code <= 86) return 'snowy';
  if (code >= 95) return 'stormy';
  return 'sunny';
}

// ── WMO code → human description ───────────────────────
export function wmoDesc(code) {
  const map = {
    0: 'Céu limpo', 1: 'Principalmente limpo',
    2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Névoa', 48: 'Névoa gelada',
    51: 'Garoa leve', 53: 'Garoa moderada', 55: 'Garoa intensa',
    56: 'Garoa gelada leve', 57: 'Garoa gelada intensa',
    61: 'Chuva leve', 63: 'Chuva moderada', 65: 'Chuva forte',
    66: 'Chuva gelada leve', 67: 'Chuva gelada forte',
    71: 'Neve leve', 73: 'Neve moderada', 75: 'Neve forte', 77: 'Granizo',
    80: 'Pancadas leves', 81: 'Pancadas moderadas', 82: 'Pancadas fortes',
    85: 'Neve leve', 86: 'Neve forte',
    95: 'Trovoada', 96: 'Trovoada c/ granizo', 99: 'Trovoada forte',
  };
  return map[code] || 'Condição desconhecida';
}

// ── WMO code → emoji label ──────────────────────────────
export function wmoEmoji(code) {
  const theme = wmoToTheme(code);
  const map = {
    sunny: '☀️ Ensolarado',
    cloudy: '☁️ Nublado',
    foggy: '🌫️ Neblina',
    drizzle: '🌦️ Garoa',
    rainy: '🌧️ Chuvoso',
    snowy: '❄️ Neve',
    stormy: '⛈️ Tempestade',
  };
  return map[theme] || '🌡️ Clima';
}

// ── Day name helper ─────────────────────────────────────
export function dayName(dateStr, short = true) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return d.toLocaleDateString('pt-BR', { weekday: short ? 'short' : 'long' });
}

export function shortDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ── Humidity from hourly data ───────────────────────────
export function getHumidityForDay(hourly, dayIndex) {
  if (!hourly?.relativehumidity_2m) return '--';
  const start = dayIndex * 24;
  const slice = hourly.relativehumidity_2m.slice(start, start + 24);
  const avg = slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
  return `${Math.round(avg)}%`;
}

// ── Apparent temperature for current hour ──────────────
export function getApparentTemp(hourly) {
  if (!hourly?.apparent_temperature) return null;
  const now = new Date();
  const hour = now.getHours();
  return hourly.apparent_temperature[hour] ?? null;
}

// ── SVG ICONS (inline, theme-aware) ────────────────────
export const WEATHER_ICONS = {
  sunny: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="13" fill="#FFD54F"/>
      <circle cx="32" cy="32" r="10" fill="#FFEB3B"/>
      <line x1="32" y1="5" x2="32" y2="15" stroke="#FFA000" stroke-width="4" stroke-linecap="round"/>
      <line x1="32" y1="49" x2="32" y2="59" stroke="#FFA000" stroke-width="4" stroke-linecap="round"/>
      <line x1="5" y1="32" x2="15" y2="32" stroke="#FFA000" stroke-width="4" stroke-linecap="round"/>
      <line x1="49" y1="32" x2="59" y2="32" stroke="#FFA000" stroke-width="4" stroke-linecap="round"/>
      <line x1="12.8" y1="12.8" x2="19.9" y2="19.9" stroke="#FFA000" stroke-width="4" stroke-linecap="round"/>
      <line x1="44.1" y1="44.1" x2="51.2" y2="51.2" stroke="#FFA000" stroke-width="4" stroke-linecap="round"/>
      <line x1="51.2" y1="12.8" x2="44.1" y2="19.9" stroke="#FFA000" stroke-width="4" stroke-linecap="round"/>
      <line x1="19.9" y1="44.1" x2="12.8" y2="51.2" stroke="#FFA000" stroke-width="4" stroke-linecap="round"/>
    </svg>`,

  cloudy: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="30" r="12" fill="#B0BEC5"/>
      <circle cx="34" cy="26" r="14" fill="#90A4AE"/>
      <circle cx="46" cy="32" r="10" fill="#B0BEC5"/>
      <rect x="8" y="32" width="48" height="14" rx="7" fill="#90A4AE"/>
    </svg>`,

  rainy: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="24" r="10" fill="#607D8B"/>
      <circle cx="34" cy="20" r="13" fill="#546E7A"/>
      <circle cx="46" cy="26" r="9" fill="#607D8B"/>
      <rect x="10" y="26" width="44" height="12" rx="6" fill="#607D8B"/>
      <line x1="20" y1="44" x2="17" y2="56" stroke="#42A5F5" stroke-width="3" stroke-linecap="round"/>
      <line x1="31" y1="44" x2="28" y2="56" stroke="#42A5F5" stroke-width="3" stroke-linecap="round"/>
      <line x1="42" y1="44" x2="39" y2="56" stroke="#42A5F5" stroke-width="3" stroke-linecap="round"/>
    </svg>`,

  drizzle: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="24" r="10" fill="#78909C"/>
      <circle cx="34" cy="20" r="13" fill="#607D8B"/>
      <circle cx="46" cy="26" r="9" fill="#78909C"/>
      <rect x="10" y="26" width="44" height="12" rx="6" fill="#78909C"/>
      <line x1="20" y1="44" x2="18" y2="51" stroke="#90CAF9" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="30" y1="46" x2="28" y2="53" stroke="#90CAF9" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="40" y1="44" x2="38" y2="51" stroke="#90CAF9" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

  snowy: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="24" r="10" fill="#B0BEC5"/>
      <circle cx="34" cy="20" r="13" fill="#90A4AE"/>
      <circle cx="46" cy="26" r="9" fill="#B0BEC5"/>
      <rect x="10" y="26" width="44" height="12" rx="6" fill="#B0BEC5"/>
      <circle cx="20" cy="48" r="3" fill="#E3F2FD"/>
      <circle cx="32" cy="52" r="3" fill="#E3F2FD"/>
      <circle cx="44" cy="48" r="3" fill="#E3F2FD"/>
      <circle cx="26" cy="56" r="2.5" fill="#90CAF9"/>
      <circle cx="38" cy="56" r="2.5" fill="#90CAF9"/>
    </svg>`,

  foggy: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="14" width="48" height="6" rx="3" fill="#CFD8DC" opacity="0.8"/>
      <rect x="14" y="26" width="36" height="6" rx="3" fill="#B0BEC5" opacity="0.9"/>
      <rect x="8" y="38" width="48" height="6" rx="3" fill="#CFD8DC" opacity="0.8"/>
      <rect x="14" y="50" width="36" height="6" rx="3" fill="#B0BEC5" opacity="0.7"/>
    </svg>`,

  stormy: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="22" r="10" fill="#455A64"/>
      <circle cx="32" cy="18" r="13" fill="#37474F"/>
      <circle cx="46" cy="24" r="9" fill="#455A64"/>
      <rect x="8" y="24" width="48" height="12" rx="6" fill="#455A64"/>
      <polygon points="35,34 26,50 33,50 24,64 43,42 36,42" fill="#FFD600"/>
    </svg>`,
};

export function getIcon(theme, size = 64) {
  const svg = WEATHER_ICONS[theme] || WEATHER_ICONS['sunny'];
  return svg.replace('viewBox="0 0 64 64"', `viewBox="0 0 64 64" width="${size}" height="${size}"`);
}
