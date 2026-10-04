(function () {
      const canvas = document.getElementById('heroConfetti');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const host = canvas.parentElement;
      let W = 0, H = 0, raf = 0, running = true;

      // brand palette — orange, gold, deep orange, brand blues, white
      const COLORS = ['#f7931a', '#ffd166', '#ff8a2b', '#ef7f12', '#33b2f0', '#1c86d6', '#ffffff'];
      const TYPES = ['rect', 'ribbon', 'strip'];

      function resize() {
        W = host.clientWidth; H = host.clientHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function rand(a, b) { return a + Math.random() * (b - a); }

      function makePiece(initial) {
        const type = TYPES[(Math.random() * TYPES.length) | 0];
        return {
          type,
          x: rand(0, W),
          y: initial ? rand(-H, H) : rand(-40, -10),
          w: type === 'ribbon' ? rand(7, 12) : rand(5, 11),
          h: type === 'strip' ? rand(14, 26) : rand(6, 12),
          color: COLORS[(Math.random() * COLORS.length) | 0],
          rot: rand(0, Math.PI * 2),
          spin: rand(-0.09, 0.09),
          vy: rand(0.5, 1.5),
          sway: rand(0.6, 1.6),
          swayPhase: rand(0, Math.PI * 2),
          swaySpeed: rand(0.01, 0.03),
          flip: rand(0.5, 1),
          opacity: rand(0.55, 0.95)
        };
      }

      let pieces = [];
      function seed() {
        const count = Math.max(26, Math.min(64, Math.round(W / 22)));
        pieces = Array.from({ length: count }, () => makePiece(true));
      }

      function drawPiece(p) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // vertical scale to fake spinning/tumbling in 3D
        const sc = Math.cos(p.swayPhase * 2) * 0.5 + 0.5;
        ctx.scale(1, 0.4 + sc * 0.6);
        ctx.fillStyle = p.color;
        if (p.type === 'ribbon') {
          // curled ribbon — a short quadratic arc stroke
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.w * 0.55;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-p.h * 0.6, 0);
          ctx.quadraticCurveTo(0, -p.h * 0.9, p.h * 0.6, 0);
          ctx.stroke();
        } else if (p.type === 'strip') {
          roundRect(-p.w / 2, -p.h / 2, p.w, p.h, p.w * 0.4);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }

      function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }

      function tick() {
        if (!running) return;
        ctx.clearRect(0, 0, W, H);
        for (const p of pieces) {
          p.swayPhase += p.swaySpeed;
          p.y += p.vy;
          p.x += Math.sin(p.swayPhase) * p.sway;
          p.rot += p.spin;
          if (p.y > H + 40) {
            Object.assign(p, makePiece(false));
          }
          drawPiece(p);
        }
        raf = requestAnimationFrame(tick);
      }

      function start() { if (!raf) { running = true; raf = requestAnimationFrame(tick); } }
      function stop() { running = false; cancelAnimationFrame(raf); raf = 0; }

      resize(); seed();
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();

      window.addEventListener('resize', () => { resize(); seed(); });
      // pause when hero scrolled out of view to save CPU
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((ents) => {
          ents.forEach(e => e.isIntersecting ? start() : stop());
        }, { threshold: 0 }).observe(host);
      }
    })();
