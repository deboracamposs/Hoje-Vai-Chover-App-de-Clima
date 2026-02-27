// ═══════════════════════════════════════════════════════
// API — Open-Meteo + Geocoding
// ═══════════════════════════════════════════════════════

const BASE_GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';
const BASE_REVERSE   = 'https://geocoding-api.open-meteo.com/v1/reverse';
const BASE_WEATHER   = 'https://api.open-meteo.com/v1/forecast';

/**
 * Geocode a city name → array of results
 */
export async function geocodeCity(name, count = 6) {
  const url = `${BASE_GEOCODING}?name=${encodeURIComponent(name)}&count=${count}&language=pt&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return data.results || [];
}

/**
 * Reverse geocode lat/lon → place object
 */
export async function reverseGeocode(lat, lon) {
  const url = `${BASE_REVERSE}?latitude=${lat}&longitude=${lon}&language=pt&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Fetch full weather forecast for lat/lon
 */
export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: [
      'weathercode',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'windspeed_10m_max',
      'uv_index_max',
      'sunrise',
      'sunset',
    ].join(','),
    current_weather: true,
    hourly: 'relativehumidity_2m,apparent_temperature',
    forecast_days: 7,
    timezone: 'auto',
  });
  const url = `${BASE_WEATHER}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  return res.json();
}
