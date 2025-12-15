const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hero = new Image();
hero.src = 'assets/hero.svg';

const keys = new Set();
const player = { x: 480, y: 360, w: 42, h: 56, speed: 210 };
let last = 0;

const layout = {
  walls: [
    // внешняя рамка
    { x: 60, y: 60, w: 840, h: 26 },
    { x: 60, y: 554, w: 840, h: 26 },
    { x: 60, y: 60, w: 26, h: 520 },
    { x: 874, y: 60, w: 26, h: 520 },
    // внутренние несущие балки
    { x: 320, y: 200, w: 20, h: 240 },
    { x: 620, y: 200, w: 20, h: 240 },
    { x: 400, y: 260, w: 160, h: 20 },
    { x: 400, y: 420, w: 160, h: 20 },
  ],
  glass: [
    // панорамные панели
    { x: 60, y: 60, w: 840, h: 520 },
    { x: 110, y: 110, w: 740, h: 420 },
    { x: 210, y: 170, w: 540, h: 80 },
    { x: 210, y: 390, w: 540, h: 80 },
    { x: 110, y: 250, w: 80, h: 180 },
    { x: 810, y: 250, w: 80, h: 180 },
  ],
  viewZones: [
    { x: 110, y: 110, w: 740, h: 60 },
    { x: 110, y: 470, w: 740, h: 60 },
    { x: 60, y: 250, w: 50, h: 180 },
    { x: 850, y: 250, w: 50, h: 180 },
  ]
};

function drawCityPanorama() {
  const { width, height } = canvas;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#60c5ff');
  gradient.addColorStop(0.5, '#1a3d7a');
  gradient.addColorStop(1, '#0c162c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 24; i++) {
    const x = 40 + i * 36 + Math.sin(Date.now() / 1400 + i) * 6;
    const w = 24 + (i % 3) * 6;
    const h = 120 + (i % 5) * 50;
    ctx.fillStyle = i % 4 === 0 ? '#b6e3ff' : '#8ec5ff';
    ctx.fillRect(x, height - h - 60, w, h);
  }
  ctx.restore();
}

function drawFloorPattern(time) {
  const { width, height } = canvas;
  ctx.save();
  ctx.globalAlpha = 0.85;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(30,45,70,0.9)');
  gradient.addColorStop(1, 'rgba(12,18,32,0.92)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i + (Math.sin(time * 0.002 + i * 0.02) * 2), 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }
  for (let j = 0; j < height; j += 40) {
    ctx.beginPath();
    ctx.moveTo(0, j + (Math.cos(time * 0.002 + j * 0.02) * 2));
    ctx.lineTo(width, j);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlassPanels(time) {
  layout.glass.forEach((panel) => {
    ctx.save();
    ctx.fillStyle = 'rgba(150, 210, 255, 0.2)';
    ctx.strokeStyle = 'rgba(180, 235, 255, 0.7)';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(90, 200, 255, 0.35)';
    ctx.shadowBlur = 12;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    const highlight = panel.x + (Math.sin(time * 0.004 + panel.y) + 1) * (panel.w / 4);
    const glassGradient = ctx.createLinearGradient(highlight, panel.y, highlight + 12, panel.y + panel.h);
    glassGradient.addColorStop(0, 'rgba(255,255,255,0.22)');
    glassGradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glassGradient;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.restore();
  });
}

function drawWalls() {
  ctx.fillStyle = '#0b1020';
  ctx.strokeStyle = '#1f2c45';
  ctx.lineWidth = 3;
  layout.walls.forEach((wall) => {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
  });
}

function drawViewZones() {
  layout.viewZones.forEach((zone) => {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#6af0ff';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.restore();
  });
}

function drawPlayer(time) {
  const bob = Math.sin(time * 0.008) * 2;
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  ctx.drawImage(hero, -player.w / 2, -player.h / 2, player.w, player.h);
  ctx.restore();
}

function collides(x, y) {
  const rect = { x: x - player.w / 2, y: y - player.h / 2, w: player.w, h: player.h };
  return layout.walls.some((wall) =>
    rect.x < wall.x + wall.w && rect.x + rect.w > wall.x && rect.y < wall.y + wall.h && rect.y + rect.h > wall.y
  );
}

function update(dt) {
  const moveX = (keys.has('ArrowRight') || keys.has('d')) - (keys.has('ArrowLeft') || keys.has('a'));
  const moveY = (keys.has('ArrowDown') || keys.has('s')) - (keys.has('ArrowUp') || keys.has('w'));

  const length = Math.hypot(moveX, moveY) || 1;
  const dx = (moveX / length) * player.speed * dt;
  const dy = (moveY / length) * player.speed * dt;

  if (!collides(player.x + dx, player.y)) player.x += dx;
  if (!collides(player.x, player.y + dy)) player.y += dy;
}

function loop(timestamp) {
  const dt = (timestamp - last) / 1000;
  last = timestamp;

  drawCityPanorama();
  drawFloorPattern(timestamp);
  drawGlassPanels(timestamp);
  drawViewZones();
  drawWalls();
  drawPlayer(timestamp);
  update(dt);

  requestAnimationFrame(loop);
}

hero.onload = () => requestAnimationFrame(loop);
window.addEventListener('keydown', (e) => keys.add(e.key));
window.addEventListener('keyup', (e) => keys.delete(e.key));
