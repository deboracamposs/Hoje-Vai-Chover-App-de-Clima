// ═══════════════════════════════════════════════════════
// DOM — all rendering functions
// ═══════════════════════════════════════════════════════

import { state } from './state.js';
import {
  tempStr, wmoToTheme, wmoDesc, wmoEmoji,
  dayName, shortDate, getIcon,
  getHumidityForDay, getApparentTemp,
} from './utils.js';
import { setAtmosphere } from './atmosphere.js';
import { initMap, updateMapCoords } from './map.js';

// ── Toast ────────────────────────────────────────────────
let toastTimer = null;
export function showToast(msg, type = 'default') {
  const el = document.getElementById('toast');
  const icons = { error: '✕', success: '✓', default: 'ℹ' };
  el.innerHTML = `<span>${icons[type] || 'ℹ'}</span>${msg}`;
  el.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3400);
}

// ── Unit buttons ─────────────────────────────────────────
export function renderUnitButtons(unit) {
  document.getElementById('btn-c').classList.toggle('active', unit === 'C');
  document.getElementById('btn-f').classList.toggle('active', unit === 'F');
}

// ── History pills ─────────────────────────────────────────
export function renderHistory(history, onSelect) {
  const wrap = document.getElementById('history-row');
  wrap.innerHTML = '';
  if (!history.length) return;

  const label = document.createElement('span');
  label.className = 'history-label';
  label.textContent = 'Recentes:';
  wrap.appendChild(label);

  history.forEach(city => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
      ${city}`;
    btn.addEventListener('click', () => onSelect(city));
    wrap.appendChild(btn);
  });
}

// ── Loading state ─────────────────────────────────────────
export function showLoading() {
  document.getElementById('weather-content').innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <p style="color:rgba(255,255,255,0.6)">Buscando dados climáticos…</p>
    </div>`;
}

// ── Empty / welcome state ─────────────────────────────────
export function showEmpty() {
  document.getElementById('weather-content').innerHTML = `
    <div class="state-container">
      <div class="state-icon">
        ${getIcon('sunny', 120)}
      </div>
      <h2>Descubra o clima agora</h2>
      <p>Digite o nome de uma cidade ou use sua localização para ver a previsão detalhada.</p>
    </div>`;
}

// ── Suggestions dropdown ──────────────────────────────────
export function renderSuggestions(results, onSelect) {
  const box = document.getElementById('suggestions');
  if (!results.length) { box.style.display = 'none'; return; }

  box.innerHTML = results.map(r => `
    <div class="suggestion-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}" data-country="${r.country || ''}" data-admin="${r.admin1 || ''}">
      <svg class="pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
      <div>
        <div class="name">${r.name}${r.admin1 ? ` — ${r.admin1}` : ''}</div>
        <div class="detail">${r.country || ''}</div>
      </div>
    </div>`).join('');

  box.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      onSelect({
        name: item.dataset.name,
        country: item.dataset.country,
        latitude: parseFloat(item.dataset.lat),
        longitude: parseFloat(item.dataset.lon),
      });
      box.style.display = 'none';
    });
  });

  box.style.display = 'block';
}

export function hideSuggestions() {
  document.getElementById('suggestions').style.display = 'none';
}

// ── MAIN WEATHER RENDER ───────────────────────────────────
export function renderWeather(weatherData, place, onMapClick) {
  const { current_weather, daily, hourly } = weatherData;
  const cw = current_weather;
  const theme = wmoToTheme(cw.weathercode);
  const desc = wmoDesc(cw.weathercode);
  const icon = getIcon(theme, 100);
  const iconSm = (t, sz = 38) => getIcon(wmoToTheme(t), sz);

  // Apply dynamic theme
  applyTheme(theme);

  // Humidity & feels-like
  const humidity = getHumidityForDay(hourly, 0);
  const apparentRaw = getApparentTemp(hourly);
  const apparent = apparentRaw !== null ? tempStr(apparentRaw) : '—';

  // Build content
  const content = `
    <!-- Theme badge -->
    <div class="theme-badge" style="animation: cardSlide 0.4s ease-out both;">
      <span class="dot"></span>
      ${wmoEmoji(cw.weathercode)} em ${place.name}
    </div>

    <div class="main-grid">

      <!-- ── CURRENT CARD ── -->
      <div class="current-card">
        <div class="current-location">
          <h2>${place.name}</h2>
          ${place.country ? `<div class="country-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            ${place.country}${place.admin1 ? ', ' + place.admin1 : ''}
          </div>` : ''}
        </div>

        <div class="weather-main">
          <div class="temp-display">${Math.round(cw.temperature)}<sup>°${state.unit}</sup></div>
          <div class="weather-icon-wrap">
            <div class="icon-glow"></div>
            <div class="weather-icon-main">${icon}</div>
          </div>
        </div>

        <div class="weather-desc">${desc}</div>

        <div class="detail-grid">
          <div class="detail-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            <div class="detail-chip-content">
              <div class="label">Máxima</div>
              <div class="value">${tempStr(daily.temperature_2m_max[0])}</div>
            </div>
          </div>
          <div class="detail-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 22l2.4-7.4H22l-6.2-4.5 2.4-7.4L12 7 5.8 2.7l2.4 7.4L2 14.6h7.6z"/>
            </svg>
            <div class="detail-chip-content">
              <div class="label">Mínima</div>
              <div class="value">${tempStr(daily.temperature_2m_min[0])}</div>
            </div>
          </div>
          <div class="detail-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
              <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
              <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
            </svg>
            <div class="detail-chip-content">
              <div class="label">Vento</div>
              <div class="value">${cw.windspeed} km/h</div>
            </div>
          </div>
          <div class="detail-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 2v10M12 22v-3"/>
              <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/>
            </svg>
            <div class="detail-chip-content">
              <div class="label">Sensação</div>
              <div class="value">${apparent}</div>
            </div>
          </div>
          <div class="detail-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
            </svg>
            <div class="detail-chip-content">
              <div class="label">Umidade</div>
              <div class="value">${humidity}</div>
            </div>
          </div>
          <div class="detail-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <div class="detail-chip-content">
              <div class="label">Atualizado</div>
              <div class="value">${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── MAP CARD ── -->
      <div class="map-card">
        <div class="map-header">
          <div class="map-header-left">
            <div class="map-pulse"></div>
            <h3>Localização no Mapa</h3>
          </div>
          <span class="map-coords" id="map-coords">${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}</span>
        </div>
        <div id="map"></div>
      </div>

      <!-- ── FORECAST CAROUSEL (7 days) ── -->
      <div class="forecast-section">
        <div class="section-label">Próximos 7 dias</div>
        <div class="carousel-wrapper">
          <button class="carousel-btn prev" id="carousel-prev" aria-label="Anterior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="forecast-scroll" id="forecast-scroll">
            ${daily.time.map((date, i) => `
              <div class="forecast-card ${i === 0 ? 'today' : ''}" style="animation-delay:${i*55}ms">
                <div class="forecast-day">${dayName(date)}</div>
                <div class="forecast-icon">${iconSm(daily.weathercode[i], 38)}</div>
                <span class="forecast-max-label">máx</span>
                <span class="forecast-max">${tempStr(daily.temperature_2m_max[i])}</span>
                <span class="forecast-min-label">mín</span>
                <span class="forecast-min">${tempStr(daily.temperature_2m_min[i])}</span>
                <div class="forecast-bar"></div>
              </div>`).join('')}
          </div>
          <button class="carousel-btn next" id="carousel-next" aria-label="Próximo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="carousel-dots" id="carousel-dots">
          ${daily.time.map((_, i) => `
            <button class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Dia ${i+1}"></button>
          `).join('')}
        </div>
      </div>

    </div>

    <!-- ── WEEKLY SUMMARY CARDS ── -->
    <div class="week-section">
      <div class="section-label" style="margin-top:28px">Previsão detalhada — semana completa</div>
      <div class="week-grid">
        ${daily.time.map((date, i) => {
          const isToday = i === 0;
          const wTheme = wmoToTheme(daily.weathercode[i]);
          const precip = daily.precipitation_sum?.[i] ?? 0;
          const windMax = daily.windspeed_10m_max?.[i] ?? 0;
          const uvIdx = daily.uv_index_max?.[i] ?? 0;
          return `
            <div class="week-card ${isToday ? 'today-week' : ''}" style="animation-delay:${i*60}ms">
              <div class="week-day-name">${dayName(date)}</div>
              <div class="week-date">${shortDate(date)}</div>
              <div class="week-icon">${iconSm(daily.weathercode[i], 44)}</div>
              <div class="week-desc">${wmoDesc(daily.weathercode[i])}</div>
              <div class="week-temp-range">
                <span class="week-max">${tempStr(daily.temperature_2m_max[i])}</span>
                <span class="week-divider">/</span>
                <span class="week-min">${tempStr(daily.temperature_2m_min[i])}</span>
              </div>
              <div class="week-temp-bar"></div>
              <div style="margin-top:10px; display:flex; flex-direction:column; gap:3px;">
                <div style="font-size:0.62rem; color:var(--text-tertiary);">
                  💧 ${precip.toFixed(1)} mm &nbsp; 💨 ${windMax} km/h
                </div>
                <div style="font-size:0.62rem; color:var(--text-tertiary);">
                  ☀️ UV: ${uvIdx.toFixed(1)}
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`;

  document.getElementById('weather-content').innerHTML = content;

  // Init map after DOM update
  requestAnimationFrame(() => {
    initMap(place.latitude, place.longitude, onMapClick);
    updateMapCoords(place.latitude, place.longitude);
  });
}

// ── Apply CSS theme class ─────────────────────────────────
export function applyTheme(theme) {
  const validThemes = ['sunny','cloudy','rainy','drizzle','snowy','foggy','stormy'];
  document.body.className = validThemes.includes(theme) ? `theme-${theme}` : 'theme-sunny';
  setAtmosphere(theme);
}
