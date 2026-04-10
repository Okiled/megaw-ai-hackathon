"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Download, HelpCircle, RefreshCcw } from "lucide-react";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { ForecastPrediction, ProductIntelligence } from "@/types/intelligence";
import { OnboardingModal } from "./OnboardingModal";
import { AlertCard } from "./AlertCard";
import { API_URL } from "@/lib/api";
import { clearAuth, getToken } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";

type Props = { productId: string };
type Days = 7 | 14 | 30;
type Point = ForecastPrediction & { label: string; lower: number; upper: number };

function labelDate(date: string, locale: string) {
  try {
    return new Date(date).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return date;
  }
}

function seriesFrom(predictions: ForecastPrediction[], locale: string): Point[] {
  return predictions.map((item) => ({
    ...item,
    label: labelDate(item.date, locale),
    lower: item.lower_bound ?? item.predicted_quantity * 0.9,
    upper: item.upper_bound ?? item.predicted_quantity * 1.1,
  }));
}

function confidenceInfo(confidence: ProductIntelligence["confidence"]) {
  const overall = confidence?.overall || "MEDIUM";
  const pct = Math.round(((confidence?.dataQuality || 0.6) * 0.6 + (confidence?.modelAgreement || 0.5) * 0.4) * 100);
  return { overall, pct };
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

export function IntelligenceDashboard({ productId }: Props) {
  const { theme } = useTheme();
  const { language, locale } = useLanguage();
  const isEnglish = language === "en";
  const nf = new Intl.NumberFormat(locale);
  const [data, setData] = useState<ProductIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [hideAlert, setHideAlert] = useState(false);
  const [days, setDays] = useState<Days>(7);

  const t = isEnglish
    ? {
        title: "SME Dashboard", sub: "Smart forecasting and business recommendations for SMEs.", updated: "Updated",
        failed: "Failed to load intelligence.", load: "Failed to load product intelligence", retry: "Try again",
        refresh: "Refresh", export: "Export CSV", product: "Product", sales: "Your Sales", normal: "Sales Normal",
        viral: "Viral Alert", confidence: "Confidence Level", forecast: "Forecast", total: "Total Forecast",
        summary: "Forecast Summary", trend: "Trend", priority: "Priority", recommend: "Recommendations for You",
        portions: "portions", noForecast: "No forecast data.", total7: "Total 7 Days", avg: "Average / Day",
      }
    : {
        title: "Dashboard UMKM", sub: "Prediksi cerdas dan rekomendasi bisnis untuk UMKM.", updated: "Update",
        failed: "Gagal memuat intelijen.", load: "Gagal memuat intelijen produk", retry: "Coba lagi",
        refresh: "Refresh", export: "Export CSV", product: "Produk", sales: "Penjualan Anda", normal: "Penjualan Normal",
        viral: "Peringatan Viral", confidence: "Tingkat Kepercayaan", forecast: "Prediksi", total: "Total Prediksi",
        summary: "Ringkasan Prediksi", trend: "Trend", priority: "Prioritas", recommend: "Saran untuk Anda",
        portions: "porsi", noForecast: "Tidak ada data forecast.", total7: "Total 7 Hari", avg: "Rata-rata / Hari",
      };

  const fetchData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error(isEnglish ? "Token not found. Please sign in again." : "Token tidak ditemukan. Silakan login ulang.");
      const res = await fetch(`${API_URL}/api/intelligence/analyze/${productId}?days=${days}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        clearAuth();
        if (typeof window !== "undefined") window.location.href = "/";
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 120) || t.load);
      }
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || t.load);
      setData(json.data);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      logger.error("IntelligenceDashboard fetch error:", err);
      setError(err instanceof Error ? err.message : t.load);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days, isEnglish, productId, t.load]);

  useEffect(() => setHideAlert(false), [productId]);
  useEffect(() => {
    void fetchData();
    const id = setInterval(() => void fetchData(), 300000);
    return () => clearInterval(id);
  }, [fetchData]);

  const predictions = useMemo(() => data?.forecast?.predictions ?? [], [data]);
  const chartData = useMemo(() => seriesFrom(predictions, locale), [locale, predictions]);
  const confidence = confidenceInfo(data?.confidence || { overall: "MEDIUM", dataQuality: 0.5, modelAgreement: 0.5 });
  const qualityDays = Math.round((data?.confidence?.dataQuality || 0) * 90);
  const totalForecast = Math.round(data?.forecast?.totalForecast7d || 0);
  const avgPerDay = Math.round(predictions.length ? totalForecast / predictions.length : totalForecast / 7);
  const momentum = Math.round((((data?.realtime?.momentum?.combined || 1) - 1) * 100));
  const burstScore = data?.realtime?.burst?.score || 0;
  const burstLevel = (data?.realtime?.burst?.severity || "NORMAL").toUpperCase();
  const isBurst = burstLevel === "CRITICAL" || burstLevel === "HIGH";
  const trend = data?.forecast?.trend || "STABLE";
  const trendText = trend === "DECREASING" ? (isEnglish ? "Down" : "Turun") : trend === "INCREASING" ? (isEnglish ? "Up" : "Naik") : (isEnglish ? "Stable" : "Stabil");
  const salesText = momentum <= -5 ? (isEnglish ? "DOWN" : "TURUN") : momentum >= 5 ? (isEnglish ? "UP" : "NAIK") : (isEnglish ? "STABLE" : "STABIL");
  const confidenceText = confidence.pct > 80 ? (isEnglish ? "Highly Accurate" : "Sangat Akurat") : confidence.pct > 60 ? (isEnglish ? "Fairly Accurate" : "Cukup Akurat") : (isEnglish ? "Need More Data" : "Perlu Data Lagi");
  const priorityText = isBurst || momentum <= -5 ? (isEnglish ? "High" : "Tinggi") : (isEnglish ? "Normal" : "Normal");
  const fallback = trend === "DECREASING"
    ? isEnglish
      ? ["Create bundle promos or limited discounts.", "Post more actively on social media.", "Review competitor pricing."]
      : ["Buat promo bundling atau diskon terbatas.", "Aktif posting di media sosial.", "Cek harga kompetitor."]
    : isEnglish
      ? ["Keep product quality consistent.", "Make sure stock stays available.", "Improve customer service."]
      : ["Jaga konsistensi kualitas produk.", "Pastikan stok selalu tersedia.", "Tingkatkan layanan pelanggan."];
  const recommendation = data?.recommendations?.[0];
  const recommendationItems = recommendation?.suggestions || recommendation?.details || fallback;

  const exportCsv = () => {
    if (!chartData.length) return;
    const csv = [
      ["date", "lower_bound", "predicted_quantity", "upper_bound", "confidence"].join(","),
      ...chartData.map((p) => [p.date, p.lower.toFixed(2), p.predicted_quantity.toFixed(2), p.upper.toFixed(2), p.confidence || ""].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forecast_${productId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading && !data) return <Skeleton />;
  if (error) {
    return (
      <Card><CardContent className="space-y-3 p-6">
        <div className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" /><p className="text-base font-semibold">{t.failed}</p></div>
        <p className="text-base text-gray-600">{error}</p>
        <Button onClick={fetchData} className="w-fit">{t.retry}</Button>
      </CardContent></Card>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      {burstScore > 2.5 && !hideAlert && <AlertCard productName={data.productName || t.product} score={burstScore} level={burstLevel} onDismiss={() => setHideAlert(true)} />}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{t.title}: {data.productName || t.product}</h2>
            <button onClick={() => setShowHelp(true)} className={`rounded-full border p-1.5 shadow-sm ${theme === "dark" ? "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}><HelpCircle className="h-5 w-5" /></button>
          </div>
          <p className={`text-base ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{t.sub} {lastUpdated ? `${t.updated} ${lastUpdated.toLocaleTimeString(locale)}` : ""}</p>
          <p className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>{isEnglish ? `Data ${qualityDays} days | Accuracy ~${confidence.pct}% | Confidence ${confidence.overall}` : `Data ${qualityDays} hari | Akurasi ~${confidence.pct}% | Kepercayaan ${confidence.overall}`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={fetchData} className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${theme === "dark" ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-100" : ""}`}><RefreshCcw className="h-4 w-4" />{t.refresh}</Button>
          <Button variant="outline" onClick={exportCsv} className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${theme === "dark" ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-100" : ""}`}><Download className="h-4 w-4" />{t.export}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className={theme === "dark" ? "border-gray-700 bg-gray-800" : "bg-gradient-to-br from-red-50 to-red-100"}><CardContent className="p-5"><p className="text-xs uppercase tracking-wide text-gray-500">{t.sales}</p><p className="mt-2 text-2xl font-bold">{salesText}</p><p className="mt-1 text-sm text-gray-500">{momentum >= 0 ? (isEnglish ? `Up ${Math.abs(momentum)}% vs 2 weeks ago` : `Naik ${Math.abs(momentum)}% vs 2 minggu lalu`) : (isEnglish ? `Down ${Math.abs(momentum)}% vs 2 weeks ago` : `Turun ${Math.abs(momentum)}% vs 2 minggu lalu`)}</p></CardContent></Card>
        <Card className={theme === "dark" ? "border-gray-700 bg-gray-800" : "bg-gradient-to-br from-blue-50 to-blue-100"}><CardContent className="p-5"><p className="text-xs uppercase tracking-wide text-gray-500">{isBurst ? t.viral : t.normal}</p><p className="mt-2 text-2xl font-bold">{isBurst ? (isEnglish ? `Spike ${burstScore.toFixed(1)}x` : `Lonjakan ${burstScore.toFixed(1)}x`) : trendText}</p><p className="mt-1 text-sm text-gray-500">{isBurst ? (isEnglish ? "Today's sales are far above normal." : "Penjualan hari ini jauh lebih tinggi dari biasanya.") : (isEnglish ? "No sudden spike detected." : "Tidak ada lonjakan mendadak.")}</p></CardContent></Card>
        <Card className={theme === "dark" ? "border-gray-700 bg-gray-800" : "bg-gradient-to-br from-green-50 to-green-100"}><CardContent className="p-5"><p className="text-xs uppercase tracking-wide text-gray-500">{t.confidence}</p><p className="mt-2 text-2xl font-bold">{confidenceText}</p><p className="mt-1 text-sm text-gray-500">{isEnglish ? `Based on ${qualityDays} days of data` : `Berdasarkan ${qualityDays} hari data`}</p></CardContent></Card>
      </div>

      <Card className={theme === "dark" ? "bg-gray-800" : "bg-white"}><CardContent className="p-6">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h3 className={`text-base font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{isEnglish ? `Forecast for the next ${days} days` : `Prediksi ${days} hari ke depan`}</h3>
            <div className="flex gap-1">{([7, 14, 30] as Days[]).map((item) => <button key={item} onClick={() => setDays(item)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${days === item ? "bg-blue-600 text-white" : theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{item}{isEnglish ? "D" : "H"}</button>)}</div>
          </div>
          <div className="text-right"><p className="text-xs text-gray-500">{t.total}</p><p className="text-lg font-bold text-blue-400">{nf.format(totalForecast)} {t.portions}</p></div>
        </div>
        <div className="h-[360px] w-full">
          {chartData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#374151" : "#e5e7eb"} /><XAxis dataKey="label" tick={{ fill: theme === "dark" ? "#9ca3af" : "#374151", fontSize: 12 }} /><YAxis tick={{ fill: theme === "dark" ? "#9ca3af" : "#374151", fontSize: 12 }} tickFormatter={(v) => nf.format(v as number)} /><Tooltip formatter={(v: number) => `${nf.format(Number(v))} ${t.portions}`} contentStyle={{ backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff", border: theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb" }} /><Area type="monotone" dataKey="lower" stroke="none" fill={theme === "dark" ? "#1f2937" : "#ffffff"} fillOpacity={1} /><Area type="monotone" dataKey="upper" stroke="none" fill="#93c5fd" fillOpacity={0.2} /><Line type="monotone" dataKey="predicted_quantity" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4, fill: "#60a5fa" }} /></AreaChart></ResponsiveContainer> : <div className={`flex h-full items-center justify-center text-lg font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{t.noForecast}</div>}
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className={theme === "dark" ? "border-orange-800 bg-gray-800" : "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100"}><CardContent className="p-5"><h3 className={`mb-3 text-base font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{t.summary}</h3><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className={`rounded-lg p-3 text-center ${theme === "dark" ? "border border-gray-700 bg-gray-900" : "bg-white"}`}><p className="text-sm text-gray-500">{t.total7}</p><p className="text-2xl font-bold text-blue-500">{nf.format(totalForecast)}</p><p className="text-sm text-gray-400">{t.portions}</p></div><div className={`rounded-lg p-3 text-center ${theme === "dark" ? "border border-gray-700 bg-gray-900" : "bg-white"}`}><p className="text-sm text-gray-500">{t.avg}</p><p className="text-2xl font-bold text-green-500">{nf.format(avgPerDay)}</p><p className="text-sm text-gray-400">{t.portions}</p></div><div className={`rounded-lg p-3 text-center ${theme === "dark" ? "border border-gray-700 bg-gray-900" : "bg-white"}`}><p className="text-sm text-gray-500">{t.trend}</p><p className="text-2xl font-bold">{trendText}</p><p className="text-sm text-gray-400">{t.priority}: {priorityText}</p></div></div></CardContent></Card>
        <Card className={theme === "dark" ? "border-purple-800 bg-gray-800" : "border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100"}><CardContent className="p-5"><h3 className={`mb-3 text-base font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{t.recommend}</h3><div className={`rounded-lg p-4 ${theme === "dark" ? "border border-gray-700 bg-gray-900" : "bg-white"}`}><h4 className={`mb-3 text-base font-bold ${theme === "dark" ? "text-purple-400" : "text-purple-700"}`}>{recommendation?.message || (trend === "DECREASING" ? (isEnglish ? "Sales are slowing down. Increase promotion activity." : "Penjualan menurun, tingkatkan aktivitas promosi.") : (isEnglish ? "Sales are stable. Keep product quality consistent." : "Penjualan stabil, pertahankan kualitas."))}</h4><ul className="space-y-2">{recommendationItems.map((item, idx) => <li key={`${item}-${idx}`} className={`flex items-start gap-2 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}><span className="font-bold text-green-500">OK</span><span>{item}</span></li>)}</ul></div></CardContent></Card>
      </div>

      <OnboardingModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
