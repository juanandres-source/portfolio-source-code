import AIChat from "@/components/AIChat";
import About from "@/components/About";
import Awards from "@/components/Awards";
import Contact from "@/components/Contact";
import Education from "@/components/Education";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Interests from "@/components/Interests";
import Languages from "@/components/Languages";
import Navbar from "@/components/Navbar";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import Terminal from "@/components/Terminal";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { BackToTopButton } from "@/components/BackToTopButton";
import { useAuth } from "@/_core/hooks/useAuth";
import { useKonamiCode } from "@/hooks/useKonamiCode";
import { useState } from "react";

/**
 * Design Philosophy: Minimalist Corporate Modern
 * - Clean typography with Playfair Display for headers, Inter for body
 * - Corporate blue (#1e40af) as primary accent
 * - Generous whitespace and subtle dividers
 * - Professional, trustworthy aesthetic
 * - Responsive design for all devices
 */
export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [showTerminal, setShowTerminal] = useState(false);

  useKonamiCode(() => {
    setShowTerminal(true);
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* About Section */}
        <About />

        {/* Education Section */}
        <Education />

        {/* Projects Section */}
        <Projects />

        {/* Awards & Recognition Section */}
        <Awards />

        {/* Skills Section */}
        <Skills />

        {/* Languages Section */}
        <Languages />

        {/* Interests Section */}
        <Interests />

        {/* Contact Section */}
        <Contact />
      </main>

      {/* Footer */}
      <Footer />

      {/* Back to Top Button */}
      <BackToTopButton />

      {/* AI Chat */}
      <AIChat />

      {/* Terminal Easter Egg */}
      {showTerminal && <Terminal onClose={() => setShowTerminal(false)} />}
    </div>
  );
}
