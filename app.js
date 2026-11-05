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

  playBrainPulse() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
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
        defaultYt: 'https://www.youtube.com/watch?v=Mrxkz5KQl40',
        ytTitle: 'ما هو تمدد الشريان الأورطي؟ | دكتور اسامة عباس'
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
        defaultYt: 'https://www.youtube.com/watch?v=VaKQFL9G7lE',
        ytTitle: 'الوريد الأجوف العلوي والسفلي - طب في ثوان - غسيل مخ'
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
        defaultYt: 'https://www.youtube.com/watch?v=tBwqRBPbK1I',
        ytTitle: '2- القلب و الدورة الدموية'
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
        defaultYt: 'https://www.youtube.com/watch?v=LmtYTNhrZCA',
        ytTitle: 'ما هو الاذين الأيمن و علاقته بغرف القلب الاخرى و الاوعية الدموية الكبرى؟ ما دوره في الدورة الدموية ؟'
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
        defaultYt: 'https://www.youtube.com/watch?v=wriBWma6tUk',
        ytTitle: 'ما هو البطين الأيمن و علاقته بغرف القلب الاخرى و الاوعية الدموية الكبرى؟ ما دوره في الدورة الدموية ؟'
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
        defaultYt: 'https://www.youtube.com/watch?v=wTNaXw57CNc',
        ytTitle: 'ما هو الاذين الأيسر و علاقته بغرف القلب الاخرى و الاوعية الدموية الكبرى؟ ما دوره في الدورة الدموية ؟'
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
        defaultYt: 'https://www.youtube.com/watch?v=Qcx3ERhvj-I',
        ytTitle: 'الشرايين التاجيه (شرايين القلب) | coronary arteries'
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
        defaultYt: 'https://www.youtube.com/watch?v=C9AkgiXprgU',
        ytTitle: 'ما هو البطين الأيسر و علاقته بغرف القلب الاخرى و الاوعية الدموية الكبرى؟ ما دوره في الدورة الدموية ؟'
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
        defaultYt: 'https://www.youtube.com/watch?v=MYx_0R-i4w4',
        ytTitle: 'الشرايين التاجيه | تشريح شرايين القلب الشرايين المغذية للقلب | Anatomy of the coronary arteries'
      }
    ],
    defaultQuestions: [
      {
        id: 'q-heart-1',
        q: 'ما الدور الحيوي الرئيسي للشريان الأورطي (الأبهر) المتصل بالبطين الأيسر؟',
        options: [
          'تنقية الهواء واستخلاص الأكسجين داخل التجويف الصدري',
          'استقبال الدم غير المؤكسج القادم من الرأس والذراعين',
          'توزيع الدم المؤكسج عالي الضغط إلى كافة خلايا وأعضاء الجسم',
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
          'لأنه يستقبل الدم من الرئتين فقط دون أن يضخه',
          'لأنه يحتاج لتوليد ضغط هائل لضخ الدم لمسافات طويلة لكامل الجسم',
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
        defaultYt: 'https://www.youtube.com/watch?v=Vptccx4TrF8',
        ytTitle: 'حالات منظار القصبات الهوائية ...د. حاتم علي إستشاري الأمراض الصدرية'
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
        defaultYt: 'https://www.youtube.com/watch?v=Sb6DXhKpZqo',
        ytTitle: 'أعراض أمراض الرئتين'
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
        defaultYt: 'https://www.youtube.com/watch?v=eP355IHjbBU',
        ytTitle: 'عملية التنفس و الرئتين في الانسان'
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
        defaultYt: 'https://www.youtube.com/watch?v=Ha_9l6heORQ',
        ytTitle: 'تبادل الغازات (التنفس الخارجي) - علم الاحياء'
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
        defaultYt: 'https://www.youtube.com/watch?v=e6Vb0-xKXL8',
        ytTitle: 'فتق الحجاب الحاجز.. الاعراض.. الأسباب... والعلاج #فتق-الحجاب-الحاجز #ارتجاع_المريء #حموضة_المعدة'
      }
    ],
    defaultQuestions: [
      {
        id: 'q-lungs-1',
        q: 'في أي جزء مجهري داخل الرئتين يحدث التبادل الفعلي لغازي الأكسجين وثاني أكسيد الكربون مع مجرى الدم؟',
        options: [
          'عضلة الحجاب الحاجز السفلية',
          'القصبة الهوائية العلوية فقط',
          'غضاريف الحنجرة والأحبال الصوتية',
          'الحويصلات الهوائية (Alveoli) المحاطة بالشعيرات الدموية'
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
        defaultYt: 'https://www.youtube.com/watch?v=ys26pWp8Y04',
        ytTitle: 'أجزاء الدماغ و وظيفة كل جزء'
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
        defaultYt: 'https://www.youtube.com/watch?v=MB0-YkJGTVw',
        ytTitle: 'مواقع أورام الدماغ | أمراض الفص الجداري | د أحمد الشريف #40'
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
        defaultYt: 'https://www.youtube.com/watch?v=esPAlfi9cYY',
        ytTitle: 'مواقع أورام الدماغ | أمراض الفص الخلفي | د أحمد الشريف #43'
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
        defaultYt: 'https://www.youtube.com/watch?v=YiNdKd4mEuk',
        ytTitle: 'رحلة الى الدماغ مع الدكتور عاصم '
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
        defaultYt: 'https://www.youtube.com/watch?v=Nbp-xWiWMQo',
        ytTitle: 'ما هو المخيخ ! و ما هي وظائفه في الجسم ؟'
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
        defaultYt: 'https://www.youtube.com/watch?v=L98OTGLUk8w',
        ytTitle: 'الجهاز العصبي: جذع الدماغ'
      }
    ],
    defaultQuestions: [
      {
        id: 'q-brain-1',
        q: 'ما هو الجزء في الدماغ المسؤول عن حفظ توازن الجسم وتناسق حركة العضلات أثناء المشي والجري والكتابة؟',
        options: [
          'الفص القفوي البصري فقط',
          'المخيخ (Cerebellum) الواقع أسفل الدماغ من الخلف',
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
          'جذع الدماغ السفلي',
          'الفص الجبهي الأمامي',
          'الفص الصدغي الجانبي',
          'الفص القفوي (Occipital Lobe) في مؤخرة الرأس'
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
        defaultYt: 'https://www.youtube.com/watch?v=Fciiee6ajyU',
        ytTitle: 'ما هي المعدة - علم الاحياء'
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
        defaultYt: 'https://www.youtube.com/watch?v=VuT68L7qLaQ',
        ytTitle: 'المختصر المفيد|| ما هي أقسام المعده ؟'
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
        defaultYt: 'https://www.youtube.com/watch?v=dPISiKA5z1Q',
        ytTitle: 'أعضاء الجهاز الهضمي المختلفة - الأطباء السبعة - الموسم 9'
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
        defaultYt: 'https://www.youtube.com/watch?v=mlmdrLN1Sf8',
        ytTitle: 'التهاب جدار المعدة'
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
        defaultYt: 'https://www.youtube.com/watch?v=8aBq2Dyjjy8',
        ytTitle: 'عمليات علاج ارتجاع المريء بمنظار الجهاز الهضمي باستخدام تقنية GERDX'
      }
    ],
    defaultQuestions: [
      {
        id: 'q-stomach-1',
        q: 'كيف تحمي المعدة جدارها الداخلي الحساس من التآكل بفعل حمض الهيدروكلوريك القوي والعصارات الهاضمة؟',
        options: [
          'بامتصاص كل الأحماض عبر مسامات الجلد الخارجية',
          'بتبريد درجة حرارة الطعام بشكل فوري',
          'بإفراز غشاء مخاطي سميك وغني بالبيكربونات يتجدد باستمرار',
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
        defaultYt: 'https://www.youtube.com/watch?v=_JNOPKTZ-N0',
        ytTitle: 'عملية بلع الطعام - علم الاحياء'
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
        defaultYt: 'https://www.youtube.com/watch?v=zWZHusUgmXw',
        ytTitle: 'الحركة الدودية في الأمعاء - الصف الثاني الثانوي'
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
        defaultYt: 'https://www.youtube.com/watch?v=4Ru9nYH6t4s',
        ytTitle: 'أعراض إرتجاع المريء وأسباب الإصابة بالمرض'
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
        defaultYt: 'https://www.youtube.com/watch?v=1BGv2_httQg',
        ytTitle: '🍎 رحلة الطعام داخل جسم الإنسان!| الهضم عند الإنسان بطريقة ممتعة |علوم السنة الرابعة والخامسة ابتدائي'
      }
    ],
    defaultQuestions: [
      {
        id: 'q-esophagus-1',
        q: 'ما القوة الأساسية التي تدفع اللقمة الغذائية نزولاً عبر أنبوب المريء إلى المعدة حتى ولو كان الإنسان مستلقياً؟',
        options: [
          'الجاذبية الأرضية وحدها فقط',
          'الحركة الدودية (Peristalsis) وهي انقباضات عضلية متموجة لاإرادية',
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
          'يساعد على خروج الهواء أثناء التحدث والنطق',
          'يعمل على تذوق الطعام وتقدير حلاوته',
          'ينغلق بإحكام ليمنع ارتداد أحماض المعدة ومحتوياتها الحارقة إلى المريء',
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
        defaultYt: 'https://www.youtube.com/watch?v=k4aUCeSTRzY',
        ytTitle: 'كيف تعمل العين؟ شرح مبسط لأجزاء العين وآلية الرؤية'
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
        defaultYt: 'https://www.youtube.com/watch?v=AWBCu1xJnG8',
        ytTitle: 'الحقائق المخفية وراء لون العين 🔵🟢🟤🟠'
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
        defaultYt: 'https://www.youtube.com/watch?v=Ke2S0YthIc0',
        ytTitle: 'ما هي قرنية العين'
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
        defaultYt: 'https://www.youtube.com/watch?v=AECcBborKp0',
        ytTitle: 'مقطع يوضح أجزاء العين بشكل مبسط .   د. حافظ الفالح'
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
        defaultYt: 'https://www.youtube.com/watch?v=n4xwLDs8yqA',
        ytTitle: 'ما دور شبكية العين في عملية الإبصار وهل يمكن تعويضها؟ | د. خالد الغنيمي | برنامج لابأس'
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
          'حماية بياض العين من الأتربة والأجسام الغريبة',
          'إفراز الدموع لترطيب وتطهير سطح العين',
          'تركيز أشعة الضوء على قرنية العين الخارجية',
          'نقل النبضات العصبية الكهروضوئية المتكونة على الشبكية مباشرة إلى الدماغ لتفسيرها'
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
// YOUTUBE VIDEO MANAGER HELPERS & ENGINE
// ==========================================
function extractYouTubeVideoId(url) {
  if (!url) return '';
  url = String(url).trim();

  // If user pasted an iframe embed code: extract src
  const iframeSrcMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch) {
    url = iframeSrcMatch[1];
  }

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Match all YouTube URL patterns (watch, embed, shorts, live, youtu.be, etc.)
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?(?:.*&)?v=))([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/user\/[^/]+\/([a-zA-Z0-9_-]{11})/i
  ];

  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }

  return '';
}

function buildYouTubeIframeHtml(embedUrl, title = 'فيديو تعليمي') {
  return `<div class="video-responsive-wrap" style="position:relative;">
    <iframe 
      src="${embedUrl}" 
      title="${title}" 
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
      referrerpolicy="strict-origin-when-cross-origin" 
      allowfullscreen>
    </iframe>
  </div>`;
}

function formatYouTubeEmbedUrl(url) {
  if (!url) return '';
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    const isFileProto = (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:');
    if (isFileProto) {
      return `player.html?v=${videoId}`;
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
  }
  return String(url).trim();
}

// ==========================================
// 🛡️ نظام الحفظ الدائم التلقائي على القرص الصلب (Auto-Sync To Disk)
// ==========================================
async function autoSaveToDisk() {
  const customYt = getCustomYouTubeLinks();
  const customQ = (typeof getCustomQuestions === 'function') ? getCustomQuestions() : [];
  const deletedQ = (typeof getDeletedQuestionIds === 'function') ? getDeletedQuestionIds() : [];

  const payload = {
    version: Date.now(),
    customYoutube: customYt,
    customQuestions: customQ,
    deletedQuestionIds: deletedQ
  };

  try {
    const res = await fetch('/api/save_content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      console.log('✅ تم حفظ وتثبيت التعديلات نهائياً على القرص في ملف content.js');
      showPermanentSaveToast();
    }
  } catch (e) {
    // يعمل دون سيرفر كملف محلي، تم الحفظ مسبقاً في IndexedDB و localStorage
  }
}

function showPermanentSaveToast() {
  let toast = document.getElementById('permanent-save-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'permanent-save-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:24px;background:#065f46;color:#ffffff;padding:12px 20px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.25);z-index:999999;font-weight:800;font-size:0.95rem;display:flex;align-items:center;gap:10px;border:1.5px solid #34d399;transition:all 0.3s;';
    document.body.appendChild(toast);
  }
  toast.innerHTML = '<span>💾</span> <span>تم تثبيت وحفظ التعديلات نهائياً في ملف content.js على القرص!</span>';
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
  }, 4000);
}

// المحتوى المنشور للجميع (ملف content.js المرفوع مع الموقع)
function getPublishedContent() {
  const p = (typeof window !== 'undefined' && window.PUBLISHED_CONTENT) || {};
  return {
    customYoutube: (p.customYoutube && typeof p.customYoutube === 'object') ? p.customYoutube : {},
    customQuestions: Array.isArray(p.customQuestions) ? p.customQuestions : [],
    deletedQuestionIds: Array.isArray(p.deletedQuestionIds) ? p.deletedQuestionIds : []
  };
}

// تعديلات هذا المتصفح فقط (مع تحديث تلقائي لنسخة الفيديوهات التعليمية المعتمدة)
const YT_CURATED_SCHEMA_VERSION = '20261106_v17';
(function migrateCuratedYouTubeLinksOnce() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('yt_curated_schema_ver') !== YT_CURATED_SCHEMA_VERSION) {
      localStorage.removeItem('custom_organ_youtube_links');
      localStorage.setItem('yt_curated_schema_ver', YT_CURATED_SCHEMA_VERSION);
    }
  } catch (e) {}
})();

function getLocalYouTubeLinks() {
  try {
    const saved = localStorage.getItem('custom_organ_youtube_links');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return {};
}

// الروابط الفعلية = المنشورة للجميع + تعديلات هذا المتصفح (الأحدث يغلب)
function getCustomYouTubeLinks() {
  return { ...getPublishedContent().customYoutube, ...getLocalYouTubeLinks() };
}

function getPartYouTubeUrl(organKeyOrPartId, maybePartId) {
  let organKey = organKeyOrPartId;
  let partId = maybePartId;

  // Flexible argument handling: getPartYouTubeUrl('heart-aorta') or getPartYouTubeUrl('heart', 'heart-aorta')
  if (!partId) {
    partId = organKeyOrPartId;
    organKey = null;
  } else if (!organsSimulatorData[organKeyOrPartId]) {
    // If first argument is partId (e.g. from admin table call)
    partId = organKeyOrPartId;
  }

  const custom = getCustomYouTubeLinks();
  if (partId && custom[partId]) {
    return custom[partId];
  }

  // Look in specific organ if valid
  if (organKey && organsSimulatorData[organKey] && organsSimulatorData[organKey].parts) {
    const part = organsSimulatorData[organKey].parts.find(p => p.id === partId);
    if (part && part.defaultYt) return part.defaultYt;
  }

  // Look across all organs
  if (partId) {
    for (const key of Object.keys(organsSimulatorData)) {
      const organ = organsSimulatorData[key];
      if (organ && organ.parts) {
        const part = organ.parts.find(p => p.id === partId);
        if (part && part.defaultYt) return part.defaultYt;
      }
    }
  }

  return '';
}

function syncPartYouTubeAcrossUI(partId, newUrl) {
  const effectiveUrl = getPartYouTubeUrl(partId);
  const embedUrl = formatYouTubeEmbedUrl(effectiveUrl);

  // 1. Admin table input
  const adminInput = document.getElementById(`admin-yt-input-${partId}`);
  if (adminInput && adminInput.value !== effectiveUrl) {
    adminInput.value = effectiveUrl;
  }

  // 2. Manager modal input and link
  const managerInput = document.getElementById(`manager-yt-${partId}`);
  if (managerInput && managerInput.value !== effectiveUrl) {
    managerInput.value = effectiveUrl;
  }
  const managerLink = document.getElementById(`manager-yt-link-${partId}`);
  if (managerLink) {
    managerLink.href = effectiveUrl;
  }

  // 3. Detail modal if open for this part
  if (typeof state !== 'undefined' && state.activePartModal && state.activePartModal.partId === partId) {
    const modalInput = document.getElementById('part-yt-input');
    if (modalInput && modalInput.value !== effectiveUrl) {
      modalInput.value = effectiveUrl;
    }
    const modalWrap = document.getElementById('part-yt-player-wrap');
    if (modalWrap && modalWrap.innerHTML) {
      modalWrap.innerHTML = `${buildYouTubeIframeHtml(embedUrl)}`;
    }
  }

  // 4. Active part in Explorer view
  if (typeof state !== 'undefined' && state.selectedPartId === partId) {
    const activeInput = document.getElementById('active-part-yt-input');
    if (activeInput && activeInput.value !== effectiveUrl) {
      activeInput.value = effectiveUrl;
    }
    const activePlayer = document.getElementById('active-part-yt-player');
    if (activePlayer && activePlayer.style.display !== 'none') {
      activePlayer.innerHTML = `${buildYouTubeIframeHtml(embedUrl)}`;
    }
  }

  // 5. Toast if open for this part
  const toastInput = document.getElementById('v-func-yt-input');
  if (toastInput) {
    toastInput.value = effectiveUrl;
  }
  const toastPlayer = document.getElementById('v-func-yt-player-box');
  if (toastPlayer && toastPlayer.style.display !== 'none') {
    toastPlayer.innerHTML = `${buildYouTubeIframeHtml(embedUrl)}`;
  }
}

function setPartYouTubeUrl(partId, url) {
  const custom = getLocalYouTubeLinks();
  if (url && url.trim()) {
    custom[partId] = url.trim();
  } else {
    delete custom[partId];
  }
  try {
    localStorage.setItem('custom_organ_youtube_links', JSON.stringify(custom));
    if (typeof idbSave === 'function') idbSave('custom_organ_youtube_links', custom);
    if (typeof autoSaveToDisk === 'function') autoSaveToDisk();
  } catch (e) {
    console.error(e);
  }
  syncPartYouTubeAcrossUI(partId, url);
}

// Global aliases to ensure no ReferenceError anywhere
window.setPartYouTubeUrl = setPartYouTubeUrl;
window.savePartYouTubeUrl = setPartYouTubeUrl;

function resetPartYouTubeUrl(partId) {
  const custom = getLocalYouTubeLinks();
  delete custom[partId];
  try {
    localStorage.setItem('custom_organ_youtube_links', JSON.stringify(custom));
    if (typeof idbSave === 'function') idbSave('custom_organ_youtube_links', custom);
    if (typeof autoSaveToDisk === 'function') autoSaveToDisk();
  } catch (e) {
    console.error(e);
  }
  syncPartYouTubeAcrossUI(partId, '');
}

function resetAllYouTubeUrls() {
  try {
    localStorage.removeItem('custom_organ_youtube_links');
  } catch (e) {
    console.error(e);
  }
  if (typeof renderOrganViewer === 'function') renderOrganViewer();
}

// ==========================================
// PERSISTENT EXPLORED ORGANS HELPERS
// ==========================================
function loadExploredOrgans() {
  try {
    const saved = localStorage.getItem('explored_organs');
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        state.exploredOrgans = new Set(arr);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function saveExploredOrgans() {
  try {
    localStorage.setItem('explored_organs', JSON.stringify([...state.exploredOrgans]));
  } catch (e) {
    console.error(e);
  }
}

// ==========================================
// CUSTOM QUESTIONS MANAGER HELPERS & NORMALIZER
// ==========================================
// أسئلة هذا المتصفح فقط
function getLocalCustomQuestions() {
  try {
    const saved = localStorage.getItem('custom_organ_questions');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return [];
}

// الأسئلة الفعلية = المنشورة للجميع + أسئلة/تعديلات هذا المتصفح (بنفس المعرّف يغلب المحلي) دون المحذوفة
function getCustomQuestions() {
  const byId = new Map();
  const noId = [];
  [...getPublishedContent().customQuestions, ...getLocalCustomQuestions()].forEach(q => {
    if (q && q.id) byId.set(q.id, q); else if (q) noId.push(q);
  });
  const deleted = getDeletedDefaultQuestions();
  return [...byId.values(), ...noId].filter(q => !q.id || !deleted.includes(q.id));
}

function saveCustomQuestionToStorage(qData) {
  const questions = getLocalCustomQuestions();
  const existingIdx = questions.findIndex(q => q.id === qData.id);
  if (existingIdx !== -1) {
    questions[existingIdx] = qData;
  } else {
    questions.push(qData);
  }
  try {
    localStorage.setItem('custom_organ_questions', JSON.stringify(questions));
    if (typeof idbSave === 'function') idbSave('custom_organ_questions', questions);
    if (typeof autoSaveToDisk === 'function') autoSaveToDisk();
  } catch (e) {
    console.error(e);
  }
}

function deleteCustomQuestionFromStorage(qId) {
  let questions = getLocalCustomQuestions();
  questions = questions.filter(q => q.id !== qId);
  try {
    localStorage.setItem('custom_organ_questions', JSON.stringify(questions));
    if (typeof idbSave === 'function') idbSave('custom_organ_questions', questions);
    if (typeof autoSaveToDisk === 'function') autoSaveToDisk();
  } catch (e) {
    console.error(e);
  }
  // إن كان السؤال منشوراً للجميع نسجّل حذفه محلياً كي لا يعود
  if (getPublishedContent().customQuestions.some(q => q && q.id === qId)) {
    const deleted = getLocalDeletedQuestions();
    if (!deleted.includes(qId)) {
      deleted.push(qId);
      setDeletedDefaultQuestions(deleted);
    }
  }
}

function getLocalDeletedQuestions() {
  try {
    const saved = localStorage.getItem('deleted_default_questions');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return [];
}

// المعرّفات المحذوفة = المنشورة للجميع + محذوفات هذا المتصفح
function getDeletedDefaultQuestions() {
  return [...new Set([...getPublishedContent().deletedQuestionIds, ...getLocalDeletedQuestions()])];
}

function setDeletedDefaultQuestions(list) {
  try {
    localStorage.setItem('deleted_default_questions', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}

function resetOrganCustomQuestionsInStorage(organKey) {
  let questions = getLocalCustomQuestions();
  questions = questions.filter(q => q.organKey !== organKey);
  try {
    localStorage.setItem('custom_organ_questions', JSON.stringify(questions));
    if (typeof idbSave === 'function') idbSave('custom_organ_questions', questions);
    if (typeof autoSaveToDisk === 'function') autoSaveToDisk();
  } catch (e) {
    console.error(e);
  }
  // Also un-delete defaults for this organ
  const organ = organsSimulatorData[organKey];
  if (organ && organ.defaultQuestions) {
    const defIds = organ.defaultQuestions.map((d, i) => d.id || `default_${organKey}_${i}`);
    let deleted = getLocalDeletedQuestions();
    deleted = deleted.filter(id => !defIds.includes(id));
    setDeletedDefaultQuestions(deleted);
  }
}

// Normalize a question object into unified format
function normalizeQuestion(rawQ, defaultOrganKey = 'heart', isDefault = false) {
  const organKey = rawQ.organKey || defaultOrganKey;
  const organ = organsSimulatorData[organKey];
  const organName = rawQ.organName || (organ ? organ.name : organKey);
  const questionText = rawQ.q || rawQ.question || '';
  const options = Array.isArray(rawQ.options) ? [...rawQ.options] : [];

  let correctStr = '';
  let correctIdx = 0;
  if (typeof rawQ.correct === 'number') {
    correctIdx = rawQ.correct;
    correctStr = options[correctIdx] || '';
  } else if (typeof rawQ.correct === 'string') {
    correctStr = rawQ.correct;
    correctIdx = options.indexOf(correctStr);
    if (correctIdx === -1) correctIdx = 0;
  } else if (rawQ.correctIndex !== undefined) {
    correctIdx = rawQ.correctIndex;
    correctStr = options[correctIdx] || '';
  }

  const explainText = rawQ.explain || rawQ.explanation || 'أحسنتِ! فهم علمي سليم.';
  const motivationSuccessText = rawQ.motivationSuccess || rawQ.motivation || '🌟 رائعة ومتميزة! إجابة ذكية!';
  const motivationRetryText = rawQ.motivationRetry || '💡 محاولة ممتازة! فكري مجدداً وجربي.';

  return {
    ...rawQ,
    id: rawQ.id,
    organKey,
    organName,
    q: questionText,
    question: questionText,
    options,
    correct: correctStr,
    correctIndex: correctIdx,
    explain: explainText,
    explanation: explainText,
    motivationSuccess: motivationSuccessText,
    motivationRetry: motivationRetryText,
    motivation: motivationSuccessText,
    isDefault: isDefault,
    isCustom: !isDefault
  };
}

// Get all questions for an organ (default with overrides + custom, respecting deletions)
function getOrganQuestions(organKey) {
  const organ = organsSimulatorData[organKey];
  const defaults = (organ && organ.defaultQuestions) ? organ.defaultQuestions : [];
  const deletedDefaults = getDeletedDefaultQuestions();
  const customs = getCustomQuestions().filter(q => q.organKey === organKey);

  const result = [];
  const defaultIds = [];

  // 1. Process defaults: check deletions or overrides
  defaults.forEach((defQ, idx) => {
    const defId = defQ.id || `default_${organKey}_${idx}`;
    defaultIds.push(defId);
    if (deletedDefaults.includes(defId)) return;

    // Check if customized override exists
    const override = customs.find(c => c.id === defId);
    if (override) {
      result.push(normalizeQuestion(override, organKey, true));
    } else {
      result.push(normalizeQuestion({ ...defQ, id: defId }, organKey, true));
    }
  });

  // 2. Add custom added questions
  customs.forEach(c => {
    if (!defaultIds.includes(c.id)) {
      result.push(normalizeQuestion(c, organKey, false));
    }
  });

  return result;
}

// Get all questions across all 6 organs
function getAllQuestions() {
  const all = [];
  Object.keys(organsSimulatorData).forEach(key => {
    const organQuestions = getOrganQuestions(key);
    organQuestions.forEach(q => {
      all.push(q);
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
window.state = state;

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

  if (typeof sounds !== 'undefined' && typeof sounds.playBrainPulse === 'function') { try { sounds.playBrainPulse(); } catch(e){} }

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
          ytPlayer.innerHTML = `${buildYouTubeIframeHtml(embedUrl)}`;
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
          if (ytPlayer && ytPlayer.style.display !== 'none') {
            const embedUrl = formatYouTubeEmbedUrl(getPartYouTubeUrl(organKey, partId));
            ytPlayer.innerHTML = `${buildYouTubeIframeHtml(embedUrl)}`;
          }
          alert(`✅ تم حفظ وتحديث رابط فيديو يوتيوب لـ (${part.name}) بنجاح!`);
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
    playerBox.innerHTML = `${buildYouTubeIframeHtml(embedUrl)}`;
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
  const playerBox = document.getElementById('v-func-yt-player-box');
  if (playerBox && playerBox.style.display !== 'none') {
    const embedUrl = formatYouTubeEmbedUrl(getPartYouTubeUrl(partId));
    playerBox.innerHTML = `${buildYouTubeIframeHtml(embedUrl)}`;
  }
  alert(`✅ تم حفظ وتحديث رابط فيديو يوتيوب لـ (${partName}) بنجاح!`);
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

  const hash = window.location.hash.replace('#', '').replace('tab-', '');
  if (hash && document.getElementById('tab-' + hash)) {
    switchTab(hash);
  }
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
  loadExploredOrgans();
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
      saveExploredOrgans();
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
      setPartYouTubeUrl(state.activePartModal.partId, val);
      sounds.playCorrect();
      const feedback = document.getElementById('yt-save-feedback');
      if (feedback) {
        feedback.style.display = 'inline-block';
        setTimeout(() => feedback.style.display = 'none', 3000);
      }
      // Refresh player
      const playerWrap = document.getElementById('part-yt-player-wrap');
      const embedUrl = formatYouTubeEmbedUrl(getPartYouTubeUrl(state.activePartModal.organKey, state.activePartModal.partId));
      if (playerWrap) {
        playerWrap.innerHTML = `${buildYouTubeIframeHtml(embedUrl)}`;
      }
      alert('✅ تم حفظ رابط الفيديو وتحديثه بنجاح!');
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
        playerWrap.innerHTML = `${buildYouTubeIframeHtml(embedUrl)}`;
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
  if (typeof sounds !== 'undefined' && typeof sounds.playBrainPulse === 'function') { try { sounds.playBrainPulse(); } catch(e){} }

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
    playerWrap.innerHTML = buildYouTubeIframeHtml(embedUrl, part.name);
  }

  if (modal) {
    modal.style.zIndex = '99999';
    modal.classList.add('show');
  }
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
  const optionLetters = ['أ', 'ب', 'ج', 'د'];

  questions.forEach((qData, qIdx) => {
    const card = document.createElement('div');
    card.className = 'organ-q-card';

    const hasAnswered = state.quizAnswers[qData.id] !== undefined;
    const chosenAnswer = state.quizAnswers[qData.id];
    const isCorrect = chosenAnswer === qData.correct;
    if (hasAnswered && isCorrect) correctCount++;

    const optGrid = document.createElement('div');
    optGrid.className = 'options-grid';
    optGrid.style.gap = '12px';

    qData.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = `organ-opt-btn opt-theme-${optIndex % 4}`;
      const letter = optionLetters[optIndex] || (optIndex + 1);
      let statusIcon = '';
      if (hasAnswered) {
        btn.disabled = true;
        if (opt === qData.correct) {
          btn.classList.add('correct');
          statusIcon = '<span class="opt-status-icon">✓</span>';
        } else if (opt === chosenAnswer) {
          btn.classList.add('wrong');
          statusIcon = '<span class="opt-status-icon">✗</span>';
        }
      }
      btn.innerHTML = `
        <span class="opt-badge-pill">${letter}</span>
        <span class="opt-text">${opt}</span>
        ${statusIcon}
      `;
      btn.addEventListener('click', () => answerOrganQuestion(qData.id, opt));
      optGrid.appendChild(btn);
    });

    let feedbackHtml = '';
    if (hasAnswered) {
      if (isCorrect) {
        feedbackHtml = `
          <div class="quiz-feedback-box correct" style="display:block;margin-top:16px;">
            <div class="quiz-feedback-header">
              <span>🎉</span> <span>${qData.motivationSuccess || 'إجابة عبقرية ورائعة! أحسنتِ الفهم!'}</span>
            </div>
            <div class="quiz-feedback-explain">${qData.explain}</div>
          </div>
        `;
      } else {
        feedbackHtml = `
          <div class="quiz-feedback-box wrong" style="display:block;margin-top:16px;">
            <div class="quiz-feedback-header">
              <span>💡</span> <span>${qData.motivationRetry || 'محاولة جيدة! فكري في وظيفة الجزء بدقة.'}</span>
            </div>
            <div class="quiz-feedback-explain">${qData.explain}</div>
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
      <div class="organ-q-title"><span class="organ-q-num-badge">سؤال ${qIdx + 1}</span> <span>${qData.q}</span></div>
    `;
    card.appendChild(optGrid);
    if (feedbackHtml) {
      const fbDiv = document.createElement('div');
      fbDiv.innerHTML = feedbackHtml;
      card.appendChild(fbDiv.firstElementChild);
    }

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
  modal.style.zIndex = '99999';
  modal.classList.add('show');
  if (qText) setTimeout(() => qText.focus(), 80);
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
    correctIndex: correctIdx,
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
  if (typeof renderQuizPillsBar === 'function') renderQuizPillsBar();
  if (typeof renderAdminQuestions === 'function') renderAdminQuestions(adminCurrentFilter);
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

function saveCurrentTabManagerInputs() {
  const organ = organsSimulatorData[activeAllYtOrgan];
  if (!organ || !organ.parts) return;
  organ.parts.forEach(part => {
    const input = document.getElementById(`manager-yt-${part.id}`);
    if (input) {
      setPartYouTubeUrl(part.id, input.value.trim());
    }
  });
}

window.openAllYoutubeModal = function(initialOrgan = null) {
  if (sessionStorage.getItem('admin_auth') === 'true') {
    openAdminDashboard();
    switchAdminTab('youtube');
    if (initialOrgan) renderAdminYouTube(initialOrgan);
  } else {
    openAdminModal();
  }
};

window.switchAllYouTubeOrgan = function(key) {
  saveCurrentTabManagerInputs();
  activeAllYtOrgan = key;
  renderAllYouTubeTabs();
  renderAllYouTubeList(key);
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
    btn.onclick = () => switchAllYouTubeOrgan(key);
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
        <a id="manager-yt-link-${part.id}" href="${currentUrl}" target="_blank" rel="noopener noreferrer" style="font-size:0.8rem;color:#0284c7;font-weight:700;text-decoration:none;">فتح في يوتيوب ↗</a>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="text" id="manager-yt-${part.id}" value="${currentUrl}" placeholder="https://www.youtube.com/watch?v=..." style="flex:1;">
        <button class="btn-secondary" onclick="saveSingleYoutubeLinkFromManager('${part.id}', '${organKey}')" style="padding:6px 12px;font-size:0.8rem;white-space:nowrap;">
          <span>حفظ 💾</span>
        </button>
      </div>
    `;
    listWrap.appendChild(row);

    const input = row.querySelector(`#manager-yt-${part.id}`);
    if (input) {
      input.addEventListener('change', () => {
        setPartYouTubeUrl(part.id, input.value.trim());
        const link = document.getElementById(`manager-yt-link-${part.id}`);
        if (link) link.href = getPartYouTubeUrl(organKey, part.id);
      });
    }
  });
}

window.saveSingleYoutubeLinkFromManager = function(partId, organKey) {
  const input = document.getElementById(`manager-yt-${partId}`);
  if (!input) return;
  const val = input.value.trim();
  setPartYouTubeUrl(partId, val);
  sounds.playCorrect();
  const link = document.getElementById(`manager-yt-link-${partId}`);
  if (link) link.href = getPartYouTubeUrl(organKey, partId);
  alert('✅ تم حفظ رابط الفيديو لهذا الجزء بنجاح!');
};

window.saveAllYoutubeLinksFromManager = function() {
  const organ = organsSimulatorData[activeAllYtOrgan];
  if (!organ) return;

  organ.parts.forEach(part => {
    const input = document.getElementById(`manager-yt-${part.id}`);
    if (input) {
      setPartYouTubeUrl(part.id, input.value.trim());
      const link = document.getElementById(`manager-yt-link-${part.id}`);
      if (link) link.href = getPartYouTubeUrl(activeAllYtOrgan, part.id);
    }
  });

  sounds.playVictory();
  alert(`✅ تم حفظ وتحديث روابط يوتيوب لأجزاء (${organ.name}) بنجاح!`);
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


// =========================================================================
// 🏆 LEVELS PROGRESSIVE CHALLENGE SYSTEM (4 LEVELS, 40 PROGRESSIVE QUESTIONS)
// =========================================================================

const DEFAULT_LEVEL_QUIZ_STATE = {
  unlockedLevel: 1, // 1 to 4
  activeLevel: 1,
  currentQuestionIndex: 0,
  answers: {}, // { [qId]: selectedOption }
  levelScores: {}, // { [levelId]: { score, total, percent, passed, date } }
  studentName: 'الطالبة المتميزة'
};

let levelQuizState = (function loadLevelQuizState() {
  try {
    const raw = localStorage.getItem('human_body_levels_quiz_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        unlockedLevel: parsed.unlockedLevel || 1,
        activeLevel: parsed.activeLevel || 1,
        currentQuestionIndex: parsed.currentQuestionIndex || 0,
        answers: parsed.answers || {},
        levelScores: parsed.levelScores || {},
        studentName: parsed.studentName || 'الطالبة المتميزة'
      };
    }
  } catch (e) {
    console.error('Failed to parse levels quiz state:', e);
  }
  return { ...DEFAULT_LEVEL_QUIZ_STATE };
})();

function saveLevelQuizState() {
  try {
    localStorage.setItem('human_body_levels_quiz_v1', JSON.stringify(levelQuizState));
  } catch (e) {
    console.error('Failed to save levels quiz state:', e);
  }
}

function getLevelReinforcement(percent) {
  if (percent === 100) {
    return {
      badge: '👑 وسام العبقرية المطلقة والتميز الخارق (100%)',
      text: 'ما شاء الله تبارك الله! لقد حققتِ العلامة الكاملة بنسبة 100% بإتقان مطلق وإجابات نموذجية في كافة أسئلة المستوى! هذا أداء عبقري واستثنائي ينمّ عن شغف علمي مبهر وعقلية طبية واعدة. نفخر بكِ وبإنجازكِ العلمي المشرف! 🌟🎖️',
      gradeText: 'ممتاز مرتفع مع مرتبة الشرف الأولى'
    };
  } else if (percent >= 90) {
    return {
      badge: '🏅 وسام الامتياز والإتقان العالي (' + percent + '%)',
      text: 'إنجاز رائع ومتميز جداً! أظهرتِ فهماً علمياً عميقاً ودقة فائقة في تحليل واستيعاب وظائف وتشريح الأعضاء بنسبة تفوق 90%. واصلي هذا التألق والإبداع نحو القمة! 🎯✨',
      gradeText: 'ممتاز بتفوق باهر'
    };
  } else if (percent >= 80) {
    return {
      badge: '🎯 وسام الجدارة والاجتياز المتألق (' + percent + '%)',
      text: 'مبارك الاجتياز بنجاح واقتدار! لقد حققتِ نسبة ' + percent + '% وتجاوزتِ شرط الصعود للمستوى التالي (80%) بجدارة واستحقاق. أنتِ الآن مؤهلة تماماً لخوض تحدي المستوى التالي بكل ثقة! 🚀👏',
      gradeText: 'مؤهلة للمستوى التالي بجدارة'
    };
  } else {
    return {
      badge: '💡 شهادة تشجيع ومثابرة واعدة (' + percent + '%)',
      text: 'محاولة طيبة وجهد تشكرين عليه! حصلتِ على نسبة ' + percent + '%. شرط فتح المستوى التالي هو اجتياز 80% (8 أسئلة صحيحة من 10). أنتِ قريبة جداً من تحقيق الهدف، راجعي الإجابات وأعيدي المحاولة وسوف تتألقين بكل تأكيد! 💪🌱',
      gradeText: 'محاولة واعدة - يلزم 80% لفتح المستوى التالي'
    };
  }
}

function renderLevelsGrid() {
  const container = document.getElementById('levels-cards-grid');
  if (!container || !window.LEVELS_QUIZ_DATA) return;

  const levels = window.LEVELS_QUIZ_DATA.levels;
  container.innerHTML = '';

  levels.forEach(lvl => {
    const isUnlocked = lvl.id <= levelQuizState.unlockedLevel;
    const scoreData = levelQuizState.levelScores[lvl.id];
    const isPassed = scoreData && scoreData.passed;

    const card = document.createElement('div');
    card.className = `level-card ${isPassed ? 'passed' : (isUnlocked ? 'unlocked' : 'locked')}`;

    let statusPillHtml = '';
    if (isPassed) {
      statusPillHtml = `<span class="level-status-pill passed">🏆 مجتاز بنجاح (${scoreData.percent}%)</span>`;
    } else if (isUnlocked) {
      statusPillHtml = `<span class="level-status-pill unlocked">🔓 متاح للتحدي</span>`;
    } else {
      statusPillHtml = `<span class="level-status-pill locked">🔒 مغلق (يلزم 80% بالمستوى ${lvl.id - 1})</span>`;
    }

    let scoreBoxHtml = '';
    if (scoreData) {
      scoreBoxHtml = `
        <div class="level-card-score-box">
          <span style="font-size:0.9rem;color:#475569;font-weight:700;">أعلى نتيجة:</span>
          <span style="font-size:1.15rem;font-weight:900;color:${scoreData.passed ? '#059669' : '#d97706'};">
            ${scoreData.score} / ${scoreData.total} (${scoreData.percent}%)
          </span>
        </div>
      `;
    } else {
      scoreBoxHtml = `
        <div class="level-card-score-box">
          <span style="font-size:0.88rem;color:#64748b;">الشرط المطلوب:</span>
          <span style="font-size:0.92rem;font-weight:800;color:#0284c7;">8 من 10 (80%)</span>
        </div>
      `;
    }

    let actionBtnsHtml = '';
    if (isUnlocked) {
      actionBtnsHtml = `
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-primary" onclick="startLevelQuiz(${lvl.id})" style="flex:1;padding:10px 16px;font-size:0.95rem;justify-content:center;">
            <span>${scoreData ? '🔄 إعادة المحاولة' : '🚀 بدء التحدي'}</span>
          </button>
          ${scoreData ? `
            <button class="btn-secondary" onclick="showLevelCertificate(${lvl.id})" style="padding:10px 14px;font-size:0.92rem;" title="عرض شهادة المستوى">
              <span>📜 الشهادة</span>
            </button>
          ` : ''}
        </div>
      `;
    } else {
      actionBtnsHtml = `
        <button class="btn-secondary" onclick="alertLockedLevel(${lvl.id})" style="width:100%;padding:10px 16px;font-size:0.92rem;opacity:0.75;cursor:not-allowed;justify-content:center;">
          <span>🔒 مقفل (أنهي المستوى ${lvl.id - 1} بنسبة 80%)</span>
        </button>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="level-card-top">
          <span class="level-icon-large">${lvl.icon}</span>
          ${statusPillHtml}
        </div>
        <h4 class="level-card-title">${lvl.shortTitle}</h4>
        <p class="level-card-desc">${lvl.desc}</p>
        ${scoreBoxHtml}
      </div>
      <div>
        ${actionBtnsHtml}
      </div>
    `;

    container.appendChild(card);
  });
}

function alertLockedLevel(lvlId) {
  sounds.playWrong();
  triggerHaptic([50, 50]);
  const prevLvl = lvlId - 1;
  const currentScore = levelQuizState.levelScores[prevLvl] ? levelQuizState.levelScores[prevLvl].percent + '%' : 'لم يُكتمل بعد';
  alert(`🔒 المستوى رقم (${lvlId}) مغلق حالياً!\n\nنظام الصعود الأكاديمي يتطلب اجتياز المستوى السابق (${prevLvl}) بنسبة 80% على الأقل (8 أسئلة من 10).\nنتيجتك الحالية في المستوى (${prevLvl}): ${currentScore}\n\nانقري على المستوى (${prevLvl}) وأعيدي المحاولة لتحقيق 80% وفتح هذا التحدي الرائع! 💪🌟`);
}

function startLevelQuiz(levelId) {
  if (levelId > levelQuizState.unlockedLevel) {
    alertLockedLevel(levelId);
    return;
  }

  levelQuizState.activeLevel = levelId;
  levelQuizState.currentQuestionIndex = 0;
  saveLevelQuizState();

  const mapSec = document.getElementById('levels-map-section');
  const quizSec = document.getElementById('level-active-quiz-section');
  if (mapSec) mapSec.style.display = 'none';
  if (quizSec) quizSec.style.display = 'block';

  renderLevelQuestion();
}

function backToLevelsMap() {
  const mapSec = document.getElementById('levels-map-section');
  const quizSec = document.getElementById('level-active-quiz-section');
  if (mapSec) mapSec.style.display = 'block';
  if (quizSec) quizSec.style.display = 'none';
  renderLevelsGrid();
}

function calcLevelScore(levelId) {
  const lvl = window.LEVELS_QUIZ_DATA.levels.find(l => l.id === levelId);
  if (!lvl) return 0;
  let score = 0;
  lvl.questions.forEach(q => {
    if (levelQuizState.answers[q.id] === q.correct) score++;
  });
  return score;
}

function renderLevelQuestion() {
  if (!window.LEVELS_QUIZ_DATA) return;
  const lvl = window.LEVELS_QUIZ_DATA.levels.find(l => l.id === levelQuizState.activeLevel);
  if (!lvl) return;

  const totalQuestions = lvl.questions.length;
  if (levelQuizState.currentQuestionIndex >= totalQuestions) {
    levelQuizState.currentQuestionIndex = totalQuestions - 1;
  }

  const q = lvl.questions[levelQuizState.currentQuestionIndex];
  const qIdx = levelQuizState.currentQuestionIndex;

  // Header badges
  const titleBadge = document.getElementById('level-active-title-badge');
  const scoreDisplay = document.getElementById('level-score-display');
  if (titleBadge) titleBadge.textContent = `${lvl.shortTitle} (سؤال ${qIdx + 1} من ${totalQuestions})`;
  if (scoreDisplay) {
    const currentScore = calcLevelScore(lvl.id);
    scoreDisplay.textContent = `الدرجة الحالية: ${currentScore} / ${totalQuestions}`;
  }

  // 10 Question Navigation Pills
  const pillsBar = document.getElementById('level-q-pills-bar');
  if (pillsBar) {
    pillsBar.innerHTML = '';
    const organIcons = {
      heart: '🫀', lungs: '🫁', brain: '🧠', stomach: '🥗', esophagus: '🥢', eye: '👁️'
    };
    lvl.questions.forEach((qItem, idx) => {
      const pBtn = document.createElement('button');
      pBtn.className = `quiz-pill-btn ${idx === qIdx ? 'active' : ''}`;
      const hasAnswered = levelQuizState.answers[qItem.id] !== undefined;
      const isCorrect = hasAnswered && levelQuizState.answers[qItem.id] === qItem.correct;
      const isWrong = hasAnswered && !isCorrect;

      if (isCorrect) pBtn.classList.add('correct');
      if (isWrong) pBtn.classList.add('wrong');

      const mark = hasAnswered ? (isCorrect ? '✓' : '✗') : '';
      pBtn.innerHTML = `<span>${organIcons[qItem.organKey] || '❓'}</span> <span>س${idx + 1}</span> <span style="font-size:0.8rem;">${mark}</span>`;
      pBtn.title = `${qItem.organName}: سؤال ${idx + 1}`;
      pBtn.onclick = () => {
        levelQuizState.currentQuestionIndex = idx;
        renderLevelQuestion();
      };
      pillsBar.appendChild(pBtn);
    });
  }

  // Question Title
  const titleElem = document.getElementById('level-question-title');
  if (titleElem) {
    const organIcons = {
      heart: '🫀', lungs: '🫁', brain: '🧠', stomach: '🥗', esophagus: '🥢', eye: '👁️'
    };
    titleElem.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
        <span class="quiz-organ-tag">${organIcons[q.organKey] || '🫀'} ${q.organName}</span>
        <span class="quiz-qnum-tag">${lvl.shortTitle} • سؤال ${qIdx + 1} من ${totalQuestions}</span>
      </div>
      <div class="quiz-question-sentence">${q.q}</div>
    `;
  }

  // Options Grid
  const optionsContainer = document.getElementById('level-options-container');
  if (optionsContainer) {
    optionsContainer.innerHTML = '';
    const hasAnswered = levelQuizState.answers[q.id] !== undefined;
    const chosenAnswer = levelQuizState.answers[q.id];
    const optionLetters = ['أ', 'ب', 'ج', 'د'];

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = `quiz-option-btn opt-theme-${optIndex % 4}`;
      const letter = optionLetters[optIndex] || (optIndex + 1);
      let statusIcon = '';
      if (hasAnswered) {
        btn.disabled = true;
        if (opt === q.correct) {
          btn.classList.add('correct');
          statusIcon = '<span class="opt-status-icon">✓</span>';
        } else if (opt === chosenAnswer) {
          btn.classList.add('wrong');
          statusIcon = '<span class="opt-status-icon">✗</span>';
        }
      }
      btn.innerHTML = `
        <span class="opt-badge-pill">${letter}</span>
        <span class="opt-text">${opt}</span>
        ${statusIcon}
      `;
      btn.addEventListener('click', () => selectLevelOption(q.id, opt));
      optionsContainer.appendChild(btn);
    });
  }

  // Feedback Box
  const feedbackBox = document.getElementById('level-quiz-feedback');
  if (feedbackBox) {
    const hasAnswered = levelQuizState.answers[q.id] !== undefined;
    if (hasAnswered) {
      const isCorrect = levelQuizState.answers[q.id] === q.correct;
      feedbackBox.className = `quiz-feedback-box ${isCorrect ? 'correct' : 'wrong'}`;
      feedbackBox.innerHTML = `
        <div class="quiz-feedback-header">
          <span>${isCorrect ? '🎉 ' + (q.motivationSuccess || 'إجابة صحيحة ومتميزة! أحسنتِ الفهم والإتقان!') : '💡 ' + (q.motivationRetry || 'محاولة جيدة! فكري في الوظيفة الدقيقة للعضو.')}</span>
        </div>
        <div class="quiz-feedback-explain">${q.explain}</div>
      `;
      feedbackBox.style.display = 'block';
    } else {
      feedbackBox.style.display = 'none';
    }
  }

  // Navigation Buttons
  const prevBtn = document.getElementById('level-prev-btn');
  const nextBtn = document.getElementById('level-next-btn');
  if (prevBtn) {
    prevBtn.disabled = qIdx === 0;
    prevBtn.style.opacity = qIdx === 0 ? '0.5' : '1';
  }
  if (nextBtn) {
    if (qIdx === totalQuestions - 1) {
      nextBtn.innerHTML = '<span>إنهاء المستوى واستلام الشهادة 📜</span>';
      nextBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else {
      nextBtn.innerHTML = '<span>السؤال التالي ←</span>';
      nextBtn.style.background = '';
    }
  }
}

function selectLevelOption(qId, selectedOption) {
  const lvl = window.LEVELS_QUIZ_DATA.levels.find(l => l.id === levelQuizState.activeLevel);
  if (!lvl) return;
  const q = lvl.questions.find(item => item.id === qId);
  if (!q) return;

  levelQuizState.answers[qId] = selectedOption;
  saveLevelQuizState();

  const isCorrect = selectedOption === q.correct;
  if (isCorrect) {
    sounds.playCorrect();
    triggerHaptic(40);
  } else {
    sounds.playWrong();
    triggerHaptic([50, 40, 50]);
  }

  renderLevelQuestion();
}

function levelQuizNext() {
  const lvl = window.LEVELS_QUIZ_DATA.levels.find(l => l.id === levelQuizState.activeLevel);
  if (!lvl) return;

  if (levelQuizState.currentQuestionIndex < lvl.questions.length - 1) {
    levelQuizState.currentQuestionIndex++;
    renderLevelQuestion();
  } else {
    finishLevelQuiz();
  }
}

function levelQuizPrev() {
  if (levelQuizState.currentQuestionIndex > 0) {
    levelQuizState.currentQuestionIndex--;
    renderLevelQuestion();
  }
}

function finishLevelQuiz() {
  const lvl = window.LEVELS_QUIZ_DATA.levels.find(l => l.id === levelQuizState.activeLevel);
  if (!lvl) return;

  const score = calcLevelScore(lvl.id);
  const total = lvl.questions.length;
  const percent = Math.round((score / total) * 100);
  const passed = percent >= 80;

  levelQuizState.levelScores[lvl.id] = {
    score: score,
    total: total,
    percent: percent,
    passed: passed,
    date: new Date().toLocaleDateString('ar-SA')
  };

  if (passed && lvl.id < 4) {
    levelQuizState.unlockedLevel = Math.max(levelQuizState.unlockedLevel, lvl.id + 1);
  }
  saveLevelQuizState();

  if (passed) {
    sounds.playCorrect();
    triggerHaptic([50, 40, 60]);
  } else {
    sounds.playWrong();
  }

  showLevelCertificate(lvl.id);
}

function showLevelCertificate(levelId) {
  const lvl = window.LEVELS_QUIZ_DATA.levels.find(l => l.id === levelId);
  if (!lvl) return;

  const scoreData = levelQuizState.levelScores[levelId];
  const score = scoreData ? scoreData.score : calcLevelScore(levelId);
  const total = lvl.questions.length;
  const percent = scoreData ? scoreData.percent : Math.round((score / total) * 100);
  const passed = percent >= 80;

  const reinforce = getLevelReinforcement(percent);
  const modal = document.getElementById('level-cert-modal');
  if (!modal) return;

  // Populate certificate elements
  const levelNameElem = document.getElementById('cert-level-name-display');
  const strongTitle = document.getElementById('cert-level-strong-title');
  const studentInput = document.getElementById('cert-student-input-name');
  const percentElem = document.getElementById('cert-percent-val');
  const detailElem = document.getElementById('cert-score-detail');
  const badgeElem = document.getElementById('cert-reinforcement-badge');
  const textElem = document.getElementById('cert-reinforcement-text');
  const dateElem = document.getElementById('cert-issue-date');
  const actionsContainer = document.getElementById('cert-bottom-actions');

  if (levelNameElem) levelNameElem.textContent = lvl.title;
  if (strongTitle) strongTitle.textContent = lvl.shortTitle;
  if (studentInput) studentInput.value = levelQuizState.studentName || 'الطالبة المتميزة';
  if (percentElem) percentElem.textContent = `${percent}%`;
  if (detailElem) detailElem.textContent = `${score} من ${total} إجابات صحيحة • ${reinforce.gradeText}`;
  if (badgeElem) badgeElem.textContent = reinforce.badge;
  if (textElem) textElem.textContent = reinforce.text;
  if (dateElem) dateElem.textContent = scoreData ? scoreData.date : new Date().toLocaleDateString('ar-SA');

  if (actionsContainer) {
    let nextBtnHtml = '';
    if (passed && levelId < 4) {
      nextBtnHtml = `
        <button class="btn-primary" onclick="proceedToNextLevel(${levelId + 1})" style="padding:12px 24px;font-size:1.05rem;font-weight:900;background:linear-gradient(135deg, #10b981, #059669);box-shadow:0 6px 18px rgba(16, 185, 129, 0.4);">
          <span>الصعود للمستوى التالي (المستوى ${levelId + 1}) 🚀</span>
        </button>
      `;
    }
    actionsContainer.innerHTML = `
      ${nextBtnHtml}
      <button class="btn-secondary" onclick="retryLevel(${levelId})" style="padding:12px 20px;font-size:0.98rem;font-weight:800;">
        <span>🔄 إعادة محاولة المستوى لتحقيق 100%</span>
      </button>
      <button class="btn-subtle-pill" onclick="closeLevelCertModal()" style="padding:12px 18px;font-size:0.95rem;">
        <span>العودة لخريطة المستويات 🗺️</span>
      </button>
    `;
  }

  modal.classList.add('show');
}

function proceedToNextLevel(nextLvlId) {
  closeLevelCertModal();
  startLevelQuiz(nextLvlId);
}

function retryLevel(lvlId) {
  const lvl = window.LEVELS_QUIZ_DATA.levels.find(l => l.id === lvlId);
  if (lvl) {
    lvl.questions.forEach(q => {
      delete levelQuizState.answers[q.id];
    });
    saveLevelQuizState();
  }
  closeLevelCertModal();
  startLevelQuiz(lvlId);
}

function closeLevelCertModal() {
  const modal = document.getElementById('level-cert-modal');
  if (modal) modal.classList.remove('show');
  backToLevelsMap();
}

function saveCertStudentName(name) {
  levelQuizState.studentName = name || 'الطالبة المتميزة';
  saveLevelQuizState();
  const certDisplay = document.getElementById('cert-student-display');
  if (certDisplay) certDisplay.textContent = levelQuizState.studentName;
}

// Make functions globally accessible
window.setQuizDisplayMode = function(mode) {
  quizDisplayMode = mode;
  const levelsBtn = document.getElementById('quiz-mode-levels-btn');
  const singleBtn = document.getElementById('quiz-mode-single-btn');
  const allBtn = document.getElementById('quiz-mode-all-btn');

  const levelsView = document.getElementById('quiz-levels-view');
  const singleView = document.getElementById('quiz-active-view');
  const allView = document.getElementById('quiz-all-questions-view');
  const pillsBar = document.getElementById('quiz-question-pills-bar');

  if (levelsBtn) levelsBtn.classList.toggle('active', mode === 'levels');
  if (singleBtn) singleBtn.classList.toggle('active', mode === 'single');
  if (allBtn) allBtn.classList.toggle('active', mode === 'all');

  if (mode === 'levels') {
    if (levelsView) levelsView.style.display = 'block';
    if (singleView) singleView.style.display = 'none';
    if (allView) allView.style.display = 'none';
    if (pillsBar) pillsBar.style.display = 'none';
    backToLevelsMap();
  } else if (mode === 'single') {
    if (levelsView) levelsView.style.display = 'none';
    if (singleView) singleView.style.display = 'block';
    if (allView) allView.style.display = 'none';
    if (pillsBar) pillsBar.style.display = 'flex';
    renderQuizQuestion();
  } else if (mode === 'all') {
    if (levelsView) levelsView.style.display = 'none';
    if (singleView) singleView.style.display = 'none';
    if (allView) allView.style.display = 'block';
    if (pillsBar) pillsBar.style.display = 'none';
    renderAllQuizQuestions();
  }
};

window.startLevelQuiz = startLevelQuiz;
window.backToLevelsMap = backToLevelsMap;
window.levelQuizNext = levelQuizNext;
window.levelQuizPrev = levelQuizPrev;
window.selectLevelOption = selectLevelOption;
window.showLevelCertificate = showLevelCertificate;
window.proceedToNextLevel = proceedToNextLevel;
window.retryLevel = retryLevel;
window.closeLevelCertModal = closeLevelCertModal;
window.saveCertStudentName = saveCertStudentName;
window.alertLockedLevel = alertLockedLevel;


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

  setQuizDisplayMode('levels');  state.quizCurrentIndex = 0;
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

  const organIcons = {
    heart: '🫀', lungs: '🫁', brain: '🧠', stomach: '🥗', esophagus: '🥢', eye: '👁️'
  };

  if (qNumElem) qNumElem.textContent = `سؤال ${state.quizCurrentIndex + 1} من ${allQ.length}`;
  if (scoreElem) scoreElem.textContent = `${state.quizScore} / ${allQ.length}`;
  if (titleElem) {
    titleElem.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
        <span class="quiz-organ-tag">${organIcons[q.organKey] || '🫀'} ${q.organName}</span>
        <span class="quiz-qnum-tag">سؤال ${state.quizCurrentIndex + 1} من ${allQ.length}</span>
      </div>
      <div class="quiz-question-sentence">${q.q}</div>
    `;
  }

  if (optionsContainer) {
    optionsContainer.innerHTML = '';
    const hasAnswered = state.quizAnswers[q.id] !== undefined;
    const chosenAnswer = state.quizAnswers[q.id];
    const optionLetters = ['أ', 'ب', 'ج', 'د'];

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = `quiz-option-btn opt-theme-${optIndex % 4}`;
      const letter = optionLetters[optIndex] || (optIndex + 1);
      let statusIcon = '';
      if (hasAnswered) {
        btn.disabled = true;
        if (opt === q.correct) {
          btn.classList.add('correct');
          statusIcon = '<span class="opt-status-icon">✓</span>';
        } else if (opt === chosenAnswer) {
          btn.classList.add('wrong');
          statusIcon = '<span class="opt-status-icon">✗</span>';
        }
      }
      btn.innerHTML = `
        <span class="opt-badge-pill">${letter}</span>
        <span class="opt-text">${opt}</span>
        ${statusIcon}
      `;
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
        <div class="quiz-feedback-header">
          <span>${isCorrect ? '🎉 ' + (q.motivationSuccess || 'إجابة صحيحة ومتميزة! أحسنتِ الفهم والإتقان!') : '💡 ' + (q.motivationRetry || 'محاولة جيدة! فكري في الوظيفة الدقيقة للعضو.')}</span>
        </div>
        <div class="quiz-feedback-explain">${q.explain}</div>
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
  const optionLetters = ['أ', 'ب', 'ج', 'د'];

  allQ.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'all-q-card';

    const hasAnswered = state.quizAnswers[q.id] !== undefined;
    const chosenAnswer = state.quizAnswers[q.id];
    const isCorrect = chosenAnswer === q.correct;

    const optGrid = document.createElement('div');
    optGrid.className = 'options-grid';

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = `quiz-option-btn opt-theme-${optIndex % 4}`;
      const letter = optionLetters[optIndex] || (optIndex + 1);
      let statusIcon = '';
      if (hasAnswered) {
        btn.disabled = true;
        if (opt === q.correct) {
          btn.classList.add('correct');
          statusIcon = '<span class="opt-status-icon">✓</span>';
        } else if (opt === chosenAnswer) {
          btn.classList.add('wrong');
          statusIcon = '<span class="opt-status-icon">✗</span>';
        }
      }
      btn.innerHTML = `
        <span class="opt-badge-pill">${letter}</span>
        <span class="opt-text">${opt}</span>
        ${statusIcon}
      `;
      btn.addEventListener('click', () => selectQuizOption(q.id, opt));
      optGrid.appendChild(btn);
    });

    let feedbackHtml = '';
    if (hasAnswered) {
      feedbackHtml = `
        <div class="quiz-feedback-box ${isCorrect ? 'correct' : 'wrong'}" style="display:block;margin-top:16px;">
          <div class="quiz-feedback-header">${isCorrect ? '🎉 ' + (q.motivationSuccess || 'ممتازة ورائعة!') : '💡 ' + (q.motivationRetry || 'حاولي ثانية!')}</div>
          <div class="quiz-feedback-explain">${q.explain}</div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="all-q-card-header">
        <span class="all-q-badge">${organIcons[q.organKey] || '🏷️'} ${q.organName} (سؤال ${idx + 1} من ${allQ.length})</span>
        <button class="btn-subtle-pill" onclick="jumpToQuizQuestion(${idx})">🎯 الانتقال لهذا السؤال</button>
      </div>
      <h4 class="all-q-text">${q.q}</h4>
    `;
    card.appendChild(optGrid);
    if (feedbackHtml) {
      const fbDiv = document.createElement('div');
      fbDiv.innerHTML = feedbackHtml;
      card.appendChild(fbDiv.firstElementChild);
    }
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
  logStudentResult(student, state.quizScore, quizData.length);
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


// ==========================================
// 🔐 TEACHER & ADMIN CONTROL PANEL SYSTEM
// ==========================================

function getAdminPin() {
  try {
    return localStorage.getItem('admin_pin') || '1234';
  } catch (e) {
    return '1234';
  }
}

function saveAdminNewPin() {
  const input = document.getElementById('admin-new-pin-input');
  if (!input || !input.value.trim()) {
    alert('يرجى إدخال رمز سري صالح.');
    return;
  }
  try {
    localStorage.setItem('admin_pin', input.value.trim());
    alert('✅ تم تغيير الرمز السري للأدمن بنجاح!');
    input.value = '';
  } catch (e) {
    alert('تعذر حفظ الرمز: ' + e);
  }
}

window.openAdminModal = function() {
  if (sessionStorage.getItem('admin_auth') === 'true') {
    window.openAdminDashboard();
  } else {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
      modal.classList.add('show');
      const err = document.getElementById('admin-login-error');
      if (err) err.style.display = 'none';
      const input = document.getElementById('admin-pin-input');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 200);
      }
    }
  }
};

window.closeAdminLoginModal = function() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) modal.classList.remove('show');
};

window.submitAdminLogin = function() {
  const input = document.getElementById('admin-pin-input');
  const err = document.getElementById('admin-login-error');
  if (!input) return;
  const pin = input.value.trim();
  if (pin === getAdminPin()) {
    sessionStorage.setItem('admin_auth', 'true');
    closeAdminLoginModal();
    window.openAdminDashboard();
  } else {
    if (err) {
      err.textContent = '❌ الرمز السري غير صحيح، يرجى المحاولة مرة أخرى.';
      err.style.display = 'block';
    }
    input.value = '';
    input.focus();
  }
};

window.openAdminDashboard = function() {
  const modal = document.getElementById('admin-dashboard-modal');
  if (modal) {
    modal.classList.add('show');
    renderAdminDashboard();
  }
};

window.closeAdminDashboardModal = function() {
  const modal = document.getElementById('admin-dashboard-modal');
  if (modal) modal.classList.remove('show');
};

window.logoutAdmin = function() {
  sessionStorage.removeItem('admin_auth');
  closeAdminDashboardModal();
  alert('🔒 تم تسجيل الخروج من لوحة التحكم بنجاح.');
};

window.switchAdminTab = function(tabName) {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-pane') === tabName);
  });
  document.querySelectorAll('.admin-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `admin-pane-${tabName}`);
  });

  if (tabName === 'questions') {
    renderAdminQuestions('all');
  } else if (tabName === 'youtube') {
    renderAdminYouTube('heart');
  } else if (tabName === 'students') {
    renderAdminStudentResults();
  }
};

function renderAdminDashboard() {
  const activeBtn = document.querySelector('.admin-tab-btn.active');
  const currentPane = activeBtn ? activeBtn.getAttribute('data-pane') : 'questions';
  switchAdminTab(currentPane);
}

// ------------------------------------------
// PANE 1: QUESTIONS MANAGEMENT (CRUD)
// ------------------------------------------
let adminCurrentFilter = 'all';

window.filterAdminQuestions = function(organKey, btnElem) {
  adminCurrentFilter = organKey;
  if (btnElem && btnElem.parentElement) {
    btnElem.parentElement.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btnElem.classList.add('active');
  }
  renderAdminQuestions(organKey);
};

function getAllAdminQuestionsList() {
  const list = [];
  Object.keys(organsSimulatorData).forEach(key => {
    const organQuestions = getOrganQuestions(key);
    list.push(...organQuestions);
  });
  return list;
}

function renderAdminQuestions(filterOrgan = 'all') {
  const container = document.getElementById('admin-questions-list-container');
  if (!container) return;

  const all = getAllAdminQuestionsList();
  const filtered = filterOrgan === 'all' ? all : all.filter(q => q.organKey === filterOrgan);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px;background:#fff;border-radius:12px;border:1.5px dashed #cbd5e1;color:#64748b;">
        <span style="font-size:2rem;display:block;margin-bottom:8px;">📭</span>
        <strong style="font-size:1.05rem;">لا توجد أسئلة مسجلة لهذا العضو</strong>
        <p style="margin:6px 0 14px 0;font-size:0.85rem;">يمكنك إضافة سؤال جديد باستخدام الزر بالأعلى.</p>
        <button class="btn-primary" onclick="openAddQuestionModal('${filterOrgan !== 'all' ? filterOrgan : 'heart'}')">➕ إضافة أول سؤال</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((q, idx) => {
    return `
      <div class="admin-q-item" id="admin-q-card-${q.id}">
        <div class="admin-q-header">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="background:#e0f2fe;color:#0369a1;font-weight:800;font-size:0.78rem;padding:3px 10px;border-radius:20px;">
              ${q.organName}
            </span>
            <span style="background:${q.isDefault ? '#f1f5f9' : '#fef3c7'};color:${q.isDefault ? '#475569' : '#b45309'};font-weight:700;font-size:0.75rem;padding:2px 8px;border-radius:20px;">
              ${q.isDefault ? '📌 سؤال أساسي' : '✍️ سؤال مضاف يدوياً'}
            </span>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn-secondary" onclick="openAdminEditQuestionModal('${q.id}')" style="padding:4px 10px;font-size:0.8rem;">
              <span>✏️ تعديل</span>
            </button>
            <button class="btn-secondary" onclick="deleteAdminQuestion('${q.id}', ${q.isDefault})" style="padding:4px 10px;font-size:0.8rem;color:#dc2626;border-color:#fca5a5;">
              <span>🗑️ حذف</span>
            </button>
          </div>
        </div>

        <div class="admin-q-text">
          <span style="color:#6366f1;margin-left:4px;">س${idx + 1}:</span> ${q.q || q.question}
        </div>

        <div class="admin-q-choices">
          ${q.options.map((opt, optIdx) => `
            <div class="admin-q-choice-item ${opt === q.correct || optIdx === q.correctIndex ? 'correct' : ''}">
              ${opt === q.correct || optIdx === q.correctIndex ? '✓ ' : '○ '} ${opt}
            </div>
          `).join('')}
        </div>

        <div style="background:#f8fafc;padding:10px 14px;border-radius:8px;font-size:0.85rem;color:#475569;display:flex;flex-direction:column;gap:4px;border:1px solid #e2e8f0;">
          <div><strong style="color:#0f172a;">💡 التفسير العلمي:</strong> ${q.explain || q.explanation || 'لا يوجد'}</div>
          <div><strong style="color:#16a34a;">🌟 عبارة التحفيز:</strong> ${q.motivationSuccess || q.motivation || 'ممتاز!'}</div>
        </div>
      </div>
    `;
  }).join('');
}

window.openAdminEditQuestionModal = function(qId) {
  const all = getAllAdminQuestionsList();
  const q = all.find(item => item.id === qId);
  if (!q) {
    alert('لم يتم العثور على السؤال!');
    return;
  }

  document.getElementById('edit-q-id').value = q.id;
  document.getElementById('edit-q-organ').value = q.organKey;
  document.getElementById('edit-q-text').value = q.q || q.question || '';
  document.getElementById('edit-q-opt-0').value = (q.options && q.options[0]) || '';
  document.getElementById('edit-q-opt-1').value = (q.options && q.options[1]) || '';
  document.getElementById('edit-q-opt-2').value = (q.options && q.options[2]) || '';
  document.getElementById('edit-q-opt-3').value = (q.options && q.options[3]) || '';
  
  const radio = document.getElementById(`edit-radio-${q.correctIndex}`);
  if (radio) {
    radio.checked = true;
  } else {
    const fallbackRadio = document.getElementById('edit-radio-0');
    if (fallbackRadio) fallbackRadio.checked = true;
  }
  
  document.getElementById('edit-q-explain').value = q.explain || q.explanation || '';
  document.getElementById('edit-q-motivation').value = q.motivationSuccess || q.motivation || '';

  const modal = document.getElementById('admin-edit-q-modal');
  if (modal) {
    modal.style.zIndex = '99999';
    modal.classList.add('show');
  }
};

window.saveAdminEditedQuestion = function() {
  const qId = document.getElementById('edit-q-id').value;
  const organKey = document.getElementById('edit-q-organ').value;
  const question = document.getElementById('edit-q-text').value.trim();
  const opt0 = document.getElementById('edit-q-opt-0').value.trim();
  const opt1 = document.getElementById('edit-q-opt-1').value.trim();
  const opt2 = document.getElementById('edit-q-opt-2').value.trim();
  const opt3 = document.getElementById('edit-q-opt-3').value.trim();
  const checkedRadio = document.querySelector('input[name="edit-q-correct"]:checked');
  const correctIdx = checkedRadio ? parseInt(checkedRadio.value, 10) : 0;
  const options = [opt0, opt1, opt2, opt3];
  const correctStr = options[correctIdx] || opt0;
  const explanation = document.getElementById('edit-q-explain').value.trim();
  const motivation = document.getElementById('edit-q-motivation').value.trim();

  if (!question || options.some(opt => !opt)) {
    alert('يرجى ملء نص السؤال وجميع الخيارات الأربعة!');
    return;
  }

  let customs = getLocalCustomQuestions();
  const customIdx = customs.findIndex(c => c.id === qId);

  const updatedQ = {
    id: qId,
    organKey,
    q: question,
    question: question,
    options,
    correct: correctStr,
    correctIndex: correctIdx,
    explain: explanation || 'أحسنتِ! فهم علمي سليم.',
    explanation: explanation || 'أحسنتِ! فهم علمي سليم.',
    motivationSuccess: motivation || '🌟 رائعة ومتميزة! إجابة ذكية!',
    motivation: motivation || '🌟 رائعة ومتميزة! إجابة ذكية!',
    motivationRetry: '💡 محاولة ممتازة! فكري مجدداً وجربي.',
    isCustom: true
  };

  if (customIdx !== -1) {
    customs[customIdx] = updatedQ;
  } else {
    // Override for default question or new question
    customs.push(updatedQ);
  }
  localStorage.setItem('custom_organ_questions', JSON.stringify(customs));

  // If it was in deleted defaults list, remove it from deleted
  const deletedDefaults = getLocalDeletedQuestions().filter(id => id !== qId);
  setDeletedDefaultQuestions(deletedDefaults);

  document.getElementById('admin-edit-q-modal').classList.remove('show');
  renderAdminQuestions(adminCurrentFilter);
  if (typeof renderAllQuizQuestions === 'function') renderAllQuizQuestions();
  if (typeof renderQuizPillsBar === 'function') renderQuizPillsBar();
  if (typeof renderOrganQuestions === 'function') renderOrganQuestions();
  if (typeof renderQuizQuestion === 'function') renderQuizQuestion();
  alert('✅ تم حفظ تعديلات السؤال بنجاح في الموقع والمحاكي!');
};

window.deleteAdminQuestion = function(qId, isDefault) {
  if (!confirm('هل أنتِ متأكدة من رغبتكِ في حذف هذا السؤال؟')) return;

  if (!isDefault) {
    deleteCustomQuestionFromStorage(qId);
  } else {
    // Default question: add to deleted_default_questions and remove any custom override
    const deleted = getLocalDeletedQuestions();
    if (!deleted.includes(qId)) {
      deleted.push(qId);
      setDeletedDefaultQuestions(deleted);
    }
    deleteCustomQuestionFromStorage(qId);
  }

  renderAdminQuestions(adminCurrentFilter);
  if (typeof renderAllQuizQuestions === 'function') renderAllQuizQuestions();
  if (typeof renderQuizPillsBar === 'function') renderQuizPillsBar();
  if (typeof renderOrganQuestions === 'function') renderOrganQuestions();
  if (typeof renderQuizQuestion === 'function') renderQuizQuestion();
  alert('✅ تم حذف السؤال بنجاح.');
};

window.resetAllQuestionsToDefault = function() {
  if (!confirm('هل ترغبين في التراجع عن تعديلاتكِ المحلية غير المنشورة والعودة لبنك الأسئلة المنشور (الأسئلة الـ12 الأساسية + ما نُشر سابقاً)؟')) return;
  try {
    localStorage.removeItem('custom_organ_questions');
    localStorage.removeItem('deleted_default_questions');
    renderAdminQuestions(adminCurrentFilter);
    if (typeof renderAllQuizQuestions === 'function') renderAllQuizQuestions();
    if (typeof renderQuizPillsBar === 'function') renderQuizPillsBar();
    if (typeof renderOrganQuestions === 'function') renderOrganQuestions();
    if (typeof renderQuizQuestion === 'function') renderQuizQuestion();
    alert('✅ تم استعادة الأسئلة الافتراضية بنجاح.');
  } catch (e) {
    console.error(e);
  }
};

// ------------------------------------------
// PANE 2: YOUTUBE MANAGER
// ------------------------------------------
let adminCurrentYtOrgan = 'heart';

window.renderAdminYouTube = function(organKey = null) {
  if (organKey) adminCurrentYtOrgan = organKey;
  const tabsContainer = document.getElementById('admin-yt-tabs');
  const tableContainer = document.getElementById('admin-yt-parts-table-container');
  if (!tabsContainer || !tableContainer) return;

  // Render organ pills
  tabsContainer.innerHTML = Object.keys(organsSimulatorData).map(k => {
    const org = organsSimulatorData[k];
    const isActive = k === adminCurrentYtOrgan;
    return `
      <button class="pill-btn ${isActive ? 'active' : ''}" onclick="saveAllAdminYouTubeSilent(); renderAdminYouTube('${k}');" style="padding:6px 14px;border-radius:20px;font-weight:800;font-size:0.85rem;">
        ${org.icon} ${org.name}
      </button>
    `;
  }).join('');

  const organ = organsSimulatorData[adminCurrentYtOrgan];
  if (!organ) return;

  const parts = organ.parts || [];
  tableContainer.innerHTML = `
    <div class="admin-table-container">
      <table class="admin-data-table">
        <thead>
          <tr>
            <th style="width:180px;">الجزء التشريحي</th>
            <th>رابط يوتيوب (أو المعرّف ID)</th>
            <th style="width:170px;text-align:center;">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${parts.map(p => {
            const currentUrl = getPartYouTubeUrl(adminCurrentYtOrgan, p.id);
            return `
              <tr>
                <td>
                  <strong>${p.name}</strong>
                  <div style="font-size:0.75rem;color:#64748b;">${p.nameEn || ''}</div>
                </td>
                <td>
                  <input type="text" id="admin-yt-input-${p.id}" value="${currentUrl}" onchange="setPartYouTubeUrl('${p.id}', this.value.trim())" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid #cbd5e1;font-family:inherit;font-size:0.85rem;" dir="ltr">
                </td>
                <td style="text-align:center;">
                  <button class="btn-primary" onclick="saveAdminSingleYt('${p.id}')" style="padding:4px 9px;font-size:0.78rem;" title="حفظ رابط الفيديو لهذا الجزء">
                    <span>حفظ 💾</span>
                  </button>
                  <button class="btn-secondary" onclick="openPartModal('${adminCurrentYtOrgan}', '${p.id}')" style="padding:4px 9px;font-size:0.78rem;" title="معاينة وتشغيل الفيديو مباشرة">
                    <span>معاينة ▶️</span>
                  </button>
                  <button class="btn-secondary" onclick="resetAdminSingleYt('${p.id}')" style="padding:4px 8px;font-size:0.75rem;" title="استعادة رابط الشرح الافتراضي الأصلي لهذا الجزء">
                    <span>استعادة 🔄</span>
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
};

window.saveAllAdminYouTubeSilent = function() {
  const organ = organsSimulatorData[adminCurrentYtOrgan];
  if (!organ || !organ.parts) return;
  organ.parts.forEach(p => {
    const input = document.getElementById(`admin-yt-input-${p.id}`);
    if (input) setPartYouTubeUrl(p.id, input.value.trim());
  });
};

window.saveAdminSingleYt = function(partId) {
  const input = document.getElementById(`admin-yt-input-${partId}`);
  if (!input) return;
  setPartYouTubeUrl(partId, input.value.trim());
  if (typeof sounds !== 'undefined' && sounds.playCorrect) sounds.playCorrect();
  alert('✅ تم حفظ وتثبيت رابط الفيديو لهذا الجزء بنجاح!');
};

window.resetAdminSingleYt = function(partId) {
  resetPartYouTubeUrl(partId);
  if (typeof sounds !== 'undefined' && sounds.playCorrect) sounds.playCorrect();
  renderAdminYouTube(adminCurrentYtOrgan);
  alert('🔄 تمت استعادة رابط يوتيوب الافتراضي الأصلي لهذا الجزء بنجاح.');
};

window.saveAllAdminYouTube = function() {
  const organ = organsSimulatorData[adminCurrentYtOrgan];
  if (!organ || !organ.parts) return;
  organ.parts.forEach(p => {
    const input = document.getElementById(`admin-yt-input-${p.id}`);
    if (input) setPartYouTubeUrl(p.id, input.value.trim());
  });
  sounds.playVictory();
  alert(`✅ تم حفظ كافة روابط يوتيوب لأجزاء (${organ.name}) بنجاح!`);
};

// ------------------------------------------
// PANE 3: STUDENT RESULTS LOG
// ------------------------------------------
function getStudentResultsLog() {
  try {
    const raw = localStorage.getItem('student_quiz_results');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

window.logStudentResult = function(name, score, total) {
  if (!name || name === 'الطالب/ـة المتميز/ـة' || name === 'الطالب/ـة') return;
  try {
    const results = getStudentResultsLog();
    const pct = Math.round((score / total) * 100);
    let grade = 'ممتاز 🌟';
    if (pct < 60) grade = 'مشارك 👍';
    else if (pct < 80) grade = 'جيد جداً 🎯';

    // Avoid duplicate entry in same minute
    const now = new Date();
    const timeStr = now.toLocaleDateString('ar-SA') + ' ' + now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    
    results.unshift({
      id: Date.now(),
      name,
      score,
      total,
      pct,
      grade,
      timestamp: timeStr
    });

    localStorage.setItem('student_quiz_results', JSON.stringify(results.slice(0, 100)));
  } catch (e) {
    console.error(e);
  }
};

window.renderAdminStudentResults = function() {
  const results = getStudentResultsLog();
  const totalStudentsElem = document.getElementById('admin-stat-total-students');
  const avgScoreElem = document.getElementById('admin-stat-avg-score');
  const maxScoreElem = document.getElementById('admin-stat-max-score');
  const tbody = document.getElementById('admin-students-table-body');
  if (!tbody) return;

  if (totalStudentsElem) totalStudentsElem.textContent = results.length;

  if (results.length === 0) {
    if (avgScoreElem) avgScoreElem.textContent = '0%';
    if (maxScoreElem) maxScoreElem.textContent = '0 / 12';
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:30px;color:#64748b;">
          لم يسجل أي طالب نتيجة حتى الآن. تظهر النتائج هنا تلقائياً عند حل الاختبار وطباعة الشهادة.
        </td>
      </tr>
    `;
    return;
  }

  const avg = Math.round(results.reduce((acc, cur) => acc + cur.pct, 0) / results.length);
  const maxScore = Math.max(...results.map(r => r.score));
  if (avgScoreElem) avgScoreElem.textContent = `${avg}%`;
  if (maxScoreElem) maxScoreElem.textContent = `${maxScore} / 12`;

  tbody.innerHTML = results.map((r, idx) => `
    <tr>
      <td><strong>${idx + 1}</strong></td>
      <td><strong style="color:#0f172a;">${r.name}</strong></td>
      <td><span style="font-weight:800;color:#0284c7;">${r.score}</span> / ${r.total}</td>
      <td><strong>${r.pct}%</strong></td>
      <td><span style="background:${r.pct >= 80 ? '#dcfce7' : '#f1f5f9'};color:${r.pct >= 80 ? '#15803d' : '#334155'};padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:700;">${r.grade}</span></td>
      <td style="font-size:0.8rem;color:#64748b;">${r.timestamp}</td>
    </tr>
  `).join('');
};

window.exportStudentResultsCSV = function() {
  const results = getStudentResultsLog();
  if (results.length === 0) {
    alert('لا توجد بيانات طلاب لتصديرها.');
    return;
  }

  let csv = '\uFEFFم,اسم الطالب/ـة,الدرجة,إجمالي الأسئلة,النسبة المئوية,التقدير,التاريخ والوقت\n';
  results.forEach((r, idx) => {
    csv += `"${idx + 1}","${r.name}","${r.score}","${r.total}","${r.pct}%","${r.grade}","${r.timestamp}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `نتائج_طلاب_أعضاء_الجسم_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

window.printStudentResults = function() {
  const results = getStudentResultsLog();
  const win = window.open('', '_blank');
  win.document.write(`
    <html dir="rtl">
      <head>
        <title>كشف نتائج طلاب منصة أعضاء الجسم</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; direction: rtl; }
          h2 { text-align: center; color: #1e1b4b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: right; }
          th { background: #f8fafc; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>📊 كشف نتائج وتقييمات طلاب منصة «أعضاء الجسم»</h2>
        <p style="text-align:center;color:#64748b;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الطالبـ/ـة</th>
              <th>الدرجة</th>
              <th>النسبة</th>
              <th>التقدير</th>
              <th>الوقت والتاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${results.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${r.name}</strong></td>
                <td>${r.score} / ${r.total}</td>
                <td>${r.pct}%</td>
                <td>${r.grade}</td>
                <td>${r.timestamp}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); };</script>
      </body>
    </html>
  `);
  win.document.close();
};

window.clearStudentResults = function() {
  if (!confirm('هل أنتِ متأكدة من مسح سجل درجات الطلاب بالكامل؟')) return;
  localStorage.removeItem('student_quiz_results');
  renderAdminStudentResults();
  alert('🗑️ تم مسح السجل بنجاح.');
};

// ------------------------------------------
// PANE 4: BACKUP & FIREBASE CLOUD
// ------------------------------------------
// تثبيت التعديلات للجميع: يولّد ملف content.js يُوضع في مجلد الموقع ويُرفع مع الموقع

// طلب إذن التخزين الدائم من المتصفح لمنع مسحه مع السجل
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(granted => {
    if (granted) console.log('✓ تم تفعيل التخزين الدائم للموقع');
  }).catch(() => {});
}

// حفظ فوري في ملف content.js باستخدام File System Access API
window.saveDirectToContentFile = async function() {
  const content = {
    version: Date.now(),
    customYoutube: getCustomYouTubeLinks(),
    customQuestions: getCustomQuestions(),
    deletedQuestionIds: getDeletedDefaultQuestions()
  };
  const text = '// ملف المحتوى المنشور للجميع - تم توليده من لوحة الإدارة.\n' +
    'window.PUBLISHED_CONTENT = ' + JSON.stringify(content, null, 2) + ';\n';

  // 1. تجربة الحفظ المباشر في المتصفحات الحديثة (Chrome / Edge)
  if (typeof window !== 'undefined' && window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'content.js',
        types: [{
          description: 'JavaScript File',
          accept: { 'text/javascript': ['.js'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();

      // تحديث المحتوى في الجلسة الحالية
      window.PUBLISHED_CONTENT = content;
      if (typeof sounds !== 'undefined' && sounds.playVictory) sounds.playVictory();
      alert('✅ تم الحفظ بنجاح داخل ملف (content.js) بالموقع!\n\nالآن أصبحت كافة الأسئلة وروابط الفيديوهات محفوظة بشكل دائم في ملفات الموقع، ولن تُمسح نهائياً حتى لو قمتِ بمسح سجل التصفح بالكامل!');
      return;
    } catch (err) {
      if (err.name === 'AbortError') return; // إلغاء المستخدم
      console.warn('showSaveFilePicker failed, fallback to download:', err);
    }
  }

  // 2. البديل التلقائي: تحميل الملف
  exportPublishContentJS();
};

window.exportPublishContentJS = function() {
  const content = {
    version: Date.now(),
    customYoutube: getCustomYouTubeLinks(),
    customQuestions: getCustomQuestions(),
    deletedQuestionIds: getDeletedDefaultQuestions()
  };
  const text = '// ملف المحتوى المنشور للجميع - تم توليده من لوحة الإدارة. استبدل به ملف content.js في مجلد الموقع ثم ارفع الموقع.\n' +
    'window.PUBLISHED_CONTENT = ' + JSON.stringify(content, null, 2) + ';\n';
  const blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'content.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  const nYt = Object.keys(content.customYoutube).length;
  const nQ = content.customQuestions.length;
  alert('✅ تم تحميل ملف content.js\n\nيحتوي على ' + nYt + ' رابط فيديو معدّل و' + nQ + ' سؤالاً مضافاً/معدّلاً.\n\nالخطوات: ضعي الملف في مجلد الموقع (استبدلي القديم) ثم ارفعي الموقع بـ git push، وبعد دقائق سيراه كل الطلاب.');
};

window.exportPlatformBackupJSON = function() {
  const backup = {
    exportDate: new Date().toISOString(),
    version: '1.2',
    adminPin: getAdminPin(),
    customQuestions: getCustomQuestions(),
    deletedDefaultQuestions: getDeletedDefaultQuestions(),
    customYoutube: getCustomYouTubeLinks(),
    studentResults: getStudentResultsLog(),
    exploredOrgans: [...state.exploredOrgans],
    firebaseConfig: {
      apiKey: localStorage.getItem('fb_api_key') || '',
      projectId: localStorage.getItem('fb_project_id') || ''
    }
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = `نسخة_احتياطية_منصة_أعضاء_الجسم_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

window.importPlatformBackupJSON = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.adminPin) localStorage.setItem('admin_pin', data.adminPin);
      if (data.customQuestions) localStorage.setItem('custom_organ_questions', JSON.stringify(data.customQuestions));
      if (data.deletedDefaultQuestions) localStorage.setItem('deleted_default_questions', JSON.stringify(data.deletedDefaultQuestions));
      if (data.customYoutube) localStorage.setItem('custom_organ_youtube_links', JSON.stringify(data.customYoutube));
      if (data.studentResults) localStorage.setItem('student_quiz_results', JSON.stringify(data.studentResults));
      if (data.exploredOrgans && Array.isArray(data.exploredOrgans)) {
        localStorage.setItem('explored_organs', JSON.stringify(data.exploredOrgans));
        state.exploredOrgans = new Set(data.exploredOrgans);
      }
      if (data.firebaseConfig) {
        if (data.firebaseConfig.apiKey) localStorage.setItem('fb_api_key', data.firebaseConfig.apiKey);
        if (data.firebaseConfig.projectId) localStorage.setItem('fb_project_id', data.firebaseConfig.projectId);
      }

      alert('✅ تم استيراد وتطبيق النسخة الاحتياطية بنجاح!');
      renderAdminDashboard();
      renderOrganViewer();
      renderOrganQuestions();
      renderQuizQuestion();
      if (typeof renderAllQuizQuestions === 'function') renderAllQuizQuestions();
      if (typeof renderQuizPillsBar === 'function') renderQuizPillsBar();
      updateOrganCompletedState();
      updateProgressTracker();
    } catch (err) {
      alert('❌ فشل استيراد الملف: ' + err);
    }
  };
  reader.readAsText(file);
};

window.saveFirebaseConfig = function() {
  const apiKey = document.getElementById('fb-api-key').value.trim();
  const projectId = document.getElementById('fb-project-id').value.trim();
  if (apiKey) localStorage.setItem('fb_api_key', apiKey);
  if (projectId) localStorage.setItem('fb_project_id', projectId);
  alert('✅ تم حفظ إعدادات الربط السحابي (Firebase) بنجاح!');
};


// Alias for quiz questions list rendering
window.renderAllQuestionsList = renderAllQuizQuestions;


// ==========================================
// INDEXEDDB MULTI-LAYER PERSISTENCE ENGINE
// ==========================================
const DB_NAME = 'BodyOrgansPlatformDB';
const DB_VERSION = 1;

function openOrgansDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function idbSave(key, val) {
  try {
    const db = await openOrgansDB();
    if (!db) return;
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key, val, updatedAt: Date.now() });
  } catch (e) {
    console.warn('idbSave error:', e);
  }
}

async function idbGet(key) {
  try {
    const db = await openOrgansDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const req = tx.objectStore('settings').get(key);
      req.onsuccess = () => resolve(req.result ? req.result.val : null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function syncFromIndexedDBToLocal() {
  try {
    const idbVer = await idbGet('yt_curated_schema_ver');
    if (idbVer !== YT_CURATED_SCHEMA_VERSION) {
      await idbSave('custom_organ_youtube_links', {});
      await idbSave('yt_curated_schema_ver', YT_CURATED_SCHEMA_VERSION);
    } else {
      const savedYt = localStorage.getItem('custom_organ_youtube_links');
      if (!savedYt || savedYt === '{}') {
        const idbYt = await idbGet('custom_organ_youtube_links');
        if (idbYt && typeof idbYt === 'object' && Object.keys(idbYt).length > 0) {
          localStorage.setItem('custom_organ_youtube_links', JSON.stringify(idbYt));
          console.log('Restored custom YouTube links from IndexedDB');
        }
      }
    }
    const savedQ = localStorage.getItem('custom_organ_questions');
    if (!savedQ || savedQ === '[]') {
      const idbQ = await idbGet('custom_organ_questions');
      if (Array.isArray(idbQ) && idbQ.length > 0) {
        localStorage.setItem('custom_organ_questions', JSON.stringify(idbQ));
        console.log('Restored custom questions from IndexedDB');
      }
    }
    const savedDel = localStorage.getItem('deleted_default_questions');
    if (!savedDel || savedDel === '[]') {
      const idbDel = await idbGet('deleted_default_questions');
      if (Array.isArray(idbDel) && idbDel.length > 0) {
        localStorage.setItem('deleted_default_questions', JSON.stringify(idbDel));
      }
    }
  } catch (e) {
    console.warn('syncFromIndexedDBToLocal error:', e);
  }
}

// Auto-sync on startup
if (typeof window !== 'undefined') {
  syncFromIndexedDBToLocal();
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}


// ==========================================
// ✨ SETUP PARTICIPANTS DROPDOWN INTERACTION
// ==========================================
function setupParticipantsDropdown() {
  const wrap = document.getElementById('participants-dropdown-wrap');
  if (!wrap) return;
  const btn = wrap.querySelector('.participants-trigger-btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      wrap.classList.toggle('active');
    });
  }
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) {
      wrap.classList.remove('active');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupParticipantsDropdown);
} else {
  setupParticipantsDropdown();
}
