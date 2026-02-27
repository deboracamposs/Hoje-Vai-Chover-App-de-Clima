// ═══════════════════════════════════════════════════════
// MAIN — app entry point
// ═══════════════════════════════════════════════════════

import { state, setUnit, addToHistory, setCacheWeather, getCacheWeather } from './state.js';
import { geocodeCity, reverseGeocode, fetchWeather } from './api.js';
import {
  showToast, renderUnitButtons, renderHistory,
  showLoading, showEmpty, renderWeather,
  renderSuggestions, hideSuggestions, applyTheme,
} from './dom.js';
import { initAtmosphere } from './atmosphere.js';

// ── Init ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initAtmosphere();
  renderUnitButtons(state.unit);
  renderHistory(state.history, city => {
    document.getElementById('city-input').value = city;
    search(city);
  });
  showEmpty();

  // Keyboard search
  document.getElementById('city-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      hideSuggestions();
      searchFromInput();
    }
    if (e.key === 'Escape') hideSuggestions();
  });

  // Suggestions
  let suggestTimer = null;
  document.getElementById('city-input').addEventListener('input', () => {
    clearTimeout(suggestTimer);
    const val = document.getElementById('city-input').value.trim();
    if (val.length < 2) { hideSuggestions(); return; }
    suggestTimer = setTimeout(() => loadSuggestions(val), 380);
  });

  // Close suggestions on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-field')) hideSuggestions();
  });
});

// ── Unit toggle ──────────────────────────────────────────
window.toggleUnit = function(u) {
  setUnit(u);
  renderUnitButtons(u);
  if (state.currentData && state.currentPlace) {
    renderWeather(state.currentData, state.currentPlace, onMapClick);
  }
};

// ── Search flow ──────────────────────────────────────────
window.searchFromInput = function() {
  const val = document.getElementById('city-input').value.trim();
  if (!val) { showToast('Digite o nome de uma cidade!', 'error'); return; }
  search(val);
};

async function search(name) {
  showLoading();
  try {
    const results = await geocodeCity(name);
    if (!results.length) {
      showEmpty();
      showToast(`Cidade "${name}" não encontrada.`, 'error');
      return;
    }
    const place = {
      name: results[0].name,
      country: results[0].country || '',
      admin1: results[0].admin1 || '',
      latitude: results[0].latitude,
      longitude: results[0].longitude,
    };
    await loadWeather(place);
  } catch (err) {
    showEmpty();
    showToast('Erro de conexão. Tente novamente.', 'error');
    console.error(err);
  }
}

async function loadWeather(place) {
  const cacheKey = `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;
  let data = getCacheWeather(cacheKey);

  if (!data) {
    data = await fetchWeather(place.latitude, place.longitude);
    setCacheWeather(cacheKey, data);
  }

  state.currentData = data;
  state.currentPlace = place;
  addToHistory(place.name);

  renderWeather(data, place, onMapClick);
  requestAnimationFrame(() => initCarousel());
  renderHistory(state.history, city => {
    document.getElementById('city-input').value = city;
    search(city);
  });
  showToast(`${place.name} carregado!`, 'success');
}

// ── Geolocation ──────────────────────────────────────────
window.useLocation = function() {
  if (!navigator.geolocation) {
    showToast('Geolocalização não suportada pelo navegador.', 'error');
    return;
  }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { latitude, longitude } = pos.coords;
      try {
        const reversed = await reverseGeocode(latitude, longitude);
        const place = reversed
          ? { name: reversed.name, country: reversed.country || '', admin1: reversed.admin1 || '', latitude, longitude }
          : { name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, country: '', admin1: '', latitude, longitude };
        await loadWeather(place);
      } catch {
        showToast('Erro ao obter dados da localização.', 'error');
        showEmpty();
      }
    },
    () => {
      showToast('Permissão de localização negada.', 'error');
      showEmpty();
    }
  );
};

// ── Map click ────────────────────────────────────────────
async function onMapClick(lat, lon) {
  showLoading();
  try {
    const reversed = await reverseGeocode(lat, lon);
    const place = reversed
      ? { name: reversed.name, country: reversed.country || '', admin1: reversed.admin1 || '', latitude: lat, longitude: lon }
      : { name: `${lat.toFixed(3)}, ${lon.toFixed(3)}`, country: '', admin1: '', latitude: lat, longitude: lon };
    await loadWeather(place);
    document.getElementById('city-input').value = place.name;
  } catch {
    showToast('Erro ao buscar dados desta localização.', 'error');
    showEmpty();
  }
}

// ── Suggestions ──────────────────────────────────────────
async function loadSuggestions(name) {
  try {
    const results = await geocodeCity(name, 5);
    renderSuggestions(results, async place => {
      document.getElementById('city-input').value = place.name;
      hideSuggestions();
      showLoading();
      await loadWeather(place);
    });
  } catch { hideSuggestions(); }
}

// ── Carousel ─────────────────────────────────────────────
export function initCarousel() {
  const scroll = document.getElementById('forecast-scroll');
  const prev   = document.getElementById('carousel-prev');
  const next   = document.getElementById('carousel-next');
  const dots   = document.querySelectorAll('.carousel-dot');
  if (!scroll || !prev || !next) return;

  const AUTOPLAY_MS = 2200;
  let autoplayTimer = null;
  let currentIndex = 0;
  const TOTAL = dots.length;

  // Card width including gap
  const cardW = () => {
    const card = scroll.querySelector('.forecast-card');
    return card ? card.offsetWidth + 10 : 96;
  };

  // Visible cards count
  const visibleCount = () => Math.max(1, Math.round(scroll.offsetWidth / cardW()));

  // Scroll to specific card index
  const goTo = (idx) => {
    const maxIdx = TOTAL - visibleCount();
    currentIndex = Math.max(0, Math.min(idx, maxIdx));
    scroll.scrollTo({ left: currentIndex * cardW(), behavior: 'smooth' });
    updateDots(currentIndex);
    updateArrows();
  };

  // Auto-advance
  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      const maxIdx = TOTAL - visibleCount();
      const next = currentIndex >= maxIdx ? 0 : currentIndex + 1;
      goTo(next);
    }, AUTOPLAY_MS);
  };

  const stopAutoplay = () => {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  // Arrow clicks
  prev.addEventListener('click', () => {
    stopAutoplay();
    goTo(currentIndex - visibleCount());
    setTimeout(startAutoplay, 4000);
  });
  next.addEventListener('click', () => {
    stopAutoplay();
    goTo(currentIndex + visibleCount());
    setTimeout(startAutoplay, 4000);
  });

  // Dot clicks
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      stopAutoplay();
      goTo(parseInt(dot.dataset.index));
      setTimeout(startAutoplay, 4000);
    });
  });

  // Pause on hover/touch
  const wrapper = scroll.closest('.carousel-wrapper');
  if (wrapper) {
    wrapper.addEventListener('mouseenter', stopAutoplay);
    wrapper.addEventListener('mouseleave', startAutoplay);
    wrapper.addEventListener('touchstart', stopAutoplay, { passive: true });
    wrapper.addEventListener('touchend', () => setTimeout(startAutoplay, 3000), { passive: true });
  }

  // Sync dots on manual scroll
  scroll.addEventListener('scroll', () => {
    currentIndex = Math.round(scroll.scrollLeft / cardW());
    updateDots(currentIndex);
    updateArrows();
  }, { passive: true });

  function updateDots(idx) {
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  function updateArrows() {
    const atStart = currentIndex <= 0;
    const atEnd   = currentIndex >= TOTAL - visibleCount();
    prev.style.opacity = atStart ? '0.35' : '1';
    prev.style.pointerEvents = atStart ? 'none' : 'auto';
    next.style.opacity = atEnd ? '0.35' : '1';
    next.style.pointerEvents = atEnd ? 'none' : 'auto';
  }

  // Init
  updateArrows();
  startAutoplay();
}
