/**
 * StarField — lightweight canvas-based animated star background.
 * Used in the Hero section to replicate the space-themed aesthetic.
 * No external dependencies; pure requestAnimationFrame loop.
 */
import { useEffect, useRef } from "react";

interface Star {
  x: number;      // 0-1 relative
  y: number;      // 0-1 relative
  r: number;      // radius px
  base: number;   // base opacity
  speed: number;  // twinkle speed
  phase: number;  // twinkle phase offset
}

export default function StarField({ count = 130 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fit canvas to container
    const fit = () => {
      canvas.width  = canvas.offsetWidth  * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    // Generate stars
    const stars: Star[] = Array.from({ length: count }, () => ({
      x:     Math.random(),
      y:     Math.random(),
      r:     Math.random() * 1.2 + 0.2,
      base:  Math.random() * 0.55 + 0.15,
      speed: Math.random() * 0.018 + 0.004,
      phase: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    let raf: number;

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      frame++;

      for (const s of stars) {
        const twinkle = Math.sin(frame * s.speed + s.phase) * 0.18;
        const alpha   = Math.max(0, Math.min(1, s.base + twinkle));
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 235, 255, ${alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
