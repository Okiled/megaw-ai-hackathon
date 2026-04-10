"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Mail } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { API_URL } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { sanitizeEmail } from "@/lib/sanitize";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";

const translateErrorMessage = (message: string, language: "id" | "en"): string => {
  const errorMap =
    language === "en"
      ? {
          "Invalid login credentials": "The email or password you entered is incorrect",
          "Invalid credentials": "The email or password you entered is incorrect",
          "User not found": "No account was found for that email address",
          "Email not verified": "Your email has not been verified yet. Please check your inbox",
          "Invalid password": "The password you entered is incorrect",
          "Wrong password": "The password you entered is incorrect",
          "Password incorrect": "The password you entered is incorrect",
          "Email already exists": "This email is already registered. Please sign in or use another email",
          "Email already registered": "This email is already registered. Please sign in or use another email",
          "User already exists": "This email is already registered. Please sign in or use another email",
          "Password too short": "Password must be at least 6 characters",
          "Password too weak": "Password is too weak. Use a stronger combination",
          "Invalid email": "Invalid email format",
          "Invalid email format": "Invalid email format",
          "Network error": "Connection lost. Please check your internet access",
          "Server error": "A server error occurred. Please try again later",
          "Too many requests": "Too many attempts. Please wait a moment and try again",
          "Rate limit exceeded": "Too many attempts. Please wait a moment and try again",
          "Login gagal": "Sign in failed. Please check your email and password",
          "Register gagal": "Registration failed. Please try again",
        }
      : {
          "Invalid login credentials": "Email atau kata sandi yang Anda masukkan salah",
          "Invalid credentials": "Email atau kata sandi yang Anda masukkan salah",
          "User not found": "Akun dengan email tersebut tidak ditemukan",
          "Email not verified": "Email Anda belum diverifikasi. Silakan cek inbox email Anda",
          "Invalid password": "Kata sandi yang Anda masukkan salah",
          "Wrong password": "Kata sandi yang Anda masukkan salah",
          "Password incorrect": "Kata sandi yang Anda masukkan salah",
          "Email already exists": "Email sudah terdaftar. Silakan gunakan email lain atau masuk",
          "Email already registered": "Email sudah terdaftar. Silakan gunakan email lain atau masuk",
          "User already exists": "Email sudah terdaftar. Silakan gunakan email lain atau masuk",
          "Password too short": "Kata sandi minimal 6 karakter",
          "Password too weak": "Kata sandi terlalu lemah. Gunakan kombinasi huruf dan angka",
          "Invalid email": "Format email tidak valid",
          "Invalid email format": "Format email tidak valid",
          "Network error": "Koneksi terputus. Periksa jaringan internet Anda",
          "Server error": "Terjadi kesalahan pada server. Silakan coba lagi nanti",
          "Too many requests": "Terlalu banyak percobaan. Silakan tunggu beberapa saat",
          "Rate limit exceeded": "Terlalu banyak percobaan. Silakan tunggu beberapa saat",
          "Login gagal": "Gagal masuk. Periksa kembali email dan kata sandi Anda",
          "Register gagal": "Gagal mendaftar. Silakan coba lagi",
        };

  const lowerMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(errorMap)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  return message;
};

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const copy =
    language === "en"
      ? {
          verifiedSuccess: "Email verified successfully. Please sign in.",
          signInTitle: "Sign In to Megaw AI",
          registerTitle: "Create Your Account",
          emailLabel: "Email",
          passwordLabel: "Password",
          signIn: "Sign In",
          register: "Create Account",
          noAccount: "Do not have an account yet?",
          haveAccount: "Already have an account?",
          registerNow: "Register now",
          backToLogin: "Back to Sign In",
          checkEmail: "Check Your Email",
          verificationMessage:
            "We have sent a verification link to {{email}}. Open the link to activate your account.",
          noEmail: "Did not get the email?",
          spamHint: "Check your spam folder or ",
          retryRegister: "register again",
          languageLabel: "Language",
        }
      : {
          verifiedSuccess: "Email berhasil diverifikasi. Silakan login.",
          signInTitle: "Masuk ke Megaw AI",
          registerTitle: "Daftar Akun Baru",
          emailLabel: "Email",
          passwordLabel: "Password",
          signIn: "Masuk",
          register: "Buat Akun",
          noAccount: "Belum punya akun?",
          haveAccount: "Sudah punya akun?",
          registerNow: "Daftar sekarang",
          backToLogin: "Kembali ke Login",
          checkEmail: "Cek Email Anda",
          verificationMessage:
            "Kami telah mengirim link verifikasi ke {{email}}. Klik link tersebut untuk mengaktifkan akun Anda.",
          noEmail: "Tidak menerima email?",
          spamHint: "Cek folder spam atau ",
          retryRegister: "daftar ulang",
          languageLabel: "Bahasa",
        };

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showVerificationSent, setShowVerificationSent] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setEmailVerified(true);
    }
    if (searchParams.get("mode") === "register") {
      setMode("register");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const sanitizedEmail = sanitizeEmail(email);
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail, password }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || "Login gagal");
      }

      const accessToken = data?.data?.access_token;
      const userId = data?.data?.user?.id;
      const userEmail = data?.data?.user?.email;

      if (accessToken && userId) {
        setAuth(accessToken, userId, userEmail);
      }

      router.push("/products");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login gagal";
      setError(translateErrorMessage(message, language));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const sanitizedEmail = sanitizeEmail(email);
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail, password }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || "Register gagal");
      }

      if (data?.data?.requires_verification) {
        setShowVerificationSent(true);
        return;
      }

      const accessToken = data?.data?.access_token;
      const userId = data?.data?.user?.id;
      const userEmail = data?.data?.user?.email;

      if (accessToken && userId) {
        setAuth(accessToken, userId, userEmail);
        router.push("/products");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Register gagal";
      setError(translateErrorMessage(message, language));
    } finally {
      setLoading(false);
    }
  };

  const renderLanguageSwitch = () => (
    <div
      className={`fixed top-4 right-4 inline-flex items-center rounded-full p-1 ${
        theme === "dark" ? "border border-gray-700 bg-gray-800" : "border border-gray-200 bg-white"
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

  if (showVerificationSent) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center overflow-hidden transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        {renderLanguageSwitch()}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-6">
            <CardContent className="py-8 text-center">
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  theme === "dark" ? "bg-green-900/30" : "bg-green-100"
                }`}
              >
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className={`mb-2 text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {copy.checkEmail}
              </h2>
              <p className={`mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {copy.verificationMessage.replace("{{email}}", email)}
              </p>
              <Button
                onClick={() => {
                  setShowVerificationSent(false);
                  setMode("login");
                }}
                className="w-full"
              >
                {copy.backToLogin}
              </Button>
              <p className={`mt-4 text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                {copy.noEmail} {copy.spamHint}
                <span
                  className="cursor-pointer text-blue-500 hover:text-blue-400"
                  onClick={() => setShowVerificationSent(false)}
                >
                  {copy.retryRegister}
                </span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen items-center justify-center overflow-hidden transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {renderLanguageSwitch()}
      <motion.div
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          <CardHeader>
            <motion.h2
              key={mode}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`text-center text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {mode === "login" ? copy.signInTitle : copy.registerTitle}
            </motion.h2>
          </CardHeader>

          <CardContent>
            {emailVerified && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-lg border p-3 ${
                  theme === "dark" ? "border-green-800 bg-green-900/30" : "border-green-200 bg-green-50"
                }`}
              >
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className={`text-sm ${theme === "dark" ? "text-green-400" : "text-green-700"}`}>
                  {copy.verifiedSuccess}
                </p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.form
                  key="login-form"
                  onSubmit={handleLogin}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <Input
                    label={copy.emailLabel}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <Input
                    label={copy.passwordLabel}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button type="submit" className="w-full" isLoading={loading}>
                    {copy.signIn}
                  </Button>

                  <p className={`text-center text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {copy.noAccount}{" "}
                    <span
                      onClick={() => setMode("register")}
                      className="cursor-pointer text-blue-500 hover:text-blue-400"
                    >
                      {copy.registerNow}
                    </span>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="register-form"
                  onSubmit={handleRegister}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <Input
                    label={copy.emailLabel}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <Input
                    label={copy.passwordLabel}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button type="submit" className="w-full" isLoading={loading}>
                    {copy.register}
                  </Button>

                  <p className={`text-center text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {copy.haveAccount}{" "}
                    <span
                      onClick={() => setMode("login")}
                      className="cursor-pointer text-blue-500 hover:text-blue-400"
                    >
                      {copy.signIn}
                    </span>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
