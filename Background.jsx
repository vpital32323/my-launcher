import { useEffect, useMemo, useRef } from 'react';

// Детерминированный генератор: пейзаж всегда выглядит одинаково
function rng(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Силуэт холмов: плавная линия от -100 до 1700 по X (запас для параллакса)
function hills(seed, base, amp) {
  const r = rng(seed);
  const step = 90;
  const pts = [];
  for (let x = -100; x <= 1700; x += step) pts.push([x, base - r() * amp]);
  let d = `M-100 600 L${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1][0] + pts[i][0]) / 2;
    const my = (pts[i - 1][1] + pts[i][1]) / 2;
    d += ` Q${pts[i - 1][0]} ${pts[i - 1][1]} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L${last[0]} ${last[1]} L1700 600 Z`;
  return d;
}

// Акация в саванне: ствол + плоская крона
function Acacia({ x, y, s, fill }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <path d="M-3 0 L-1 -40 L-18 -58 L-14 -61 L0 -48 L14 -63 L18 -59 L2 -38 L4 0 Z" />
      <ellipse cx="0" cy="-67" rx="46" ry="11" />
      <ellipse cx="-27" cy="-60" rx="26" ry="8" />
      <ellipse cx="29" cy="-61" rx="24" ry="8" />
    </g>
  );
}

export default function Background() {
  const canvasRef = useRef(null);

  const land = useMemo(
    () => ({
      far: hills(7, 420, 70),
      mid: hills(21, 480, 60),
      near: hills(53, 545, 40)
    }),
    []
  );

  // светлячки
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const flies = Array.from({ length: 46 }, () => ({
      x: Math.random() * w,
      y: h * 0.35 + Math.random() * h * 0.65,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -(Math.random() * 0.22 + 0.04),
      ph: Math.random() * Math.PI * 2
    }));

    const tick = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of flies) {
        p.x += p.vx + Math.sin(t / 1800 + p.ph) * 0.12;
        p.y += p.vy;
        if (p.y < h * 0.25) {
          p.y = h + 6;
          p.x = Math.random() * w;
        }
        if (p.x < -6) p.x = w + 6;
        if (p.x > w + 6) p.x = -6;
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t / 700 + p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 214, 160, ${a})`;
        ctx.shadowColor = 'rgba(255, 190, 120, 0.9)';
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="scene" aria-hidden="true">
      <div className="sky" />
      <div className="sun" />

      <svg className="land" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice">
        <g className="layer l1">
          <path d={land.far} fill="#5a2f78" opacity="0.8" />
        </g>
        <g className="layer l2">
          <path d={land.mid} fill="#331a58" />
          <Acacia x={260} y={492} s={0.9} fill="#331a58" />
          <Acacia x={980} y={486} s={0.75} fill="#331a58" />
          <Acacia x={1350} y={496} s={1} fill="#331a58" />
        </g>
        <g className="layer l3">
          <path d={land.near} fill="#170c30" />
          <Acacia x={120} y={560} s={1.5} fill="#170c30" />
          <Acacia x={640} y={556} s={1.1} fill="#170c30" />
          <Acacia x={1180} y={562} s={1.7} fill="#170c30" />
          <Acacia x={1500} y={552} s={1.2} fill="#170c30" />
        </g>
      </svg>

      <div className="vignette" />
      <canvas ref={canvasRef} className="particles" />
    </div>
  );
}
