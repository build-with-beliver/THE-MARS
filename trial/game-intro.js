/**
 * BELIEVERS STUDIOS — Cinematic Movie Intro Engine
 * ====================================================
 * A AAA-grade cinematic cutscene with seamless movie continuity:
 * 1. Launchpad Countdown & Sparklers
 * 2. Photorealistic Shuttle Liftoff: The actual shuttle from the photo ignites
 *    and physically climbs off the pad, revealing the smoking empty gantry below!
 * 3. Smooth Camera Tilt & Follow into High-Altitude Ascent & Cloud Piercing
 * 4. Automatic Stage Separation: Twin Boosters Detach, Fire Thrusters & Tumble in 3D
 * 5. Camera Push-In through Cockpit Glass into Pressurized Cabin
 * 6. Cockpit Crew Inspection: Astronaut checks avionics & reports "Everything is fine"
 * 7. Asteroid Encounter INSIDE COCKPIT WINDOW:
 *    - The asteroids are strictly contained INSIDE the cockpit windshield aperture!
 *    - The aircraft actively maneuvers (RCS thrusters fire, cockpit banks & tilts).
 *    - Asteroids tumble and SLIDE past the glass on evasive vectors.
 *    - Actual PHYSICS BRAKING (retro-burn deceleration with inertial G-force pull).
 *    - Exactly ONE asteroid strikes the outer hull / window frame!
 * 8. Turbulence, Viewport Spider-Web Cracks, Blinking Red Corners & Sirens
 * 9. Sudden Blackout: Instant Electrical Cut, Sub-Bass Boom, Heartbeat & Tinnitus
 * 10. First-Person Awakening: Realistic Eyelid Blinks & Blurred-to-Sharp 4K Vision Recovery
 */

'use strict';

/* ================================================================
   0. PRELOAD IMAGES & REAL PHOTO ASSETS
   ================================================================ */
const SCENE_IMAGES = {
  launchpad:      'scene-launchpad.jpg',
  launchpadEmpty: 'scene-launchpad-empty.jpg',
  shuttleCutout:  'shuttle-cutout-masked.png',
  launch:         'scene-launch.jpg',
  separation:     'scene-separation.jpg',
  cockpit:        'scene-cockpit.jpg',
  damage:         'scene-damage.jpg',
  wakeup:         'scene-wakeup.jpg',
  asteroid1:      'asteroid-var-1.png',
  asteroid2:      'asteroid-var-2.png',
  asteroid3:      'asteroid-var-3.png',
  asteroid4:      'asteroid-var-4.png'
};

const _loadedImages = {};

function preloadImages() {
  return Promise.all(
    Object.entries(SCENE_IMAGES).map(([key, src]) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { _loadedImages[key] = img; resolve(img); };
      img.onerror = () => { resolve(null); };
      img.src = src;
    }))
  );
}

/* ================================================================
   1. SYNTHESIZED WEB AUDIO ENGINE
   ================================================================ */
let _actx = null;
function actx() {
  if (!_actx) {
    const C = window.AudioContext || window.webkitAudioContext;
    _actx = new C();
  }
  if (_actx.state === 'suspended') _actx.resume();
  return _actx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, delay = 0) {
  try {
    const ctx = actx(), t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.01);
  } catch(e) {}
}

function noiseBurst(dur, vol = 0.15, delay = 0, lpFreq = 600) {
  try {
    const ctx = actx(), t = ctx.currentTime + delay;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(lpFreq, t);
    src.connect(lp); lp.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t + dur + 0.01);
  } catch(e) {}
}

function rcsThrusterSound() {
  noiseBurst(0.18, 0.22, 0, 1800);
  tone(120, 0.12, 'triangle', 0.15);
}

function retroBrakingSound() {
  tone(48, 2.2, 'sawtooth', 0.45);
  tone(36, 2.5, 'sine', 0.4);
  noiseBurst(2.2, 0.4, 0, 350);
}

function beepCountdown(num) {
  if (num === 0) {
    tone(42, 2.4, 'sawtooth', 0.45);
    tone(62, 2.0, 'sine', 0.55);
    noiseBurst(2.8, 0.5, 0, 450);
  } else {
    tone(960, 0.12, 'sine', 0.22);
    tone(1480, 0.08, 'triangle', 0.12, 0.04);
  }
}

let engineNodes = [];
function startEngineRumble(vol = 0.28) {
  try {
    const ctx = actx();
    const freqs = [32, 48, 64, 88, 110];
    freqs.forEach(f => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, ctx.currentTime);
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.8 + Math.random() * 1.5, ctx.currentTime);
      const lfoG = ctx.createGain();
      lfoG.gain.setValueAtTime(4 + Math.random() * 3, ctx.currentTime);
      lfo.connect(lfoG); lfoG.connect(o.frequency);
      lfo.start();

      g.gain.setValueAtTime(vol / freqs.length, ctx.currentTime);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(240, ctx.currentTime);
      o.connect(lp); lp.connect(g); g.connect(ctx.destination);
      o.start();
      engineNodes.push({ o, g, lfo, lp });
    });
  } catch(e) {}
}

function stopEngineRumble(fadeDur = 1.0) {
  try {
    const ctx = actx();
    engineNodes.forEach(n => {
      n.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + fadeDur);
      n.o.stop(ctx.currentTime + fadeDur + 0.1);
      n.lfo.stop(ctx.currentTime + fadeDur + 0.1);
    });
    engineNodes = [];
  } catch(e) {}
}

let sirenInterval = null;
let sirenNodes = [];
function startSiren() {
  try {
    const ctx = actx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth';
    g.gain.setValueAtTime(0.09, ctx.currentTime);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(1400, ctx.currentTime);
    o.connect(lp); lp.connect(g); g.connect(ctx.destination);
    o.start();
    sirenNodes.push({ o, g });
    let high = true;
    o.frequency.setValueAtTime(560, ctx.currentTime);
    sirenInterval = setInterval(() => {
      try {
        o.frequency.linearRampToValueAtTime(high ? 920 : 540, ctx.currentTime + 0.28);
        high = !high;
      } catch(e) {}
    }, 450);
  } catch(e) {}
}

function stopSiren(fadeDur = 0.5) {
  clearInterval(sirenInterval);
  try {
    const ctx = actx();
    sirenNodes.forEach(n => {
      n.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + fadeDur);
      n.o.stop(ctx.currentTime + fadeDur + 0.1);
    });
    sirenNodes = [];
  } catch(e) {}
}

function playCrash() {
  noiseBurst(2.8, 0.75, 0, 900);
  tone(32, 2.4, 'sawtooth', 0.6);
  tone(22, 3.0, 'sine', 0.5);
  tone(140, 0.45, 'square', 0.28);
}

function playSeparation() {
  noiseBurst(0.65, 0.4, 0, 750);
  tone(180, 0.22, 'square', 0.22);
  tone(90, 0.65, 'triangle', 0.28, 0.08);
}

let heartbeatInterval = null;
function startHeartbeat() {
  const beat = () => {
    tone(46, 0.14, 'sine', 0.32);
    setTimeout(() => tone(36, 0.12, 'sine', 0.24), 160);
  };
  beat();
  heartbeatInterval = setInterval(beat, 850);
}
function stopHeartbeat() { clearInterval(heartbeatInterval); }

let tinnitusNodes = [];
function startTinnitus(vol = 0.07) {
  try {
    const ctx = actx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(4500, ctx.currentTime);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    o.connect(g); g.connect(ctx.destination);
    o.start();
    tinnitusNodes.push({ o, g });
  } catch(e) {}
}
function stopTinnitus(fadeDur = 2.0) {
  try {
    const ctx = actx();
    tinnitusNodes.forEach(n => {
      n.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + fadeDur);
      n.o.stop(ctx.currentTime + fadeDur + 0.1);
    });
    tinnitusNodes = [];
  } catch(e) {}
}

function radioChatter() {
  for (let i = 0; i < 4; i++) {
    tone(550 + Math.random() * 450, 0.05, 'triangle', 0.04, i * 0.1);
  }
}

function cinematicBoom() {
  tone(28, 3.2, 'sine', 0.5);
  noiseBurst(0.8, 0.3, 0, 250);
}

let ambientNodes = [];
function startAmbientHum(vol = 0.04) {
  try {
    const ctx = actx();
    [95, 142, 210].forEach(f => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      o.connect(g); g.connect(ctx.destination);
      o.start();
      ambientNodes.push({ o, g });
    });
  } catch(e) {}
}
function stopAmbientHum(fadeDur = 0.5) {
  try {
    const ctx = actx();
    ambientNodes.forEach(n => {
      n.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + fadeDur);
      n.o.stop(ctx.currentTime + fadeDur + 0.1);
    });
    ambientNodes = [];
  } catch(e) {}
}

let warningInterval = null;
function startWarningAlarm() {
  const beep = () => {
    tone(1050, 0.09, 'square', 0.12);
    setTimeout(() => tone(1050, 0.09, 'square', 0.12), 140);
  };
  beep();
  warningInterval = setInterval(beep, 450);
}
function stopWarningAlarm() { clearInterval(warningInterval); }

/* ================================================================
   2. PARTICLE & COCKPIT-WINDOW 3D ASTEROIDS ENGINE
   ================================================================ */
class Particle {
  constructor(x, y, vx, vy, life, size, color, gravity = 0, sizeGrowth = 0) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.size = size; this.color = color;
    this.gravity = gravity;
    this.sizeGrowth = sizeGrowth;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.size += this.sizeGrowth * dt;
    this.life -= dt;
  }
  get alpha() { return Math.max(0, this.life / this.maxLife); }
  get alive() { return this.life > 0 && this.size > 0; }
}

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  emit(count, cfg) {
    for (let i = 0; i < count; i++) {
      const angle = (cfg.angleMin || 0) + Math.random() * ((cfg.angleMax || 360) - (cfg.angleMin || 0));
      const speed = (cfg.speedMin || 50) + Math.random() * ((cfg.speedMax || 200) - (cfg.speedMin || 50));
      const rad = angle * Math.PI / 180;
      const vx = Math.cos(rad) * speed + (cfg.baseVx || 0);
      const vy = Math.sin(rad) * speed + (cfg.baseVy || 0);
      const life = (cfg.lifeMin || 0.5) + Math.random() * ((cfg.lifeMax || 2) - (cfg.lifeMin || 0.5));
      const size = (cfg.sizeMin || 2) + Math.random() * ((cfg.sizeMax || 6) - (cfg.sizeMin || 2));
      const cx = (cfg.x || 0) + (Math.random() - 0.5) * (cfg.spread || 0);
      const cy = (cfg.y || 0) + (Math.random() - 0.5) * (cfg.spreadY || cfg.spread || 0);
      const color = Array.isArray(cfg.colors)
        ? cfg.colors[Math.floor(Math.random() * cfg.colors.length)]
        : (cfg.color || '#ffffff');
      this.particles.push(new Particle(cx, cy, vx, vy, life, size, color, cfg.gravity || 0, cfg.sizeGrowth || 0));
    }
  }
  clear() { this.particles = []; }
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (!this.particles[i].alive) this.particles.splice(i, 1);
    }
  }
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();

      if (p.size > 3) {
        ctx.globalAlpha = p.alpha * 0.25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

/* 
 * COCKPIT VIEWPORT 3D ASTEROIDS ENGINE
 * Asteroids are strictly rendered through the cockpit viewport glass aperture!
 * They tumble, approach, and SLIDE across the glass as the aircraft maneuvers & brakes.
 * Only ONE rogue asteroid impacts the hull / frame.
 */
class CockpitWindowAsteroids3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.asteroids = [];
    this.variantKeys = ['asteroid1', 'asteroid2', 'asteroid3', 'asteroid4'];
    this.shipRollOffset = 0;
    this.shipPitchOffset = 0;
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth || window.innerWidth * 0.65;
    this.canvas.height = this.canvas.clientHeight || window.innerHeight * 0.72;
  }

  // Spawn an asteroid. isHitAsteroid = true only for the single rock that collides!
  spawn(isHitAsteroid = false) {
    const vk = this.variantKeys[Math.floor(Math.random() * this.variantKeys.length)];
    const img = _loadedImages[vk];

    // If it's a sliding/dodged asteroid, give it clear lateral slide velocity
    let startX, startY, vx, vy;
    if (isHitAsteroid) {
      // Direct collision course on the starboard frame!
      startX = 40;
      startY = -20;
      vx = -15; // slightly drifts into frame
      vy = 10;
    } else {
      // Evasive slide trajectories across the window glass
      const side = Math.random() > 0.5 ? 1 : -1;
      startX = side * (120 + Math.random() * 180);
      startY = (Math.random() - 0.5) * 160;
      // High sideways slide velocity as the ship dodges!
      vx = side * (180 + Math.random() * 220);
      vy = (Math.random() - 0.5) * 140;
    }

    this.asteroids.push({
      img: img,
      x: startX,
      y: startY,
      z: 1800 + Math.random() * 600,
      vx: vx,
      vy: vy,
      vz: -480 - Math.random() * 320,
      baseSize: isHitAsteroid ? 480 : (160 + Math.random() * 240),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2.5,
      isHitAsteroid: isHitAsteroid
    });
  }

  update(dt) {
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i];
      a.z += a.vz * dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rotation += a.rotSpeed * dt;

      // Sliding asteroids disappear once they pass the window glass plane (z <= 30)
      if (!a.isHitAsteroid && a.z <= 30) {
        this.asteroids.splice(i, 1);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const cx = this.canvas.width * 0.5 + this.shipRollOffset;
    const cy = this.canvas.height * 0.5 + this.shipPitchOffset;
    const fov = 420;

    const sorted = [...this.asteroids].sort((a, b) => b.z - a.z);

    for (const a of sorted) {
      if (a.z <= 15) continue;
      const scale = fov / a.z;
      const sx = cx + a.x * scale;
      const sy = cy + a.y * scale;
      const w = a.baseSize * scale;
      const h = a.baseSize * scale;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(a.rotation);

      if (a.img && a.img.complete) {
        ctx.drawImage(a.img, -w / 2, -h / 2, w, h);
      }

      ctx.restore();
    }
  }

  clear() { this.asteroids = []; }
}

/* ================================================================
   3. CINEMATIC INTRO ORCHESTRATOR
   ================================================================ */
class CinematicIntro {
  constructor() {
    this.overlay = null;
    this.cameraRig = null;
    this.bgCurrent = null;
    this.bgNext = null;
    this.realShuttle = null;
    this.shuttlePlume = null;
    this.fxCanvas = null;
    this.particles = null;

    // Viewport Window Asteroid Canvas (strictly clipped to cockpit windshield)
    this.windowFrameContainer = null;
    this.asteroidCanvas = null;
    this.windowAsteroids = null;

    this.hudEl = null;
    this.textEl = null;
    this.countdownEl = null;
    this.vignetteEl = null;
    this.flashEl = null;
    this.cracksEl = null;
    this.eyelidsTop = null;
    this.eyelidsBottom = null;

    this.running = false;
    this.rafId = null;
    this.lastTime = 0;
    this.onComplete = null;
  }

  createDOM() {
    const old = document.getElementById('cinematic-overlay');
    if (old) old.remove();

    const ov = document.createElement('div');
    ov.id = 'cinematic-overlay';
    ov.style.cssText = `
      position:fixed; top:0; left:0; width:100vw; height:100vh;
      z-index:500; background:#000; overflow:hidden;
      perspective: 1200px;
    `;

    // Continuous Movie Camera Rig with dynamic motion & tilt
    const rig = document.createElement('div');
    rig.id = 'cine-camera-rig';
    rig.style.cssText = `
      position:absolute; inset:-5%; width:110%; height:110%;
      transform-origin: 50% 50%;
      transition: transform 0.08s linear, filter 0.3s ease;
      will-change: transform, filter;
    `;
    ov.appendChild(rig);
    this.cameraRig = rig;

    // Background Layer 1
    const bg1 = document.createElement('div');
    bg1.style.cssText = `
      position:absolute; inset:0; background-size:cover; background-position:center;
      transition: opacity 1.0s cubic-bezier(0.2,0.8,0.2,1), transform 1.2s cubic-bezier(0.2,0.8,0.2,1);
    `;
    rig.appendChild(bg1);
    this.bgCurrent = bg1;

    // Background Layer 2 (Cross-camera matching)
    const bg2 = document.createElement('div');
    bg2.style.cssText = `
      position:absolute; inset:0; background-size:cover; background-position:center;
      opacity:0; transition: opacity 1.0s cubic-bezier(0.2,0.8,0.2,1), transform 1.2s cubic-bezier(0.2,0.8,0.2,1);
    `;
    rig.appendChild(bg2);
    this.bgNext = bg2;

    // THE PHOTOREALISTIC SHUTTLE CUTOUT FROM THE IMAGE
    const shuttle = document.createElement('div');
    shuttle.id = 'cine-real-shuttle';
    shuttle.style.cssText = `
      position:absolute;
      left: 53.7%; top: 12.1%;
      width: 18.5%; height: 65.1%;
      background: url('shuttle-cutout-masked.png') no-repeat center center;
      background-size: contain;
      display: none; pointer-events: none; z-index: 4;
      will-change: transform;
      filter: drop-shadow(0 15px 35px rgba(0,0,0,0.7));
    `;

    const plume = document.createElement('div');
    plume.id = 'shuttle-booster-plume';
    plume.style.cssText = `
      position: absolute;
      bottom: -65%; left: 8%; width: 84%; height: 75%;
      pointer-events: none; display: none;
      background: radial-gradient(ellipse at 50% 0%, #ffffff 0%, #fff088 20%, #ff8800 50%, #ff2200 75%, transparent 100%);
      filter: blur(4px) drop-shadow(0 0 35px #ff6600);
      mix-blend-mode: screen;
      transform-origin: 50% 0%;
      animation: plumeFlicker 0.08s infinite alternate;
    `;
    shuttle.appendChild(plume);
    this.shuttlePlume = plume;
    rig.appendChild(shuttle);
    this.realShuttle = shuttle;

    // DEDICATED VIEWPORT WINDOW APERTURE FOR ASTEROIDS
    // Constrained STRICTLY inside the central circular/oval cockpit glass window!
    const winContainer = document.createElement('div');
    winContainer.id = 'cine-cockpit-window-aperture';
    winContainer.style.cssText = `
      position: absolute;
      top: 8%; left: 18%; width: 64%; height: 74%;
      clip-path: ellipse(48% 46% at 50% 50%);
      pointer-events: none; z-index: 3;
      display: none; overflow: hidden;
    `;
    const astCv = document.createElement('canvas');
    astCv.style.cssText = 'position:absolute; inset:0; width:100%; height:100%;';
    winContainer.appendChild(astCv);
    rig.appendChild(winContainer);
    this.windowFrameContainer = winContainer;
    this.asteroidCanvas = astCv;
    this.windowAsteroids = new CockpitWindowAsteroids3D(astCv);

    // Full-Screen FX Canvas (Smoke, Sparks, Debris)
    const cv = document.createElement('canvas');
    cv.id = 'cine-particles';
    cv.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;';
    ov.appendChild(cv);
    this.fxCanvas = cv;
    this.particles = new ParticleSystem(cv);

    // Dynamic red corner alert vignette
    const vig = document.createElement('div');
    vig.id = 'cine-vignette';
    vig.style.cssText = `
      position:absolute; inset:0; pointer-events:none; z-index:6;
      opacity:0; transition: opacity 0.12s ease;
      box-shadow: inset 0 0 160px 80px rgba(255,0,0,0.9);
    `;
    ov.appendChild(vig);
    this.vignetteEl = vig;

    // Realistic spider-web glass cracks on the cockpit windshield
    const cracks = document.createElement('div');
    cracks.id = 'cine-cracks';
    cracks.style.cssText = `
      position:absolute; inset:0; pointer-events:none; z-index:7;
      opacity:0; transition: opacity 0.15s ease;
      background:
        radial-gradient(circle at 55% 42%, transparent 0%, rgba(255,255,255,0.06) 15%, transparent 18%),
        repeating-radial-gradient(circle at 55% 42%, rgba(255,255,255,0.7) 0px, transparent 2px, transparent 35px),
        repeating-conic-gradient(from 0deg at 55% 42%, rgba(255,255,255,0.6) 0deg, transparent 4deg, transparent 25deg);
      filter: drop-shadow(0 0 12px rgba(255,255,255,0.9));
    `;
    ov.appendChild(cracks);
    this.cracksEl = cracks;

    // White flash
    const flash = document.createElement('div');
    flash.id = 'cine-flash';
    flash.style.cssText = `
      position:absolute; inset:0; pointer-events:none; z-index:8;
      background:#fff; opacity:0; transition: opacity 0.08s ease-out;
    `;
    ov.appendChild(flash);
    this.flashEl = flash;

    // Human Eyelids Simulation for Awakening
    const eyeTop = document.createElement('div');
    eyeTop.style.cssText = `
      position:absolute; top:0; left:0; width:100%; height:50%;
      background:#000; z-index:9; pointer-events:none;
      transform: translateY(-100%); transition: transform 0.6s cubic-bezier(0.2,0.8,0.2,1);
    `;
    ov.appendChild(eyeTop);
    this.eyelidsTop = eyeTop;

    const eyeBot = document.createElement('div');
    eyeBot.style.cssText = `
      position:absolute; bottom:0; left:0; width:100%; height:50%;
      background:#000; z-index:9; pointer-events:none;
      transform: translateY(100%); transition: transform 0.6s cubic-bezier(0.2,0.8,0.2,1);
    `;
    ov.appendChild(eyeBot);
    this.eyelidsBottom = eyeBot;

    // Countdown Typography
    const cd = document.createElement('div');
    cd.id = 'cine-countdown';
    cd.style.cssText = `
      position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
      font-size:16vw; font-weight:900; color:#fff; z-index:10;
      text-shadow: 0 0 60px rgba(255,100,0,0.9), 0 0 160px rgba(255,40,0,0.7);
      opacity:0; transition: opacity 0.15s, transform 0.4s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events:none;
    `;
    ov.appendChild(cd);
    this.countdownEl = cd;

    // Subtitles / Crew Comm Text
    const txt = document.createElement('div');
    txt.id = 'cine-text';
    txt.style.cssText = `
      position:absolute; bottom:10%; left:50%; transform:translateX(-50%);
      max-width:85%; text-align:center; z-index:11;
      font-size:1.25rem; font-weight:600; color:#ffffff;
      text-shadow: 0 2px 14px rgba(0,0,0,0.95);
      letter-spacing:0.04em; line-height:1.5;
      opacity:0; transition: opacity 0.3s;
      pointer-events:none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px 28px;
      background: rgba(3, 8, 16, 0.75);
      border: 1px solid rgba(0, 210, 255, 0.3);
      border-radius: 8px;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.7);
    `;
    ov.appendChild(txt);
    this.textEl = txt;

    // Futuristic Mission Control HUD
    const hud = document.createElement('div');
    hud.id = 'cine-hud';
    hud.style.cssText = `
      position:absolute; top:24px; left:30px; right:30px; z-index:11;
      display:flex; justify-content:space-between; align-items:center;
      font-size:0.75rem; font-weight:800; letter-spacing:0.2em;
      color: rgba(0,210,255,0.85); text-transform:uppercase;
      opacity:0; transition:opacity 0.5s;
      pointer-events:none;
      font-family: monospace, -apple-system, sans-serif;
    `;
    hud.innerHTML = `
      <span id="hud-left">&#9670; BELIEVERS FLIGHT TELEMETRY</span>
      <span id="hud-center" style="color:#ffffff;">ALT: <span id="hud-alt">000.0 KM</span> &bull; VEL: <span id="hud-vel">0.00 KM/S</span></span>
      <span id="hud-right">SYSTEM: <span id="hud-status" style="color:#00ff88;">NOMINAL</span></span>
    `;
    ov.appendChild(hud);
    this.hudEl = hud;

    // Skip Button
    const skip = document.createElement('button');
    skip.textContent = 'SKIP INTRO ▸▸';
    skip.style.cssText = `
      position:absolute; bottom:24px; right:28px; z-index:15;
      background: rgba(6,18,30,0.75); border:1px solid rgba(0,210,255,0.4);
      color:#92c5e5; padding:8px 18px; border-radius:6px;
      font-size:0.75rem; font-weight:800; letter-spacing:0.15em;
      cursor:pointer; transition:all 0.2s;
      font-family: inherit; backdrop-filter:blur(6px);
    `;
    skip.onmouseenter = () => { skip.style.background = 'rgba(0,210,255,0.25)'; skip.style.color = '#fff'; };
    skip.onmouseleave = () => { skip.style.background = 'rgba(6,18,30,0.75)'; skip.style.color = '#92c5e5'; };
    skip.onclick = () => this.skipIntro();
    ov.appendChild(skip);

    document.body.appendChild(ov);
    this.overlay = ov;
    this.particles.resize();
    this.windowAsteroids.resize();
    window.addEventListener('resize', () => {
      this.particles.resize();
      this.windowAsteroids.resize();
    });
  }

  /* ---------- Visual Helpers ---------- */
  setCamera(x, y, scale = 1, rot = 0) {
    this.cameraRig.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rot}deg)`;
  }

  cameraShake(intensity = 8, dur = 500) {
    const rig = this.cameraRig;
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      if (elapsed > dur) return;
      const decay = 1 - elapsed / dur;
      const dx = (Math.random() - 0.5) * intensity * 2 * decay;
      const dy = (Math.random() - 0.5) * intensity * 2 * decay;
      rig.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  showText(text, delay = 0) {
    setTimeout(() => {
      this.textEl.innerHTML = text;
      this.textEl.style.opacity = '1';
    }, delay);
  }
  hideText(delay = 0) {
    setTimeout(() => { this.textEl.style.opacity = '0'; }, delay);
  }

  flash(dur = 120) {
    this.flashEl.style.opacity = '1';
    setTimeout(() => { this.flashEl.style.opacity = '0'; }, dur);
  }

  showCountdown(num) {
    this.countdownEl.textContent = num;
    this.countdownEl.style.opacity = '1';
    this.countdownEl.style.transform = 'scale(1.25)';
    setTimeout(() => {
      this.countdownEl.style.transform = 'scale(0.85)';
      this.countdownEl.style.opacity = '0.35';
    }, 550);
    setTimeout(() => {
      this.countdownEl.style.opacity = '0';
    }, 850);
  }

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  startLoop() {
    this.running = true;
    this.lastTime = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.particles.update(dt);
      this.windowAsteroids.update(dt);
      this.particles.draw();
      this.windowAsteroids.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stopLoop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  destroy() {
    this.stopLoop();
    stopEngineRumble(0.3);
    stopSiren(0.3);
    stopHeartbeat();
    stopTinnitus(0.5);
    stopAmbientHum(0.3);
    stopWarningAlarm();
    if (this.overlay) this.overlay.remove();
  }

  skipIntro() {
    this.destroy();
    if (this.onComplete) this.onComplete();
  }

  /* ================================================================
     4. SEAMLESS CINEMATIC SEQUENCE
     ================================================================ */
  async play(onComplete) {
    this.onComplete = onComplete;
    this.createDOM();
    this.startLoop();

    try {
      await this.sceneCountdownAndRealLiftoff();
      if (!this.running) return;

      await this.sceneAtmosphericTrackingShot();
      if (!this.running) return;

      await this.sceneOrbitalStageSeparation();
      if (!this.running) return;

      await this.sceneCockpitFlyInAndSystemsCheck();
      if (!this.running) return;

      await this.sceneCockpitEvasiveManeuversAndBraking();
      if (!this.running) return;

      await this.sceneSingleAsteroidImpactAndTurbulence();
      if (!this.running) return;

      await this.sceneSuddenBlackout();
      if (!this.running) return;

      await this.sceneAwakeningPOV();
    } catch(e) {
      console.error('[CinematicIntro]', e);
    }

    this.destroy();
    if (onComplete) onComplete();
  }

  /* -------------------------------------------------------------
     SCENE 1: COUNTDOWN & REAL PHOTO SHUTTLE LIFTOFF
     ------------------------------------------------------------- */
  async sceneCountdownAndRealLiftoff() {
    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.launchpad}')`;
    this.bgCurrent.style.opacity = '1';
    this.hudEl.style.opacity = '1';

    this.setCamera(-40, 15, 1.05);

    this.showText('MISSION CONTROL: "Believers-1, terminal countdown sequence started."', 200);
    radioChatter();
    await this.sleep(1800);
    this.hideText();

    const W = this.fxCanvas.width, H = this.fxCanvas.height;
    const padRocketX = W * 0.63;
    const padRocketY = H * 0.72;

    for (let i = 6; i >= 1; i--) {
      if (!this.running) return;
      this.showCountdown(i);
      beepCountdown(i);

      if (i <= 3) {
        this.particles.emit(25, {
          x: padRocketX, y: padRocketY, spread: 45, spreadY: 10,
          angleMin: 40, angleMax: 140, speedMin: 80, speedMax: 220,
          lifeMin: 0.2, lifeMax: 0.5, sizeMin: 2, sizeMax: 5,
          colors: ['#ffffff', '#ffea88', '#ff9900']
        });
        this.cameraShake(3 + (4 - i) * 3, 700);
      }

      await this.sleep(1000);
    }

    beepCountdown(0);
    this.showCountdown('IGNITION');
    this.countdownEl.style.fontSize = '8vw';
    this.countdownEl.style.color = '#ff6600';
    this.flash(200);
    this.cameraShake(18, 3000);
    startEngineRumble(0.35);

    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.launchpadEmpty}')`;
    this.realShuttle.style.display = 'block';
    this.realShuttle.style.transform = 'translateY(0px)';
    this.shuttlePlume.style.display = 'block';

    const smokeInterval = setInterval(() => {
      if (!this.running) { clearInterval(smokeInterval); return; }
      this.particles.emit(18, {
        x: padRocketX - 50, y: padRocketY + 30, spread: 80, spreadY: 20,
        angleMin: 140, angleMax: 220, speedMin: 140, speedMax: 340,
        lifeMin: 1.2, lifeMax: 2.8, sizeMin: 15, sizeMax: 40,
        colors: ['rgba(235,235,235,0.7)', 'rgba(210,210,210,0.6)', 'rgba(255,180,100,0.7)', 'rgba(130,130,130,0.5)'],
        sizeGrowth: 18
      });
      this.particles.emit(18, {
        x: padRocketX + 50, y: padRocketY + 30, spread: 80, spreadY: 20,
        angleMin: -40, angleMax: 40, speedMin: 140, speedMax: 340,
        lifeMin: 1.2, lifeMax: 2.8, sizeMin: 15, sizeMax: 40,
        colors: ['rgba(235,235,235,0.7)', 'rgba(210,210,210,0.6)', 'rgba(255,180,100,0.7)', 'rgba(130,130,130,0.5)'],
        sizeGrowth: 18
      });
      this.particles.emit(15, {
        x: padRocketX, y: padRocketY + 15, spread: 40,
        angleMin: 75, angleMax: 105, speedMin: 280, speedMax: 650,
        lifeMin: 0.3, lifeMax: 0.8, sizeMin: 4, sizeMax: 10,
        colors: ['#ffffff', '#ffee66', '#ff8800', '#ff3300']
      });
    }, 40);

    this.showText('LIFTOFF! WE HAVE A LIFTOFF OF BELIEVERS-1!', 300);

    const startTime = performance.now();
    const liftoffDuration = 4200;
    const hudAlt = document.getElementById('hud-alt');
    const hudVel = document.getElementById('hud-vel');

    while (performance.now() - startTime < liftoffDuration) {
      if (!this.running) break;
      const progress = (performance.now() - startTime) / liftoffDuration;
      const rocketYOffset = Math.pow(progress, 2.3) * (H * 1.4);
      this.realShuttle.style.transform = `translateY(-${rocketYOffset}px)`;

      const camYPan = progress * 200;
      this.setCamera(-40, 15 + camYPan, 1.05 + progress * 0.12);

      if (hudAlt) hudAlt.textContent = (progress * 14.2).toFixed(1) + ' KM';
      if (hudVel) hudVel.textContent = (progress * 2.1).toFixed(2) + ' KM/S';

      await this.sleep(16);
    }

    clearInterval(smokeInterval);
    this.hideText();
  }

  /* -------------------------------------------------------------
     SCENE 2: ATMOSPHERIC CHASE TRACKING SHOT
     ------------------------------------------------------------- */
  async sceneAtmosphericTrackingShot() {
    this.bgNext.style.backgroundImage = `url('${SCENE_IMAGES.launch}')`;
    this.bgNext.style.opacity = '1';
    this.bgNext.style.transform = 'scale(1.05)';
    this.realShuttle.style.display = 'none';

    this.flash(180);
    this.cameraShake(14, 2500);

    this.showText('COMM: "Mach 1.4. Passing through Maximum Dynamic Pressure (Max-Q)..."', 200);
    radioChatter();

    const hudAlt = document.getElementById('hud-alt');
    const hudVel = document.getElementById('hud-vel');

    const W = this.fxCanvas.width, H = this.fxCanvas.height;
    const ascentInterval = setInterval(() => {
      if (!this.running) { clearInterval(ascentInterval); return; }
      this.particles.emit(12, {
        x: W * 0.5, y: H * 0.9, spread: 80,
        angleMin: 80, angleMax: 100, speedMin: 300, speedMax: 650,
        lifeMin: 0.3, lifeMax: 0.9, sizeMin: 3, sizeMax: 7,
        colors: ['#ffffff', '#ffee55', '#ff7700']
      });
    }, 50);

    for (let t = 0; t < 25; t++) {
      if (!this.running) break;
      if (hudAlt) hudAlt.textContent = (15 + t * 3.8).toFixed(1) + ' KM';
      if (hudVel) hudVel.textContent = (2.2 + t * 0.25).toFixed(2) + ' KM/S';
      await this.sleep(100);
    }

    clearInterval(ascentInterval);
    this.hideText();
    this.bgCurrent.style.opacity = '0';
  }

  /* -------------------------------------------------------------
     SCENE 3: ORBITAL STAGE SEPARATION
     ------------------------------------------------------------- */
  async sceneOrbitalStageSeparation() {
    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.separation}')`;
    this.bgCurrent.style.opacity = '1';
    this.bgNext.style.opacity = '0';

    this.showText('BOOSTER BURNOUT &bull; INITIATING STAGE SEPARATION', 200);
    radioChatter();
    await this.sleep(1500);

    playSeparation();
    this.flash(200);
    this.cameraShake(10, 800);

    this.showText('STAGE SEPARATION CONFIRMED — BOOSTERS JETTISONED', 200);
    const hudStatus = document.getElementById('hud-status');
    if (hudStatus) { hudStatus.textContent = 'ORBITAL INJECTION'; hudStatus.style.color = '#00e5ff'; }

    const W = this.fxCanvas.width, H = this.fxCanvas.height;
    this.particles.emit(45, {
      x: W * 0.42, y: H * 0.52, spread: 50,
      angleMin: 160, angleMax: 210, speedMin: 80, speedMax: 260,
      lifeMin: 1.5, lifeMax: 3.5, sizeMin: 2, sizeMax: 6,
      colors: ['#ffffff', '#cbd5e1', '#94a3b8', '#ffaa44']
    });
    this.particles.emit(45, {
      x: W * 0.58, y: H * 0.52, spread: 50,
      angleMin: -30, angleMax: 20, speedMin: 80, speedMax: 260,
      lifeMin: 1.5, lifeMax: 3.5, sizeMin: 2, sizeMax: 6,
      colors: ['#ffffff', '#cbd5e1', '#94a3b8', '#ffaa44']
    });

    await this.sleep(2500);
    this.hideText();
    stopEngineRumble(1.2);
  }

  /* -------------------------------------------------------------
     SCENE 4: CAMERA PUSH-INTO COCKPIT & CREW SYSTEMS CHECK
     ------------------------------------------------------------- */
  async sceneCockpitFlyInAndSystemsCheck() {
    this.setCamera(0, 0, 1.4);
    await this.sleep(600);

    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.cockpit}')`;
    this.setCamera(0, 0, 1.0);
    this.particles.clear();
    startAmbientHum(0.04);

    const hudStatus = document.getElementById('hud-status');
    if (hudStatus) { hudStatus.textContent = 'NOMINAL'; hudStatus.style.color = '#00ff88'; }

    this.showText('MISSION CONTROL: "Believers-1, confirm cabin pressurization and orbital diagnostics."', 300);
    radioChatter();
    await this.sleep(3000);
    this.hideText();

    await this.sleep(600);
    this.showText('CO-PILOT: "Unbuckling to check flight telemetry and reactor seals. Stand by..."', 200);
    radioChatter();
    await this.sleep(3200);
    this.hideText();

    this.showText('<span style="color:#00ff88;">[DIAGNOSTICS]</span> LIFE SUPPORT: 100% &bull; PROPULSION: GREEN &bull; STABILIZATION: LOCKED', 200);
    tone(880, 0.1, 'sine', 0.1);
    await this.sleep(1200);
    tone(1200, 0.15, 'sine', 0.12);
    await this.sleep(2000);
    this.hideText();

    await this.sleep(600);
    this.showText('CO-PILOT: "Diagnostics nominal. Everything is fine. Spacecraft is in perfect shape."', 200);
    radioChatter();
    await this.sleep(3000);
    this.hideText();
  }

  /* -------------------------------------------------------------
     SCENE 5: ASTEROIDS INSIDE VIEWPORT & ACTIVE EVASIVE MANEUVERING + BRAKING
     - Asteroids are strictly constrained INSIDE the cockpit window/mirror aperture!
     - The spacecraft banks, pitches, and fires RCS thrusters to dodge.
     - Asteroids slide past the glass.
     - Retro-thrusters engage with physical deceleration braking!
     ------------------------------------------------------------- */
  async sceneCockpitEvasiveManeuversAndBraking() {
    stopAmbientHum(0.5);

    // Keep camera inside the cockpit!
    this.setCamera(0, -15, 1.05);

    const hudStatus = document.getElementById('hud-status');
    if (hudStatus) { hudStatus.textContent = 'WARNING'; hudStatus.style.color = '#ff9900'; }

    startWarningAlarm();
    this.showText('⚠ PROXIMITY ALERT — DENSE ASTEROID BELT ON INTERCEPT VECTOR', 200);
    await this.sleep(1800);
    this.hideText();

    // ACTIVATE THE COCKPIT WINDOW APERTURE (Asteroids ONLY drawn inside window!)
    this.windowFrameContainer.style.display = 'block';
    this.windowAsteroids.resize();

    this.showText('PILOT: "Multiple contacts in front viewport! Initiating defensive roll and evasion!"', 200);

    // EVASIVE MANEUVER 1: Bank Left & RCS Burn
    rcsThrusterSound();
    this.setCamera(-28, -10, 1.05, 3.8); // Cockpit banks right
    this.windowAsteroids.shipRollOffset = -35;
    this.windowAsteroids.spawn(false);
    this.windowAsteroids.spawn(false);
    this.cameraShake(5, 700);
    await this.sleep(900);

    // EVASIVE MANEUVER 2: Reverse Bank Right & RCS Burn
    rcsThrusterSound();
    this.setCamera(28, -20, 1.05, -3.8); // Cockpit banks left
    this.windowAsteroids.shipRollOffset = 35;
    this.windowAsteroids.spawn(false);
    this.windowAsteroids.spawn(false);
    this.cameraShake(6, 700);
    await this.sleep(900);

    // PHYSICAL RETRO-BRAKING MANEUVER
    stopWarningAlarm();
    this.showText('<span style="color:#ffcc00; font-weight:800;">[EMERGENCY RETRO-BRAKING] REVERSE ENGINES 100% &bull; DECELERATING G-FORCE</span>', 200);
    retroBrakingSound();

    // Cockpit pulls backward under intense braking deceleration
    this.setCamera(0, 20, 0.98, 0);
    this.windowAsteroids.shipRollOffset = 0;
    this.windowAsteroids.shipPitchOffset = 25;

    const hudVel = document.getElementById('hud-vel');
    if (hudVel) hudVel.textContent = '12.40 KM/S (BRAKING)';

    // Asteroids slow and slide past the glass!
    this.windowAsteroids.spawn(false);
    this.windowAsteroids.spawn(false);
    this.cameraShake(8, 1400);

    await this.sleep(500);
    if (hudVel) hudVel.textContent = '6.80 KM/S (BRAKING)';
    await this.sleep(600);
    if (hudVel) hudVel.textContent = '2.10 KM/S (CRITICAL)';
    this.hideText();
  }

  /* -------------------------------------------------------------
     SCENE 6: EXACTLY ONE ASTEROID HITS THE CRAFT & TURBULENCE
     Only ONE rogue asteroid strikes the outer hull / window frame!
     ------------------------------------------------------------- */
  async sceneSingleAsteroidImpactAndTurbulence() {
    const hudStatus = document.getElementById('hud-status');
    if (hudStatus) { hudStatus.textContent = 'CRITICAL'; hudStatus.style.color = '#ff0033'; }

    this.showText('CO-PILOT: "ROGUE ASTEROID ON STARBOARD FRAME! WE CAN\'T CLEAR IT—"', 100);

    // Spawn EXACTLY ONE targeted asteroid on direct collision course with the window frame!
    this.windowAsteroids.spawn(true);
    await this.sleep(850);
    this.hideText();

    // DIRECT IMPACT ON THE SPACECRAFT!
    playCrash();
    this.flash(280);
    this.cameraShake(36, 2600);
    startSiren();

    // Damaged cockpit interior
    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.damage}')`;
    this.bgCurrent.style.filter = 'brightness(0.65) contrast(1.35) saturate(1.4)';

    // Spider-web glass cracks shatter across the cockpit window
    this.cracksEl.style.opacity = '0.95';

    // Red corner emergency sirens pulse in rhythm
    let blinkState = false;
    const blinkInterval = setInterval(() => {
      blinkState = !blinkState;
      this.vignetteEl.style.opacity = blinkState ? '1' : '0.15';
    }, 280);

    // Sparks & decomp mist venting inside the cockpit
    const W = this.fxCanvas.width, H = this.fxCanvas.height;
    this.particles.emit(110, {
      x: W * 0.52, y: H * 0.44, spread: 280, spreadY: 150,
      angleMin: 0, angleMax: 360, speedMin: 90, speedMax: 380,
      lifeMin: 0.4, lifeMax: 2.2, sizeMin: 2, sizeMax: 6,
      colors: ['#ffffff', '#ffeedd', '#ff5500', '#ff0033', '#ffbb00']
    });

    this.showText('<span style="color:#ff2222; font-weight:800;">CRITICAL HULL IMPACT &bull; STARBOARD STRUT BREACH</span>', 300);

    await this.sleep(3200);
    clearInterval(blinkInterval);
    this.vignetteEl.style.opacity = '0';
    this.cracksEl.style.opacity = '0';
    this.hideText();
    this.hudEl.style.opacity = '0';
    this.windowAsteroids.clear();
    this.windowFrameContainer.style.display = 'none';
  }

  /* -------------------------------------------------------------
     SCENE 7: SUDDEN BLACKOUT (BLANK SCREEN & SENSORY DEPRIVATION)
     ------------------------------------------------------------- */
  async sceneSuddenBlackout() {
    stopSiren(0.8);
    stopEngineRumble(0.4);

    // Instant electrical power cut to PURE BLANK BLACK SCREEN
    this.bgCurrent.style.opacity = '0';
    this.bgNext.style.opacity = '0';
    this.particles.clear();

    cinematicBoom();
    await this.sleep(1200);

    startHeartbeat();

    this.showText('<span style="color:#8899aa; letter-spacing:0.3em;">. . .</span>', 200);
    await this.sleep(3000);
    this.hideText();
    await this.sleep(1200);

    stopHeartbeat();
  }

  /* -------------------------------------------------------------
     SCENE 8: FIRST-PERSON AWAKENING POV (Eyelids Blinking, Blurry to Sharp)
     ------------------------------------------------------------- */
  async sceneAwakeningPOV() {
    startTinnitus(0.08);

    this.bgCurrent.style.backgroundImage = `url('${SCENE_IMAGES.wakeup}')`;
    this.bgCurrent.style.filter = 'blur(28px) brightness(0.25) saturate(0.4)';
    this.bgCurrent.style.opacity = '1';

    // EYELID BLINK 1: Groggily opens partially, then shuts
    this.eyelidsTop.style.transform = 'translateY(-30%)';
    this.eyelidsBottom.style.transform = 'translateY(30%)';
    await this.sleep(900);

    this.eyelidsTop.style.transform = 'translateY(0%)';
    this.eyelidsBottom.style.transform = 'translateY(0%)';
    await this.sleep(600);

    // EYELID BLINK 2: Opens wider, vision clears slightly
    this.eyelidsTop.style.transform = 'translateY(-75%)';
    this.eyelidsBottom.style.transform = 'translateY(75%)';
    this.bgCurrent.style.filter = 'blur(16px) brightness(0.45) saturate(0.6)';
    await this.sleep(1200);

    this.showText('PILOT: "Ugh... what... what happened...?"', 200);
    await this.sleep(2200);
    this.hideText();

    // FULL EYE OPENING & VISION RECOVERY
    this.eyelidsTop.style.transform = 'translateY(-100%)';
    this.eyelidsBottom.style.transform = 'translateY(100%)';
    this.bgCurrent.style.filter = 'blur(6px) brightness(0.75) saturate(0.85)';
    await this.sleep(1500);

    stopTinnitus(2.5);

    // 4K SHARP CLARITY RESTORED
    this.bgCurrent.style.filter = 'blur(0px) brightness(1.0) saturate(1.0)';
    this.showText('<span style="color:#00e5ff;">EMERGENCY LIFE SUPPORT ONLINE. ENTERING 3D COCKPIT CONTROL...</span>', 200);
    await this.sleep(3000);
    this.hideText();

    this.bgCurrent.style.transition = 'opacity 1.2s ease';
    this.bgCurrent.style.opacity = '0';
    await this.sleep(1300);
  }
}

/* ================================================================
   5. GLOBAL ENTRY POINT
   ================================================================ */
window.startCinematicIntro = function(onComplete) {
  preloadImages().then(() => {
    const intro = new CinematicIntro();
    intro.play(onComplete || (() => {}));
  });
};
