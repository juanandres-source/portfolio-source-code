import {
  createElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: Direction;
  className?: string;
  threshold?: number;
  once?: boolean;
}

/**
 * Lightweight IntersectionObserver-based fade-in.
 * Adds .reveal-in when the element enters the viewport.
 * The transition is defined in index.css — no runtime style injection.
 * Adapted from https://github.com/Txemalon/3d-portfolio
 *
 * Usage:
 *   <Reveal direction="up" delay={100}>
 *     <p>Fades in from below when scrolled into view</p>
 *   </Reveal>
 */
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  duration = 700,
  distance = 24,
  direction = "up",
  className = "",
  threshold = 0.12,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("reveal-in");
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("reveal-in");
            if (once) obs.unobserve(el);
          } else if (!once) {
            el.classList.remove("reveal-in");
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once]);

  const axis: Record<Direction, string> = {
    up: `translate3d(0, ${distance}px, 0)`,
    down: `translate3d(0, -${distance}px, 0)`,
    left: `translate3d(${distance}px, 0, 0)`,
    right: `translate3d(-${distance}px, 0, 0)`,
    none: "translate3d(0, 0, 0)",
  };

  const style: CSSProperties = {
    ["--reveal-delay" as string]: `${delay}ms`,
    ["--reveal-duration" as string]: `${duration}ms`,
    ["--reveal-from" as string]: axis[direction],
  };

  return createElement(
    Tag,
    { ref, className: `reveal ${className}`.trim(), style },
    children
  );
}
