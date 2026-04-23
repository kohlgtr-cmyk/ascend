// ─── AVATAR MODULE ───────────────────────────────────────────────
// 3D RPG-style character with AI photo analysis + body morphing
// Depends on: Three.js (r128), theme.js, store.js

const Avatar = {

  // ── State ─────────────────────────────────────
  scene: null,
  camera: null,
  renderer: null,
  character: null,
  parts: {},
  morphTargets: {},
  animFrame: null,
  autoRotate: true,
  rotationY: 0,

  // Physical profile (updated from UI inputs)
  profile: {
    heightCm: 175,
    weightKg: 75,
    goalWeightKg: 70,
    trainType: 'misto',      // 'forca' | 'cardio' | 'misto'
    waistCm: null,
    armCm: null,
    chestCm: null,
    // From AI photo analysis:
    skinTone: '#c8a882',
    hairColor: '#2c1810',
    hairStyle: 'short',      // 'short' | 'medium' | 'long' | 'bald' | 'curly'
    eyeColor: '#4a3728',
    faceShape: 'oval',       // 'oval' | 'square' | 'round' | 'angular'
    beardStyle: 'none',      // 'none' | 'stubble' | 'full'
  },

  // Body morph weights [0..1]
  morph: {
    muscle: 0.2,    // 0 = slim, 1 = very muscular
    fat: 0.3,       // 0 = lean, 1 = heavy
    height: 0.5,    // normalized 0..1 from height
  },

  // ── Init ──────────────────────────────────────
  init(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Load saved profile
    this._loadProfile();
    this._computeMorphFromProfile();

    // Three.js setup
    this.scene = new THREE.Scene();
    this.scene.background = null;  // transparent

    const w = canvas.clientWidth  || 300;
    const h = canvas.clientHeight || 420;

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    this.camera.position.set(0, 1.6, 3.8);
    this.camera.lookAt(0, 1.0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    this._setupLighting();

    // Build character
    this._buildCharacter();

    // Ground glow
    this._buildGround();

    // Resize observer
    const ro = new ResizeObserver(() => this._onResize(canvas));
    ro.observe(canvas);

    // Touch/mouse drag to rotate
    this._setupInteraction(canvas);

    // Start render loop
    this._animate();
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.parts = {};
  },

  // ── Lighting ──────────────────────────────────
  _setupLighting() {
    const neon = Theme.current?.neon || '#d4a843';

    // Ambient
    const ambient = new THREE.AmbientLight(0x111111, 0.6);
    this.scene.add(ambient);

    // Key light (from front-top)
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2, 5, 3);
    key.castShadow = true;
    key.shadow.mapSize.width  = 1024;
    key.shadow.mapSize.height = 1024;
    this.scene.add(key);

    // Neon rim light (from behind, archetype color)
    const rim = new THREE.PointLight(neon, 2.5, 6);
    rim.position.set(0, 2.5, -2.5);
    this.scene.add(rim);
    this.rimLight = rim;

    // Second neon fill (opposite side)
    const fill = new THREE.PointLight(neon, 1.2, 5);
    fill.position.set(-2, 1, 1);
    this.scene.add(fill);
    this.fillLight = fill;

    // Floor bounce
    const bounce = new THREE.PointLight(0x222222, 0.8, 4);
    bounce.position.set(0, -0.5, 0);
    this.scene.add(bounce);
  },

  updateLighting() {
    const neon = Theme.current?.neon || '#d4a843';
    const c = new THREE.Color(neon);
    if (this.rimLight)  { this.rimLight.color  = c; }
    if (this.fillLight) { this.fillLight.color = c; }
    this._updateArmorColor();
  },

  // ── Character Build ───────────────────────────
  _buildCharacter() {
    if (this.character) {
      this.scene.remove(this.character);
      this.character = null;
      this.parts = {};
    }

    this.character = new THREE.Group();

    const p = this.profile;
    const m = this.morph;

    // Skin material
    const skin = new THREE.MeshStandardMaterial({
      color: new THREE.Color(p.skinTone),
      roughness: 0.75,
      metalness: 0.0,
    });

    // Neon armor material (archetype color)
    const neonColor = Theme.current?.neon || '#d4a843';
    const armor = new THREE.MeshStandardMaterial({
      color: new THREE.Color(neonColor),
      roughness: 0.2,
      metalness: 0.8,
      emissive: new THREE.Color(neonColor),
      emissiveIntensity: 0.3,
    });

    const darkArmor = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a1a2e'),
      roughness: 0.4,
      metalness: 0.9,
      emissive: new THREE.Color(neonColor),
      emissiveIntensity: 0.05,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(p.hairColor),
      roughness: 0.9,
      metalness: 0.0,
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(p.eyeColor),
      roughness: 0.2,
      metalness: 0.1,
      emissive: new THREE.Color(p.eyeColor),
      emissiveIntensity: 0.4,
    });

    this.armorMat     = armor;
    this.darkArmorMat = darkArmor;

    // ─ Proportions from morph ─
    const muscleF  = m.muscle;
    const fatF     = m.fat;
    const heightF  = m.height;   // 0..1

    const baseH    = 0.95 + heightF * 0.25;  // torso scale

    // ── LEGS ──
    const legW = 0.13 + fatF * 0.06 + muscleF * 0.05;
    const legH = 0.55 + heightF * 0.08;

    for (const side of [-1, 1]) {
      // Thigh
      const thigh = this._mesh(
        new THREE.CylinderGeometry(legW * 0.95, legW * 0.85, legH, 12),
        side === -1 ? darkArmor : armor
      );
      thigh.position.set(side * 0.16, legH / 2 + 0.02, 0);
      this.character.add(thigh);

      // Shin
      const shin = this._mesh(
        new THREE.CylinderGeometry(legW * 0.78, legW * 0.65, legH * 0.9, 12),
        darkArmor
      );
      shin.position.set(side * 0.16, legH * 0.9 / 2 - legH - 0.02, 0);
      this.character.add(shin);

      // Boot
      const boot = this._mesh(
        new THREE.BoxGeometry(legW * 1.6, 0.12, legW * 2.2),
        armor
      );
      boot.position.set(side * 0.16, -legH - legH * 0.9 + 0.04, legW * 0.3);
      this.character.add(boot);
    }

    // ── TORSO ──
    const torsoW = 0.28 + fatF * 0.10 + muscleF * 0.08;
    const torsoH = 0.42 * baseH;
    const torso = this._mesh(
      new THREE.BoxGeometry(torsoW * 2, torsoH, torsoW * 1.4),
      darkArmor
    );
    const torsoY = legH * 2 + torsoH / 2 - legH;
    torso.position.set(0, torsoY, 0);
    this.character.add(torso);
    this.parts.torso = torso;

    // Chest plates (armor)
    for (const side of [-1, 1]) {
      const plate = this._mesh(
        new THREE.BoxGeometry(torsoW * 0.85, torsoH * 0.7, 0.05),
        armor
      );
      plate.position.set(side * torsoW * 0.5, torsoY + 0.02, torsoW * 0.71);
      this.character.add(plate);
    }

    // Belly (fat morphing)
    if (fatF > 0.3) {
      const belly = this._mesh(
        new THREE.SphereGeometry(torsoW * 0.7 * fatF, 12, 12),
        darkArmor
      );
      belly.position.set(0, torsoY - torsoH * 0.15, torsoW * 0.5);
      belly.scale.z = 0.6;
      this.character.add(belly);
      this.parts.belly = belly;
    }

    // ── ARMS ──
    const shoulderY = torsoY + torsoH * 0.42;
    const armW = 0.09 + muscleF * 0.06 + fatF * 0.03;
    const armH = 0.38 + heightF * 0.04;

    for (const side of [-1, 1]) {
      const shoulderX = side * (torsoW + armW * 0.9);

      // Upper arm
      const upper = this._mesh(
        new THREE.CylinderGeometry(armW, armW * 0.88, armH, 10),
        side === -1 ? armor : darkArmor
      );
      upper.position.set(shoulderX, shoulderY - armH / 2, 0);
      this.character.add(upper);

      // Forearm
      const fore = this._mesh(
        new THREE.CylinderGeometry(armW * 0.8, armW * 0.65, armH * 0.85, 10),
        skin
      );
      fore.position.set(shoulderX, shoulderY - armH - armH * 0.85 / 2, 0);
      this.character.add(fore);

      // Gauntlet
      const gaunt = this._mesh(
        new THREE.BoxGeometry(armW * 1.8, armW * 1.5, armW * 1.8),
        armor
      );
      gaunt.position.set(shoulderX, shoulderY - armH - armH * 0.85 - armW * 0.6, 0);
      this.character.add(gaunt);

      // Shoulder pad
      const spad = this._mesh(
        new THREE.SphereGeometry(armW * 1.4, 10, 10),
        armor
      );
      spad.scale.y = 0.7;
      spad.position.set(shoulderX, shoulderY + armW * 0.3, 0);
      this.character.add(spad);
    }

    // ── NECK ──
    const neckW = 0.07 + fatF * 0.02;
    const neck = this._mesh(
      new THREE.CylinderGeometry(neckW, neckW * 1.1, 0.12, 8),
      skin
    );
    neck.position.set(0, torsoY + torsoH / 2 + 0.06, 0);
    this.character.add(neck);

    // ── HEAD ──
    const headY = torsoY + torsoH / 2 + 0.24;
    const headW = 0.16 + fatF * 0.02;
    const headH = 0.21;
    const headD = 0.18;

    // Face shape variations
    const faceXScale = p.faceShape === 'square'   ? 1.08
                     : p.faceShape === 'round'    ? 1.05
                     : p.faceShape === 'angular'  ? 0.95
                     : 1.0;

    const head = this._mesh(
      new THREE.SphereGeometry(1, 16, 16),
      skin
    );
    head.scale.set(headW * faceXScale, headH, headD);
    head.position.set(0, headY, 0);
    this.character.add(head);
    this.parts.head = head;

    // Eyes
    for (const side of [-1, 1]) {
      const eye = this._mesh(
        new THREE.SphereGeometry(0.022, 8, 8),
        eyeMat
      );
      eye.position.set(side * headW * 0.38 * faceXScale, headY + 0.02, headD * 0.88);
      this.character.add(eye);

      // Eye glow ring
      const glowMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(neonColor),
        emissive: new THREE.Color(neonColor),
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.5,
      });
      const eyeGlow = this._mesh(
        new THREE.TorusGeometry(0.026, 0.005, 6, 12),
        glowMat
      );
      eyeGlow.position.copy(eye.position);
      eyeGlow.rotation.x = Math.PI / 2;
      this.character.add(eyeGlow);
    }

    // Nose
    const nose = this._mesh(
      new THREE.ConeGeometry(0.018, 0.055, 6),
      skin
    );
    nose.rotation.x = Math.PI * 0.5;
    nose.position.set(0, headY - 0.02, headD * 0.9);
    this.character.add(nose);

    // Mouth line
    const mouthMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#8b4040'), roughness: 1 });
    const mouth = this._mesh(new THREE.BoxGeometry(0.055, 0.01, 0.01), mouthMat);
    mouth.position.set(0, headY - 0.07, headD * 0.89);
    this.character.add(mouth);

    // Ears
    for (const side of [-1, 1]) {
      const ear = this._mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        skin
      );
      ear.scale.z = 0.5;
      ear.position.set(side * headW * faceXScale * 1.02, headY, 0);
      this.character.add(ear);
    }

    // Beard
    if (p.beardStyle !== 'none') {
      const beardH = p.beardStyle === 'full' ? 0.09 : 0.03;
      const beard = this._mesh(
        new THREE.BoxGeometry(headW * 1.4 * faceXScale, beardH, headD * 0.6),
        hairMat
      );
      beard.position.set(0, headY - headH * 0.6, headD * 0.6);
      this.character.add(beard);
    }

    // ── HAIR ──
    this._buildHair(headY, headW, headH, headD, faceXScale, hairMat, neonColor);

    // ── WAIST BELT ──
    const belt = this._mesh(
      new THREE.CylinderGeometry(torsoW * 1.02, torsoW * 1.02, 0.07, 16),
      armor
    );
    belt.position.set(0, torsoY - torsoH * 0.44, 0);
    this.character.add(belt);

    // ── CAPE / CLOAK (thin panel behind) ──
    const capeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(neonColor),
      emissive: new THREE.Color(neonColor),
      emissiveIntensity: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const cape = this._mesh(
      new THREE.PlaneGeometry(torsoW * 1.8, torsoH + legH * 0.9),
      capeMat
    );
    cape.position.set(0, torsoY - legH * 0.1, -torsoW * 0.75);
    this.character.add(cape);

    // Position entire character
    this.character.position.y = legH * 0.9;
    this.character.position.y = 0;

    // Compute bounding box offset so feet rest on ground
    const box = new THREE.Box3().setFromObject(this.character);
    this.character.position.y = -box.min.y + 0.02;

    this.scene.add(this.character);
  },

  _buildHair(headY, headW, headH, headD, faceXScale, mat, neonColor) {
    const style = this.profile.hairStyle;

    if (style === 'bald') return;

    // Highlight strand material
    const strandMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(neonColor),
      emissive: new THREE.Color(neonColor),
      emissiveIntensity: 0.15,
      roughness: 0.8,
    });

    if (style === 'short') {
      // Close-cropped cap
      const cap = this._mesh(
        new THREE.SphereGeometry(1, 14, 14),
        mat
      );
      cap.scale.set(headW * faceXScale * 1.04, headH * 0.62, headD * 1.04);
      cap.position.set(0, headY + headH * 0.28, 0);
      this.character.add(cap);

      // A few highlight streaks
      for (let i = 0; i < 3; i++) {
        const streak = this._mesh(new THREE.BoxGeometry(0.01, headH * 0.25, 0.01), strandMat);
        streak.position.set((i - 1) * 0.04, headY + headH * 0.42, headD * 0.7);
        streak.rotation.x = -0.3;
        this.character.add(streak);
      }
    }

    if (style === 'medium') {
      // Top cap
      const cap = this._mesh(new THREE.SphereGeometry(1, 14, 14), mat);
      cap.scale.set(headW * faceXScale * 1.05, headH * 0.75, headD * 1.05);
      cap.position.set(0, headY + headH * 0.18, 0);
      this.character.add(cap);

      // Side panels
      for (const side of [-1, 1]) {
        const panel = this._mesh(
          new THREE.BoxGeometry(0.04, headH * 0.9, headD * 0.6),
          mat
        );
        panel.position.set(side * headW * faceXScale * 1.0, headY - 0.04, 0);
        this.character.add(panel);
      }
    }

    if (style === 'long') {
      const cap = this._mesh(new THREE.SphereGeometry(1, 14, 14), mat);
      cap.scale.set(headW * faceXScale * 1.05, headH * 0.75, headD * 1.05);
      cap.position.set(0, headY + headH * 0.18, 0);
      this.character.add(cap);

      // Long flowing back panel
      const flow = this._mesh(
        new THREE.BoxGeometry(headW * 1.8 * faceXScale, headH * 2.2, 0.04),
        mat
      );
      flow.position.set(0, headY - headH * 0.9, -headD * 0.6);
      this.character.add(flow);

      // Side flows
      for (const side of [-1, 1]) {
        const sf = this._mesh(new THREE.BoxGeometry(0.05, headH * 1.6, headD * 0.5), mat);
        sf.position.set(side * headW * faceXScale * 1.0, headY - headH * 0.5, 0);
        this.character.add(sf);
      }
    }

    if (style === 'curly') {
      // Base cap
      const cap = this._mesh(new THREE.SphereGeometry(1, 14, 14), mat);
      cap.scale.set(headW * faceXScale * 1.12, headH * 1.1, headD * 1.12);
      cap.position.set(0, headY + headH * 0.15, 0);
      this.character.add(cap);

      // Curly bumps on top
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const r = headW * 0.55;
        const bump = this._mesh(
          new THREE.SphereGeometry(0.04 + Math.random() * 0.015, 8, 8),
          mat
        );
        bump.position.set(
          Math.cos(angle) * r * faceXScale,
          headY + headH * 0.85 + Math.random() * 0.04,
          Math.sin(angle) * r * headD / headW
        );
        this.character.add(bump);
      }
    }
  },

  _buildGround() {
    const neon = Theme.current?.neon || '#d4a843';

    // Glow disc under feet
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(neon),
      emissive: new THREE.Color(neon),
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.18,
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), mat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.005;
    this.scene.add(disc);
    this.groundDisc = disc;

    // Outer ring
    const ringMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(neon),
      emissive: new THREE.Color(neon),
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.012, 6, 48), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.008;
    this.scene.add(ring);
    this.groundRing = ring;
  },

  // ── Mesh helper ───────────────────────────────
  _mesh(geo, mat) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow    = true;
    m.receiveShadow = true;
    return m;
  },

  // ── Update armor color ─────────────────────────
  _updateArmorColor() {
    if (!this.character) return;
    const neon = Theme.current?.neon || '#d4a843';
    const c = new THREE.Color(neon);
    if (this.armorMat) {
      this.armorMat.color   = c;
      this.armorMat.emissive = c;
    }
    // Update ground disc/ring
    if (this.groundDisc) {
      this.groundDisc.material.color   = c;
      this.groundDisc.material.emissive = c;
    }
    if (this.groundRing) {
      this.groundRing.material.color   = c;
      this.groundRing.material.emissive = c;
    }
  },

  // ── Animate ───────────────────────────────────
  _animate() {
    this.animFrame = requestAnimationFrame(() => this._animate());
    if (!this.renderer || !this.scene) return;

    const t = Date.now() * 0.001;

    // Idle float
    if (this.character) {
      this.character.position.y = Math.sin(t * 1.1) * 0.018;
      if (this.autoRotate) {
        this.character.rotation.y += 0.004;
      }
    }

    // Rim light pulse
    if (this.rimLight) {
      this.rimLight.intensity = 2.2 + Math.sin(t * 2.0) * 0.4;
    }

    // Ground ring pulse
    if (this.groundRing) {
      this.groundRing.material.opacity = 0.3 + Math.sin(t * 2.0) * 0.15;
    }

    this.renderer.render(this.scene, this.camera);
  },

  // ── Interaction ───────────────────────────────
  _setupInteraction(canvas) {
    let dragging = false, lastX = 0;

    const start = (x) => { dragging = true; lastX = x; this.autoRotate = false; };
    const move  = (x) => {
      if (!dragging || !this.character) return;
      this.character.rotation.y += (x - lastX) * 0.012;
      lastX = x;
    };
    const end   = () => { dragging = false; setTimeout(() => { this.autoRotate = true; }, 2500); };

    canvas.addEventListener('mousedown',  (e) => start(e.clientX));
    canvas.addEventListener('mousemove',  (e) => move(e.clientX));
    canvas.addEventListener('mouseup',    end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', (e) => start(e.touches[0].clientX), { passive: true });
    canvas.addEventListener('touchmove',  (e) => move(e.touches[0].clientX),  { passive: true });
    canvas.addEventListener('touchend',   end);
  },

  // ── Resize ────────────────────────────────────
  _onResize(canvas) {
    if (!this.renderer || !this.camera) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  },

  // ── Morph computation ─────────────────────────
  _computeMorphFromProfile() {
    const p = this.profile;

    // BMI-based fat morph
    const heightM = p.heightCm / 100;
    const bmi = p.weightKg / (heightM * heightM);
    this.morph.fat = Math.max(0, Math.min(1, (bmi - 18) / 22));

    // Muscle from train type + completion count
    const completions = Store.get()?.completions?.length || 0;
    const baseMusc = Math.min(0.6, completions / 120);
    this.morph.muscle = p.trainType === 'forca' ? Math.min(1, baseMusc * 1.6)
                      : p.trainType === 'cardio' ? baseMusc * 0.5
                      : baseMusc;

    // Waist measurement adjusts fat
    if (p.waistCm) {
      const waistNorm = Math.max(0, (p.waistCm - 60) / 60);
      this.morph.fat = (this.morph.fat + waistNorm) / 2;
    }

    // Height normalization
    this.morph.height = Math.max(0, Math.min(1, (p.heightCm - 150) / 60));
  },

  // Rebuild character after profile update
  rebuildCharacter() {
    this._computeMorphFromProfile();
    this._buildCharacter();
    this._buildGround();
  },

  // ── Profile persistence ───────────────────────
  _loadProfile() {
    try {
      const raw = localStorage.getItem('ascend_avatar_profile');
      if (raw) {
        const saved = JSON.parse(raw);
        this.profile = { ...this.profile, ...saved };
      }
    } catch(e) {}
  },

  saveProfile() {
    localStorage.setItem('ascend_avatar_profile', JSON.stringify(this.profile));
  },

  // ── AI Photo Analysis ─────────────────────────
  async analyzePhoto(imageBase64, mimeType = 'image/jpeg') {
    const statusEl = document.getElementById('avatar-ai-status');
    if (statusEl) statusEl.textContent = 'Analisando sua foto com IA...';

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType, data: imageBase64 },
              },
              {
                type: 'text',
                text: `Analyze this person's photo and extract physical appearance details for creating a 3D game avatar. 
Return ONLY valid JSON (no markdown, no explanation) with these exact fields:
{
  "skinTone": "<hex color that best matches their skin, e.g. #c8a070>",
  "hairColor": "<hex color of their hair>",
  "hairStyle": "<one of: short, medium, long, bald, curly>",
  "eyeColor": "<hex color>",
  "faceShape": "<one of: oval, square, round, angular>",
  "beardStyle": "<one of: none, stubble, full>",
  "estimatedBodyType": "<one of: slim, average, athletic, heavy>"
}
Be precise with hex colors. If face is not clearly visible, use reasonable defaults.`,
              },
            ],
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '{}';

      // Strip markdown fences if any
      const clean = text.replace(/```json|```/g, '').trim();
      const result = JSON.parse(clean);

      // Apply to profile
      if (result.skinTone)   this.profile.skinTone   = result.skinTone;
      if (result.hairColor)  this.profile.hairColor  = result.hairColor;
      if (result.hairStyle)  this.profile.hairStyle  = result.hairStyle;
      if (result.eyeColor)   this.profile.eyeColor   = result.eyeColor;
      if (result.faceShape)  this.profile.faceShape  = result.faceShape;
      if (result.beardStyle) this.profile.beardStyle = result.beardStyle;

      // Map body type to initial morph hints
      if (result.estimatedBodyType === 'heavy')    this.profile.weightKg = Math.max(this.profile.weightKg, 95);
      if (result.estimatedBodyType === 'slim')     this.profile.weightKg = Math.min(this.profile.weightKg, 65);
      if (result.estimatedBodyType === 'athletic') this.morph.muscle = Math.max(this.morph.muscle, 0.5);

      this.saveProfile();
      this.rebuildCharacter();

      if (statusEl) statusEl.textContent = 'Avatar gerado com sucesso! ✦';
      setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);

      return result;

    } catch (err) {
      console.error('Avatar AI error:', err);
      if (statusEl) statusEl.textContent = 'Erro na análise. Usando configurações padrão.';
      setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
      this.rebuildCharacter();
    }
  },

  // ── Periodic evolution (called after mission complete) ─────────
  evolveFromCompletion(missionType, stat) {
    const p = this.profile;

    // Muscle growth for strength missions
    if (stat === 'strength' || p.trainType === 'forca') {
      this.morph.muscle = Math.min(1, this.morph.muscle + 0.008);
    }

    // Fat reduction for cardio missions
    if (p.trainType === 'cardio') {
      this.morph.fat = Math.max(0, this.morph.fat - 0.005);
    }

    // Mixed: slight muscle + slight fat reduction
    if (p.trainType === 'misto') {
      this.morph.muscle = Math.min(1, this.morph.muscle + 0.004);
      this.morph.fat    = Math.max(0, this.morph.fat    - 0.003);
    }

    // Rebuild every 5 completions to avoid rebuild spam
    const count = Store.get()?.completions?.length || 0;
    if (count % 5 === 0) this.rebuildCharacter();
  },

  // ── Update weight (called from UI) ────────────
  updateWeight(newWeightKg) {
    this.profile.weightKg = newWeightKg;
    this.saveProfile();
    this.rebuildCharacter();
  },
};
