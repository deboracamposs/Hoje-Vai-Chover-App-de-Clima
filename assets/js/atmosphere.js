// ═══════════════════════════════════════════════════════
// ATMOSPHERE — canvas-based particle effects per theme
// ═══════════════════════════════════════════════════════

let canvas, ctx, animationId;
let particles = [];
let currentTheme = null;

const CONFIGS = {
  sunny: {
    count: 18,
    factory: () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 2 + Math.random() * 5,
      opacity: 0.08 + Math.random() * 0.18,
      speed: 0.08 + Math.random() * 0.15,
      drift: (Math.random() - 0.5) * 0.2,
      color: [255, 210, 60],
    }),
    draw(p) {
      ctx.beginPath();
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grad.addColorStop(0, `rgba(${p.color},${p.opacity})`);
      grad.addColorStop(1, `rgba(${p.color},0)`);
      ctx.fillStyle = grad;
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    },
    update(p) {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -20) { p.y = window.innerHeight + 20; p.x = Math.random() * window.innerWidth; }
    },
  },

  cloudy: {
    count: 8,
    factory: () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 0.5,
      r: 60 + Math.random() * 100,
      opacity: 0.04 + Math.random() * 0.08,
      speed: 0.15 + Math.random() * 0.25,
      color: [200, 210, 220],
    }),
    draw(p) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, `rgba(${p.color},${p.opacity})`);
      grad.addColorStop(1, `rgba(${p.color},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    },
    update(p) {
      p.x += p.speed;
      if (p.x > window.innerWidth + p.r) p.x = -p.r;
    },
  },

  rainy: {
    count: 120,
    factory: () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      len: 8 + Math.random() * 18,
      opacity: 0.25 + Math.random() * 0.4,
      speed: 12 + Math.random() * 10,
      angle: 0.2,
      color: [100, 160, 255],
    }),
    draw(p) {
      ctx.strokeStyle = `rgba(${p.color},${p.opacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.len * Math.sin(p.angle), p.y + p.len * Math.cos(p.angle));
      ctx.stroke();
    },
    update(p) {
      p.y += p.speed;
      p.x += p.speed * Math.tan(p.angle) * 0.3;
      if (p.y > window.innerHeight + 20) {
        p.y = -20;
        p.x = Math.random() * window.innerWidth;
      }
    },
  },

  drizzle: {
    count: 60,
    factory: () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      len: 4 + Math.random() * 8,
      opacity: 0.15 + Math.random() * 0.3,
      speed: 5 + Math.random() * 5,
      angle: 0.1,
      color: [150, 200, 255],
    }),
    draw(p) {
      ctx.strokeStyle = `rgba(${p.color},${p.opacity})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.len * Math.sin(p.angle), p.y + p.len);
      ctx.stroke();
    },
    update(p) {
      p.y += p.speed;
      p.x += p.speed * Math.tan(p.angle) * 0.2;
      if (p.y > window.innerHeight + 10) {
        p.y = -10;
        p.x = Math.random() * window.innerWidth;
      }
    },
  },

  snowy: {
    count: 80,
    factory: () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 2 + Math.random() * 5,
      opacity: 0.4 + Math.random() * 0.5,
      speed: 0.4 + Math.random() * 1,
      drift: (Math.random() - 0.5) * 0.6,
      wobble: Math.random() * Math.PI * 2,
      color: [230, 245, 255],
    }),
    draw(p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
      ctx.fill();
    },
    update(p) {
      p.wobble += 0.02;
      p.y += p.speed;
      p.x += p.drift + Math.sin(p.wobble) * 0.5;
      if (p.y > window.innerHeight + 10) {
        p.y = -10;
        p.x = Math.random() * window.innerWidth;
      }
    },
  },

  foggy: {
    count: 6,
    factory: () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 150 + Math.random() * 200,
      opacity: 0.03 + Math.random() * 0.07,
      speed: 0.1 + Math.random() * 0.2,
      color: [200, 215, 225],
    }),
    draw(p) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, `rgba(${p.color},${p.opacity})`);
      grad.addColorStop(1, `rgba(${p.color},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    },
    update(p) {
      p.x += p.speed;
      if (p.x > window.innerWidth + p.r) p.x = -p.r;
    },
  },

  stormy: {
    count: 150,
    factory: () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      len: 10 + Math.random() * 25,
      opacity: 0.2 + Math.random() * 0.5,
      speed: 18 + Math.random() * 14,
      angle: 0.35,
      color: [80, 120, 200],
    }),
    draw(p) {
      ctx.strokeStyle = `rgba(${p.color},${p.opacity})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.len * Math.sin(p.angle), p.y + p.len * Math.cos(p.angle));
      ctx.stroke();
    },
    update(p) {
      p.y += p.speed;
      p.x += p.speed * Math.tan(p.angle) * 0.4;
      if (p.y > window.innerHeight + 20) {
        p.y = -20;
        p.x = Math.random() * window.innerWidth;
      }
    },
  },
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cfg = CONFIGS[currentTheme];
  if (!cfg) { animationId = requestAnimationFrame(loop); return; }
  for (const p of particles) {
    cfg.draw(p);
    cfg.update(p);
  }
  animationId = requestAnimationFrame(loop);
}

export function initAtmosphere() {
  canvas = document.getElementById('atmosphere-canvas');
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  loop();
}

export function setAtmosphere(theme) {
  if (theme === currentTheme) return;
  currentTheme = theme;
  const cfg = CONFIGS[theme];
  if (!cfg) { particles = []; return; }
  particles = Array.from({ length: cfg.count }, cfg.factory);
}
