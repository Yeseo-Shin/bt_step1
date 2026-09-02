/**
 * ladder.js - 사다리 타기 게임 엔진 (사용자 직접 이름 입력 & 동물 아이콘 & 명확한 매칭)
 */

class LadderGame {
  constructor() {
    this.count = 6;
    this.minCount = 2;
    this.maxCount = 25;
    
    this.animals = [
      { defaultName: '강아지', icon: '🐶', color: '#FF6B6B' },
      { defaultName: '고양이', icon: '🐱', color: '#4DABF7' },
      { defaultName: '곰돌이', icon: '🐻', color: '#FF922B' },
      { defaultName: '토끼', icon: '🐰', color: '#F06595' },
      { defaultName: '여우', icon: '🦊', color: '#FA5252' },
      { defaultName: '판다', icon: '🐼', color: '#20C997' },
      { defaultName: '코알라', icon: '🐨', color: '#845EF7' },
      { defaultName: '사자', icon: '🦁', color: '#FCC419' },
      { defaultName: '호랑이', icon: '🐯', color: '#FD7E14' },
      { defaultName: '개구리', icon: '🐸', color: '#51CF66' },
      { defaultName: '원숭이', icon: '🐵', color: '#A9E34B' },
      { defaultName: '햄스터', icon: '🐹', color: '#FFD43B' },
      { defaultName: '펭귄', icon: '🐧', color: '#339AF0' },
      { defaultName: '병아리', icon: '🐥', color: '#FAB005' },
      { defaultName: '유니콘', icon: '🦄', color: '#CC5DE8' },
      { defaultName: '코끼리', icon: '🐘', color: '#748FFC' },
      { defaultName: '기린', icon: '🦒', color: '#FFA94D' },
      { defaultName: '고슴도치', icon: '🦔', color: '#82C91E' },
      { defaultName: '돌고래', icon: '🐬', color: '#22B8CF' },
      { defaultName: '물개', icon: '🦭', color: '#495057' },
      { defaultName: '부엉이', icon: '🦉', color: '#862E9C' },
      { defaultName: '너구리', icon: '🦝', color: '#5C7CFA' },
      { defaultName: '다람쥐', icon: '🐿️', color: '#E8590C' },
      { defaultName: '나무늘보', icon: '🦥', color: '#69DB7C' },
      { defaultName: '꿀벌', icon: '🐝', color: '#F59F00' }
    ];

    // 사용자가 입력한 참여자 이름 배열
    this.customNames = ['참여자 1', '참여자 2', '참여자 3', '참여자 4', '참여자 5', '참여자 6'];

    this.rungs = [];
    this.results = [];
    this.paths = [];
    this.completed = [];
    this.isAnimating = false;

    this.canvas = null;
    this.ctx = null;
    this.modal = null;
  }

  init(modalId = 'ladder-modal') {
    this.modal = document.getElementById(modalId);
    this.canvas = document.getElementById('ladder-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    this.bindEvents();
  }

  bindEvents() {
    const btnClose = document.getElementById('btn-ladder-close');
    const btnLadderModal = document.getElementById('btn-ladder-game');
    const inputCount = document.getElementById('ladder-count-input');
    const btnMinus = document.getElementById('btn-ladder-minus');
    const btnPlus = document.getElementById('btn-ladder-plus');
    const btnShuffle = document.getElementById('btn-ladder-shuffle');
    const btnRevealAll = document.getElementById('btn-ladder-reveal-all');

    if (btnLadderModal) {
      btnLadderModal.addEventListener('click', () => this.openModal());
    }
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeModal());
    }

    if (inputCount) {
      inputCount.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        val = Math.max(this.minCount, Math.min(this.maxCount, isNaN(val) ? 6 : val));
        this.setCount(val);
      });
    }

    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        if (this.count > this.minCount) this.setCount(this.count - 1);
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        if (this.count < this.maxCount) this.setCount(this.count + 1);
      });
    }

    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playClick();
        this.generateLadder();
      });
    }

    if (btnRevealAll) {
      btnRevealAll.addEventListener('click', () => this.revealAll());
    }

    window.addEventListener('resize', () => {
      if (this.modal && this.modal.classList.contains('open')) {
        this.render();
      }
    });
  }

  openModal() {
    if (this.modal) {
      this.modal.classList.add('open');
      this.setCount(this.count);
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove('open');
    }
  }

  getName(index) {
    if (this.customNames[index] && this.customNames[index].trim() !== '') {
      return this.customNames[index];
    }
    return `참여자 ${index + 1}`;
  }

  setCount(newCount) {
    this.count = Math.max(this.minCount, Math.min(this.maxCount, newCount));
    const inputCount = document.getElementById('ladder-count-input');
    if (inputCount) inputCount.value = this.count;

    // 이름 배열 크기 동기화
    while (this.customNames.length < this.count) {
      this.customNames.push(`참여자 ${this.customNames.length + 1}`);
    }

    this.generateLadder();
  }

  generateLadder() {
    this.completed = new Array(this.count).fill(false);
    this.isAnimating = false;

    // 1. 하단 무작위 번호 (1 ~ count 번호 셔플)
    const nums = [];
    for (let i = 1; i <= this.count; i++) nums.push(i);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    this.results = nums;

    // 2. 가로 다리 생성
    const steps = 14;
    this.rungs = [];

    for (let level = 1; level < steps; level++) {
      for (let col = 0; col < this.count - 1; col++) {
        const prevHasRung = this.rungs.some(r => r.level === level && r.col === col - 1);
        if (!prevHasRung && Math.random() < 0.42) {
          this.rungs.push({ col, level });
        }
      }
    }

    for (let col = 0; col < this.count - 1; col++) {
      const hasAny = this.rungs.some(r => r.col === col);
      if (!hasAny) {
        const randomLevel = Math.floor(Math.random() * (steps - 2)) + 1;
        this.rungs.push({ col, level: randomLevel });
      }
    }

    // 3. 경로 계산
    this.calculatePaths(steps);

    // 4. 렌더링
    this.render();
  }

  calculatePaths(steps) {
    this.paths = [];
    for (let startCol = 0; startCol < this.count; startCol++) {
      let currentCol = startCol;
      const waypoints = [{ col: currentCol, level: 0 }];

      for (let level = 1; level <= steps; level++) {
        const rightRung = this.rungs.find(r => r.level === level && r.col === currentCol);
        const leftRung = this.rungs.find(r => r.level === level && r.col === currentCol - 1);

        if (rightRung) {
          waypoints.push({ col: currentCol, level: level });
          currentCol = currentCol + 1;
          waypoints.push({ col: currentCol, level: level });
        } else if (leftRung) {
          waypoints.push({ col: currentCol, level: level });
          currentCol = currentCol - 1;
          waypoints.push({ col: currentCol, level: level });
        }
      }

      waypoints.push({ col: currentCol, level: steps + 1 });
      this.paths.push({
        startCol,
        animal: this.animals[startCol % this.animals.length],
        endCol: currentCol,
        resultNumber: this.results[currentCol],
        waypoints
      });
    }
  }

  render() {
    const topRow = document.getElementById('ladder-top-row');
    const bottomRow = document.getElementById('ladder-bottom-row');
    const summaryList = document.getElementById('ladder-summary-list');
    if (!topRow || !bottomRow || !this.canvas) return;

    // 1. 상단 동물 아이콘 + 이름 직접 입력 필드
    topRow.innerHTML = '';
    for (let i = 0; i < this.count; i++) {
      const animal = this.animals[i % this.animals.length];
      const item = document.createElement('div');
      item.className = 'ladder-animal-chip' + (this.completed[i] ? ' completed' : '');
      item.style.borderColor = animal.color;
      
      item.innerHTML = `
        <div class="ladder-animal-icon-btn" title="클릭하면 사다리를 탑니다!">${animal.icon}</div>
        <input type="text" class="ladder-name-input" value="${escapeHtml(this.getName(i))}" placeholder="이름" maxlength="7" title="이름을 직접 수정할 수 있습니다" />
      `;

      // 동물 아이콘 클릭 시 사다리 출발
      const iconBtn = item.querySelector('.ladder-animal-icon-btn');
      iconBtn.addEventListener('click', () => this.playAnimal(i));

      // 이름 입력창 수정 이벤트
      const inputEl = item.querySelector('.ladder-name-input');
      inputEl.addEventListener('click', (e) => e.stopPropagation());
      inputEl.addEventListener('input', (e) => {
        this.customNames[i] = e.target.value.trim() || `참여자 ${i + 1}`;
        this.updateSummaryOnly();
      });

      topRow.appendChild(item);
    }

    // 2. 하단 결과 상자 (입력한 이름 + 동물 아이콘 + 번호)
    bottomRow.innerHTML = '';
    for (let i = 0; i < this.count; i++) {
      const item = document.createElement('div');
      item.className = 'ladder-result-box';
      item.id = `ladder-res-${i}`;

      const matchedPath = this.paths.find(p => p.endCol === i && this.completed[p.startCol]);
      if (matchedPath) {
        const participantName = this.getName(matchedPath.startCol);
        item.classList.add('revealed');
        item.style.backgroundColor = matchedPath.animal.color;
        item.style.borderColor = matchedPath.animal.color;
        item.innerHTML = `
          <span class="res-name">${matchedPath.animal.icon} ${escapeHtml(participantName)}</span>
          <span style="font-weight: 800; font-size: 1.15rem; color: #FFF;">👉 ${matchedPath.resultNumber}번</span>
        `;
      } else {
        item.innerHTML = `<span>?</span>`;
      }
      bottomRow.appendChild(item);
    }

    // 3. 하단 결과 요약 패널
    this.updateSummaryOnly();

    // 4. 캔버스 그리기
    this.drawLadderCanvas();
  }

  updateSummaryOnly() {
    const summaryList = document.getElementById('ladder-summary-list');
    if (!summaryList) return;

    summaryList.innerHTML = '';
    let anyCompleted = false;

    this.paths.forEach((p, idx) => {
      if (this.completed[idx]) {
        anyCompleted = true;
        const participantName = this.getName(p.startCol);
        const badge = document.createElement('div');
        badge.className = 'ladder-summary-badge';
        badge.style.borderColor = p.animal.color;
        badge.innerHTML = `
          <span>${p.animal.icon} <b>${escapeHtml(participantName)}</b></span>
          <span>➔</span>
          <span class="badge-num" style="background:${p.animal.color};">${p.resultNumber}번</span>
        `;
        summaryList.appendChild(badge);
      }
    });

    if (!anyCompleted) {
      summaryList.innerHTML = `<span style="color:#94A3B8; font-size:0.95rem;">동물을 클릭하면 매칭 결과가 여기에 차례대로 기록됩니다 🐾 (이름을 직접 수정해보세요!)</span>`;
    }
  }

  drawLadderCanvas(activePath = null, activeProgress = 0) {
    if (!this.canvas || !this.ctx) return;

    const boardWrapper = document.getElementById('ladder-canvas-wrap');
    if (!boardWrapper) return;

    const width = boardWrapper.clientWidth || 600;
    const height = boardWrapper.clientHeight || 300;
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    const colWidth = width / this.count;
    const steps = 14;
    const rowHeight = height / (steps + 1);

    // 세로선
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < this.count; i++) {
      const x = colWidth * i + colWidth / 2;
      ctx.strokeStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x, height - 8);
      ctx.stroke();
    }

    // 가로 다리
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#94A3B8';
    for (let rung of this.rungs) {
      const x1 = colWidth * rung.col + colWidth / 2;
      const x2 = colWidth * (rung.col + 1) + colWidth / 2;
      const y = rowHeight * rung.level;

      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }

    // 완료된 경로들
    for (let i = 0; i < this.count; i++) {
      if (this.completed[i] && (!activePath || activePath.startCol !== i)) {
        this.drawPathTrace(this.paths[i], 1.0, this.animals[i % this.animals.length].color, 0.45);
      }
    }

    // 진행 중인 경로
    if (activePath) {
      const animal = this.animals[activePath.startCol % this.animals.length];
      this.drawPathTrace(activePath, activeProgress, animal.color, 1.0);
    }
  }

  drawPathTrace(pathObj, progress, color, alpha = 1.0) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const colWidth = width / this.count;
    const steps = 14;
    const rowHeight = height / (steps + 1);

    const pts = pathObj.waypoints.map(wp => ({
      x: colWidth * wp.col + colWidth / 2,
      y: wp.level === 0 ? 8 : (wp.level === steps + 1 ? height - 8 : rowHeight * wp.level)
    }));

    if (pts.length < 2) return;

    let totalLength = 0;
    const segLengths = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const dist = Math.hypot(pts[i+1].x - pts[i].x, pts[i+1].y - pts[i].y);
      segLengths.push(dist);
      totalLength += dist;
    }

    const targetLength = totalLength * progress;
    let currentLength = 0;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = alpha === 1.0 ? 6 : 4;
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = alpha === 1.0 ? 10 : 0;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    let lastX = pts[0].x;
    let lastY = pts[0].y;

    for (let i = 0; i < pts.length - 1; i++) {
      const segLen = segLengths[i];
      if (currentLength + segLen <= targetLength) {
        ctx.lineTo(pts[i+1].x, pts[i+1].y);
        lastX = pts[i+1].x;
        lastY = pts[i+1].y;
        currentLength += segLen;
      } else {
        const remain = targetLength - currentLength;
        const ratio = segLen > 0 ? remain / segLen : 0;
        lastX = pts[i].x + (pts[i+1].x - pts[i].x) * ratio;
        lastY = pts[i].y + (pts[i+1].y - pts[i].y) * ratio;
        ctx.lineTo(lastX, lastY);
        break;
      }
    }
    ctx.stroke();

    if (alpha === 1.0 && progress < 1.0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  playAnimal(index) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const path = this.paths[index];
    const duration = 1500;
    const startTime = performance.now();

    if (window.soundEngine) {
      window.soundEngine.playTone(587.33, 'sine', 0.15, 0, 0.6, 'marimba');
    }

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);

      this.drawLadderCanvas(path, progress);

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        this.completed[index] = true;
        this.render();

        if (window.soundEngine) {
          window.soundEngine.playFanfare();
        }
        if (window.confettiEngine) {
          window.confettiEngine.start(2500);
        }
      }
    };

    requestAnimationFrame(animate);
  }

  revealAll() {
    if (this.isAnimating) return;
    for (let i = 0; i < this.count; i++) {
      this.completed[i] = true;
    }
    this.render();
    if (window.soundEngine) window.soundEngine.playFanfare();
    if (window.confettiEngine) window.confettiEngine.start(3500);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.ladderGame = new LadderGame();
