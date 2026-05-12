/**
 * StarField — canvas-based animated star background.
 *
 * Features:
 *  - Multi-layer depth: stars have different sizes / parallax factors.
 *  - Scroll parallax: large (near) stars move faster than small (far) ones,
 *    giving a genuine sense of traveling through space.
 *  - Continuous horizontal drift: very slow, varies by depth.
 *  - Twinkle: subtle opacity oscillation per star.
 *  - position: fixed — covers the full viewport at all times, behind all content.
 */
import { useEffect, useRef } from "react";

interface Star {
  x:        number;  // 0-1  base relative X (wraps)
  y:        number;  // 0-1  base relative Y (wraps)
  r:        number;  // radius in px
  base:     number;  // base opacity
  twSpeed:  number;  // twinkle oscillation speed
  twPhase:  number;  // twinkle phase offset
  parallax: number;  // px of vertical shift per px of scroll
  drift:    number;  // horizontal drift in px per frame
  driftPx:  number;  // accumulated drift (canvas pixels)
}

function buildStars(count: number): Star[] {
  return Array.from({ length: count }, () => {
    // Radius drives depth: small = far, large = near
    const r = Math.random() * 1.6 + 0.2;
    const depthT = Math.max(0, (r - 0.2) / 1.6); // 0 = far, 1 = near

    return {
      x:        Math.random(),
      y:        Math.random(),
      r,
      base:     Math.random() * 0.5 + 0.15,
      twSpeed:  Math.random() * 0.016 + 0.004,
      twPhase:  Math.random() * Math.PI * 2,
      // Parallax: far stars barely move (0.015), near stars shift noticeably (0.20)
      parallax: 0.015 + depthT * 0.185,
      // Drift: far stars drift 0.008 px/frame, near stars 0.06 px/frame
      drift:    0.008 + depthT * 0.052,
      driftPx:  Math.random() * 1000, // random start so stars aren't aligned
    };
  });
}

export default function StarField({ count = 160 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
    };
    fit();
    window.addEventListener("resize", fit);

    const stars = buildStars(count);
    let frame = 0;
    let raf: number;

    const draw = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scrollY = window.scrollY;

      ctx.clearRect(0, 0, vw, vh);
      frame++;

      for (const s of stars) {
        // Drift — horizontal, wraps around
        s.driftPx = (s.driftPx + s.drift + vw) % vw;

        // Parallax — stars move upward as user scrolls down, wrap vertically
        const parallaxOffsetY = (scrollY * s.parallax) % vh;
        const drawX = (s.x * vw + s.driftPx) % vw;
        const drawY = ((s.y * vh) - parallaxOffsetY + vh) % vh;

        // Twinkle
        const twinkle = Math.sin(frame * s.twSpeed + s.twPhase) * 0.16;
        const alpha   = Math.max(0, Math.min(1, s.base + twinkle));

        // Near stars get a soft outer glow
        if (s.r > 1.2) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, s.r * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 215, 255, ${alpha * 0.11})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 235, 255, ${alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
