/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KeyboardScrollScene — 3D Scrollytelling
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Architecture:
 *   • A <Canvas> fixed to the viewport (pointer-events: none) renders the
 *     3D model on top of all HTML content with a transparent background.
 *   • GSAP ScrollTrigger watches each HTML section and updates a plain
 *     mutable object (`animated`).
 *   • `useFrame` reads that object every tick and applies position/rotation
 *     to the Three.js group — this keeps GSAP (DOM world) and R3F (GL world)
 *     fully decoupled. No re-renders, no stale closures.
 *
 * To swap in your real model:
 *   1. Place your file at  /public/models/keyboard.glb
 *   2. In the <KeyboardModel> component below, un-comment the useGLTF lines
 *      and comment out the placeholder box geometry.
 *
 * To adjust poses per section:
 *   Edit the SECTION_POSES object. All units are Three.js world units and
 *   radians (Math.PI = 180°).
 *
 * Adapted stack: React 19 + Vite + @react-three/fiber + @react-three/drei + GSAP
 */

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  // useGLTF,   // ← un-comment when you have keyboard.glb
} from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Suspense,
  useEffect,
  useRef,
  type RefObject,
} from "react";
import * as THREE from "three";

// Register GSAP plugin once at module level
gsap.registerPlugin(ScrollTrigger);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Pose {
  /** World-space position [x, y, z]. Positive x = right, positive y = up. */
  px: number; py: number; pz: number;
  /** Euler rotation in radians [x, y, z]. Math.PI = 180°. */
  rx: number; ry: number; rz: number;
  /** Uniform scale. 1 = original size. */
  scale: number;
}

// ─── Section poses ────────────────────────────────────────────────────────────
// ⚡ ADJUST THESE to control how the model looks in each section of the page.
// The model transitions smoothly (scrubbed to scroll) between consecutive poses.
//
// Tip: start the dev server (`npm run dev`) and tweak values live — the canvas
// renders in real-time so you can iterate quickly.

const SECTION_POSES: Record<string, Pose> = {
  // Hero — keyboard tilted, positioned on the right side of the screen
  hero: {
    px: 1.5,  py: 0,    pz: 0,
    rx: Math.PI * 0.18,  ry: Math.PI * 0.15,  rz: Math.PI * 0.025,
    scale: 1,
  },

  // About — slides to the left, more frontal/upright view
  about: {
    px: -1.4, py: 0.2,  pz: 0,
    rx: Math.PI * 0.08,  ry: -Math.PI * 0.1,  rz: 0,
    scale: 0.9,
  },

  // Projects — centered, steep top-down angle (shows keycap icons)
  projects: {
    px: 0,    py: 0.5,  pz: 0,
    rx: Math.PI * 0.42,  ry: Math.PI * 0.05,  rz: 0,
    scale: 1.15,
  },

  // Skills — right side, rotated to show keyboard side profile
  skills: {
    px: 1.3,  py: 0,    pz: 0,
    rx: Math.PI * 0.28,  ry: -Math.PI * 0.22,  rz: -Math.PI * 0.04,
    scale: 0.95,
  },

  // Contact — mirrors the hero pose (familiar, inviting)
  contact: {
    px: 1.4,  py: -0.1, pz: 0,
    rx: Math.PI * 0.18,  ry: Math.PI * 0.15,  rz: Math.PI * 0.025,
    scale: 1,
  },
};

// ─── Section transition map ───────────────────────────────────────────────────
// Each entry defines:
//   trigger  — the HTML element ID that ScrollTrigger watches
//   from     — pose at the TOP of this section
//   to       — pose at the BOTTOM of this section
//
// Adjust `start` / `end` strings to fine-tune when transitions begin/end.
// Format: "<element position> <viewport position>"  (GSAP syntax)

interface Transition {
  trigger: string;   // CSS selector — must match an element in the HTML
  from: Pose;
  to: Pose;
  start?: string;    // default: "top center"
  end?: string;      // default: "bottom center"
  scrub?: number;    // lag factor — higher = smoother, lazier following
}

const TRANSITIONS: Transition[] = [
  {
    trigger: "#about",
    from: SECTION_POSES.hero,
    to:   SECTION_POSES.about,
    start: "top 80%",   // begin transition a bit early for smoothness
    end:   "top 20%",
    scrub: 1.8,
  },
  {
    trigger: "#projects",
    from: SECTION_POSES.about,
    to:   SECTION_POSES.projects,
    scrub: 1.8,
  },
  {
    trigger: "#skills",
    from: SECTION_POSES.projects,
    to:   SECTION_POSES.skills,
    scrub: 1.8,
  },
  {
    trigger: "#contact",
    from: SECTION_POSES.skills,
    to:   SECTION_POSES.contact,
    scrub: 1.8,
  },
];

// ─── 3D Model component ───────────────────────────────────────────────────────
// Reads the animated ref every frame (useFrame) and applies to the Three.js
// group. The idle oscillation is layered on top of GSAP's values so the model
// always feels alive, even when not transitioning.

function KeyboardModel({ animated }: { animated: RefObject<Pose> }) {
  const groupRef = useRef<THREE.Group>(null);

  // ── Option B: Real .glb model ─────────────────────────────────────────────
  // Un-comment the two lines below and remove the placeholder geometry block.
  //
  // const { scene } = useGLTF("/models/keyboard.glb");
  // useEffect(() => { return () => useGLTF.clear("/models/keyboard.glb"); }, []);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;

    const t = state.clock.elapsedTime;
    const a = animated.current;

    // GSAP base values + subtle continuous idle oscillation
    // Remove the Math.sin() terms if you want zero idle movement.
    g.position.set(
      a.px,
      a.py + Math.sin(t * 0.55) * 0.04,   // gentle vertical float
      a.pz,
    );
    g.rotation.set(
      a.rx + Math.sin(t * 0.35) * 0.012,  // tiny pitch breathe
      a.ry + Math.sin(t * 0.45) * 0.018,  // tiny yaw sway
      a.rz,
    );
    g.scale.setScalar(a.scale);
  });

  return (
    <group ref={groupRef}>

      {/* ── Option A: Placeholder geometry (works without any .glb file) ────
          Replace this entire block with:
            <primitive object={scene} />
          once you have keyboard.glb.                                        */}
      <group>
        {/* Keyboard base */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.1, 0.22, 1.25]} />
          <meshPhysicalMaterial
            color="#c5d4eb"
            roughness={0.45}
            metalness={0.05}
            clearcoat={0.35}
            clearcoatRoughness={0.2}
          />
        </mesh>

        {/* Keycap rows — 3 rows × 5 keys, matching the real keyboard layout */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <mesh
              key={`${row}-${col}`}
              position={[
                (col - 2) * 0.36,
                0.175,
                (row - 1) * 0.36,
              ]}
              castShadow
            >
              <boxGeometry args={[0.3, 0.12, 0.3]} />
              <meshPhysicalMaterial
                color="#ffffff"
                roughness={0.28}
                clearcoat={0.5}
                clearcoatRoughness={0.15}
                emissive="#4f8ef7"
                emissiveIntensity={0.12}
              />
            </mesh>
          ))
        )}
      </group>
      {/* ── End placeholder ─────────────────────────────────────────────── */}

    </group>
  );
}

// ─── Scene lighting ───────────────────────────────────────────────────────────
function SceneLighting() {
  return (
    <>
      {/* Soft environment built from Lightformer quads — no external HDR fetch */}
      <Environment resolution={128} environmentIntensity={0.28}>
        <Lightformer intensity={1.1} color="#ffffff" position={[0, 6, -4]}   rotation={[0, 0, 0]}           scale={[12, 6, 1]} />
        <Lightformer intensity={0.7} color="#ffffff" position={[-6, 2, 2]}   rotation={[0,  Math.PI / 2, 0]} scale={[6, 4, 1]} />
        <Lightformer intensity={0.5} color="#ffffff" position={[6, 3, 1]}    rotation={[0, -Math.PI / 2, 0]} scale={[6, 4, 1]} />
        <Lightformer intensity={0.35} color="#ffffff" position={[0, -4, 3]}  rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} />
      </Environment>

      {/* Low ambient + strong key light from upper-left for crisp top-bright shading */}
      <ambientLight intensity={0.14} />
      <directionalLight position={[-5, 8, 3]} intensity={2.4} castShadow />
      <hemisphereLight intensity={0.22} color="#eaf2fb" groundColor="#0a1428" />
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
// Drop this anywhere in your JSX tree — it renders a fixed canvas that sits
// on top of all HTML content. The canvas is fully transparent wherever there
// is no 3D geometry, so HTML sections remain completely visible.

export default function KeyboardScrollScene() {
  // Shared mutable object: GSAP writes here, useFrame reads here.
  // Using useRef so it persists across re-renders without triggering them.
  const animated = useRef<Pose>({ ...SECTION_POSES.hero });

  useEffect(() => {
    // ── GSAP ScrollTrigger setup ─────────────────────────────────────────────
    // Each fromTo tween is bound to a section via ScrollTrigger. GSAP scrubs
    // the tween progress in sync with scroll position, and `immediateRender:
    // false` prevents overlapping tweens from fighting over the initial state.

    const triggers: ScrollTrigger[] = [];

    TRANSITIONS.forEach(({ trigger, from, to, start, end, scrub }) => {
      const el = document.querySelector(trigger);
      if (!el) {
        console.warn(`[KeyboardScrollScene] Section not found: "${trigger}". Check the id attribute.`);
        return;
      }

      const st = gsap.fromTo(
        animated.current,
        // FROM — pose at the top of this section
        {
          px: from.px, py: from.py, pz: from.pz,
          rx: from.rx, ry: from.ry, rz: from.rz,
          scale: from.scale,
          immediateRender: false, // ← critical for non-overlapping fromTo tweens
        },
        // TO — pose at the bottom of this section
        {
          px: to.px, py: to.py, pz: to.pz,
          rx: to.rx, ry: to.ry, rz: to.rz,
          scale: to.scale,
          ease: "none", // linear easing lets scrub control the curve
          scrollTrigger: {
            trigger: el,
            start: start ?? "top center",
            end:   end   ?? "bottom center",
            scrub: scrub ?? 1.8,
            // markers: true, // ← un-comment to debug trigger positions
          },
        }
      );

      if (st.scrollTrigger) triggers.push(st.scrollTrigger);
    });

    // Cleanup: kill all triggers when the component unmounts or re-renders
    return () => {
      triggers.forEach((t) => t.kill());
      ScrollTrigger.refresh();
    };
  }, []); // empty deps — runs once on mount

  return (
    // Fixed overlay — covers the full viewport, ignores pointer events so
    // all HTML interactions (links, buttons, inputs) work normally.
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <Canvas
        camera={{ position: [1.5, 3.6, 11], fov: 22 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,            // transparent canvas background
          powerPreference: "high-performance",
        }}
      >
        <SceneLighting />
        <Suspense fallback={null}>
          <KeyboardModel animated={animated} />
        </Suspense>
      </Canvas>
    </div>
  );
}
