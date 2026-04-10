"use client";

import Navbar from "@/components/ui/Navbar";
import { FeaturesSection, HeroSection } from "./HeroSection";
import { TrendShowcase } from "./TrendShowcase";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";

export function LandingWrapper() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const rightsText =
    language === "en" ? "All rights reserved." : "Hak cipta dilindungi.";

  return (
    <div
      className={`min-h-screen selection:bg-[#DC2626] selection:text-white transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <Navbar />

      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <TrendShowcase />
      </main>

      <footer
        className={`border-t py-8 text-center transition-colors duration-300 ${
          theme === "dark" ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-white"
        }`}
        role="contentinfo"
      >
        <p className="text-gray-500">
          Copyright {new Date().getFullYear()} Megaw AI. {rightsText}
        </p>
      </footer>
    </div>
  );
}
