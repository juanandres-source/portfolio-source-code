import { PERSONAL_INFO } from "@/lib/constants";
import { ArrowRight, Download } from "lucide-react";
import { useEffect, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import React from "react";
import { Button } from "./ui/button";
import { AnimatedCounter } from "./AnimatedCounter";
import { useInViewAnimation } from "@/hooks/useInViewAnimation";
import { useTranslation } from "react-i18next";

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
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  } as any;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  } as any;

  return (
    <section id="home" className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden">
      {/* Background image layer */}
      <motion.div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(https://d2xsxph8kpxj0f.cloudfront.net/310519663578436605/UsX2YGyQy7TMo35LJKCtjz/hero-background-dAGMJiuVxeP7uUZR7Bg5w4.webp)" }}
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
      />
      {/* Base overlay */}
      <div className="absolute inset-0 -z-10 bg-white/85 dark:bg-[#080d1a]/92" />
      {/* Linear-inspired gradient mesh */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(30,64,175,0.12) 0%, transparent 70%)" }}
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(79,142,247,0.1) 0%, transparent 70%)" }}
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full blur-[80px]"
          style={{ background: "radial-gradient(circle, rgba(30,64,175,0.06) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate={prefersReducedMotion ? "visible" : "visible"}
        >
          <div className="space-y-8">
            <motion.div variants={itemVariants}>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-4 tracking-[-0.04em]">
                <span className="text-gradient">
                  <span className="hero-word"><span style={{ "--d": "0ms" } as React.CSSProperties}>Juan</span></span>
                  {" "}
                  <span className="hero-word"><span style={{ "--d": "90ms" } as React.CSSProperties}>Andrés</span></span>
                </span>
              </h1>
              <div className="flex items-baseline gap-3">
                <motion.span
                  className="font-display text-3xl md:text-4xl text-primary font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {displayedText}
                </motion.span>
                <motion.span
                  className="inline-block w-1 h-8 md:h-10 bg-primary rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            </motion.div>

            <motion.p className="font-body text-lg text-muted-foreground leading-relaxed" variants={itemVariants}>
              {t("hero.tagline")}
            </motion.p>

            <motion.div className="flex items-center gap-4 flex-wrap" variants={itemVariants}>
              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-sm font-medium text-foreground">📍 {PERSONAL_INFO.location}</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t("hero.status")}
                </span>
              </motion.div>
            </motion.div>

            <motion.div className="flex flex-col sm:flex-row gap-4 pt-4" variants={itemVariants}>
              <motion.a href="#projects" whileTap={{ scale: 0.97 }} data-magnetic>
                <Button size="lg" className="btn-glow bg-primary hover:bg-primary-dark text-white font-medium rounded-lg group w-full sm:w-auto">
                  {t("hero.view_projects")}
                  <motion.div className="ml-2" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </Button>
              </motion.a>
              <motion.a href={PERSONAL_INFO.cvUrl} target="_blank" rel="noopener noreferrer" whileTap={{ scale: 0.97 }} data-magnetic>
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 font-medium rounded-lg group w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  {t("hero.download_cv")}
                </Button>
              </motion.a>
            </motion.div>

            <motion.div
              ref={statsRef}
              className="grid grid-cols-3 gap-4 pt-8 border-t border-border"
              variants={itemVariants}
            >
              {[
                { value: 4, suffix: "+", label: t("hero.stat_years") },
                { value: 3, suffix: "", label: t("hero.stat_languages") },
                { value: 3, suffix: "", label: t("hero.stat_projects") },
              ].map((stat, i) => (
                <motion.div key={i} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                  <motion.p className="font-display text-2xl font-bold text-primary">
                    {statsInView ? <AnimatedCounter to={stat.value} suffix={stat.suffix} /> : `${stat.value}${stat.suffix}`}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* 3D Keyboard — visible on md+ screens */}
          <motion.div
            className="hidden md:block"
            style={{ height: "460px" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-40" />
                </div>
              }
            >
              <KeyboardScene />
            </Suspense>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator — animated vertical rail */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 fade-in-up" style={{ "--d": "1200ms" } as React.CSSProperties}>
        <div className="scroll-indicator flex-col">
          <div className="scroll-indicator__rail" />
          <span>{t("hero.scroll")}</span>
        </div>
      </div>
    </section>
  );
}
