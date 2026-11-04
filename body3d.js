/**
 * 🫀 Interactive 3D Human Anatomy Viewer (Three.js r128)
 * رحلة أعضاء الجسم الداخلية - المجسم التشريحي ثلاثي الأبعاد الواقعي المتكامل
 * 
 * Hyper-realistic, anatomically detailed, crash-proof, fully responsive WebGL human body.
 * Features:
 * - Anatomically sculpted human silhouette (Head, Neck, Torso, Shoulders, Arms, Hands, Legs, Feet)
 * - Complete skeletal system (Cervical, Thoracic, Lumbar Spine, Rib Cage, Sternum, Clavicles, Scapulae, Pelvis)
 * - Major cardiovascular circulatory network (Aorta, Carotid, Subclavian, Femoral Arteries & Vena Cava)
 * - 6 detailed interactive organs (Heart with coronary vessels, Lungs with bronchial tree, Brain with cortical gyri, Stomach, Esophagus, Eyes)
 * - Dynamic physiological animations (lub-dub heartbeat, respiratory cycle, neural firing, peristalsis)
 * - Studio medical lighting, interactive raycaster, camera focus tweening & responsive controls
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
    this.vascularGroup = new THREE.Group();
    this.effectsGroup = new THREE.Group();

    // Organs registry
    this.organs = {};
    this.raycastMeshes = [];
    this.selectedOrgan = null;
    this.hoveredOrgan = null;

    // Materials
    this.bodyShellMaterial = null;
    this.bodyWireMaterial = null;
    this.boneMaterial = null;
    this.arteryMaterial = null;
    this.veinMaterial = null;

    // Animation & Config States
    this.pulseEnabled = true;
    this.autoRotateEnabled = true;
    this.opacityIndex = 0;
    this.opacityLevels = [
      { name: 'شفافية تشريحية (35%)', val: 0.35, wire: 0.08, vasc: 0.9, mode: 'xray' },
      { name: 'زجاجي فائق (15%)', val: 0.15, wire: 0.04, vasc: 0.95, mode: 'glass' },
      { name: 'عزل الأعضاء (إخفاء الهيكل)', val: 0.0, wire: 0.0, vasc: 1.0, mode: 'hidden' },
      { name: 'مجسم طبي صلب (85%)', val: 0.85, wire: 0.15, vasc: 0.3, mode: 'solid' }
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
    this.pedestalGroup = null;

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
      this.setupMaterials();
      this.setupLights();
      this.buildPedestal();
      this.buildHumanSilhouette();
      this.buildRealisticSkeleton();
      this.buildCardiovascularNetwork();
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

  setupScene() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 560;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xf0f9ff, 0.015);

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(2.0, 4.2, 14.5);

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));

    this.scene.add(this.bodyGroup);
    this.scene.add(this.skeletonGroup);
    this.scene.add(this.vascularGroup);
    this.scene.add(this.organsGroup);
    this.scene.add(this.effectsGroup);
  }

  setupMaterials() {
    // Realistic Translucent Human Silhouette Material (Medical Holographic Tissue)
    this.bodyShellMaterial = new THREE.MeshPhongMaterial({
      color: 0x7dd3fc,
      specular: 0xffffff,
      shininess: 90,
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

    // Anatomical Bone Material
    this.boneMaterial = new THREE.MeshPhongMaterial({
      color: 0xf1f5f9,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.25,
      specular: 0xffffff,
      shininess: 50,
      transparent: true,
      opacity: 0.55
    });

    // Arterial Blood Vessels (Glowing Crimson)
    this.arteryMaterial = new THREE.MeshPhongMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.65,
      specular: 0xffffff,
      shininess: 80,
      transparent: true,
      opacity: 0.92
    });

    // Venous Blood Vessels (Deep Azure Blue)
    this.veinMaterial = new THREE.MeshPhongMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.55,
      specular: 0xffffff,
      shininess: 80,
      transparent: true,
      opacity: 0.90
    });
  }

  setupLights() {
    // Studio Medical Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.90);
    this.scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(6, 12, 9);
    this.scene.add(keyLight);

    // Soft Fill Light
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.60);
    fillLight.position.set(-7, 8, 6);
    this.scene.add(fillLight);

    // Rim / Backlight for Hologram Contour Definition
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rimLight.position.set(0, 7, -9);
    this.scene.add(rimLight);

    // Subtle Internal Thoracic Glow
    const internalGlow = new THREE.PointLight(0x38bdf8, 0.45, 12);
    internalGlow.position.set(0, 4.4, 0);
    this.effectsGroup.add(internalGlow);
  }

  buildPedestal() {
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.y = -6.0;

    // Glowing Concentric Medical Scanner Rings
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const ringGeo1 = new THREE.RingGeometry(2.4, 2.48, 64);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    pedestalGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const ringGeo2 = new THREE.RingGeometry(1.65, 1.70, 48);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 2;
    pedestalGroup.add(ring2);

    const discMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    const discGeo = new THREE.CircleGeometry(3.3, 48);
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.y = -0.02;
    pedestalGroup.add(disc);

    // Glowing holographic ticks on outer circle
    const tickCount = 32;
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.65 });
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const tickGeo = new THREE.PlaneGeometry(0.06, 0.22);
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.rotation.x = Math.PI / 2;
      tick.rotation.z = angle;
      tick.position.set(Math.cos(angle) * 2.58, 0, Math.sin(angle) * 2.58);
      pedestalGroup.add(tick);
    }

    this.effectsGroup.add(pedestalGroup);
    this.pedestalGroup = pedestalGroup;
  }

  /**
   * Anatomically Sculpted Human Silhouette
   * High-fidelity organic curves: Head, Jaw, Neck, Pectorals, Waist, Limbs & Digits
   */
  buildHumanSilhouette() {
    const addPart = (geo, pos, rot, scale) => {
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

    // 1. HEAD & FACIAL ANATOMY
    // Cranial Dome (Smooth Anatomical Ellipsoid)
    const craniumGeo = new THREE.SphereGeometry(0.92, 32, 28);
    addPart(craniumGeo, { x: 0, y: 7.42, z: 0.05 }, null, { x: 0.90, y: 1.08, z: 1.02 });

    // Forehead & Brow Ridge
    const browGeo = new THREE.CylinderGeometry(0.55, 0.60, 0.28, 20);
    addPart(browGeo, { x: 0, y: 7.40, z: 0.48 }, { x: 0.15, y: 0, z: 0 }, { x: 1.1, y: 1, z: 0.65 });

    // Mandible & Jawline (Anatomically tapered to chin)
    const jawGeo = new THREE.CylinderGeometry(0.56, 0.36, 0.75, 20);
    addPart(jawGeo, { x: 0, y: 6.82, z: 0.32 }, { x: 0.22, y: 0, z: 0 }, { x: 0.95, y: 1, z: 0.90 });

    // Sculpted Chin Prominence
    const chinGeo = new THREE.SphereGeometry(0.24, 18, 16);
    addPart(chinGeo, { x: 0, y: 6.54, z: 0.58 }, null, { x: 1.1, y: 0.85, z: 1.1 });

    // Sculpted Nose Bridge & Apex
    const noseGeo = new THREE.ConeGeometry(0.12, 0.42, 12);
    addPart(noseGeo, { x: 0, y: 7.15, z: 0.88 }, { x: 0.32, y: 0, z: 0 });

    // Cheekbones (Zygomatic Arches)
    const cheekGeo = new THREE.SphereGeometry(0.28, 16, 16);
    addPart(cheekGeo, { x: -0.52, y: 7.15, z: 0.46 }, null, { x: 0.8, y: 1, z: 0.9 });
    addPart(cheekGeo, { x: 0.52, y: 7.15, z: 0.46 }, null, { x: 0.8, y: 1, z: 0.9 });

    // Anatomical Ears (Left & Right)
    const earGeo = new THREE.TorusGeometry(0.20, 0.06, 10, 20, Math.PI * 0.9);
    addPart(earGeo, { x: -0.86, y: 7.22, z: 0.05 }, { x: 0.1, y: -0.3, z: Math.PI * 0.6 });
    addPart(earGeo, { x: 0.86, y: 7.22, z: 0.05 }, { x: 0.1, y: 0.3, z: -Math.PI * 0.6 });

    // 2. NECK (With Laryngeal Adam's Apple & Trapezius Slope)
    const neckGeo = new THREE.CylinderGeometry(0.44, 0.56, 0.92, 24);
    addPart(neckGeo, { x: 0, y: 6.30, z: 0.04 }, null, { x: 0.95, y: 1, z: 1.02 });

    // Thyroid Cartilage (Adam's Apple)
    const laryngealGeo = new THREE.SphereGeometry(0.12, 14, 14);
    addPart(laryngealGeo, { x: 0, y: 6.36, z: 0.46 }, null, { x: 0.8, y: 1.1, z: 0.8 });

    // Sternocleidomastoid Muscle Ridges
    const scmGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.86, 12);
    addPart(scmGeo, { x: -0.26, y: 6.26, z: 0.16 }, { x: 0.1, y: 0, z: -0.24 });
    addPart(scmGeo, { x: 0.26, y: 6.26, z: 0.16 }, { x: 0.1, y: 0, z: 0.24 });

    // 3. TORSO (Sculpted Pectorals, Latissimus & Waist Pinch)
    // Upper Chest / Pectoral Region
    const chestGeo = new THREE.CylinderGeometry(1.42, 1.22, 1.65, 32);
    addPart(chestGeo, { x: 0, y: 5.15, z: 0.08 }, null, { x: 1.24, y: 1, z: 0.86 });

    // Pectoral Muscle Bulges (Left & Right)
    const pecGeo = new THREE.SphereGeometry(0.62, 20, 18);
    addPart(pecGeo, { x: -0.58, y: 5.10, z: 0.52 }, { x: 0.2, y: 0, z: 0.1 }, { x: 1.05, y: 0.82, z: 0.65 });
    addPart(pecGeo, { x: 0.58, y: 5.10, z: 0.52 }, { x: 0.2, y: 0, z: -0.1 }, { x: 1.05, y: 0.82, z: 0.65 });

    // Abdominal Region (Tapered Waist)
    const abdomenGeo = new THREE.CylinderGeometry(1.15, 1.05, 1.45, 30);
    addPart(abdomenGeo, { x: 0, y: 3.75, z: 0.05 }, null, { x: 1.12, y: 1, z: 0.80 });

    // Pelvis & Lower Abdomen
    const pelvisGeo = new THREE.CylinderGeometry(1.05, 1.25, 1.55, 30);
    addPart(pelvisGeo, { x: 0, y: 2.35, z: 0.02 }, null, { x: 1.18, y: 1, z: 0.85 });

    // Gluteal Curvatures (Posterior Hip Shape)
    const gluteGeo = new THREE.SphereGeometry(0.68, 20, 18);
    addPart(gluteGeo, { x: -0.55, y: 2.05, z: -0.32 }, null, { x: 1.0, y: 1.08, z: 0.88 });
    addPart(gluteGeo, { x: 0.55, y: 2.05, z: -0.32 }, null, { x: 1.0, y: 1.08, z: 0.88 });

    // 4. SHOULDERS & ARMS (Deltoids, Biceps, Elbows, Forearms & Hands)
    // Deltoid Shoulder Muscles
    const deltoidGeo = new THREE.SphereGeometry(0.58, 22, 20);
    addPart(deltoidGeo, { x: -1.82, y: 5.62, z: 0.02 }, null, { x: 1.05, y: 1.0, z: 0.95 });
    addPart(deltoidGeo, { x: 1.82, y: 5.62, z: 0.02 }, null, { x: 1.05, y: 1.0, z: 0.95 });

    // Upper Arm (Biceps & Triceps Mass)
    const armUpperGeo = new THREE.CylinderGeometry(0.38, 0.32, 1.72, 20);
    addPart(armUpperGeo, { x: -2.05, y: 4.40, z: 0.02 }, { x: 0, y: 0, z: 0.12 });
    addPart(armUpperGeo, { x: 2.05, y: 4.40, z: 0.02 }, { x: 0, y: 0, z: -0.12 });

    // Elbow Joints
    const elbowGeo = new THREE.SphereGeometry(0.30, 16, 16);
    addPart(elbowGeo, { x: -2.22, y: 3.42, z: 0.03 });
    addPart(elbowGeo, { x: 2.22, y: 3.42, z: 0.03 });

    // Forearms (Muscular taper to wrist)
    const armForeGeo = new THREE.CylinderGeometry(0.32, 0.24, 1.68, 20);
    addPart(armForeGeo, { x: -2.36, y: 2.50, z: 0.05 }, { x: 0, y: 0, z: 0.14 });
    addPart(armForeGeo, { x: 2.36, y: 2.50, z: 0.05 }, { x: 0, y: 0, z: -0.14 });

    // Anatomical Hands & Fingers (Palm + Thumb + Digit Contours)
    const createHand = (isLeft) => {
      const handGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;
      handGroup.position.set(sign * 2.58, 1.45, 0.08);

      // Palm
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.14), this.bodyShellMaterial);
      handGroup.add(palm);
      const palmWire = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.14), this.bodyWireMaterial);
      handGroup.add(palmWire);

      // Opposable Thumb
      const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.22, 10), this.bodyShellMaterial);
      thumb.position.set(-sign * 0.18, 0.08, 0.06);
      thumb.rotation.z = sign * 0.55;
      handGroup.add(thumb);

      // Fingers cluster (Relaxed anatomical curvature)
      const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.38, 0.12), this.bodyShellMaterial);
      fingers.position.set(0, -0.36, 0.02);
      fingers.rotation.x = 0.15;
      handGroup.add(fingers);

      this.bodyGroup.add(handGroup);
    };
    createHand(true);
    createHand(false);

    // 5. LOWER LIMBS (Thighs, Knees, Calves, Ankles & Feet)
    // Thighs (Quadriceps & Hamstrings)
    const thighGeo = new THREE.CylinderGeometry(0.62, 0.46, 2.95, 24);
    addPart(thighGeo, { x: -0.68, y: 0.25, z: 0.02 }, { x: -0.02, y: 0, z: 0.04 });
    addPart(thighGeo, { x: 0.68, y: 0.25, z: 0.02 }, { x: -0.02, y: 0, z: -0.04 });

    // Knee Joints & Patella (Kneecap)
    const kneeGeo = new THREE.SphereGeometry(0.42, 20, 20);
    addPart(kneeGeo, { x: -0.72, y: -1.35, z: 0.06 }, null, { x: 0.95, y: 1.1, z: 1.05 });
    addPart(kneeGeo, { x: 0.72, y: -1.35, z: 0.06 }, null, { x: 0.95, y: 1.1, z: 1.05 });

    // Calves (Gastrocnemius Twin Muscle Bulge)
    const calfGeo = new THREE.CylinderGeometry(0.46, 0.30, 3.45, 24);
    addPart(calfGeo, { x: -0.75, y: -3.20, z: 0.02 }, { x: 0.03, y: 0, z: 0.02 });
    addPart(calfGeo, { x: 0.75, y: -3.20, z: 0.02 }, { x: 0.03, y: 0, z: -0.02 });

    // Ankle Malleoli Bones
    const ankleGeo = new THREE.SphereGeometry(0.26, 14, 14);
    addPart(ankleGeo, { x: -0.78, y: -4.95, z: 0.04 }, null, { x: 1.2, y: 0.8, z: 1.0 });
    addPart(ankleGeo, { x: 0.78, y: -4.95, z: 0.04 }, null, { x: 1.2, y: 0.8, z: 1.0 });

    // Sculpted Feet with Natural Plantar Arch & Heel
    const createFoot = (isLeft) => {
      const sign = isLeft ? -1 : 1;
      const footGroup = new THREE.Group();
      footGroup.position.set(sign * 0.80, -5.30, 0.25);

      // Heel (Calcaneus)
      const heel = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 14), this.bodyShellMaterial);
      heel.position.set(0, 0, -0.28);
      heel.scale.set(0.9, 1.0, 1.2);
      footGroup.add(heel);

      // Midfoot & Plantar Arch
      const instep = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.75), this.bodyShellMaterial);
      instep.position.set(0, 0.02, 0.12);
      footGroup.add(instep);

      // Toes
      const toes = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.20, 0.38), this.bodyShellMaterial);
      toes.position.set(0, -0.06, 0.58);
      footGroup.add(toes);

      this.bodyGroup.add(footGroup);
    };
    createFoot(true);
    createFoot(false);
  }

  /**
   * Anatomically Detailed Skeletal Framework
   * S-curved spine, 12 rib pairs, central sternum, S-clavicles, scapulae, and pelvic girdle
   */
  buildRealisticSkeleton() {
    // 1. S-CURVED VERTEBRAL COLUMN (24 vertebrae + Sacrum)
    const vertebraeCount = 24;
    for (let i = 0; i < vertebraeCount; i++) {
      const t = i / vertebraeCount;
      const y = 6.45 - (i * 0.21);

      // Natural Anatomical S-curve (Cervical Lordosis, Thoracic Kyphosis, Lumbar Lordosis)
      let z = -0.15;
      if (t < 0.25) {
        // Cervical
        z = -0.12 + Math.sin(t * Math.PI * 4) * 0.08;
      } else if (t < 0.7) {
        // Thoracic (backward curve)
        z = -0.32 - Math.sin((t - 0.25) / 0.45 * Math.PI) * 0.16;
      } else {
        // Lumbar (forward lordosis)
        z = -0.22 + Math.sin((t - 0.7) / 0.3 * Math.PI) * 0.12;
      }

      const vRadius = 0.22 + (t * 0.08);
      const vGeo = new THREE.CylinderGeometry(vRadius, vRadius * 1.05, 0.14, 16);
      const vMesh = new THREE.Mesh(vGeo, this.boneMaterial);
      vMesh.position.set(0, y, z);
      this.skeletonGroup.add(vMesh);
    }

    // Sacrum & Coccyx
    const sacrumGeo = new THREE.ConeGeometry(0.48, 0.85, 16);
    const sacrumMesh = new THREE.Mesh(sacrumGeo, this.boneMaterial);
    sacrumMesh.position.set(0, 1.75, -0.26);
    sacrumMesh.rotation.x = Math.PI - 0.3;
    this.skeletonGroup.add(sacrumMesh);

    // 2. CENTRAL STERNUM (Manubrium, Body, Xiphoid Process)
    const sternumGroup = new THREE.Group();
    sternumGroup.position.set(0, 4.95, 0.82);

    // Manubrium (Top of sternum)
    const manubrium = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.10), this.boneMaterial);
    sternumGroup.add(manubrium);

    // Sternal Body (Middle gladiolus)
    const sternalBody = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.95, 0.08), this.boneMaterial);
    sternalBody.position.y = -0.60;
    sternumGroup.add(sternalBody);

    // Xiphoid Process
    const xiphoid = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.24, 8), this.boneMaterial);
    xiphoid.position.set(0, -1.18, 0);
    xiphoid.rotation.z = Math.PI;
    sternumGroup.add(xiphoid);

    this.skeletonGroup.add(sternumGroup);

    // 3. CLAVICLES (S-shaped Collarbones)
    const buildClavicle = (isLeft) => {
      const sign = isLeft ? -1 : 1;
      const points = [
        new THREE.Vector3(sign * 0.15, 5.85, 0.72),
        new THREE.Vector3(sign * 0.75, 5.92, 0.62),
        new THREE.Vector3(sign * 1.45, 5.78, 0.32)
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.065, 10, false);
      const clavicle = new THREE.Mesh(tubeGeo, this.boneMaterial);
      this.skeletonGroup.add(clavicle);
    };
    buildClavicle(true);
    buildClavicle(false);

    // 4. SCAPULAE (Shoulder Blades on the back)
    const scapulaGeo = new THREE.BoxGeometry(0.55, 0.75, 0.06);
    const scapulaL = new THREE.Mesh(scapulaGeo, this.boneMaterial);
    scapulaL.position.set(-0.95, 5.25, -0.52);
    scapulaL.rotation.y = 0.25;
    this.skeletonGroup.add(scapulaL);

    const scapulaR = new THREE.Mesh(scapulaGeo, this.boneMaterial);
    scapulaR.position.set(0.95, 5.25, -0.52);
    scapulaR.rotation.y = -0.25;
    this.skeletonGroup.add(scapulaR);

    // 5. TRUE 10-RIB CAGE (Anatomically wrapping with costal angles)
    for (let i = 0; i < 9; i++) {
      const y = 5.65 - (i * 0.24);
      const radius = 1.15 - (i * 0.035);
      const tubeRadius = 0.036;

      // Right Rib
      const ribGeoRight = new THREE.TorusGeometry(radius, tubeRadius, 8, 24, Math.PI * 0.62);
      const ribRight = new THREE.Mesh(ribGeoRight, this.boneMaterial);
      ribRight.position.set(0.12, y, 0.08);
      ribRight.rotation.x = Math.PI * 0.54;
      ribRight.rotation.y = 0.18;
      ribRight.rotation.z = -Math.PI * 0.30;
      this.skeletonGroup.add(ribRight);

      // Left Rib
      const ribGeoLeft = new THREE.TorusGeometry(radius, tubeRadius, 8, 24, Math.PI * 0.62);
      const ribLeft = new THREE.Mesh(ribGeoLeft, this.boneMaterial);
      ribLeft.position.set(-0.12, y, 0.08);
      ribLeft.rotation.x = Math.PI * 0.54;
      ribLeft.rotation.y = -0.18;
      ribLeft.rotation.z = Math.PI * 0.72;
      this.skeletonGroup.add(ribLeft);
    }

    // 6. PELVIC GIRDLE (Iliac Crests & Pubic Arch)
    const pelvisGroup = new THREE.Group();
    pelvisGroup.position.set(0, 2.30, 0.02);

    const iliacGeo = new THREE.TorusGeometry(0.85, 0.14, 10, 24, Math.PI * 0.75);
    const iliacL = new THREE.Mesh(iliacGeo, this.boneMaterial);
    iliacL.position.set(-0.35, 0.10, 0);
    iliacL.rotation.y = 0.35;
    iliacL.rotation.z = Math.PI * 0.40;
    pelvisGroup.add(iliacL);

    const iliacR = new THREE.Mesh(iliacGeo, this.boneMaterial);
    iliacR.position.set(0.35, 0.10, 0);
    iliacR.rotation.y = -0.35;
    iliacR.rotation.z = -Math.PI * 0.40;
    pelvisGroup.add(iliacR);

    this.skeletonGroup.add(pelvisGroup);
  }

  /**
   * Anatomical Cardiovascular Network (Arteries & Veins)
   * Aorta, Carotids to brain, Subclavian to arms, Femoral to legs, and Vena Cava
   */
  buildCardiovascularNetwork() {
    // 1. AORTA & ARTERIAL SYSTEM (Crimson Red)
    // Ascending Aorta & Arch
    const aortaPoints = [
      new THREE.Vector3(-0.05, 4.45, 0.45),
      new THREE.Vector3(-0.02, 4.85, 0.35),
      new THREE.Vector3(0.08, 5.08, 0.15),
      new THREE.Vector3(0.05, 4.85, -0.05),
      new THREE.Vector3(0.04, 3.80, -0.12),
      new THREE.Vector3(0.04, 2.70, -0.08)
    ];
    const aortaCurve = new THREE.CatmullRomCurve3(aortaPoints);
    const aortaMesh = new THREE.Mesh(new THREE.TubeGeometry(aortaCurve, 28, 0.075, 12, false), this.arteryMaterial);
    this.vascularGroup.add(aortaMesh);

    // Carotid Arteries (Ascending to Brain)
    const buildCarotid = (isLeft) => {
      const sign = isLeft ? -1 : 1;
      const pts = [
        new THREE.Vector3(sign * 0.08, 5.08, 0.20),
        new THREE.Vector3(sign * 0.22, 6.25, 0.28),
        new THREE.Vector3(sign * 0.18, 7.10, 0.15)
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.040, 10, false), this.arteryMaterial);
      this.vascularGroup.add(mesh);
    };
    buildCarotid(true);
    buildCarotid(false);

    // Subclavian & Brachial Arteries (To Arms)
    const buildArmArtery = (isLeft) => {
      const sign = isLeft ? -1 : 1;
      const pts = [
        new THREE.Vector3(sign * 0.12, 5.12, 0.18),
        new THREE.Vector3(sign * 1.15, 5.40, 0.20),
        new THREE.Vector3(sign * 1.85, 4.55, 0.08),
        new THREE.Vector3(sign * 2.15, 3.25, 0.06),
        new THREE.Vector3(sign * 2.35, 1.85, 0.08)
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.038, 10, false), this.arteryMaterial);
      this.vascularGroup.add(mesh);
    };
    buildArmArtery(true);
    buildArmArtery(false);

    // Iliac & Femoral Arteries (Descending into Legs)
    const buildLegArtery = (isLeft) => {
      const sign = isLeft ? -1 : 1;
      const pts = [
        new THREE.Vector3(0.04, 2.70, -0.08),
        new THREE.Vector3(sign * 0.35, 2.05, 0.05),
        new THREE.Vector3(sign * 0.65, 0.85, 0.12),
        new THREE.Vector3(sign * 0.70, -1.35, 0.08),
        new THREE.Vector3(sign * 0.72, -3.45, 0.04)
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.045, 10, false), this.arteryMaterial);
      this.vascularGroup.add(mesh);
    };
    buildLegArtery(true);
    buildLegArtery(false);

    // 2. VENA CAVA & VENOUS SYSTEM (Deep Azure Blue)
    // Superior & Inferior Vena Cava
    const vcPoints = [
      new THREE.Vector3(-0.18, 5.40, 0.22),
      new THREE.Vector3(-0.20, 4.60, 0.30),
      new THREE.Vector3(-0.16, 3.65, 0.05),
      new THREE.Vector3(-0.12, 2.65, -0.04)
    ];
    const vcCurve = new THREE.CatmullRomCurve3(vcPoints);
    const vcMesh = new THREE.Mesh(new THREE.TubeGeometry(vcCurve, 20, 0.075, 12, false), this.veinMaterial);
    this.vascularGroup.add(vcMesh);

    // Jugular Veins (Descending from Head)
    const buildJugular = (isLeft) => {
      const sign = isLeft ? -1 : 1;
      const pts = [
        new THREE.Vector3(sign * 0.25, 7.05, 0.12),
        new THREE.Vector3(sign * 0.30, 6.20, 0.22),
        new THREE.Vector3(-0.18, 5.40, 0.22)
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.040, 10, false), this.veinMaterial);
      this.vascularGroup.add(mesh);
    };
    buildJugular(true);
    buildJugular(false);
  }

  /**
   * 6 Internal Interactive Organs (Heart, Lungs, Brain, Stomach, Esophagus, Eyes)
   */
  buildInternalOrgans() {
    this.buildHeart();
    this.buildLungs();
    this.buildBrain();
    this.buildStomach();
    this.buildEsophagus();
    this.buildEyes();
  }

  // 🫀 HEART: Anatomically accurate muscular chambers & coronary vasculature
  buildHeart() {
    const heartGroup = new THREE.Group();
    heartGroup.position.set(-0.28, 4.42, 0.42);

    const heartMat = new THREE.MeshPhongMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.55,
      specular: 0xffffff,
      shininess: 95
    });

    // Left and Right Ventricles (Muscular Conical Body)
    const ventricleGeo = new THREE.ConeGeometry(0.52, 0.90, 24);
    const ventricles = new THREE.Mesh(ventricleGeo, heartMat);
    ventricles.rotation.z = Math.PI - 0.24;
    ventricles.rotation.x = 0.20;
    heartGroup.add(ventricles);

    // Left Atrium
    const atriaGeo = new THREE.SphereGeometry(0.36, 20, 20);
    const leftAtrium = new THREE.Mesh(atriaGeo, heartMat);
    leftAtrium.position.set(-0.22, 0.38, -0.06);
    heartGroup.add(leftAtrium);

    // Right Atrium
    const rightAtrium = new THREE.Mesh(atriaGeo, heartMat);
    rightAtrium.position.set(0.24, 0.35, 0.05);
    heartGroup.add(rightAtrium);

    // Ascending Aorta Arch
    const aortaMat = new THREE.MeshPhongMaterial({ color: 0xdc2626, emissive: 0xb91c1c, emissiveIntensity: 0.4, shininess: 80 });
    const aortaGeo = new THREE.TorusGeometry(0.26, 0.085, 12, 24, Math.PI * 0.95);
    const aorta = new THREE.Mesh(aortaGeo, aortaMat);
    aorta.position.set(0.04, 0.54, -0.08);
    aorta.rotation.y = 0.4;
    aorta.rotation.z = -0.3;
    heartGroup.add(aorta);

    // 3 Supra-Aortic Branches (Brachiocephalic, Carotid, Subclavian)
    for (let i = 0; i < 3; i++) {
      const bGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.22, 10);
      const bMesh = new THREE.Mesh(bGeo, aortaMat);
      bMesh.position.set(-0.06 + (i * 0.08), 0.76, -0.08 + (i * 0.02));
      heartGroup.add(bMesh);
    }

    // Pulmonary Trunk
    const paMat = new THREE.MeshPhongMaterial({ color: 0x0284c7, shininess: 80 });
    const paGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.48, 14);
    const pa = new THREE.Mesh(paGeo, paMat);
    pa.position.set(-0.08, 0.48, 0.14);
    pa.rotation.z = 0.4;
    pa.rotation.x = 0.25;
    heartGroup.add(pa);

    // Coronary Arteries (Fine red branches on anterior surface)
    const coronaryMat = new THREE.MeshBasicMaterial({ color: 0xff4d4d });
    const cPoints = [
      new THREE.Vector3(0.05, 0.25, 0.38),
      new THREE.Vector3(0.0, 0.0, 0.44),
      new THREE.Vector3(-0.10, -0.25, 0.36)
    ];
    const cTube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cPoints), 12, 0.024, 8, false), coronaryMat);
    heartGroup.add(cTube);

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

  // 🫁 LUNGS: 3-lobe right lung, 2-lobe left lung with cardiac notch, trachea & bronchi
  buildLungs() {
    const lungsGroup = new THREE.Group();
    lungsGroup.position.set(0, 4.55, 0.12);

    const lungMat = new THREE.MeshPhongMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.50,
      specular: 0xffffff,
      shininess: 70,
      transparent: true,
      opacity: 0.94
    });

    // Trachea with Cartilaginous Rings
    const tracheaMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, shininess: 80 });
    const tracheaGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.15, 16);
    const trachea = new THREE.Mesh(tracheaGeo, tracheaMat);
    trachea.position.set(0, 0.85, 0.05);
    lungsGroup.add(trachea);

    // Primary Bronchi Bifurcation (Carina)
    const bronchusGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.45, 12);
    const rBronchus = new THREE.Mesh(bronchusGeo, tracheaMat);
    rBronchus.position.set(0.24, 0.32, 0.02);
    rBronchus.rotation.z = -0.55;
    lungsGroup.add(rBronchus);

    const lBronchus = new THREE.Mesh(bronchusGeo, tracheaMat);
    lBronchus.position.set(-0.24, 0.32, 0.02);
    lBronchus.rotation.z = 0.55;
    lungsGroup.add(lBronchus);

    // Right Lung (3 Anatomical Lobes: Superior, Middle, Inferior)
    const rightLungGroup = new THREE.Group();
    rightLungGroup.position.set(0.85, -0.05, 0);

    const lobeGeo = new THREE.SphereGeometry(0.50, 22, 22);
    const rSuperior = new THREE.Mesh(lobeGeo, lungMat);
    rSuperior.position.set(0, 0.48, 0);
    rSuperior.scale.set(0.88, 1.15, 0.92);
    rightLungGroup.add(rSuperior);

    const rMiddle = new THREE.Mesh(lobeGeo, lungMat);
    rMiddle.position.set(0.08, -0.05, 0.08);
    rMiddle.scale.set(0.92, 0.92, 0.88);
    rightLungGroup.add(rMiddle);

    const rInferior = new THREE.Mesh(lobeGeo, lungMat);
    rInferior.position.set(0.04, -0.58, -0.04);
    rInferior.scale.set(0.96, 1.12, 0.96);
    rightLungGroup.add(rInferior);

    lungsGroup.add(rightLungGroup);

    // Left Lung (2 Lobes with Anatomical Cardiac Notch)
    const leftLungGroup = new THREE.Group();
    leftLungGroup.position.set(-0.86, -0.08, 0);

    const lSuperior = new THREE.Mesh(lobeGeo, lungMat);
    lSuperior.position.set(0, 0.44, 0);
    lSuperior.scale.set(0.84, 1.14, 0.90);
    leftLungGroup.add(lSuperior);

    const lInferior = new THREE.Mesh(lobeGeo, lungMat);
    lInferior.position.set(-0.06, -0.50, -0.02);
    lInferior.scale.set(0.90, 1.08, 0.90);
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

  // 🧠 BRAIN: Cerebral hemispheres with gyri/sulci convolutions, cerebellum & brainstem
  buildBrain() {
    const brainGroup = new THREE.Group();
    brainGroup.position.set(0, 7.38, 0.12);

    const brainMat = new THREE.MeshPhongMaterial({
      color: 0x8b5cf6,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.55,
      specular: 0xffffff,
      shininess: 90
    });

    // Procedural Gyri & Sulci Bump/Texture Simulation
    const hemiGeo = new THREE.SphereGeometry(0.54, 28, 24);

    // Left Cerebral Hemisphere
    const leftHemi = new THREE.Mesh(hemiGeo, brainMat);
    leftHemi.position.set(-0.26, 0.14, 0);
    leftHemi.scale.set(0.86, 0.98, 1.28);
    brainGroup.add(leftHemi);

    // Right Cerebral Hemisphere
    const rightHemi = new THREE.Mesh(hemiGeo, brainMat);
    rightHemi.position.set(0.26, 0.14, 0);
    rightHemi.scale.set(0.86, 0.98, 1.28);
    brainGroup.add(rightHemi);

    // Longitudinal Fissure Divider
    const fissureMat = new THREE.MeshBasicMaterial({ color: 0x4c1d95 });
    const fissure = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 1.2), fissureMat);
    fissure.rotation.y = Math.PI / 2;
    fissure.position.set(0, 0.14, 0);
    brainGroup.add(fissure);

    // Cerebellum (Horizontal Folia Structure)
    const cerebMat = new THREE.MeshPhongMaterial({ color: 0x7c3aed, emissive: 0x5b21b6, shininess: 70 });
    const cerebGeo = new THREE.SphereGeometry(0.34, 20, 18);
    const cerebellum = new THREE.Mesh(cerebGeo, cerebMat);
    cerebellum.position.set(0, -0.34, -0.34);
    cerebellum.scale.set(1.25, 0.72, 0.88);
    brainGroup.add(cerebellum);

    // Brainstem (Pons & Medulla Oblongata)
    const stemGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.65, 16);
    const brainStem = new THREE.Mesh(stemGeo, cerebMat);
    brainStem.position.set(0, -0.60, -0.16);
    brainGroup.add(brainStem);

    // Optic Chiasm & Nerves
    const opticNerveMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const opticL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8), opticNerveMat);
    opticL.position.set(-0.16, -0.22, 0.38);
    opticL.rotation.x = Math.PI * 0.42;
    opticL.rotation.z = -0.3;
    brainGroup.add(opticL);

    const opticR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8), opticNerveMat);
    opticR.position.set(0.16, -0.22, 0.38);
    opticR.rotation.x = Math.PI * 0.42;
    opticR.rotation.z = 0.3;
    brainGroup.add(opticR);

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

  // 🥗 STOMACH: Anatomical J-shape with fundus dome, gastric body, rugae & pylorus
  buildStomach() {
    const stomachGroup = new THREE.Group();
    stomachGroup.position.set(-0.52, 3.25, 0.35);

    const stomachMat = new THREE.MeshPhongMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.50,
      specular: 0xffffff,
      shininess: 85
    });

    // Gastric Fundus (Superior dome)
    const fundusGeo = new THREE.SphereGeometry(0.44, 22, 22);
    const fundus = new THREE.Mesh(fundusGeo, stomachMat);
    fundus.position.set(-0.16, 0.40, 0.04);
    fundus.scale.set(0.92, 1.08, 0.88);
    stomachGroup.add(fundus);

    // Gastric Body (Curved J-cylinder)
    const bodyGeo = new THREE.CylinderGeometry(0.44, 0.36, 0.90, 22);
    const body = new THREE.Mesh(bodyGeo, stomachMat);
    body.position.set(0, 0.06, 0);
    body.rotation.z = -0.36;
    body.scale.set(1.18, 1, 0.88);
    stomachGroup.add(body);

    // Pyloric Antrum & Pylorus
    const antrumGeo = new THREE.SphereGeometry(0.34, 20, 20);
    const antrum = new THREE.Mesh(antrumGeo, stomachMat);
    antrum.position.set(0.34, -0.30, 0.08);
    antrum.scale.set(1.12, 0.88, 0.88);
    stomachGroup.add(antrum);

    // Duodenum C-loop (Connecting into small intestine)
    const duodMat = new THREE.MeshPhongMaterial({ color: 0x34d399, shininess: 70 });
    const duodPoints = [
      new THREE.Vector3(0.55, -0.35, 0.10),
      new THREE.Vector3(0.72, -0.42, 0.02),
      new THREE.Vector3(0.68, -0.62, -0.06)
    ];
    const duodMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(duodPoints), 12, 0.09, 10, false), duodMat);
    stomachGroup.add(duodMesh);

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

  // 🥢 ESOPHAGUS: Anatomical muscular conduit connecting pharynx through diaphragm
  buildEsophagus() {
    const esoGroup = new THREE.Group();

    const esoMat = new THREE.MeshPhongMaterial({
      color: 0xf97316,
      emissive: 0xc2410c,
      emissiveIntensity: 0.55,
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
    const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.115, 16, false);
    const tube = new THREE.Mesh(tubeGeo, esoMat);
    esoGroup.add(tube);

    // Muscular Rings (Peristaltic rings)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfdba74, transparent: true, opacity: 0.65 });
    for (let i = 0; i < 11; i++) {
      const t = 0.08 + (i / 11) * 0.84;
      const pt = curve.getPoint(t);
      const ringGeo = new THREE.TorusGeometry(0.125, 0.024, 8, 16);
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

  // 👁️ EYES: Detailed anatomical sclera, iris striations, pupil, cornea & optic nerve
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
      emissiveIntensity: 0.60,
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

      // Sclera (Eyeball)
      const eyeGeo = new THREE.SphereGeometry(0.18, 22, 22);
      const sclera = new THREE.Mesh(eyeGeo, scleraMat);
      eyeSubGroup.add(sclera);

      // Iris with Radial Disc
      const irisGeo = new THREE.CircleGeometry(0.088, 22);
      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.set(0, 0, 0.178);
      eyeSubGroup.add(iris);

      // Pupil
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.046, 18), pupilMat);
      pupil.position.set(0, 0, 0.181);
      eyeSubGroup.add(pupil);

      // Cornea (Transparent Curvature)
      const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), corneaMat);
      cornea.position.set(0, 0, 0.12);
      cornea.scale.set(1, 1, 0.75);
      eyeSubGroup.add(cornea);

      // Optic Nerve Bundle
      const nerveMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const nerve = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.38, 10), nerveMat);
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
    organ.baseMat.emissiveIntensity = highlight ? 1.25 : 0.55;
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

    const iconEl = document.getElementById('b3d-tooltip-icon');
    const nameEl = document.getElementById('b3d-tooltip-name');
    const descEl = document.getElementById('b3d-tooltip-desc');

    if (iconEl) iconEl.textContent = icons[organ.id] || '🔬';
    if (nameEl) nameEl.textContent = organ.name;
    if (descEl) descEl.textContent = organData ? organData.tag : 'اضغط للاستكشاف والاستماع';

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
      const lbl = document.getElementById('b3d-audio-label');
      if (lbl) lbl.textContent = data.soundLabel;
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

        if (this.bodyShellMaterial) {
          this.bodyShellMaterial.opacity = level.val;
          this.bodyShellMaterial.visible = level.val > 0.01;
        }
        if (this.bodyWireMaterial) {
          this.bodyWireMaterial.opacity = level.wire;
          this.bodyWireMaterial.visible = level.wire > 0.01;
        }
        if (this.vascularGroup) {
          this.vascularGroup.visible = level.vasc > 0.01;
        }
        if (this.skeletonGroup) {
          this.skeletonGroup.visible = level.mode !== 'hidden';
        }

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
    this.animFrameId = requestAnimationFrame(() => this.animate());

    // 🚀 PERFORMANCE GUARD: Pause heavy 3D WebGL rendering when tab is hidden, or user switched away from Home tab, or Admin modal is open
    if (document.hidden) return;
    if (typeof state !== 'undefined' && state.currentTab && state.currentTab !== 'home') return;
    const adminModal = document.getElementById('admin-dashboard-modal');
    if (adminModal && adminModal.classList.contains('show')) return;

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
      let emissiveVal = 0.55;

      if (beatCycle < 0.16) {
        const subT = beatCycle / 0.16;
        heartScale = 1.0 + Math.sin(subT * Math.PI) * 0.22;
        emissiveVal = 1.35;
      } else if (beatCycle >= 0.22 && beatCycle < 0.36) {
        const subT = (beatCycle - 0.22) / 0.14;
        heartScale = 1.0 + Math.sin(subT * Math.PI) * 0.14;
        emissiveVal = 1.05;
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
      this.organs.lungs.baseMat.emissiveIntensity = 0.45 + (breath + 1) * 0.24;
    }

    // 🧠 3. Brain: Rapid Neural Synapses
    if (this.organs.brain) {
      const synPulse = 0.5 + 0.5 * Math.sin(time * 7.5) * Math.cos(time * 3.2);
      this.organs.brain.baseMat.emissiveIntensity = 0.45 + synPulse * 0.55;
    }

    // 🥗 4. Stomach: Gastrointestinal Churning
    if (this.organs.stomach) {
      const digest = Math.sin(time * 2.2);
      this.organs.stomach.group.scale.y = 1.0 + digest * 0.06;
      this.organs.stomach.group.scale.x = 1.0 - digest * 0.05;
      this.organs.stomach.baseMat.emissiveIntensity = 0.45 + Math.abs(digest) * 0.4;
    }

    // 🥢 5. Esophagus: Peristalsis Swallowing Wave
    if (this.organs.esophagus) {
      const wave = Math.sin(time * 3.0);
      this.organs.esophagus.baseMat.emissiveIntensity = 0.45 + Math.max(0, wave) * 0.6;
    }

    // 👁️ 6. Eyes: Visual Focus Glow
    if (this.organs.eye) {
      const eyeGlow = Math.sin(time * 1.5);
      this.organs.eye.baseMat.emissiveIntensity = 0.45 + Math.max(0, eyeGlow) * 0.55;
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

  renderFallback() {
    this.container.innerHTML = `
      <div class="fallback-anatomy-stage" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;background:radial-gradient(circle at 50% 50%, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%);padding:20px;box-sizing:border-box;">
        <svg viewBox="0 0 400 680" style="max-height:92%;width:auto;filter:drop-shadow(0 10px 20px rgba(2, 132, 199, 0.15));" dir="ltr">
          <ellipse cx="200" cy="640" rx="140" ry="26" fill="none" stroke="#38bdf8" stroke-width="2.5" opacity="0.6"/>
          <ellipse cx="200" cy="640" rx="90" ry="16" fill="none" stroke="#0284c7" stroke-width="1.8" opacity="0.4"/>
          <ellipse cx="200" cy="85" rx="42" ry="52" fill="#bae6fd" fill-opacity="0.3" stroke="#38bdf8" stroke-width="2"/>
          <rect x="186" y="132" width="28" height="26" rx="6" fill="#bae6fd" fill-opacity="0.3" stroke="#38bdf8" stroke-width="2"/>
          <path d="M 140 160 C 130 200, 145 280, 160 320 C 150 350, 145 380, 155 410 L 245 410 C 255 380, 250 350, 240 320 C 255 280, 270 200, 260 160 Z" fill="#bae6fd" fill-opacity="0.25" stroke="#38bdf8" stroke-width="2"/>
          <path d="M 140 165 C 110 220, 95 300, 85 370" fill="none" stroke="#38bdf8" stroke-width="12" stroke-linecap="round" opacity="0.3"/>
          <path d="M 260 165 C 290 220, 305 300, 315 370" fill="none" stroke="#38bdf8" stroke-width="12" stroke-linecap="round" opacity="0.3"/>
          <path d="M 172 410 C 170 470, 165 540, 160 630" fill="none" stroke="#38bdf8" stroke-width="22" stroke-linecap="round" opacity="0.28"/>
          <path d="M 228 410 C 230 470, 235 540, 240 630" fill="none" stroke="#38bdf8" stroke-width="22" stroke-linecap="round" opacity="0.28"/>
          <g class="fallback-organ-node" data-organ="brain" style="cursor:pointer;" transform="translate(200, 80)">
            <circle r="26" fill="#8b5cf6" fill-opacity="0.35" stroke="#a855f7" stroke-width="3">
              <animate attributeName="r" values="24;28;24" dur="1.8s" repeatCount="indefinite"/>
            </circle>
            <text text-anchor="middle" dominant-baseline="central" font-size="22">🧠</text>
          </g>
          <g class="fallback-organ-node" data-organ="eye" style="cursor:pointer;" transform="translate(200, 96)">
            <circle r="14" fill="#0284c7" fill-opacity="0.4" stroke="#38bdf8" stroke-width="2"/>
            <text text-anchor="middle" dominant-baseline="central" font-size="14">👁️</text>
          </g>
          <g class="fallback-organ-node" data-organ="esophagus" style="cursor:pointer;" transform="translate(200, 185)">
            <line x1="0" y1="-25" x2="0" y2="35" stroke="#f97316" stroke-width="6" stroke-linecap="round" stroke-dasharray="4,3"/>
            <circle cx="0" cy="5" r="16" fill="#f97316" fill-opacity="0.4" stroke="#ea580c" stroke-width="2"/>
            <text text-anchor="middle" dominant-baseline="central" y="5" font-size="15">🥢</text>
          </g>
          <g class="fallback-organ-node" data-organ="lungs" style="cursor:pointer;" transform="translate(170, 215)">
            <circle r="26" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-width="2.5">
              <animate attributeName="r" values="24;29;24" dur="2.4s" repeatCount="indefinite"/>
            </circle>
            <text text-anchor="middle" dominant-baseline="central" font-size="20">🫁</text>
          </g>
          <g class="fallback-organ-node" data-organ="heart" style="cursor:pointer;" transform="translate(225, 230)">
            <circle r="24" fill="#ef4444" fill-opacity="0.35" stroke="#dc2626" stroke-width="2.5">
              <animate attributeName="r" values="22;27;22" dur="1.2s" repeatCount="indefinite"/>
            </circle>
            <text text-anchor="middle" dominant-baseline="central" font-size="20">🫀</text>
          </g>
          <g class="fallback-organ-node" data-organ="stomach" style="cursor:pointer;" transform="translate(185, 305)">
            <circle r="24" fill="#10b981" fill-opacity="0.35" stroke="#059669" stroke-width="2.5">
              <animate attributeName="r" values="23;26;23" dur="2.8s" repeatCount="indefinite"/>
            </circle>
            <text text-anchor="middle" dominant-baseline="central" font-size="20">🥗</text>
          </g>
        </svg>
      </div>
    `;
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
