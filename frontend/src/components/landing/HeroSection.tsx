"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Clock,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { getToken } from "@/lib/auth";
import { useLanguage } from "@/lib/language-context";

export function HeroSection() {
  const { theme } = useTheme();
  const router = useRouter();
  const { language } = useLanguage();

  const copy =
    language === "en"
      ? {
          heroAria: "Hero - Introducing Megaw AI",
          badge: "Free for Indonesian SMEs",
          titleTop: "Manage Sales",
          titleBottom: "with Smart AI",
          description:
            "Megaw AI helps SMEs record, analyze, and forecast sales.",
          descriptionStrong: "Simple, Fast, and Accurate.",
          primaryCta: "Start Free",
          secondaryCta: "View Dashboard",
          primaryActionAria: "Primary actions",
          statsAria: "Achievement statistics",
          stats: [
            { value: "500+", label: "SMEs Supported" },
            { value: "1M+", label: "Records Processed" },
            { value: "95%", label: "Forecast Accuracy" },
          ],
        }
      : {
          heroAria: "Hero - Pengenalan Megaw AI",
          badge: "Gratis untuk UMKM Indonesia",
          titleTop: "Kelola Penjualan",
          titleBottom: "dengan AI Cerdas",
          description:
            "Megaw AI membantu UMKM mencatat, menganalisa, dan memprediksi penjualan.",
          descriptionStrong: "Simpel, Cepat, dan Akurat.",
          primaryCta: "Mulai Gratis",
          secondaryCta: "Lihat Dashboard",
          primaryActionAria: "Aksi utama",
          statsAria: "Statistik pencapaian",
          stats: [
            { value: "500+", label: "UMKM Terbantu" },
            { value: "1jt+", label: "Data Diproses" },
            { value: "95%", label: "Akurasi Prediksi" },
          ],
        };

  const handleDashboardClick = () => {
    const token = getToken();
    router.push(token ? "/dashboard" : "/login");
  };

  return (
    <section
      className={`relative overflow-hidden pt-28 pb-16 transition-colors duration-300 lg:pt-40 lg:pb-28 ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
      aria-label={copy.heroAria}
    >
      <div
        className={`absolute inset-0 -z-10 h-full w-full ${
          theme === "dark"
            ? "bg-gray-900 bg-[radial-gradient(#374151_1px,transparent_1px)]"
            : "bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]"
        } [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]`}
        aria-hidden="true"
      />

      <motion.div
        className={`absolute top-20 left-10 h-20 w-20 rounded-full opacity-50 blur-xl ${
          theme === "dark" ? "bg-red-900" : "bg-red-100"
        }`}
        animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <motion.div
        className={`absolute right-10 bottom-20 h-32 w-32 rounded-full opacity-50 blur-xl ${
          theme === "dark" ? "bg-blue-900" : "bg-blue-100"
        }`}
        animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span
            className={`mb-6 inline-flex items-center gap-2 rounded-full py-1.5 px-4 text-sm font-bold tracking-wide text-[#DC2626] ${
              theme === "dark"
                ? "border border-red-800 bg-red-900/30"
                : "border border-red-100 bg-red-50"
            }`}
            role="status"
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            {copy.badge}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-7xl ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {copy.titleTop}
          <br />
          <span className="bg-gradient-to-r from-[#DC2626] to-red-800 bg-clip-text text-transparent">
            {copy.titleBottom}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`mx-auto mt-4 mb-8 max-w-2xl text-lg sm:text-xl ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {copy.description}
          <strong className={theme === "dark" ? "text-gray-200" : "text-gray-800"}>
            {" "}
            {copy.descriptionStrong}
          </strong>
        </motion.p>

        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          aria-label={copy.primaryActionAria}
        >
          <Link href="/login?mode=register">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-full bg-[#DC2626] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-700"
            >
              {copy.primaryCta} <ArrowRight size={20} aria-hidden="true" />
            </motion.button>
          </Link>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDashboardClick}
            className={`rounded-full border-2 px-8 py-4 text-lg font-bold transition-all ${
              theme === "dark"
                ? "border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-500 hover:bg-gray-700"
                : "border-gray-200 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            {copy.secondaryCta}
          </motion.button>
        </motion.nav>

        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 flex flex-wrap justify-center gap-8 text-center"
          aria-label={copy.statsAria}
        >
          {copy.stats.map((stat) => (
            <article key={stat.label} className="px-4">
              <p
                className={`text-2xl font-bold sm:text-3xl ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
                aria-label={`${stat.value} ${stat.label}`}
              >
                {stat.value}
              </p>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                {stat.label}
              </p>
            </article>
          ))}
        </motion.aside>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isEnglish = language === "en";

  const features = [
    {
      icon: BarChart3,
      title: isEnglish ? "Real-time Analytics" : "Analitik Real-time",
      description: isEnglish
        ? "Monitor live sales performance with charts that are easy to understand."
        : "Pantau performa penjualan secara langsung dengan grafik yang mudah dipahami.",
      iconBg: "bg-red-100",
      iconColor: "text-[#DC2626]",
    },
    {
      icon: Brain,
      title: isEnglish ? "AI Forecasting" : "Prediksi AI",
      description: isEnglish
        ? "Get accurate sales forecasts and practical business recommendations from AI."
        : "Dapatkan prediksi penjualan akurat dan rekomendasi bisnis dari AI cerdas.",
      iconBg: "bg-gray-900",
      iconColor: "text-white",
    },
    {
      icon: Clock,
      title: isEnglish ? "Save Time" : "Hemat Waktu",
      description: isEnglish
        ? "Import data quickly from Excel or CSV and generate reports automatically."
        : "Input data cepat dari Excel/CSV. Laporan otomatis tanpa ribet.",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: TrendingUp,
      title: isEnglish ? "Trend Detection" : "Deteksi Tren",
      description: isEnglish
        ? "See which products are rising or falling before it is too late."
        : "Ketahui produk mana yang naik atau turun sebelum terlambat.",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Zap,
      title: isEnglish ? "Burst Alerts" : "Burst Alert",
      description: isEnglish
        ? "Receive instant alerts when unusual sales spikes happen."
        : "Notifikasi instan saat ada lonjakan penjualan tidak biasa.",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: ShieldCheck,
      title: isEnglish ? "Secure Data" : "Data Aman",
      description: isEnglish
        ? "Your data stays protected with encryption, so you can stay focused on sales."
        : "Data tersimpan aman dengan enkripsi. Fokus jualan, sisanya kami yang urus.",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <section
      className={`py-16 transition-colors duration-300 lg:py-24 ${
        theme === "dark" ? "bg-gray-950" : "bg-gray-50"
      }`}
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2
            id="features-heading"
            className={`mb-4 text-3xl font-bold sm:text-4xl ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {isEnglish ? "Features That Help Your Business" : "Fitur yang Membantu Bisnismu"}
          </h2>
          <p className={`mx-auto max-w-2xl text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            {isEnglish
              ? "Everything you need to manage and grow your SME business."
              : "Semua yang kamu butuhkan untuk mengelola dan mengembangkan bisnis UMKM"}
          </p>
        </motion.header>

        <ul className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {features.map((feature, index) => (
            <motion.li
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{
                y: -4,
                boxShadow:
                  theme === "dark"
                    ? "0 12px 40px rgba(255,255,255,0.2)"
                    : "0 12px 40px rgba(0,0,0,0.08)",
              }}
            >
              <article
                className={`h-full rounded-2xl border p-6 shadow-sm transition-all duration-300 ${
                  theme === "dark"
                    ? "border-gray-700 bg-gray-900 hover:border-gray-600"
                    : "border-gray-100 bg-white"
                }`}
              >
                <figure
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg} ${feature.iconColor}`}
                  aria-hidden="true"
                >
                  <feature.icon size={24} />
                </figure>
                <h3 className={`mb-2 text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  {feature.description}
                </p>
              </article>
            </motion.li>
          ))}
        </ul>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link href="/login?mode=register">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-full px-8 py-4 text-lg font-bold transition-colors ${
                theme === "dark"
                  ? "bg-white text-gray-900 hover:bg-gray-100"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {isEnglish ? "Try It Free" : "Coba Sekarang - Gratis!"}
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
