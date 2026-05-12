import { PERSONAL_INFO } from "@/lib/constants";
import { ArrowRight, Download } from "lucide-react";
import { useEffect, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import React from "react";
import { Button } from "./ui/button";
import { AnimatedCounter } from "./AnimatedCounter";
import { useInViewAnimation } from "@/hooks/useInViewAnimation";
import { useTranslation } from "react-i18next";
import StarField from "./StarField";

// Lazy-load the heavy Three.js scene so it doesn't block initial render
const KeyboardScene = lazy(() => import("./KeyboardScene"));

export default function Hero() {
  const { t } = useTranslation();
  const [displayedText, setDisplayedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(80);
  const { ref: statsRef, isInView: statsInView } = useInViewAnimation();

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const typingWords = t("hero.typing_words", { returnObjects: true }) as string[];

  useEffect(() => {
    const currentWord = typingWords[wordIndex] ?? "";
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayedText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentWord.slice(0, displayedText.length + 1));
          setTypingSpeed(80);
        }, typingSpeed);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
          setTypingSpeed(50);
        }, 2000);
      }
    } else {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
          setTypingSpeed(50);
        }, typingSpeed);
      } else {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % typingWords.length);
        setTypingSpeed(80);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, wordIndex, isDeleting, typingSpeed, typingWords]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
  } as any;

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  } as any;

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden"
      /* Background applied via style to override any theme bg-background from parent */
      style={{ backgroundColor: "#060d1a" }}
    >
      {/* ── Animated star field (z-index 0, visible above the bg color) ─ */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <StarField count={150} />
      </div>

      {/* ── Nebula / ambient glow ───────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full blur-[130px]"
          style={{ background: "radial-gradient(circle, rgba(30,64,175,0.22) 0%, transparent 70%)" }}
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 rounded-full blur-[110px]"
          style={{ background: "radial-gradient(circle, rgba(79,142,247,0.15) 0%, transparent 70%)" }}
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full blur-[90px]"
          style={{ background: "radial-gradient(circle, rgba(30,64,175,0.09) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* ── Main content (above stars/glows) ────────────────────────────── */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate={prefersReducedMotion ? "visible" : "visible"}
        >
          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Greeting label — translated */}
            <motion.p
              className="text-xs font-semibold tracking-[0.35em] uppercase text-[#5eb5f7]/70"
              variants={itemVariants}
            >
              {t("hero.greeting")}
            </motion.p>

            {/* Name — huge display */}
            <motion.div variants={itemVariants}>
              <h1 className="font-display font-bold leading-[0.9] tracking-[-0.04em]">
                <span className="block text-white text-6xl md:text-7xl lg:text-8xl">
                  Juan
                </span>
                <span className="block text-[#5eb5f7] text-6xl md:text-7xl lg:text-8xl">
                  Andrés
                </span>
              </h1>
            </motion.div>

            {/* Typing role */}
            <motion.div className="flex items-baseline gap-3" variants={itemVariants}>
              <motion.span
                className="font-display text-2xl md:text-3xl text-white/90 font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {displayedText}
              </motion.span>
              <motion.span
                className="inline-block w-0.5 h-7 md:h-9 bg-[#5eb5f7] rounded-full"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            </motion.div>

            {/* Tagline */}
            <motion.p
              className="font-body text-base md:text-lg text-white/55 leading-relaxed max-w-md"
              variants={itemVariants}
            >
              {t("hero.tagline")}
            </motion.p>

            {/* Badges */}
            <motion.div className="flex items-center gap-3 flex-wrap" variants={itemVariants}>
              <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-sm font-medium text-white/80">
                  📍 {PERSONAL_INFO.location}
                </span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-medium text-green-400">
                  {t("hero.status")}
                </span>
              </motion.div>
            </motion.div>

            {/* CTA buttons */}
            <motion.div className="flex flex-col sm:flex-row gap-4 pt-2" variants={itemVariants}>
              <motion.a href="#projects" whileTap={{ scale: 0.97 }} data-magnetic>
                <Button
                  size="lg"
                  className="btn-glow bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-medium rounded-lg group w-full sm:w-auto"
                >
                  {t("hero.view_projects")}
                  <motion.div
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </Button>
              </motion.a>
              <motion.a
                href={PERSONAL_INFO.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.97 }}
                data-magnetic
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="font-medium rounded-lg group w-full sm:w-auto"
                  style={{ borderColor: "rgba(255,255,255,0.25)", color: "white", background: "transparent" }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("hero.download_cv")}
                </Button>
              </motion.a>
            </motion.div>

            {/* Stats */}
            <motion.div
              ref={statsRef}
              className="grid grid-cols-3 gap-4 pt-6"
              style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
              variants={itemVariants}
            >
              {[
                { value: 4, suffix: "+", label: t("hero.stat_years") },
                { value: 3, suffix: "", label: t("hero.stat_languages") },
                { value: 3, suffix: "", label: t("hero.stat_projects") },
              ].map((stat, i) => (
                <motion.div key={i} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <motion.p className="font-display text-2xl font-bold text-[#5eb5f7]">
                    {statsInView
                      ? <AnimatedCounter to={stat.value} suffix={stat.suffix} />
                      : `${stat.value}${stat.suffix}`}
                  </motion.p>
                  <p className="text-sm text-white/45">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ── 3D Keyboard — visible on all screens ────────────────────── */}
          <motion.div
            className="w-full"
            style={{ height: "320px" }}
            /* Mobile: 320px height; overridden to 520px on md+ */
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.6 }}
          >
            {/* On md+ we show a taller canvas */}
            <div className="hidden md:block w-full h-full" style={{ height: "520px" }}>
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-[#5eb5f7] border-t-transparent rounded-full animate-spin opacity-40" />
                  </div>
                }
              >
                <KeyboardScene />
              </Suspense>
            </div>

            {/* On mobile we show a smaller canvas */}
            <div className="md:hidden w-full" style={{ height: "300px" }}>
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-[#5eb5f7] border-t-transparent rounded-full animate-spin opacity-40" />
                  </div>
                }
              >
                <KeyboardScene />
              </Suspense>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Scroll indicator ─────────────────────────────────────────────── */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 fade-in-up"
        style={{ "--d": "1400ms", zIndex: 1 } as React.CSSProperties}
      >
        <div className="scroll-indicator flex-col">
          <div className="scroll-indicator__rail" />
          <span className="text-white/40 text-xs tracking-widest uppercase mt-1">
            {t("hero.scroll")}
          </span>
        </div>
      </div>
    </section>
  );
}
