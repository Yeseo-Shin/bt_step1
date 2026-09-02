/**
 * confetti.js - 쉬는 시간 종료 및 축하용 파티클 / 컨페티 효과 엔진
 */

class ConfettiEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.colors = ['#FF6B8B', '#FFD166', '#06D6A0', '#118AB2', '#8338EC', '#FF9F1C', '#48CAE4', '#FF99C8'];
  }

  init(canvasId = 'confetti-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start(durationMs = 4500) {
    if (!this.canvas) return;
    this.stop();
    this.resize();

    // 150개의 다양한 형태(하트, 리본, 사각형, 별) 파티클 생성
    const particleCount = 140;
    this.particles = [];

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: this.canvas.width * (0.2 + Math.random() * 0.6),
        y: this.canvas.height * 0.4 + Math.random() * 50,
        size: Math.random() * 12 + 6,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        vx: (Math.random() - 0.5) * 18,
        vy: -Math.random() * 16 - 5,
        gravity: 0.38 + Math.random() * 0.15,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: ['rect', 'circle', 'star', 'heart'][Math.floor(Math.random() * 4)],
        scaleX: 1,
        scaleSpeed: Math.random() * 0.1
      });
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let aliveCount = 0;

      for (let p of this.particles) {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.98; // 공기 저항
        p.scaleX = Math.sin(currentTime * 0.005 + p.x);

        if (elapsed > durationMs - 1500) {
          p.opacity = Math.max(0, (durationMs - elapsed) / 1500);
        }

        if (p.opacity > 0 && p.y < this.canvas.height + 50) {
          aliveCount++;
          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);
          this.ctx.scale(p.scaleX, 1);
          this.ctx.globalAlpha = p.opacity;
          this.ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          } else if (p.shape === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
          } else if (p.shape === 'star') {
            this.drawStar(this.ctx, 0, 0, 5, p.size, p.size / 2);
          } else if (p.shape === 'heart') {
            this.drawHeart(this.ctx, 0, 0, p.size);
          }
          this.ctx.restore();
        }
      }

      if (elapsed < durationMs && aliveCount > 0) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.stop();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  drawHeart(ctx, x, y, size) {
    const s = size * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y + s / 4);
    ctx.quadraticCurveTo(x, y, x - s / 2, y);
    ctx.quadraticCurveTo(x - s, y, x - s, y + s / 2);
    ctx.quadraticCurveTo(x - s, y + s, x, y + s * 1.5);
    ctx.quadraticCurveTo(x + s, y + s, x + s, y + s / 2);
    ctx.quadraticCurveTo(x + s, y, x + s / 2, y);
    ctx.quadraticCurveTo(x, y, x, y + s / 4);
    ctx.fill();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

window.confettiEngine = new ConfettiEngine();
