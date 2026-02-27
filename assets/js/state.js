// ═══════════════════════════════════════════════════════
// STATE — central store for the app
// ═══════════════════════════════════════════════════════

export const state = {
  unit: localStorage.getItem('unit') || 'C',
  history: JSON.parse(localStorage.getItem('weatherHistory') || '[]'),
  currentData: null,
  currentPlace: null,
  weatherCache: {},
  suggestCache: {},
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
};

export function setUnit(u) {
  state.unit = u;
  localStorage.setItem('unit', u);
}

export function addToHistory(name) {
  state.history = [name, ...state.history.filter(h => h !== name)].slice(0, 8);
  localStorage.setItem('weatherHistory', JSON.stringify(state.history));
}

export function setCacheWeather(key, data) {
  state.weatherCache[key] = { data, ts: Date.now() };
}

export function getCacheWeather(key) {
  const cached = state.weatherCache[key];
  if (cached && Date.now() - cached.ts < state.CACHE_TTL) return cached.data;
  return null;
}
