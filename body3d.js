/**
 * 🫀 Interactive 3D Human Anatomy Viewer (Three.js r128)
 * رحلة أعضاء الجسم الداخلية - المجسم التشريحي ثلاثي الأبعاد التفاعلي
 * 
 * Features:
 * - 360° Free rotation with OrbitControls (Mouse & Touch gestures)
 * - Translucent holographic human body shell with adjustable opacity & X-ray mode
 * - Anatomically placed internal organs: Heart, Lungs, Brain, Stomach, Esophagus, Eyes
 * - Biological pulsing and blinking animations (heartbeat lub-dub, breathing lungs, neural synapses, peristalsis)
 * - Raycasting hover & click on organs with glowing highlight beacons & 3D floating tooltips
 * - Camera smooth glide & focus on each organ
 * - Integration with Web Audio / Authentic 10-second Medical Audio recordings
 * - Direct deep-link to the Organ Explorer tab
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
      pos: new THREE.Vector3(2.5, 4.5, 14.5),
      lookAt: new THREE.Vector3(0, 3.8, 0),
      active: false,
      progress: 0,
      duration: 1.2,
      startPos: new THREE.Vector3(),
      startLookAt: new THREE.Vector3()
    };

    // Highlight ring / beacon
    this.beaconMesh = null;

    // Biological heartbeat sound / audio sync
    this.lastBeatTime = 0;

    this.init();
  }

  init() {
    this.setupScene();
    this.setupLights();
    this.buildPedestal();
    this.buildHumanSilhouette();
    this.buildInternalOrgans();
    this.buildHighlightBeacon();
    this.setupControls();
    this.setupEventListeners();
    this.setupDOMBindings();
    this.animate();

    // Initial resize to ensure crisp rendering
    setTimeout(() => this.onWindowResize(), 150);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    
    // Transparent / Medical gradient background
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 550;

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(2.5, 4.5, 14.5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Add main groups to scene
    this.scene.add(this.bodyGroup);
    this.scene.add(this.organsGroup);
    this.scene.add(this.skeletonGroup);
    this.scene.add(this.effectsGroup);
  }

  setupLights() {
    // Soft Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    // Front-Top Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(6, 12, 9);
    this.scene.add(keyLight);

    // Soft Fill Light from left
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.5);
    fillLight.position.set(-8, 6, 6);
    this.scene.add(fillLight);

    // Cyber Rim / Holographic Edge Backlight (Sky Blue)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-4, 7, -8);
    this.scene.add(rimLight);

    // Bottom Upward Luminescence from scanner platform
    const bottomLight = new THREE.DirectionalLight(0x0284c7, 0.4);
    bottomLight.position.set(0, -6, 2);
    this.scene.add(bottomLight);
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
    // Holographic Skin Material with smooth specular highlights
    this.bodyShellMaterial = new THREE.MeshPhongMaterial({
      color: 0x7dd3fc,
      specular: 0xffffff,
      shininess: 90,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // Wireframe Overlay for High-Tech Holographic Medical Visual
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

    // Jaw / Chin contour
    const chinGeo = new THREE.CylinderGeometry(0.48, 0.32, 0.6, 18);
    addBodyPart(chinGeo, { x: 0, y: 6.85, z: 0.35 }, { x: 0.2, y: 0, z: 0 });

    // 2. Neck
    const neckGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.85, 20);
    addBodyPart(neckGeo, { x: 0, y: 6.35, z: 0.05 });

    // 3. Torso (Shoulders to Waist)
    // Upper Thorax / Chest
    const chestGeo = new THREE.CylinderGeometry(1.35, 1.1, 1.8, 28);
    addBodyPart(chestGeo, { x: 0, y: 4.85, z: 0.08 }, null, { x: 1.18, y: 1, z: 0.82 });

    // Mid Abdomen / Waist
    const abdomenGeo = new THREE.CylinderGeometry(1.1, 0.98, 1.4, 26);
    addBodyPart(abdomenGeo, { x: 0, y: 3.35, z: 0.05 }, null, { x: 1.1, y: 1, z: 0.78 });

    // 4. Pelvis / Hips
    const pelvisGeo = new THREE.CylinderGeometry(0.98, 1.15, 1.5, 26);
    addBodyPart(pelvisGeo, { x: 0, y: 1.95, z: 0.02 }, null, { x: 1.12, y: 1, z: 0.82 });

    // 5. Clavicles & Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.52, 20, 20);
    addBodyPart(shoulderGeo, { x: -1.72, y: 5.45, z: 0.02 }, null, { x: 1, y: 0.85, z: 0.9 });
    addBodyPart(shoulderGeo, { x: 1.72, y: 5.45, z: 0.02 }, null, { x: 1, y: 0.85, z: 0.9 });

    // 6. Arms (Relaxed anatomical clearance pose)
    // Left Arm
    const armUpperGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.7, 18);
    addBodyPart(armUpperGeo, { x: -1.95, y: 4.25, z: 0.02 }, { x: 0, y: 0, z: 0.12 });
    const armForeGeo = new THREE.CylinderGeometry(0.3, 0.22, 1.6, 18);
    addBodyPart(armForeGeo, { x: -2.18, y: 2.65, z: 0.05 }, { x: 0, y: 0, z: 0.14 });
    const handGeo = new THREE.SphereGeometry(0.24, 16, 16);
    addBodyPart(handGeo, { x: -2.35, y: 1.65, z: 0.08 }, null, { x: 0.7, y: 1.3, z: 0.5 });

    // Right Arm
    addBodyPart(armUpperGeo, { x: 1.95, y: 4.25, z: 0.02 }, { x: 0, y: 0, z: -0.12 });
    addBodyPart(armForeGeo, { x: 2.18, y: 2.65, z: 0.05 }, { x: 0, y: 0, z: -0.14 });
    addBodyPart(handGeo, { x: 2.35, y: 1.65, z: 0.08 }, null, { x: 0.7, y: 1.3, z: 0.5 });

    // 7. Legs & Feet
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

    // 8. Spinal Column & Rib Cage (Anatomical Internal Structure)
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

    // 16 Vertebrae discs along cervical, thoracic, and lumbar spine
    const vertebraeCount = 16;
    for (let i = 0; i < vertebraeCount; i++) {
      const y = 6.4 - (i * 0.32);
      // Gentle S-curve of the human spine
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

    // 8 Pairs of curved Thoracic Ribs
    for (let i = 0; i < 8; i++) {
      const y = 5.4 - (i * 0.28);
      const radius = 1.05 - (i * 0.04);
      const tubeRadius = 0.042;
      
      // Right Rib Arc
      const ribGeoRight = new THREE.TorusGeometry(radius, tubeRadius, 8, 24, Math.PI * 0.58);
      const ribRight = new THREE.Mesh(ribGeoRight, ribMat);
      ribRight.position.set(0.12, y, 0.05);
      ribRight.rotation.x = Math.PI * 0.55;
      ribRight.rotation.y = 0.2;
      ribRight.rotation.z = -Math.PI * 0.28;
      this.skeletonGroup.add(ribRight);

      // Left Rib Arc
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
    // 🫀 1. Heart (القلب)
    this.buildHeart();

    // 🫁 2. Lungs (الرئتان)
    this.buildLungs();

    // 🧠 3. Brain (الدماغ)
    this.buildBrain();

    // 🥗 4. Stomach (المعدة)
    this.buildStomach();

    // 🥢 5. Esophagus (المريء)
    this.buildEsophagus();

    // 👁️ 6. Eyes (العينان)
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

    // Anatomical Ventricles (Left & Right Conical Body)
    const ventricleGeo = new THREE.ConeGeometry(0.48, 0.85, 20);
    const ventricles = new THREE.Mesh(ventricleGeo, heartMat);
    ventricles.rotation.z = Math.PI - 0.25;
    ventricles.rotation.x = 0.18;
    heartGroup.add(ventricles);

    // Atria (Upper Muscular Chambers)
    const atriaGeo = new THREE.SphereGeometry(0.35, 18, 18);
    const leftAtrium = new THREE.Mesh(atriaGeo, heartMat);
    leftAtrium.position.set(-0.2, 0.36, -0.05);
    heartGroup.add(leftAtrium);

    const rightAtrium = new THREE.Mesh(atriaGeo, heartMat);
    rightAtrium.position.set(0.22, 0.34, 0.05);
    heartGroup.add(rightAtrium);

    // Aortic Arch (Great Vessel)
    const aortaMat = new THREE.MeshPhongMaterial({ color: 0xdc2626, shininess: 80 });
    const aortaGeo = new THREE.TorusGeometry(0.24, 0.08, 12, 24, Math.PI * 0.95);
    const aorta = new THREE.Mesh(aortaGeo, aortaMat);
    aorta.position.set(0.04, 0.52, -0.08);
    aorta.rotation.y = 0.4;
    aorta.rotation.z = -0.3;
    heartGroup.add(aorta);

    // Pulmonary Artery (Blue/Cyan Trunk)
    const paMat = new THREE.MeshPhongMaterial({ color: 0x0284c7, shininess: 80 });
    const paGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.45, 14);
    const pa = new THREE.Mesh(paGeo, paMat);
    pa.position.set(-0.06, 0.46, 0.12);
    pa.rotation.z = 0.4;
    pa.rotation.x = 0.25;
    heartGroup.add(pa);

    // Internal Pulsing PointLight
    const heartLight = new THREE.PointLight(0xff1744, 1.8, 3.5);
    heartLight.position.set(0, 0.1, 0.2);
    heartGroup.add(heartLight);

    // Interactive Organ Collider & User Data
    ventricles.userData = { organId: 'heart', group: heartGroup, name: 'القلب' };
    leftAtrium.userData = { organId: 'heart', group: heartGroup, name: 'القلب' };
    rightAtrium.userData = { organId: 'heart', group: heartGroup, name: 'القلب' };
    this.raycastMeshes.push(ventricles, leftAtrium, rightAtrium);

    this.organs.heart = {
      id: 'heart',
      name: 'القلب',
      group: heartGroup,
      light: heartLight,
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

    // Trachea & Main Bronchi
    const tracheaMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, shininess: 80 });
    const tracheaGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.1, 16);
    const trachea = new THREE.Mesh(tracheaGeo, tracheaMat);
    trachea.position.set(0, 0.85, 0.05);
    lungsGroup.add(trachea);

    // Right Lung (3 Anatomical Lobes: Superior, Middle, Inferior)
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

    // Left Lung (2 Lobes with Cardiac Notch contour)
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

    // Pulmonary Internal PointLight
    const lungsLight = new THREE.PointLight(0x38bdf8, 1.4, 4);
    lungsLight.position.set(0, 0.2, 0.2);
    lungsGroup.add(lungsLight);

    // Interactive Colliders
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
      light: lungsLight,
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

    // Left & Right Cerebral Hemispheres with distinct convolution lobes
    const hemiGeo = new THREE.SphereGeometry(0.52, 24, 22);
    const leftHemi = new THREE.Mesh(hemiGeo, brainMat);
    leftHemi.position.set(-0.25, 0.12, 0);
    leftHemi.scale.set(0.85, 0.95, 1.25);
    brainGroup.add(leftHemi);

    const rightHemi = new THREE.Mesh(hemiGeo, brainMat);
    rightHemi.position.set(0.25, 0.12, 0);
    rightHemi.scale.set(0.85, 0.95, 1.25);
    brainGroup.add(rightHemi);

    // Cerebellum (Posterior-Inferior structure)
    const cerebMat = new THREE.MeshPhongMaterial({ color: 0x7c3aed, emissive: 0x5b21b6, shininess: 70 });
    const cerebGeo = new THREE.SphereGeometry(0.32, 18, 16);
    const cerebellum = new THREE.Mesh(cerebGeo, cerebMat);
    cerebellum.position.set(0, -0.32, -0.32);
    cerebellum.scale.set(1.2, 0.7, 0.85);
    brainGroup.add(cerebellum);

    // Brainstem (Pons & Medulla)
    const stemGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.6, 16);
    const brainStem = new THREE.Mesh(stemGeo, cerebMat);
    brainStem.position.set(0, -0.58, -0.15);
    brainGroup.add(brainStem);

    // Neural Synapse PointLight
    const brainLight = new THREE.PointLight(0xc084fc, 1.6, 3.5);
    brainLight.position.set(0, 0.15, 0.1);
    brainGroup.add(brainLight);

    // Interactive Colliders
    [leftHemi, rightHemi, cerebellum].forEach(mesh => {
      mesh.userData = { organId: 'brain', group: brainGroup, name: 'الدماغ' };
      this.raycastMeshes.push(mesh);
    });

    this.organs.brain = {
      id: 'brain',
      name: 'الدماغ',
      group: brainGroup,
      light: brainLight,
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

    // Anatomical J-shaped Muscular Stomach Body
    // Fundus (Rounded upper dome)
    const fundusGeo = new THREE.SphereGeometry(0.42, 20, 20);
    const fundus = new THREE.Mesh(fundusGeo, stomachMat);
    fundus.position.set(-0.15, 0.38, 0.04);
    fundus.scale.set(0.9, 1.05, 0.85);
    stomachGroup.add(fundus);

    // Body of the Stomach (Sweeping curved pocket)
    const bodyGeo = new THREE.CylinderGeometry(0.42, 0.34, 0.85, 20);
    const body = new THREE.Mesh(bodyGeo, stomachMat);
    body.position.set(0, 0.05, 0);
    body.rotation.z = -0.35;
    body.scale.set(1.15, 1, 0.85);
    stomachGroup.add(body);

    // Pyloric Antrum & Duodenal Junction (Curving rightward)
    const antrumGeo = new THREE.SphereGeometry(0.32, 18, 18);
    const antrum = new THREE.Mesh(antrumGeo, stomachMat);
    antrum.position.set(0.32, -0.28, 0.08);
    antrum.scale.set(1.1, 0.85, 0.85);
    stomachGroup.add(antrum);

    // Gastric Churning PointLight
    const stomachLight = new THREE.PointLight(0x10b981, 1.4, 3.2);
    stomachLight.position.set(0, 0.1, 0.15);
    stomachGroup.add(stomachLight);

    [fundus, body, antrum].forEach(mesh => {
      mesh.userData = { organId: 'stomach', group: stomachGroup, name: 'المعدة' };
      this.raycastMeshes.push(mesh);
    });

    this.organs.stomach = {
      id: 'stomach',
      name: 'المعدة',
      group: stomachGroup,
      light: stomachLight,
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

    // Anatomical Peristaltic Curve from Pharynx to Stomach Cardia
    const curvePoints = [
      new THREE.Vector3(0, 6.25, 0.22),     // Pharynx / Throat
      new THREE.Vector3(0, 5.4, 0.05),      // Upper thoracic inlet
      new THREE.Vector3(-0.04, 4.4, -0.08), // Posterior mediastinum (behind heart)
      new THREE.Vector3(-0.24, 3.65, 0.18), // Esophageal hiatus in diaphragm
      new THREE.Vector3(-0.48, 3.42, 0.32)  // Cardia junction entering stomach
    ];
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.11, 14, false);
    const tube = new THREE.Mesh(tubeGeo, esoMat);
    esoGroup.add(tube);

    // Muscular Sphincter Rings along the tube
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

    // Traveling Peristalsis Bolus Light
    const bolusLight = new THREE.PointLight(0xf97316, 1.8, 2.5);
    bolusLight.position.copy(curvePoints[0]);
    esoGroup.add(bolusLight);

    tube.userData = { organId: 'esophagus', group: esoGroup, name: 'المريء' };
    this.raycastMeshes.push(tube);

    this.organs.esophagus = {
      id: 'esophagus',
      name: 'المريء',
      group: esoGroup,
      curve: curve,
      light: bolusLight,
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

      // Sclera Globe
      const eyeGeo = new THREE.SphereGeometry(0.18, 20, 20);
      const sclera = new THREE.Mesh(eyeGeo, scleraMat);
      eyeSubGroup.add(sclera);

      // Iris Ring
      const irisGeo = new THREE.CircleGeometry(0.085, 20);
      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.set(0, 0, 0.178);
      eyeSubGroup.add(iris);

      // Pupil
      const pupilGeo = new THREE.CircleGeometry(0.045, 18);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(0, 0, 0.181);
      eyeSubGroup.add(pupil);

      // Transparent Cornea Cap
      const corneaGeo = new THREE.SphereGeometry(0.11, 16, 16);
      const cornea = new THREE.Mesh(corneaGeo, corneaMat);
      cornea.position.set(0, 0, 0.12);
      cornea.scale.set(1, 1, 0.75);
      eyeSubGroup.add(cornea);

      // Optic Nerve exiting posterior
      const nerveMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const nerveGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.35, 10);
      const nerve = new THREE.Mesh(nerveGeo, nerveMat);
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

    // Visual Focus PointLight
    const eyeLight = new THREE.PointLight(0x38bdf8, 1.4, 2.5);
    eyeLight.position.set(0, 0, 0.35);
    eyesGroup.add(eyeLight);

    this.organs.eye = {
      id: 'eye',
      name: 'العين',
      group: eyesGroup,
      leftEye: leftEye,
      rightEye: rightEye,
      light: eyeLight,
      baseMat: irisMat,
      focusPos: new THREE.Vector3(0, 7.42, 3.2),
      targetPos: new THREE.Vector3(0, 7.42, 0.86),
      scale: 1.0
    };

    this.organsGroup.add(eyesGroup);
  }

  buildHighlightBeacon() {
    // Glowing orbital ring indicating selected organ
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

      // Decelerate auto-rotation when user manually interacts
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
      // Only register click if pointer didn't drag extensively
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
      this.beaconMesh.material.opacity = 0;
      this.flyCameraTo(new THREE.Vector3(2.5, 4.5, 14.5), new THREE.Vector3(0, 3.8, 0));
      this.updateDetailsPanel(null);
      this.updatePillsUI('all');
      return;
    }

    const organ = this.organs[organId];
    if (!organ) return;

    this.setOrganHighlight(organId, true);
    this.updatePillsUI(organId);

    // Position highlight beacon at organ location
    this.beaconMesh.position.copy(organ.targetPos);
    this.beaconMesh.material.opacity = 0.85;

    // Smooth camera glide to frame the organ
    this.flyCameraTo(organ.focusPos, organ.targetPos);

    // Update Arabic side info card
    this.updateDetailsPanel(organId);

    // Provide subtle haptic feedback on mobile if supported
    if (navigator.vibrate) {
      try { navigator.vibrate(30); } catch (e) {}
    }
  }

  setOrganHighlight(organId, highlight) {
    const organ = this.organs[organId];
    if (!organ) return;

    if (highlight) {
      organ.baseMat.emissiveIntensity = 0.95;
      if (organ.light) organ.light.intensity = 2.4;
    } else {
      organ.baseMat.emissiveIntensity = 0.45;
      if (organ.light) organ.light.intensity = 1.4;
    }
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
    // 1. Organ Pills Selection
    document.querySelectorAll('.organ-3d-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const organId = pill.getAttribute('data-organ');
        this.selectOrgan(organId);
      });
    });

    // 2. View Preset Buttons
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

    // 3. Auto-Rotate Toggle
    const btnAutoRotate = document.getElementById('b3d-btn-autorotate');
    if (btnAutoRotate) {
      btnAutoRotate.addEventListener('click', () => {
        this.autoRotateEnabled = !this.autoRotateEnabled;
        if (this.controls) this.controls.autoRotate = this.autoRotateEnabled;
        btnAutoRotate.classList.toggle('active', this.autoRotateEnabled);
      });
    }

    // 4. Biological Pulse Toggle
    const btnPulse = document.getElementById('b3d-btn-pulse');
    if (btnPulse) {
      btnPulse.addEventListener('click', () => {
        this.pulseEnabled = !this.pulseEnabled;
        btnPulse.classList.toggle('active', this.pulseEnabled);
      });
    }

    // 5. Body Shell Opacity Toggle
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

    // 6. Zoom Buttons
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

    // 1. Update Camera Orbit Controls
    if (this.controls) {
      this.controls.update();
    }

    // 2. Camera Glide Tween
    if (this.cameraTarget.active) {
      this.cameraTarget.progress += delta / this.cameraTarget.duration;
      const t = Math.min(1.0, this.cameraTarget.progress);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(this.cameraTarget.startPos, this.cameraTarget.pos, ease);
      if (this.controls) {
        this.controls.target.lerpVectors(this.cameraTarget.startLookAt, this.cameraTarget.lookAt, ease);
      }

      if (t >= 1.0) {
        this.cameraTarget.active = false;
      }
    }

    // 3. Highlight Beacon Rotation
    if (this.beaconMesh && this.beaconMesh.material.opacity > 0) {
      this.beaconMesh.rotation.z += delta * 1.5;
      const pulseScale = 1.0 + Math.sin(time * 4) * 0.08;
      this.beaconMesh.scale.set(pulseScale, pulseScale, pulseScale);
    }

    // 4. Pedestal Slow Rotation
    if (this.pedestalGroup) {
      this.pedestalGroup.rotation.y += delta * 0.12;
    }

    // 5. Biological Organ Animations & Blinking Glow Effects
    if (this.pulseEnabled) {
      this.animateOrganFunctions(time, delta);
    }
  }

  animateOrganFunctions(time, delta) {
    // 🫀 1. Heart: Double-beat Cardiac Lub-Dub Cycle (~72 bpm)
    if (this.organs.heart) {
      const beatCycle = (time * 1.2) % 1.0;
      let heartScale = 1.0;
      let lightFlash = 1.2;

      if (beatCycle < 0.15) {
        // Ventricular Systole (Lub)
        const subT = beatCycle / 0.15;
        heartScale = 1.0 + Math.sin(subT * Math.PI) * 0.18;
        lightFlash = 2.4;
      } else if (beatCycle >= 0.22 && beatCycle < 0.35) {
        // Atrial kick & valve snap (Dub)
        const subT = (beatCycle - 0.22) / 0.13;
        heartScale = 1.0 + Math.sin(subT * Math.PI) * 0.11;
        lightFlash = 1.9;
      }

      this.organs.heart.group.scale.set(heartScale, heartScale, heartScale);
      if (this.organs.heart.light) {
        this.organs.heart.light.intensity = lightFlash;
      }
    }

    // 🫁 2. Lungs: Smooth Respiratory Inhalation & Exhalation (~15 breaths/min)
    if (this.organs.lungs) {
      const breath = Math.sin(time * 1.6);
      const breathScaleX = 1.0 + breath * 0.12;
      const breathScaleZ = 1.0 + breath * 0.15;
      const breathScaleY = 1.0 + breath * 0.05;

      this.organs.lungs.leftLung.scale.set(breathScaleX, breathScaleY, breathScaleZ);
      this.organs.lungs.rightLung.scale.set(breathScaleX, breathScaleY, breathScaleZ);

      if (this.organs.lungs.light) {
        this.organs.lungs.light.intensity = 1.2 + breath * 0.6;
      }
    }

    // 🧠 3. Brain: Rapid Neural Synapses Scintillation
    if (this.organs.brain) {
      const synPulse = 0.5 + 0.5 * Math.sin(time * 7.5) * Math.cos(time * 3.2);
      this.organs.brain.baseMat.emissiveIntensity = 0.4 + synPulse * 0.45;
      if (this.organs.brain.light) {
        this.organs.brain.light.intensity = 1.2 + synPulse * 0.8;
      }
    }

    // 🥗 4. Stomach: Gastrointestinal Churning Peristalsis
    if (this.organs.stomach) {
      const digest = Math.sin(time * 2.2);
      this.organs.stomach.group.scale.y = 1.0 + digest * 0.05;
      this.organs.stomach.group.scale.x = 1.0 - digest * 0.04;
      if (this.organs.stomach.light) {
        this.organs.stomach.light.intensity = 1.1 + Math.abs(digest) * 0.5;
      }
    }

    // 🥢 5. Esophagus: Traveling Peristaltic Bolus Pulse (Every 3.2 seconds)
    if (this.organs.esophagus && this.organs.esophagus.curve) {
      const waveT = (time * 0.35) % 1.0;
      const wavePt = this.organs.esophagus.curve.getPoint(waveT);
      if (this.organs.esophagus.light) {
        this.organs.esophagus.light.position.copy(wavePt);
        this.organs.esophagus.light.intensity = 1.6 + Math.sin(time * 10) * 0.3;
      }
    }

    // 👁️ 6. Eyes: Saccadic Focus & Blink Dilation
    if (this.organs.eye) {
      const eyeBlink = Math.sin(time * 0.8);
      if (this.organs.eye.light) {
        this.organs.eye.light.intensity = 1.0 + Math.max(0, eyeBlink) * 0.6;
      }
    }
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 550;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

// Global initialization function invoked from app.js
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
