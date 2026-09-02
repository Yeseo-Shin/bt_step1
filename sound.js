/**
 * sound.js - Web Audio API 기반 고음질 & 고출력 교실 전용 사운드 엔진
 * - 교실 소음을 뚫고 들리는 선명하고 튀는 고출력 사운드 (다이내믹 컴프레서 적용)
 * - 마지막 1분 짹깍짹깍(Tick-Tock) 선명한 시계 초침음
 * - 종소리, 실로폰, 팡파레, 뻐꾸기, 딩동 벨소리
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.compressor = null;
    this.masterGain = null;
    this.soundType = 'school_bell';
    this.volume = 1.0; // 기본 볼륨 최대화
    this.warningSoundEnabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // 교실용 다이내믹 컴프레서 (소리 뭉개짐 없이 볼륨과 음압을 극대화)
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume * 1.5, this.ctx.currentTime); // 볼륨 부스트

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSoundType(type) {
    this.soundType = type;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume * 1.5, this.ctx.currentTime);
    }
  }

  getOutput() {
    return this.compressor || this.ctx.destination;
  }

  // ================= 1. 마지막 1분: 선명하게 튀는 짹깍짹깍(Tick-Tock) 소리 =================
  playTickTock(isTock = false) {
    this.init();
    if (!this.ctx || this.volume <= 0) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const out = this.getOutput();

    // 짹(Tick: 2200Hz 맑고 날카로운 틱) vs 깍(Tock: 1500Hz 통통 튀는 톡)
    const baseFreq = isTock ? 1500 : 2200;

    // 1) 고주파 어택 오실레이터 (교실 소음을 뚫는 똑똑 끊어지는 소리)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, now + 0.035);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.85, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.045);

    // 2) 똑딱 공명 우드블록 톤
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(isTock ? 750 : 1100, now);
    osc2.frequency.exponentialRampToValueAtTime(isTock ? 350 : 550, now + 0.05);

    gain2.gain.setValueAtTime(0.6, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc2.connect(gain2);
    gain2.connect(out);

    osc2.start(now);
    osc2.stop(now + 0.06);
  }

  // 룰렛 회전 시 핀 걸림 짹깍 소리
  playRouletteTick() {
    this.init();
    if (!this.ctx || this.volume <= 0) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const out = this.getOutput();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // ================= 2. 1분 전 강력 알림 차임 (교실 집중용) =================
  play1MinWarning() {
    if (!this.warningSoundEnabled) return;
    this.init();
    if (!this.ctx || this.volume <= 0) return;

    // 높은 솔(G5) - 높은 도(C6) 튀는 전자 차임음
    const notes = [
      { f: 783.99, d: 0.18, delay: 0.0 },
      { f: 1046.50, d: 0.45, delay: 0.16 }
    ];

    notes.forEach(n => {
      this.playBrightTone(n.f, n.d, n.delay, 1.0);
    });
  }

  // 맑고 튀는 브라이트 신스 톤 생성 함수
  playBrightTone(freq, duration = 0.5, delay = 0, gainVal = 0.8) {
    this.init();
    if (!this.ctx || this.volume <= 0) return;

    const ctx = this.ctx;
    const now = ctx.currentTime + delay;
    const out = this.getOutput();

    // 톱니파 + 사각파 복합으로 교실 어디서든 튀는 쨍한 사운드
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 2, now); // 배음 추가

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.01);
    gain.gain.linearRampToValueAtTime(gainVal * 0.7, now + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(out);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  // 기본 단음 생성 (종/실로폰)
  playTone(freq, type = 'sine', duration = 0.5, delay = 0, gainVal = 0.8, instrument = 'bell') {
    this.init();
    if (!this.ctx || this.volume <= 0) return;

    const ctx = this.ctx;
    const now = ctx.currentTime + delay;
    const out = this.getOutput();

    const osc = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freq * 2.02, now); // 벨 특유의 금속성 쨍한 울림

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(out);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + duration + 0.05);
    oscHarmonic.stop(now + duration + 0.05);
  }

  // 1. 쨍하고 큰 학교 종소리 (딩동댕동 - 딩동댕동)
  playSchoolBell() {
    const notes = [
      { f: 523.25, d: 0.7, delay: 0.0 },   // 도
      { f: 659.25, d: 0.7, delay: 0.55 },  // 미
      { f: 587.33, d: 0.7, delay: 1.1 },   // 레
      { f: 392.00, d: 1.3, delay: 1.65 },  // 솔
      
      { f: 523.25, d: 0.7, delay: 2.6 },   // 도
      { f: 587.33, d: 0.7, delay: 3.15 },  // 레
      { f: 659.25, d: 0.7, delay: 3.7 },   // 미
      { f: 523.25, d: 1.8, delay: 4.25 }   // 도
    ];

    notes.forEach(n => {
      this.playTone(n.f, 'triangle', n.d, n.delay, 1.0, 'bell');
    });
  }

  // 2. 쨍하고 맑은 실로폰 멜로디 (고주파수 부스트)
  playXylophone() {
    const notes = [
      { f: 523.25, delay: 0.0 },
      { f: 659.25, delay: 0.18 },
      { f: 783.99, delay: 0.36 },
      { f: 1046.50, delay: 0.54 },
      { f: 1318.51, delay: 0.8 },
      { f: 1567.98, delay: 1.1 }
    ];

    notes.forEach(n => {
      this.playBrightTone(n.f, 0.75, n.delay, 1.0);
    });
  }

  // 3. 웅장하고 신나는 승리 팡파레
  playFanfare() {
    const notes = [
      { f: 523.25, d: 0.18, delay: 0.0 },
      { f: 523.25, d: 0.18, delay: 0.14 },
      { f: 523.25, d: 0.18, delay: 0.28 },
      { f: 659.25, d: 0.5,  delay: 0.42 },
      { f: 587.33, d: 0.2,  delay: 0.75 },
      { f: 659.25, d: 0.2,  delay: 0.9 },
      { f: 1046.50, d: 1.2, delay: 1.05 }
    ];

    notes.forEach(n => {
      this.playBrightTone(n.f, n.d, n.delay, 1.0);
    });
  }

  // 4. 쨍한 뻐꾸기 시계
  playCuckoo() {
    const pairs = [0, 0.75, 1.5];
    pairs.forEach(delay => {
      this.playBrightTone(987.77, 0.25, delay, 1.0);       // 뻐
      this.playBrightTone(783.99, 0.45, delay + 0.22, 1.0); // 꾹
    });
  }

  // 5. 시원하게 울리는 딩동 벨소리
  playDingDong() {
    this.playTone(880.00, 'triangle', 1.2, 0.0, 1.0, 'bell');  // 라
    this.playTone(739.99, 'triangle', 1.6, 0.35, 1.0, 'bell'); // 파#
  }

  // 시작 버튼음
  playStart() {
    this.playBrightTone(587.33, 0.15, 0.0, 0.8);
    this.playBrightTone(880.00, 0.25, 0.1, 0.9);
  }

  // 버튼 클릭음
  playClick() {
    this.playBrightTone(987.77, 0.08, 0.0, 0.6);
  }

  // 타이머 종료 알람
  playAlarmEnd() {
    switch (this.soundType) {
      case 'school_bell':
        this.playSchoolBell();
        break;
      case 'xylophone':
        this.playXylophone();
        break;
      case 'fanfare':
        this.playFanfare();
        break;
      case 'cuckoo':
        this.playCuckoo();
        break;
      case 'dingdong':
        this.playDingDong();
        break;
      default:
        this.playSchoolBell();
    }
  }
}

window.soundEngine = new SoundEngine();
