/**
 * 🫀 Interactive 3D Human Anatomy Viewer (Three.js r128)
 * رحلة أعضاء الجسم الداخلية - المجسم التشريحي ثلاثي الأبعاد التفاعلي
 * 
 * High-performance, crash-proof, fully responsive WebGL human anatomy model.
 */

class Body3DViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Scene Groups
    this.bodyGroup = new THREE.Group();
    this.organsGroup = new THREE.Group();
    this.skeletonGroup = new THREE.Group();
    this.effectsGroup = new THREE.Group();

    // Organs registry
    this.organs = {};
    this.raycastMeshes = [];
    this.selectedOrgan = null;
    this.hoveredOrgan = null;

    // Animation & Config States
    this.pulseEnabled = true;
    this.autoRotateEnabled = true;
    this.opacityIndex = 0;
    this.opacityLevels = [
      { name: 'شفافية تشريحية (35%)', val: 0.35, wire: 0.08, mode: 'xray' },
      { name: 'زجاجي فائق (15%)', val: 0.15, wire: 0.05, mode: 'glass' },
      { name: 'عزل الأعضاء (إخفاء الهيكل)', val: 0.0, wire: 0.0, mode: 'hidden' },
      { name: 'مجسم طبي صلب (85%)', val: 0.85, wire: 0.15, mode: 'solid' }
    ];

    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.isDragging = false;
    this.pointerDownPos = { x: 0, y: 0 };

    // Camera animation state
    this.cameraTarget = {
      pos: new THREE.Vector3(2.0, 4.2, 14.5),
      lookAt: new THREE.Vector3(0, 3.8, 0),
      active: false,
      progress: 0,
      duration: 1.2,
      startPos: new THREE.Vector3(),
      startLookAt: new THREE.Vector3()
    };

    // Highlight ring / beacon
    this.beaconMesh = null;

    this.init();
  }

  init() {
    this.setupScene();
    if (!this.renderer) {
      this.renderFallback();
      this.setupDOMBindings();
      return;
    }

    try {
      this.setupLights();
      this.buildPedestal();
      this.buildHumanSilhouette();
      this.buildInternalOrgans();
      this.buildHighlightBeacon();
      this.setupControls();
      this.setupEventListeners();
      this.setupDOMBindings();

      if (this.camera) {
        this.camera.lookAt(0, 3.8, 0);
      }

      this.onWindowResize();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      this.animate();

      setTimeout(() => this.onWindowResize(), 100);
      setTimeout(() => this.onWindowResize(), 350);
      setTimeout(() => this.onWindowResize(), 800);
    } catch (err) {
      console.warn('3D initialization failed, falling back to interactive SVG:', err);
      this.renderFallback();
      this.setupDOMBindings();
    }
  }

  renderFallback() {
    this.container.innerHTML = `
      <div class="fallback-anatomy-stage" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;background:radial-gradient(circle at 50% 50%, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%);padding:20px;box-sizing:border-box;">
        <svg viewBox="0 0 400 680" style="max-height:92%;width:auto;filter:drop-shadow(0 10px 20px rgba(2, 132, 199, 0.15));" dir="ltr">
          <!-- Holographic Pedestal -->
          <ellipse cx="200" cy="640" rx="140" ry="26" fill="none" stroke="#38bdf8" stroke-width="2.5" opacity="0.6"/>
          <ellipse cx="200" cy="640" rx="90" ry="16" fill="none" stroke="#0284c7" stroke-width="1.8" opacity="0.4"/>
          
          <!-- Human Body Silhouette -->
          <!-- Head -->
          <ellipse cx="200" cy="85" rx="42" ry="52" fill="#bae6fd" fill-opacity="0.3" stroke="#38bdf8" stroke-width="2"/>
          <!-- Neck -->
          <rect x="186" y="132" width="28" height="26" rx="6" fill="#bae6fd" fill-opacity="0.3" stroke="#38bdf8" stroke-width="2"/>
          <!-- Torso -->
          <path d="M 140 160 C 130 200, 145 280, 160 320 C 150 350, 145 380, 155 410 L 245 410 C 255 380, 250 350, 240 320 C 255 280, 270 200, 260 160 Z" fill="#bae6fd" fill-opacity="0.25" stroke="#38bdf8" stroke-width="2"/>
          <!-- Arms -->
          <path d="M 140 165 C 110 220, 95 300, 85 370" fill="none" stroke="#38bdf8" stroke-width="12" stroke-linecap="round" opacity="0.3"/>
          <path d="M 260 165 C 290 220, 305 300, 315 370" fill="none" stroke="#38bdf8" stroke-width="12" stroke-linecap="round" opacity="0.3"/>
          <!-- Legs -->
          <path d="M 172 410 C 170 470, 165 540, 160 630" fill="none" stroke="#38bdf8" stroke-width="22" stroke-linecap="round" opacity="0.28"/>
          <path d="M 228 410 C 230 470, 235 540, 240 630" fill="none" stroke="#38bdf8" stroke-width="22" stroke-linecap="round" opacity="0.28"/>

          <!-- Interactive 6 Organs with Glowing Rings and Click Actions -->
          <!-- 1. Brain -->
          <g class="fallback-organ-node" data-organ="brain" style="cursor:pointer;" transform="translate(200, 80)">
            <circle r="26" fill="#8b5cf6" fill-opacity="0.35" stroke="#a855f7" stroke-width="3">
              <animate attributeName="r" values="24;28;24" dur="1.8s" repeatCount="indefinite"/>
            </circle>
            <text text-anchor="middle" dominant-baseline="central" font-size="22">🧠</text>
          </g>

          <!-- 2. Eyes -->
          <g class="fallback-organ-node" data-organ="eye" style="cursor:pointer;" transform="translate(200, 96)">
            <circle r="14" fill="#0284c7" fill-opacity="0.4" stroke="#38bdf8" stroke-width="2"/>
            <text text-anchor="middle" dominant-baseline="central" font-size="14">👁️</text>
          </g>

          <!-- 3. Esophagus -->
          <g class="fallback-organ-node" data-organ="esophagus" style="cursor:pointer;" transform="translate(200, 185)">
            <line x1="0" y1="-25" x2="0" y2="35" stroke="#f97316" stroke-width="6" stroke-linecap="round" stroke-dasharray="4,3"/>
            <circle cx="0" cy="5" r="16" fill="#f97316" fill-opacity="0.4" stroke="#ea580c" stroke-width="2"/>
            <text text-anchor="middle" dominant-baseline="central" y="5" font-size="15">🥢</text>
          </g>

          <!-- 4. Lungs -->
          <g class="fallback-organ-node" data-organ="lungs" style="cursor:pointer;" transform="translate(170, 215)">
            <circle r="26" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-width="2.5">
              <animate attributeName="r" values="24;29;24" dur="2.4s" repeatCount="indefinite"/>
            </circle>
            <text text-anchor="middle" dominant-baseline="central" font-size="22">🫁</text>
          </g>
          <g class="fallback-organ-node" data-organ="lungs" style="cursor:pointer;" transform="translate(230, 215)">
            <circle r="26" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-width="2.5">
              <animate attributeName="r" values="24;29;24" dur="2.4s" repeatCount="indefinite"/>
            </circle>
            <text text-anchor="middle" dominant-baseline="central" font-size="22">🫁</text>
          </g>

          <!-- 5. Heart -->
          <g class="fallback-organ-node" data-organ="heart" style="cursor:pointer;" transform="translate(200, 235)">
            <circle r="24" fill="#ef4444" fill-opacity="0.4" stroke="#dc2626" stroke-width="3">
              <animate attributeName="r" values="22;27;22" dur="0.85s" repeatCount="indefinite"/>
            </circle>
            <text text-anchor="middle" dominant-baseline="central" font-size="22">🫀</text>
          </g>

          <!-- 6. Stomach -->
          <g class="fallback-organ-node" data-organ="stomach" style="cursor:pointer;" transform="translate(195, 305)">
            <circle r="24" fill="#10b981" fill-opacity="0.35" stroke="#059669" stroke-width="2.5">
              <animate attributeName="r" values="22;26;22" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text text-anchor="middle" dominant-baseline="central" font-size="22">🥗</text>
          </g>
        </svg>
      </div>
    `;

    this.container.querySelectorAll('.fallback-organ-node').forEach(node => {
      node.addEventListener('click', () => {
        const organId = node.getAttribute('data-organ');
        this.selectOrgan(organId);
      });
    });
  }

  setupScene() {
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 560;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(2.0, 4.2, 14.5);

    // Create canvas explicitly
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'default'
      });
      const gl = this.renderer.getContext();
      if (!gl) throw new Error('No WebGL Context');
    } catch (e1) {
      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          antialias: false,
          alpha: true
        });
        const gl2 = this.renderer.getContext();
        if (!gl2) throw new Error('No fallback WebGL Context');
      } catch (e2) {
        console.warn('WebGL Renderer creation failed, falling back:', e2);
        this.renderer = null;
        return;
      }
    }

    this.container.appendChild(canvas);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene.add(this.bodyGroup);
    this.scene.add(this.organsGroup);
    this.scene.add(this.skeletonGroup);
    this.scene.add(this.effectsGroup);
  }

  setupLights() {
    // Optimal 3-point light setup (Low uniform count, universally compatible)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.92);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(5, 10, 8);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    rimLight.position.set(-5, 6, -7);
    this.scene.add(rimLight);
  }

  buildPedestal() {
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.y = -6.0;

    // Glowing Concentric Medical Scanner Rings
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const ringGeo1 = new THREE.RingGeometry(2.4, 2.48, 64);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    pedestalGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const ringGeo2 = new THREE.RingGeometry(1.6, 1.65, 48);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 2;
    pedestalGroup.add(ring2);

    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const ringGeo3 = new THREE.CircleGeometry(3.2, 48);
    const disc = new THREE.Mesh(ringGeo3, ringMat3);
    disc.rotation.x = Math.PI / 2;
    disc.position.y = -0.02;
    pedestalGroup.add(disc);

    // Glowing holographic ticks on outer circle
    const tickCount = 24;
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.6 });
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const tickGeo = new THREE.PlaneGeometry(0.08, 0.25);
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.rotation.x = Math.PI / 2;
      tick.rotation.z = angle;
      tick.position.set(Math.cos(angle) * 2.58, 0, Math.sin(angle) * 2.58);
      pedestalGroup.add(tick);
    }

    this.effectsGroup.add(pedestalGroup);
    this.pedestalGroup = pedestalGroup;
  }

  buildHumanSilhouette() {
    this.bodyShellMaterial = new THREE.MeshPhongMaterial({
      color: 0x7dd3fc,
      specular: 0xffffff,
      shininess: 80,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.bodyWireMaterial = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      depthWrite: false
    });

    const addBodyPart = (geo, pos, rot, scale) => {
      const mesh = new THREE.Mesh(geo, this.bodyShellMaterial);
      if (pos) mesh.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
      if (rot) mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
      if (scale) mesh.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
      this.bodyGroup.add(mesh);

      const wireMesh = new THREE.Mesh(geo, this.bodyWireMaterial);
      if (pos) wireMesh.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
      if (rot) wireMesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
      if (scale) wireMesh.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
      this.bodyGroup.add(wireMesh);
      return mesh;
    };

    // 1. Head & Cranium
    const headGeo = new THREE.SphereGeometry(0.92, 32, 28);
    addBodyPart(headGeo, { x: 0, y: 7.42, z: 0.1 }, null, { x: 0.88, y: 1.08, z: 0.98 });

    const chinGeo = new THREE.CylinderGeometry(0.48, 0.32, 0.6, 18);
    addBodyPart(chinGeo, { x: 0, y: 6.85, z: 0.35 }, { x: 0.2, y: 0, z: 0 });

    // 2. Neck
    const neckGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.85, 20);
    addBodyPart(neckGeo, { x: 0, y: 6.35, z: 0.05 });

    // 3. Torso
    const chestGeo = new THREE.CylinderGeometry(1.35, 1.1, 1.8, 28);
    addBodyPart(chestGeo, { x: 0, y: 4.85, z: 0.08 }, null, { x: 1.18, y: 1, z: 0.82 });

    const abdomenGeo = new THREE.CylinderGeometry(1.1, 0.98, 1.4, 26);
    addBodyPart(abdomenGeo, { x: 0, y: 3.35, z: 0.05 }, null, { x: 1.1, y: 1, z: 0.78 });

    // 4. Pelvis
    const pelvisGeo = new THREE.CylinderGeometry(0.98, 1.15, 1.5, 26);
    addBodyPart(pelvisGeo, { x: 0, y: 1.95, z: 0.02 }, null, { x: 1.12, y: 1, z: 0.82 });

    // 5. Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.52, 20, 20);
    addBodyPart(shoulderGeo, { x: -1.72, y: 5.45, z: 0.02 }, null, { x: 1, y: 0.85, z: 0.9 });
    addBodyPart(shoulderGeo, { x: 1.72, y: 5.45, z: 0.02 }, null, { x: 1, y: 0.85, z: 0.9 });

    // 6. Arms
    const armUpperGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.7, 18);
    addBodyPart(armUpperGeo, { x: -1.95, y: 4.25, z: 0.02 }, { x: 0, y: 0, z: 0.12 });
    const armForeGeo = new THREE.CylinderGeometry(0.3, 0.22, 1.6, 18);
    addBodyPart(armForeGeo, { x: -2.18, y: 2.65, z: 0.05 }, { x: 0, y: 0, z: 0.14 });
    const handGeo = new THREE.SphereGeometry(0.24, 16, 16);
    addBodyPart(handGeo, { x: -2.35, y: 1.65, z: 0.08 }, null, { x: 0.7, y: 1.3, z: 0.5 });

    addBodyPart(armUpperGeo, { x: 1.95, y: 4.25, z: 0.02 }, { x: 0, y: 0, z: -0.12 });
    addBodyPart(armForeGeo, { x: 2.18, y: 2.65, z: 0.05 }, { x: 0, y: 0, z: -0.14 });
    addBodyPart(handGeo, { x: 2.35, y: 1.65, z: 0.08 }, null, { x: 0.7, y: 1.3, z: 0.5 });

    // 7. Legs
    const thighGeo = new THREE.CylinderGeometry(0.55, 0.42, 2.8, 20);
    addBodyPart(thighGeo, { x: -0.65, y: -0.15, z: 0.02 }, { x: -0.02, y: 0, z: 0.04 });
    addBodyPart(thighGeo, { x: 0.65, y: -0.15, z: 0.02 }, { x: -0.02, y: 0, z: -0.04 });

    const kneeGeo = new THREE.SphereGeometry(0.38, 18, 18);
    addBodyPart(kneeGeo, { x: -0.68, y: -1.65, z: 0.06 });
    addBodyPart(kneeGeo, { x: 0.68, y: -1.65, z: 0.06 });

    const calfGeo = new THREE.CylinderGeometry(0.42, 0.32, 3.4, 20);
    addBodyPart(calfGeo, { x: -0.72, y: -3.45, z: 0.02 }, { x: 0.02, y: 0, z: 0.02 });
    addBodyPart(calfGeo, { x: 0.72, y: -3.45, z: 0.02 }, { x: 0.02, y: 0, z: -0.02 });

    const footGeo = new THREE.BoxGeometry(0.55, 0.35, 1.15);
    addBodyPart(footGeo, { x: -0.78, y: -5.35, z: 0.28 }, { x: 0.06, y: 0, z: 0 });
    addBodyPart(footGeo, { x: 0.78, y: -5.35, z: 0.28 }, { x: 0.06, y: 0, z: 0 });

    this.buildVertebralColumn();
    this.buildRibCage();
  }

  buildVertebralColumn() {
    const spineMat = new THREE.MeshPhongMaterial({
      color: 0x94a3b8,
      specular: 0xffffff,
      shininess: 60,
      transparent: true,
      opacity: 0.45
    });

    const vertebraeCount = 16;
    for (let i = 0; i < vertebraeCount; i++) {
      const y = 6.4 - (i * 0.32);
      const z = -0.32 + Math.sin(i / vertebraeCount * Math.PI) * 0.12;
      const vGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.16, 16);
      const vMesh = new THREE.Mesh(vGeo, spineMat);
      vMesh.position.set(0, y, z);
      this.skeletonGroup.add(vMesh);
    }
  }

  buildRibCage() {
    const ribMat = new THREE.MeshPhongMaterial({
      color: 0x93c5fd,
      specular: 0xffffff,
      shininess: 50,
      transparent: true,
      opacity: 0.38
    });

    for (let i = 0; i < 8; i++) {
      const y = 5.4 - (i * 0.28);
      const radius = 1.05 - (i * 0.04);
      const tubeRadius = 0.042;
      
      const ribGeoRight = new THREE.TorusGeometry(radius, tubeRadius, 8, 24, Math.PI * 0.58);
      const ribRight = new THREE.Mesh(ribGeoRight, ribMat);
      ribRight.position.set(0.12, y, 0.05);
      ribRight.rotation.x = Math.PI * 0.55;
      ribRight.rotation.y = 0.2;
      ribRight.rotation.z = -Math.PI * 0.28;
      this.skeletonGroup.add(ribRight);

      const ribGeoLeft = new THREE.TorusGeometry(radius, tubeRadius, 8, 24, Math.PI * 0.58);
      const ribLeft = new THREE.Mesh(ribGeoLeft, ribMat);
      ribLeft.position.set(-0.12, y, 0.05);
      ribLeft.rotation.x = Math.PI * 0.55;
      ribLeft.rotation.y = -0.2;
      ribLeft.rotation.z = Math.PI * 0.70;
      this.skeletonGroup.add(ribLeft);
    }
  }

  buildInternalOrgans() {
    this.buildHeart();
    this.buildLungs();
    this.buildBrain();
    this.buildStomach();
    this.buildEsophagus();
    this.buildEyes();
  }

  buildHeart() {
    const heartGroup = new THREE.Group();
    heartGroup.position.set(-0.28, 4.42, 0.42);

    const heartMat = new THREE.MeshPhongMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.5,
      specular: 0xffffff,
      shininess: 95
    });

    const ventricleGeo = new THREE.ConeGeometry(0.48, 0.85, 20);
    const ventricles = new THREE.Mesh(ventricleGeo, heartMat);
    ventricles.rotation.z = Math.PI - 0.25;
    ventricles.rotation.x = 0.18;
    heartGroup.add(ventricles);

    const atriaGeo = new THREE.SphereGeometry(0.35, 18, 18);
    const leftAtrium = new THREE.Mesh(atriaGeo, heartMat);
    leftAtrium.position.set(-0.2, 0.36, -0.05);
    heartGroup.add(leftAtrium);

    const rightAtrium = new THREE.Mesh(atriaGeo, heartMat);
    rightAtrium.position.set(0.22, 0.34, 0.05);
    heartGroup.add(rightAtrium);

    const aortaMat = new THREE.MeshPhongMaterial({ color: 0xdc2626, shininess: 80 });
    const aortaGeo = new THREE.TorusGeometry(0.24, 0.08, 12, 24, Math.PI * 0.95);
    const aorta = new THREE.Mesh(aortaGeo, aortaMat);
    aorta.position.set(0.04, 0.52, -0.08);
    aorta.rotation.y = 0.4;
    aorta.rotation.z = -0.3;
    heartGroup.add(aorta);

    const paMat = new THREE.MeshPhongMaterial({ color: 0x0284c7, shininess: 80 });
    const paGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.45, 14);
    const pa = new THREE.Mesh(paGeo, paMat);
    pa.position.set(-0.06, 0.46, 0.12);
    pa.rotation.z = 0.4;
    pa.rotation.x = 0.25;
    heartGroup.add(pa);

    ventricles.userData = { organId: 'heart', group: heartGroup, name: 'القلب' };
    leftAtrium.userData = { organId: 'heart', group: heartGroup, name: 'القلب' };
    rightAtrium.userData = { organId: 'heart', group: heartGroup, name: 'القلب' };
    this.raycastMeshes.push(ventricles, leftAtrium, rightAtrium);

    this.organs.heart = {
      id: 'heart',
      name: 'القلب',
      group: heartGroup,
      baseMat: heartMat,
      focusPos: new THREE.Vector3(-0.28, 4.42, 4.2),
      targetPos: new THREE.Vector3(-0.28, 4.42, 0.42),
      scale: 1.0
    };

    this.organsGroup.add(heartGroup);
  }

  buildLungs() {
    const lungsGroup = new THREE.Group();
    lungsGroup.position.set(0, 4.55, 0.12);

    const lungMat = new THREE.MeshPhongMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.45,
      specular: 0xffffff,
      shininess: 70,
      transparent: true,
      opacity: 0.92
    });

    const tracheaMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, shininess: 80 });
    const tracheaGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.1, 16);
    const trachea = new THREE.Mesh(tracheaGeo, tracheaMat);
    trachea.position.set(0, 0.85, 0.05);
    lungsGroup.add(trachea);

    // Right Lung (3 Lobes)
    const rightLungGroup = new THREE.Group();
    rightLungGroup.position.set(0.82, -0.05, 0);

    const lobeGeo = new THREE.SphereGeometry(0.48, 20, 20);
    const rSuperior = new THREE.Mesh(lobeGeo, lungMat);
    rSuperior.position.set(0, 0.45, 0);
    rSuperior.scale.set(0.85, 1.15, 0.9);
    rightLungGroup.add(rSuperior);

    const rMiddle = new THREE.Mesh(lobeGeo, lungMat);
    rMiddle.position.set(0.08, -0.05, 0.08);
    rMiddle.scale.set(0.9, 0.9, 0.85);
    rightLungGroup.add(rMiddle);

    const rInferior = new THREE.Mesh(lobeGeo, lungMat);
    rInferior.position.set(0.04, -0.55, -0.04);
    rInferior.scale.set(0.95, 1.1, 0.95);
    rightLungGroup.add(rInferior);

    lungsGroup.add(rightLungGroup);

    // Left Lung (2 Lobes)
    const leftLungGroup = new THREE.Group();
    leftLungGroup.position.set(-0.84, -0.08, 0);

    const lSuperior = new THREE.Mesh(lobeGeo, lungMat);
    lSuperior.position.set(0, 0.42, 0);
    lSuperior.scale.set(0.82, 1.12, 0.88);
    leftLungGroup.add(lSuperior);

    const lInferior = new THREE.Mesh(lobeGeo, lungMat);
    lInferior.position.set(-0.06, -0.48, -0.02);
    lInferior.scale.set(0.88, 1.05, 0.88);
    leftLungGroup.add(lInferior);

    lungsGroup.add(leftLungGroup);

    [rSuperior, rMiddle, rInferior, lSuperior, lInferior].forEach(mesh => {
      mesh.userData = { organId: 'lungs', group: lungsGroup, name: 'الرئتان' };
      this.raycastMeshes.push(mesh);
    });

    this.organs.lungs = {
      id: 'lungs',
      name: 'الرئتان',
      group: lungsGroup,
      leftLung: leftLungGroup,
      rightLung: rightLungGroup,
      baseMat: lungMat,
      focusPos: new THREE.Vector3(0, 4.55, 4.5),
      targetPos: new THREE.Vector3(0, 4.55, 0.12),
      scale: 1.0
    };

    this.organsGroup.add(lungsGroup);
  }

  buildBrain() {
    const brainGroup = new THREE.Group();
    brainGroup.position.set(0, 7.38, 0.12);

    const brainMat = new THREE.MeshPhongMaterial({
      color: 0x8b5cf6,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.5,
      specular: 0xffffff,
      shininess: 90
    });

    const hemiGeo = new THREE.SphereGeometry(0.52, 24, 22);
    const leftHemi = new THREE.Mesh(hemiGeo, brainMat);
    leftHemi.position.set(-0.25, 0.12, 0);
    leftHemi.scale.set(0.85, 0.95, 1.25);
    brainGroup.add(leftHemi);

    const rightHemi = new THREE.Mesh(hemiGeo, brainMat);
    rightHemi.position.set(0.25, 0.12, 0);
    rightHemi.scale.set(0.85, 0.95, 1.25);
    brainGroup.add(rightHemi);

    const cerebMat = new THREE.MeshPhongMaterial({ color: 0x7c3aed, emissive: 0x5b21b6, shininess: 70 });
    const cerebGeo = new THREE.SphereGeometry(0.32, 18, 16);
    const cerebellum = new THREE.Mesh(cerebGeo, cerebMat);
    cerebellum.position.set(0, -0.32, -0.32);
    cerebellum.scale.set(1.2, 0.7, 0.85);
    brainGroup.add(cerebellum);

    const stemGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.6, 16);
    const brainStem = new THREE.Mesh(stemGeo, cerebMat);
    brainStem.position.set(0, -0.58, -0.15);
    brainGroup.add(brainStem);

    [leftHemi, rightHemi, cerebellum].forEach(mesh => {
      mesh.userData = { organId: 'brain', group: brainGroup, name: 'الدماغ' };
      this.raycastMeshes.push(mesh);
    });

    this.organs.brain = {
      id: 'brain',
      name: 'الدماغ',
      group: brainGroup,
      baseMat: brainMat,
      focusPos: new THREE.Vector3(0, 7.38, 3.6),
      targetPos: new THREE.Vector3(0, 7.38, 0.12),
      scale: 1.0
    };

    this.organsGroup.add(brainGroup);
  }

  buildStomach() {
    const stomachGroup = new THREE.Group();
    stomachGroup.position.set(-0.52, 3.25, 0.35);

    const stomachMat = new THREE.MeshPhongMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.45,
      specular: 0xffffff,
      shininess: 85
    });

    const fundusGeo = new THREE.SphereGeometry(0.42, 20, 20);
    const fundus = new THREE.Mesh(fundusGeo, stomachMat);
    fundus.position.set(-0.15, 0.38, 0.04);
    fundus.scale.set(0.9, 1.05, 0.85);
    stomachGroup.add(fundus);

    const bodyGeo = new THREE.CylinderGeometry(0.42, 0.34, 0.85, 20);
    const body = new THREE.Mesh(bodyGeo, stomachMat);
    body.position.set(0, 0.05, 0);
    body.rotation.z = -0.35;
    body.scale.set(1.15, 1, 0.85);
    stomachGroup.add(body);

    const antrumGeo = new THREE.SphereGeometry(0.32, 18, 18);
    const antrum = new THREE.Mesh(antrumGeo, stomachMat);
    antrum.position.set(0.32, -0.28, 0.08);
    antrum.scale.set(1.1, 0.85, 0.85);
    stomachGroup.add(antrum);

    [fundus, body, antrum].forEach(mesh => {
      mesh.userData = { organId: 'stomach', group: stomachGroup, name: 'المعدة' };
      this.raycastMeshes.push(mesh);
    });

    this.organs.stomach = {
      id: 'stomach',
      name: 'المعدة',
      group: stomachGroup,
      baseMat: stomachMat,
      focusPos: new THREE.Vector3(-0.52, 3.25, 4.0),
      targetPos: new THREE.Vector3(-0.52, 3.25, 0.35),
      scale: 1.0
    };

    this.organsGroup.add(stomachGroup);
  }

  buildEsophagus() {
    const esoGroup = new THREE.Group();

    const esoMat = new THREE.MeshPhongMaterial({
      color: 0xf97316,
      emissive: 0xc2410c,
      emissiveIntensity: 0.5,
      specular: 0xffffff,
      shininess: 85
    });

    const curvePoints = [
      new THREE.Vector3(0, 6.25, 0.22),
      new THREE.Vector3(0, 5.4, 0.05),
      new THREE.Vector3(-0.04, 4.4, -0.08),
      new THREE.Vector3(-0.24, 3.65, 0.18),
      new THREE.Vector3(-0.48, 3.42, 0.32)
    ];
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.11, 14, false);
    const tube = new THREE.Mesh(tubeGeo, esoMat);
    esoGroup.add(tube);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfdba74, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 9; i++) {
      const t = 0.1 + (i / 9) * 0.8;
      const pt = curve.getPoint(t);
      const ringGeo = new THREE.TorusGeometry(0.12, 0.024, 8, 16);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pt);
      ring.rotation.x = Math.PI / 2;
      esoGroup.add(ring);
    }

    tube.userData = { organId: 'esophagus', group: esoGroup, name: 'المريء' };
    this.raycastMeshes.push(tube);

    this.organs.esophagus = {
      id: 'esophagus',
      name: 'المريء',
      group: esoGroup,
      curve: curve,
      baseMat: esoMat,
      focusPos: new THREE.Vector3(0, 4.8, 4.2),
      targetPos: new THREE.Vector3(-0.1, 4.8, 0.1),
      scale: 1.0
    };

    this.organsGroup.add(esoGroup);
  }

  buildEyes() {
    const eyesGroup = new THREE.Group();
    eyesGroup.position.set(0, 7.42, 0.86);

    const scleraMat = new THREE.MeshPhongMaterial({
      color: 0xf8fafc,
      specular: 0xffffff,
      shininess: 100
    });
    const irisMat = new THREE.MeshPhongMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.55,
      shininess: 100
    });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    const corneaMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      shininess: 120
    });

    const createSingleEye = (xOffset, isLeft) => {
      const eyeSubGroup = new THREE.Group();
      eyeSubGroup.position.set(xOffset, 0, 0);

      const eyeGeo = new THREE.SphereGeometry(0.18, 20, 20);
      const sclera = new THREE.Mesh(eyeGeo, scleraMat);
      eyeSubGroup.add(sclera);

      const irisGeo = new THREE.CircleGeometry(0.085, 20);
      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.set(0, 0, 0.178);
      eyeSubGroup.add(iris);

      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.045, 18), pupilMat);
      pupil.position.set(0, 0, 0.181);
      eyeSubGroup.add(pupil);

      const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), corneaMat);
      cornea.position.set(0, 0, 0.12);
      cornea.scale.set(1, 1, 0.75);
      eyeSubGroup.add(cornea);

      const nerveMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const nerve = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.35, 10), nerveMat);
      nerve.position.set(0, 0, -0.22);
      nerve.rotation.x = Math.PI / 2;
      eyeSubGroup.add(nerve);

      sclera.userData = { organId: 'eye', group: eyesGroup, name: 'العين' };
      this.raycastMeshes.push(sclera);

      return eyeSubGroup;
    };

    const leftEye = createSingleEye(-0.35, true);
    const rightEye = createSingleEye(0.35, false);
    eyesGroup.add(leftEye);
    eyesGroup.add(rightEye);

    this.organs.eye = {
      id: 'eye',
      name: 'العين',
      group: eyesGroup,
      leftEye: leftEye,
      rightEye: rightEye,
      baseMat: irisMat,
      focusPos: new THREE.Vector3(0, 7.42, 3.2),
      targetPos: new THREE.Vector3(0, 7.42, 0.86),
      scale: 1.0
    };

    this.organsGroup.add(eyesGroup);
  }

  buildHighlightBeacon() {
    const beaconGeo = new THREE.TorusGeometry(0.85, 0.035, 12, 36);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    this.beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    this.beaconMesh.rotation.x = Math.PI / 2;
    this.effectsGroup.add(this.beaconMesh);
  }

  setupControls() {
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.autoRotate = this.autoRotateEnabled;
      this.controls.autoRotateSpeed = 0.75;
      this.controls.minDistance = 4.5;
      this.controls.maxDistance = 24.0;
      this.controls.maxPolarAngle = Math.PI * 0.86;
      this.controls.target.set(0, 3.8, 0);

      this.controls.addEventListener('start', () => {
        this.isDragging = true;
      });
      this.controls.addEventListener('end', () => {
        this.isDragging = false;
      });
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());

    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener('pointermove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.checkHover(e);
    });

    dom.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (dist < 6) {
        this.handleClick();
      }
    });

    dom.addEventListener('pointerleave', () => {
      this.mouse.set(-999, -999);
      this.hideTooltip();
      if (this.hoveredOrgan && this.hoveredOrgan !== this.selectedOrgan) {
        this.setOrganHighlight(this.hoveredOrgan, false);
        this.hoveredOrgan = null;
      }
    });
  }

  checkHover(e) {
    if (this.isDragging) {
      this.hideTooltip();
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.raycastMeshes, false);

    if (intersects.length > 0) {
      const organId = intersects[0].object.userData.organId;
      this.renderer.domElement.style.cursor = 'pointer';

      if (this.hoveredOrgan !== organId) {
        if (this.hoveredOrgan && this.hoveredOrgan !== this.selectedOrgan) {
          this.setOrganHighlight(this.hoveredOrgan, false);
        }
        this.hoveredOrgan = organId;
        this.setOrganHighlight(organId, true);
      }

      const organ = this.organs[organId];
      if (organ) {
        this.showTooltip(organ, e.clientX, e.clientY);
      }
    } else {
      this.renderer.domElement.style.cursor = 'grab';
      if (this.hoveredOrgan && this.hoveredOrgan !== this.selectedOrgan) {
        this.setOrganHighlight(this.hoveredOrgan, false);
        this.hoveredOrgan = null;
      }
      this.hideTooltip();
    }
  }

  handleClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.raycastMeshes, false);

    if (intersects.length > 0) {
      const organId = intersects[0].object.userData.organId;
      this.selectOrgan(organId);
    }
  }

  selectOrgan(organId) {
    if (this.selectedOrgan && this.selectedOrgan !== organId) {
      this.setOrganHighlight(this.selectedOrgan, false);
    }

    this.selectedOrgan = organId;

    if (organId === 'all' || !organId) {
      this.selectedOrgan = null;
      if (this.beaconMesh) this.beaconMesh.material.opacity = 0;
      this.flyCameraTo(new THREE.Vector3(2.0, 4.2, 14.5), new THREE.Vector3(0, 3.8, 0));
      this.updateDetailsPanel(null);
      this.updatePillsUI('all');
      return;
    }

    const organ = this.organs[organId];
    if (!organ) return;

    this.setOrganHighlight(organId, true);
    this.updatePillsUI(organId);

    if (this.beaconMesh) {
      this.beaconMesh.position.copy(organ.targetPos);
      this.beaconMesh.material.opacity = 0.85;
    }

    this.flyCameraTo(organ.focusPos, organ.targetPos);
    this.updateDetailsPanel(organId);

    if (navigator.vibrate) {
      try { navigator.vibrate(30); } catch (e) {}
    }
  }

  setOrganHighlight(organId, highlight) {
    const organ = this.organs[organId];
    if (!organ) return;
    organ.baseMat.emissiveIntensity = highlight ? 1.2 : 0.5;
  }

  flyCameraTo(targetPos, targetLookAt) {
    this.cameraTarget.startPos.copy(this.camera.position);
    this.cameraTarget.startLookAt.copy(this.controls ? this.controls.target : new THREE.Vector3(0, 3.8, 0));
    this.cameraTarget.pos.copy(targetPos);
    this.cameraTarget.lookAt.copy(targetLookAt);
    this.cameraTarget.progress = 0;
    this.cameraTarget.active = true;
  }

  showTooltip(organ, clientX, clientY) {
    const tooltip = document.getElementById('body-3d-tooltip');
    if (!tooltip) return;

    const icons = {
      heart: '🫀', lungs: '🫁', brain: '🧠', stomach: '🥗', esophagus: '🥢', eye: '👁️'
    };

    const organData = (typeof organsData !== 'undefined') ? organsData[organ.id] : null;

    document.getElementById('b3d-tooltip-icon').textContent = icons[organ.id] || '🔬';
    document.getElementById('b3d-tooltip-name').textContent = organ.name;
    document.getElementById('b3d-tooltip-desc').textContent = organData ? organData.tag : 'اضغط للاستكشاف والاستماع';

    tooltip.style.display = 'flex';
    const rect = this.container.getBoundingClientRect();
    const x = clientX - rect.left + 16;
    const y = clientY - rect.top - 20;
    tooltip.style.transform = `translate(${x}px, ${y}px)`;
  }

  hideTooltip() {
    const tooltip = document.getElementById('body-3d-tooltip');
    if (tooltip) tooltip.style.display = 'none';
  }

  updateDetailsPanel(organId) {
    const panelTag = document.getElementById('b3d-panel-tag');
    const panelName = document.getElementById('b3d-panel-name');
    const panelDesc = document.getElementById('b3d-panel-desc');
    const playAudioBtn = document.getElementById('b3d-play-audio-btn');
    const exploreBtn = document.getElementById('b3d-deep-explore-btn');
    const funfactBox = document.getElementById('b3d-funfact-box');
    const funfactText = document.getElementById('b3d-funfact-text');

    if (!organId) {
      if (panelTag) panelTag.textContent = 'الجسم البشري';
      if (panelName) panelName.textContent = 'جسم الإنسان المتكامل';
      if (panelDesc) panelDesc.textContent = 'معجزة الخلق والتكامل الحيوي؛ يحتوي على شبكات وأجهزة دقيقة تعمل في تناسق مذهل على مدار اللحظة. اضغط على أي عضو لتفحصه عن قرب!';
      if (playAudioBtn) playAudioBtn.style.display = 'none';
      if (exploreBtn) exploreBtn.style.display = 'none';
      if (funfactBox) funfactBox.style.display = 'none';
      return;
    }

    const data = (typeof organsData !== 'undefined') ? organsData[organId] : null;
    if (!data) return;

    if (panelTag) panelTag.textContent = data.tag;
    if (panelName) panelName.textContent = data.name;
    if (panelDesc) panelDesc.textContent = `${data.summary} ${data.function}`;

    if (playAudioBtn) {
      playAudioBtn.style.display = 'inline-flex';
      document.getElementById('b3d-audio-label').textContent = data.soundLabel;
      playAudioBtn.onclick = () => {
        if (typeof sounds !== 'undefined') {
          sounds.playOrgan10Seconds(organId);
        }
      };
    }

    if (exploreBtn) {
      exploreBtn.style.display = 'inline-flex';
      exploreBtn.onclick = () => {
        if (typeof switchTab === 'function') {
          switchTab('organs');
          if (typeof selectOrgan === 'function') {
            selectOrgan(organId);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
    }

    if (funfactBox && funfactText) {
      funfactBox.style.display = 'block';
      funfactText.textContent = data.funFact;
    }
  }

  updatePillsUI(activeId) {
    document.querySelectorAll('.organ-3d-pill').forEach(pill => {
      const isMatch = pill.getAttribute('data-organ') === activeId;
      pill.classList.toggle('active', isMatch);
    });
  }

  setupDOMBindings() {
    document.querySelectorAll('.organ-3d-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const organId = pill.getAttribute('data-organ');
        this.selectOrgan(organId);
      });
    });

    const btnFront = document.getElementById('b3d-btn-front');
    if (btnFront) {
      btnFront.addEventListener('click', () => {
        this.flyCameraTo(new THREE.Vector3(0, 4.0, 14.5), new THREE.Vector3(0, 3.8, 0));
      });
    }

    const btnSide = document.getElementById('b3d-btn-side');
    if (btnSide) {
      btnSide.addEventListener('click', () => {
        this.flyCameraTo(new THREE.Vector3(14.5, 4.0, 0), new THREE.Vector3(0, 3.8, 0));
      });
    }

    const btnBack = document.getElementById('b3d-btn-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        this.flyCameraTo(new THREE.Vector3(0, 4.0, -14.5), new THREE.Vector3(0, 3.8, 0));
      });
    }

    const btnReset = document.getElementById('b3d-btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.selectOrgan('all');
      });
    }

    const btnAutoRotate = document.getElementById('b3d-btn-autorotate');
    if (btnAutoRotate) {
      btnAutoRotate.addEventListener('click', () => {
        this.autoRotateEnabled = !this.autoRotateEnabled;
        if (this.controls) this.controls.autoRotate = this.autoRotateEnabled;
        btnAutoRotate.classList.toggle('active', this.autoRotateEnabled);
      });
    }

    const btnPulse = document.getElementById('b3d-btn-pulse');
    if (btnPulse) {
      btnPulse.addEventListener('click', () => {
        this.pulseEnabled = !this.pulseEnabled;
        btnPulse.classList.toggle('active', this.pulseEnabled);
      });
    }

    const btnOpacity = document.getElementById('b3d-btn-opacity');
    const opacityLabel = document.getElementById('b3d-opacity-label');
    if (btnOpacity) {
      btnOpacity.addEventListener('click', () => {
        this.opacityIndex = (this.opacityIndex + 1) % this.opacityLevels.length;
        const level = this.opacityLevels[this.opacityIndex];
        
        this.bodyShellMaterial.opacity = level.val;
        this.bodyShellMaterial.visible = level.val > 0.01;
        this.bodyWireMaterial.opacity = level.wire;
        this.bodyWireMaterial.visible = level.wire > 0.01;

        if (opacityLabel) {
          opacityLabel.textContent = level.name;
        }
      });
    }

    const btnZoomIn = document.getElementById('b3d-zoom-in');
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        if (this.controls) {
          this.controls.dollyIn(1.2);
          this.controls.update();
        }
      });
    }

    const btnZoomOut = document.getElementById('b3d-zoom-out');
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        if (this.controls) {
          this.controls.dollyOut(1.2);
          this.controls.update();
        }
      });
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (this.controls) {
      this.controls.update();
    }

    if (this.cameraTarget.active) {
      this.cameraTarget.progress += delta / this.cameraTarget.duration;
      const t = Math.min(1.0, this.cameraTarget.progress);
      const ease = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(this.cameraTarget.startPos, this.cameraTarget.pos, ease);
      if (this.controls) {
        this.controls.target.lerpVectors(this.cameraTarget.startLookAt, this.cameraTarget.lookAt, ease);
      }

      if (t >= 1.0) {
        this.cameraTarget.active = false;
      }
    }

    if (this.beaconMesh && this.beaconMesh.material.opacity > 0) {
      this.beaconMesh.rotation.z += delta * 1.5;
      const pulseScale = 1.0 + Math.sin(time * 4) * 0.08;
      this.beaconMesh.scale.set(pulseScale, pulseScale, pulseScale);
    }

    if (this.pedestalGroup) {
      this.pedestalGroup.rotation.y += delta * 0.12;
    }

    if (this.pulseEnabled) {
      this.animateOrganFunctions(time, delta);
    }

    // Always render frame to screen
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  animateOrganFunctions(time, delta) {
    // 🫀 1. Heart: Double-beat Lub-Dub Cycle (~72 bpm)
    if (this.organs.heart) {
      const beatCycle = (time * 1.22) % 1.0;
      let heartScale = 1.0;
      let emissiveVal = 0.5;

      if (beatCycle < 0.16) {
        const subT = beatCycle / 0.16;
        heartScale = 1.0 + Math.sin(subT * Math.PI) * 0.22;
        emissiveVal = 1.3;
      } else if (beatCycle >= 0.22 && beatCycle < 0.36) {
        const subT = (beatCycle - 0.22) / 0.14;
        heartScale = 1.0 + Math.sin(subT * Math.PI) * 0.14;
        emissiveVal = 1.0;
      }

      this.organs.heart.group.scale.set(heartScale, heartScale, heartScale);
      this.organs.heart.baseMat.emissiveIntensity = emissiveVal;
    }

    // 🫁 2. Lungs: Smooth Respiratory Cycle (~15 breaths/min)
    if (this.organs.lungs) {
      const breath = Math.sin(time * 1.6);
      const breathScaleX = 1.0 + breath * 0.14;
      const breathScaleZ = 1.0 + breath * 0.16;
      const breathScaleY = 1.0 + breath * 0.06;

      this.organs.lungs.leftLung.scale.set(breathScaleX, breathScaleY, breathScaleZ);
      this.organs.lungs.rightLung.scale.set(breathScaleX, breathScaleY, breathScaleZ);
      this.organs.lungs.baseMat.emissiveIntensity = 0.45 + (breath + 1) * 0.22;
    }

    // 🧠 3. Brain: Rapid Neural Synapses
    if (this.organs.brain) {
      const synPulse = 0.5 + 0.5 * Math.sin(time * 7.5) * Math.cos(time * 3.2);
      this.organs.brain.baseMat.emissiveIntensity = 0.4 + synPulse * 0.55;
    }

    // 🥗 4. Stomach: Gastrointestinal Churning
    if (this.organs.stomach) {
      const digest = Math.sin(time * 2.2);
      this.organs.stomach.group.scale.y = 1.0 + digest * 0.06;
      this.organs.stomach.group.scale.x = 1.0 - digest * 0.05;
      this.organs.stomach.baseMat.emissiveIntensity = 0.4 + Math.abs(digest) * 0.4;
    }

    // 🥢 5. Esophagus: Peristalsis Swallowing Wave
    if (this.organs.esophagus) {
      const wave = Math.sin(time * 3.0);
      this.organs.esophagus.baseMat.emissiveIntensity = 0.4 + Math.max(0, wave) * 0.6;
    }

    // 👁️ 6. Eyes: Visual Focus Glow
    if (this.organs.eye) {
      const eyeGlow = Math.sin(time * 1.5);
      this.organs.eye.baseMat.emissiveIntensity = 0.45 + Math.max(0, eyeGlow) * 0.5;
    }
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 560;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.scene) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

// Global initialization function
let globalBody3DInstance = null;

function setupBody3DViewer() {
  const container = document.getElementById('body-3d-webgl-container');
  if (!container) return;

  try {
    globalBody3DInstance = new Body3DViewer('body-3d-webgl-container');
    window.body3D = globalBody3DInstance;
  } catch (err) {
    console.error('Failed to initialize 3D Human Anatomy Model:', err);
  }
}
