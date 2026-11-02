// Web Audio API Sound Engine (with 10-second immersive biological audio loops)
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.currentOrgan = null;
    this.timerId = null;
    this.intervalId = null;
    this.activeNodes = [];
    this.remainingSeconds = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopOrganSound();
    return this.enabled;
  }

  stopOrganSound() {
    if (this.timerId) clearTimeout(this.timerId);
    if (this.intervalId) clearInterval(this.intervalId);
    this.activeNodes.forEach(node => {
      try { node.stop(); } catch (e) {}
      try { node.disconnect(); } catch (e) {}
    });
    this.activeNodes = [];
    this.currentOrgan = null;
    this.remainingSeconds = 0;
    updateSoundButtonUI(false, 0);
  }

  playOrgan10Seconds(organId) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Toggle off if already playing the same organ
    if (this.currentOrgan === organId) {
      this.stopOrganSound();
      return;
    }

    // Stop any existing playback first
    this.stopOrganSound();
    this.currentOrgan = organId;
    this.remainingSeconds = 10;
    updateSoundButtonUI(true, this.remainingSeconds);

    const now = this.ctx.currentTime;
    const duration = 10; // Exactly 10 seconds

    // Countdown interval for button UI
    this.intervalId = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds > 0) {
        updateSoundButtonUI(true, this.remainingSeconds);
      } else {
        this.stopOrganSound();
      }
    }, 1000);

    // Generate organ specific 10-second soundscape
    switch (organId) {
      case 'heart':
        this.synthesizeHeartbeat10s(now, duration);
        break;
      case 'lungs':
        this.synthesizeBreathing10s(now, duration);
        break;
      case 'brain':
        this.synthesizeBrainwaves10s(now, duration);
        break;
      case 'stomach':
        this.synthesizeStomachDigestion10s(now, duration);
        break;
      case 'esophagus':
        this.synthesizePeristalsis10s(now, duration);
        break;
      case 'eye':
        this.synthesizeOpticSignals10s(now, duration);
        break;
      default:
        this.synthesizeHeartbeat10s(now, duration);
    }

    // Safety timeout to ensure stop at 10 seconds
    this.timerId = setTimeout(() => {
      this.stopOrganSound();
    }, duration * 1000);
  }

  // 1. Heart: 10 seconds of realistic lub-dub pulses (~72 BPM)
  synthesizeHeartbeat10s(startTime, totalDuration) {
    const pulseInterval = 0.83; // ~72 BPM
    const count = Math.floor(totalDuration / pulseInterval);

    for (let i = 0; i < count; i++) {
      const beatTime = startTime + i * pulseInterval;
      
      // Lub (First heart sound - low frequency)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(68, beatTime);
      osc1.frequency.exponentialRampToValueAtTime(32, beatTime + 0.16);
      gain1.gain.setValueAtTime(0.42, beatTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.16);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(beatTime);
      osc1.stop(beatTime + 0.18);
      this.activeNodes.push(osc1);

      // Dub (Second heart sound - slightly higher pitch, shorter)
      const dubTime = beatTime + 0.22;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(85, dubTime);
      osc2.frequency.exponentialRampToValueAtTime(36, dubTime + 0.14);
      gain2.gain.setValueAtTime(0.35, dubTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, dubTime + 0.14);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(dubTime);
      osc2.stop(dubTime + 0.16);
      this.activeNodes.push(osc2);
    }
  }

  // 2. Lungs: 10 seconds of calm deep breathing cycles (Inhale ~2.2s, Exhale ~2.2s)
  synthesizeBreathing10s(startTime, totalDuration) {
    const breathDuration = 4.8; // ~2.2s inhale + ~0.4s pause + ~2.2s exhale
    const count = Math.ceil(totalDuration / breathDuration);

    for (let i = 0; i < count; i++) {
      const cycleStart = startTime + i * breathDuration;
      if (cycleStart >= startTime + totalDuration) break;

      // Inhale (شهيق)
      const oscIn = this.ctx.createOscillator();
      const gainIn = this.ctx.createGain();
      oscIn.type = 'triangle';
      oscIn.frequency.setValueAtTime(130, cycleStart);
      oscIn.frequency.exponentialRampToValueAtTime(260, cycleStart + 2.0);
      gainIn.gain.setValueAtTime(0.02, cycleStart);
      gainIn.gain.linearRampToValueAtTime(0.28, cycleStart + 1.8);
      gainIn.gain.exponentialRampToValueAtTime(0.001, cycleStart + 2.2);
      oscIn.connect(gainIn);
      gainIn.connect(this.ctx.destination);
      oscIn.start(cycleStart);
      oscIn.stop(cycleStart + 2.2);
      this.activeNodes.push(oscIn);

      // Exhale (زفير)
      const exStart = cycleStart + 2.4;
      if (exStart < startTime + totalDuration) {
        const oscEx = this.ctx.createOscillator();
        const gainEx = this.ctx.createGain();
        oscEx.type = 'sine';
        oscEx.frequency.setValueAtTime(220, exStart);
        oscEx.frequency.exponentialRampToValueAtTime(110, exStart + 2.2);
        gainEx.gain.setValueAtTime(0.24, exStart);
        gainEx.gain.exponentialRampToValueAtTime(0.001, exStart + 2.2);
        oscEx.connect(gainEx);
        gainEx.connect(this.ctx.destination);
        oscEx.start(exStart);
        oscEx.stop(exStart + 2.2);
        this.activeNodes.push(oscEx);
      }
    }
  }

  // 3. Brain: 10 seconds of gentle neural frequencies & synaptic sparks
  synthesizeBrainwaves10s(startTime, totalDuration) {
    // Ambient theta carrier wave (Relaxing brainwave)
    const carrier = this.ctx.createOscillator();
    const carrierGain = this.ctx.createGain();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(216, startTime);
    carrierGain.gain.setValueAtTime(0.08, startTime);
    carrierGain.gain.linearRampToValueAtTime(0.001, startTime + totalDuration);
    carrier.connect(carrierGain);
    carrierGain.connect(this.ctx.destination);
    carrier.start(startTime);
    carrier.stop(startTime + totalDuration);
    this.activeNodes.push(carrier);

    // Neural Synaptic Spark Chimes across the 10 seconds
    const chimesCount = 14;
    const notes = [523.25, 659.25, 783.99, 880.00, 1046.50];
    for (let i = 0; i < chimesCount; i++) {
      const sparkTime = startTime + i * 0.7 + (Math.random() * 0.2);
      if (sparkTime >= startTime + totalDuration) break;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const note = notes[i % notes.length];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, sparkTime);
      gain.gain.setValueAtTime(0.12, sparkTime);
      gain.gain.exponentialRampToValueAtTime(0.001, sparkTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(sparkTime);
      osc.stop(sparkTime + 0.38);
      this.activeNodes.push(osc);
    }
  }

  // 4. Stomach: 10 seconds of rhythmic gastric churning & enzymatic digestion
  synthesizeStomachDigestion10s(startTime, totalDuration) {
    const churnCount = 5;
    for (let i = 0; i < churnCount; i++) {
      const churnTime = startTime + i * 1.9;
      if (churnTime >= startTime + totalDuration) break;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, churnTime);
      osc.frequency.linearRampToValueAtTime(130, churnTime + 0.8);
      osc.frequency.exponentialRampToValueAtTime(65, churnTime + 1.6);
      gain.gain.setValueAtTime(0.03, churnTime);
      gain.gain.linearRampToValueAtTime(0.22, churnTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, churnTime + 1.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(churnTime);
      osc.stop(churnTime + 1.6);
      this.activeNodes.push(osc);
    }
  }

  // 5. Esophagus: 10 seconds of peristaltic wave downward gliding
  synthesizePeristalsis10s(startTime, totalDuration) {
    const wavesCount = 3;
    for (let i = 0; i < wavesCount; i++) {
      const waveTime = startTime + i * 3.2;
      if (waveTime >= startTime + totalDuration) break;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, waveTime);
      osc.frequency.exponentialRampToValueAtTime(95, waveTime + 2.5);
      gain.gain.setValueAtTime(0.05, waveTime);
      gain.gain.linearRampToValueAtTime(0.24, waveTime + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, waveTime + 2.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(waveTime);
      osc.stop(waveTime + 2.6);
      this.activeNodes.push(osc);
    }
  }

  // 6. Eye: 10 seconds of focused optic pulses & light refraction sweep
  synthesizeOpticSignals10s(startTime, totalDuration) {
    const pulseCount = 7;
    for (let i = 0; i < pulseCount; i++) {
      const pulseTime = startTime + i * 1.4;
      if (pulseTime >= startTime + totalDuration) break;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, pulseTime);
      osc.frequency.exponentialRampToValueAtTime(880, pulseTime + 0.4);
      gain.gain.setValueAtTime(0.18, pulseTime);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(pulseTime);
      osc.stop(pulseTime + 0.62);
      this.activeNodes.push(osc);
    }
  }

  playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [587.33, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.2, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.35);
    });
  }

  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.25);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);
      gain.gain.setValueAtTime(0.3, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.45);
    });
  }
}

const sounds = new SoundEngine();

// Helper to update both sound buttons (Sidebar + 3D Card) with 10-second countdown
function updateSoundButtonUI(isPlaying, secondsLeft) {
  const organ = organsData[state.currentOrgan];
  const soundBtn = document.getElementById('organ-sound-btn');
  const stageBtn = document.querySelector('.natural-zoom-btn');

  if (isPlaying) {
    const playingText = `🔊 جاري الاستماع (${secondsLeft} ثوانٍ) • اضغط للإيقاف`;
    if (soundBtn) {
      soundBtn.innerHTML = `<span>⏹️</span> <span>${playingText}</span>`;
      soundBtn.style.background = 'linear-gradient(135deg, #fce7f3, #ffe4e6)';
      soundBtn.style.borderColor = '#f43f5e';
      soundBtn.style.color = '#e11d48';
    }
    if (stageBtn) {
      stageBtn.innerHTML = `<span>⏹️</span> <span>${playingText}</span>`;
      stageBtn.style.background = '#ffe4e6';
      stageBtn.style.color = '#e11d48';
    }
  } else {
    if (!organ) return;
    if (soundBtn) {
      soundBtn.innerHTML = `<span>🔊</span> <span>${organ.soundLabel} (10 ثوانٍ)</span>`;
      soundBtn.style.background = '';
      soundBtn.style.borderColor = '';
      soundBtn.style.color = '';
    }
    if (stageBtn) {
      stageBtn.innerHTML = `<span>🔊</span> <span>${organ.soundLabel} (10 ثوانٍ)</span>`;
      stageBtn.style.background = '';
      stageBtn.style.color = '';
    }
  }
}

// Natural realistic image paths
const organImages = {
  heart: 'assets/heart.png',
  lungs: 'assets/lungs.png',
  stomach: 'assets/stomach.png',
  brain: 'assets/brain.png',
  eye: 'assets/eye.png',
  esophagus: 'assets/esophagus.png'
};

// Anatomical Hotspots for each 3D organ
const anatomicalHotspots = {
  heart: [
    { top: '20%', left: '50%', title: 'الشريان الأبهر (الأورطي)', desc: 'أكبر شريان في الجسم، ينقل الدم الغني بالأكسجين من القلب إلى كافة الأعضاء.' },
    { top: '34%', left: '30%', title: 'الوريد الأجوف العلوي', desc: 'يعيد الدم غير المؤكسج من الرأس والذراعين إلى الأذين الأيمن للقلب.' },
    { top: '65%', left: '60%', title: 'البطين الأيسر', desc: 'يمتلك الجدار العضلي الأكثر سماكة وقوة لضخ الدم إلى كامل أنحاء الجسم.' },
    { top: '50%', left: '72%', title: 'الشرايين التاجية', desc: 'شبكة أوعية دقيقة تلتف حول القلب لتغذي عضلة القلب نفسها باستمرار.' }
  ],
  lungs: [
    { top: '16%', left: '50%', title: 'القصبة الهوائية (Trachea)', desc: 'أنبوب غضروفي مقوّى بحلقات غضروفية لضمان بقائه مفتوحاً دائماً لمرور الهواء.' },
    { top: '40%', left: '30%', title: 'الرئة اليمنى (3 فصوص)', desc: 'أكبر حجماً من اليسرى وتتكون من ثلاثة فصوص لتبادل كمية أكسجين أكبر.' },
    { top: '48%', left: '70%', title: 'الرئة اليسرى (فصان)', desc: 'تتكون من فصين فقط وبها تجويف مميز يترك متسعاً للقلب ليستقر بجانبها.' },
    { top: '70%', left: '42%', title: 'الحويصلات الهوائية الدقيقة', desc: 'ملايين الحويصلات المجهرية التي يتم عبر جدرانها الرقيقة تبادل الغازات مع الدم.' }
  ],
  stomach: [
    { top: '18%', left: '38%', title: 'فتحة الفؤاد (العضلة العاصرة)', desc: 'صمام عضلي محكم يفتح لمرور الطعام ويغلق فوراً لمنع ارتجاع الحمض نحو المريء.' },
    { top: '42%', left: '62%', title: 'قاع وجسم المعدة', desc: 'المستودع الرئيسي حيث تفرز العصارة الحمضية وإنزيمات هضم البروتينات.' },
    { top: '72%', left: '46%', title: 'عضلات جدار المعدة', desc: 'ثلاث طبقات عضلية قوية تنقبض وتسترخي لطحن الطعام وخلطه بالعصارات.' },
    { top: '62%', left: '74%', title: 'فتحة البواب (Pylorus)', desc: 'صمام ينظم خروج الكيموس (الطعام المهضوم جزئياً) إلى الاثني عشر تدريجياً.' }
  ],
  brain: [
    { top: '30%', left: '50%', title: 'القشرة المخية (Cerebral Cortex)', desc: 'المسؤولة عن التفكير والذاكرة واتخاذ القرارات واللغة ومعالجة الإشارات الحسية.' },
    { top: '70%', left: '32%', title: 'المخيخ (Cerebellum)', desc: 'يقع في قاعدة الدماغ من الخلف، ومسؤول عن توازن الجسم وتناسق الحركات.' },
    { top: '82%', left: '54%', title: 'جذع الدماغ (Brainstem)', desc: 'مركز التحكم التلقائي بالوظائف الحيوية مثل نبضات القلب والتنفس وضغط الدم.' }
  ],
  eye: [
    { top: '48%', left: '50%', title: 'القرنية والقزحية والبؤبؤ', desc: 'القرنية الشفافة تكسر الضوء، والقزحية الملونة تضبط اتساع البؤبؤ وفق شدة الضوء.' },
    { top: '26%', left: '68%', title: 'الصلبة (بياض العين)', desc: 'غلاف ليفي خارجي قوي يحمي تراكيب العين الداخلية الدقيقة.' },
    { top: '56%', left: '16%', title: 'العصب البصري (Optic Nerve)', desc: 'ينقل النبضات الضوئية من الشبكية مباشرة إلى الفص البصري في الدماغ لتفسير الصور.' }
  ],
  esophagus: [
    { top: '15%', left: '50%', title: 'مدخل المريء (البلعوم)', desc: 'ممر البلع الذي يستقبل اللقمة الغذائية ويوجهها للمريء ويغلق مجرى التنفس.' },
    { top: '45%', left: '50%', title: 'أنبوب المريء العضلي', desc: 'أنبوب بطول 25 سم يدفع الطعام بحركات انقباضية لاإرادية متتابعة (الحركة الدودية).' },
    { top: '80%', left: '60%', title: 'الاتصال بالمعدة', desc: 'المنطقة التي تسلّم الطعام إلى تجويف المعدة لتبدأ عملية الهضم.' }
  ]
};

// Default ThingLink links map
const defaultThinglinkLinks = {
  heart: 'https://www.thinglink.com/view/scenario/2168685017595642724',
  lungs: 'https://www.thinglink.com/scene/2170804325553537892',
  brain: 'https://www.thinglink.com/scene/2170805178872103780',
  stomach: 'https://www.thinglink.com/scene/2170805378181235556',
  esophagus: 'https://www.thinglink.com/scene/2170805708436538212',
  eye: 'https://www.thinglink.com/scene/2170805533588587364'
};

function getThingLinkUrls() {
  try {
    const saved = localStorage.getItem('custom_thinglink_links');
    if (saved) {
      return { ...defaultThinglinkLinks, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error(e);
  }
  return { ...defaultThinglinkLinks };
}

function saveThingLinkUrls(urls) {
  try {
    localStorage.setItem('custom_thinglink_links', JSON.stringify(urls));
  } catch (e) {
    console.error(e);
  }
}

// Organs Base Data
const organsData = {
  heart: {
    id: 'heart',
    name: 'القلب',
    questionIndices: [0, 1, 2],
    tag: 'الجهاز الدوراني',
    summary: 'القلب هو المضخة المركزية التي لا تتوقف طوال الحياة، ينبض حوالي 100,000 مرة في اليوم ليضخ الدم الغني بالأكسجين إلى خلايا الجسم كاملة.',
    location: 'في وسط الصدر بين الرئتين مع ميل بسيط نحو اليسار، محمي بالقفص الصدري.',
    function: 'استقبال الدم وتوزيعه عبر شبكة واسعة من الأوعية والشرايين لنقل الغذاء والأكسجين لكل خلية في جسمك.',
    funFact: 'يضخ القلب ما يعادل 7,500 لتر من الدم يومياً، ولو مدّدنا شبكة الأوعية الدموية في جسم الإنسان لالتفت حول الأرض مرتين!',
    soundAction: () => sounds.playOrgan10Seconds('heart'),
    soundLabel: 'استمع لنبضات القلب 💓'
  },
  lungs: {
    id: 'lungs',
    name: 'الرئتان',
    questionIndices: [3, 4, 5],
    tag: 'الجهاز التنفسي',
    summary: 'الرئتان هما العضو المسؤول عن استخلاص الأكسجين من الهواء وتمريره للدم، والتخلص من غاز ثاني أكسيد الكربون الضار.',
    location: 'داخل التجويف الصدري، تملأ جانبي الصدر ويحميها القفص الصدري.',
    function: 'تبادل الغازات بين الهواء الخارجي ومجرى الدم من خلال الحويصلات الهوائية الدقيقة.',
    funFact: 'الرئة اليسرى أصغر قليلاً من الرئة اليمنى لتترك مساحة كافية للقلب، وتحتوي الرئتان معاً على حوالي 300 إلى 500 مليون حويصلة هوائية!',
    soundAction: () => sounds.playOrgan10Seconds('lungs'),
    soundLabel: 'استمع لصوت التنفس 🌬️'
  },
  stomach: {
    id: 'stomach',
    name: 'المعدة',
    questionIndices: [6, 7, 8],
    tag: 'الجهاز الهضمي',
    summary: 'المعدة كيس عضلي مرن يفرز عصارات وأحماضاً قوية تطحن الطعام وتفتته إلى مزيج سائل لتسهيل امتصاص الغذاء لاحقاً في الأمعاء.',
    location: 'في الجزء العلوي الأيسر من تجويف البطن، أسفل الحجاب الحاجز مباشرة.',
    function: 'تفتيت البروتينات وخلط الطعام بالعصارة الهيدروكلورية وإنزيم البيبسين للقضاء على البكتيريا وهضم الطعام.',
    funFact: 'حمض المعدة قوي جداً لدرجة أنه قادر على إذابة بعض المعادن، لكن جدار المعدة يفرز طبقة مخاطية سميكة تجدّد نفسها باستمرار لحماية نفسها!',
    soundAction: () => sounds.playOrgan10Seconds('stomach'),
    soundLabel: 'تنشيط العصارة الهاضمة 🧪'
  },
  brain: {
    id: 'brain',
    name: 'الدماغ',
    questionIndices: [9, 10, 11],
    tag: 'الجهاز العصبي',
    summary: 'الدماغ هو مركز التحكم والقيادة في الجسم؛ يستقبل إشارات الحواس، ويفسرها، ويتخذ القرارات، ويخزن الذكريات، وينظم حركة العضلات.',
    location: 'داخل الجمجمة الصلبة التي تحميه من الصدمات.',
    function: 'معالجة المعلومات، التفكير، الذاكرة، المشاعر، وتوجيه إشارات سريعة عبر الأعصاب لجميع الأعضاء.',
    funFact: 'يحتوي الدماغ البشري على نحو 86 مليار خلية عصبية ترسل الإشارات الكهربائية بسرعة فائقة تصل إلى 400 كم في الساعة!',
    soundAction: () => sounds.playOrgan10Seconds('brain'),
    soundLabel: 'إشارات ونبضات العصبونات ⚡'
  },
  eye: {
    id: 'eye',
    name: 'العين',
    questionIndices: [12, 13, 14],
    tag: 'أعضاء الحواس',
    summary: 'العين نافذة الإنسان على العالم الخارجي؛ تلتقط الأشعة الضوئية وتركّزها على الشبكية التي تحولها إلى نبضات كهربائية يفسرها الدماغ كصور وألوان.',
    location: 'في محجر العين العظمي في الوجه لحمايتها.',
    function: 'استقبال الضوء وتكوين الصور البصرية ونقلها للدماغ عبر العصب البصري.',
    funFact: 'تستطيع العين البشرية التمييز بين أكثر من 10 ملايين لون مختلف، وترمش العين حوالي 15-20 مرة في الدقيقة لترطيبها وحمايتها!',
    soundAction: () => sounds.playOrgan10Seconds('eye'),
    soundLabel: 'تفاعل العدسة والضوء 💡'
  },
  esophagus: {
    id: 'esophagus',
    name: 'المريء والمعدة',
    questionIndices: [15, 16, 17],
    tag: 'الممر الهضمي',
    summary: 'المريء هو أنبوب عضلي مرن يصل بين البلعوم والمعدة، يدفع بلع الطعام بحركات عضلية انقباضية لاإرادية تُسمى الحركة الدودية.',
    location: 'يمتد خلف القصبة الهوائية والقلب ماراً عبر الحجاب الحاجز ليصل إلى أعلى المعدة.',
    function: 'توصيل اللقمة الغذائية بأمان وسلاسة من الفم إلى المعدة ومنع رجوعها بالصمام العاصر.',
    funFact: 'بفضل الحركات العضلية الدودية، يمكن للإنسان بلع الطعام والماء حتى لو كان مقلوباً رأساً على عقب!',
    soundAction: () => sounds.playOrgan10Seconds('esophagus'),
    soundLabel: 'محاكاة الحركة الدودية 🔄'
  }
};

// 18 Questions
const quizData = [
  {
    q: "1) ما العضو الذي يضخ الدم إلى أنحاء الجسم؟",
    options: ["القلب", "الرئتان", "المعدة", "العين"],
    correct: "القلب",
    explain: "القلب هو العضلة الأساسية التي تضخ الدم المؤكسج إلى جميع أنسجة وخلايا الجسم."
  },
  {
    q: "2) أين يقع القلب غالبًا؟",
    options: ["في الصدر", "في الساق", "في الرأس", "في اليد"],
    correct: "في الصدر",
    explain: "يقع القلب في التجويف الصدري بين الرئتين مع ميل بسيط إلى اليسار."
  },
  {
    q: "3) ماذا يحمل الدم إلى خلايا الجسم؟",
    options: ["الأكسجين والمواد الغذائية", "الهواء الخارجي مباشرة", "الطعام غير المهضوم", "الضوء"],
    correct: "الأكسجين والمواد الغذائية",
    explain: "يحمل الدم خلايا الدم الحمراء المحملة بالأكسجين والمواد الغذائية المهضومة لتغذية الخلايا."
  },
  {
    q: "4) ما وظيفة الرئتين الأساسية؟",
    options: ["المساعدة على تبادل الغازات والتنفس", "هضم الطعام", "ضخ الدم", "تفسير الصور"],
    correct: "المساعدة على تبادل الغازات والتنفس",
    explain: "الرئتان تقومان بإدخال الأكسجين للدم وإخراج ثاني أكسيد الكربون."
  },
  {
    q: "5) أي غاز ينتقل من الرئتين إلى الدم؟",
    options: ["الأكسجين", "ثاني أكسيد الكربون فقط", "النيتروجين فقط", "بخار الماء فقط"],
    correct: "الأكسجين",
    explain: "ينتقل غاز الأكسجين النقي من الحويصلات الهوائية إلى الشعيرات الدموية."
  },
  {
    q: "6) أين تقع الرئتان؟",
    options: ["في الصدر", "في البطن", "في الساقين", "في اليدين"],
    correct: "في الصدر",
    explain: "تحتل الرئتان معظم التجويف الصدري ويحميهما القفص الصدري."
  },
  {
    q: "7) إلى أي عضو يصل الطعام بعد مروره في المريء؟",
    options: ["المعدة", "العين", "الدماغ", "الرئتان"],
    correct: "المعدة",
    explain: "ينقل المريء اللقمة الغذائية من الحلق مباشرة إلى المعدة."
  },
  {
    q: "8) ما دور المعدة في الهضم؟",
    options: ["تخلط الطعام بالعصارات وتساعد على تفكيكه", "تنقل الإشارات البصرية", "تضخ الدم", "تُخرج الهواء"],
    correct: "تخلط الطعام بالعصارات وتساعد على تفكيكه",
    explain: "تفرز المعدة أحماضاً وإنزيمات وتتحرك لطحن الطعام وتفكيكه كيميائياً وميكانيكياً."
  },
  {
    q: "9) إلى أين ينتقل الطعام ليكمل الهضم بعد المعدة؟",
    options: ["الأمعاء", "الرئتان", "العين", "القلب"],
    correct: "الأمعاء",
    explain: "يخرج الطعام شبه السائل من المعدة إلى الأمعاء الدقيقة لامتصاص العناصر الغذائية."
  },
  {
    q: "10) ما وظيفة من وظائف الدماغ؟",
    options: ["التفكير والتذكر", "هضم الطعام", "نقل الطعام إلى المعدة", "تبادل الغازات"],
    correct: "التفكير والتذكر",
    explain: "الدماغ هو مركز التفكير، الذاكرة، المشاعر، وتوجيه سائر أعضاء الجسم."
  },
  {
    q: "11) كيف تنتقل إشارات الدماغ إلى أجزاء الجسم؟",
    options: ["عبر الأعصاب", "عبر المريء", "عبر الأوعية الهوائية", "عبر المعدة"],
    correct: "عبر الأعصاب",
    explain: "ينقل الجهاز العصبي السيالات الكهربائية عبر شبكة الأعصاب الممتدة في الجسم."
  },
  {
    q: "12) أي عضو يساعد على تفسير ما تراه العين؟",
    options: ["الدماغ", "المعدة", "الرئتان", "المريء"],
    correct: "الدماغ",
    explain: "العين تلتقط الضوء، ولكن الفص البصري في الدماغ هو الذي يفسر الإشارات إلى صور مفهومة."
  },
  {
    q: "13) ما الذي يساعد العين على الرؤية؟",
    options: ["الضوء", "العصارات الهاضمة", "الدم", "الهواء في المعدة"],
    correct: "الضوء",
    explain: "الضوء ينعكس من الأجسام ويدخل العين عبر القرنية والبؤبؤ ليسمح بالرؤية."
  },
  {
    q: "14) أي جزء داخل العين يستقبل الضوء؟",
    options: ["الشبكية", "المعدة", "القصبة الهوائية", "الأمعاء"],
    correct: "الشبكية",
    explain: "الشبكية في قاع العين تحتوي على مستقبلات ضوئية تحول الضوء إلى نبضات عصبية."
  },
  {
    q: "15) إلى أين تنتقل الإشارات البصرية عبر العصب البصري؟",
    options: ["إلى الدماغ", "إلى المعدة", "إلى الرئتين", "إلى القلب فقط"],
    correct: "إلى الدماغ",
    explain: "يمتد العصب البصري من خلف العين مباشرة إلى مراكز الإبصار في الدماغ."
  },
  {
    q: "16) ما العضو الذي يصل الحلق بالمعدة؟",
    options: ["المريء", "القصبة الهوائية", "العصب البصري", "الأمعاء الغليظة"],
    correct: "المريء",
    explain: "المريء هو الأنبوب العضلي الرابط بين البلعوم والمعدة."
  },
  {
    q: "17) كيف يدفع المريء الطعام إلى أسفل؟",
    options: ["بحركات عضلية متتابعة", "بضخ الدم", "بالتنفس", "بالرؤية"],
    correct: "بحركات عضلية متتابعة",
    explain: "تدفع عضلات المريء الطعام بحركات انقباضية دودية لاإرادية متتابعة نحو الأسفل."
  },
  {
    q: "18) ما المحطة التالية للطعام بعد المريء؟",
    options: ["المعدة", "الدماغ", "العين", "الرئتان"],
    correct: "المعدة",
    explain: "تفتح العضلة العاصرة للمريء لتستقبل المعدة الطعام وتبدأ هضمه."
  }
];

// App State
let state = {
  currentTab: 'home',
  currentOrgan: 'heart',
  organViewerMode: 'simulation', // Default to realistic natural 3D model for immediate visual impact!
  exploredOrgans: new Set(),
  quizCurrentIndex: 0,
  quizScore: 0,
  quizAnswers: {},
  portfolioType: 'beginner',
  soundEnabled: true,
  studentName: 'الطالب/ـة المتميز/ـة'
};

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupOrganExplorer();
  setupQuiz();
  setupPortfolio();
  setupSurvey();
  setupSoundToggle();
  setupThingLinkModal();
  updateProgressTracker();
});

// Setup Navigation
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Mobile Bottom App Bar Navigation
  const mNavBtns = document.querySelectorAll('.m-nav-item');
  mNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      triggerHaptic(25);
      switchTab(targetTab);
    });
  });

  const roadmapCards = document.querySelectorAll('.roadmap-card');
  roadmapCards.forEach(card => {
    card.addEventListener('click', () => {
      const tab = card.getAttribute('data-target');
      if (tab) switchTab(tab);
    });
  });
}

// Haptic feedback for Mobile Devices
function triggerHaptic(pattern) {
  if (navigator && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration error
    }
  }
}

function switchTab(tabId) {
  if (state.currentTab !== tabId && tabId !== 'organs') {
    sounds.stopOrganSound();
  }
  state.currentTab = tabId;
  
  // Desktop Nav Buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Mobile Bottom Nav Items
  document.querySelectorAll('.m-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Content Tabs
  document.querySelectorAll('.app-tab-content').forEach(section => {
    section.classList.toggle('active', section.id === `tab-${tabId}`);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatThingLinkEmbedUrl(rawUrl) {
  if (!rawUrl) return '';
  rawUrl = rawUrl.trim();
  if (/^\d+$/.test(rawUrl)) {
    return `https://www.thinglink.com/card/${rawUrl}`;
  }
  if (rawUrl.includes('/scene/')) {
    const id = rawUrl.split('/scene/')[1].split(/[?#]/)[0];
    return `https://www.thinglink.com/card/${id}`;
  }
  if (rawUrl.includes('/card/')) {
    return rawUrl;
  }
  if (rawUrl.includes('/view/scenario/')) {
    return rawUrl;
  }
  return rawUrl;
}

// Setup Organ Explorer
function setupOrganExplorer() {
  const tabsContainer = document.getElementById('organ-tabs-container');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = '';
  Object.keys(organsData).forEach(key => {
    const organ = organsData[key];
    const btn = document.createElement('button');
    btn.className = `organ-tab-btn ${key === state.currentOrgan ? 'active' : ''}`;
    btn.innerHTML = `
      <img src="${organImages[key]}" alt="${organ.name}" class="organ-tab-thumb">
      <span>${organ.name}</span>
    `;
    btn.addEventListener('click', () => {
      selectOrgan(key);
    });
    tabsContainer.appendChild(btn);
  });

  const toggleThingLink = document.getElementById('view-opt-thinglink');
  const toggleSim = document.getElementById('view-opt-simulation');
  
  if (toggleThingLink && toggleSim) {
    toggleThingLink.addEventListener('click', () => {
      state.organViewerMode = 'thinglink';
      toggleThingLink.classList.add('active');
      toggleSim.classList.remove('active');
      renderOrganViewer();
    });

    toggleSim.addEventListener('click', () => {
      state.organViewerMode = 'simulation';
      toggleSim.classList.add('active');
      toggleThingLink.classList.remove('active');
      renderOrganViewer();
    });
  }

  const completeBtn = document.getElementById('mark-organ-complete-btn');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      state.exploredOrgans.add(state.currentOrgan);
      sounds.playCorrect();
      updateOrganCompletedState();
      updateProgressTracker();
    });
  }

  renderOrganDetails();
  renderOrganViewer();
  renderOrganQuestions();
}

function selectOrgan(organKey) {
  if (state.currentOrgan !== organKey) {
    sounds.stopOrganSound();
  }
  state.currentOrgan = organKey;
  document.querySelectorAll('.organ-tab-btn').forEach(btn => {
    const isSelected = btn.textContent.includes(organsData[organKey].name);
    btn.classList.toggle('active', isSelected);
  });

  renderOrganDetails();
  renderOrganViewer();
  renderOrganQuestions();
  updateOrganCompletedState();
}

function renderOrganDetails() {
  const organ = organsData[state.currentOrgan];
  if (!organ) return;

  document.getElementById('organ-info-tag').textContent = organ.tag;
  document.getElementById('organ-info-name').innerHTML = `
    <img src="${organImages[state.currentOrgan]}" class="organ-header-thumb" alt="${organ.name}">
    <span>${organ.name}</span>
  `;
  document.getElementById('organ-info-summary').textContent = organ.summary;
  document.getElementById('organ-info-location').textContent = organ.location;
  document.getElementById('organ-info-function').textContent = organ.function;
  document.getElementById('organ-info-funfact').textContent = organ.funFact;

  const soundBtn = document.getElementById('organ-sound-btn');
  if (soundBtn) {
    soundBtn.innerHTML = `<span>🔊</span> <span>${organ.soundLabel}</span>`;
    soundBtn.onclick = () => {
      if (organ.soundAction) organ.soundAction();
    };
  }
}

// Render Natural Realistic 3D Model with 3D Parallax & Hotspots
function renderOrganViewer() {
  const organ = organsData[state.currentOrgan];
  const frameContainer = document.getElementById('viewer-frame-container');
  const linkBarContainer = document.getElementById('viewer-link-bar-container');
  if (!organ || !frameContainer) return;

  const urls = getThingLinkUrls();
  const currentUrl = urls[state.currentOrgan] || defaultThinglinkLinks[state.currentOrgan];
  const embedUrl = formatThingLinkEmbedUrl(currentUrl);

  // Update Toggle Button Active State
  const toggleThingLink = document.getElementById('view-opt-thinglink');
  const toggleSim = document.getElementById('view-opt-simulation');
  if (toggleThingLink && toggleSim) {
    toggleThingLink.classList.toggle('active', state.organViewerMode === 'thinglink');
    toggleSim.classList.toggle('active', state.organViewerMode === 'simulation');
  }

  if (state.organViewerMode === 'thinglink') {
    frameContainer.innerHTML = `
      <iframe 
        src="${embedUrl}" 
        title="${organ.name}" 
        allowfullscreen="true" 
        webkitallowfullscreen="true" 
        mozallowfullscreen="true" 
        scrolling="no">
      </iframe>
    `;
  } else {
    // PHOTOREALISTIC NATURAL 3D ANATOMICAL MODEL WITH PARALLAX TILT & HOTSPOTS
    const hotspots = anatomicalHotspots[state.currentOrgan] || [];
    let hotspotsHtml = '';
    hotspots.forEach((hs, idx) => {
      hotspotsHtml += `
        <div class="anatomical-hotspot" style="top: ${hs.top}; left: ${hs.left};" onclick="openHotspotInfo('${hs.title}', '${hs.desc}')">
          <span class="hotspot-pulse"></span>
          <span class="hotspot-dot">${idx + 1}</span>
          <div class="hotspot-tooltip">
            <strong>${hs.title}</strong>
            <p>${hs.desc}</p>
          </div>
        </div>
      `;
    });

    frameContainer.innerHTML = `
      <div class="natural-3d-stage" id="natural-3d-stage">
        <div class="natural-3d-card" id="natural-3d-card">
          <img src="${organImages[state.currentOrgan]}" alt="${organ.name}" class="natural-organ-img" id="natural-organ-img">
          <div class="hotspots-overlay">
            ${hotspotsHtml}
          </div>
        </div>
        <div class="natural-model-controls">
          <span class="ctrl-hint">💡 حرك الماوس أو المس الشاشة لتدوير المجسم في الأبعاد الثلاثية | اضغط على الأرقام لاكتشاف الأجزاء</span>
          <button class="natural-zoom-btn" onclick="organsData['${organ.id}'].soundAction()">
            <span>🔊</span> <span>${organ.soundLabel}</span>
          </button>
        </div>
        <div id="hotspot-info-banner" class="hotspot-info-banner" style="display:none;"></div>
      </div>
    `;

    // Initialize 3D Mouse Parallax Tilt
    initParallaxTilt();
  }

  if (linkBarContainer) {
    linkBarContainer.innerHTML = `
      <div class="viewer-link-bar">
        <div>
          <span>🔗 رابط ThingLink المعتمد لهذا العضو:</span>
          <a href="${currentUrl}" target="_blank" rel="noopener noreferrer">عرض المشهد الأصلي ↗</a>
        </div>
        <button class="btn-secondary" style="padding:4px 12px;font-size:0.8rem;" onclick="openQuickEditLink('${state.currentOrgan}')">
          ✏️ تعديل الرابط
        </button>
      </div>
    `;
  }
}

// 3D Parallax Tilt Effect
function initParallaxTilt() {
  const stage = document.getElementById('natural-3d-stage');
  const card = document.getElementById('natural-3d-card');
  if (!stage || !card) return;

  function handleMove(clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 14;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
  }

  stage.addEventListener('mousemove', (e) => {
    handleMove(e.clientX, e.clientY);
  });

  stage.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  });

  stage.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });
}

window.openHotspotInfo = function(title, desc) {
  sounds.playBrainPulse();
  const banner = document.getElementById('hotspot-info-banner');
  if (banner) {
    banner.style.display = 'block';
    banner.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <strong style="color:#0284c7;font-size:1.05rem;">📍 ${title}</strong>
        <span onclick="this.parentElement.parentElement.style.display='none'" style="cursor:pointer;font-size:1.1rem;color:#64748b;">✕</span>
      </div>
      <p style="margin:0;color:#334155;font-size:0.95rem;line-height:1.6;">${desc}</p>
    `;
  }
};

// Render the 3 questions directly under the Organ in Explorer!
function renderOrganQuestions() {
  const organ = organsData[state.currentOrgan];
  const questionsContainer = document.getElementById('organ-questions-list');
  const titleElem = document.getElementById('organ-quick-quiz-title');
  if (!organ || !questionsContainer) return;

  titleElem.innerHTML = `<span>🎯</span> <span>تحدي المعرفة السريع: أسئلة ${organ.name} (3 أسئلة)</span>`;
  questionsContainer.innerHTML = '';

  organ.questionIndices.forEach(qIdx => {
    const qData = quizData[qIdx];
    const card = document.createElement('div');
    card.className = 'organ-q-card';

    const hasAnswered = state.quizAnswers[qIdx] !== undefined;
    const chosenAnswer = state.quizAnswers[qIdx];

    let optionsHtml = '';
    qData.options.forEach(opt => {
      let btnClass = 'organ-opt-btn';
      let icon = '';
      if (hasAnswered) {
        if (opt === qData.correct) {
          btnClass += ' correct';
          icon = '✓';
        } else if (opt === chosenAnswer) {
          btnClass += ' wrong';
          icon = '✗';
        }
      }
      optionsHtml += `
        <button class="${btnClass}" ${hasAnswered ? 'disabled' : ''} onclick="answerOrganQuestion(${qIdx}, '${opt}')">
          <span>${opt}</span>
          <span style="font-weight:900;">${icon}</span>
        </button>
      `;
    });

    let explanationHtml = '';
    if (hasAnswered) {
      const isCorrect = chosenAnswer === qData.correct;
      explanationHtml = `
        <div style="margin-top:12px;padding:10px 14px;border-radius:8px;font-size:0.88rem;background:${isCorrect ? '#ecfdf5' : '#fff1f2'};color:${isCorrect ? '#065f46' : '#9f1239'};border:1px solid ${isCorrect ? '#a7f3d0' : '#fecdd3'};">
          <strong>${isCorrect ? 'إجابة صحيحة! 🎉' : 'إجابة غير دقيقة! 💡'}</strong> ${qData.explain}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="organ-q-title">${qData.q}</div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        ${optionsHtml}
      </div>
      ${explanationHtml}
    `;

    questionsContainer.appendChild(card);
  });
}

window.answerOrganQuestion = function(qIdx, selectedOption) {
  const qData = quizData[qIdx];
  state.quizAnswers[qIdx] = selectedOption;
  const isCorrect = selectedOption === qData.correct;

  if (isCorrect) {
    state.quizScore++;
    sounds.playCorrect();
    triggerHaptic(40); // Gentle success buzz on mobile
  } else {
    sounds.playWrong();
    triggerHaptic([50, 40, 50]); // Double alert buzz on mobile
  }

  updateProgressTracker();
  renderOrganQuestions();
};

function updateOrganCompletedState() {
  const completeBtn = document.getElementById('mark-organ-complete-btn');
  if (!completeBtn) return;
  const isDone = state.exploredOrgans.has(state.currentOrgan);
  if (isDone) {
    completeBtn.classList.add('completed');
    completeBtn.innerHTML = `<span>✓</span> <span>تم استكشاف هذا العضو بنجاح!</span>`;
  } else {
    completeBtn.classList.remove('completed');
    completeBtn.innerHTML = `<span>✓</span> <span>تأكيد استكشاف ${organsData[state.currentOrgan].name}</span>`;
  }
}

// Setup Comprehensive Quiz
function setupQuiz() {
  state.quizCurrentIndex = 0;
  state.quizScore = 0;
  state.quizAnswers = {};
  renderQuizQuestion();

  document.getElementById('quiz-next-btn').addEventListener('click', () => {
    if (state.quizCurrentIndex < quizData.length - 1) {
      state.quizCurrentIndex++;
      renderQuizQuestion();
    } else {
      finishQuiz();
    }
  });

  document.getElementById('quiz-prev-btn').addEventListener('click', () => {
    if (state.quizCurrentIndex > 0) {
      state.quizCurrentIndex--;
      renderQuizQuestion();
    }
  });

  document.getElementById('quiz-restart-btn').addEventListener('click', () => {
    state.quizCurrentIndex = 0;
    state.quizScore = 0;
    state.quizAnswers = {};
    document.getElementById('quiz-finish-view').style.display = 'none';
    document.getElementById('quiz-active-view').style.display = 'block';
    renderQuizQuestion();
    renderOrganQuestions();
  });
}

function renderQuizQuestion() {
  const qData = quizData[state.quizCurrentIndex];
  if (!qData) return;

  document.getElementById('quiz-q-num').textContent = `سؤال ${state.quizCurrentIndex + 1} من ${quizData.length}`;
  document.getElementById('quiz-score-val').textContent = `${state.quizScore} / ${quizData.length}`;
  document.getElementById('quiz-question-title').textContent = qData.q;

  const optionsContainer = document.getElementById('quiz-options-container');
  optionsContainer.innerHTML = '';

  const feedbackBox = document.getElementById('quiz-feedback');
  feedbackBox.className = 'quiz-feedback-box';
  feedbackBox.innerHTML = '';

  const nextBtn = document.getElementById('quiz-next-btn');
  const prevBtn = document.getElementById('quiz-prev-btn');

  prevBtn.disabled = state.quizCurrentIndex === 0;
  prevBtn.style.opacity = state.quizCurrentIndex === 0 ? '0.4' : '1';

  const hasAnswered = state.quizAnswers[state.quizCurrentIndex] !== undefined;
  nextBtn.textContent = state.quizCurrentIndex === quizData.length - 1 ? 'إنهاء الاختبار 🏁' : 'السؤال التالي ←';

  qData.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span>${opt}</span> <span class="opt-status-icon"></span>`;

    if (hasAnswered) {
      btn.disabled = true;
      const chosenOpt = state.quizAnswers[state.quizCurrentIndex];
      if (opt === qData.correct) {
        btn.classList.add('correct');
        btn.querySelector('.opt-status-icon').textContent = '✓';
      } else if (opt === chosenOpt) {
        btn.classList.add('wrong');
        btn.querySelector('.opt-status-icon').textContent = '✗';
      }
    } else {
      btn.addEventListener('click', () => {
        handleQuizAnswer(opt);
      });
    }

    optionsContainer.appendChild(btn);
  });

  if (hasAnswered) {
    const isCorrect = state.quizAnswers[state.quizCurrentIndex] === qData.correct;
    feedbackBox.className = `quiz-feedback-box show ${isCorrect ? 'correct' : 'wrong'}`;
    feedbackBox.innerHTML = `
      <strong>${isCorrect ? 'إجابة صحيحة! 🎉' : 'إجابة غير دقيقة! 💡'}</strong><br>
      ${qData.explain}
    `;
  }
}

function handleQuizAnswer(selectedOption) {
  const qData = quizData[state.quizCurrentIndex];
  state.quizAnswers[state.quizCurrentIndex] = selectedOption;

  const isCorrect = selectedOption === qData.correct;
  if (isCorrect) {
    state.quizScore++;
    sounds.playCorrect();
    triggerHaptic(40); // Gentle success buzz on mobile
  } else {
    sounds.playWrong();
    triggerHaptic([50, 40, 50]); // Double alert buzz on mobile
  }

  updateProgressTracker();
  renderQuizQuestion();
  renderOrganQuestions();
}

function finishQuiz() {
  sounds.playVictory();
  document.getElementById('quiz-active-view').style.display = 'none';
  const finishView = document.getElementById('quiz-finish-view');
  finishView.style.display = 'block';

  const percentage = Math.round((state.quizScore / quizData.length) * 100);
  document.getElementById('quiz-final-score').textContent = `${state.quizScore} من أصل ${quizData.length} (${percentage}%)`;
  
  const finishMessage = document.getElementById('quiz-final-message');
  if (percentage >= 85) {
    finishMessage.textContent = 'أداء استثنائي رائع! لقد أتقنت جميع وظائف الأعضاء بنجاح وتميز 🏆';
  } else if (percentage >= 60) {
    finishMessage.textContent = 'أداء جيد جداً! لديك فهم رائع لأغلب الأعضاء مع فرصة لمراجعة النقاط البسيطة 🌟';
  } else {
    finishMessage.textContent = 'بداية جيدة! يمكنك إعادة مراجعة الأعضاء في المستكشف ثم إعادة المحاولة لتحقيق نتيجة أفضل 💪';
  }

  updateProgressTracker();
}

// ThingLink Links Settings Modal Logic
function setupThingLinkModal() {
  const modal = document.getElementById('thinglink-modal');
  const openBtn = document.getElementById('open-links-settings-btn');
  const closeBtn = document.getElementById('close-links-modal-btn');
  const saveBtn = document.getElementById('save-links-btn');
  const resetBtn = document.getElementById('reset-links-btn');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      populateThingLinkFields();
      modal.classList.add('show');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const updated = {};
      Object.keys(organsData).forEach(key => {
        const input = document.getElementById(`tl-input-${key}`);
        if (input && input.value.trim()) {
          updated[key] = input.value.trim();
        }
      });
      saveThingLinkUrls(updated);
      sounds.playCorrect();
      renderOrganViewer();
      modal.classList.remove('show');
      alert('تم حفظ وتحديث روابط ThingLink بنجاح! ستظهر المشاهد المحدثة مباشرة.');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('هل ترغب حقاً في استعادة الروابط الافتراضية الأصلية؟')) {
        localStorage.removeItem('custom_thinglink_links');
        populateThingLinkFields();
        renderOrganViewer();
        sounds.playCorrect();
        alert('تمت استعادة الروابط الافتراضية.');
      }
    });
  }
}

function populateThingLinkFields() {
  const currentUrls = getThingLinkUrls();
  Object.keys(organsData).forEach(key => {
    const input = document.getElementById(`tl-input-${key}`);
    if (input) {
      input.value = currentUrls[key] || '';
    }
  });
}

window.openQuickEditLink = function(organKey) {
  const modal = document.getElementById('thinglink-modal');
  populateThingLinkFields();
  modal.classList.add('show');
  setTimeout(() => {
    const input = document.getElementById(`tl-input-${organKey}`);
    if (input) {
      input.focus();
      input.select();
    }
  }, 100);
};

// Setup Portfolio
function setupPortfolio() {
  const tabBeginner = document.getElementById('p-tab-beginner');
  const tabAdvanced = document.getElementById('p-tab-advanced');
  const formBeginner = document.getElementById('form-portfolio-beginner');
  const formAdvanced = document.getElementById('form-portfolio-advanced');

  if (tabBeginner && tabAdvanced) {
    tabBeginner.addEventListener('click', () => {
      tabBeginner.classList.add('active');
      tabAdvanced.classList.remove('active');
      formBeginner.style.display = 'block';
      formAdvanced.style.display = 'none';
      state.portfolioType = 'beginner';
    });

    tabAdvanced.addEventListener('click', () => {
      tabAdvanced.classList.add('active');
      tabBeginner.classList.remove('active');
      formAdvanced.style.display = 'block';
      formBeginner.style.display = 'none';
      state.portfolioType = 'advanced';
    });
  }

  const beginnerSelect = document.getElementById('pb-organ');
  const advancedSelect = document.getElementById('pa-organ');

  Object.keys(organsData).forEach(key => {
    const org = organsData[key];
    const opt1 = new Option(org.name, org.name);
    const opt2 = new Option(org.name, org.name);
    if (beginnerSelect) beginnerSelect.add(opt1);
    if (advancedSelect) advancedSelect.add(opt2);
  });

  const btnPrintBeginner = document.getElementById('pb-print-btn');
  if (btnPrintBeginner) {
    btnPrintBeginner.addEventListener('click', () => printPortfolio('beginner'));
  }

  const btnPrintAdvanced = document.getElementById('pa-print-btn');
  if (btnPrintAdvanced) {
    btnPrintAdvanced.addEventListener('click', () => printPortfolio('advanced'));
  }

  const btnCert = document.getElementById('generate-certificate-btn');
  if (btnCert) {
    btnCert.addEventListener('click', () => showCertificate());
  }

  const closeCertBtn = document.getElementById('close-cert-btn');
  if (closeCertBtn) {
    closeCertBtn.addEventListener('click', () => {
      document.getElementById('cert-overlay').classList.remove('show');
    });
  }

  const printCertBtn = document.getElementById('print-cert-btn');
  if (printCertBtn) {
    printCertBtn.addEventListener('click', () => window.print());
  }
}

function printPortfolio(type) {
  sounds.playCorrect();
  const student = document.getElementById('global-student-name').value || 'الطالب/ـة';
  state.studentName = student;

  let contentHtml = '';
  if (type === 'beginner') {
    const organ = document.getElementById('pb-organ').value;
    const learned = document.getElementById('pb-learned').value || 'لم يُحدد';
    const evidence = document.getElementById('pb-evidence').value || 'لم يُحدد';
    const review = document.getElementById('pb-review').value || 'لم يُحدد';

    contentHtml = `
      <div style="direction:rtl;text-align:right;font-family:'Tajawal',sans-serif;padding:34px;border:3px solid #0284c7;border-radius:14px;background:#fff;color:#0f172a;">
        <h2 style="color:#0369a1;border-bottom:2px solid #e2e8f0;padding-bottom:12px;margin-bottom:16px;">ملف الإنجاز المبتدئ | رحلة أعضاء الجسم الداخلية</h2>
        <p style="margin:8px 0;"><strong>اسم الطالب/ـة:</strong> ${student}</p>
        <p style="margin:8px 0;"><strong>تاريخ التوثيق:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
        <hr style="margin:18px 0;border:0;border-top:1px solid #e2e8f0;">
        <p style="margin:8px 0;"><strong>العضو المستكشف:</strong> ${organ}</p>
        <p style="margin:8px 0;"><strong>المعلومة المكتسبة:</strong> ${learned}</p>
        <p style="margin:8px 0;"><strong>دليل الإنجاز / وصف العمل:</strong> ${evidence}</p>
        <p style="margin:8px 0;"><strong>العضو المطلوب مراجعته والسؤال المتبقي:</strong> ${review}</p>
      </div>
    `;
  } else {
    const organ = document.getElementById('pa-organ').value;
    const mastered = document.getElementById('pa-mastered').value || 'لم يُحدد';
    const nextSteps = document.getElementById('pa-next-steps').value || 'لم يُحدد';
    const evidence = document.getElementById('pa-evidence').value || 'لم يُحدد';
    const outcome = document.getElementById('pa-outcome').value || 'لم يُحدد';

    contentHtml = `
      <div style="direction:rtl;text-align:right;font-family:'Tajawal',sans-serif;padding:34px;border:3px solid #2563eb;border-radius:14px;background:#fff;color:#0f172a;">
        <h2 style="color:#1d4ed8;border-bottom:2px solid #e2e8f0;padding-bottom:12px;margin-bottom:16px;">ملف الإنجاز المطوّر | رحلة أعضاء الجسم الداخلية</h2>
        <p style="margin:8px 0;"><strong>اسم الطالب/ـة:</strong> ${student}</p>
        <p style="margin:8px 0;"><strong>تاريخ التوثيق:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
        <hr style="margin:18px 0;border:0;border-top:1px solid #e2e8f0;">
        <p style="margin:8px 0;"><strong>العضو أو السيناريو الموثّق:</strong> ${organ}</p>
        <p style="margin:8px 0;"><strong>جوانب الإتقان والصعوبات:</strong> ${mastered}</p>
        <p style="margin:8px 0;"><strong>خطة التحسين وطريقة التحقق:</strong> ${nextSteps}</p>
        <p style="margin:8px 0;"><strong>الدليل أو الناتج الذي أظهر التعلم:</strong> ${evidence}</p>
        <p style="margin:8px 0;"><strong>نتيجة النشاط وما تم إنجازه:</strong> ${outcome}</p>
      </div>
    `;
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>ملف الإنجاز - ${student}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="direction:rtl;text-align:right;padding:20px;">
        ${contentHtml}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function showCertificate() {
  const student = document.getElementById('global-student-name').value || 'الطالب/ـة المتميز/ـة';
  document.getElementById('cert-student-display').textContent = student;
  document.getElementById('cert-date-display').textContent = new Date().toLocaleDateString('ar-SA');
  document.getElementById('cert-score-display').textContent = `${state.quizScore} / ${quizData.length}`;
  document.getElementById('cert-overlay').classList.add('show');
  sounds.playVictory();
}

// Setup Survey
function setupSurvey() {
  const stars = document.querySelectorAll('.rating-star');
  let selectedRating = 5;

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.getAttribute('data-val'));
      stars.forEach(s => {
        const val = parseInt(s.getAttribute('data-val'));
        s.classList.toggle('selected', val <= selectedRating);
      });
      sounds.playCorrect();
    });
  });

  const submitSurveyBtn = document.getElementById('submit-survey-btn');
  if (submitSurveyBtn) {
    submitSurveyBtn.addEventListener('click', () => {
      sounds.playVictory();
      const feedbackMsg = document.getElementById('survey-thank-msg');
      feedbackMsg.style.display = 'block';
      submitSurveyBtn.disabled = true;
      submitSurveyBtn.style.opacity = '0.6';
      updateProgressTracker(true);
    });
  }
}

// Setup Sound Toggle
function setupSoundToggle() {
  const soundBtn = document.getElementById('sound-toggle-btn');
  if (!soundBtn) return;
  soundBtn.addEventListener('click', () => {
    const isEnabled = sounds.toggleSound();
    soundBtn.innerHTML = isEnabled ? '<span>🔊</span> <span>الصوت مفعّل</span>' : '<span>🔇</span> <span>صامت</span>';
  });
}

// Update Global Progress Tracker
function updateProgressTracker(surveySubmitted = false) {
  const stepOrgans = document.getElementById('step-indicator-organs');
  const stepQuiz = document.getElementById('step-indicator-quiz');
  const stepPortfolio = document.getElementById('step-indicator-portfolio');
  const stepSurvey = document.getElementById('step-indicator-survey');
  const progressBar = document.getElementById('journey-progress-bar');
  const progressText = document.getElementById('journey-progress-percent');

  let completedSteps = 0;

  if (state.exploredOrgans.size >= 3) {
    stepOrgans.classList.add('done');
    completedSteps += 25;
  } else {
    completedSteps += Math.round((state.exploredOrgans.size / 6) * 25);
  }

  const answeredCount = Object.keys(state.quizAnswers).length;
  if (answeredCount >= quizData.length) {
    stepQuiz.classList.add('done');
    completedSteps += 35;
  } else {
    completedSteps += Math.round((answeredCount / quizData.length) * 35);
  }

  const hasPortfolioInput = document.getElementById('pb-learned') && document.getElementById('pb-learned').value.length > 5;
  if (hasPortfolioInput) {
    stepPortfolio.classList.add('done');
    completedSteps += 20;
  }

  if (surveySubmitted) {
    stepSurvey.classList.add('done');
    completedSteps += 20;
  }

  completedSteps = Math.min(100, completedSteps);
  if (progressBar) progressBar.style.width = `${completedSteps}%`;
  if (progressText) progressText.textContent = `${completedSteps}%`;
}
