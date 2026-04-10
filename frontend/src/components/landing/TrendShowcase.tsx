"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Star, TrendingUp } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";

interface TrendItem {
  name: string;
  growth: string;
  description: string;
  icon: typeof TrendingUp;
  color: string;
  bgColor: string;
  darkBgColor: string;
}

export function TrendShowcase() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const copy =
    language === "en"
      ? {
          sectionTitle: "Popular Food Trends",
          sectionSubtitle: "See which products are gaining traction this week.",
          sectionAria: "Popular food trends",
          navAria: "Trend navigation",
          growthAria: (growth: string) => `Growth ${growth}`,
          dotAria: (index: number, name: string) => `Show trend ${index + 1}: ${name}`,
          trendData: [
            {
              name: "Palm Sugar Milk Coffee",
              growth: "+127%",
              description:
                "A coffee drink trending among young customers with a refreshing mix of coffee, milk, and palm sugar.",
              icon: Flame,
              color: "text-orange-600",
              bgColor: "bg-orange-100",
              darkBgColor: "bg-orange-900/30",
            },
            {
              name: "Croffle",
              growth: "+89%",
              description:
                "A fusion pastry that combines buttery croissant flavor with waffle texture. A favorite among foodies.",
              icon: Star,
              color: "text-yellow-600",
              bgColor: "bg-yellow-100",
              darkBgColor: "bg-yellow-900/30",
            },
            {
              name: "Korean Corn Dog",
              growth: "+156%",
              description:
                "A popular Korean street food with sausage and mozzarella filling, coated in crispy breadcrumbs.",
              icon: TrendingUp,
              color: "text-green-600",
              bgColor: "bg-green-100",
              darkBgColor: "bg-green-900/30",
            },
          ] satisfies TrendItem[],
        }
      : {
          sectionTitle: "Tren Makanan Populer",
          sectionSubtitle: "Lihat produk yang sedang naik daun minggu ini",
          sectionAria: "Tren makanan populer",
          navAria: "Navigasi tren",
          growthAria: (growth: string) => `Pertumbuhan ${growth}`,
          dotAria: (index: number, name: string) => `Lihat tren ${index + 1}: ${name}`,
          trendData: [
            {
              name: "Es Kopi Susu Gula Aren",
              growth: "+127%",
              description:
                "Minuman kopi yang sedang viral di kalangan anak muda. Kombinasi kopi, susu, dan gula aren yang menyegarkan.",
              icon: Flame,
              color: "text-orange-600",
              bgColor: "bg-orange-100",
              darkBgColor: "bg-orange-900/30",
            },
            {
              name: "Croffle (Croissant Waffle)",
              growth: "+89%",
              description:
                "Fusion pastry yang menggabungkan kelezatan croissant dengan tekstur waffle. Favorit pecinta kuliner.",
              icon: Star,
              color: "text-yellow-600",
              bgColor: "bg-yellow-100",
              darkBgColor: "bg-yellow-900/30",
            },
            {
              name: "Korean Corn Dog",
              growth: "+156%",
              description:
                "Street food Korea yang populer dengan isian sosis dan keju mozzarella, dilapisi tepung roti renyah.",
              icon: TrendingUp,
              color: "text-green-600",
              bgColor: "bg-green-100",
              darkBgColor: "bg-green-900/30",
            },
          ] satisfies TrendItem[],
        };

  const trendData = copy.trendData;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendData.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [trendData.length]);

  const currentTrend = trendData[currentIndex];
  const IconComponent = currentTrend.icon;

  return (
    <section
      className={`py-12 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
      aria-label={copy.sectionAria}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <h2
            className={`mb-2 text-2xl font-bold sm:text-3xl ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {copy.sectionTitle}
          </h2>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            {copy.sectionSubtitle}
          </p>
        </header>

        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.article
              key={currentIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={`rounded-2xl border p-6 ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800/50 shadow-[0_8px_30px_rgba(255,255,255,0.08)]"
                  : "border-gray-100 bg-white shadow-lg"
              }`}
              aria-live="polite"
            >
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <figure
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                    theme === "dark" ? currentTrend.darkBgColor : currentTrend.bgColor
                  }`}
                  aria-hidden="true"
                >
                  <IconComponent className={`h-7 w-7 ${currentTrend.color}`} />
                </figure>

                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h3 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {currentTrend.name}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${
                        theme === "dark" ? "bg-green-900/40 text-green-400" : "bg-green-100 text-green-700"
                      }`}
                      aria-label={copy.growthAria(currentTrend.growth)}
                    >
                      <TrendingUp className="mr-1 h-4 w-4" aria-hidden="true" />
                      {currentTrend.growth}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {currentTrend.description}
                  </p>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>

        <nav className="mt-6 flex justify-center gap-2" aria-label={copy.navAria}>
          {trendData.map((trend, index) => (
            <button
              key={trend.name}
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-[#DC2626]"
                  : theme === "dark"
                    ? "bg-gray-600 hover:bg-gray-500"
                    : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={copy.dotAria(index, trend.name)}
              aria-current={index === currentIndex ? "true" : "false"}
            />
          ))}
        </nav>
      </div>
    </section>
  );
}
