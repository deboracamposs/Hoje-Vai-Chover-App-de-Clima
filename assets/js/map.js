// ═══════════════════════════════════════════════════════
// MAP — Leaflet integration
// ═══════════════════════════════════════════════════════

let map = null;
let marker = null;

export function initMap(lat, lon, onMapClick) {
  if (!map) {
    map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
    }).setView([lat, lon], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    map.on('click', e => onMapClick(e.latlng.lat, e.latlng.lng));
  } else {
    map.setView([lat, lon], 11);
  }

  setMarker(lat, lon);
}

export function setMarker(lat, lon) {
  if (marker) marker.remove();

  const icon = L.divIcon({
    className: '',
    html: `
      <div style="
        width: 20px; height: 20px;
        background: #1E88E5;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(30,136,229,0.7);
        position: relative;
      ">
        <div style="
          position: absolute; inset: -6px;
          border: 2px solid rgba(30,136,229,0.4);
          border-radius: 50%;
          animation: rippleMap 1.8s ease-in-out infinite;
        "></div>
      </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  marker = L.marker([lat, lon], { icon }).addTo(map);
}

export function updateMapCoords(lat, lon) {
  const el = document.getElementById('map-coords');
  if (el) el.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}
