/**
 * 3D Mechanical Keyboard — tech-stack showcase for the Hero section.
 * Built with @react-three/fiber + three.js.
 * Adapted from https://github.com/Txemalon/3d-portfolio (MIT).
 *
 * Simplifications vs. original:
 *  - No SeasonProvider: blue portfolio palette is hardcoded.
 *  - No Text3D font file: tooltip is an HTML overlay via React state.
 *  - No audio: removed switch click sounds.
 *  - Single idle pose (no section-based state machine).
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  siAngular,
  siKotlin,
  siTypescript,
  siJavascript,
  siHtml5,
  siCss,
  siReact,
  siMysql,
  siPhp,
  siPython,
  siGit,
  siDocker,
  siTailwindcss,
  siAndroid,
  siPostgresql,
} from "simple-icons";

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = {
  keyboardBase: "#bfcfe8",   // light blue-grey plastic base
  accent: "#4f8ef7",         // portfolio primary blue
};

// ─── Tech stack ───────────────────────────────────────────────────────────────
type SkillIcon = { title: string; slug: string; path: string; hex: string };

const TAGLINES: Record<string, string> = {
  angular:      "Framework para apps web a escala",
  kotlin:       "Desarrollo Android moderno",
  typescript:   "JavaScript con tipos estáticos",
  javascript:   "El lenguaje de la web",
  html5:        "Estructura y semántica web",
  css:          "Diseño y estilos web",
  react:        "UI declarativa con componentes",
  mysql:        "Base de datos relacional",
  php:          "Backend web clásico",
  python:       "Scripts y automatización",
  git:          "Control de versiones",
  docker:       "Contenedores y despliegue",
  tailwindcss:  "CSS utility-first moderno",
  android:      "Apps móviles nativas",
  postgresql:   "Base de datos avanzada",
};

// 5 columns × 3 rows = 15 keycaps
const SKILLS: readonly (readonly SkillIcon[])[] = [
  [siAngular,  siTypescript, siKotlin,     siJavascript, siHtml5],
  [siCss,      siReact,      siMysql,      siPhp,        siPython],
  [siGit,      siDocker,     siTailwindcss, siAndroid,   siPostgresql],
] as const;

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function makeRoundedRectShape(w: number, d: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = w / 2, hd = d / 2;
  r = Math.min(r, hw, hd);
  shape.moveTo(-hw + r, -hd);
  shape.lineTo( hw - r, -hd);
  shape.quadraticCurveTo( hw, -hd,  hw, -hd + r);
  shape.lineTo( hw,  hd - r);
  shape.quadraticCurveTo( hw,  hd,  hw - r,  hd);
  shape.lineTo(-hw + r,  hd);
  shape.quadraticCurveTo(-hw,  hd, -hw,  hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  return shape;
}

function createExtrudedBox(
  width: number, depth: number, height: number,
  cornerRadius: number, bevelSize: number, topScale = 1
): THREE.BufferGeometry {
  const shape = makeRoundedRectShape(width, depth, cornerRadius);
  const extrudeDepth = Math.max(0.001, height - 2 * bevelSize);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: bevelSize > 0,
    bevelThickness: bevelSize,
    bevelSize,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -height / 2 + bevelSize, 0);

  if (topScale !== 1) {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y + height / 2) / height;
      const factor = THREE.MathUtils.lerp(1, topScale, t);
      pos.setX(i, pos.getX(i) * factor);
      pos.setZ(i, pos.getZ(i) * factor);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  return geo;
}

// ─── Icon texture ─────────────────────────────────────────────────────────────
function makeIconTexture(svgPath: string, color: string, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const iconSize = Math.round(size * 0.62);
  const scale = iconSize / 24;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(scale, scale);
  ctx.translate(-12, -12);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(svgPath));
  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLS = 5, ROWS = 3;
const KEYCAP_SIZE = 0.4;
const KEYCAP_HEIGHT = 0.28;
const KEYCAP_TOP_SCALE = 0.78;
const COL_SPACING = 0.42;
const ROW_SPACING = 0.42;
const BASE_WIDTH = 2.4;
const BASE_DEPTH = 1.4;
const BASE_HEIGHT = 0.26;
const ICON_PLANE_SIZE = KEYCAP_SIZE * KEYCAP_TOP_SCALE * 0.78;
const PRESS_DEPTH = 0.15;

// ─── Keycap component ─────────────────────────────────────────────────────────
function Keycap({
  geometry,
  position,
  icon,
  hovered,
  onHoverChange,
  wavePhase,
}: {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  icon: SkillIcon;
  hovered: boolean;
  onHoverChange: (h: boolean) => void;
  wavePhase: number;
}) {
  const pressRef = useRef<THREE.Group>(null);
  const pressY = useRef(0);
  const bobAmp = useRef(0);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);

  const white = useMemo(() => new THREE.Color("#ffffff"), []);
  const accent = useMemo(() => new THREE.Color(PALETTE.accent), []);
  const bodyTint = useMemo(() => new THREE.Color(PALETTE.accent).lerp(white, 0.35), [white]);

  const iconTexture = useMemo(
    () => makeIconTexture(icon.path, `#${icon.hex}`),
    [icon.path, icon.hex]
  );
  useEffect(() => () => iconTexture.dispose(), [iconTexture]);

  useFrame((state) => {
    if (!pressRef.current) return;
    const t = state.clock.elapsedTime;
    const pressed = hovered ? -PRESS_DEPTH : 0;

    // Subtle idle bob on hover
    bobAmp.current = THREE.MathUtils.lerp(bobAmp.current, hovered ? 1 : 0, 0.1);
    const bob = Math.sin(t * 3 + wavePhase) * 0.06 * bobAmp.current;

    pressY.current = THREE.MathUtils.lerp(pressY.current, pressed + bob, 0.2);
    pressRef.current.position.y = pressY.current;

    if (matRef.current) {
      const targetIntensity = 0.3 + bobAmp.current * 0.6;
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity, targetIntensity, 0.12
      );
      matRef.current.emissive.copy(white).lerp(accent, bobAmp.current);
      matRef.current.color.copy(white).lerp(bodyTint, bobAmp.current);
    }
  });

  const handleOver = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onHoverChange(true);
  }, [onHoverChange]);

  const handleOut = useCallback(() => onHoverChange(false), [onHoverChange]);

  return (
    <group position={position}>
      <group ref={pressRef}>
        <mesh geometry={geometry} onPointerOver={handleOver} onPointerOut={handleOut}>
          <meshPhysicalMaterial
            ref={matRef}
            color="#ffffff"
            roughness={0.3}
            clearcoat={0.5}
            clearcoatRoughness={0.18}
            metalness={0}
            emissive="#ffffff"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh
          position={[0, KEYCAP_HEIGHT / 2 + 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <planeGeometry args={[ICON_PLANE_SIZE, ICON_PLANE_SIZE]} />
          <meshBasicMaterial map={iconTexture} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Keyboard group ───────────────────────────────────────────────────────────
function Keyboard({ onHover }: { onHover: (icon: SkillIcon | null) => void }) {
  const ref = useRef<THREE.Group>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Update cursor and notify parent
  useEffect(() => {
    document.body.style.cursor = hoveredKey ? "pointer" : "auto";
    if (hoveredKey) {
      const [r, c] = hoveredKey.split("-").map(Number);
      onHover(SKILLS[r]?.[c] ?? null);
    } else {
      onHover(null);
    }
    return () => { document.body.style.cursor = "auto"; };
  }, [hoveredKey, onHover]);

  useEffect(() => {
    if (ref.current) ref.current.rotation.order = "YXZ";
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const w = (Math.PI * 2) / 9; // ~9s cycle
    // Hero pose with cinematic idle swing
    ref.current.rotation.y = Math.PI * 0.15 + Math.sin(t * w) * 0.45;
    ref.current.rotation.x = Math.PI * 0.18 + Math.sin(t * w * 0.6) * 0.07;
    ref.current.rotation.z = Math.PI * 0.025 + Math.sin(t * w * 0.8) * 0.04;
    ref.current.position.y = Math.sin(t * 0.6) * 0.04;
  });

  const keycapGeom = useMemo(
    () => createExtrudedBox(KEYCAP_SIZE, KEYCAP_SIZE, KEYCAP_HEIGHT, 0.05, 0.012, KEYCAP_TOP_SCALE),
    []
  );
  const baseGeom = useMemo(
    () => createExtrudedBox(BASE_WIDTH, BASE_DEPTH, BASE_HEIGHT, 0.12, 0.02, 1),
    []
  );
  useEffect(() => () => { keycapGeom.dispose(); baseGeom.dispose(); }, [keycapGeom, baseGeom]);

  const keycapY = BASE_HEIGHT / 2 + KEYCAP_HEIGHT / 2 + 0.005;
  const keycaps = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = (col - (COLS - 1) / 2) * COL_SPACING;
      const z = (row - (ROWS - 1) / 2) * ROW_SPACING;
      const id = `${row}-${col}`;
      keycaps.push(
        <Keycap
          key={id}
          geometry={keycapGeom}
          position={[x, keycapY, z]}
          icon={SKILLS[row][col]}
          hovered={hoveredKey === id}
          wavePhase={row * 0.9 + col * 0.55}
          onHoverChange={(h) =>
            setHoveredKey((prev) => (h ? id : prev === id ? null : prev))
          }
        />
      );
    }
  }

  return (
    <group ref={ref}>
      <mesh geometry={baseGeom}>
        <meshStandardMaterial color={PALETTE.keyboardBase} roughness={0.55} metalness={0} />
      </mesh>
      {keycaps}
    </group>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────
export default function KeyboardScene() {
  const [hoveredIcon, setHoveredIcon] = useState<SkillIcon | null>(null);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [1.5, 3.6, 11], fov: 22 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Environment resolution={128} environmentIntensity={0.3}>
          <Lightformer intensity={1.1} color="#ffffff" position={[0, 6, -4]} rotation={[0, 0, 0]} scale={[12, 6, 1]} />
          <Lightformer intensity={0.7} color="#ffffff" position={[-6, 2, 2]} rotation={[0, Math.PI / 2, 0]} scale={[6, 4, 1]} />
          <Lightformer intensity={0.5} color="#ffffff" position={[6, 3, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 4, 1]} />
          <Lightformer intensity={0.35} color="#ffffff" position={[0, -4, 3]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} />
        </Environment>
        <ambientLight intensity={0.15} />
        <directionalLight position={[-5, 8, 3]} intensity={2.4} />
        <hemisphereLight intensity={0.25} color="#eaf2fb" groundColor="#0a1428" />
        <Keyboard onHover={setHoveredIcon} />
      </Canvas>

      {/* HTML tooltip — no font file needed */}
      <div
        className={`
          absolute bottom-6 left-1/2 -translate-x-1/2
          px-4 py-2 rounded-xl text-center pointer-events-none
          bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20
          transition-all duration-300
          ${hoveredIcon ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        `}
      >
        {hoveredIcon && (
          <>
            <p className="font-display text-sm font-bold text-white leading-tight">
              {hoveredIcon.title}
            </p>
            <p className="font-body text-xs text-blue-200 mt-0.5">
              {TAGLINES[hoveredIcon.slug] ?? ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
