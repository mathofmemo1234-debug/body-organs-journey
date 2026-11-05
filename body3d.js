/**
 * 🫀 Interactive 3D Human Anatomy Viewer (Three.js r128)
 * رحلة أعضاء الجسم الداخلية - المجسم التشريحي ثلاثي الأبعاد الحيوي والطبيعي
 *
 * Features:
 * - Lifelike, warm anatomical human body silhouette with natural facial features, limbs, hands & feet
 * - Complete anatomical ivory skeleton (Skull vault, spine with discs, rib cage, sternum, clavicles, pelvis, arm & leg bones)
 * - Full cardiovascular network (Aorta, Carotids, Subclavian/Brachial, Iliac/Femoral Arteries & Vena Cava)
 * - 6 Lifelike, organically sculpted 3D internal organs with realistic biological colors:
 *     🫀 Heart: Asymmetrical ventricles, atria, coronary sulcus & vessels, aortic arch with 3 branches, vena cava, pulmonary trunk
 *     🫁 Lungs: Spongy rose-pink 3-lobe right lung, 2-lobe left lung with cardiac notch, C-ringed trachea & bronchial tree
 *     🧠 Brain: Convoluted cerebral hemispheres (gyri & sulci folds), temporal lobes, foliated cerebellum, brainstem & optic tract
 *     🥗 Stomach: Seamless curved J-shaped gastric organ (cardia, fundus dome, greater/lesser curvature body, pylorus, duodenum)
 *     🥢 Esophagus: Muscular conduit with circular fibers connecting pharynx to gastric cardia
 *     👁️ Eyes: Pearlescent sclera, multi-layered iris, pupil, corneal dome, eyebrows & optic nerves
 * - Hover Interaction: Displays organ image preview + Arabic name + "انقر هنا للتفاصيل"
 * - Strict Pulse Toggle: Turning off "وميض الوظائف" immediately stops all pulsing/flashing and resets organs to calm rest state
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

    // Preloaded 2D images of the 6 organs for the 3D hover badge & tooltip
    this.organImagesMap = {
      heart: 'assets/heart.png',
      lungs: 'assets/lungs.png',
      brain: 'assets/brain.png',
      stomach: 'assets/stomach.png',
      esophagus: 'assets/esophagus.png',
      eye: 'assets/eye.png'
    };
    this.loadedOrganImgs = {};
    this.preloadOrganImages();

    // Materials
    this.bodyShellMaterial = null;
    this.bodyInnerMaterial = null;
    this.bodyWireMaterial = null;
    this.boneMaterial = null;
    this.cartilageMaterial = null;
    this.arteryMaterial = null;
    this.veinMaterial = null;

    // Animation & Config States
    this.pulseEnabled = true;
    this.autoRotateEnabled = true;
    this.opacityIndex = 0;
    this.opacityLevels = [
      { name: 'شفافية تشريحية واقعية (42%)', val: 0.42, wire: 0.0, vasc: 0.92, skel: 0.65, mode: 'xray' },
      { name: 'زجاجي فائق (18%)', val: 0.18, wire: 0.0, vasc: 0.96, skel: 0.45, mode: 'glass' },
      { name: 'عزل الأعضاء الستة فقط', val: 0.0, wire: 0.0, vasc: 0.0, skel: 0.0, mode: 'hidden' },
      { name: 'مجسم بشري طبيعي (78%)', val: 0.78, wire: 0.0, vasc: 0.45, skel: 0.35, mode: 'solid' }
    ];

    // Default framed camera position (Frames entire body from head to feet below top buttons)
    this.defaultCamPos = new THREE.Vector3(0.0, 3.0, 24.0);
    this.defaultLookAt = new THREE.Vector3(0.0, 3.0, 0.0);

    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.isDragging = false;
    this.pointerDownPos = { x: 0, y: 0 };

    // Camera animation state
    this.cameraTarget = {
      pos: this.defaultCamPos.clone(),
      lookAt: this.defaultLookAt.clone(),
      active: false,
      progress: 0,
      duration: 1.15,
      startPos: new THREE.Vector3(),
      startLookAt: new THREE.Vector3()
    };

    // Highlight beacon & in-scene 3D hover label sprite
    this.beaconMesh = null;
    this.pedestalGroup = null;
    this.hoverLabelSprite = null;
    this.labelCanvas = null;
    this.labelContext = null;
    this.labelTexture = null;

    this.init();
  }

  preloadOrganImages() {
    Object.keys(this.organImagesMap).forEach((key) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.loadedOrganImgs[key] = img;
        if (this.hoveredOrgan === key && this.organs[key]) {
          this.update3DHoverLabel(this.organs[key], true);
        }
      };
      img.src = this.organImagesMap[key];
    });
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
      this.buildNaturalHumanSilhouette();
      this.buildRealisticSkeleton();
      this.buildCardiovascularNetwork();
      this.buildInternalOrgans();
      this.buildHighlightBeacon();
      this.build3DHoverLabelSprite();
      this.setupControls();
      this.setupEventListeners();
      this.setupDOMBindings();

      if (this.camera) {
        this.camera.lookAt(this.defaultLookAt);
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
      window.__initError = err.message + '\n' + err.stack;
      console.error('3D INIT ERROR:', err);
      this.renderFallback();
      this.setupDOMBindings();
    }
  }

  setupScene() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 560;

    this.scene = new THREE.Scene();
    // Deep studio fog that blends with the dark medical studio backdrop without washing out the body
    this.scene.fog = new THREE.FogExp2(0x0b162c, 0.010);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.copy(this.defaultCamPos);

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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    this.scene.add(this.bodyGroup);
    this.scene.add(this.skeletonGroup);
    this.scene.add(this.vascularGroup);
    this.scene.add(this.organsGroup);
    this.scene.add(this.effectsGroup);
  }

  setupMaterials() {
    // 🌟 Lifelike Warm Translucent Human Skin & Subsurface Tissue
    this.bodyShellMaterial = new THREE.MeshPhongMaterial({
      color: 0xefb99b,
      emissive: 0x6b2d14,
      emissiveIntensity: 0.18,
      specular: 0xffe4d6,
      shininess: 42,
      transparent: true,
      opacity: 0.50,
      depthWrite: false,
      side: THREE.FrontSide
    });

    this.bodyWireMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });

    // Warm Ivory Anatomical Bone Material
    this.boneMaterial = new THREE.MeshPhongMaterial({
      color: 0xfef3c7,
      emissive: 0x78350f,
      emissiveIntensity: 0.16,
      specular: 0xffffff,
      shininess: 55,
      transparent: true,
      opacity: 0.65
    });

    // Costal & Intervertebral Cartilage Material
    this.cartilageMaterial = new THREE.MeshPhongMaterial({
      color: 0xbae6fd,
      emissive: 0x0369a1,
      emissiveIntensity: 0.18,
      specular: 0xffffff,
      shininess: 70,
      transparent: true,
      opacity: 0.58
    });

    // Arterial Blood Vessels (Rich Oxygenated Crimson)
    this.arteryMaterial = new THREE.MeshPhongMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 0.45,
      specular: 0xffcccc,
      shininess: 85,
      transparent: true,
      opacity: 0.92
    });

    // Venous Blood Vessels (Deep Venous Blue)
    this.veinMaterial = new THREE.MeshPhongMaterial({
      color: 0x2563eb,
      emissive: 0x1e40af,
      emissiveIntensity: 0.40,
      specular: 0xbfdbfe,
      shininess: 85,
      transparent: true,
      opacity: 0.90
    });
  }

  setupLights() {
    // Natural Warm Studio Ambient Light
    const ambientLight = new THREE.AmbientLight(0xfff5eb, 0.78);
    this.scene.add(ambientLight);

    // Hemisphere Light for Natural Top-to-Bottom Biological Shading
    const hemiLight = new THREE.HemisphereLight(0xffe4d6, 0x1e3a5f, 0.58);
    hemiLight.position.set(0, 12, 0);
    this.scene.add(hemiLight);

    // Warm Main Studio Key Light
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.08);
    keyLight.position.set(6, 11, 10);
    this.scene.add(keyLight);

    // Soft Cool Anatomical Fill Light
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.58);
    fillLight.position.set(-7, 6, 7);
    this.scene.add(fillLight);

    // Rim / Backlight for 3D Silhouette Contour Separation
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    rimLight.position.set(0, 8, -10);
    this.scene.add(rimLight);

    // Subtle Thoracic Warm Vitality Glow
    this.thoracicLight = new THREE.PointLight(0xfda4af, 0.42, 11);
    this.thoracicLight.position.set(0, 4.3, 1.1);
    this.effectsGroup.add(this.thoracicLight);
  }

  buildPedestal() {
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.y = -5.65;

    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const ring1 = new THREE.Mesh(new THREE.RingGeometry(2.35, 2.45, 64), ringMat1);
    ring1.rotation.x = Math.PI / 2;
    pedestalGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.40,
      side: THREE.DoubleSide
    });
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.62, 48), ringMat2);
    ring2.rotation.x = Math.PI / 2;
    pedestalGroup.add(ring2);

    const discMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(3.1, 48), discMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.y = -0.02;
    pedestalGroup.add(disc);

    const tickCount = 36;
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.70 });
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.20), tickMat);
      tick.rotation.x = Math.PI / 2;
      tick.rotation.z = angle;
      tick.position.set(Math.cos(angle) * 2.55, 0, Math.sin(angle) * 2.55);
      pedestalGroup.add(tick);
    }

    this.effectsGroup.add(pedestalGroup);
    this.pedestalGroup = pedestalGroup;
  }

  /**
   * 🌟 Lifelike Anatomically Sculpted Human Body Silhouette
   */
  buildNaturalHumanSilhouette() {
    const addPart = (geo, pos, rot, scale, customMat) => {
      const mat = customMat || this.bodyShellMaterial;
      const mesh = new THREE.Mesh(geo, mat);
      if (pos) mesh.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
      if (rot) mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
      if (scale) mesh.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
      this.bodyGroup.add(mesh);
      return mesh;
    };

    // 1. HEAD & FACIAL FEATURES
    // Cranial Vault
    addPart(new THREE.SphereGeometry(0.92, 32, 28), { x: 0, y: 7.42, z: 0.02 }, null, { x: 0.89, y: 1.08, z: 1.04 });

    // Forehead & Supraorbital Brow Ridge
    addPart(new THREE.CylinderGeometry(0.56, 0.60, 0.30, 24), { x: 0, y: 7.38, z: 0.45 }, { x: 0.14, y: 0, z: 0 }, { x: 1.06, y: 1, z: 0.65 });

    // Mid-face & Maxilla
    addPart(new THREE.CylinderGeometry(0.56, 0.46, 0.56, 24), { x: 0, y: 7.02, z: 0.34 }, { x: 0.12, y: 0, z: 0 }, { x: 0.94, y: 1, z: 0.88 });

    // Lower Jaw (Mandible) & Chin
    addPart(new THREE.CylinderGeometry(0.46, 0.30, 0.52, 24), { x: 0, y: 6.72, z: 0.32 }, { x: 0.22, y: 0, z: 0 }, { x: 0.90, y: 1, z: 0.86 });
    addPart(new THREE.SphereGeometry(0.22, 20, 18), { x: 0, y: 6.52, z: 0.52 }, null, { x: 1.05, y: 0.82, z: 1.0 });

    // Nose Bridge, Apex & Nostrils
    addPart(new THREE.ConeGeometry(0.11, 0.42, 16), { x: 0, y: 7.16, z: 0.86 }, { x: 0.34, y: 0, z: 0 });
    addPart(new THREE.SphereGeometry(0.085, 14, 14), { x: 0, y: 7.00, z: 0.94 }, null, { x: 1.15, y: 0.85, z: 1.0 });

    // Natural Lips (Upper & Lower Vermilion Contour)
    const lipMat = new THREE.MeshPhongMaterial({
      color: 0xd9776c,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    addPart(new THREE.SphereGeometry(0.14, 16, 12), { x: 0, y: 6.80, z: 0.78 }, null, { x: 1.45, y: 0.32, z: 0.65 }, lipMat);
    addPart(new THREE.SphereGeometry(0.13, 16, 12), { x: 0, y: 6.73, z: 0.77 }, null, { x: 1.35, y: 0.36, z: 0.65 }, lipMat);

    // Eyebrows (Left & Right) for lifelike human expression
    const browHairMat = new THREE.MeshPhongMaterial({
      color: 0x451a03,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    const browCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.14, 7.56, 0.84),
      new THREE.Vector3(-0.34, 7.60, 0.80),
      new THREE.Vector3(-0.52, 7.53, 0.68)
    ]);
    const browCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.14, 7.56, 0.84),
      new THREE.Vector3(0.34, 7.60, 0.80),
      new THREE.Vector3(0.52, 7.53, 0.68)
    ]);
    this.bodyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(browCurveL, 12, 0.026, 8, false), browHairMat));
    this.bodyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(browCurveR, 12, 0.026, 8, false), browHairMat));

    // Cheekbones & Ears
    const cheekGeo = new THREE.SphereGeometry(0.25, 18, 16);
    addPart(cheekGeo, { x: -0.48, y: 7.12, z: 0.46 }, null, { x: 0.82, y: 1, z: 0.88 });
    addPart(cheekGeo, { x: 0.48, y: 7.12, z: 0.46 }, null, { x: 0.82, y: 1, z: 0.88 });

    const earGeo = new THREE.TorusGeometry(0.18, 0.055, 12, 22, Math.PI * 0.95);
    addPart(earGeo, { x: -0.84, y: 7.20, z: 0.04 }, { x: 0.1, y: -0.28, z: Math.PI * 0.6 });
    addPart(earGeo, { x: 0.84, y: 7.20, z: 0.04 }, { x: 0.1, y: 0.28, z: -Math.PI * 0.6 });

    // 2. NECK & SHOULDERS (Trapezius & Sternocleidomastoid)
    addPart(new THREE.CylinderGeometry(0.41, 0.52, 0.90, 28), { x: 0, y: 6.30, z: 0.04 }, null, { x: 0.95, y: 1, z: 1.0 });
    // Trapezius slopes
    addPart(new THREE.CylinderGeometry(0.45, 1.35, 0.65, 28), { x: 0, y: 5.95, z: -0.02 }, null, { x: 1.18, y: 1, z: 0.68 });

    // 3. TORSO (Thorax, Pectorals, Abdomen, Waist & Pelvis)
    // Thorax
    addPart(new THREE.CylinderGeometry(1.36, 1.16, 1.65, 32), { x: 0, y: 5.15, z: 0.06 }, null, { x: 1.20, y: 1, z: 0.86 });

    // Pectoral Muscles
    const pecGeo = new THREE.SphereGeometry(0.58, 24, 20);
    addPart(pecGeo, { x: -0.54, y: 5.14, z: 0.48 }, { x: 0.16, y: 0, z: 0.08 }, { x: 1.04, y: 0.78, z: 0.58 });
    addPart(pecGeo, { x: 0.54, y: 5.14, z: 0.48 }, { x: 0.16, y: 0, z: -0.08 }, { x: 1.04, y: 0.78, z: 0.58 });

    // Abdomen & Waist
    addPart(new THREE.CylinderGeometry(1.12, 1.02, 1.45, 30), { x: 0, y: 3.75, z: 0.04 }, null, { x: 1.08, y: 1, z: 0.80 });

    // Pelvis & Hips
    addPart(new THREE.CylinderGeometry(1.02, 1.22, 1.48, 30), { x: 0, y: 2.38, z: 0.02 }, null, { x: 1.15, y: 1, z: 0.84 });

    // Gluteal Contours
    const gluteGeo = new THREE.SphereGeometry(0.64, 22, 20);
    addPart(gluteGeo, { x: -0.52, y: 2.04, z: -0.30 }, null, { x: 1.0, y: 1.05, z: 0.86 });
    addPart(gluteGeo, { x: 0.52, y: 2.04, z: -0.30 }, null, { x: 1.0, y: 1.05, z: 0.86 });

    // 4. ARMS, FOREAMS & 5-FINGER HANDS
    const deltoidGeo = new THREE.SphereGeometry(0.54, 24, 22);
    addPart(deltoidGeo, { x: -1.74, y: 5.58, z: 0.02 }, null, { x: 1.02, y: 1.0, z: 0.92 });
    addPart(deltoidGeo, { x: 1.74, y: 5.58, z: 0.02 }, null, { x: 1.02, y: 1.0, z: 0.92 });

    const armUpperGeo = new THREE.CylinderGeometry(0.35, 0.29, 1.70, 22);
    addPart(armUpperGeo, { x: -1.98, y: 4.38, z: 0.02 }, { x: 0, y: 0, z: 0.11 });
    addPart(armUpperGeo, { x: 1.98, y: 4.38, z: 0.02 }, { x: 0, y: 0, z: -0.11 });

    const elbowGeo = new THREE.SphereGeometry(0.27, 18, 18);
    addPart(elbowGeo, { x: -2.14, y: 3.42, z: 0.03 });
    addPart(elbowGeo, { x: 2.14, y: 3.42, z: 0.03 });

    const armForeGeo = new THREE.CylinderGeometry(0.29, 0.21, 1.64, 22);
    addPart(armForeGeo, { x: -2.28, y: 2.50, z: 0.06 }, { x: 0.04, y: 0, z: 0.12 });
    addPart(armForeGeo, { x: 2.28, y: 2.50, z: 0.06 }, { x: 0.04, y: 0, z: -0.12 });

    const createDetailedHand = (isLeft) => {
      const sign = isLeft ? -1 : 1;
      const handGroup = new THREE.Group();
      handGroup.position.set(sign * 2.48, 1.48, 0.10);
      handGroup.rotation.z = sign * 0.08;

      const palm = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), this.bodyShellMaterial);
      palm.scale.set(0.85, 1.25, 0.48);
      handGroup.add(palm);

      // Thumb
      const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.036, 0.26, 10), this.bodyShellMaterial);
      thumb.position.set(-sign * 0.16, -0.02, 0.06);
      thumb.rotation.z = sign * 0.58;
      handGroup.add(thumb);

      // 4 Individual Sculpted Fingers
      const fingerLengths = [0.32, 0.36, 0.33, 0.26];
      for (let f = 0; f < 4; f++) {
        const fx = (f - 1.5) * 0.072 * sign;
        const fLen = fingerLengths[f];
        const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, fLen, 10), this.bodyShellMaterial);
        finger.position.set(fx, -0.22 - fLen * 0.4, 0.02);
        finger.rotation.x = 0.10;
        handGroup.add(finger);
      }

      this.bodyGroup.add(handGroup);
    };
    createDetailedHand(true);
    createDetailedHand(false);

    // 5. LOWER LIMBS (Thighs, Knees, Calves, Ankles & Feet)
    const thighGeo = new THREE.CylinderGeometry(0.58, 0.42, 2.85, 26);
    addPart(thighGeo, { x: -0.65, y: 0.32, z: 0.02 }, { x: -0.02, y: 0, z: 0.03 });
    addPart(thighGeo, { x: 0.65, y: 0.32, z: 0.02 }, { x: -0.02, y: 0, z: -0.03 });

    const kneeGeo = new THREE.SphereGeometry(0.38, 22, 22);
    addPart(kneeGeo, { x: -0.69, y: -1.24, z: 0.06 }, null, { x: 0.94, y: 1.06, z: 1.02 });
    addPart(kneeGeo, { x: 0.69, y: -1.24, z: 0.06 }, null, { x: 0.94, y: 1.06, z: 1.02 });

    const calfGeo = new THREE.CylinderGeometry(0.42, 0.26, 3.20, 26);
    addPart(calfGeo, { x: -0.72, y: -2.98, z: 0.02 }, { x: 0.03, y: 0, z: 0.02 });
    addPart(calfGeo, { x: 0.72, y: -2.98, z: 0.02 }, { x: 0.03, y: 0, z: -0.02 });

    const ankleGeo = new THREE.SphereGeometry(0.24, 16, 16);
    addPart(ankleGeo, { x: -0.75, y: -4.65, z: 0.04 }, null, { x: 1.15, y: 0.82, z: 1.0 });
    addPart(ankleGeo, { x: 0.75, y: -4.65, z: 0.04 }, null, { x: 1.15, y: 0.82, z: 1.0 });

    const createFoot = (isLeft) => {
      const sign = isLeft ? -1 : 1;
      const footGroup = new THREE.Group();
      footGroup.position.set(sign * 0.76, -5.02, 0.22);

      const heel = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), this.bodyShellMaterial);
      heel.position.set(0, 0, -0.26);
      heel.scale.set(0.88, 1.0, 1.18);
      footGroup.add(heel);

      const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.72, 18), this.bodyShellMaterial);
      arch.rotation.x = Math.PI / 2;
      arch.position.set(0, -0.02, 0.12);
      arch.scale.set(1.12, 1.0, 0.72);
      footGroup.add(arch);

      const toes = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), this.bodyShellMaterial);
      toes.position.set(0, -0.06, 0.50);
      toes.scale.set(1.12, 0.55, 0.85);
      footGroup.add(toes);

      this.bodyGroup.add(footGroup);
    };
    createFoot(true);
    createFoot(false);
  }

  /**
   * 🦴 Complete Realistic Anatomical Skeleton
   * Includes Translucent Cranium, Spine with Intervertebral Discs, Rib Cage, Sternum, Clavicles, Pelvis & Limb Bones
   */
  buildRealisticSkeleton() {
    // 1. Translucent Cranial Skull Vault & Mandible Bone
    const skullVaultMat = this.boneMaterial.clone();
    skullVaultMat.opacity = 0.28;
    const craniumBone = new THREE.Mesh(new THREE.SphereGeometry(0.82, 24, 22), skullVaultMat);
    craniumBone.position.set(0, 7.42, 0.02);
    craniumBone.scale.set(0.88, 1.06, 1.02);
    this.skeletonGroup.add(craniumBone);

    // 2. Vertebral Column (24 Vertebrae + Cartilaginous Intervertebral Discs)
    const vertebraeCount = 24;
    for (let i = 0; i < vertebraeCount; i++) {
      const t = i / vertebraeCount;
      const y = 6.45 - (i * 0.205);

      let z = -0.15;
      if (t < 0.25) {
        z = -0.12 + Math.sin(t * Math.PI * 4) * 0.07;
      } else if (t < 0.7) {
        z = -0.30 - Math.sin((t - 0.25) / 0.45 * Math.PI) * 0.15;
      } else {
        z = -0.20 + Math.sin((t - 0.7) / 0.3 * Math.PI) * 0.11;
      }

      const vRadius = 0.20 + (t * 0.08);
      const vMesh = new THREE.Mesh(new THREE.CylinderGeometry(vRadius, vRadius * 1.04, 0.13, 16), this.boneMaterial);
      vMesh.position.set(0, y, z);
      this.skeletonGroup.add(vMesh);

      // Intervertebral Fibrocartilage Disc
      if (i < vertebraeCount - 1) {
        const discMesh = new THREE.Mesh(new THREE.CylinderGeometry(vRadius * 0.96, vRadius * 0.96, 0.055, 16), this.cartilageMaterial);
        discMesh.position.set(0, y - 0.10, z);
        this.skeletonGroup.add(discMesh);
      }
    }

    // Sacrum
    const sacrumMesh = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.82, 16), this.boneMaterial);
    sacrumMesh.position.set(0, 1.72, -0.25);
    sacrumMesh.rotation.x = Math.PI - 0.28;
    this.skeletonGroup.add(sacrumMesh);

    // 3. Sternum (Manubrium, Body, Xiphoid Process)
    const sternumGroup = new THREE.Group();
    sternumGroup.position.set(0, 5.52, 0.80);

    const manubrium = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.34, 8), this.boneMaterial);
    manubrium.scale.set(1.1, 1, 0.35);
    sternumGroup.add(manubrium);

    const sternalBody = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.96, 8), this.boneMaterial);
    sternalBody.position.y = -0.64;
    sternalBody.scale.set(1.1, 1, 0.32);
    sternumGroup.add(sternalBody);

    const xiphoid = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 8), this.cartilageMaterial);
    xiphoid.position.set(0, -1.22, 0);
    xiphoid.rotation.z = Math.PI;
    xiphoid.scale.set(1, 1, 0.35);
    sternumGroup.add(xiphoid);

    this.skeletonGroup.add(sternumGroup);

    // 4. S-Curved Clavicles & Scapulae
    const buildClavicle = (isLeft) => {
      const sign = isLeft ? -1 : 1;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 0.16, 5.78, 0.72),
        new THREE.Vector3(sign * 0.82, 5.88, 0.56),
        new THREE.Vector3(sign * 1.56, 5.72, 0.18)
      ]);
      this.skeletonGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.062, 10, false), this.boneMaterial));
    };
    buildClavicle(true);
    buildClavicle(false);

    // 5. 10 Pairs of Anatomical Ribs (Wrapping from Spine around Lungs/Heart to Sternum)
    for (let i = 0; i < 10; i++) {
      const y = 5.62 - (i * 0.215);
      const radius = 1.08 + Math.sin((i / 9) * Math.PI) * 0.16 - (i * 0.025);
      const tubeRadius = 0.036;
      const arcAngle = i < 7 ? Math.PI * 0.76 : Math.PI * 0.58;

      const ribGeoR = new THREE.TorusGeometry(radius, tubeRadius, 8, 28, arcAngle);
      const ribRight = new THREE.Mesh(ribGeoR, this.boneMaterial);
      ribRight.position.set(0.10, y, -0.02);
      ribRight.rotation.x = Math.PI * 0.55;
      ribRight.rotation.y = 0.14;
      ribRight.rotation.z = -Math.PI * 0.36;
      this.skeletonGroup.add(ribRight);

      const ribGeoL = new THREE.TorusGeometry(radius, tubeRadius, 8, 28, arcAngle);
      const ribLeft = new THREE.Mesh(ribGeoL, this.boneMaterial);
      ribLeft.position.set(-0.10, y, -0.02);
      ribLeft.rotation.x = Math.PI * 0.55;
      ribLeft.rotation.y = -0.14;
      ribLeft.rotation.z = Math.PI * 0.64;
      this.skeletonGroup.add(ribLeft);
    }

    // 6. Pelvic Girdle (Iliac Crests & Pubic Symphysis)
    const pelvisGroup = new THREE.Group();
    pelvisGroup.position.set(0, 2.28, 0.02);

    const iliacGeo = new THREE.TorusGeometry(0.82, 0.13, 12, 28, Math.PI * 0.78);
    const iliacL = new THREE.Mesh(iliacGeo, this.boneMaterial);
    iliacL.position.set(-0.34, 0.10, 0);
    iliacL.rotation.y = 0.35;
    iliacL.rotation.z = Math.PI * 0.38;
    pelvisGroup.add(iliacL);

    const iliacR = new THREE.Mesh(iliacGeo, this.boneMaterial);
    iliacR.position.set(0.34, 0.10, 0);
    iliacR.rotation.y = -0.35;
    iliacR.rotation.z = -Math.PI * 0.38;
    pelvisGroup.add(iliacR);

    this.skeletonGroup.add(pelvisGroup);

    // 7. Upper & Lower Limb Bones (Humerus, Radius/Ulna, Femur, Patella, Tibia/Fibula)
    const buildLimbBones = (isLeft) => {
      const sign = isLeft ? -1 : 1;

      // Humerus (Upper Arm Bone)
      const humerusCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 1.68, 5.54, 0.02),
        new THREE.Vector3(sign * 1.96, 4.42, 0.02),
        new THREE.Vector3(sign * 2.12, 3.44, 0.03)
      ]);
      this.skeletonGroup.add(new THREE.Mesh(new THREE.TubeGeometry(humerusCurve, 14, 0.085, 10, false), this.boneMaterial));

      // Radius & Ulna (Forearm Bones)
      const radiusCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 2.16, 3.40, 0.04),
        new THREE.Vector3(sign * 2.34, 2.48, 0.07),
        new THREE.Vector3(sign * 2.48, 1.68, 0.09)
      ]);
      const ulnaCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 2.10, 3.40, 0.01),
        new THREE.Vector3(sign * 2.24, 2.48, 0.03),
        new THREE.Vector3(sign * 2.38, 1.68, 0.06)
      ]);
      this.skeletonGroup.add(new THREE.Mesh(new THREE.TubeGeometry(radiusCurve, 12, 0.052, 8, false), this.boneMaterial));
      this.skeletonGroup.add(new THREE.Mesh(new THREE.TubeGeometry(ulnaCurve, 12, 0.048, 8, false), this.boneMaterial));

      // Femur (Thigh Bone with Femoral Neck & Head)
      const femurCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 0.82, 2.02, 0.02),
        new THREE.Vector3(sign * 0.72, 1.72, 0.03),
        new THREE.Vector3(sign * 0.66, 0.35, 0.04),
        new THREE.Vector3(sign * 0.68, -1.18, 0.05)
      ]);
      this.skeletonGroup.add(new THREE.Mesh(new THREE.TubeGeometry(femurCurve, 18, 0.115, 12, false), this.boneMaterial));

      // Patella (Kneecap)
      const patella = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), this.boneMaterial);
      patella.position.set(sign * 0.69, -1.24, 0.18);
      patella.scale.set(0.95, 1.1, 0.55);
      this.skeletonGroup.add(patella);

      // Tibia & Fibula (Lower Leg Bones)
      const tibiaCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 0.68, -1.32, 0.05),
        new THREE.Vector3(sign * 0.71, -2.98, 0.03),
        new THREE.Vector3(sign * 0.74, -4.62, 0.04)
      ]);
      const fibulaCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 0.78, -1.38, 0.01),
        new THREE.Vector3(sign * 0.80, -2.98, 0.00),
        new THREE.Vector3(sign * 0.81, -4.60, 0.02)
      ]);
      this.skeletonGroup.add(new THREE.Mesh(new THREE.TubeGeometry(tibiaCurve, 16, 0.095, 10, false), this.boneMaterial));
      this.skeletonGroup.add(new THREE.Mesh(new THREE.TubeGeometry(fibulaCurve, 14, 0.048, 8, false), this.boneMaterial));
    };
    buildLimbBones(true);
    buildLimbBones(false);
  }

  /**
   * 🩸 Complete Cardiovascular Network
   */
  buildCardiovascularNetwork() {
    // Descending Thoracic & Abdominal Aorta
    const aortaPoints = [
      new THREE.Vector3(-0.05, 4.55, 0.38),
      new THREE.Vector3(0.02, 5.05, 0.22),
      new THREE.Vector3(0.06, 4.80, -0.06),
      new THREE.Vector3(0.04, 3.75, -0.10),
      new THREE.Vector3(0.02, 2.55, -0.06)
    ];
    const aortaCurve = new THREE.CatmullRomCurve3(aortaPoints);
    this.vascularGroup.add(new THREE.Mesh(new THREE.TubeGeometry(aortaCurve, 28, 0.072, 12, false), this.arteryMaterial));

    // Superior & Inferior Vena Cava
    const vcPoints = [
      new THREE.Vector3(0.24, 5.55, 0.20),
      new THREE.Vector3(0.22, 4.62, 0.28),
      new THREE.Vector3(0.18, 3.60, 0.05),
      new THREE.Vector3(0.14, 2.55, -0.04)
    ];
    const vcCurve = new THREE.CatmullRomCurve3(vcPoints);
    this.vascularGroup.add(new THREE.Mesh(new THREE.TubeGeometry(vcCurve, 24, 0.075, 12, false), this.veinMaterial));

    const buildSideVessels = (isLeft) => {
      const sign = isLeft ? -1 : 1;

      // Common Carotid Arteries & Internal Jugular Veins (Neck to Brain)
      const carotidPts = [
        new THREE.Vector3(sign * 0.08, 5.05, 0.20),
        new THREE.Vector3(sign * 0.20, 6.25, 0.24),
        new THREE.Vector3(sign * 0.18, 7.12, 0.14)
      ];
      this.vascularGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(carotidPts), 16, 0.036, 10, false), this.arteryMaterial));

      const jugularPts = [
        new THREE.Vector3(sign * 0.24, 7.08, 0.10),
        new THREE.Vector3(sign * 0.27, 6.20, 0.20),
        new THREE.Vector3(0.22, 5.45, 0.20)
      ];
      this.vascularGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(jugularPts), 16, 0.038, 10, false), this.veinMaterial));

      // Subclavian & Brachial Arteries (Arms)
      const armArteryPts = [
        new THREE.Vector3(sign * 0.10, 5.05, 0.18),
        new THREE.Vector3(sign * 1.15, 5.42, 0.16),
        new THREE.Vector3(sign * 1.88, 4.42, 0.06),
        new THREE.Vector3(sign * 2.14, 3.32, 0.05),
        new THREE.Vector3(sign * 2.34, 1.95, 0.08)
      ];
      this.vascularGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(armArteryPts), 24, 0.034, 10, false), this.arteryMaterial));

      // Iliac & Femoral Arteries & Saphenous Veins (Legs)
      const legArteryPts = [
        new THREE.Vector3(0.02, 2.55, -0.06),
        new THREE.Vector3(sign * 0.36, 1.98, 0.04),
        new THREE.Vector3(sign * 0.62, 0.65, 0.10),
        new THREE.Vector3(sign * 0.66, -1.24, 0.06),
        new THREE.Vector3(sign * 0.70, -3.45, 0.04)
      ];
      this.vascularGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(legArteryPts), 28, 0.042, 10, false), this.arteryMaterial));

      const legVeinPts = [
        new THREE.Vector3(0.14, 2.55, -0.04),
        new THREE.Vector3(sign * 0.42, 1.95, 0.02),
        new THREE.Vector3(sign * 0.56, 0.62, 0.08),
        new THREE.Vector3(sign * 0.60, -1.24, 0.04),
        new THREE.Vector3(sign * 0.64, -3.40, 0.02)
      ];
      this.vascularGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(legVeinPts), 28, 0.040, 10, false), this.veinMaterial));
    };
    buildSideVessels(true);
    buildSideVessels(false);
  }

  /**
   * 🌟 6 Lifelike Sculpted Internal Organs
   */
  buildInternalOrgans() {
    this.buildHeart();
    this.buildLungs();
    this.buildBrain();
    this.buildStomach();
    this.buildEsophagus();
    this.buildEyes();
  }

  // 🫀 1. HEART: Organic sculpted myocardium, ventricles, atria, coronary vessels, aortic arch & vena cava
  buildHeart() {
    const heartGroup = new THREE.Group();
    heartGroup.position.set(-0.22, 4.42, 0.42);

    const heartMat = new THREE.MeshPhongMaterial({
      color: 0xc81e1e,
      emissive: 0x6b0f0f,
      emissiveIntensity: 0.25,
      specular: 0xffd5d5,
      shininess: 88
    });

    // Sculpted Left & Right Ventricular Myocardium (Deformed Sphere for natural heart apex)
    const ventGeo = new THREE.SphereGeometry(0.46, 32, 28);
    const posAttr = ventGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);
      // Taper bottom into a rounded cardiac apex pointing down-left-forward
      if (y < 0) {
        const factor = 1.0 - Math.min(0.55, Math.abs(y) * 0.85);
        x *= factor;
        z *= factor;
        x -= Math.abs(y) * 0.22; // tilt apex left (viewer's right is negative X in anatomical? Wait: in scene +X is right of screen, -X is left of screen; anatomical left is +X! Wait: let's keep heart slightly toward -X or +X consistent with stomach)
        y *= 1.32;
      } else {
        y *= 0.88;
      }
      posAttr.setXYZ(i, x, y, z);
    }
    ventGeo.computeVertexNormals();
    const ventricles = new THREE.Mesh(ventGeo, heartMat);
    ventricles.rotation.z = -0.22;
    ventricles.rotation.x = 0.14;
    heartGroup.add(ventricles);

    // Right Atrium & Auricle
    const raMat = new THREE.MeshPhongMaterial({
      color: 0x991b1b,
      emissive: 0x450a0a,
      emissiveIntensity: 0.22,
      specular: 0xffcccc,
      shininess: 78
    });
    const rightAtrium = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 20), raMat);
    rightAtrium.position.set(0.26, 0.28, 0.04);
    rightAtrium.scale.set(0.92, 1.08, 0.88);
    heartGroup.add(rightAtrium);

    // Left Atrium & Auricle
    const leftAtrium = new THREE.Mesh(new THREE.SphereGeometry(0.26, 22, 20), heartMat);
    leftAtrium.position.set(-0.24, 0.30, -0.06);
    leftAtrium.scale.set(0.95, 1.0, 0.90);
    heartGroup.add(leftAtrium);

    // Epicardial Coronary Sulcus (Subtle yellow-gold adipose tissue groove)
    const fatMat = new THREE.MeshPhongMaterial({ color: 0xfde047, emissive: 0x713f12, emissiveIntensity: 0.18, shininess: 60 });
    const sulcusCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.28, 0.12, 0.26),
      new THREE.Vector3(0.04, 0.16, 0.39),
      new THREE.Vector3(-0.24, 0.18, 0.28)
    ]);
    heartGroup.add(new THREE.Mesh(new THREE.TubeGeometry(sulcusCurve, 16, 0.032, 8, false), fatMat));

    // Ascending Aorta & 180° Aortic Arch
    const aortaMat = new THREE.MeshPhongMaterial({ color: 0xdc2626, emissive: 0x7f1d1d, emissiveIntensity: 0.28, shininess: 90 });
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.24, 0.08),
      new THREE.Vector3(0.06, 0.56, 0.10),
      new THREE.Vector3(0.02, 0.72, -0.02),
      new THREE.Vector3(-0.10, 0.62, -0.18),
      new THREE.Vector3(-0.12, 0.28, -0.22)
    ]);
    const aortaArch = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 24, 0.105, 14, false), aortaMat);
    heartGroup.add(aortaArch);

    // 3 Supra-Aortic Vessels (Brachiocephalic, Left Common Carotid, Left Subclavian)
    for (let i = 0; i < 3; i++) {
      const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.038, 0.26, 10), aortaMat);
      bMesh.position.set(0.06 - (i * 0.065), 0.82, 0.02 - (i * 0.05));
      bMesh.rotation.z = (i - 1) * 0.12;
      heartGroup.add(bMesh);
    }

    // Pulmonary Artery Trunk & T-Bifurcation (Deoxygenated Blue-Purple)
    const paMat = new THREE.MeshPhongMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.25, shininess: 82 });
    const paCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.08, 0.18, 0.22),
      new THREE.Vector3(-0.06, 0.46, 0.20),
      new THREE.Vector3(-0.22, 0.52, 0.06)
    ]);
    heartGroup.add(new THREE.Mesh(new THREE.TubeGeometry(paCurve, 16, 0.085, 12, false), paMat));

    // Superior Vena Cava entering Right Atrium
    const svcMat = new THREE.MeshPhongMaterial({ color: 0x2563eb, emissive: 0x1e3a8a, emissiveIntensity: 0.25, shininess: 80 });
    const svcMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.082, 0.52, 14), svcMat);
    svcMesh.position.set(0.28, 0.54, -0.02);
    heartGroup.add(svcMesh);

    // Branching Coronary Arteries (LAD & Marginal Branches on Ventricular Surface)
    const corArtMat = new THREE.MeshBasicMaterial({ color: 0xff3b3b });
    const ladCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.20, 0.36),
      new THREE.Vector3(-0.06, -0.04, 0.42),
      new THREE.Vector3(-0.14, -0.28, 0.34),
      new THREE.Vector3(-0.20, -0.46, 0.20)
    ]);
    heartGroup.add(new THREE.Mesh(new THREE.TubeGeometry(ladCurve, 16, 0.022, 8, false), corArtMat));

    const diagCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.06, -0.02, 0.42),
      new THREE.Vector3(-0.22, -0.14, 0.35),
      new THREE.Vector3(-0.30, -0.28, 0.22)
    ]);
    heartGroup.add(new THREE.Mesh(new THREE.TubeGeometry(diagCurve, 12, 0.016, 8, false), corArtMat));

    const corVeinMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const veinCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.04, 0.16, 0.38),
      new THREE.Vector3(0.10, -0.08, 0.40),
      new THREE.Vector3(0.02, -0.32, 0.30)
    ]);
    heartGroup.add(new THREE.Mesh(new THREE.TubeGeometry(veinCurve, 12, 0.018, 8, false), corVeinMat));

    [ventricles, leftAtrium, rightAtrium, aortaArch].forEach((mesh) => {
      mesh.userData = { organId: 'heart', group: heartGroup, name: 'القلب', icon: '🫀' };
      this.raycastMeshes.push(mesh);
    });

    this.organs.heart = {
      id: 'heart',
      name: 'القلب',
      icon: '🫀',
      group: heartGroup,
      baseMat: heartMat,
      restEmissive: 0.25,
      focusPos: new THREE.Vector3(-0.22, 4.42, 4.2),
      targetPos: new THREE.Vector3(-0.22, 4.42, 0.42),
      scale: 1.0
    };

    this.organsGroup.add(heartGroup);
  }

  // 🫁 2. LUNGS: Realistic rose-pink spongy lobes, fissures, cardiac notch, larynx, C-ringed trachea & bronchi
  buildLungs() {
    const lungsGroup = new THREE.Group();
    lungsGroup.position.set(0, 4.62, 0.10);

    // Biological Spongy Rose-Pink Lung Parenchyma
    const lungMat = new THREE.MeshPhongMaterial({
      color: 0xf08080,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.22,
      specular: 0xffd6d6,
      shininess: 48,
      transparent: true,
      opacity: 0.94
    });

    // Trachea & Cartilaginous C-Rings
    const tracheaMat = new THREE.MeshPhongMaterial({ color: 0xfca5a5, emissive: 0x7f1d1d, emissiveIntensity: 0.18, shininess: 65 });
    const ringCartMat = new THREE.MeshPhongMaterial({ color: 0xfef3c7, shininess: 80 });

    const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 1.18, 18), tracheaMat);
    trachea.position.set(0, 0.92, 0.06);
    lungsGroup.add(trachea);

    // Larynx (Thyroid Cartilage) at top of Trachea
    const larynx = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.24, 14), ringCartMat);
    larynx.position.set(0, 1.48, 0.08);
    lungsGroup.add(larynx);

    // 10 Hyaline Cartilage C-Rings along the Trachea
    for (let r = 0; r < 10; r++) {
      const cRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 18), ringCartMat);
      cRing.rotation.x = Math.PI / 2;
      cRing.position.set(0, 0.45 + r * 0.095, 0.06);
      lungsGroup.add(cRing);
    }

    // Mainstem Bronchi & Secondary Bronchial Branches
    const rBronchus = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.068, 0.52, 12), tracheaMat);
    rBronchus.position.set(0.26, 0.30, 0.03);
    rBronchus.rotation.z = -0.62;
    lungsGroup.add(rBronchus);

    const lBronchus = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.065, 0.56, 12), tracheaMat);
    lBronchus.position.set(-0.28, 0.28, 0.03);
    lBronchus.rotation.z = 0.68;
    lungsGroup.add(lBronchus);

    // Helper to sculpt an anatomical lung with tapered apex, flat diaphragmatic base, and medial curve
    const createSculptedLungLobe = (radius, scaleX, scaleY, scaleZ, yPos, xOffset, zOffset) => {
      const geo = new THREE.SphereGeometry(radius, 28, 24);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let vx = pos.getX(i);
        let vy = pos.getY(i);
        let vz = pos.getZ(i);
        // Subtle organic surface undulation
        const ripple = 1.0 + 0.025 * Math.sin(vx * 9) * Math.cos(vy * 9);
        pos.setXYZ(i, vx * ripple, vy * ripple, vz * ripple);
      }
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, lungMat);
      mesh.position.set(xOffset, yPos, zOffset);
      mesh.scale.set(scaleX, scaleY, scaleZ);
      return mesh;
    };

    // Right Lung (3 Lobes: Superior, Middle, Inferior + Fissure Lines)
    const rightLungGroup = new THREE.Group();
    rightLungGroup.position.set(0.82, -0.06, 0.02);

    const rSuperior = createSculptedLungLobe(0.50, 0.88, 1.15, 0.94, 0.48, -0.04, 0);
    const rMiddle = createSculptedLungLobe(0.48, 0.94, 0.88, 0.92, -0.04, 0.06, 0.08);
    const rInferior = createSculptedLungLobe(0.54, 0.98, 1.08, 0.98, -0.54, 0.04, -0.04);
    rightLungGroup.add(rSuperior, rMiddle, rInferior);

    // Interlobar Fissure Grooves (Horizontal & Oblique Fissures)
    const fissureMat = new THREE.MeshBasicMaterial({ color: 0x991b1b, transparent: true, opacity: 0.45 });
    const hFissure = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.012, 8, 24, Math.PI * 0.85), fissureMat);
    hFissure.position.set(0.02, 0.18, 0.05);
    hFissure.rotation.x = Math.PI * 0.48;
    rightLungGroup.add(hFissure);

    const oFissureR = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.012, 8, 24, Math.PI * 0.85), fissureMat);
    oFissureR.position.set(0.04, -0.24, 0.04);
    oFissureR.rotation.x = Math.PI * 0.36;
    oFissureR.rotation.y = -0.25;
    rightLungGroup.add(oFissureR);

    lungsGroup.add(rightLungGroup);

    // Left Lung (2 Lobes with Anatomical Cardiac Notch cradling the Heart)
    const leftLungGroup = new THREE.Group();
    leftLungGroup.position.set(-0.84, -0.08, 0.02);

    const lSuperior = createSculptedLungLobe(0.49, 0.84, 1.16, 0.92, 0.46, 0.04, 0);
    const lInferior = createSculptedLungLobe(0.52, 0.90, 1.08, 0.94, -0.50, -0.08, -0.02);
    leftLungGroup.add(lSuperior, lInferior);

    const oFissureL = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.012, 8, 24, Math.PI * 0.85), fissureMat);
    oFissureL.position.set(-0.02, -0.08, 0.04);
    oFissureL.rotation.x = Math.PI * 0.35;
    oFissureL.rotation.y = 0.25;
    leftLungGroup.add(oFissureL);

    lungsGroup.add(leftLungGroup);

    [trachea, rSuperior, rMiddle, rInferior, lSuperior, lInferior].forEach((mesh) => {
      mesh.userData = { organId: 'lungs', group: lungsGroup, name: 'الرئتان', icon: '🫁' };
      this.raycastMeshes.push(mesh);
    });

    this.organs.lungs = {
      id: 'lungs',
      name: 'الرئتان',
      icon: '🫁',
      group: lungsGroup,
      leftLung: leftLungGroup,
      rightLung: rightLungGroup,
      baseMat: lungMat,
      restEmissive: 0.22,
      focusPos: new THREE.Vector3(0, 4.62, 4.6),
      targetPos: new THREE.Vector3(0, 4.62, 0.10),
      scale: 1.0
    };

    this.organsGroup.add(lungsGroup);
  }

  // 🧠 3. BRAIN: Convoluted pinkish-beige cerebral cortex (gyri & sulci), temporal lobes, foliated cerebellum & brainstem
  buildBrain() {
    const brainGroup = new THREE.Group();
    brainGroup.position.set(0, 7.42, 0.06);

    // Biological Pinkish-Peach Grey Matter Cortex
    const brainMat = new THREE.MeshPhongMaterial({
      color: 0xf4a298,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.22,
      specular: 0xffe4e6,
      shininess: 68
    });

    // Helper to build a cerebral hemisphere with procedurally sculpted Gyri & Sulci folds
    const createConvolutedHemisphere = (isLeft) => {
      const sign = isLeft ? -1 : 1;
      const geo = new THREE.SphereGeometry(0.52, 42, 36);
      const pos = geo.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Flatten medial wall facing the longitudinal fissure
        if (sign < 0 && x > 0.12) x = 0.12 + (x - 0.12) * 0.25;
        if (sign > 0 && x < -0.12) x = -0.12 + (x + 0.12) * 0.25;

        // Cortical Gyri & Sulci Convolutions (3D sinusoidal folding)
        const fold1 = Math.sin(x * 18.0 + z * 14.0) * Math.cos(y * 16.0);
        const fold2 = Math.cos(z * 22.0 - y * 15.0) * Math.sin(x * 14.0);
        const disp = 1.0 + (fold1 * 0.038) + (fold2 * 0.024);

        pos.setXYZ(i, x * disp, y * disp, z * disp);
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, brainMat);
      mesh.position.set(sign * 0.24, 0.16, 0.02);
      mesh.scale.set(0.84, 0.96, 1.28);
      return mesh;
    };

    const leftHemi = createConvolutedHemisphere(true);
    const rightHemi = createConvolutedHemisphere(false);
    brainGroup.add(leftHemi, rightHemi);

    // Temporal Lobes (Left & Right Lateral Inferior Bulges)
    const createTemporalLobe = (isLeft) => {
      const sign = isLeft ? -1 : 1;
      const tGeo = new THREE.SphereGeometry(0.26, 24, 20);
      const pos = tGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const d = 1.0 + 0.035 * Math.sin(z * 20.0) * Math.cos(y * 18.0);
        pos.setXYZ(i, x * d, y * d, z * d);
      }
      tGeo.computeVertexNormals();
      const tMesh = new THREE.Mesh(tGeo, brainMat);
      tMesh.position.set(sign * 0.42, -0.08, 0.10);
      tMesh.scale.set(0.75, 0.72, 1.35);
      tMesh.rotation.x = 0.18;
      return tMesh;
    };
    const tempL = createTemporalLobe(true);
    const tempR = createTemporalLobe(false);
    brainGroup.add(tempL, tempR);

    // Foliated Cerebellum (Posterior Inferior Hindbrain with horizontal folia ridges)
    const cerebMat = new THREE.MeshPhongMaterial({
      color: 0xd97777,
      emissive: 0x6b1d1d,
      emissiveIntensity: 0.22,
      specular: 0xfecdd3,
      shininess: 55
    });
    const cerebGeo = new THREE.SphereGeometry(0.35, 28, 28);
    const cPos = cerebGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const x = cPos.getX(i), y = cPos.getY(i), z = cPos.getZ(i);
      const folia = 1.0 + 0.032 * Math.sin(y * 42.0);
      cPos.setXYZ(i, x * folia, y, z * folia);
    }
    cerebGeo.computeVertexNormals();
    const cerebellum = new THREE.Mesh(cerebGeo, cerebMat);
    cerebellum.position.set(0, -0.32, -0.34);
    cerebellum.scale.set(1.26, 0.72, 0.86);
    brainGroup.add(cerebellum);

    // Brainstem (Pons Bulge + Medulla Oblongata)
    const stemMat = new THREE.MeshPhongMaterial({
      color: 0xfde8e8,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.15,
      shininess: 65
    });
    const pons = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 16), stemMat);
    pons.position.set(0, -0.36, -0.06);
    pons.scale.set(1.05, 0.95, 0.90);
    brainGroup.add(pons);

    const medulla = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.52, 16), stemMat);
    medulla.position.set(0, -0.66, -0.10);
    medulla.rotation.x = -0.15;
    brainGroup.add(medulla);

    [leftHemi, rightHemi, tempL, tempR, cerebellum, pons, medulla].forEach((mesh) => {
      mesh.userData = { organId: 'brain', group: brainGroup, name: 'الدماغ', icon: '🧠' };
      this.raycastMeshes.push(mesh);
    });

    this.organs.brain = {
      id: 'brain',
      name: 'الدماغ',
      icon: '🧠',
      group: brainGroup,
      baseMat: brainMat,
      restEmissive: 0.22,
      focusPos: new THREE.Vector3(0, 7.42, 3.6),
      targetPos: new THREE.Vector3(0, 7.42, 0.06),
      scale: 1.0
    };

    this.organsGroup.add(brainGroup);
  }

  // 🥗 4. STOMACH: Seamless Curved J-Shaped Organ (Cardia, Fundus Dome, Body, Pyloric Antrum, Sphincter & Duodenum)
  buildStomach() {
    const stomachGroup = new THREE.Group();
    stomachGroup.position.set(-0.46, 3.28, 0.34);

    // Biological Coral-Salmon Gastric Serosa
    const stomachMat = new THREE.MeshPhongMaterial({
      color: 0xe07a5f,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.24,
      specular: 0xffedd5,
      shininess: 82
    });

    // Build a seamless variable-radius J-shaped stomach mesh along a centerline curve
    const jCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.42, -0.02),  // Cardia entry
      new THREE.Vector3(-0.22, 0.50, 0.00),   // Superior Fundus dome
      new THREE.Vector3(-0.30, 0.18, 0.04),   // Upper Gastric Body
      new THREE.Vector3(-0.18, -0.20, 0.06),  // Lower Gastric Body (Greater curvature bend)
      new THREE.Vector3(0.14, -0.34, 0.06),   // Pyloric Antrum
      new THREE.Vector3(0.42, -0.22, 0.02),   // Pyloric Canal & Sphincter
      new THREE.Vector3(0.62, -0.32, -0.04),  // Superior Duodenum
      new THREE.Vector3(0.60, -0.60, -0.08)   // Descending Duodenum
    ]);

    const tubularSegments = 48;
    const radialSegments = 24;
    const tubeGeo = new THREE.TubeGeometry(jCurve, tubularSegments, 0.28, radialSegments, false);
    const frames = jCurve.computeFrenetFrames(tubularSegments, false);
    const pos = tubeGeo.attributes.position;

    for (let i = 0; i <= tubularSegments; i++) {
      const u = i / tubularSegments;
      const center = jCurve.getPointAt(u);
      const N = frames.normals[i];
      const B = frames.binormals[i];

      // Variable anatomical radius profile along the stomach's J-curve
      let rScale = 1.0;
      if (u < 0.08) {
        rScale = 0.48 + (u / 0.08) * 0.72; // Cardia widening into Fundus
      } else if (u < 0.28) {
        rScale = 1.25 + Math.sin(((u - 0.08) / 0.20) * Math.PI) * 0.22; // Broad Fundus & Upper Body
      } else if (u < 0.58) {
        rScale = 1.25 - ((u - 0.28) / 0.30) * 0.45; // Tapering into Pyloric Antrum
      } else if (u < 0.72) {
        // Pyloric Sphincter constriction at u ~ 0.68
        const sphDist = Math.abs(u - 0.68);
        rScale = sphDist < 0.05 ? 0.42 : 0.62;
      } else {
        rScale = 0.46; // Duodenum C-loop
      }

      for (let j = 0; j <= radialSegments; j++) {
        const idx = i * (radialSegments + 1) + j;
        if (idx >= pos.count) continue;
        const vx = pos.getX(idx) - center.x;
        const vy = pos.getY(idx) - center.y;
        const vz = pos.getZ(idx) - center.z;
        // Slightly flatten anterior-posterior (Z) for realistic stomach profile
        pos.setXYZ(
          idx,
          center.x + vx * rScale,
          center.y + vy * rScale,
          center.z + vz * rScale * 0.78
        );
      }
    }
    tubeGeo.computeVertexNormals();

    const stomachMesh = new THREE.Mesh(tubeGeo, stomachMat);
    stomachGroup.add(stomachMesh);

    // Fundus Superior Cap Dome (Closes the top-left dome smoothly)
    const fundusCap = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 20), stomachMat);
    fundusCap.position.set(-0.20, 0.42, 0.00);
    fundusCap.scale.set(1.02, 0.96, 0.78);
    stomachGroup.add(fundusCap);

    // Gastroepiploic Vessels along the Greater Curvature
    const vesselMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const gVesselCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.46, 0.34, 0.16),
      new THREE.Vector3(-0.52, -0.02, 0.20),
      new THREE.Vector3(-0.34, -0.40, 0.22),
      new THREE.Vector3(0.08, -0.54, 0.20)
    ]);
    stomachGroup.add(new THREE.Mesh(new THREE.TubeGeometry(gVesselCurve, 20, 0.016, 8, false), vesselMat));

    [stomachMesh, fundusCap].forEach((mesh) => {
      mesh.userData = { organId: 'stomach', group: stomachGroup, name: 'المعدة', icon: '🥗' };
      this.raycastMeshes.push(mesh);
    });

    this.organs.stomach = {
      id: 'stomach',
      name: 'المعدة',
      icon: '🥗',
      group: stomachGroup,
      baseMat: stomachMat,
      restEmissive: 0.24,
      focusPos: new THREE.Vector3(-0.46, 3.28, 4.0),
      targetPos: new THREE.Vector3(-0.46, 3.28, 0.34),
      scale: 1.0
    };

    this.organsGroup.add(stomachGroup);
  }

  // 🥢 5. ESOPHAGUS: Realistic Muscular Conduit from Pharynx through Diaphragm into Stomach Cardia
  buildEsophagus() {
    const esoGroup = new THREE.Group();

    const esoMat = new THREE.MeshPhongMaterial({
      color: 0xd96b5c,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.24,
      specular: 0xfed7aa,
      shininess: 78
    });

    const curvePoints = [
      new THREE.Vector3(0, 6.32, 0.16),     // Pharynx & Upper Esophageal Sphincter
      new THREE.Vector3(0, 5.45, 0.02),     // Upper Thoracic Esophagus (behind trachea)
      new THREE.Vector3(-0.04, 4.45, -0.06),// Mid Thoracic Esophagus (behind heart)
      new THREE.Vector3(-0.22, 3.85, 0.14), // Diaphragmatic Hiatus & LES
      new THREE.Vector3(-0.48, 3.68, 0.32)  // Gastroesophageal Junction (Cardia)
    ];
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 38, 0.108, 18, false);
    const tube = new THREE.Mesh(tubeGeo, esoMat);
    esoGroup.add(tube);

    // Subtle Circular Muscle Fibers & Upper/Lower Sphincter Rings
    const ringMat = new THREE.MeshPhongMaterial({
      color: 0xfca5a5,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.72
    });
    for (let i = 0; i < 12; i++) {
      const t = 0.06 + (i / 12) * 0.88;
      const pt = curve.getPoint(t);
      const isSphincter = (i === 0 || i === 10);
      const ringGeo = new THREE.TorusGeometry(isSphincter ? 0.125 : 0.112, isSphincter ? 0.026 : 0.016, 8, 18);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pt);
      ring.rotation.x = Math.PI / 2;
      esoGroup.add(ring);
    }

    tube.userData = { organId: 'esophagus', group: esoGroup, name: 'المريء', icon: '🥢' };
    this.raycastMeshes.push(tube);

    this.organs.esophagus = {
      id: 'esophagus',
      name: 'المريء',
      icon: '🥢',
      group: esoGroup,
      curve: curve,
      baseMat: esoMat,
      restEmissive: 0.24,
      focusPos: new THREE.Vector3(0, 4.95, 4.2),
      targetPos: new THREE.Vector3(-0.08, 4.95, 0.10),
      scale: 1.0
    };

    this.organsGroup.add(esoGroup);
  }

  // 👁️ 6. EYES: Lifelike Sclera, Multi-Ring Iris, Pupil, Glossy Cornea, Eyelids & Optic Nerves
  buildEyes() {
    const eyesGroup = new THREE.Group();
    eyesGroup.position.set(0, 7.36, 0.78);

    const scleraMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x334155,
      emissiveIntensity: 0.12,
      specular: 0xffffff,
      shininess: 100
    });
    const limbalMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const irisMat = new THREE.MeshPhongMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
      specular: 0xbae6fd,
      shininess: 95
    });
    const innerIrisMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    const corneaMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0xffffff,
      transparent: true,
      opacity: 0.35,
      shininess: 140
    });
    const eyelidMat = new THREE.MeshPhongMaterial({
      color: 0xd99b82,
      emissive: 0x5c2410,
      emissiveIntensity: 0.18,
      shininess: 40
    });

    const createSingleEye = (xOffset) => {
      const eyeSubGroup = new THREE.Group();
      eyeSubGroup.position.set(xOffset, 0, 0);

      // Sclera Globe
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.175, 24, 24), scleraMat);
      eyeSubGroup.add(sclera);

      // Upper Eyelid Fold (Gives natural human warmth to the eyes)
      const upperLid = new THREE.Mesh(
        new THREE.SphereGeometry(0.184, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.38),
        eyelidMat
      );
      upperLid.rotation.x = -0.52;
      eyeSubGroup.add(upperLid);

      // Dark Limbal Ring around Iris
      const limbal = new THREE.Mesh(new THREE.CircleGeometry(0.092, 24), limbalMat);
      limbal.position.set(0, 0, 0.173);
      eyeSubGroup.add(limbal);

      // Colored Iris
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.084, 24), irisMat);
      iris.position.set(0, 0, 0.175);
      eyeSubGroup.add(iris);

      // Inner Collarette Ring
      const innerIris = new THREE.Mesh(new THREE.RingGeometry(0.044, 0.058, 20), innerIrisMat);
      innerIris.position.set(0, 0, 0.177);
      eyeSubGroup.add(innerIris);

      // Central Pupil
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.040, 20), pupilMat);
      pupil.position.set(0, 0, 0.179);
      eyeSubGroup.add(pupil);

      // Corneal Specular Highlight Dot
      const glint = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      glint.position.set(0.026, 0.026, 0.182);
      eyeSubGroup.add(glint);

      // Transparent Cornea Dome
      const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 18), corneaMat);
      cornea.position.set(0, 0, 0.12);
      cornea.scale.set(1, 1, 0.78);
      eyeSubGroup.add(cornea);

      // Optic Nerve projecting posteriorly to Optic Chiasm
      const nerveMat = new THREE.MeshPhongMaterial({ color: 0xfef08a, emissive: 0x854d0e, emissiveIntensity: 0.25 });
      const nerve = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.036, 0.42, 10), nerveMat);
      nerve.position.set(-xOffset * 0.22, -0.02, -0.24);
      nerve.rotation.x = Math.PI / 2;
      nerve.rotation.z = xOffset > 0 ? 0.22 : -0.22;
      eyeSubGroup.add(nerve);

      [sclera, cornea, upperLid].forEach((m) => {
        m.userData = { organId: 'eye', group: eyesGroup, name: 'العين', icon: '👁️' };
        this.raycastMeshes.push(m);
      });

      return eyeSubGroup;
    };

    const leftEye = createSingleEye(-0.33);
    const rightEye = createSingleEye(0.33);
    eyesGroup.add(leftEye, rightEye);

    this.organs.eye = {
      id: 'eye',
      name: 'العين',
      icon: '👁️',
      group: eyesGroup,
      leftEye: leftEye,
      rightEye: rightEye,
      baseMat: irisMat,
      restEmissive: 0.25,
      focusPos: new THREE.Vector3(0, 7.36, 3.1),
      targetPos: new THREE.Vector3(0, 7.36, 0.78),
      scale: 1.0
    };

    this.organsGroup.add(eyesGroup);
  }

  buildHighlightBeacon() {
    const beaconGeo = new THREE.TorusGeometry(0.82, 0.036, 14, 44);
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

  /**
   * 🌟 In-Scene 3D Floating Name & Organ Image Preview Badge (Sprite Billboard)
   * Displays Organ Image + Arabic Name + "انقر هنا للتفاصيل" (without writing "وميض فلاشي")
   */
  build3DHoverLabelSprite() {
    this.labelCanvas = document.createElement('canvas');
    this.labelCanvas.width = 560;
    this.labelCanvas.height = 176;
    this.labelContext = this.labelCanvas.getContext('2d');

    this.labelTexture = new THREE.CanvasTexture(this.labelCanvas);
    this.labelTexture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.labelTexture,
      transparent: true,
      opacity: 0.0,
      depthTest: false
    });

    this.hoverLabelSprite = new THREE.Sprite(spriteMat);
    this.hoverLabelSprite.scale.set(2.25, 0.70, 1.0);
    this.hoverLabelSprite.visible = false;
    this.effectsGroup.add(this.hoverLabelSprite);
  }

  update3DHoverLabel(organ, flashGlow) {
    if (!this.hoverLabelSprite || !this.labelContext || !organ) return;

    const ctx = this.labelContext;
    ctx.clearRect(0, 0, 560, 176);

    // Rounded Glassmorphic Pill Card
    const rx = 18, ry = 14, rw = 524, rh = 148, r = 28;
    ctx.save();
    ctx.shadowColor = flashGlow ? '#38bdf8' : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = flashGlow ? 20 : 10;

    const grad = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
    grad.addColorStop(1, 'rgba(30, 41, 59, 0.97)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(rx, ry, rw, rh, r);
    } else {
      ctx.rect(rx, ry, rw, rh);
    }
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Draw Preloaded Organ Image on the Left side of the 3D Badge
    const img = this.loadedOrganImgs[organ.id];
    const imgBoxX = 38, imgBoxY = 28, imgBoxSize = 120;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(imgBoxX, imgBoxY, imgBoxSize, imgBoxSize, 20);
    } else {
      ctx.rect(imgBoxX, imgBoxY, imgBoxSize, imgBoxSize);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, imgBoxX + 8, imgBoxY + 8, imgBoxSize - 16, imgBoxSize - 16);
    }
    ctx.restore();

    // Organ Arabic Name + "انقر هنا للتفاصيل" (Strictly no "وميض فلاشي")
    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Tajawal", "Cairo", "Segoe UI", sans-serif';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText(`${organ.icon || '🔬'} ${organ.name}`, 512, 66);

    // Subtitle CTA Pill
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px "Tajawal", "Cairo", "Segoe UI", sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillText('👆 انقر هنا للتفاصيل', 512, 118);

    ctx.restore();

    this.labelTexture.needsUpdate = true;
    this.hoverLabelSprite.position.set(organ.targetPos.x, organ.targetPos.y + 0.88, organ.targetPos.z + 0.35);
    this.hoverLabelSprite.material.opacity = 1.0;
    this.hoverLabelSprite.visible = true;
  }

  hide3DHoverLabel() {
    if (this.hoverLabelSprite) {
      this.hoverLabelSprite.material.opacity = 0.0;
      this.hoverLabelSprite.visible = false;
    }
  }

  setupControls() {
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.autoRotate = this.autoRotateEnabled;
      this.controls.autoRotateSpeed = 0.70;
      this.controls.minDistance = 3.8;
      this.controls.maxDistance = 36.0;
      this.controls.maxPolarAngle = Math.PI * 0.86;
      this.controls.target.copy(this.defaultLookAt);

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
      this.hide3DHoverLabel();
      if (this.hoveredOrgan && this.hoveredOrgan !== this.selectedOrgan) {
        this.setOrganHighlight(this.hoveredOrgan, false);
        this.hoveredOrgan = null;
      }
    });
  }

  checkHover(e) {
    if (this.isDragging) {
      this.hideTooltip();
      this.hide3DHoverLabel();
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
        this.update3DHoverLabel(organ, true);
        this.showTooltip(organ, e.clientX, e.clientY);

        if (this.beaconMesh) {
          this.beaconMesh.position.copy(organ.targetPos);
          this.beaconMesh.material.opacity = 0.85;
        }
      }
    } else {
      this.renderer.domElement.style.cursor = 'grab';
      if (this.hoveredOrgan && this.hoveredOrgan !== this.selectedOrgan) {
        this.setOrganHighlight(this.hoveredOrgan, false);
        this.hoveredOrgan = null;
      }
      this.hideTooltip();
      this.hide3DHoverLabel();

      if (!this.selectedOrgan && this.beaconMesh) {
        this.beaconMesh.material.opacity = 0.0;
      }
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
      this.hide3DHoverLabel();
      this.flyCameraTo(this.defaultCamPos, this.defaultLookAt);
      this.updateDetailsPanel(null);
      this.updatePillsUI('all');
      if (!this.pulseEnabled) {
        this.resetOrgansToRestState();
      }
      return;
    }

    const organ = this.organs[organId];
    if (!organ) return;

    this.setOrganHighlight(organId, true);
    this.updatePillsUI(organId);
    this.update3DHoverLabel(organ, true);

    if (this.beaconMesh) {
      this.beaconMesh.position.copy(organ.targetPos);
      this.beaconMesh.material.opacity = 0.90;
    }

    this.flyCameraTo(organ.focusPos, organ.targetPos);
    this.updateDetailsPanel(organId);

    if (navigator.vibrate) {
      try { navigator.vibrate(35); } catch (e) {}
    }
  }

  setOrganHighlight(organId, highlight) {
    const organ = this.organs[organId];
    if (!organ) return;
    const restVal = organ.restEmissive || 0.24;
    organ.baseMat.emissiveIntensity = highlight ? 0.95 : restVal;
    if (!highlight) {
      organ.group.scale.set(1.0, 1.0, 1.0);
      if (organ.leftLung && organ.rightLung) {
        organ.leftLung.scale.set(1.0, 1.0, 1.0);
        organ.rightLung.scale.set(1.0, 1.0, 1.0);
      }
    }
  }

  /**
   * Immediately stops all organ pulsing/flashing and restores resting scales & emissive intensities
   */
  resetOrgansToRestState() {
    Object.keys(this.organs).forEach((id) => {
      const organ = this.organs[id];
      if (!organ) return;
      const isHighlighted = (this.hoveredOrgan === id || this.selectedOrgan === id);
      organ.group.scale.set(1.0, 1.0, 1.0);
      if (organ.leftLung && organ.rightLung) {
        organ.leftLung.scale.set(1.0, 1.0, 1.0);
        organ.rightLung.scale.set(1.0, 1.0, 1.0);
      }
      organ.baseMat.emissiveIntensity = isHighlighted ? 0.85 : (organ.restEmissive || 0.24);
    });
    if (this.beaconMesh) {
      this.beaconMesh.scale.set(1.0, 1.0, 1.0);
      if (!this.hoveredOrgan && !this.selectedOrgan) {
        this.beaconMesh.material.opacity = 0.0;
      }
    }
  }

  flyCameraTo(targetPos, targetLookAt) {
    this.cameraTarget.startPos.copy(this.camera.position);
    this.cameraTarget.startLookAt.copy(this.controls ? this.controls.target : this.defaultLookAt);
    this.cameraTarget.pos.copy(targetPos);
    this.cameraTarget.lookAt.copy(targetLookAt);
    this.cameraTarget.progress = 0;
    this.cameraTarget.active = true;
  }

  /**
   * 🌟 High-Definition Preview Tooltip Card with Organ Image + "انقر هنا للتفاصيل"
   */
  showTooltip(organ, clientX, clientY) {
    const tooltip = document.getElementById('body-3d-tooltip');
    if (!tooltip) return;

    const organData = (typeof organsData !== 'undefined') ? organsData[organ.id] : null;

    const imgEl = document.getElementById('b3d-tooltip-img');
    const iconEl = document.getElementById('b3d-tooltip-icon');
    const nameEl = document.getElementById('b3d-tooltip-name');
    const descEl = document.getElementById('b3d-tooltip-desc');
    const flashTag = document.getElementById('b3d-tooltip-flash-tag');

    if (imgEl && this.organImagesMap[organ.id]) {
      imgEl.src = this.organImagesMap[organ.id];
      imgEl.style.display = 'block';
    }
    if (iconEl) iconEl.style.display = imgEl ? 'none' : 'inline-block';
    if (nameEl) nameEl.textContent = `${organ.icon || ''} ${organ.name}`.trim();
    if (descEl) descEl.textContent = organData ? organData.tag : 'اضغط للاستكشاف والاستماع';
    if (flashTag) flashTag.textContent = 'انقر هنا للتفاصيل';

    tooltip.style.display = 'flex';
    const rect = this.container.getBoundingClientRect();
    const x = Math.min(rect.width - 240, Math.max(12, clientX - rect.left + 18));
    const y = Math.min(rect.height - 110, Math.max(12, clientY - rect.top - 24));
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
    document.querySelectorAll('.organ-3d-pill').forEach((pill) => {
      const isMatch = pill.getAttribute('data-organ') === activeId;
      pill.classList.toggle('active', isMatch);
    });
  }

  setupDOMBindings() {
    document.querySelectorAll('.organ-3d-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const organId = pill.getAttribute('data-organ');
        this.selectOrgan(organId);
      });
    });

    const btnFront = document.getElementById('b3d-btn-front');
    if (btnFront) {
      btnFront.addEventListener('click', () => {
        this.flyCameraTo(new THREE.Vector3(0, 3.0, 24), this.defaultLookAt);
      });
    }

    const btnSide = document.getElementById('b3d-btn-side');
    if (btnSide) {
      btnSide.addEventListener('click', () => {
        this.flyCameraTo(new THREE.Vector3(24, 3.0, 0), this.defaultLookAt);
      });
    }

    const btnBack = document.getElementById('b3d-btn-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        this.flyCameraTo(new THREE.Vector3(0, 3.0, -24), this.defaultLookAt);
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
        const tooltip = document.getElementById('body-3d-tooltip');
        if (tooltip) {
          tooltip.classList.toggle('pulse-off', !this.pulseEnabled);
        }
        if (!this.pulseEnabled) {
          this.resetOrgansToRestState();
        }
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
          this.bodyGroup.visible = level.val > 0.01;
        }
        if (this.bodyWireMaterial) {
          this.bodyWireMaterial.opacity = level.wire;
          this.bodyWireMaterial.visible = level.wire > 0.01;
        }
        if (this.vascularGroup) {
          this.vascularGroup.visible = level.vasc > 0.01;
        }
        if (this.skeletonGroup) {
          this.skeletonGroup.visible = level.skel > 0.01;
          if (this.boneMaterial) this.boneMaterial.opacity = level.skel;
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

    if (this.pedestalGroup && this.autoRotateEnabled) {
      this.pedestalGroup.rotation.y += delta * 0.12;
    }

    // Strict check: Only animate physiological pulsing & beacon flash when this.pulseEnabled is true
    if (this.pulseEnabled) {
      if (this.beaconMesh && this.beaconMesh.material.opacity > 0) {
        this.beaconMesh.rotation.z += delta * 1.8;
        const pulseScale = 1.0 + Math.sin(time * 5.0) * 0.10;
        this.beaconMesh.scale.set(pulseScale, pulseScale, pulseScale);
      }
      this.animateOrganFunctions(time);
    } else {
      this.resetOrgansToRestState();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * 🌟 Dynamic Physiological Functions (Only active when this.pulseEnabled === true)
   */
  animateOrganFunctions(time) {
    const isHovered = (id) => this.hoveredOrgan === id || this.selectedOrgan === id;

    // 🫀 1. Heart: Realistic Lub-Dub Cardiac Cycle
    if (this.organs.heart) {
      const beatCycle = (time * 1.2) % 1.0;
      let heartScale = 1.0;
      let emissiveVal = this.organs.heart.restEmissive;

      if (beatCycle < 0.15) {
        const subT = beatCycle / 0.15;
        heartScale = 1.0 + Math.sin(subT * Math.PI) * 0.14;
        emissiveVal = 0.68;
      } else if (beatCycle >= 0.22 && beatCycle < 0.35) {
        const subT = (beatCycle - 0.22) / 0.13;
        heartScale = 1.0 + Math.sin(subT * Math.PI) * 0.09;
        emissiveVal = 0.52;
      }

      if (isHovered('heart')) {
        emissiveVal = 0.85 + 0.45 * Math.sin(time * 10.0);
        heartScale = Math.max(heartScale, 1.05 + 0.04 * Math.sin(time * 10.0));
      }

      this.organs.heart.group.scale.set(heartScale, heartScale, heartScale);
      this.organs.heart.baseMat.emissiveIntensity = emissiveVal;
    }

    // 🫁 2. Lungs: Natural Respiratory Expansion & Contraction
    if (this.organs.lungs) {
      const breath = Math.sin(time * 1.5);
      let breathScaleX = 1.0 + breath * 0.09;
      let breathScaleZ = 1.0 + breath * 0.11;
      let breathScaleY = 1.0 + breath * 0.04;
      let lungEmissive = this.organs.lungs.restEmissive + (breath + 1) * 0.12;

      if (isHovered('lungs')) {
        lungEmissive = 0.85 + 0.45 * Math.sin(time * 10.0);
        const hoverPulse = 1.0 + 0.04 * Math.sin(time * 10.0);
        breathScaleX *= hoverPulse;
        breathScaleY *= hoverPulse;
        breathScaleZ *= hoverPulse;
      }

      this.organs.lungs.leftLung.scale.set(breathScaleX, breathScaleY, breathScaleZ);
      this.organs.lungs.rightLung.scale.set(breathScaleX, breathScaleY, breathScaleZ);
      this.organs.lungs.baseMat.emissiveIntensity = lungEmissive;
    }

    // 🧠 3. Brain: Gentle Neural Activity
    if (this.organs.brain) {
      const synPulse = 0.5 + 0.5 * Math.sin(time * 3.5);
      let brainEmissive = this.organs.brain.restEmissive + synPulse * 0.22;

      if (isHovered('brain')) {
        brainEmissive = 0.85 + 0.45 * Math.sin(time * 10.0);
        const brainScale = 1.0 + 0.04 * Math.sin(time * 10.0);
        this.organs.brain.group.scale.set(brainScale, brainScale, brainScale);
      } else {
        this.organs.brain.group.scale.set(1.0, 1.0, 1.0);
      }

      this.organs.brain.baseMat.emissiveIntensity = brainEmissive;
    }

    // 🥗 4. Stomach: Smooth Peristaltic Gastric Churning
    if (this.organs.stomach) {
      const digest = Math.sin(time * 2.0);
      let stomachScaleY = 1.0 + digest * 0.04;
      let stomachScaleX = 1.0 - digest * 0.035;
      let stomachEmissive = this.organs.stomach.restEmissive + Math.abs(digest) * 0.18;

      if (isHovered('stomach')) {
        stomachEmissive = 0.85 + 0.45 * Math.sin(time * 10.0);
        const stomachPulse = 1.0 + 0.04 * Math.sin(time * 10.0);
        stomachScaleX *= stomachPulse;
        stomachScaleY *= stomachPulse;
      }

      this.organs.stomach.group.scale.set(stomachScaleX, stomachScaleY, 1.0);
      this.organs.stomach.baseMat.emissiveIntensity = stomachEmissive;
    }

    // 🥢 5. Esophagus: Peristalsis Wave
    if (this.organs.esophagus) {
      const wave = Math.sin(time * 2.4);
      let esoEmissive = this.organs.esophagus.restEmissive + Math.max(0, wave) * 0.25;

      if (isHovered('esophagus')) {
        esoEmissive = 0.85 + 0.45 * Math.sin(time * 10.0);
      }

      this.organs.esophagus.baseMat.emissiveIntensity = esoEmissive;
    }

    // 👁️ 6. Eyes: Visual Focus Response
    if (this.organs.eye) {
      const eyeGlow = Math.sin(time * 1.6);
      let eyeEmissive = this.organs.eye.restEmissive + Math.max(0, eyeGlow) * 0.24;

      if (isHovered('eye')) {
        eyeEmissive = 0.85 + 0.45 * Math.sin(time * 10.0);
        const eyeScale = 1.0 + 0.05 * Math.sin(time * 10.0);
        this.organs.eye.group.scale.set(eyeScale, eyeScale, eyeScale);
      } else {
        this.organs.eye.group.scale.set(1.0, 1.0, 1.0);
      }

      this.organs.eye.baseMat.emissiveIntensity = eyeEmissive;
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
      <div class="fallback-anatomy-stage" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;background:radial-gradient(circle at 50% 44%, #1e3a5f 0%, #0f172a 65%, #070d19 100%);padding:20px;box-sizing:border-box;">
        <svg viewBox="0 0 400 680" style="max-height:92%;width:auto;filter:drop-shadow(0 10px 20px rgba(2, 132, 199, 0.25));" dir="ltr">
          <ellipse cx="200" cy="640" rx="140" ry="26" fill="none" stroke="#38bdf8" stroke-width="2.5" opacity="0.6"/>
          <ellipse cx="200" cy="85" rx="42" ry="52" fill="#e8b498" fill-opacity="0.45" stroke="#f59e0b" stroke-width="2"/>
          <rect x="186" y="132" width="28" height="26" rx="6" fill="#e8b498" fill-opacity="0.45"/>
          <path d="M 140 160 C 130 200, 145 280, 160 320 C 150 350, 145 380, 155 410 L 245 410 C 255 380, 250 350, 240 320 C 255 280, 270 200, 260 160 Z" fill="#e8b498" fill-opacity="0.40" stroke="#f59e0b" stroke-width="2"/>
        </svg>
      </div>
    `;
  }
}

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
