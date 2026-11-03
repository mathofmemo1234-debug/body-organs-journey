// Web Audio & Real Medical Audio Sound Engine (10-second authentic recordings + fallback synthesizer)
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.currentOrgan = null;
    this.currentAudio = null;
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
    
    // Stop authentic audio if playing
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }

    // Stop synthesized web audio nodes
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

    // Countdown interval for button UI (10s -> 0s)
    this.intervalId = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds > 0) {
        updateSoundButtonUI(true, this.remainingSeconds);
      } else {
        this.stopOrganSound();
      }
    }, 1000);

    // 1. First priority: Play authentic 10s audio recording from assets/audio/
    let playedAudio = false;
    try {
      const audioPath = `assets/audio/${organId}.mp3`;
      this.currentAudio = new Audio(audioPath);
      this.currentAudio.currentTime = 0;
      
      const playPromise = this.currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          playedAudio = true;
        }).catch(err => {
          console.warn('Real audio playback error, falling back to Web Audio synthesis:', err);
          this.fallbackSynthesis(organId);
        });
      } else {
        playedAudio = true;
      }
    } catch (e) {
      console.warn('Audio element error, falling back to Web Audio synthesis:', e);
      this.fallbackSynthesis(organId);
    }

    // Safety timeout to ensure complete stop at exactly 10 seconds
    this.timerId = setTimeout(() => {
      this.stopOrganSound();
    }, 10000);
  }

  fallbackSynthesis(organId) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = 10;
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

const organLabeledImages = {
  heart: 'assets/heart_labeled.png',
  lungs: 'assets/lungs_labeled.png',
  stomach: 'assets/stomach_labeled.png',
  brain: 'assets/brain_labeled.png',
  eye: 'assets/eye_labeled.png',
  esophagus: 'assets/esophagus_labeled.png'
};

// ==========================================
// COMPREHENSIVE ORGAN SIMULATOR DATA MODEL
// ==========================================
const organsSimulatorData = {
  heart: {
    id: 'heart',
    name: 'القلب',
    tag: 'الجهاز الدوراني',
    summary: 'القلب هو المضخة العضلية الحيوية المركزية التي تنبض بلا توقف طوال الحياة؛ يضخ نحو 7,500 لتر من الدم يومياً لتغذية خلايا الجسم بالأكسجين والمواد الغذائية.',
    location: 'في منتصف التجويف الصدري بين الرئتين مع ميل بسيط نحو الجهة اليسرى، محمي بالقفص الصدري وعظمة القص.',
    function: 'استقبال الدم غير المؤكسج من أنحاء الجسم وإرساله للرئتين، ثم استقبال الدم المؤكسج وضخه بقوة عبر الشرايين لجميع الأعضاء والأنسجة.',
    funFact: 'ينبض قلب الإنسان الطبيعي حوالي 100,000 نبضة يومياً، وتكفي الطاقة التي يولدها القلب يومياً لقيادة شاحنة لمسافة 32 كيلومتراً!',
    soundAction: () => sounds.playOrgan10Seconds('heart'),
    soundLabel: 'استمع لنبضات القلب 💓',
    parts: [
      {
        id: 'heart-aorta',
        name: 'الشريان الأورطي (الأبهر)',
        enName: 'Aorta',
        target: { top: '20%', left: '51%' },
        badgePos: { top: '11%', left: '68%' },
        color: '#e11d48',
        shortDesc: 'أكبر شريان في الجسم؛ يوزع الدم المؤكسج لكافة الأعضاء.',
        function: 'يعد الشريان الأورطي الأنبوب الشرياني الرئيسي والناقل الأكبر للدم في الجسم البشري؛ يتصل مباشرة بالبطين الأيسر عبر الصمام الأورطي، ويستقبل الدم عالي الضغط المشبع بالأكسجين ليوزعه عبر فروعه الشريانية المعقدة إلى الدماغ، الأطراف، الأحشاء الداخلية، وسائر خلايا الجسم.',
        anatomy: 'يمتلك جداراً ثلاثي الطبقات فائق المرونة والقوة (الغلالة الباطنة، الوسطى، والخارجية) مدعوماً بألياف الإيلاستين التي تتمدد مع كل نبضة قلبية لتتحمل الضغط العالي، وتتفرع من قوسه الشرايين التاجية وشرايين الرأس والأطراف.',
        clinical: 'تحافظ مرونة الشريان الأورطي الفائقة على استمرار تدفق الدم في الشعيرات الدموية حتى أثناء مرحلة انبساط القلب (بين النبضات)، وأي تصلب فيه يرفع ضغط الدم ويرهق عضلة القلب.',
        defaultYt: 'https://www.youtube.com/watch?v=k_9Y_tN8V9c',
        ytTitle: 'شرح الشريان الأورطي والدورة الدموية الكبرى'
      },
      {
        id: 'heart-svc',
        name: 'الوريد الأجوف العلوي',
        enName: 'Superior Vena Cava',
        target: { top: '21%', left: '26.5%' },
        badgePos: { top: '12%', left: '8%' },
        color: '#0284c7',
        shortDesc: 'يستقبل الدم غير المؤكسج العائد من أعلى الجسم.',
        function: 'يعمل الوريد الأجوف العلوي كمصب رئيسي يجمع الدم الوريدي الخالي من الأكسجين والمحمّل بثاني أكسيد الكربون من الرأس، الرقبة، الذراعين، وأعلى الصدر، ويفرغه مباشرة وبانسيابية في تجويف الأذين الأيمن للقلب.',
        anatomy: 'وريد ضخم وقصير ذو قطر كبير يبلغ حوالي 2 سم، يمر في الجهة اليمنى من المنصف العلوي بجوار القصبة الهوائية، ولا يحتوي على صمامات لأن الجاذبية تساعد على نزول الدم نحو القلب.',
        clinical: 'أي ضغط خارجي أو ورم في أعلى الصدر قد يعيق تدفق الدم فيه مسبباً انتفاخ أوردة الرقبة والوجه فيما يُعرف طبياً بمتلازمة الوريد الأجوف العلوي.',
        defaultYt: 'https://www.youtube.com/watch?v=7XaftdE_h60',
        ytTitle: 'مسار الوريد الأجوف وتدفق الدم للقلب'
      },
      {
        id: 'heart-pa',
        name: 'الشريان الرئوي',
        enName: 'Pulmonary Artery',
        target: { top: '34%', left: '38%' },
        badgePos: { top: '29%', left: '6%' },
        color: '#0ea5e9',
        shortDesc: 'ينقل الدم غير المؤكسج من القلب للرئتين.',
        function: 'ينقل الدم غير المؤكسج المندفع من البطين الأيمن عبر الصمام الرئوي باتجاه الرئتين، ليتم ترشيحه وأكسجته والتخلص من غاز ثاني أكسيد الكربون عبر الحويصلات الهوائية.',
        anatomy: 'ينطلق كجذع رئوي رئيسي ثم ينقسم إلى فرعين أساسيين: شريان رئوي أيمن يتجه للرئة اليمنى، وشريان رئوي أيسر يتجه للرئة اليسرى، وهو الشريان الوحيد في الجسم البالغ الذي يحمل دماً وريدياً فقيراً بالأكسجين.',
        clinical: 'ضغط الدم داخل الشريان الرئوي يكون منخفضاً مقارنة بالأورطي لحماية الأوعية الدموية الهشة والدقيقة داخل أنسجة الرئتين.',
        defaultYt: 'https://www.youtube.com/watch?v=ruM4Xuhx3yA',
        ytTitle: 'الشريان الرئوي والدورة الدموية الصغرى'
      },
      {
        id: 'heart-ra',
        name: 'الأذين الأيمن',
        enName: 'Right Atrium',
        target: { top: '48%', left: '23%' },
        badgePos: { top: '45%', left: '5%' },
        color: '#6366f1',
        shortDesc: 'حجرة استقبال الدم غير المؤكسج من الجسم.',
        function: 'الحجرة العلوية اليمنى في القلب التي تستقبل الدم الوريدي الراجع من سائر الجسم عبر الوريدين الأجوفين العلوي والسفلي، وتجمعه ثم تدفعه عبر الصمام ثلاثي الشرفات إلى البطين الأيمن.',
        anatomy: 'حجرة ذات جدار عضلي رقيق نسبياً، وتكمن أهميتها الفائقة في احتوائها على "العقدة الجيبية الأذينية" (SA Node) المسؤولة عن توليد وتنظيم الإشارات الكهربائية للقلب.',
        clinical: 'تعتبر العقدة الجيبية في الأذين الأيمن بمثابة بطارية القلب الطبيعية (Pacemaker)؛ حيث تعطي إشارة الانقباض التلقائي بمعدل 60-100 مرة في الدقيقة.',
        defaultYt: 'https://www.youtube.com/watch?v=tg_iZk_OQd4',
        ytTitle: 'الأذين الأيمن وعقدة تنظيم النبضات'
      },
      {
        id: 'heart-rv',
        name: 'البطين الأيمن',
        enName: 'Right Ventricle',
        target: { top: '68%', left: '41%' },
        badgePos: { top: '72%', left: '6%' },
        color: '#10b981',
        shortDesc: 'يضخ الدم إلى الشريان الرئوي باتجاه الرئتين.',
        function: 'ينقبض البطين الأيمن بانتظام ليدفع الدم الوريدي القادم من الأذين الأيمن عبر الصمام الرئوي إلى الشريان الرئوي متجهاً للرئتين لأكسجته واستعادة نقائه.',
        anatomy: 'حجرة عضلية مثلثة الشكل تقع في الجزء الأمامي السفلي للقلب، وجدارها العضلي أقل سماكة من البطين الأيسر بنحو الثلث لأن مسافة الضخ للرئتين قريبة والمقاومة منخفضة.',
        clinical: 'وجود الصمام ثلاثي الشرفات عند مدخله والصمام الرئوي عند مخرجه يضمن سير الدم باتجاه واحد فقط دون أي ارتداد عكسي.',
        defaultYt: 'https://www.youtube.com/watch?v=0k5aJd01p74',
        ytTitle: 'عمل البطين الأيمن وضخ الدم للرئتين'
      },
      {
        id: 'heart-la',
        name: 'الأذين الأيسر',
        enName: 'Left Atrium',
        target: { top: '42%', left: '72%' },
        badgePos: { top: '38%', left: '74%' },
        color: '#d946ef',
        shortDesc: 'يستقبل الدم النقي المؤكسج من الرئتين.',
        function: 'يستقبل الدم الوريدي النقي الغني بالأكسجين القادم مباشرة من الرئتين عبر الأوردة الرئوية الأربعة، ويخزنه للحظات ثم يدفعه عبر الصمام التاجي (المترالي) إلى تجويف البطين الأيسر.',
        anatomy: 'يقع في الجزء الخلفي العلوي لقاعدة القلب، ويمتاز بسطح داخلي أملس يسمح بانسياب سريع للدم المؤكسج تحت ضغط هادئ.',
        clinical: 'سلامة الأذين الأيسر وصمامه التاجي تمنع احتقان السوائل في الرئتين وتضمن تدفقاً سلساً للدورة الدموية الجهازية.',
        defaultYt: 'https://www.youtube.com/watch?v=BEWjOCVEN7E',
        ytTitle: 'الأذين الأيسر واستقبال الدم المؤكسج'
      },
      {
        id: 'heart-coronary',
        name: 'الشرايين التاجية',
        enName: 'Coronary Arteries',
        target: { top: '56%', left: '57%' },
        badgePos: { top: '54%', left: '75%' },
        color: '#f97316',
        shortDesc: 'تغذي عضلة القلب نفسها بالدم والأكسجين.',
        function: 'تتفرع مباشرة من قاعدة الشريان الأورطي لتروي عضلة القلب الحيوية بالدم المشبع بالأكسجين والجلوكوز، لتتمكن خلايا القلب من الانقباض والانبساط المستمر دون إرهاق.',
        anatomy: 'شبكة شريانية تلتف حول القلب كـ "التاج" ومن هنا جاءت تسميتها، وتنقسم إلى شريان تاجي أيمن وشريان تاجي أيسر بفروعهما الدقيقة المتغلغلة بين ألياف العضلة.',
        clinical: 'انسداد أي فرع من الشرايين التاجية بسبب ترسبات الدهون يؤدي إلى نقص تروية عضلة القلب وحدوث الذبحة الصدرية أو الجلطة القلبية.',
        defaultYt: 'https://www.youtube.com/watch?v=GMBSU_6x0W8',
        ytTitle: 'الشرايين التاجية وتغذية عضلة القلب 3D'
      },
      {
        id: 'heart-lv',
        name: 'البطين الأيسر',
        enName: 'Left Ventricle',
        target: { top: '70%', left: '71%' },
        badgePos: { top: '72%', left: '74%' },
        color: '#dc2626',
        shortDesc: 'أقوى حجرات القلب؛ يضخ الدم للأورطي ولكامل الجسم.',
        function: 'المضخة الهيدروليكية المركزية في جسم الإنسان؛ يمتلك أسمك وأقوى جدار عضلي في القلب ليولد ضغطاً انقباضياً جباراً يقذف الدم المؤكسج عبر الصمام الأورطي إلى سائر أنحاء الجسم.',
        anatomy: 'يبلغ سمك جداره العضلي ثلاثة أضعاف سمك جدار البطين الأيمن تقريباً، لأنه يحتاج للتغلب على المقاومة المحيطية العالية في الشرايين والشعيرات من الرأس حتى أطراف القدمين.',
        clinical: 'تعد كفاءة البطين الأيسر (الكسر القذفي Ejection Fraction) المقياس الذهبي الأهم لتقييم صحة وقوة عضلة القلب وسعتها الوظيفية.',
        defaultYt: 'https://www.youtube.com/watch?v=q0s-1MC1hcE',
        ytTitle: 'البطين الأيسر وقوة الضخ الهيدروليكية'
      },
      {
        id: 'heart-apex',
        name: 'قمة القلب (Apex)',
        enName: 'Apex of the Heart',
        target: { top: '89%', left: '58%' },
        badgePos: { top: '93%', left: '45%' },
        color: '#8b5cf6',
        shortDesc: 'الجزء السفلي المدبب المائل نحو اليسار.',
        function: 'تمثل قمة القلب الطرف السفلي المخروطي للبطين الأيسر؛ حيث تلتف ألياف عضلة القلب بحركة لولبية تعصر الدم نحو الأعلى باتجاه الصمام الأورطي كعصر المنشفة لطرد أقصى كمية دم ممكنة.',
        anatomy: 'تقع تشريحياً عند مستوى الفضاء الوربي الخامس الأيسر على خط منتصف الترقوة، وهي النقطة التي يضع عليها الطبيب سماعته لسماع نبض قمة القلب بدقة.',
        clinical: 'تسمى الصدمة التي تحدثها قمة القلب على جدار الصدر مع كل انقباض بـ "الصدمة القمية" (Apex Beat) وتدل على الحجم الطبيعي للقلب.',
        defaultYt: 'https://www.youtube.com/watch?v=oHMmtqKgs50',
        ytTitle: 'تشريح قمة القلب وميكانيكا النبض'
      }
    ],
    defaultQuestions: [
      {
        id: 'q-heart-1',
        q: 'ما الدور الحيوي الرئيسي للشريان الأورطي (الأبهر) المتصل بالبطين الأيسر؟',
        options: [
          'توزيع الدم المؤكسج عالي الضغط إلى كافة خلايا وأعضاء الجسم',
          'استقبال الدم غير المؤكسج القادم من الرأس والذراعين',
          'تنقية الهواء واستخلاص الأكسجين داخل التجويف الصدري',
          'تفتيت الأطعمة وهضم البروتينات كيميائياً'
        ],
        correct: 'توزيع الدم المؤكسج عالي الضغط إلى كافة خلايا وأعضاء الجسم',
        explain: 'الشريان الأورطي هو أكبر شريان رئيسي في جسم الإنسان، ويعمل كخط الإمداد العام الذي يحمل الدم الغني بالأكسجين والغذاء ليوزعه لكافة أجهزة الجسم.',
        motivationSuccess: '🌟 ما شاء الله! إجابة عبقرية وفهم طبي استثنائي! أحسنتِ يا بطلة الاستكشاف! 👏',
        motivationRetry: '💪 محاولة رائعة! تذكري أن الأورطي هو الشريان الأضخم الذي يغذي كامل الجسم بالدم النقي، جربي ثانية!'
      },
      {
        id: 'q-heart-2',
        q: 'لماذا يُعد جدار "البطين الأيسر" في القلب أكثر سماكة وقوة عضلية من جدار البطين الأيمن؟',
        options: [
          'لأنه يحتاج لتوليد ضغط هائل لضخ الدم لمسافات طويلة لكامل الجسم',
          'لأنه يستقبل الدم من الرئتين فقط دون أن يضخه',
          'لأنه يحتوي على صمامات ثابتة لا تتحرك إطلاقاً',
          'لحماية القلب من درجات الحرارة الخارجية المرتفعة'
        ],
        correct: 'لأنه يحتاج لتوليد ضغط هائل لضخ الدم لمسافات طويلة لكامل الجسم',
        explain: 'بينما يضخ البطين الأيمن الدم لمسافة قصيرة فقط نحو الرئتين، يقع على عاتق البطين الأيسر ضخ الدم ضد مقاومة عالية إلى أبعد نقطة في الجسم.',
        motivationSuccess: '🎯 إبداع حقيقي! تفكير علمي منطقي ومنظم للغاية! أنتِ طبيبة المستقبل المتميزة! 🩺✨',
        motivationRetry: '💡 فكري في المسافة التي يسافر فيها الدم؛ الرئتان قريبتان جداً، بينما بقية الجسم بعيدة! جربي الآن.'
      }
    ]
  },

  lungs: {
    id: 'lungs',
    name: 'الرئتان',
    tag: 'الجهاز التنفسي',
    summary: 'الرئتان هما العضو التنفسي المركزي الذي يزود الجسم بالأكسجين النقي ويخلصه من غاز ثاني أكسيد الكربون الضار عبر عملية التنفس وتبادل الغازات.',
    location: 'داخل التجويف الصدري على جانبي القلب، محميتان بالقفص الصدري والغشاء البلوري المزدوج.',
    function: 'استنشاق الهواء وتوصيله إلى مئات الملايين من الحويصلات الهوائية الدقيقة لتمكين تبادل الغازات مع مجرى الدم بسرعة فائقة.',
    funFact: 'تحتوي الرئتان معاً على حوالي 300 إلى 500 مليون حويصلة هوائية، ولو فُردت مساحتها لغطت مساحة ملعب تنس كامل (حوالي 80 متراً مربعاً)!',
    soundAction: () => sounds.playOrgan10Seconds('lungs'),
    soundLabel: 'استمع لصوت التنفس 🌬️',
    parts: [
      {
        id: 'lungs-trachea',
        name: 'القصبة الهوائية',
        enName: 'Trachea',
        target: { top: '15%', left: '51%' },
        badgePos: { top: '11%', left: '68%' },
        color: '#0284c7',
        shortDesc: 'مجرى تنفسي مدعوم بحلقات غضروفية لمرور الهواء.',
        function: 'الأنبوب التنفسي الرئيسي الذي يمرر الهواء المستنشق من الحنجرة نزولاً نحو الصدر ليتفرع إلى الشعبتين الهوائيتين، ومبطن بغشاء مخاطي وأهداب دقيقة تلتقط الأتربة والشوائب وتدفعها للأعلى لتنقية الهواء.',
        anatomy: 'أنبوب مرن بطول 10-12 سم يتكون من 16 إلى 20 حلقة غضروفية غير مكتملة على شكل حرف C، مفتوحة من الخلف لتسمح للمريء الواقع خلفها بالتمدد أثناء بلع الطعام.',
        clinical: 'تضمن الحلقات الغضروفية بقاء مجرى الهواء مفتوحاً باستمرار وتمنع انطباق القصبة تحت تأثير الضغط السلبي أثناء الشهيق العميق.',
        defaultYt: 'https://www.youtube.com/watch?v=mOKmjYwfDGU',
        ytTitle: 'القصبة الهوائية وتنقية الهواء المستنشق'
      },
      {
        id: 'lungs-right',
        name: 'الرئة اليمنى (3 فصوص)',
        enName: 'Right Lung (3 Lobes)',
        target: { top: '36%', left: '28%' },
        badgePos: { top: '32%', left: '7%' },
        color: '#0ea5e9',
        shortDesc: 'الفص العلوي والمتوسط والسفلي (أكبر حجماً).',
        function: 'العضو الأكبر حجماً في الجهاز التنفسي؛ تستوعب كمية هائلة من الهواء المستنشق لتزويد الدم بالأكسجين الحيوي وتفريغ ثاني أكسيد الكربون عبر فصوصها الثلاثة.',
        anatomy: 'تنقسم إلى ثلاثة فصوص تشريحية مستقلة (فص علوي، متوسط، سفلي) يفصل بينها شقان (مائل وأفقي)، وتتسع لنحو 55% من إجمالي سعة الرئتين.',
        clinical: 'تعتبر الرئة اليمنى أوسع وأقصر قليلاً من اليسرى بسبب ارتفاع الكبد الواقع تحت الحجاب الحاجز في الجهة اليمنى.',
        defaultYt: 'https://www.youtube.com/watch?v=qGiP48fLQGo',
        ytTitle: 'تشريح الرئة اليمنى وفصوصها الثلاثة'
      },
      {
        id: 'lungs-left',
        name: 'الرئة اليسرى (فصان)',
        enName: 'Left Lung (2 Lobes)',
        target: { top: '38%', left: '72%' },
        badgePos: { top: '34%', left: '75%' },
        color: '#10b981',
        shortDesc: 'أصغر حجماً لوجود الثلمة القلبية.',
        function: 'تقوم بتبادل الغازات والتنفس بالتكامل مع الرئة اليمنى، مع تصميم تشريحي خاص يتلاءم مع مجاورة القلب المائل نحو اليسار.',
        anatomy: 'تتكون من فصين فقط (فص علوي وفص سفلي) يفصل بينهما شق مائل، وتتميز بوجود "الثلمة القلبية" (Cardiac Notch) وهي تجويف مقعر يستقر فيه جانب القلب.',
        clinical: 'رغم صغر حجمها مقارنة باليمنى، إلا أن شبكتها الشعرية الرئوية فائقة الكفاءة وتتمتع بمرونة عالية أثناء التمدد والتقلص.',
        defaultYt: 'https://www.youtube.com/watch?v=hc1YtXc_84A',
        ytTitle: 'الرئة اليسرى وعلاقتها التشريحية بالقلب'
      },
      {
        id: 'lungs-bronchi',
        name: 'الشعب الهوائية والحويصلات',
        enName: 'Bronchi & Alveoli',
        target: { top: '42%', left: '46%' },
        badgePos: { top: '52%', left: '8%' },
        color: '#f97316',
        shortDesc: 'تتفرع لملايين الحويصلات لتبادل الغازات مع الدم.',
        function: 'المقر الفعلي للمعجزة التنفسية؛ تتفرع الشجرة القصبية إلى قصيبات دقيقة تنتهي بعناقيد من الحويصلات الهوائية حيث ينفذ الأكسجين عبر جدارها الرقيق إلى كريات الدم ويخرج ثاني أكسيد الكربون.',
        anatomy: 'أكياس هوائية كروية مجهرية جدارها بسماكة خلية واحدة محاطة بشبكة كثيفة من الشعيرات الدموية، ومغطاة بمادة (Surfactant) الخافضة للتوتر السطحي لمنع التصاقها.',
        clinical: 'نقص المادة الخافضة للتوتر السطحي يسبب صعوبة بالغة في التنفس وانهيار الحويصلات، كما يحدث عند بعض الأطفال الخدج.',
        defaultYt: 'https://www.youtube.com/watch?v=zRv5tNCMWQE',
        ytTitle: 'الحويصلات الهوائية وتبادل الغازات المجهري'
      },
      {
        id: 'lungs-diaphragm',
        name: 'قاعدة الرئتين والحجاب الحاجز',
        enName: 'Base of Lungs & Diaphragm',
        target: { top: '75%', left: '51%' },
        badgePos: { top: '88%', left: '45%' },
        color: '#8b5cf6',
        shortDesc: 'العضلة الرئيسية المسؤولة عن الشهيق والزفير.',
        function: 'المحرك الميكانيكي الرئيسي لعملية التنفس؛ ينقبض الحجاب الحاجز ويهبط لأسفل لتوسيع التجويف الصدري فيدخل الهواء (الشهيق)، ويرتفع للأعلى أثناء الزفير لطرد الهواء المحمل بالفضلات.',
        anatomy: 'صفيحة عضلية وترية مقببة الشكل تفصل بين التجويف الصدري العلوي وتجويف البطن السفلي، وترتكز عليها قواعد الرئتين المقعرة بدقة.',
        clinical: 'التقلص المفاجئ وغير المنتظم لعضلة الحجاب الحاجز مع انغلاق الأوتار الصوتية هو السبب المباشر لظاهرة "الفواق" أو الحازوقة (Hiccups).',
        defaultYt: 'https://www.youtube.com/watch?v=hp-gCvW8PRY',
        ytTitle: 'عضلة الحجاب الحاجز وميكانيكا التنفس'
      }
    ],
    defaultQuestions: [
      {
        id: 'q-lungs-1',
        q: 'في أي جزء مجهري داخل الرئتين يحدث التبادل الفعلي لغازي الأكسجين وثاني أكسيد الكربون مع مجرى الدم؟',
        options: [
          'الحويصلات الهوائية (Alveoli) المحاطة بالشعيرات الدموية',
          'القصبة الهوائية العلوية فقط',
          'غضاريف الحنجرة والأحبال الصوتية',
          'عضلة الحجاب الحاجز السفلية'
        ],
        correct: 'الحويصلات الهوائية (Alveoli) المحاطة بالشعيرات الدموية',
        explain: 'تحتوي الرئتان على مئات الملايين من الحويصلات الهوائية ذات الجدران الرقيقة جداً والتي تسمح للأكسجين بالنفاذ لكريات الدم الحمراء وخروج ثاني أكسيد الكربون مع الزفير.',
        motivationSuccess: '🌬️ إجابة مذهلة وصحيحة 100%! استيعابك لدقة وظائف الحويصلات ينم عن شغف علمي رائع! 🌟',
        motivationRetry: '🔍 تذكري تلك الأكياس الدقيقة الشبيهة بعناقيد العنب داخل الرئة؛ إنها بطلة تبادل الغازات! حاولي مجدداً!'
      },
      {
        id: 'q-lungs-2',
        q: 'ما السبب التشريحي في كون الرئة اليسرى تتكون من فصين فقط بينما تتكون الرئة اليمنى من ثلاثة فصوص؟',
        options: [
          'لوجود الثلمة القلبية لإفساح حيز مناسب لموقع القلب المائل لليسار',
          'لأن الرئة اليسرى لا تحتاج للأكسجين أبداً',
          'لحماية الكبد من الاحتكاك المباشر بالصدر',
          'لكي تتسع المعدة لتخزين المزيد من الهواء'
        ],
        correct: 'لوجود الثلمة القلبية لإفساح حيز مناسب لموقع القلب المائل لليسار',
        explain: 'يتمركز القلب في منتصف الصدر مع ميلان واضح إلى الجهة اليسرى، لذا خُلقت الرئة اليسرى بفصين وبحجم أصغر قليلاً لتوفير الحيز المناسب لحركة القلب بحرية.',
        motivationSuccess: '🏆 إجابة فائقة الدقة والذكاء! ربطكِ بين تشريح القلب والرئة يدل على تفوق باهر! 💖👏',
        motivationRetry: '💡 تذكري جار الرئة اليسرى الأقرب في التجويف الصدري وهو ينبض باستمرار! أعد المحاولة!'
      }
    ]
  },

  brain: {
    id: 'brain',
    name: 'الدماغ',
    tag: 'الجهاز العصبي',
    summary: 'الدماغ البشري هو مركز القيادة والتحكم الأعلى في الجسم؛ يعالج مليارات الإشارات الحسية، ويقود التفكير، الذاكرة، المشاعر، وتناسق حركات العضلات.',
    location: 'داخل الجمجمة العظمية الصلبة، محاط بثلاث طبقات من الأغشية السحائية وسائل مخي شوكي واقٍ من الصدمات.',
    function: 'معالجة المعلومات، اتخاذ القرارات، إدارة العواطف، توجيه الأوامر الحركية لجميع الأعضاء، وتنظيم الوظائف الحيوية التلقائية.',
    funFact: 'يحتوي الدماغ على حوالي 86 مليار خلية عصبية (عصبون)، وتنتقل الإشارات العصبية بداخله بسرعة مذهلة تصل إلى 430 كيلومتراً في الساعة!',
    soundAction: () => sounds.playOrgan10Seconds('brain'),
    soundLabel: 'إشارات ونبضات العصبونات ⚡',
    parts: [
      {
        id: 'brain-frontal',
        name: 'الفص الجبهي (Frontal Lobe)',
        enName: 'Frontal Lobe',
        target: { top: '31%', left: '32%' },
        badgePos: { top: '22%', left: '8%' },
        color: '#8b5cf6',
        shortDesc: 'مركز التفكير المنطقي، التخطيط، والقرارات.',
        function: 'المقر الأعلى للذكاء البشري؛ يتحكم في التفكير المجرد، التخطيط للمستقبل، حل المشكلات المعقدة، اتخاذ القرارات، ضبط السلوك والشخصية، وإصدار أوامر حركة العضلات الإرادية.',
        anatomy: 'يشغل الجزء الأمامي من القشرة المخية خلف عظم الجبهة مباشرة، وهو الأكبر حجماً والأحدث تطوراً بين فصوص الدماغ.',
        clinical: "يحتوي الفص الجبهي الأيسر على 'منطقة بروكا' (Broca's Area) المسؤولة عن القدرة على التعبير اللغوي والتحدث بطلاقة.",
        defaultYt: 'https://www.youtube.com/watch?v=mD0kZ_2BknQ',
        ytTitle: 'الفص الجبهي ووظائف التفكير والشخصية'
      },
      {
        id: 'brain-parietal',
        name: 'الفص الجداري (Parietal Lobe)',
        enName: 'Parietal Lobe',
        target: { top: '26%', left: '64%' },
        badgePos: { top: '20%', left: '74%' },
        color: '#d946ef',
        shortDesc: 'معالجة حاسة اللمس، الحرارة، وإدراك المكان.',
        function: 'المركز الحسي الرئيسي لمعالجة الإشارات القادمة من الجلد؛ مثل اللمس، الضغط، درجات الحرارة، والألم، بالإضافة إلى إدراك موضع الجسم وأعضائه في الفضاء ثلاثي الأبعاد.',
        anatomy: 'يقع خلف الفص الجبهي في الجزء العلوي الأوسط من الدماغ، ويفصله عن الفص الجبهي "الثلم المركزي" الشهير.',
        clinical: 'يمكن للإنسان بفضل هذا الفص معرفة موقع أطرافه وحركتها بدقة متناهية حتى وعيناه مغلقتان تماماً (الإحساس بالحركة والمكان).',
        defaultYt: 'https://www.youtube.com/watch?v=7XnE8N9j16Y',
        ytTitle: 'الفص الجداري وحاسة اللمس والإدراك المكاني'
      },
      {
        id: 'brain-occipital',
        name: 'الفص القفوي (Occipital Lobe)',
        enName: 'Occipital Lobe',
        target: { top: '48%', left: '79%' },
        badgePos: { top: '46%', left: '76%' },
        color: '#0284c7',
        shortDesc: 'المركز الرئيسي لتفسير الإشارات البصرية.',
        function: 'محطة الرؤية والمعالجة البصرية في الدماغ؛ يستقبل الإشارات الكهروضوئية القادمة من العين عبر العصب البصري ويفك تشفيرها ليحولها إلى صور، ألوان، أشكال، مسافات، وحركات مرئية.',
        anatomy: 'يقع في أقصى الجزء الخلفي من الدماغ فوق المخيخ مباشرة، محمي بعظم الجمجمة القفوي المتين.',
        clinical: 'أي ضربة أو صدمة قوية على مؤخرة الرأس قد تسبب رؤية ومضات ضوئية أو نجوم لامعة نتيجة تحفيز خلايا القشرة البصرية في الفص القفوي.',
        defaultYt: 'https://www.youtube.com/watch?v=9UukcdU2584',
        ytTitle: 'الفص القفوي ومعالجة الإشارات البصرية'
      },
      {
        id: 'brain-temporal',
        name: 'الفص الصدغي (Temporal Lobe)',
        enName: 'Temporal Lobe',
        target: { top: '50%', left: '48%' },
        badgePos: { top: '52%', left: '8%' },
        color: '#f59e0b',
        shortDesc: 'مسؤول عن السمع، فهم اللغة، وتخزين الذكريات.',
        function: 'يعالج الإشارات الصوتية والسمعية، ويختص بفهم وتفسير الكلام واللغات المسموعة، كما يلعب دوراً جوهرياً في تكوين وتخزين الذكريات طويلة الأمد والتعرف على ملامح الوجوه.',
        anatomy: 'يقع على جانبي الدماغ بمحاذاة الأذنين، ويحتضن في عمقه تراكيب بالغة الأهمية مثل "الحصين" (Hippocampus) مقر الذاكرة ومنطقة فيرنيكه اللغوية.',
        clinical: 'بفضل الفص الصدغي، تستطيعين التعرف على صوت والدتك بمجرد سماع نبرتها، وتذكر الألحان والمواقف الجميلة من طفولتك.',
        defaultYt: 'https://www.youtube.com/watch?v=EazbXp3g7E0',
        ytTitle: 'الفص الصدغي والذاكرة واللغة والسمع'
      },
      {
        id: 'brain-cerebellum',
        name: 'المخيخ (Cerebellum)',
        enName: 'Cerebellum',
        target: { top: '68%', left: '72%' },
        badgePos: { top: '72%', left: '75%' },
        color: '#10b981',
        shortDesc: 'مسؤول عن التوازن الحركي وتناسق العضلات.',
        function: 'مهندس التوازن والحركة الدقيقة في الجسم؛ ينسق انقباض العضلات المختلفة لتصبح الحركات سلسة ومنتظمة أثناء المشي، الجري، ركوب الدراجة، الكتابة، أو العزف.',
        anatomy: 'يُلقب بـ "المخ الصغير" ويقع في أسفل الدماغ من الخلف، ورغم صغر حجمه إلا أنه يحتوي على أكثر من نصف مجموع الخلايا العصبية في الدماغ بأكمله!',
        clinical: 'لا يصدر المخيخ أوامر الحركة الأولية، بل يضبط توقيتها ودرجتها، وأي خلل فيه يؤدي لترنح المشية وفقدان التوازن الحركي.',
        defaultYt: 'https://www.youtube.com/watch?v=DF04q9xwn48',
        ytTitle: 'المخيخ ووظيفة التوازن وتناسق الحركة'
      },
      {
        id: 'brain-brainstem',
        name: 'جذع الدماغ (Brainstem)',
        enName: 'Brainstem',
        target: { top: '78%', left: '51%' },
        badgePos: { top: '89%', left: '42%' },
        color: '#ef4444',
        shortDesc: 'ينظم دقات القلب، التنفس، وضغط الدم تلقائياً.',
        function: 'برج التحكم الآلي بالحياة؛ ينظم الوظائف الفسيولوجية اللاإرادية التي تبقيكِ حية دون تفكير؛ مثل نبض القلب، وتيرة التنفس، ضغط الدم، البلع، السعال، ومنعكسات القيء.',
        anatomy: 'يربط الدماغ بالحبل الشوكي ويتكون من ثلاثة أجزاء رئيسية: الدماغ المتوسط، الجسر (Pons)، والنخاع المستطيل (Medulla Oblongata).',
        clinical: 'يعد جذع الدماغ من أخطر وأهم مناطق الجهاز العصبي، كما ينظم دورات النوم واليقظة ومستوى الوعي عبر التشكيل الشبكي.',
        defaultYt: 'https://www.youtube.com/watch?v=1F_sN0zQZ5c',
        ytTitle: 'جذع الدماغ والتحكم في نبض القلب والتنفس'
      }
    ],
    defaultQuestions: [
      {
        id: 'q-brain-1',
        q: 'ما هو الجزء في الدماغ المسؤول عن حفظ توازن الجسم وتناسق حركة العضلات أثناء المشي والجري والكتابة؟',
        options: [
          'المخيخ (Cerebellum) الواقع أسفل الدماغ من الخلف',
          'الفص القفوي البصري فقط',
          'عظام الجمجمة الخارجية',
          'الغشاء السحائي المحيط بالمخ'
        ],
        correct: 'المخيخ (Cerebellum) الواقع أسفل الدماغ من الخلف',
        explain: 'يقع المخيخ أسفل المخ من الخلف، وهو المسؤول المباشر عن تنسيق انقباضات العضلات وضبط دقة وتوازن الحركات الإرادية واللاإرادية.',
        motivationSuccess: '⚡ ذكاء متقد وإجابة نموذجية لا غبار عليها! أنتِ تملكين مهارة الملاحظة العلمية الفائقة! 🧠✨',
        motivationRetry: '🎯 فكري في الجزء الملقب بـ "المخ الصغير" أسفل الرأس والذي يمنعنا من السقوط! جربي مرة أخرى!'
      },
      {
        id: 'q-brain-2',
        q: 'أي فص من فصوص الدماغ يختص باستقبال الإشارات القادمة من العصب البصري وتحويلها إلى صور وألوان مرئية؟',
        options: [
          'الفص القفوي (Occipital Lobe) في مؤخرة الرأس',
          'الفص الجبهي الأمامي',
          'الفص الصدغي الجانبي',
          'جذع الدماغ السفلي'
        ],
        correct: 'الفص القفوي (Occipital Lobe) في مؤخرة الرأس',
        explain: 'يحتوي الفص القفوي في مؤخرة الدماغ على القشرة البصرية الأولية المسؤولة عن معالجة وتفسير جميع الإشارات الضوئية القادمة من شبكية العين.',
        motivationSuccess: '👁️ أحسنتِ ببراعة واقتدار! تفسيركِ لآلية الإبصار صحيح تماماً ومبهر! 🌟🎉',
        motivationRetry: '💡 يقع هذا الفص في أقصى الجزء الخلفي من الدماغ خلف الأذنين مباشرة؛ جربي اختياره الآن!'
      }
    ]
  },

  stomach: {
    id: 'stomach',
    name: 'المعدة',
    tag: 'الجهاز الهضمي',
    summary: 'المعدة كيس عضلي مرن يفرز حمض الهيدروكلوريك وإنزيمات هاضمة قوية تطحن الطعام وتفتته كيميائياً وميكانيكياً إلى سائل كثيف يسهل امتصاصه.',
    location: 'في الجزء العلوي الأيسر من تجويف البطن، أسفل الحجاب الحاجز مباشرة وتتصل بالأعلى بالمريء وبالأسفل بالاثني عشر.',
    function: 'تخزين الطعام المتناول مؤقتاً، خلطه بالعصارات المعدية الحمضية، تفتيت البروتينات، والقضاء على الجراثيم والبكتيريا الضارة الداخلة مع الغذاء.',
    funFact: 'حمض المعدة قوي جداً بدرجة حموضة (pH 1.5 - 2) لدرجة قدرته على إذابة المعادن، لكن بطانتها المخاطية السميكة تجدد نفسها بالكامل كل 3 إلى 5 أيام لتحمي نفسها!',
    soundAction: () => sounds.playOrgan10Seconds('stomach'),
    soundLabel: 'تنشيط العصارة الهاضمة 🧪',
    parts: [
      {
        id: 'stomach-cardia',
        name: 'فوهة الفؤاد (Cardia)',
        enName: 'Cardia',
        target: { top: '18%', left: '42%' },
        badgePos: { top: '14%', left: '7%' },
        color: '#f97316',
        shortDesc: 'صمام يمنع ارتداد أحماض المعدة إلى المريء.',
        function: 'المدخل العلوي الترحيبي للمعدة؛ يستقبل اللقمة الغذائية القادمة من المريء ويمنع ارتداد حمض المعدة الكاوي للأعلى بالتنسيق مع المصرة المريئية السفلية.',
        anatomy: 'منطقة حلقية ضيقة تحيط بفتحة الاتصال بين المريء والمعدة وتقع أسفل الحجاب الحاجز مباشرة.',
        clinical: 'سُميت "فوهة الفؤاد" لقربها الشديد تشريحياً من القلب، لذا يُشعر ألم حموضة المعدة كأنه حرقة في منطقة الصدر والفؤاد.',
        defaultYt: 'https://www.youtube.com/watch?v=Og5xAdC8EUI',
        ytTitle: 'فوهة الفؤاد ومدخل الطعام إلى المعدة'
      },
      {
        id: 'stomach-fundus',
        name: 'قاع المعدة (Fundus)',
        enName: 'Fundus',
        target: { top: '22%', left: '58%' },
        badgePos: { top: '16%', left: '72%' },
        color: '#8b5cf6',
        shortDesc: 'القبة العلوية المرنة التي تتمدد لتخزين الطعام.',
        function: 'المستودع العلوي للمعدة؛ يتمدد بمرونة فائقة ليستوعب كميات الطعام المتناولة قبل هضمها، وتتجمع فيه غازات الهضم الطبيعية.',
        anatomy: 'جزء مقبب كالقبة يقع أعلى مستوى فوهة الفؤاد في الجزء الأيسر من المعدة تحت الحجاب الحاجز مباشرة.',
        clinical: 'تستطيع المعدة التمدد بفضل هذا القاع لتتسع لأكثر من لتر ونصف من الطعام والشراب، وتعود لحجم قبضة اليد عندما تفرغ.',
        defaultYt: 'https://www.youtube.com/watch?v=7v2mE9570w8',
        ytTitle: 'قاع المعدة وتخزين الطعام وتمدده'
      },
      {
        id: 'stomach-body',
        name: 'جسم المعدة والانحناء الكبير',
        enName: 'Body & Greater Curvature',
        target: { top: '48%', left: '52%' },
        badgePos: { top: '46%', left: '74%' },
        color: '#10b981',
        shortDesc: 'عضلات قوية تطحن الطعام وتفرز حمض الهيدروكلوريك.',
        function: 'المعمل الكيميائي والميكانيكي الرئيسي؛ تطحن ثلاث طبقات عضلية قوية الطعام وتحوله إلى سائل متجانس كثيف يُسمى "الكيموس" (Chyme)، وتفرز خلايا الجدار حمض HCl وإنزيم البيبسين لهضم البروتينات.',
        anatomy: 'يشغل المساحة الأكبر في المعدة، ويمتد بين الانحناء الصغير يميناً والانحناء الكبير المحدب يساراً.',
        clinical: 'الحركات التمعجية القوية لجسم المعدة تحدث كل 20 ثانية تقريباً أثناء الهضم لضمان امتزاج كامل للغذاء بالعصارات.',
        defaultYt: 'https://www.youtube.com/watch?v=yIoTRGfcRqM',
        ytTitle: 'هضم الطعام كيميائياً داخل جسم المعدة'
      },
      {
        id: 'stomach-mucosa',
        name: 'الغشاء المخاطي الداخلي',
        enName: 'Gastric Mucosa',
        target: { top: '45%', left: '38%' },
        badgePos: { top: '46%', left: '7%' },
        color: '#d946ef',
        shortDesc: 'طبقة سميكة تجدد نفسها لتحمي المعدة من حمضها.',
        function: 'الدرع الواقي للمعدة؛ يفرز طبقة هلامية سميكة غنية بالبيكربونات القلوية تعزل حمض الهيدروكلوريك الحارق عن خلايا الجدار العضلي لتحمي المعدة من هضم نفسها.',
        anatomy: 'بطانة داخلية سميكة ذات ثنايا وطيات متعددة (Rugae) تسمح للمعدة بالتمدد عند الامتلاء، وتحتوي على ملايين الغدد المعدية المجهرية.',
        clinical: 'تتجدد خلايا بطانة المعدة باستمرار كل بضعة أيام، وتلف هذه الطبقة بسبب التوتر أو الأدوية قد يؤدي إلى قرحة المعدة.',
        defaultYt: 'https://www.youtube.com/watch?v=eKaBQrFdNtw',
        ytTitle: 'طبقة المخاط الواقية وحماية جدار المعدة'
      },
      {
        id: 'stomach-pylorus',
        name: 'عضلة البواب (Pylorus)',
        enName: 'Pylorus & Pyloric Sphincter',
        target: { top: '75%', left: '41%' },
        badgePos: { top: '78%', left: '8%' },
        color: '#0284c7',
        shortDesc: 'صمام ذكي يمرر الطعام المهضوم تدريجياً للاثني عشر.',
        function: 'البوابة الحارسة لمخرج المعدة؛ تفتح وتغلق بإحكام لتمرير الطعام المطحون (الكيموس) بجرعات صغيرة مدروسة إلى الأمعاء الدقيقة (الاثني عشر) وتمنع ارتجاعه للمعدة.',
        anatomy: 'حلقة عضلية سميكة وقوية تشكل صماماً فاصلاً بين نهاية تجويف المعدة وبداية الأمعاء الدقيقة.',
        clinical: 'يضمن هذا الصمام عدم انتقال الطعام غير المهضوم جيداً للأمعاء، ويحمي الأمعاء من تدفق كميات كبيرة من الحمض دفعة واحدة.',
        defaultYt: 'https://www.youtube.com/watch?v=b20VRR9C37Q',
        ytTitle: 'عضلة البواب وتنظيم مرور الطعام للأمعاء'
      }
    ],
    defaultQuestions: [
      {
        id: 'q-stomach-1',
        q: 'كيف تحمي المعدة جدارها الداخلي الحساس من التآكل بفعل حمض الهيدروكلوريك القوي والعصارات الهاضمة؟',
        options: [
          'بإفراز غشاء مخاطي سميك وغني بالبيكربونات يتجدد باستمرار',
          'بتبريد درجة حرارة الطعام بشكل فوري',
          'بامتصاص كل الأحماض عبر مسامات الجلد الخارجية',
          'بالاعتماد على الهواء المستنشق في الرئتين'
        ],
        correct: 'بإفراز غشاء مخاطي سميك وغني بالبيكربونات يتجدد باستمرار',
        explain: 'تبطن المعدة خلايا متخصصة تفرز طبقة مخاطية قلوية سميكة تحمي خلايا الجدار العضلي من التأثير التآكلي لحمض (HCl) القادر على إذابة المعادن.',
        motivationSuccess: '🧪 رائع جداً! استنتاج علمي كيميائي في غاية الروعة والدقة! بارك الله في هذا الفكر النير! 👏🌟',
        motivationRetry: '🛡️ تذكري الدرع الوقائي اللزج الذي يغلف بطانة المعدة من الداخل كطبقة عازلة! حاولي ثانية!'
      },
      {
        id: 'q-stomach-2',
        q: 'ما وظيفة "عضلة البواب" (Pyloric Sphincter) الموجودة عند مخرج المعدة؟',
        options: [
          'تنظيم خروج الطعام المهضوم (الكيموس) بجرعات صغيرة منتظمة نحو الأمعاء الدقيقة',
          'منع الطعام من النزول من البلعوم إلى المريء',
          'امتصاص الماء وتوزيعه على خلايا الجسم مباشرة',
          'تفتيت الدهون داخل تجويف الفم'
        ],
        correct: 'تنظيم خروج الطعام المهضوم (الكيموس) بجرعات صغيرة منتظمة نحو الأمعاء الدقيقة',
        explain: 'تعمل عضلة البواب كصمام حراسة ذكي يسمح فقط بمرور الطعام بعد أن يطحن جيداً ويتحول لسائل ناعم، ليتسنى للاثني عشر والأمعاء استكمال الهضم دون إجهاد.',
        motivationSuccess: '🌟 إجابة مثالية وممتازة! فهمكِ لدور الصمامات الهضمية يبرهن على إتقانكِ الكامل للموضوع! 🏅✨',
        motivationRetry: '🚪 هذا الصمام بمثابة البوابة الحارسة بين المعدة والأمعاء الدقيقة؛ اختاري الإجابة المناسبة الآن!'
      }
    ]
  },

  esophagus: {
    id: 'esophagus',
    name: 'المريء والمعدة',
    tag: 'الممر الهضمي',
    summary: 'المريء أنبوب عضلي مبطن يربط البلعوم بالمعدة، وينقل بلعات الطعام والشراب عبر حركات عضلية تمعجية لاإرادية قوية تسمى الحركة الدودية.',
    location: 'يمتد في المنصف الصدري خلف القصبة الهوائية والقلب ماراً عبر فتحة الحجاب الحاجز ليصل إلى أعلى المعدة.',
    function: 'توصيل الطعام والسوائل بأمان من الفم والبلعوم إلى تجويف المعدة، ومنع ارتداد الأحماض للأعلى عبر الصمامات العاصرة.',
    funFact: 'بفضل الحركات الدودية العضلية القوية للمريء، يستطيع الإنسان بلع الطعام والماء حتى لو كان معلقاً رأساً على عقب، أو في الفضاء بانعدام الجاذبية!',
    soundAction: () => sounds.playOrgan10Seconds('esophagus'),
    soundLabel: 'محاكاة الحركة الدودية 🔄',
    parts: [
      {
        id: 'esophagus-pharynx',
        name: 'البلعوم والمصرة العلوية',
        enName: 'Pharynx & Upper Sphincter',
        target: { top: '14%', left: '50%' },
        badgePos: { top: '11%', left: '68%' },
        color: '#f97316',
        shortDesc: 'نقطة انطلاق اللقمة الغذائية بالتنسيق مع لسان المزمار.',
        function: 'المفترق الذكي للبلع؛ يوجه اللقمة من الفم للمريء ويغلق لسان المزمار القصبة الهوائية فوراً لمنع دخول الطعام لمجرى التنفس والرئتين.',
        anatomy: 'ممر عضلي قمعي يربط الحلق بأعلى المريء، وتتحكم به عضلات عاصرة إرادية ولاإرادية بتنسيق عصبي فائق.',
        clinical: 'التنسيق العصبي الدقيق هنا يمنع ظاهرة "التشردق" أو استنشاق الطعام في مجرى الهواء.',
        defaultYt: 'https://www.youtube.com/watch?v=5rT8s8jMupI',
        ytTitle: 'آلية البلع ودور لسان المزمار'
      },
      {
        id: 'esophagus-tube',
        name: 'المجرى العضلي والحركة الدودية',
        enName: 'Muscular Tube & Peristalsis',
        target: { top: '38%', left: '50%' },
        badgePos: { top: '36%', left: '8%' },
        color: '#0284c7',
        shortDesc: 'موجات انقباضية عضلية تدفع الطعام بقوة للمعدة.',
        function: 'ينقبض جدار المريء في موجات عضلية تمعجية لاإرادية متتابعة تدفع اللقمة الغذائية نحو الأسفل في غضون 4 إلى 8 ثوانٍ فقط.',
        anatomy: 'أنبوب مرن بطول 25 سم يتكون من طبقتين عضليتين: دائرية داخلية وطولية خارجية، ومبطن بغشاء مخاطي أملس يسهل الانزلاق.',
        clinical: 'هذه الحركة عضلية دافعة مستقلة تماماً عن الجاذبية الأرضية، مما يتيح التغذية في جميع وضعيات الجسم.',
        defaultYt: 'https://www.youtube.com/watch?v=UlsCYFqL86g',
        ytTitle: 'الحركة الدودية في المريء 3D Animation'
      },
      {
        id: 'esophagus-les',
        name: 'المصرة المريئية السفلية (LES)',
        enName: 'Lower Esophageal Sphincter',
        target: { top: '62%', left: '50%' },
        badgePos: { top: '60%', left: '72%' },
        color: '#ef4444',
        shortDesc: 'صمام أمان ينغلق بإحكام لمنع الارتجاع المريئي.',
        function: 'صمام أمان أحادي الاتجاه عند نهاية المريء؛ يسترخي لثوانٍ معدودة ليسمح للقمة بدخول المعدة، ثم ينغلق بقوة محكمة ليمنع ارتداد حمض المعدة الحارق.',
        anatomy: 'حلقة عضلية تقع عند مستوى فتحة الحجاب الحاجز تعمل كحاجز ضغط طبيعي بين بيئة المريء المعتدلة وبيئة المعدة الحامضية.',
        clinical: 'ضعف أو ارتخاء هذا الصمام العضلي هو السبب المباشر لمرض الارتجاع المعدي المريئي والشعور بحرقة الصدر والحلق (GERD).',
        defaultYt: 'https://www.youtube.com/watch?v=tI8eXjS_o2w',
        ytTitle: 'المصرة المريئية السفلية وحرقة المعدة'
      },
      {
        id: 'esophagus-junction',
        name: 'الاتصال بالمعدة (مخرج المريء)',
        enName: 'Gastroesophageal Junction',
        target: { top: '82%', left: '46%' },
        badgePos: { top: '91%', left: '45%' },
        color: '#10b981',
        shortDesc: 'يصل الأنبوب الهضمي بأعلى تجويف المعدة.',
        function: 'المنطقة الانتقالية التشريحية (الخط Z) التي تسلم الطعام لتجويف المعدة وتتحول فيها الخلايا الطلائية الحرشفية للمريء إلى خلايا غدية عمادية معدية.',
        anatomy: 'منطقة الالتقاء الدقيقة بين نهاية المريء وفوهة فؤاد المعدة داخل التجويف البطني.',
        clinical: 'تمثل هذه المنطقة فاصلاً نسيجياً هاماً يراقبه الأطباء بالمنظار للتأكد من عدم وجود التهابات أو تغيرات نسيجية ناتجة عن الحموضة.',
        defaultYt: 'https://www.youtube.com/watch?v=bFczvJp0bpU',
        ytTitle: 'نقطة التقاء المريء بالمعدة وتشريحها'
      }
    ],
    defaultQuestions: [
      {
        id: 'q-esophagus-1',
        q: 'ما القوة الأساسية التي تدفع اللقمة الغذائية نزولاً عبر أنبوب المريء إلى المعدة حتى ولو كان الإنسان مستلقياً؟',
        options: [
          'الحركة الدودية (Peristalsis) وهي انقباضات عضلية متموجة لاإرادية',
          'الجاذبية الأرضية وحدها فقط',
          'ضغط الهواء الناتج عن عملية الشهيق الرئوي',
          'تدفق الدم السريع داخل الشرايين'
        ],
        correct: 'الحركة الدودية (Peristalsis) وهي انقباضات عضلية متموجة لاإرادية',
        explain: 'يحتوي المريء على عضلات دائرية وطولية تنقبض خلف اللقمة وتنبسط أمامها في حركة دودية متموجة تدفع الطعام بقوة وبشكل موجه نحو المعدة دون الاعتماد على الجاذبية.',
        motivationSuccess: '🔄 إجابة متألقة ورائعة! الحركة الدودية هي إحدى أعظم معجزات الجهاز الهضمي العضلي! 👏🎉',
        motivationRetry: '🌊 فكري في الموجات العضلية التي تدفع الطعام كالموجة المتدفقة! جربي الإجابة الصحيحة!'
      },
      {
        id: 'q-esophagus-2',
        q: 'ما الأهمية الحيوية للصمام العاصر المريئي السفلي (LES) عند التقاء المريء بالمعدة؟',
        options: [
          'ينغلق بإحكام ليمنع ارتداد أحماض المعدة ومحتوياتها الحارقة إلى المريء',
          'يعمل على تذوق الطعام وتقدير حلاوته',
          'يساعد على خروج الهواء أثناء التحدث والنطق',
          'يفرز إنزيمات لهضم النشويات في الصدر'
        ],
        correct: 'ينغلق بإحكام ليمنع ارتداد أحماض المعدة ومحتوياتها الحارقة إلى المريء',
        explain: 'يحمي الصمام العاصر السفلي أنسجة المريء غير المحمية من الاحتراق بفعل العصارة المعدية الحامضية، ويفتح فقط لمرور الطعام ثم يغلق فوراً لمنع الارتجاع المريئي.',
        motivationSuccess: '🛡️ أحسنتِ بتميز فائق! إدراككِ لصمام الأمان يمنحكِ لقب خبيرة الجهاز الهضمي اليوم! 🌟👩‍⚕️',
        motivationRetry: '💡 تذكري وظيفة صمام الأمان الذي يحمي الصدر والمريء من حموضة وحرقة المعدة! جربي الآن.'
      }
    ]
  },

  eye: {
    id: 'eye',
    name: 'العين',
    tag: 'أعضاء الحواس',
    summary: 'العين نافذة الإنسان البصرية على العالم؛ تلتقط موجات الضوء وتركّزها على الشبكية لتحولها إلى نبضات كهربائية يفسرها الدماغ كصور ملونة ثلاثية الأبعاد.',
    location: 'في محجر العين العظمي في الوجه، محاطة بدهون وعضلات محركة ودموع وجفون تحميها باستمرار.',
    function: 'استقبال الأشعة الضوئية، ضبط تركيز الرؤية وكمية الضوء، وتحويل الضوء إلى إشارات كهروكيميائية ينقلها العصب البصري للدماغ.',
    funFact: 'تستطيع العين البشرية السليمة التمييز بين أكثر من 10 ملايين لون ودرجة لونية، وترمش العين نحو 15 إلى 20 مرة في الدقيقة لترطيب سطحها وتطهيره!',
    soundAction: () => sounds.playOrgan10Seconds('eye'),
    soundLabel: 'تفاعل العدسة والضوء 💡',
    parts: [
      {
        id: 'eye-pupil',
        name: 'بؤبؤ العين (Pupil)',
        enName: 'Pupil',
        target: { top: '49%', left: '50%' },
        badgePos: { top: '34%', left: '72%' },
        color: '#0f172a',
        shortDesc: 'فتحة مركزية تتسع وتضيق للتحكم بكمية الضوء الداخل.',
        function: 'الفتحة الضوئية المركزية في العين؛ تتسع في الظلام للسماح بمرور أقصى قدر من الضوء لتحسين الرؤية، وتضيق تلقائياً في الضوء الساطع لحماية الشبكية من التلف.',
        anatomy: 'فتحة دائرية سوداء في وسط القزحية يبدو لونها أسود لأن الضوء الداخل إليها يمتصه قاع العين المظلم تماماً.',
        clinical: 'فحص منعكس البؤبؤ بالضوء (Pupillary Light Reflex) هو أحد أهم الفحوصات الطارئة لتقييم سلامة جذع الدماغ ووظائف الأعصاب.',
        defaultYt: 'https://www.youtube.com/watch?v=syaQgmKw53w',
        ytTitle: 'منعكس بؤبؤ العين والتكيف مع الضوء'
      },
      {
        id: 'eye-iris',
        name: 'القزحية الملونة (Iris)',
        enName: 'Iris',
        target: { top: '44%', left: '44%' },
        badgePos: { top: '32%', left: '7%' },
        color: '#0284c7',
        shortDesc: 'عضلة دائرية ملونة تمنح العين لونها الجذاب.',
        function: 'القرص العضلي الدائري الملون الذي يضبط حجم البؤبؤ بدقة عبر عضلات مضيقة وموسعة، ويحدد لون عين الإنسان بحسب تركيز صبغة الميلانين.',
        anatomy: 'غشاء رقيق يقع بين القرنية الشفافة والعدسة، وتتداخل فيه ألياف عضلية دائرية وشعاعية تتحكم باتساع الحدقة.',
        clinical: 'نمط الخطوط والتجاعيد في قزحية كل شخص فريد تماماً كبصمة الإصبع ولا يتطابق بين شخصين، ولذلك تُستخدم في تقنية "بصمة العين" الأمنية.',
        defaultYt: 'https://www.youtube.com/watch?v=gvozcv8pS3c',
        ytTitle: 'عضلة القزحية وبصمة العين وألوانها'
      },
      {
        id: 'eye-cornea',
        name: 'القرنية الشفافة (Cornea)',
        enName: 'Cornea',
        target: { top: '32%', left: '50%' },
        badgePos: { top: '16%', left: '68%' },
        color: '#0ea5e9',
        shortDesc: 'النافذة الأمامية الشفافة التي تكسر أشعة الضوء وتركزها.',
        function: 'العدسة الأمامية الثابتة للعين؛ تكسر أشعة الضوء الداخلة وتركّزها بنسبة 70% من إجمالي القوة البصرية للعين لتقع بدقة ووضوح على الشبكية.',
        anatomy: 'قبة نسيجية فائقة الشفافية تتكون من خمس طبقات دقيقة، وتتميز بعدم احتوائها على أي أوعية دموية لتحافظ على نقائها، وتتغذى من الدموع وأكسجين الهواء مباشرة.',
        clinical: 'القرنية هي النسيج الذي يُعاد تشكيل انحنائه في عمليات الليزك وعلاج قصر وطول النظر للاستغناء عن النظارات الطبية.',
        defaultYt: 'https://www.youtube.com/watch?v=fn6v3Z82U_I',
        ytTitle: 'القرنية الشفافة وانكسار الضوء وعمليات الليزك'
      },
      {
        id: 'eye-sclera',
        name: 'صلبة العين (Sclera)',
        enName: 'Sclera',
        target: { top: '52%', left: '31%' },
        badgePos: { top: '54%', left: '7%' },
        color: '#64748b',
        shortDesc: 'الغلاف الأبيض الخارجي المتين الذي يحمي مكونات العين.',
        function: 'الهيكل الخارجي الواقي لمقلة العين؛ يحافظ على كروية العين وضغطها الداخلي، ويوفر نقاط تثبيت قوية للعضلات الست المحركة للعين.',
        anatomy: 'نسيج ضام ليفي كثيف وأبيض اللون يغطي خمسة أسداس السطح الخارجي للعين من الخلف حتى محاذاة القرنية.',
        clinical: 'تغير لون الصلبة للأصفر يعد علامة طبية واضحة على الإصابة باليرقان وأمراض الكبد (ارتفاع البيليروبين).',
        defaultYt: 'https://www.youtube.com/watch?v=7B3z_Gq8s7Q',
        ytTitle: 'صلبة العين وعضلات حركة مقلة العين'
      },
      {
        id: 'eye-optic',
        name: 'العصب البصري والشبكية (Optic Nerve)',
        enName: 'Optic Nerve & Retina',
        target: { top: '62%', left: '65%' },
        badgePos: { top: '66%', left: '74%' },
        color: '#f59e0b',
        shortDesc: 'كابل حيوي ينقل الإشارات الكهروضوئية مباشرة للدماغ.',
        function: 'كابل الألياف الضوئية الفائق في جسم الإنسان؛ يجمع النبضات العصبية التي كونتها مستقبلات الشبكية وينقلها بسرعة الضوء إلى الفص القفوي في الدماغ لنرى الصورة.',
        anatomy: 'يحتوي على أكثر من 1.2 مليون ليف عصبي دقيق ينطلق من مؤخرة مقلة العين ماراً بالقناة البصرية إلى قاعدة الدماغ.',
        clinical: 'ارتفاع ضغط السائل داخل العين (الجلوكوما أو الماء الأزرق) يضغط على ألياف العصب البصري وقد يهدد الرؤية إذا لم يُعالج مبكراً.',
        defaultYt: 'https://www.youtube.com/watch?v=cFVbLN4cWWA',
        ytTitle: 'الشبكية والعصب البصري ونقل الإشارات للدماغ'
      }
    ],
    defaultQuestions: [
      {
        id: 'q-eye-1',
        q: 'ما الجزء الملون في العين (العضلي) الذي يتحكم بدقة في اتساع وتضيق بؤبؤ العين (الحدقة) وفق شدة الضوء؟',
        options: [
          'القزحية (Iris) الملونة',
          'الصلبة (بياض العين الخارجي)',
          'العصب البصري الخلفي',
          'الشبكية العصبية الداخلية'
        ],
        correct: 'القزحية (Iris) الملونة',
        explain: 'القزحية هي القرص العضلي الملون المحيط بالبؤبؤ؛ تنقبض عضلاتها لتضييق الحدقة في الضوء الساطع حمايةً للعين، وتتسع في الظلام لجمع أكبر قدر ممكن من الضوء.',
        motivationSuccess: '🌈 إجابة ساحرة ودقيقة! القزحية تمنح العين جمالها وتقوم بعمل هندسي بصري مذهل! 👏🌟',
        motivationRetry: '🎨 ابحثي عن الجزء الملون الذي يمنح الأعين ألوانها (بني، عسلي، أزرق، أخضر)! حاولي الآن.'
      },
      {
        id: 'q-eye-2',
        q: 'ما الدور الحيوي الذي يقوم به "العصب البصري" في عملية الرؤية والإبصار؟',
        options: [
          'نقل النبضات العصبية الكهروضوئية المتكونة على الشبكية مباشرة إلى الدماغ لتفسيرها',
          'إفراز الدموع لترطيب وتطهير سطح العين',
          'تركيز أشعة الضوء على قرنية العين الخارجية',
          'حماية بياض العين من الأتربة والأجسام الغريبة'
        ],
        correct: 'نقل النبضات العصبية الكهروضوئية المتكونة على الشبكية مباشرة إلى الدماغ لتفسيرها',
        explain: 'يعمل العصب البصري ككابل ألياف ضوئية فائق السرعة يحمل أكثر من مليون ليف عصبي ينقل بيانات الصور المشفرة من الشبكية لمراكز الرؤية في الدماغ.',
        motivationSuccess: '💡 إجابة مبهرة وإتقان علمي تام! فهمكِ الرائع يختتم رحلة الأعضاء بأعلى درجات التميز والذكاء! 🎓🌟🎉',
        motivationRetry: '🔌 فكري في السلك أو الكابل الحيوي الذي يربط بين كاميرا العين وشاشة الدماغ! جربي ثانية!'
      }
    ]
  }
};

// Aliases for compatibility
const organsData = organsSimulatorData;

// ==========================================
// YOUTUBE VIDEO MANAGER HELPERS
// ==========================================
function formatYouTubeEmbedUrl(url) {
  if (!url) return '';
  url = url.trim();
  // Extract 11-char YouTube ID
  let videoId = '';
  if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
    videoId = url;
  } else {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
  }
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`;
  }
  return url;
}

function getCustomYouTubeLinks() {
  try {
    const saved = localStorage.getItem('custom_organ_youtube_links');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return {};
}

function getPartYouTubeUrl(organKey, partId) {
  const custom = getCustomYouTubeLinks();
  if (custom[partId]) return custom[partId];
  const organ = organsSimulatorData[organKey];
  if (organ && organ.parts) {
    const part = organ.parts.find(p => p.id === partId);
    if (part) return part.defaultYt;
  }
  return '';
}

function setPartYouTubeUrl(partId, url) {
  const custom = getCustomYouTubeLinks();
  if (url && url.trim()) {
    custom[partId] = url.trim();
  } else {
    delete custom[partId];
  }
  try {
    localStorage.setItem('custom_organ_youtube_links', JSON.stringify(custom));
  } catch (e) {
    console.error(e);
  }
}

function resetPartYouTubeUrl(partId) {
  const custom = getCustomYouTubeLinks();
  delete custom[partId];
  try {
    localStorage.setItem('custom_organ_youtube_links', JSON.stringify(custom));
  } catch (e) {
    console.error(e);
  }
}

function resetAllYouTubeUrls() {
  try {
    localStorage.removeItem('custom_organ_youtube_links');
  } catch (e) {
    console.error(e);
  }
}

// ==========================================
// CUSTOM QUESTIONS MANAGER HELPERS
// ==========================================
function getCustomQuestions() {
  try {
    const saved = localStorage.getItem('custom_organ_questions');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return [];
}

function saveCustomQuestionToStorage(qData) {
  const questions = getCustomQuestions();
  questions.push(qData);
  try {
    localStorage.setItem('custom_organ_questions', JSON.stringify(questions));
  } catch (e) {
    console.error(e);
  }
}

function deleteCustomQuestionFromStorage(qId) {
  let questions = getCustomQuestions();
  questions = questions.filter(q => q.id !== qId);
  try {
    localStorage.setItem('custom_organ_questions', JSON.stringify(questions));
  } catch (e) {
    console.error(e);
  }
}

function resetOrganCustomQuestionsInStorage(organKey) {
  let questions = getCustomQuestions();
  questions = questions.filter(q => q.organKey !== organKey);
  try {
    localStorage.setItem('custom_organ_questions', JSON.stringify(questions));
  } catch (e) {
    console.error(e);
  }
}

// Get all questions for an organ (default + custom)
function getOrganQuestions(organKey) {
  const organ = organsSimulatorData[organKey];
  const defaults = (organ && organ.defaultQuestions) ? [...organ.defaultQuestions] : [];
  const customs = getCustomQuestions().filter(q => q.organKey === organKey);
  return [...defaults, ...customs];
}

// Get all questions across all 6 organs
function getAllQuestions() {
  const all = [];
  Object.keys(organsSimulatorData).forEach(key => {
    const organQuestions = getOrganQuestions(key);
    organQuestions.forEach(q => {
      all.push({ ...q, organKey: key, organName: organsSimulatorData[key].name });
    });
  });
  return all;
}

// Dynamic quizData getter proxy
const quizData = new Proxy([], {
  get(target, prop) {
    const all = getAllQuestions();
    if (prop === 'length') return all.length;
    if (typeof prop === 'string' && !isNaN(prop)) {
      return all[parseInt(prop, 10)];
    }
    if (prop in all) {
      const val = all[prop];
      return typeof val === 'function' ? val.bind(all) : val;
    }
    return target[prop];
  }
});

// App State
const state = {
  currentTab: 'home',
  currentOrgan: 'heart',
  organViewerMode: 'labeled', // 'labeled' | '3d' | 'parts'
  exploredOrgans: new Set(),
  activePartModal: null,
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
  setupPartDetailModal();
  setupAddQuestionModal();
  setupAllYouTubeModal();
  updateProgressTracker();
  if (typeof setupBody3DViewer === 'function') {
    setupBody3DViewer();
  }
});


// ==========================================
// INSTANT PART SELECTION & FUNCTION DISPLAY
// ==========================================
window.selectPart = function(organKey, partId, openModal = false) {
  state.selectedPartId = partId;
  const organ = organsSimulatorData[organKey];
  if (!organ) return;
  const part = organ.parts.find(p => p.id === partId);
  if (!part) return;

  sounds.playBrainPulse();

  // 1. Update Active Card in Scientific Info Pane
  const card = document.getElementById('active-part-card');
  if (card) {
    card.style.display = 'block';
    const numBadge = document.getElementById('active-part-num');
    const nameElem = document.getElementById('active-part-name');
    const enElem = document.getElementById('active-part-en');
    const funcElem = document.getElementById('active-part-function-text');
    const anatElem = document.getElementById('active-part-anatomy-text');
    const clinElem = document.getElementById('active-part-clinical-text');
    const ytTitle = document.getElementById('active-part-yt-title');
    const ytInput = document.getElementById('active-part-yt-input');
    const ytPlayer = document.getElementById('active-part-yt-player');
    const toggleYtBtn = document.getElementById('toggle-part-yt-btn');
    const modalBtn = document.getElementById('active-part-modal-btn');
    const ytSaveBtn = document.getElementById('active-part-yt-save-btn');

    const partIdx = organ.parts.findIndex(p => p.id === partId);
    if (numBadge) {
      numBadge.textContent = `#${partIdx + 1}`;
      numBadge.style.background = part.color;
    }
    if (nameElem) nameElem.textContent = part.name;
    if (enElem) enElem.textContent = part.enName || '';
    if (funcElem) funcElem.textContent = part.function;
    if (anatElem) anatElem.textContent = part.anatomy;
    if (clinElem) clinElem.textContent = part.clinical;
    if (ytTitle) ytTitle.textContent = `فيديو: ${part.ytTitle || part.name}`;
    
    const currentYt = getPartYouTubeUrl(organKey, partId);
    if (ytInput) ytInput.value = currentYt;

    if (ytPlayer) {
      ytPlayer.style.display = 'none';
      ytPlayer.innerHTML = '';
    }

    if (toggleYtBtn) {
      toggleYtBtn.textContent = '▶️ تشغيل الفيديو';
      toggleYtBtn.onclick = () => {
        if (ytPlayer.style.display === 'none') {
          const embedUrl = formatYouTubeEmbedUrl(getPartYouTubeUrl(organKey, partId));
          ytPlayer.innerHTML = `<iframe src="${embedUrl}" title="${part.name}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
          ytPlayer.style.display = 'block';
          toggleYtBtn.textContent = '⏹️ إخفاء الفيديو';
        } else {
          ytPlayer.style.display = 'none';
          ytPlayer.innerHTML = '';
          toggleYtBtn.textContent = '▶️ تشغيل الفيديو';
        }
      };
    }

    if (ytSaveBtn) {
      ytSaveBtn.onclick = () => {
        if (ytInput) {
          const val = ytInput.value.trim();
          setPartYouTubeUrl(partId, val);
          sounds.playCorrect();
          alert(`تم حفظ رابط فيديو يوتيوب لـ (${part.name}) بنجاح!`);
        }
      };
    }

    if (modalBtn) {
      modalBtn.onclick = () => openPartModal(organKey, partId);
    }
  }

  // 2. Render Live Floating Toast on Viewer Frame
  renderViewerLiveToast(part, organKey);

  // 3. Highlight active pins in viewer and quick strip
  document.querySelectorAll('.chart-clickable-pin').forEach(pin => {
    const isAct = pin.getAttribute('data-part-id') === partId;
    pin.classList.toggle('active', isAct);
  });
  document.querySelectorAll('.floating-tag-pin').forEach(pin => {
    const isAct = pin.getAttribute('data-part-id') === partId;
    pin.classList.toggle('active', isAct);
  });
  document.querySelectorAll('.part-pill-chip').forEach(chip => {
    const isAct = chip.getAttribute('data-part-id') === partId;
    chip.classList.toggle('active-chip', isAct);
  });

  if (openModal) {
    openPartModal(organKey, partId);
  }
};

function renderViewerLiveToast(part, organKey) {
  const container = document.getElementById('viewer-live-toast-container');
  if (!container) return;

  const organ = organsSimulatorData[organKey];
  const partIdx = organ ? organ.parts.findIndex(p => p.id === part.id) : 0;
  const currentYt = getPartYouTubeUrl(organKey, part.id);

  container.innerHTML = `
    <div class="viewer-instant-function-card animate-pop-in">
      <div class="v-func-header">
        <div class="v-func-title-group">
          <span class="v-func-badge" style="background:${part.color};">#${partIdx + 1}</span>
          <div>
            <h4 class="v-func-part-name">${part.name}</h4>
            <span class="v-func-part-en">${part.enName || ''}</span>
          </div>
        </div>
        <div class="v-func-header-actions">
          <button class="btn-subtle-pill" onclick="openPartModal('${organKey}', '${part.id}')" title="فتح الشرح في نافذة مكبرة">
            🔍 نافذة مكبرة
          </button>
        </div>
      </div>

      <!-- Prominent Function Box: وظيفة وعمل هذا الجزء في الجسم -->
      <div class="v-func-box-primary">
        <div class="v-func-box-lbl">
          <span>⚙️</span> <strong>وظيفة وعمل هذا الجزء في الجسم:</strong>
        </div>
        <p class="v-func-box-text">${part.function}</p>
      </div>

      <!-- Two-column Anatomy & Clinical Details -->
      <div class="v-func-details-grid">
        <div class="v-func-box-sub v-func-anatomy">
          <div class="v-func-sub-lbl"><span>🔬</span> <strong>التشريح والموقع:</strong></div>
          <p class="v-func-sub-text">${part.anatomy}</p>
        </div>
        <div class="v-func-box-sub v-func-clinical">
          <div class="v-func-sub-lbl"><span>💡</span> <strong>الأهمية عند تعطل الوظيفة:</strong></div>
          <p class="v-func-sub-text">${part.clinical}</p>
        </div>
      </div>

      <!-- YouTube Inline Area -->
      <div class="v-func-youtube-bar">
        <div class="v-func-yt-head">
          <span>🎥 <strong>فيديو تعليمي:</strong> ${part.ytTitle || part.name}</span>
          <button id="v-func-toggle-yt-btn" class="btn-yt-toggle" onclick="toggleViewerPartVideo('${organKey}', '${part.id}')">
            ▶️ تشغيل الفيديو
          </button>
        </div>
        <div id="v-func-yt-player-box" class="active-yt-player-container" style="display:none;"></div>
        <div class="active-part-yt-custom-row">
          <input type="text" id="v-func-yt-input" value="${currentYt}" placeholder="تعديل رابط يوتيوب لهذا الجزء..." style="flex:1;padding:6px 10px;border-radius:6px;border:1.5px solid #cbd5e1;font-size:0.8rem;font-family:monospace;direction:ltr;">
          <button class="btn-primary" style="padding:6px 12px;font-size:0.8rem;" onclick="saveViewerPartVideo('${part.id}', '${part.name}')">💾 حفظ الرابط</button>
        </div>
      </div>
    </div>
  `;
}

window.toggleViewerPartVideo = function(organKey, partId) {
  const playerBox = document.getElementById('v-func-yt-player-box');
  const btn = document.getElementById('v-func-toggle-yt-btn');
  if (!playerBox) return;

  if (playerBox.style.display === 'none') {
    const rawUrl = getPartYouTubeUrl(organKey, partId);
    const embedUrl = formatYouTubeEmbedUrl(rawUrl);
    playerBox.innerHTML = `<iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    playerBox.style.display = 'block';
    if (btn) btn.textContent = '⏹️ إخفاء الفيديو';
  } else {
    playerBox.style.display = 'none';
    playerBox.innerHTML = '';
    if (btn) btn.textContent = '▶️ تشغيل الفيديو';
  }
};

window.saveViewerPartVideo = function(partId, partName) {
  const input = document.getElementById('v-func-yt-input');
  if (!input) return;
  const val = input.value.trim();
  setPartYouTubeUrl(partId, val);
  sounds.playCorrect();
  alert(`تم حفظ وتحديث رابط فيديو يوتيوب لـ (${partName}) بنجاح!`);
};

// Setup Navigation
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (targetTab) switchTab(targetTab);
    });
  });

  // Mobile Bottom App Bar Navigation
  const mNavBtns = document.querySelectorAll('.m-nav-item');
  mNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      triggerHaptic(25);
      if (targetTab) switchTab(targetTab);
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

function triggerHaptic(pattern) {
  if (navigator && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
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
    const isTarget = section.id === `tab-${tabId}`;
    section.classList.toggle('active', isTarget);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tabId === 'organs') {
    renderOrganDetails();
    renderOrganViewer();
    renderQuickPartsStrip();
    renderOrganQuestions();
  } else if (tabId === 'quiz') {
    renderQuizQuestion();
  }
}

// ==========================================
// ORGAN EXPLORER SETUP & RENDERING
// ==========================================
function setupOrganExplorer() {
  const tabsContainer = document.getElementById('organ-tabs-container');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = '';
  Object.keys(organsSimulatorData).forEach(key => {
    const organ = organsSimulatorData[key];
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

  // Viewer Mode Toggles
  const toggleLabeled = document.getElementById('view-opt-labeled');
  const toggle3D = document.getElementById('view-opt-3d');
  const toggleParts = document.getElementById('view-opt-parts');

  if (toggleLabeled && toggle3D && toggleParts) {
    toggleLabeled.addEventListener('click', () => {
      state.organViewerMode = 'labeled';
      updateViewerToggleButtons();
      renderOrganViewer();
    });

    toggle3D.addEventListener('click', () => {
      state.organViewerMode = '3d';
      updateViewerToggleButtons();
      renderOrganViewer();
    });

    toggleParts.addEventListener('click', () => {
      state.organViewerMode = 'parts';
      updateViewerToggleButtons();
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
  renderQuickPartsStrip();
  renderOrganQuestions();

  const initialOrgan = organsSimulatorData[state.currentOrgan];
  if (initialOrgan && initialOrgan.parts && initialOrgan.parts.length > 0) {
    selectPart(state.currentOrgan, initialOrgan.parts[0].id);
  }
}

function updateViewerToggleButtons() {
  const toggleLabeled = document.getElementById('view-opt-labeled');
  const toggle3D = document.getElementById('view-opt-3d');
  const toggleParts = document.getElementById('view-opt-parts');
  if (toggleLabeled) toggleLabeled.classList.toggle('active', state.organViewerMode === 'labeled');
  if (toggle3D) toggle3D.classList.toggle('active', state.organViewerMode === '3d');
  if (toggleParts) toggleParts.classList.toggle('active', state.organViewerMode === 'parts');
}

function selectOrgan(organKey) {
  if (state.currentOrgan !== organKey) {
    sounds.stopOrganSound();
  }
  state.currentOrgan = organKey;
  document.querySelectorAll('.organ-tab-btn').forEach(btn => {
    const isSelected = btn.textContent.includes(organsSimulatorData[organKey].name);
    btn.classList.toggle('active', isSelected);
  });

  renderOrganDetails();
  renderOrganViewer();
  renderQuickPartsStrip();
  renderOrganQuestions();
  updateOrganCompletedState();

  const organ = organsSimulatorData[organKey];
  if (organ && organ.parts && organ.parts.length > 0) {
    selectPart(organKey, organ.parts[0].id);
  }
}

function renderOrganDetails() {
  const organ = organsSimulatorData[state.currentOrgan];
  if (!organ) return;

  const tagElem = document.getElementById('organ-info-tag');
  const nameElem = document.getElementById('organ-info-name');
  const summaryElem = document.getElementById('organ-info-summary');
  const locationElem = document.getElementById('organ-info-location');
  const functionElem = document.getElementById('organ-info-function');
  const funfactElem = document.getElementById('organ-info-funfact');

  if (tagElem) tagElem.textContent = organ.tag;
  if (nameElem) {
    nameElem.innerHTML = `
      <img src="${organImages[state.currentOrgan]}" class="organ-header-thumb" alt="${organ.name}">
      <span>${organ.name}</span>
    `;
  }
  if (summaryElem) summaryElem.textContent = organ.summary;
  if (locationElem) locationElem.textContent = organ.location;
  if (functionElem) functionElem.textContent = organ.function;
  if (funfactElem) funfactElem.textContent = organ.funFact;

  const soundBtn = document.getElementById('organ-sound-btn');
  if (soundBtn) {
    soundBtn.innerHTML = `<span>🔊</span> <span>${organ.soundLabel}</span>`;
    soundBtn.onclick = () => {
      if (organ.soundAction) organ.soundAction();
    };
  }
}

// Render Organ Simulator Frame
function renderOrganViewer() {
  const organ = organsSimulatorData[state.currentOrgan];
  const frameContainer = document.getElementById('viewer-frame-container');
  if (!organ || !frameContainer) return;

  updateViewerToggleButtons();

  if (state.organViewerMode === 'labeled') {
    // 1. LABELED DIAGRAM SIMULATOR WITH VISIBLE PART NAMES AND CLICKABLE HOTSPOTS
    let hotspotsHtml = '';
    organ.parts.forEach((part, idx) => {
      hotspotsHtml += `
        <div class="chart-clickable-pin ${part.id === state.selectedPartId ? 'active' : ''}" data-part-id="${part.id}" style="top: ${part.target.top}; left: ${part.target.left};" onclick="selectPart('${organ.id}', '${part.id}')" title="انقري لعرض وظيفة وعمل ${part.name}">
          <div class="chart-pin-dot" style="background:${part.color};">
            ${idx + 1}
          </div>
          <div class="chart-pin-tag-label" style="border-color:${part.color};">${part.name}</div>
        </div>
      `;
    });

    frameContainer.innerHTML = `
      <div class="labeled-simulator-container">
        <div class="labeled-canvas-wrapper">
          <img src="${organLabeledImages[state.currentOrgan]}" alt="${organ.name}" class="labeled-stage-img">
          <div class="hotspots-overlay">
            ${hotspotsHtml}
          </div>
        </div>
      </div>
    `;
  } else if (state.organViewerMode === '3d') {
    // 2. 3D NATURAL REALISTIC MODEL WITH VISIBLE FLOATING LABELS & PARALLAX TILT
    let floatingTagsHtml = '';
    organ.parts.forEach((part, idx) => {
      floatingTagsHtml += `
        <div class="floating-tag-pin ${part.id === state.selectedPartId ? 'active' : ''}" data-part-id="${part.id}" style="top: ${part.target.top}; left: ${part.target.left};" onclick="selectPart('${organ.id}', '${part.id}')">
          <span class="hotspot-pulse" style="border-color:${part.color};"></span>
          <span class="hotspot-dot" style="background:${part.color};">${idx + 1}</span>
          <div class="floating-tag-card" style="border-color:${part.color};">
            ${part.name}
          </div>
        </div>
      `;
    });

    frameContainer.innerHTML = `
      <div class="natural-3d-stage" id="natural-3d-stage">
        <div class="natural-3d-card" id="natural-3d-card">
          <img src="${organImages[state.currentOrgan]}" alt="${organ.name}" class="natural-organ-img" id="natural-organ-img">
          <div class="hotspots-overlay">
            ${floatingTagsHtml}
          </div>
        </div>
        <div class="natural-model-controls">
          <span class="ctrl-hint">💡 حركي الماوس أو المس الشاشة لتحريك المجسم ثلاثياً | انقري على أي بطاقة لعرض الشرح وفيديو يوتيوب</span>
          <button class="natural-zoom-btn" onclick="organsSimulatorData['${organ.id}'].soundAction()">
            <span>🔊</span> <span>${organ.soundLabel}</span>
          </button>
        </div>
      </div>
    `;

    initParallaxTilt();
  } else {
    // 3. PARTS ROSTER GRID VIEW
    let rosterHtml = '';
    organ.parts.forEach((part, idx) => {
      rosterHtml += `
        <div class="roster-card ${part.id === state.selectedPartId ? 'active-card' : ''}" onclick="selectPart('${organ.id}', '${part.id}')">
          <div class="roster-card-header">
            <span class="roster-card-title">${part.name}</span>
            <span class="yt-badge">🎥 فيديو</span>
          </div>
          <div class="roster-card-desc">${part.function}</div>
          <div class="roster-card-action">
            <span>عرض وظيفة هذا الجزء فورياً</span>
            <span>←</span>
          </div>
        </div>
      `;
    });

    frameContainer.innerHTML = `
      <div class="parts-roster-view">
        <div class="roster-grid">
          ${rosterHtml}
        </div>
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

// Quick Parts Strip under the explorer
function renderQuickPartsStrip() {
  const organ = organsSimulatorData[state.currentOrgan];
  const pillsWrap = document.getElementById('organ-parts-pills');
  const organNameSpan = document.getElementById('quick-parts-organ-name');
  if (!organ || !pillsWrap) return;

  if (organNameSpan) organNameSpan.textContent = organ.name;
  pillsWrap.innerHTML = '';

  organ.parts.forEach((part, idx) => {
    const chip = document.createElement('button');
    chip.className = 'part-pill-chip';
    chip.innerHTML = `
      <span style="color:${part.color};font-weight:900;">#${idx + 1}</span>
      <span>${part.name}</span>
      <span class="yt-badge">🎥</span>
    `;
    chip.title = `انقري لعرض عمل ووظيفة ${part.name}`;
    chip.setAttribute('data-part-id', part.id);
    if (part.id === state.selectedPartId) chip.classList.add('active-chip');
    chip.onclick = () => selectPart(organ.id, part.id);
    pillsWrap.appendChild(chip);
  });
}

// ==========================================
// PART DETAIL & YOUTUBE MODAL LOGIC
// ==========================================
function setupPartDetailModal() {
  const modal = document.getElementById('part-detail-modal');
  const closeBtn = document.getElementById('close-part-modal-btn');
  const saveYtBtn = document.getElementById('save-part-yt-btn');
  const resetYtBtn = document.getElementById('reset-part-yt-btn');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      const wrap = document.getElementById('part-yt-player-wrap');
      if (wrap) wrap.innerHTML = '';
      state.activePartModal = null;
    });
  }

  if (saveYtBtn) {
    saveYtBtn.addEventListener('click', () => {
      if (!state.activePartModal) return;
      const input = document.getElementById('part-yt-input');
      const val = input ? input.value.trim() : '';
      if (val) {
        setPartYouTubeUrl(state.activePartModal.partId, val);
        sounds.playCorrect();
        const feedback = document.getElementById('yt-save-feedback');
        if (feedback) {
          feedback.style.display = 'inline-block';
          setTimeout(() => feedback.style.display = 'none', 3000);
        }
        // Refresh player
        const playerWrap = document.getElementById('part-yt-player-wrap');
        const embedUrl = formatYouTubeEmbedUrl(val);
        if (playerWrap) {
          playerWrap.innerHTML = `<iframe src="${embedUrl}" title="YouTube Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        }
      }
    });
  }

  if (resetYtBtn) {
    resetYtBtn.addEventListener('click', () => {
      if (!state.activePartModal) return;
      resetPartYouTubeUrl(state.activePartModal.partId);
      sounds.playCorrect();
      const defaultUrl = getPartYouTubeUrl(state.activePartModal.organKey, state.activePartModal.partId);
      const input = document.getElementById('part-yt-input');
      if (input) input.value = defaultUrl;
      const playerWrap = document.getElementById('part-yt-player-wrap');
      const embedUrl = formatYouTubeEmbedUrl(defaultUrl);
      if (playerWrap) {
        playerWrap.innerHTML = `<iframe src="${embedUrl}" title="YouTube Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      }
      alert('تمت استعادة رابط فيديو يوتيوب الافتراضي لهذا الجزء بنجاح!');
    });
  }
}

window.openPartModal = function(organKey, partId) {
  const organ = organsSimulatorData[organKey];
  if (!organ) return;
  const part = organ.parts.find(p => p.id === partId);
  if (!part) return;

  state.activePartModal = { organKey, partId };
  sounds.playBrainPulse();

  const modal = document.getElementById('part-detail-modal');
  const badge = document.getElementById('part-modal-organ-badge');
  const title = document.getElementById('part-modal-title');
  const subtitle = document.getElementById('part-modal-subtitle');
  const funcP = document.getElementById('part-modal-function');
  const anatP = document.getElementById('part-modal-anatomy');
  const clinP = document.getElementById('part-modal-clinical');
  const ytTitle = document.getElementById('part-modal-yt-title');
  const ytInput = document.getElementById('part-yt-input');
  const playerWrap = document.getElementById('part-yt-player-wrap');

  if (badge) badge.textContent = `${organ.name} • ${organ.tag}`;
  if (title) title.textContent = part.name;
  if (subtitle) subtitle.textContent = part.enName || '';
  if (funcP) funcP.textContent = part.function;
  if (anatP) anatP.textContent = part.anatomy;
  if (clinP) clinP.textContent = part.clinical;
  if (ytTitle) ytTitle.textContent = `🎥 فيديو تعليمي: ${part.ytTitle || part.name}`;

  const currentYtUrl = getPartYouTubeUrl(organKey, partId);
  if (ytInput) ytInput.value = currentYtUrl;

  const embedUrl = formatYouTubeEmbedUrl(currentYtUrl);
  if (playerWrap) {
    playerWrap.innerHTML = `
      <iframe 
        src="${embedUrl}" 
        title="${part.name}" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;
  }

  if (modal) modal.classList.add('show');
};

// ==========================================
// ORGAN QUESTIONS WITH MOTIVATIONAL FEEDBACK
// ==========================================
function renderOrganQuestions() {
  const organ = organsSimulatorData[state.currentOrgan];
  const questionsContainer = document.getElementById('organ-questions-list');
  const titleElem = document.getElementById('organ-quick-quiz-title');
  const trophyElem = document.getElementById('organ-trophy-display');
  if (!organ || !questionsContainer) return;

  const questions = getOrganQuestions(state.currentOrgan);

  if (titleElem) {
    titleElem.innerHTML = `<span>🎯</span> <span>تحدي المعرفة: أسئلة ${organ.name} (${questions.length} أسئلة)</span>`;
  }

  questionsContainer.innerHTML = '';
  let correctCount = 0;

  questions.forEach((qData, qIdx) => {
    const card = document.createElement('div');
    card.className = 'organ-q-card';

    const hasAnswered = state.quizAnswers[qData.id] !== undefined;
    const chosenAnswer = state.quizAnswers[qData.id];
    const isCorrect = chosenAnswer === qData.correct;
    if (hasAnswered && isCorrect) correctCount++;

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
        <button class="${btnClass}" ${hasAnswered ? 'disabled' : ''} onclick="answerOrganQuestion('${qData.id}', '${opt}')">
          <span>${opt}</span>
          <span style="font-weight:900;">${icon}</span>
        </button>
      `;
    });

    let feedbackHtml = '';
    if (hasAnswered) {
      if (isCorrect) {
        feedbackHtml = `
          <div style="margin-top:14px;padding:12px 16px;border-radius:10px;background:#ecfdf5;border:1.5px solid #10b981;color:#065f46;">
            <div style="font-size:0.95rem;font-weight:900;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
              <span>🎉</span> <span>${qData.motivationSuccess || 'إجابة عبقرية ورائعة! أحسنتِ الفهم!'}</span>
            </div>
            <div style="font-size:0.88rem;line-height:1.6;color:#047857;">${qData.explain}</div>
          </div>
        `;
      } else {
        feedbackHtml = `
          <div style="margin-top:14px;padding:12px 16px;border-radius:10px;background:#fff1f2;border:1.5px solid #f43f5e;color:#9f1239;">
            <div style="font-size:0.95rem;font-weight:900;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
              <span>💡</span> <span>${qData.motivationRetry || 'محاولة جيدة! فكري في وظيفة الجزء بدقة.'}</span>
            </div>
            <div style="font-size:0.88rem;line-height:1.6;color:#be123c;">${qData.explain}</div>
          </div>
        `;
      }
    }

    const customBadge = qData.isCustom ? `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span class="custom-q-badge">✍️ سؤال مضاف يدوياً</span>
        <button class="btn-delete-q" onclick="deleteCustomQuestion('${qData.id}')" title="حذف هذا السؤال المضاف">🗑️ حذف</button>
      </div>
    ` : '';

    card.innerHTML = `
      ${customBadge}
      <div class="organ-q-title">س ${qIdx + 1}: ${qData.q}</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${optionsHtml}
      </div>
      ${feedbackHtml}
    `;

    questionsContainer.appendChild(card);
  });

  // Trophy Display when all questions of this organ are correct
  if (trophyElem) {
    if (questions.length > 0 && correctCount === questions.length) {
      trophyElem.style.display = 'inline-flex';
      trophyElem.innerHTML = `
        <span class="trophy-icon">🏆</span>
        <span class="trophy-text">وسام الإتقان: أتقنتِ جميع أسئلة ${organ.name} بنجاح! (${correctCount}/${questions.length}) ⭐</span>
      `;
    } else {
      trophyElem.style.display = 'none';
    }
  }
}

window.answerOrganQuestion = function(qId, selectedOption) {
  const allQ = getAllQuestions();
  const qData = allQ.find(q => q.id === qId);
  if (!qData) return;

  state.quizAnswers[qId] = selectedOption;
  const isCorrect = selectedOption === qData.correct;

  if (isCorrect) {
    sounds.playCorrect();
    triggerHaptic(40);
  } else {
    sounds.playWrong();
    triggerHaptic([50, 40, 50]);
  }

  // Recalculate score
  let score = 0;
  allQ.forEach(q => {
    if (state.quizAnswers[q.id] === q.correct) score++;
  });
  state.quizScore = score;

  updateProgressTracker();
  renderOrganQuestions();
};

function updateOrganCompletedState() {
  const completeBtn = document.getElementById('mark-organ-complete-btn');
  if (!completeBtn) return;
  const isDone = state.exploredOrgans.has(state.currentOrgan);
  if (isDone) {
    completeBtn.classList.add('completed');
    completeBtn.innerHTML = `<span>✓</span> <span>تم استكشاف ${organsSimulatorData[state.currentOrgan].name} بنجاح!</span>`;
  } else {
    completeBtn.classList.remove('completed');
    completeBtn.innerHTML = `<span>✓</span> <span>تأكيد استكشاف ${organsSimulatorData[state.currentOrgan].name}</span>`;
  }
}

// ==========================================
// ADD CUSTOM QUESTION MODAL LOGIC
// ==========================================
function setupAddQuestionModal() {
  const modal = document.getElementById('add-question-modal');
  const closeBtn = document.getElementById('close-add-q-modal-btn');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  }
}

window.openAddQuestionModal = function(defaultOrgan) {
  const modal = document.getElementById('add-question-modal');
  if (!modal) return;
  const organSelect = document.getElementById('new-q-organ');
  if (organSelect && defaultOrgan) {
    organSelect.value = defaultOrgan;
  }
  // Clear inputs
  const qText = document.getElementById('new-q-text');
  const opt0 = document.getElementById('new-q-opt-0');
  const opt1 = document.getElementById('new-q-opt-1');
  const opt2 = document.getElementById('new-q-opt-2');
  const opt3 = document.getElementById('new-q-opt-3');
  const explain = document.getElementById('new-q-explain');
  if (qText) qText.value = '';
  if (opt0) opt0.value = '';
  if (opt1) opt1.value = '';
  if (opt2) opt2.value = '';
  if (opt3) opt3.value = '';
  if (explain) explain.value = '';
  modal.classList.add('show');
};

window.saveCustomQuestion = function() {
  const organKey = document.getElementById('new-q-organ').value;
  const qText = document.getElementById('new-q-text').value.trim();
  const opt0 = document.getElementById('new-q-opt-0').value.trim();
  const opt1 = document.getElementById('new-q-opt-1').value.trim();
  const opt2 = document.getElementById('new-q-opt-2').value.trim();
  const opt3 = document.getElementById('new-q-opt-3').value.trim();
  const explain = document.getElementById('new-q-explain').value.trim();
  const motivation = document.getElementById('new-q-motivation').value.trim();
  
  const selectedRadio = document.querySelector('input[name="new-q-correct"]:checked');
  const correctIdx = selectedRadio ? parseInt(selectedRadio.value, 10) : 0;
  const options = [opt0, opt1, opt2, opt3];
  const correct = options[correctIdx] || opt0;

  if (!qText || options.some(opt => !opt)) {
    alert('يرجى ملء جميع الحقول والخيارات الأربعة!');
    return;
  }

  const newQuestion = {
    id: `custom-q-${Date.now()}`,
    organKey,
    q: qText,
    options,
    correct,
    explain: explain || 'أحسنتِ! فهم علمي سليم.',
    motivationSuccess: motivation || '🌟 رائعة ومتميزة! إجابة ذكية!',
    motivationRetry: '💡 محاولة ممتازة! فكري مجدداً وجربي.',
    isCustom: true
  };

  saveCustomQuestionToStorage(newQuestion);
  sounds.playVictory();
  document.getElementById('add-question-modal').classList.remove('show');
  alert('تمت إضافة السؤال الجديد بنجاح إلى المحاكي وبنك الأسئلة!');

  renderOrganQuestions();
  renderQuizQuestion();
  updateProgressTracker();
};

window.deleteCustomQuestion = function(qId) {
  if (confirm('هل أنتِ متأكدة من رغبتكِ في حذف هذا السؤال المضاف؟')) {
    deleteCustomQuestionFromStorage(qId);
    sounds.playCorrect();
    renderOrganQuestions();
    renderQuizQuestion();
    updateProgressTracker();
  }
};

window.resetOrganCustomQuestions = function(organKey) {
  if (confirm(`هل ترغبين حقاً في استعادة الأسئلة الافتراضية فقط لعضو ${organsSimulatorData[organKey].name}؟`)) {
    resetOrganCustomQuestionsInStorage(organKey);
    sounds.playCorrect();
    renderOrganQuestions();
    renderQuizQuestion();
    updateProgressTracker();
    alert('تمت استعادة الأسئلة الافتراضية الأصلية.');
  }
};

// ==========================================
// CENTRAL ALL YOUTUBE LINKS MANAGER MODAL
// ==========================================
let activeAllYtOrgan = 'heart';

function setupAllYouTubeModal() {
  const modal = document.getElementById('all-youtube-modal');
  const closeBtn = document.getElementById('close-all-yt-modal-btn');
  const openBtn = document.getElementById('open-youtube-manager-btn');

  if (openBtn) {
    openBtn.addEventListener('click', () => openAllYoutubeModal());
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  }
}

window.openAllYoutubeModal = function() {
  const modal = document.getElementById('all-youtube-modal');
  if (!modal) return;
  activeAllYtOrgan = state.currentOrgan || 'heart';
  renderAllYouTubeTabs();
  renderAllYouTubeList(activeAllYtOrgan);
  modal.classList.add('show');
};

function renderAllYouTubeTabs() {
  const tabsWrap = document.getElementById('all-yt-tabs');
  if (!tabsWrap) return;
  tabsWrap.innerHTML = '';

  Object.keys(organsSimulatorData).forEach(key => {
    const organ = organsSimulatorData[key];
    const btn = document.createElement('button');
    btn.className = `all-yt-tab-btn ${key === activeAllYtOrgan ? 'active' : ''}`;
    btn.innerHTML = `<span>${organ.name}</span>`;
    btn.onclick = () => {
      activeAllYtOrgan = key;
      renderAllYouTubeTabs();
      renderAllYouTubeList(key);
    };
    tabsWrap.appendChild(btn);
  });
}

function renderAllYouTubeList(organKey) {
  const listWrap = document.getElementById('all-yt-parts-list');
  const organ = organsSimulatorData[organKey];
  if (!listWrap || !organ) return;

  listWrap.innerHTML = '';
  organ.parts.forEach(part => {
    const currentUrl = getPartYouTubeUrl(organKey, part.id);
    const row = document.createElement('div');
    row.className = 'all-yt-part-row';
    row.innerHTML = `
      <div class="all-yt-part-header">
        <span class="all-yt-part-title">${part.name} (${part.enName})</span>
        <a href="${currentUrl}" target="_blank" rel="noopener noreferrer" style="font-size:0.8rem;color:#0284c7;font-weight:700;text-decoration:none;">فتح في يوتيوب ↗</a>
      </div>
      <input type="text" id="manager-yt-${part.id}" value="${currentUrl}" placeholder="https://www.youtube.com/watch?v=...">
    `;
    listWrap.appendChild(row);
  });
}

window.saveAllYoutubeLinksFromManager = function() {
  const organ = organsSimulatorData[activeAllYtOrgan];
  if (!organ) return;

  organ.parts.forEach(part => {
    const input = document.getElementById(`manager-yt-${part.id}`);
    if (input) {
      setPartYouTubeUrl(part.id, input.value.trim());
    }
  });

  sounds.playVictory();
  alert(`تم حفظ وتحديث روابط يوتيوب لأجزاء ${organ.name} بنجاح!`);
  renderOrganViewer();
};

window.resetAllYoutubeLinksToDefault = function() {
  if (confirm('هل ترغبين في استعادة جميع روابط يوتيوب الافتراضية لكافة الأعضاء؟')) {
    resetAllYouTubeUrls();
    sounds.playCorrect();
    renderAllYouTubeList(activeAllYtOrgan);
    renderOrganViewer();
    alert('تمت استعادة جميع الروابط الافتراضية.');
  }
};

// ==========================================
// COMPREHENSIVE QUIZ BANK LOGIC
// ==========================================
// ==========================================
// QUIZ ENGINE WITH QUESTION NAVIGATOR & DUAL VIEWS
// ==========================================
let quizDisplayMode = 'single'; // 'single' or 'all'

window.setQuizDisplayMode = function(mode) {
  quizDisplayMode = mode;
  const singleBtn = document.getElementById('quiz-mode-single-btn');
  const allBtn = document.getElementById('quiz-mode-all-btn');
  const singleView = document.getElementById('quiz-active-view');
  const allView = document.getElementById('quiz-all-questions-view');

  if (singleBtn) singleBtn.classList.toggle('active', mode === 'single');
  if (allBtn) allBtn.classList.toggle('active', mode === 'all');

  if (mode === 'single') {
    if (singleView) singleView.style.display = 'block';
    if (allView) allView.style.display = 'none';
    renderQuizQuestion();
  } else {
    if (singleView) singleView.style.display = 'none';
    if (allView) allView.style.display = 'block';
    renderAllQuizQuestions();
  }
};

window.jumpToQuizQuestion = function(idx) {
  const allQ = getAllQuestions();
  if (idx >= 0 && idx < allQ.length) {
    state.quizCurrentIndex = idx;
    setQuizDisplayMode('single');
    renderQuizQuestion();
    const activeView = document.getElementById('quiz-active-view');
    if (activeView) activeView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

window.quizNextQuestion = function() {
  const allQ = getAllQuestions();
  if (state.quizCurrentIndex < allQ.length - 1) {
    state.quizCurrentIndex++;
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
};

window.quizPrevQuestion = function() {
  if (state.quizCurrentIndex > 0) {
    state.quizCurrentIndex--;
    renderQuizQuestion();
  }
};

function setupQuiz() {
  state.quizCurrentIndex = 0;
  state.quizScore = 0;
  state.quizAnswers = {};
  renderQuizQuestion();
  renderQuizPillsBar();

  const restartBtn = document.getElementById('quiz-restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      state.quizCurrentIndex = 0;
      state.quizScore = 0;
      state.quizAnswers = {};
      const finishView = document.getElementById('quiz-finish-view');
      const activeView = document.getElementById('quiz-active-view');
      if (finishView) finishView.style.display = 'none';
      if (activeView) activeView.style.display = 'block';
      setQuizDisplayMode('single');
      renderQuizQuestion();
      renderOrganQuestions();
      updateProgressTracker();
    });
  }
}

function renderQuizPillsBar() {
  const bar = document.getElementById('quiz-question-pills-bar');
  if (!bar) return;
  const allQ = getAllQuestions();
  bar.innerHTML = '';

  const organIcons = {
    heart: '🫀', lungs: '🫁', brain: '🧠', stomach: '🥗', esophagus: '🥢', eye: '👁️'
  };

  allQ.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-pill-btn';
    if (idx === state.quizCurrentIndex && quizDisplayMode === 'single') {
      btn.classList.add('active');
    }

    const hasAnswered = state.quizAnswers[q.id] !== undefined;
    if (hasAnswered) {
      if (state.quizAnswers[q.id] === q.correct) {
        btn.classList.add('correct');
      } else {
        btn.classList.add('wrong');
      }
    }

    const icon = organIcons[q.organKey] || '❓';
    const statusMark = hasAnswered ? (state.quizAnswers[q.id] === q.correct ? '✓' : '✗') : '';
    btn.innerHTML = `<span>${icon}</span> <span>س${idx + 1}</span> <span style="font-size:0.75rem;">${statusMark}</span>`;
    btn.title = `${q.organName}: س${idx + 1}`;
    btn.onclick = () => jumpToQuizQuestion(idx);
    bar.appendChild(btn);
  });
}

function renderQuizQuestion() {
  const allQ = getAllQuestions();
  if (allQ.length === 0) return;

  if (state.quizCurrentIndex >= allQ.length) {
    state.quizCurrentIndex = allQ.length - 1;
  }

  renderQuizPillsBar();

  const q = allQ[state.quizCurrentIndex];
  const qNumElem = document.getElementById('quiz-q-num');
  const scoreElem = document.getElementById('quiz-score-val');
  const titleElem = document.getElementById('quiz-question-title');
  const optionsContainer = document.getElementById('quiz-options-container');
  const feedbackBox = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('quiz-next-btn');

  if (qNumElem) qNumElem.textContent = `سؤال ${state.quizCurrentIndex + 1} من ${allQ.length}`;
  if (scoreElem) scoreElem.textContent = `${state.quizScore} / ${allQ.length}`;
  if (titleElem) {
    titleElem.innerHTML = `
      <span style="display:inline-block;background:#e0f2fe;color:#0369a1;font-size:0.85rem;padding:3px 12px;border-radius:20px;margin-bottom:8px;font-weight:800;">${q.organName}</span>
      <div>${q.q}</div>
    `;
  }

  if (optionsContainer) {
    optionsContainer.innerHTML = '';
    const hasAnswered = state.quizAnswers[q.id] !== undefined;
    const chosenAnswer = state.quizAnswers[q.id];

    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      if (hasAnswered) {
        btn.disabled = true;
        if (opt === q.correct) {
          btn.classList.add('correct');
        } else if (opt === chosenAnswer) {
          btn.classList.add('wrong');
        }
      }
      btn.innerHTML = `<span>${opt}</span>`;
      btn.addEventListener('click', () => selectQuizOption(q.id, opt));
      optionsContainer.appendChild(btn);
    });
  }

  if (feedbackBox) {
    const hasAnswered = state.quizAnswers[q.id] !== undefined;
    if (hasAnswered) {
      const isCorrect = state.quizAnswers[q.id] === q.correct;
      feedbackBox.className = `quiz-feedback-box ${isCorrect ? 'correct' : 'wrong'}`;
      feedbackBox.innerHTML = `
        <div style="font-weight:900;margin-bottom:4px;font-size:1.02rem;">${isCorrect ? '✓ ' + (q.motivationSuccess || 'إجابة صحيحة ومتميزة!') : '✗ ' + (q.motivationRetry || 'إجابة غير دقيقة!')}</div>
        <div style="font-size:0.95rem;line-height:1.65;">${q.explain}</div>
      `;
      feedbackBox.style.display = 'block';
    } else {
      feedbackBox.style.display = 'none';
    }
  }

  if (nextBtn) {
    nextBtn.textContent = state.quizCurrentIndex === allQ.length - 1 ? 'إنهاء الاختبار وعرض النتيجة 🏁' : 'السؤال التالي ←';
  }
}

function renderAllQuizQuestions() {
  const container = document.getElementById('quiz-all-questions-list');
  if (!container) return;
  const allQ = getAllQuestions();
  container.innerHTML = '';

  const organIcons = {
    heart: '🫀', lungs: '🫁', brain: '🧠', stomach: '🥗', esophagus: '🥢', eye: '👁️'
  };

  allQ.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'all-q-card';

    const hasAnswered = state.quizAnswers[q.id] !== undefined;
    const chosenAnswer = state.quizAnswers[q.id];
    const isCorrect = chosenAnswer === q.correct;

    let optionsHtml = '';
    q.options.forEach(opt => {
      let optClass = 'quiz-option-btn';
      if (hasAnswered) {
        if (opt === q.correct) optClass += ' correct';
        else if (opt === chosenAnswer) optClass += ' wrong';
      }
      optionsHtml += `
        <button class="${optClass}" ${hasAnswered ? 'disabled' : ''} onclick="selectQuizOption('${q.id}', '${opt.replace(/'/g, "'")}')">
          <span>${opt}</span>
        </button>
      `;
    });

    let feedbackHtml = '';
    if (hasAnswered) {
      feedbackHtml = `
        <div class="quiz-feedback-box ${isCorrect ? 'correct' : 'wrong'}" style="display:block;margin-top:12px;">
          <div style="font-weight:900;margin-bottom:4px;">${isCorrect ? '✓ ' + (q.motivationSuccess || 'ممتازة!') : '✗ ' + (q.motivationRetry || 'حاولي ثانية!')}</div>
          <div style="font-size:0.92rem;line-height:1.6;">${q.explain}</div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="all-q-card-header">
        <span class="all-q-badge">${organIcons[q.organKey] || ''} ${q.organName} (سؤال ${idx + 1} من ${allQ.length})</span>
        <button class="btn-subtle-pill" onclick="jumpToQuizQuestion(${idx})">🎯 الانتقال لهذا السؤال</button>
      </div>
      <h4 class="all-q-text">${q.q}</h4>
      <div class="options-grid">${optionsHtml}</div>
      ${feedbackHtml}
    `;
    container.appendChild(card);
  });
}

function selectQuizOption(qId, selected) {
  const allQ = getAllQuestions();
  const q = allQ.find(item => item.id === qId);
  if (!q) return;

  state.quizAnswers[qId] = selected;
  const isCorrect = selected === q.correct;

  if (isCorrect) {
    sounds.playCorrect();
    triggerHaptic(40);
  } else {
    sounds.playWrong();
    triggerHaptic([50, 40, 50]);
  }

  // Recalculate score
  let score = 0;
  allQ.forEach(item => {
    if (state.quizAnswers[item.id] === item.correct) score++;
  });
  state.quizScore = score;

  if (quizDisplayMode === 'all') {
    renderAllQuizQuestions();
  } else {
    renderQuizQuestion();
  }
  renderQuizPillsBar();
  renderOrganQuestions();
  updateProgressTracker();
}

function finishQuiz() {
  const allQ = getAllQuestions();
  const activeView = document.getElementById('quiz-active-view');
  const finishView = document.getElementById('quiz-finish-view');
  const finalScoreElem = document.getElementById('quiz-final-score');
  const finalMsgElem = document.getElementById('quiz-final-message');

  if (activeView) activeView.style.display = 'none';
  if (finishView) finishView.style.display = 'block';

  if (finalScoreElem) finalScoreElem.textContent = `${state.quizScore} / ${allQ.length}`;

  const pct = allQ.length > 0 ? (state.quizScore / allQ.length) * 100 : 0;
  let msg = '';
  if (pct >= 85) {
    msg = 'أداء استثنائي رائع وفهم طبي باهر! تستحقين وسام الطبيبة الباحثة وشهادة التكريم الذهبية بكل جدارة! 🌟🎉';
    sounds.playVictory();
  } else if (pct >= 60) {
    msg = 'عمل ممتاز ومجهود رائع! لقد استوعبتِ معظم وظائف الأعضاء، ويمكنكِ مراجعة الأسئلة لتصلي للدرجة الكاملة! 👏';
    sounds.playCorrect();
  } else {
    msg = 'محاولة جيدة وبداية موفقة في استكشاف أسرار الجسم! ننصحكِ بإعادة استكشاف المحاكيات والضغط على الأجزاء لتعزيز معلوماتكِ! 💪';
    sounds.playCorrect();
  }

  if (finalMsgElem) finalMsgElem.textContent = msg;
  updateProgressTracker();
}

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
        <h2 style="color:#0369a1;border-bottom:2px solid #e2e8f0;padding-bottom:12px;margin-bottom:16px;">ملف الإنجاز المبتدئ | أعضاء الجسم</h2>
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
        <h2 style="color:#1d4ed8;border-bottom:2px solid #e2e8f0;padding-bottom:12px;margin-bottom:16px;">ملف الإنجاز المطوّر | أعضاء الجسم</h2>
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
