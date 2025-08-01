const canvasBack = document.getElementById('particleCanvasBack');
const ctxBack = canvasBack.getContext('2d');
const canvasFront = document.getElementById('particleCanvasFront');
const ctxFront = canvasFront.getContext('2d');

let width, height, centerX, centerY;

const outerOrbitRadiusX = 600;
const outerOrbitRadiusY = 300;
const innerOrbitRadiusX = 400;
const innerOrbitRadiusY = 200;

const particleCount = 10;
const particles = [];
const particlesRing2 = [];
const colors = ['#edab54', 'white'];

const speed = 0.001;
const speed2 = 0.003;

const rotationAngleZ = -Math.PI / 4;
const rotationAngleX = Math.PI / 10;

const rotationOffset2 = Math.random() * Math.PI * 2;
const rotationAngleZ2 = Math.PI / 4;
const rotationAngleX2 = Math.PI / 8;

let orbitYRotation1 = 0;
let orbitYRotation2 = 0;

const maxRotation = Math.PI / 6;

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
    const size = Math.random() * 120 + 110;
    particles.push({
      angle: angle,
      progress: 0,
      baseSize: size,
      color: colors[i % colors.length],
    });
  }

  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    const size = Math.random() * 100 + 90;
    particlesRing2.push({
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
  return {
    y: y * cosA - z * sinA,
    z: y * sinA + z * cosA,
  };
}

function rotateY(x, z, angle) {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  return {
    x: x * cosA + z * sinA,
    z: -x * sinA + z * cosA,
  };
}

function drawOrbit(ctx, orbitX, orbitY, angleZ, angleX, yRotation, alpha = 1) {
  const steps = 100;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    let x = Math.cos(t) * orbitX;
    let y = Math.sin(t) * orbitY;
    let z = 0;

    const cosZ = Math.cos(angleZ);
    const sinZ = Math.sin(angleZ);
    let rotatedX = cosZ * x - sinZ * y;
    let rotatedY = sinZ * x + cosZ * y;
    let rotatedZ = z;

    const rotatedXYZ = rotateX(rotatedY, rotatedZ, angleX);
    rotatedY = rotatedXYZ.y;
    rotatedZ = rotatedXYZ.z;

    const yRotated = rotateY(rotatedX, rotatedZ, yRotation);
    rotatedX = yRotated.x;

    const screenX = centerX + rotatedX;
    const screenY = centerY + rotatedY;

    if (i === 0) {
      ctx.moveTo(screenX, screenY);
    } else {
      ctx.lineTo(screenX, screenY);
    }
  }
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 0.4;
  ctx.stroke();
  ctx.restore();
}

function drawGroup(ctx, group, elapsed, orbitX, orbitY, ringSpeed, rotationOffset, angleZ, angleX, yRotation) {
  group.forEach(p => {
    p.progress = 1;
    p.angle += ringSpeed;

    const zDepth = (Math.sin(p.angle + rotationOffset) + 1) / 2;
    const easedDepth = zDepth * zDepth * (3 - 2 * zDepth);
    const scale = 0.4 + easedDepth * 0.6;
    const radius = p.baseSize * scale;

    const cosAngle = Math.cos(p.angle + rotationOffset);
    const sinAngle = Math.sin(p.angle + rotationOffset);

    let x = cosAngle * orbitX;
    let y = sinAngle * orbitY;
    let z = 0;

    const cosZ = Math.cos(angleZ);
    const sinZ = Math.sin(angleZ);
    let rotatedX = cosZ * x - sinZ * y;
    let rotatedY = sinZ * x + cosZ * y;
    let rotatedZ = z;

    const rotatedXYZ = rotateX(rotatedY, rotatedZ, angleX);
    rotatedY = rotatedXYZ.y;
    rotatedZ = rotatedXYZ.z;

    const yRotated = rotateY(rotatedX, rotatedZ, yRotation);
    rotatedX = yRotated.x;
    rotatedZ = yRotated.z;

    const targetX = centerX + rotatedX;
    const targetY = centerY + rotatedY;

    const posX = lerp(centerX, targetX, p.progress);
    const posY = lerp(centerY, targetY, p.progress);

    ctx.save();
    ctx.beginPath();
    ctx.arc(posX, posY, radius / 2, 0, Math.PI * 2);
    ctx.shadowColor = p.color;
    ctx.shadowBlur = lerp(80, 150, easedDepth);
    ctx.globalAlpha = 1;
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

  const normMouseX = (smoothedMouse.x / width) - 0.5;

  orbitYRotation1 = normMouseX * maxRotation * 0.5;
  orbitYRotation2 = normMouseX * maxRotation;

  ctxBack.clearRect(0, 0, width, height);
  ctxFront.clearRect(0, 0, width, height);

  let lineAlpha = 0;
  if (elapsed > 1500) {
    lineAlpha = 1;
  } else {
    lineAlpha = elapsed / 1500;
  }

  drawOrbit(ctxBack, innerOrbitRadiusX, innerOrbitRadiusY, rotationAngleZ2, rotationAngleX2, orbitYRotation2, lineAlpha);
  drawOrbit(ctxBack, outerOrbitRadiusX, outerOrbitRadiusY, rotationAngleZ, rotationAngleX, orbitYRotation1, lineAlpha);

  const sortedParticles = [...particles].sort((a, b) => Math.sin(a.angle) - Math.sin(b.angle));
  const backParticles = sortedParticles.filter(p => ((Math.sin(p.angle) + 1) / 2) <= 0.5);
  const frontParticles = sortedParticles.filter(p => ((Math.sin(p.angle) + 1) / 2) > 0.5);

  const sortedRing2 = [...particlesRing2].sort((a, b) => Math.sin(a.angle + rotationOffset2) - Math.sin(b.angle + rotationOffset2));
  const backRing2 = sortedRing2.filter(p => ((Math.sin(p.angle + rotationOffset2) + 1) / 2) <= 0.5);
  const frontRing2 = sortedRing2.filter(p => ((Math.sin(p.angle + rotationOffset2) + 1) / 2) > 0.5);

  drawGroup(ctxBack, backParticles, elapsed, outerOrbitRadiusX, outerOrbitRadiusY, speed, 0, rotationAngleZ, rotationAngleX, orbitYRotation1);
  drawGroup(ctxBack, backRing2, elapsed, innerOrbitRadiusX, innerOrbitRadiusY, speed2, rotationOffset2, rotationAngleZ2, rotationAngleX2, orbitYRotation2);

  drawGroup(ctxFront, frontRing2, elapsed, innerOrbitRadiusX, innerOrbitRadiusY, speed2, rotationOffset2, rotationAngleZ2, rotationAngleX2, orbitYRotation2);
  drawGroup(ctxFront, frontParticles, elapsed, outerOrbitRadiusX, outerOrbitRadiusY, speed, 0, rotationAngleZ, rotationAngleX, orbitYRotation1);
}

function animate(timestamp) {
  drawParticles(timestamp);
  requestAnimationFrame(animate);
}

resize();
createParticles();
requestAnimationFrame(animate);


