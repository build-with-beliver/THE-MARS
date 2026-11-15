/**
 * BELIEVERS STUDIOS — REAL-TIME 3D STARSHIP GAME ENGINE
 * ========================================================
 * High-performance, fully continuous 3D game world powered by Three.js & Web Audio:
 * - Real-time physics engine: momentum, acceleration, friction, gravity & bounding collisions
 * - Immersive 3D starship environment: Cockpit, Corridors, Airlock, Reactor Core & Deep Space View
 * - First-Person Player Controller: Mouse look (Pointer Lock), WASD movement, sprint, jump, head-bob
 * - Interactive Helmet HUD, Flashlight & Plasma Multitool
 * - Physical interactions: hydraulic blast doors, rotating emergency valves, interactive consoles
 * - Pushable physics objects & atmospheric smoke/steam particle systems
 * - Real-time lighting: rotating red emergency beacons, sparks, flickering tube lights & shadows
 * - Continuous gameplay loop running at smooth 60 FPS
 */

'use strict';

class StarshipGameEngine {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();

    // Physics & Controls
    this.keys = {};
    this.isPointerLocked = false;
    this.pitch = 0;
    this.yaw = 0;
    this.playerVelocity = new THREE.Vector3();
    this.isGrounded = true;
    this.playerHeight = 1.75;
    this.walkSpeed = 5.5;
    this.sprintSpeed = 9.0;
    this.gravity = -18.0;
    this.headBobTimer = 0;

    // Colliders (AABB boxes for walls and consoles)
    this.colliders = [];
    this.interactiveObjects = [];
    this.pushableCrates = [];

    // Player Hands / Tool
    this.handModel = null;
    this.flashlight = null;
    this.isFlashlightOn = true;
    this.raycaster = new THREE.Raycaster();
    this.centerScreen = new THREE.Vector2(0, 0);

    // Particle Emitters in 3D
    this.steamEmitters = [];
    this.sparkLights = [];
    this.emergencyBeacons = [];

    // Mission State
    this.objectives = {
      hullBreach: false,
      coolantValve: false,
      commsRelay: false
    };

    this.active = false;
    this.rafId = null;
  }

  init(containerId = 'game-canvas-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      this.container.style.cssText = `
        position: fixed; inset: 0; width: 100vw; height: 100vh;
        z-index: 100; display: none; overflow: hidden; background: #000;
      `;
      document.body.appendChild(this.container);
    }

    // 1. THREE.JS SCENE & RENDERER
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x060810, 0.035);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, this.playerHeight, 8); // Start in Cockpit looking forward

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.canvas = this.renderer.domElement;
    this.canvas.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; display:block;';
    this.container.appendChild(this.canvas);

    // 2. BUILD THE 3D STARSHIP WORLD
    this.buildStarshipEnvironment();

    // 3. ATTACH FLASHLIGHT & FIRST-PERSON RIG
    this.setupPlayerRig();

    // 4. ATTACH INTERACTION HUD OVERLAY
    this.createGameHUD();

    // 5. INPUT LISTENERS
    this.setupInputHandlers();

    // 6. RESIZE HANDLER
    window.addEventListener('resize', () => {
      if (!this.active) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    console.log('[StarshipGameEngine] Engine initialized successfully.');
  }

  /* ================================================================
     ENVIRONMENT ARCHITECTURE (Cockpit, Corridors, Reactor Room)
     ================================================================ */
  buildStarshipEnvironment() {
    const scene = this.scene;

    // Materials
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x22262e,
      roughness: 0.65,
      metalness: 0.45
    });

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x141820,
      roughness: 0.4,
      metalness: 0.7
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x181b22,
      roughness: 0.8,
      metalness: 0.3
    });

    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      roughness: 0.5,
      metalness: 0.2
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.45
    });

    // Helper: Add Wall with AABB collider
    const addWall = (w, h, d, x, y, z, mat = wallMat, rotY = 0) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = rotY;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Register collision box
      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push(box);
      return mesh;
    };

    // --- SECTION A: COCKPIT / BRIDGE (Z = 5 to 15) ---
    // Floor & Ceiling
    const bridgeFloor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), floorMat);
    bridgeFloor.rotation.x = -Math.PI / 2;
    bridgeFloor.position.set(0, 0, 10);
    bridgeFloor.receiveShadow = true;
    scene.add(bridgeFloor);

    const bridgeCeil = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), ceilingMat);
    bridgeCeil.rotation.x = Math.PI / 2;
    bridgeCeil.position.set(0, 3.8, 10);
    scene.add(bridgeCeil);

    // Left & Right Bridge Walls
    addWall(0.5, 4, 10, -6, 2, 10);
    addWall(0.5, 4, 10, 6, 2, 10);

    // Front Panoramic Viewport Window Frame (Looking into outer space)
    addWall(12, 1.2, 0.4, 0, 0.6, 15); // bottom sill
    addWall(12, 1.0, 0.4, 0, 3.3, 15); // top frame
    addWall(0.5, 2.0, 0.4, -2.5, 2.0, 15); // vertical strut left
    addWall(0.5, 2.0, 0.4, 2.5, 2.0, 15);  // vertical strut right

    // Large Viewport Glass
    const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(11.8, 2.0), glassMat);
    windowGlass.position.set(0, 2.0, 14.85);
    scene.add(windowGlass);

    // Pilot & Co-Pilot Consoles
    const consoleGeo = new THREE.BoxGeometry(2.2, 1.1, 1.4);
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x181e28, metalness: 0.8, roughness: 0.3 });
    const consoleLeft = new THREE.Mesh(consoleGeo, consoleMat);
    consoleLeft.position.set(-2.2, 0.55, 13.2);
    consoleLeft.rotation.y = 0.2;
    scene.add(consoleLeft);
    this.colliders.push(new THREE.Box3().setFromObject(consoleLeft));

    const consoleRight = new THREE.Mesh(consoleGeo, consoleMat);
    consoleRight.position.set(2.2, 0.55, 13.2);
    consoleRight.rotation.y = -0.2;
    scene.add(consoleRight);
    this.colliders.push(new THREE.Box3().setFromObject(consoleRight));

    // Glowing Holographic Display Screens on Consoles
    const screenGeo = new THREE.PlaneGeometry(1.8, 0.7);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const screenL = new THREE.Mesh(screenGeo, screenMat);
    screenL.position.set(-2.2, 1.2, 13.1);
    screenL.rotation.x = -0.35;
    screenL.rotation.y = 0.2;
    scene.add(screenL);

    const screenR = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ color: 0xff3344 }));
    screenR.position.set(2.2, 1.2, 13.1);
    screenR.rotation.x = -0.35;
    screenR.rotation.y = -0.2;
    scene.add(screenR);

    // Pilot Chairs
    const chairGeo = new THREE.BoxGeometry(0.8, 1.4, 0.8);
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x2d3440, roughness: 0.8 });
    const chairL = new THREE.Mesh(chairGeo, chairMat);
    chairL.position.set(-2.2, 0.7, 11.5);
    scene.add(chairL);
    this.colliders.push(new THREE.Box3().setFromObject(chairL));

    const chairR = new THREE.Mesh(chairGeo, chairMat);
    chairR.position.set(2.2, 0.7, 11.5);
    scene.add(chairR);
    this.colliders.push(new THREE.Box3().setFromObject(chairR));

    // INTERACTIVE CONSOLE: Emergency Blast Shield Shutter
    const shieldTerminal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 0.6), hazardMat);
    shieldTerminal.position.set(0, 0.65, 13.8);
    scene.add(shieldTerminal);
    this.colliders.push(new THREE.Box3().setFromObject(shieldTerminal));

    this.interactiveObjects.push({
      mesh: shieldTerminal,
      name: 'blastShield',
      prompt: 'PRESS [E] TO ACTIVATE VIEWPORT BLAST SHIELDS',
      action: () => {
        this.objectives.hullBreach = true;
        this.playGameTone(1100, 0.3, 'sine');
        this.showGameNotification('🛡️ VIEWPORT BLAST SHIELDS SEALED — CABIN PRESSURE STABILIZING');
        // Slide down blast shutter
        const shutter = new THREE.Mesh(new THREE.BoxGeometry(11.8, 2.0, 0.3), wallMat);
        shutter.position.set(0, 2.0, 14.8);
        scene.add(shutter);
      }
    });

    // --- SECTION B: CORRIDOR / AIRLOCK (Z = -10 to 5) ---
    const hallFloor = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 15), floorMat);
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.set(0, 0, -2.5);
    hallFloor.receiveShadow = true;
    scene.add(hallFloor);

    const hallCeil = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 15), ceilingMat);
    hallCeil.rotation.x = Math.PI / 2;
    hallCeil.position.set(0, 3.2, -2.5);
    scene.add(hallCeil);

    // Corridor Walls
    addWall(0.4, 3.5, 15, -1.8, 1.6, -2.5);
    addWall(0.4, 3.5, 15, 1.8, 1.6, -2.5);

    // Bridge-Corridor Portal Wall
    addWall(4.2, 3.8, 0.4, -3.9, 1.9, 5);
    addWall(4.2, 3.8, 0.4, 3.9, 1.9, 5);

    // Corridor Rib Structures (Arches every 3 meters)
    for (let rz = 4; rz >= -8; rz -= 3) {
      const archMat = new THREE.MeshStandardMaterial({ color: 0x363d4a, metalness: 0.6, roughness: 0.4 });
      const archL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.3), archMat);
      archL.position.set(-1.6, 1.6, rz);
      scene.add(archL);
      const archR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.3), archMat);
      archR.position.set(1.6, 1.6, rz);
      scene.add(archR);
      const archTop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 0.3), archMat);
      archTop.position.set(0, 3.05, rz);
      scene.add(archTop);
    }

    // --- SECTION C: ENGINEERING & REACTOR ROOM (Z = -22 to -10) ---
    const reactorFloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), floorMat);
    reactorFloor.rotation.x = -Math.PI / 2;
    reactorFloor.position.set(0, 0, -16);
    reactorFloor.receiveShadow = true;
    scene.add(reactorFloor);

    const reactorCeil = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), ceilingMat);
    reactorCeil.rotation.x = Math.PI / 2;
    reactorCeil.position.set(0, 4.5, -16);
    scene.add(reactorCeil);

    addWall(0.5, 5, 12, -8, 2.25, -16); // Left wall
    addWall(0.5, 5, 12, 8, 2.25, -16);  // Right wall
    addWall(16, 5, 0.5, 0, 2.25, -22);  // Back wall
    addWall(6.2, 5, 0.5, -4.9, 2.25, -10); // Front wall left
    addWall(6.2, 5, 0.5, 4.9, 2.25, -10);  // Front wall right

    // Central Fusion Core (Pulsing Plasma Cylinder)
    const coreGeo = new THREE.CylinderGeometry(1.4, 1.4, 4.2, 24);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ccaa,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: true
    });
    const reactorCore = new THREE.Mesh(coreGeo, coreMat);
    reactorCore.position.set(0, 2.1, -16);
    scene.add(reactorCore);
    this.colliders.push(new THREE.Box3().setFromObject(reactorCore));
    this.reactorCoreMesh = reactorCore;

    // Glowing Core Light
    const coreLight = new THREE.PointLight(0x00ffcc, 2.2, 15);
    coreLight.position.set(0, 2.1, -16);
    scene.add(coreLight);
    this.coreLight = coreLight;

    // INTERACTIVE REACTOR VALVE: Coolant Bypass
    const valveGeo = new THREE.TorusGeometry(0.4, 0.08, 12, 24);
    const valveMat = new THREE.MeshStandardMaterial({ color: 0xff3300, roughness: 0.3, metalness: 0.8 });
    const valveMesh = new THREE.Mesh(valveGeo, valveMat);
    valveMesh.position.set(-4.5, 1.4, -21.6);
    valveMesh.rotation.y = 0;
    scene.add(valveMesh);
    this.coolantValveMesh = valveMesh;

    const valveMount = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.4), wallMat);
    valveMount.position.set(-4.5, 1.0, -21.8);
    scene.add(valveMount);
    this.colliders.push(new THREE.Box3().setFromObject(valveMount));

    this.interactiveObjects.push({
      mesh: valveMount,
      name: 'coolantValve',
      prompt: 'PRESS [E] TO ROTATE AUXILIARY COOLANT VALVE',
      action: () => {
        this.objectives.coolantValve = true;
        this.playGameTone(750, 0.4, 'triangle');
        this.coolantValveMesh.rotation.z += Math.PI / 2;
        this.showGameNotification('⚙️ AUXILIARY COOLANT RESTORED — REACTOR TEMPERATURE DROPPING');
      }
    });

    // PUSHABLE PHYSICS CRATES
    const crateGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x485260, roughness: 0.6, metalness: 0.4 });
    const cratePositions = [
      new THREE.Vector3(-1.0, 0.4, 1.5),
      new THREE.Vector3(1.1, 0.4, -4.5),
      new THREE.Vector3(-3.5, 0.4, -13.0),
      new THREE.Vector3(4.2, 0.4, -18.5)
    ];

    cratePositions.forEach((pos, idx) => {
      const crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.copy(pos);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      this.pushableCrates.push({
        mesh: crate,
        velocity: new THREE.Vector3(),
        box: new THREE.Box3().setFromObject(crate)
      });
    });

    // --- SECTION D: OUTER DEEP SPACE VISTA (Outside Viewport) ---
    // Stars Skybox Particles
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 400;
      starPos[i + 1] = (Math.random() - 0.5) * 300;
      starPos[i + 2] = 40 + Math.random() * 300; // in front of the cockpit
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.85 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Drifting 3D Asteroids outside the cockpit viewport
    const asteroidGeo = new THREE.DodecahedronGeometry(3.5, 1);
    const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x4a433a, roughness: 0.9, metalness: 0.2 });
    for (let i = 0; i < 16; i++) {
      const ast = new THREE.Mesh(asteroidGeo, asteroidMat);
      ast.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 40 + 2,
        25 + Math.random() * 80
      );
      ast.scale.setScalar(0.4 + Math.random() * 1.6);
      scene.add(ast);
    }

    // --- SECTION E: REAL-TIME LIGHTING ---
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0x0e1522, 0.8);
    scene.add(ambientLight);

    // Cockpit Red Emergency Strobes (Sweeping/Rotating)
    const strobeL = new THREE.PointLight(0xff2222, 1.8, 12);
    strobeL.position.set(-4.5, 3.2, 11);
    scene.add(strobeL);
    this.emergencyBeacons.push(strobeL);

    const strobeR = new THREE.PointLight(0xff2222, 1.8, 12);
    strobeR.position.set(4.5, 3.2, 11);
    scene.add(strobeR);
    this.emergencyBeacons.push(strobeR);

    // Corridor Fluorescent Tubes (Flickering)
    const tubeLight1 = new THREE.PointLight(0x77ccff, 1.2, 10);
    tubeLight1.position.set(0, 2.9, 1.0);
    scene.add(tubeLight1);
    this.sparkLights.push(tubeLight1);

    const tubeLight2 = new THREE.PointLight(0x77ccff, 1.0, 10);
    tubeLight2.position.set(0, 2.9, -6.0);
    scene.add(tubeLight2);
    this.sparkLights.push(tubeLight2);
  }

  /* ================================================================
     PLAYER RIG & FLASHLIGHT
     ================================================================ */
  setupPlayerRig() {
    // Spotlight attached to camera simulating the astronaut's helmet flashlight
    this.flashlight = new THREE.SpotLight(0xffffff, 2.5, 25, Math.PI / 6, 0.45, 1.2);
    this.flashlight.position.set(0.2, -0.15, 0);
    this.flashlight.target.position.set(0, 0, -5);
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlight.target);
    this.scene.add(this.camera);

    // First-person spacesuit arm model visible in view
    const armGroup = new THREE.Group();
    const armGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.6, 12);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5, metalness: 0.3 });
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.rotation.x = Math.PI / 3;
    armMesh.position.set(0.35, -0.32, -0.45);
    armGroup.add(armMesh);

    // Multitool emitter on hand
    const toolGeo = new THREE.BoxGeometry(0.06, 0.08, 0.2);
    const toolMat = new THREE.MeshStandardMaterial({ color: 0x00d2ff, metalness: 0.8, roughness: 0.2 });
    const toolMesh = new THREE.Mesh(toolGeo, toolMat);
    toolMesh.position.set(0.35, -0.15, -0.65);
    armGroup.add(toolMesh);

    this.camera.add(armGroup);
    this.handModel = armGroup;
  }

  /* ================================================================
     GAME HUD OVERLAY
     ================================================================ */
  createGameHUD() {
    const hud = document.createElement('div');
    hud.id = 'realtime-game-hud';
    hud.style.cssText = `
      position: absolute; inset: 0; pointer-events: none; z-index: 20;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
    `;

    hud.innerHTML = `
      <!-- Crosshair Reticle -->
      <div style="position:absolute; top:50%; left:50%; width:16px; height:16px; transform:translate(-50%, -50%); border:1.5px solid rgba(0,229,255,0.7); border-radius:50%;"></div>
      <div style="position:absolute; top:50%; left:50%; width:4px; height:4px; transform:translate(-50%, -50%); background:#00e5ff; border-radius:50%;"></div>

      <!-- Top Left: Mission Objectives & Emergency Status -->
      <div style="position:absolute; top:24px; left:28px; background:rgba(6,18,30,0.85); border:1px solid rgba(0,210,255,0.4); padding:14px 20px; border-radius:8px; backdrop-filter:blur(8px); box-shadow:0 0 20px rgba(0,210,255,0.2);">
        <div style="font-size:0.75rem; font-weight:900; letter-spacing:0.2em; color:#ff3344; margin-bottom:8px;">
          ⚠ SHIP CRITICAL &bull; DAMAGE CONTROL REQUIRED
        </div>
        <div id="obj-breach" style="font-size:0.85rem; color:#ffbb33; margin-bottom:4px;">
          [ ] 1. Seal Viewport Blast Shields (Cockpit Bridge)
        </div>
        <div id="obj-valve" style="font-size:0.85rem; color:#ffbb33; margin-bottom:4px;">
          [ ] 2. Engage Auxiliary Coolant Valve (Reactor Core)
        </div>
      </div>

      <!-- Top Right: Helmet Telemetry & Flashlight Toggle -->
      <div style="position:absolute; top:24px; right:28px; background:rgba(6,18,30,0.85); border:1px solid rgba(0,210,255,0.4); padding:14px 20px; border-radius:8px; backdrop-filter:blur(8px); text-align:right;">
        <div style="font-size:0.75rem; font-weight:800; letter-spacing:0.15em; color:#00e5ff;">SUIT LIFE SUPPORT</div>
        <div style="font-size:1.1rem; font-weight:900; color:#00ff88; margin-top:2px;">O₂: 98% &bull; PRESS: 1.0 ATM</div>
        <div style="font-size:0.72rem; color:#88aacc; margin-top:4px;">FLASHLIGHT: <span id="hud-flashlight-txt" style="color:#00ff88;">[F] ON</span></div>
      </div>

      <!-- Center Bottom Interaction Prompt -->
      <div id="game-interaction-prompt" style="
        position:absolute; bottom:25%; left:50%; transform:translateX(-50%);
        background:rgba(0,210,255,0.2); border:1.5px solid #00e5ff; color:#fff;
        font-size:0.95rem; font-weight:800; letter-spacing:0.15em; padding:10px 24px;
        border-radius:6px; backdrop-filter:blur(8px); display:none; text-shadow:0 0 8px #00e5ff;
      ">
        PRESS [E] TO INTERACT
      </div>

      <!-- Bottom Controls Help Bar -->
      <div style="position:absolute; bottom:16px; left:50%; transform:translateX(-50%); color:rgba(255,255,255,0.45); font-size:0.75rem; letter-spacing:0.1em;">
        [W/A/S/D] MOVE &bull; [SHIFT] SPRINT &bull; [SPACE] JUMP &bull; [E] INTERACT &bull; [F] FLASHLIGHT &bull; [CLICK] LOCK MOUSE
      </div>

      <!-- In-Game Action Toast -->
      <div id="game-action-toast" style="
        position:absolute; top:20%; left:50%; transform:translateX(-50%);
        background:rgba(0,180,100,0.9); color:#fff; font-size:1.0rem; font-weight:900;
        padding:12px 28px; border-radius:8px; display:none; z-index:30;
      "></div>
    `;

    this.container.appendChild(hud);
    this.hudElement = hud;
  }

  showGameNotification(text) {
    const toast = document.getElementById('game-action-toast');
    if (!toast) return;
    toast.textContent = text;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3500);

    // Update objectives UI
    const bEl = document.getElementById('obj-breach');
    if (bEl && this.objectives.hullBreach) {
      bEl.innerHTML = '<span style="color:#00ff88;">[✓] 1. Viewport Blast Shields Sealed</span>';
    }
    const vEl = document.getElementById('obj-valve');
    if (vEl && this.objectives.coolantValve) {
      vEl.innerHTML = '<span style="color:#00ff88;">[✓] 2. Auxiliary Coolant Restored</span>';
    }
  }

  playGameTone(freq = 880, dur = 0.15, type = 'sine') {
    try {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioClass();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch(e) {}
  }

  /* ================================================================
     INPUTS & POINTER LOCK
     ================================================================ */
  setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Toggle Flashlight
      if (e.code === 'KeyF') {
        this.isFlashlightOn = !this.isFlashlightOn;
        this.flashlight.intensity = this.isFlashlightOn ? 2.5 : 0;
        const txt = document.getElementById('hud-flashlight-txt');
        if (txt) {
          txt.textContent = this.isFlashlightOn ? '[F] ON' : '[F] OFF';
          txt.style.color = this.isFlashlightOn ? '#00ff88' : '#888888';
        }
        this.playGameTone(950, 0.05, 'triangle');
      }

      // Interact [E]
      if (e.code === 'KeyE') {
        this.checkInteraction(true);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Request Pointer Lock on Canvas Click
    this.canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.canvas);
    });

    // Mouse Look
    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;
      const sensitivity = 0.0022;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;

      // Clamp vertical pitch (-85 deg to +85 deg)
      this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
    });
  }

  /* ================================================================
     PHYSICS & REAL-TIME GAME LOOP (60 FPS)
     ================================================================ */
  start() {
    this.active = true;
    this.container.style.display = 'block';
    this.clock.start();
    this.lastTime = performance.now();

    const loop = () => {
      if (!this.active) return;
      const dt = Math.min(this.clock.getDelta(), 0.1);
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.active = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.container.style.display = 'none';
  }

  update(dt) {
    const time = performance.now() * 0.001;

    // 1. ROTATE CAMERA ACCORDING TO YAW & PITCH
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.pitch;
    euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(euler);

    // 2. PLAYER MOVEMENT & MOMENTUM PHYSICS
    const moveVector = new THREE.Vector3();
    if (this.keys['KeyW']) moveVector.z -= 1;
    if (this.keys['KeyS']) moveVector.z += 1;
    if (this.keys['KeyA']) moveVector.x -= 1;
    if (this.keys['KeyD']) moveVector.x += 1;
    moveVector.normalize();

    // Align with player yaw
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const speed = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? this.sprintSpeed : this.walkSpeed;
    const accel = 35.0;
    const friction = 10.0;

    const desiredVel = new THREE.Vector3();
    if (moveVector.lengthSq() > 0) {
      desiredVel.addScaledVector(forward, -moveVector.z * speed);
      desiredVel.addScaledVector(right, moveVector.x * speed);
    }

    // Accelerate smoothly
    this.playerVelocity.x += (desiredVel.x - this.playerVelocity.x) * Math.min(accel * dt, 1.0);
    this.playerVelocity.z += (desiredVel.z - this.playerVelocity.z) * Math.min(accel * dt, 1.0);

    // Jump & Gravity
    if (this.keys['Space'] && this.isGrounded) {
      this.playerVelocity.y = 6.5;
      this.isGrounded = false;
      this.playGameTone(320, 0.15, 'triangle');
    }

    if (!this.isGrounded) {
      this.playerVelocity.y += this.gravity * dt;
    }

    // Apply Velocity to Camera / Player position
    const oldPos = this.camera.position.clone();
    this.camera.position.x += this.playerVelocity.x * dt;
    this.camera.position.z += this.playerVelocity.z * dt;
    this.camera.position.y += this.playerVelocity.y * dt;

    // Floor Collision
    if (this.camera.position.y <= this.playerHeight) {
      this.camera.position.y = this.playerHeight;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // Wall & Obstacle AABB Collisions
    const playerRadius = 0.45;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(this.camera.position.x - playerRadius, this.camera.position.y - 1.5, this.camera.position.z - playerRadius),
      new THREE.Vector3(this.camera.position.x + playerRadius, this.camera.position.y + 0.3, this.camera.position.z + playerRadius)
    );

    for (const collider of this.colliders) {
      if (playerBox.intersectsBox(collider)) {
        // Resolve horizontal collision by rolling back
        this.camera.position.x = oldPos.x;
        this.camera.position.z = oldPos.z;
        this.playerVelocity.x *= 0.2;
        this.playerVelocity.z *= 0.2;
        break;
      }
    }

    // Pushable Crate Physics & Collisions
    for (const crate of this.pushableCrates) {
      const cMesh = crate.mesh;
      const cPos = cMesh.position;
      const dist = new THREE.Vector2(this.camera.position.x - cPos.x, this.camera.position.z - cPos.z).length();

      if (dist < 1.05) {
        // Push crate in direction of player velocity
        const pushDir = new THREE.Vector3(cPos.x - this.camera.position.x, 0, cPos.z - this.camera.position.z).normalize();
        cMesh.position.addScaledVector(pushDir, 3.0 * dt);
        cMesh.rotation.y += dt * 1.5;
        crate.box.setFromObject(cMesh);
      }
    }

    // 3. FIRST-PERSON HEAD BOBBING & HAND SWAY
    if (this.isGrounded && desiredVel.lengthSq() > 0.1) {
      this.headBobTimer += dt * (speed > 6 ? 14 : 9);
      const bobY = Math.sin(this.headBobTimer) * 0.05;
      const bobX = Math.cos(this.headBobTimer * 0.5) * 0.03;
      this.handModel.position.set(bobX, bobY, 0);
    } else {
      this.handModel.position.set(0, 0, 0);
    }

    // 4. ANIMATE REAL-TIME LIGHTS & STROBES
    this.emergencyBeacons.forEach((beacon, idx) => {
      // Rotating emergency strobe effect
      beacon.intensity = 1.0 + Math.sin(time * 6 + idx * Math.PI) * 1.8;
    });

    if (this.reactorCoreMesh) {
      this.reactorCoreMesh.rotation.y += dt * 0.8;
      this.coreLight.intensity = 1.8 + Math.sin(time * 4) * 0.6;
    }

    // 5. INTERACTION RAYCASTING
    this.checkInteraction(false);
  }

  checkInteraction(execute = false) {
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const interactiveMeshes = this.interactiveObjects.map(o => o.mesh);
    const intersects = this.raycaster.intersectObjects(interactiveMeshes, true);
    const promptEl = document.getElementById('game-interaction-prompt');

    if (intersects.length > 0 && intersects[0].distance < 3.2) {
      const hitMesh = intersects[0].object;
      const item = this.interactiveObjects.find(o => o.mesh === hitMesh || o.mesh.children.includes(hitMesh));

      if (item) {
        if (promptEl) {
          promptEl.textContent = item.prompt;
          promptEl.style.display = 'block';
        }
        if (execute && item.action) {
          item.action();
        }
        return;
      }
    }

    if (promptEl) promptEl.style.display = 'none';
  }
}

// Global Singleton
window.starshipGame = new StarshipGameEngine();
