const canvasBack = document.getElementById('particleCanvasBack');
const ctxBack = canvasBack.getContext('2d');
const canvasFront = document.getElementById('particleCanvasFront');
const ctxFront = canvasFront.getContext('2d');

let width, height, centerX, centerY;

const orbitRadiusX = 600;
const orbitRadiusY = 300;
const particleCount = 10;
const particles = [];
const colors = ['#edab54', 'white'];
const speed = 0.001;

const rotationAngleZ = -Math.PI / 4;
const rotationAngleX = Math.PI / 10;

let mouse = { x: null, y: null };
let smoothedMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

let startTime = null;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  centerX = width / 2;
  centerY = height / 2;
  canvasBack.width = width;
  canvasBack.height = height;
  canvasFront.width = width;
  canvasFront.height = height;
  smoothedMouse.x = centerX;
  smoothedMouse.y = centerY;
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

function createParticles() {
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 / particleCount) * i;
    const size = Math.random() * 160 + 150;
    particles.push({
      angle: angle,
      progress: 0,
      baseSize: size,
      color: colors[i % colors.length],
    });
  }
}

function rotateX(y, z, angle) {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const newY = y * cosA - z * sinA;
  const newZ = y * sinA + z * cosA;
  return { y: newY, z: newZ };
}

function drawGroup(ctx, group, elapsed) {
  group.forEach(p => {
    p.progress = 1;
    p.angle += speed;

    const zDepth = (Math.sin(p.angle) + 1) / 2;

    const easedDepth = zDepth * zDepth * (3 - 2 * zDepth);
    const scale = 0.4 + easedDepth * 0.6;
    const radius = p.baseSize * scale;

    const cosAngle = Math.cos(p.angle);
    const sinAngle = Math.sin(p.angle);
    const cosRotZ = Math.cos(rotationAngleZ);
    const sinRotZ = Math.sin(rotationAngleZ);

    let x = cosAngle * orbitRadiusX;
    let y = sinAngle * orbitRadiusY;
    let z = 0;

    let rotatedX = cosRotZ * x - sinRotZ * y;
    let rotatedY = sinRotZ * x + cosRotZ * y;
    let rotatedZ = z;

    const rotatedXYZ = rotateX(rotatedY, rotatedZ, rotationAngleX);
    rotatedY = rotatedXYZ.y;
    rotatedZ = rotatedXYZ.z;

    let targetX = centerX + rotatedX;
    let targetY = centerY + rotatedY;

    let posX = lerp(centerX, targetX, p.progress);
    let posY = lerp(centerY, targetY, p.progress);

    if (mouse.x !== null && mouse.y !== null) {
      const dx = posX - smoothedMouse.x;
      const dy = posY - smoothedMouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150 && dist > 0) {
        const repelForce = (150 - dist) * 0;
        posX += (dx / dist) * repelForce;
        posY += (dy / dist) * repelForce;
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(posX, posY, radius / 2, 0, Math.PI * 2);

    const glowStrength = lerp(40, 100, easedDepth);
    const alpha = lerp(0.3, 1, easedDepth);

    ctx.shadowColor = p.color;
    ctx.shadowBlur = glowStrength;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  });
}

function drawParticles(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsed = timestamp - startTime;

  if (mouse.x !== null && mouse.y !== null) {
    smoothedMouse.x = lerp(smoothedMouse.x, mouse.x, 0.1);
    smoothedMouse.y = lerp(smoothedMouse.y, mouse.y, 0.1);
  }

  ctxBack.clearRect(0, 0, width, height);
  ctxFront.clearRect(0, 0, width, height);

  const sortedParticles = [...particles].sort((a, b) => Math.sin(a.angle) - Math.sin(b.angle));
  const backParticles = sortedParticles.filter(p => ((Math.sin(p.angle) + 1) / 2) <= 0.5);
  const frontParticles = sortedParticles.filter(p => ((Math.sin(p.angle) + 1) / 2) > 0.5);

  drawGroup(ctxBack, backParticles, elapsed);
  drawGroup(ctxFront, frontParticles, elapsed);
}

function animate(timestamp) {
  drawParticles(timestamp);
  requestAnimationFrame(animate);
}

resize();
createParticles();
requestAnimationFrame(animate);
