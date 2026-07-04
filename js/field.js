// AETHOS signal field — a cursor-reactive flow-field particle system.
// Performance-guarded: clamped DPR, capped particle budget, pauses when the
// tab is hidden, and never starts under prefers-reduced-motion (the CSS
// gradient fallback on #field stays visible instead).

(function initSignalField() {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const canvas = document.getElementById("field");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d", { alpha: true });

  const DPR_CAP = 1.5;
  const MIN_PARTICLES = 48;
  const MAX_PARTICLES = 130;
  const AREA_PER_PARTICLE = 15000;
  const POINTER_RADIUS_SQ = 42000;
  const TRAIL_ALPHA = 0.14;
  const RESIZE_DEBOUNCE_MS = 150;
  const PLASMA = [
    [124, 92, 255], // violet
    [41, 224, 214], // cyan-teal
    [255, 92, 168], // hot node
  ];

  const pointer = { x: -9999, y: -9999, active: false };
  let devicePixelClamp = 1;
  let viewWidth = 0;
  let viewHeight = 0;
  let particles = [];
  let animationHandle = 0;
  let running = false;

  const seedParticles = function seedParticles() {
    const area = viewWidth * viewHeight;
    const count = Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, Math.round(area / AREA_PER_PARTICLE)));
    particles = [];
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * viewWidth,
        y: Math.random() * viewHeight,
        speed: 0.25 + Math.random() * 0.5,
        hue: PLASMA[i % PLASMA.length],
        size: 0.6 + Math.random() * 1.4,
        energy: 0,
      });
    }
  };

  const resize = function resize() {
    devicePixelClamp = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    viewWidth = canvas.clientWidth;
    viewHeight = canvas.clientHeight;
    canvas.width = Math.floor(viewWidth * devicePixelClamp);
    canvas.height = Math.floor(viewHeight * devicePixelClamp);
    ctx.setTransform(devicePixelClamp, 0, 0, devicePixelClamp, 0, 0);
    seedParticles();
  };

  // Cheap analytic flow field (no noise library): angle from layered sines.
  const flowAngle = function flowAngle(x, y, seconds) {
    const nx = x * 0.0016;
    const ny = y * 0.0016;
    return (
      Math.sin(nx + seconds * 0.15) * 1.4 +
      Math.cos(ny - seconds * 0.1) * 1.4 +
      Math.sin((nx + ny) * 0.6) * 0.9
    );
  };

  const step = function step(timestamp) {
    if (!running) return;
    const seconds = timestamp * 0.001;

    // Trail: fade the previous frame rather than hard-clearing.
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(8, 9, 12, ${TRAIL_ALPHA})`;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    ctx.globalCompositeOperation = "lighter";
    for (const particle of particles) {
      const angle = flowAngle(particle.x, particle.y, seconds);
      let velocityX = Math.cos(angle) * particle.speed;
      let velocityY = Math.sin(angle) * particle.speed;

      if (pointer.active) {
        const toPointerX = pointer.x - particle.x;
        const toPointerY = pointer.y - particle.y;
        const distanceSq = toPointerX * toPointerX + toPointerY * toPointerY;
        if (distanceSq < POINTER_RADIUS_SQ) {
          const pull = (1 - distanceSq / POINTER_RADIUS_SQ) * 0.9;
          const distance = Math.sqrt(distanceSq) + 0.01;
          velocityX += (toPointerX / distance) * pull;
          velocityY += (toPointerY / distance) * pull;
          particle.energy = Math.min(1, particle.energy + 0.08);
        }
      }
      particle.energy *= 0.94;

      particle.x += velocityX;
      particle.y += velocityY;

      // Wrap around edges so the field feels boundless.
      if (particle.x < -20) particle.x = viewWidth + 20;
      else if (particle.x > viewWidth + 20) particle.x = -20;
      if (particle.y < -20) particle.y = viewHeight + 20;
      else if (particle.y > viewHeight + 20) particle.y = -20;

      const [red, green, blue] = particle.hue;
      const alpha = 0.16 + particle.energy * 0.6;
      const radius = particle.size + particle.energy * 2.2;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    animationHandle = requestAnimationFrame(step);
  };

  const start = function start() {
    if (running) return;
    running = true;
    animationHandle = requestAnimationFrame(step);
  };

  const stop = function stop() {
    running = false;
    cancelAnimationFrame(animationHandle);
  };

  const onPointerMove = function onPointerMove(event) {
    const source = event.touches ? event.touches[0] : event;
    pointer.x = source.clientX;
    pointer.y = source.clientY;
    pointer.active = true;
  };

  const onPointerLeave = function onPointerLeave() {
    pointer.active = false;
  };

  let resizeTimer = 0;
  window.addEventListener("resize", function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, RESIZE_DEBOUNCE_MS);
  });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave);
  document.addEventListener("visibilitychange", function onVisibilityChange() {
    if (document.hidden) stop();
    else start();
  });

  resize();
  start();
})();
