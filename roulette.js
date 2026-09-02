/**
 * roulette.js - 대형 룰렛 뽑기 엔진 (사용자 지정 리스트, 랜덤 섞기, 당첨 항목 제거, 시각/효과음 연출)
 */

class RouletteGame {
  constructor() {
    this.items = [
      '1번', '2번', '3번', '4번', '5번', '6번', 
      '7번', '8번', '9번', '10번', '11번', '12번'
    ];

    this.colors = [
      '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', 
      '#EF4444', '#EC4899', '#06B6D4', '#84CC16', 
      '#6366F1', '#F97316', '#14B8A6', '#A855F7'
    ];

    this.currentAngle = 0; // 라디안
    this.isSpinning = false;
    this.lastWinningIndex = -1;
    this.lastPegIndex = -1;

    this.canvas = null;
    this.ctx = null;
    this.modal = null;
    this.textarea = null;
  }

  init(modalId = 'roulette-modal') {
    this.modal = document.getElementById(modalId);
    this.canvas = document.getElementById('roulette-canvas');
    this.textarea = document.getElementById('roulette-items-input');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    this.bindEvents();
    this.syncTextarea();
    this.render();
  }

  bindEvents() {
    const btnOpen = document.getElementById('btn-roulette-open');
    const btnClose = document.getElementById('btn-roulette-close');
    const btnSpin = document.getElementById('btn-roulette-spin');
    const btnCenterSpin = document.getElementById('roulette-center-btn');
    const btnShuffle = document.getElementById('btn-roulette-shuffle');
    const btnApplyItems = document.getElementById('btn-roulette-apply-items');
    const btnClear = document.getElementById('btn-roulette-clear');
    const btnPresetNums = document.getElementById('preset-nums-25');
    const btnPresetCleaning = document.getElementById('preset-cleaning');
    const btnPresetSnack = document.getElementById('preset-snack');

    // 모달 열기 / 닫기
    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.openModal());
    }
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeModal());
    }

    // 회전 시작
    if (btnSpin) {
      btnSpin.addEventListener('click', () => this.spin());
    }
    if (btnCenterSpin) {
      btnCenterSpin.addEventListener('click', () => this.spin());
    }

    // 항목 섞기
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => this.shuffleItems());
    }

    // 텍스트 입력창에서 항목 적용
    if (btnApplyItems && this.textarea) {
      btnApplyItems.addEventListener('click', () => this.applyTextareaItems());
    }

    // 전체 비우기
    if (btnClear && this.textarea) {
      btnClear.addEventListener('click', () => {
        this.items = ['당첨 1', '당첨 2'];
        this.syncTextarea();
        this.render();
        if (window.soundEngine) window.soundEngine.playClick();
      });
    }

    // 프리셋 버튼들
    if (btnPresetNums) {
      btnPresetNums.addEventListener('click', () => {
        const nums = [];
        for (let i = 1; i <= 25; i++) nums.push(`${i}번 학생`);
        this.items = nums;
        this.syncTextarea();
        this.render();
        if (window.soundEngine) window.soundEngine.playClick();
      });
    }

    if (btnPresetCleaning) {
      btnPresetCleaning.addEventListener('click', () => {
        this.items = ['칠판 닦기 🧹', '창문 닦기 🪟', '바닥 쓸기 🧼', '쓰레기통 비우기 🗑️', '책상 줄맞추기 ✨', '우유 급식 도우미 🥛'];
        this.syncTextarea();
        this.render();
        if (window.soundEngine) window.soundEngine.playClick();
      });
    }

    if (btnPresetSnack) {
      btnPresetSnack.addEventListener('click', () => {
        this.items = ['⭐ 대박 당첨!', '꽝! 다음 기회에', '🍬 달콤한 사탕', '🍫 초콜릿', '🍪 맛있는 과자', '🎉 한 번 더 돌리기!'];
        this.syncTextarea();
        this.render();
        if (window.soundEngine) window.soundEngine.playClick();
      });
    }

    // 창 크기 변경 시 룰렛 다시 그리기
    window.addEventListener('resize', () => {
      if (this.modal && this.modal.classList.contains('open')) {
        this.render();
      }
    });

    // 당첨 팝업 내 버튼 이벤트
    const btnRemoveWinner = document.getElementById('btn-winner-remove');
    const btnWinnerClose = document.getElementById('btn-winner-close');

    if (btnRemoveWinner) {
      btnRemoveWinner.addEventListener('click', () => {
        this.removeLastWinner();
        this.hideWinnerPopup();
      });
    }

    if (btnWinnerClose) {
      btnWinnerClose.addEventListener('click', () => {
        this.hideWinnerPopup();
      });
    }
  }

  openModal() {
    if (this.modal) {
      this.modal.classList.add('open');
      this.syncTextarea();
      setTimeout(() => this.render(), 50);
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove('open');
      this.hideWinnerPopup();
    }
  }

  syncTextarea() {
    if (this.textarea) {
      this.textarea.value = this.items.join('\n');
    }
    const countBadge = document.getElementById('roulette-item-count');
    if (countBadge) {
      countBadge.textContent = `${this.items.length}개 항목`;
    }
  }

  applyTextareaItems() {
    if (!this.textarea) return;
    const lines = this.textarea.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length < 2) {
      alert('룰렛을 돌리기 위해 최소 2개 이상의 항목을 입력해주세요!');
      return;
    }

    this.items = lines;
    this.syncTextarea();
    this.render();
    if (window.soundEngine) window.soundEngine.playClick();
  }

  shuffleItems() {
    if (this.isSpinning) return;
    for (let i = this.items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
    }
    this.syncTextarea();
    this.render();
    if (window.soundEngine) window.soundEngine.playClick();
  }

  removeLastWinner() {
    if (this.lastWinningIndex >= 0 && this.lastWinningIndex < this.items.length) {
      this.items.splice(this.lastWinningIndex, 1);
      if (this.items.length < 2) {
        this.items.push('새 항목');
      }
      this.lastWinningIndex = -1;
      this.syncTextarea();
      this.render();
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  // ================= 룰렛 회전 물리 엔진 =================
  spin() {
    if (this.isSpinning || this.items.length < 2) return;
    this.isSpinning = true;
    this.hideWinnerPopup();

    const btnSpin = document.getElementById('btn-roulette-spin');
    const btnCenter = document.getElementById('roulette-center-btn');
    if (btnSpin) btnSpin.disabled = true;
    if (btnCenter) btnCenter.classList.add('spinning');

    // 5바퀴 ~ 9바퀴 사이 무작위 회전 각도
    const minSpins = 5;
    const maxSpins = 8;
    const extraRounds = (minSpins + Math.random() * (maxSpins - minSpins)) * Math.PI * 2;
    const randomAngle = Math.random() * Math.PI * 2;
    const totalRotation = extraRounds + randomAngle;

    const startAngle = this.currentAngle;
    const targetAngle = startAngle + totalRotation;
    const duration = 4800; // 4.8초 회전
    const startTime = performance.now();

    this.lastPegIndex = -1;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);

      // 부드러운 5차 감속 곡선 (Ease-Out-Quint)
      const easeOut = 1 - Math.pow(1 - progress, 4.5);
      this.currentAngle = startAngle + (targetAngle - startAngle) * easeOut;

      // 핀을 지날 때마다 짹깍 튀는 사운드 연출
      this.checkPegTick();

      this.render();

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        if (btnSpin) btnSpin.disabled = false;
        if (btnCenter) btnCenter.classList.remove('spinning');

        // 당첨 항목 계산
        const winnerIndex = this.calculateWinnerIndex();
        this.lastWinningIndex = winnerIndex;
        const winnerText = this.items[winnerIndex];

        // 당첨 연출
        this.showWinnerPopup(winnerText);
      }
    };

    requestAnimationFrame(animate);
  }

  checkPegTick() {
    const numSlices = this.items.length;
    const sliceAngle = (Math.PI * 2) / numSlices;
    
    // 상단 12시 방향(또는 3시 방향 핀) 기준 각도
    const normalizedAngle = (this.currentAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const currentPeg = Math.floor(normalizedAngle / sliceAngle);

    if (currentPeg !== this.lastPegIndex) {
      this.lastPegIndex = currentPeg;
      if (window.soundEngine) {
        window.soundEngine.playRouletteTick();
      }
    }
  }

  calculateWinnerIndex() {
    const numSlices = this.items.length;
    const sliceAngle = (Math.PI * 2) / numSlices;
    
    // 룰렛 상단 핀(12시 방향 = -Math.PI / 2)에 멈춘 조각 계산
    const normalizedAngle = (this.currentAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    
    // 12시 방향 기준 각도
    let pointerAngle = (Math.PI * 1.5 - normalizedAngle) % (Math.PI * 2);
    if (pointerAngle < 0) pointerAngle += Math.PI * 2;

    const winnerIndex = Math.floor(pointerAngle / sliceAngle) % numSlices;
    return winnerIndex;
  }

  showWinnerPopup(winnerText) {
    const popup = document.getElementById('roulette-winner-popup');
    const textEl = document.getElementById('winner-result-text');
    if (popup && textEl) {
      textEl.textContent = winnerText;
      popup.classList.add('show');
    }

    if (window.soundEngine) {
      window.soundEngine.playFanfare();
    }
    if (window.confettiEngine) {
      window.confettiEngine.start(4000);
    }
  }

  hideWinnerPopup() {
    const popup = document.getElementById('roulette-winner-popup');
    if (popup) {
      popup.classList.remove('show');
    }
  }

  // ================= 룰렛 캔버스 렌더링 =================
  render() {
    if (!this.canvas || !this.ctx) return;

    const container = document.getElementById('roulette-wheel-wrapper');
    if (!container) return;

    const size = Math.min(container.clientWidth, container.clientHeight) || 460;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 16;
    const numSlices = this.items.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // 1. 바깥쪽 화려한 룰렛 프레임 (금빛/연보라 링 + 반짝이 전구들)
    ctx.save();
    ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#7C3AED';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#DDD6FE';
    ctx.fill();

    // 2. 조각별 부채꼴 및 텍스트 렌더링
    for (let i = 0; i < numSlices; i++) {
      const startAngle = this.currentAngle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const color = this.colors[i % this.colors.length];

      // 조각 부채꼴
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // 조각 내 텍스트 렌더링 (원 중심에서 바깥 방향으로 회전 배치)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      
      // 글자 크기 동적 계산 (항목 수와 길이에 맞춤)
      const fontSize = numSlices > 16 ? 13 : (numSlices > 10 ? 15 : 18);
      ctx.font = `bold ${fontSize}px "Jua", "Gowun Dodum", sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 4;

      // 텍스트 자르기 (너무 긴 경우 말줄임표)
      let text = this.items[i];
      if (text.length > 9) {
        text = text.substring(0, 8) + '..';
      }

      ctx.fillText(text, radius - 18, 0);
      ctx.restore();
    }

    // 3. 룰렛 테두리 전구들
    const numBulbs = Math.max(16, numSlices * 2);
    for (let i = 0; i < numBulbs; i++) {
      const angle = (Math.PI * 2 / numBulbs) * i;
      const bx = centerX + (radius + 6) * Math.cos(angle);
      const by = centerY + (radius + 6) * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#FBBF24' : '#FFFFFF';
      ctx.fill();
    }

    // 4. 중앙 허브 (장식용 원)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#F5F0FF';
    ctx.fill();

    ctx.restore();
  }
}

window.rouletteGame = new RouletteGame();
