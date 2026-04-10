"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, Moon, ShoppingBag, Sun, User, X } from "lucide-react";
import { clearAuth, ensureDisplayName, getToken, getUserName } from "@/lib/auth";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";

let hasAnimated = false;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [nameVariant, setNameVariant] = useState<"full" | "lg11" | "md4">("full");

  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const copy =
    language === "en"
      ? {
          navLinks: [
            { name: "Home", href: "/" },
            { name: "Products", href: "/products" },
            { name: "Dashboard", href: "/dashboard" },
            { name: "Input Data", href: "/input" },
            { name: "Reports", href: "/reports" },
            { name: "Review", href: "/review" },
          ],
          user: "User",
          role: "SME",
          login: "Sign In",
          register: "Register",
          registerNow: "Register Now",
          logout: "Sign Out",
          languageLabel: "Language",
          lightMode: "Light Mode",
          darkMode: "Dark Mode",
        }
      : {
          navLinks: [
            { name: "Beranda", href: "/" },
            { name: "Produk", href: "/products" },
            { name: "Dashboard", href: "/dashboard" },
            { name: "Input Data", href: "/input" },
            { name: "Laporan", href: "/reports" },
            { name: "Review", href: "/review" },
          ],
          user: "Pengguna",
          role: "UMKM",
          login: "Masuk",
          register: "Daftar",
          registerNow: "Daftar Sekarang",
          logout: "Keluar",
          languageLabel: "Bahasa",
          lightMode: "Mode Terang",
          darkMode: "Mode Gelap",
        };

  const shouldAnimate = !hasAnimated && pathname === "/";

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = getToken();
      setIsLoggedIn(!!token);
      const storedName = getUserName() || ensureDisplayName();
      if (storedName) setUserName(storedName);
    }, 0);

    hasAnimated = true;

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const decideVariant = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth >= 1024) return setNameVariant("lg11");
      if (window.innerWidth >= 768) return setNameVariant("md4");
      return setNameVariant("full");
    };

    decideVariant();
    window.addEventListener("resize", decideVariant, { passive: true });
    return () => window.removeEventListener("resize", decideVariant);
  }, []);

  const truncate11Chars = (value: string) => {
    const text = value.trim();
    if (text.length <= 11) return text;
    const front = 4;
    const back = 11 - front - 3;
    return `${text.slice(0, front)}...${text.slice(-back)}`;
  };

  const firstFourWordsEllipsis = (value: string) => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      const text = words[0];
      if (text.length > 11) return `${text.slice(0, 4)}...`;
      return text;
    }

    if (words.length <= 6) return words.join(" ");
    return `${words.slice(0, 4).join(" ")} ...`;
  };

  const displayName = userName || copy.user;
  const resolvedName =
    nameVariant === "lg11"
      ? truncate11Chars(displayName)
      : nameVariant === "md4"
        ? firstFourWordsEllipsis(displayName)
        : displayName;

  const renderLanguageSwitch = () => (
    <div
      className={`inline-flex items-center rounded-full p-1 ${
        theme === "dark" ? "border border-gray-700 bg-gray-800" : "border border-gray-200 bg-gray-100"
      }`}
      aria-label={copy.languageLabel}
    >
      {(["id", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
            language === option
              ? "bg-[#DC2626] text-white"
              : theme === "dark"
                ? "text-gray-300 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <motion.nav
        initial={{ y: shouldAnimate ? -100 : 0 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed z-50 w-full transition-all duration-300 ${
          scrolled
            ? theme === "dark"
              ? "border-b border-gray-800 bg-gray-900/95 py-3 shadow-md backdrop-blur-md"
              : "bg-white/90 py-3 shadow-md backdrop-blur-md"
            : theme === "dark"
              ? "bg-gray-900 py-5"
              : "bg-white py-5"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DC2626] text-white transition-transform duration-300 group-hover:rotate-12">
                <ShoppingBag size={18} />
              </div>
              <span className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>
                MEGAW <span className="ml-1 text-[#DC2626]">AI</span>
              </span>
            </Link>

            <div className="hidden items-center space-x-8 md:flex">
              {copy.navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative pb-1 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "text-[#DC2626]"
                      : theme === "dark"
                        ? "text-gray-300 hover:text-[#DC2626]"
                        : "text-black/70 hover:text-[#DC2626]"
                  }`}
                >
                  {link.name}
                  {pathname === link.href && (
                    <motion.div
                      layoutId="navbar-underline"
                      className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[#DC2626]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="hidden items-center gap-4 md:flex">
              {renderLanguageSwitch()}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`rounded-full p-2 transition-colors ${
                  theme === "dark"
                    ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title={theme === "dark" ? copy.lightMode : copy.darkMode}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>

              {isLoggedIn === null ? (
                <div className={`h-9 w-24 animate-pulse rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`} />
              ) : isLoggedIn ? (
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 border-r pr-4 ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`}>
                    <div className="hidden max-w-[12rem] overflow-hidden text-ellipsis whitespace-nowrap text-right md:block">
                      <p className={`text-sm font-bold leading-none ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                        {resolvedName}
                      </p>
                      <p className={`text-[10px] ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{copy.role}</p>
                    </div>
                    <div
                      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition ${
                        theme === "dark"
                          ? "border-gray-700 bg-gray-800 hover:bg-gray-700"
                          : "border-gray-200 bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <User size={18} className={theme === "dark" ? "text-gray-300" : "text-gray-600"} />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      clearAuth();
                      setIsLoggedIn(false);
                      setUserName(null);
                      router.push("/");
                    }}
                    className={`transition-colors ${theme === "dark" ? "text-gray-400 hover:text-[#DC2626]" : "text-gray-500 hover:text-[#DC2626]"}`}
                    title={copy.logout}
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`text-sm font-semibold transition-colors ${theme === "dark" ? "text-gray-300 hover:text-[#DC2626]" : "text-black hover:text-[#DC2626]"}`}
                  >
                    {copy.login}
                  </Link>
                  <Link href="/login?mode=register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-full bg-[#DC2626] px-5 py-2 text-sm font-bold text-white shadow-lg transition-colors hover:bg-red-700"
                    >
                      {copy.register}
                    </motion.button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 md:hidden">
              {renderLanguageSwitch()}

              <button
                onClick={toggleTheme}
                className={`rounded-full p-2 transition-colors ${
                  theme === "dark" ? "bg-gray-800 text-yellow-400" : "bg-gray-100 text-gray-600"
                }`}
                title={theme === "dark" ? copy.lightMode : copy.darkMode}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={() => setIsOpen((prev) => !prev)}
                className={`transition-colors ${theme === "dark" ? "text-white hover:text-[#DC2626]" : "text-black hover:text-[#DC2626]"}`}
              >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`overflow-hidden shadow-xl md:hidden ${
                theme === "dark" ? "border-t border-gray-800 bg-gray-900" : "border-t border-gray-100 bg-white"
              }`}
            >
              <div className="flex flex-col space-y-2 px-4 pb-6 pt-4">
                {copy.navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block rounded-md px-3 py-3 text-base font-medium ${
                      pathname === link.href
                        ? theme === "dark"
                          ? "border-l-4 border-[#DC2626] bg-red-900/30 text-[#DC2626]"
                          : "border-l-4 border-[#DC2626] bg-red-50 text-[#DC2626]"
                        : theme === "dark"
                          ? "text-gray-300 hover:bg-gray-800 hover:text-[#DC2626]"
                          : "text-gray-700 hover:bg-gray-50 hover:text-[#DC2626]"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className={`my-2 space-y-2 border-t pt-2 ${theme === "dark" ? "border-gray-800" : "border-gray-100"}`}>
                  {isLoggedIn === null ? (
                    <div className="px-3 py-3">
                      <div className={`h-10 w-full animate-pulse rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`} />
                    </div>
                  ) : isLoggedIn ? (
                    <>
                      <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                            theme === "dark" ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-white"
                          }`}
                        >
                          <User size={16} className={theme === "dark" ? "text-gray-300" : "text-gray-600"} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                            {displayName} {copy.role}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          clearAuth();
                          setIsLoggedIn(false);
                          setIsOpen(false);
                          router.push("/");
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-3 font-medium text-red-500 ${
                          theme === "dark" ? "hover:bg-red-900/30" : "hover:bg-red-50"
                        }`}
                      >
                        <LogOut size={18} /> {copy.logout}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <button
                          className={`w-full px-3 py-3 text-left font-medium hover:text-[#DC2626] ${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {copy.login}
                        </button>
                      </Link>
                      <Link href="/login?mode=register" onClick={() => setIsOpen(false)}>
                        <button className="w-full rounded-lg bg-[#DC2626] px-3 py-3 font-bold text-white shadow-md">
                          {copy.registerNow}
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      <div className="h-24" />
    </>
  );
}
