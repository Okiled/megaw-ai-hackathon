"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  DollarSign,
  Lightbulb,
  Minus,
  Package,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchWithAuth, API_URL } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";

interface ReportData {
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalQuantity: number;
    totalRevenue: number;
  };
  dailyData?: Array<{
    date: string;
    quantity: number;
    revenue: number;
  }>;
  topPerformers: Array<{
    id?: string;
    name: string;
    quantity: number;
    revenue?: number;
    momentum?: string;
    momentumValue?: number;
  }>;
  attentionNeeded: Array<{
    id?: string;
    name: string;
    status: string;
    detail: string;
    priority?: string;
  }>;
  insights?: string[];
  statusCounts?: {
    trending_up: number;
    growing: number;
    stable: number;
    declining: number;
    falling: number;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { language, locale } = useLanguage();

  const copy =
    language === "en"
      ? {
          loadError: "Failed to load data",
          serverError: "Failed to reach the server",
          preparing: "Preparing report...",
          retry: "Try Again",
          title: "Weekly Report",
          period: "Period",
          refresh: "Refresh",
          totalSold: "Total Sold",
          totalRevenue: "Total Revenue",
          risingProducts: "Rising Products",
          needsAttention: "Needs Attention",
          thisWeek: "this week",
          outOf: (count: number) => `out of ${count} products`,
          actionHint: "products need action",
          insights: "AI Insights",
          dailySales: "Daily Sales",
          noDailyData: "No daily data yet",
          statusDistribution: "Product Status Distribution",
          topPerformers: "Top Performers",
          noSalesData: "No sales data yet.",
          sold: (count: number) => `${count} sold`,
          attentionNeeded: "Needs Attention",
          allSafe: "All products look safe",
          allSafeHint: "No anomaly or sharp decline detected.",
          detailTitle: "This Week Product Detail",
          productsCount: (count: number) => `${count} products`,
          product: "Product",
          status: "Status",
          stable: "Stable",
          trendingUp: "Trending Up",
          growing: "Growing",
          declining: "Declining",
          falling: "Falling",
          unknown: "Unknown",
        }
      : {
          loadError: "Gagal memuat data",
          serverError: "Gagal menghubungi server",
          preparing: "Menyiapkan laporan...",
          retry: "Coba Lagi",
          title: "Laporan Mingguan",
          period: "Periode",
          refresh: "Refresh",
          totalSold: "Total Terjual",
          totalRevenue: "Total Revenue",
          risingProducts: "Produk Naik",
          needsAttention: "Perlu Perhatian",
          thisWeek: "minggu ini",
          outOf: (count: number) => `dari ${count} produk`,
          actionHint: "produk butuh aksi",
          insights: "AI Insights",
          dailySales: "Penjualan Harian",
          noDailyData: "Belum ada data harian",
          statusDistribution: "Distribusi Status Produk",
          topPerformers: "Top Performers",
          noSalesData: "Belum ada data penjualan.",
          sold: (count: number) => `${count} terjual`,
          attentionNeeded: "Perlu Perhatian",
          allSafe: "Semua produk aman",
          allSafeHint: "Tidak ada anomali atau penurunan drastis.",
          detailTitle: "Detail Produk Minggu Ini",
          productsCount: (count: number) => `${count} produk`,
          product: "Produk",
          status: "Status",
          stable: "Stabil",
          trendingUp: "Trending Up",
          growing: "Growing",
          declining: "Declining",
          falling: "Falling",
          unknown: "Tidak diketahui",
        };

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!requireAuth(router)) return;
    setIsAuthenticated(true);
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/reports/weekly`);
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      } else {
        setError(data.error || copy.loadError);
      }
    } catch (err) {
      logger.error("Reports fetch error:", err);
      setError(copy.serverError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  const getMomentumIcon = (momentum?: string) => {
    if (!momentum) return <Minus className="h-4 w-4 text-gray-400" />;
    switch (momentum) {
      case "TRENDING_UP":
      case "GROWING":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "FALLING":
      case "DECLINING":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getMomentumBadge = (momentum?: string, value?: number) => {
    const pct = `${((value || 0) * 100).toFixed(1)}%`;
    switch (momentum) {
      case "TRENDING_UP":
        return <Badge className="bg-green-100 text-green-700">Up {pct}</Badge>;
      case "GROWING":
        return <Badge className="bg-emerald-50 text-emerald-600">Grow {pct}</Badge>;
      case "FALLING":
        return <Badge className="bg-red-100 text-red-700">Down {pct}</Badge>;
      case "DECLINING":
        return <Badge className="bg-orange-100 text-orange-700">Decline {pct}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">{copy.stable}</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string, status?: string) => {
    const label = status || copy.unknown;
    switch (priority) {
      case "critical":
        return <Badge className="animate-pulse bg-red-500 text-white">{label}</Badge>;
      case "high":
        return <Badge className="bg-orange-500 text-white">{label}</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">{label}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
          <span className={`ml-3 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            {copy.preparing}
          </span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-8 text-center">
          <div className="rounded-lg bg-white p-8 shadow">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-orange-500" />
            <p className="mb-4 text-gray-600">{error || copy.loadError}</p>
            <Button onClick={loadData}>{copy.retry}</Button>
          </div>
        </div>
      </div>
    );
  }

  const statusCounts = report.statusCounts || {
    trending_up: 0,
    growing: 0,
    stable: 0,
    declining: 0,
    falling: 0,
  };
  const totalStatusCount = Object.values(statusCounts).reduce((sum, value) => sum + value, 0);
  const dailyData = report.dailyData || [];
  const insights = report.insights || [];

  return (
    <div
      className={`min-h-screen selection:bg-red-600 selection:text-white transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-slate-900"
      }`}
    >
      <Navbar />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {copy.title}
            </h1>
            <div className={`mt-1 flex items-center gap-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {copy.period}: {formatDate(report.dateRange.start)} - {formatDate(report.dateRange.end)}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={loadData}
            className={`flex items-center gap-2 ${
              theme === "dark" ? "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700" : ""
            }`}
          >
            <RefreshCcw className="h-4 w-4" />
            {copy.refresh}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className={`${theme === "dark" ? "border-blue-700 bg-gradient-to-br from-blue-900/40 to-blue-800/40" : "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100"}`}>
            <CardContent className="flex h-[100px] items-center justify-center p-4">
              <div className="flex w-full items-center gap-3">
                <div className={`shrink-0 rounded-full p-2.5 ${theme === "dark" ? "bg-blue-800 text-blue-300" : "bg-blue-200 text-blue-700"}`}>
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                    {copy.totalSold}
                  </p>
                  <p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {report.summary.totalQuantity || 0}
                  </p>
                  <p className={`text-xs ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                    {copy.thisWeek}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme === "dark" ? "border-green-700 bg-gradient-to-br from-green-900/40 to-green-800/40" : "border-green-200 bg-gradient-to-br from-green-50 to-green-100"}`}>
            <CardContent className="flex h-[100px] items-center justify-center p-4">
              <div className="flex w-full items-center gap-3">
                <div className={`shrink-0 rounded-full p-2.5 ${theme === "dark" ? "bg-green-800 text-green-300" : "bg-green-200 text-green-700"}`}>
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-green-300" : "text-green-700"}`}>
                    {copy.totalRevenue}
                  </p>
                  <p className={`truncate text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(report.summary.totalRevenue || 0)}
                  </p>
                  <p className={`text-xs ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>
                    {copy.thisWeek}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme === "dark" ? "border-purple-700 bg-gradient-to-br from-purple-900/40 to-purple-800/40" : "border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100"}`}>
            <CardContent className="flex h-[100px] items-center justify-center p-4">
              <div className="flex w-full items-center gap-3">
                <div className={`shrink-0 rounded-full p-2.5 ${theme === "dark" ? "bg-purple-800 text-purple-300" : "bg-purple-200 text-purple-700"}`}>
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-purple-300" : "text-purple-700"}`}>
                    {copy.risingProducts}
                  </p>
                  <p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {statusCounts.trending_up + statusCounts.growing}
                  </p>
                  <p className={`text-xs ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`}>
                    {copy.outOf(totalStatusCount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme === "dark" ? "border-orange-700 bg-gradient-to-br from-orange-900/40 to-orange-800/40" : "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100"}`}>
            <CardContent className="flex h-[100px] items-center justify-center p-4">
              <div className="flex w-full items-center gap-3">
                <div className={`shrink-0 rounded-full p-2.5 ${theme === "dark" ? "bg-orange-800 text-orange-300" : "bg-orange-200 text-orange-700"}`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-orange-300" : "text-orange-700"}`}>
                    {copy.needsAttention}
                  </p>
                  <p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {report.attentionNeeded?.length || 0}
                  </p>
                  <p className={`text-xs ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`}>
                    {copy.actionHint}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {insights.length > 0 && (
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <h3 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {copy.insights}
                </h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {insights.map((insight, idx) => (
                  <div key={idx} className={`rounded-lg p-3 text-sm ${theme === "dark" ? "bg-yellow-900/30 text-yellow-200" : "bg-yellow-50 text-gray-700"}`}>
                    {insight}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className={`border-b pb-2 ${theme === "dark" ? "border-gray-700" : ""}`}>
              <div className="flex items-center gap-2">
                <BarChart3 className={`h-5 w-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                <h3 className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {copy.dailySales}
                </h3>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {dailyData.length > 0 ? (
                <div className="space-y-3">
                  {dailyData.map((day, idx) => {
                    const maxQty = Math.max(...dailyData.map((item) => item.quantity), 1);
                    const pct = (day.quantity / maxQty) * 100;
                    return (
                      <div key={idx}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                            {formatDate(day.date)}
                          </span>
                          <span className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {day.quantity} item
                          </span>
                        </div>
                        <div className={`h-3 overflow-hidden rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                          <div className="h-full rounded-full bg-red-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`py-8 text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  <BarChart3 className={`mx-auto mb-2 h-12 w-12 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`} />
                  <p>{copy.noDailyData}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={`border-b pb-2 ${theme === "dark" ? "border-gray-700" : ""}`}>
              <div className="flex items-center gap-2">
                <Package className={`h-5 w-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                <h3 className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {copy.statusDistribution}
                </h3>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {[
                  { label: copy.trendingUp, count: statusCounts.trending_up, color: "bg-green-500" },
                  { label: copy.growing, count: statusCounts.growing, color: "bg-emerald-400" },
                  { label: copy.stable, count: statusCounts.stable, color: "bg-gray-400" },
                  { label: copy.declining, count: statusCounts.declining, color: "bg-orange-400" },
                  { label: copy.falling, count: statusCounts.falling, color: "bg-red-500" },
                ].map((item) => {
                  const pct = totalStatusCount > 0 ? (item.count / totalStatusCount) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>{item.label}</span>
                        <span className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {item.count} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className={`h-2 overflow-hidden rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                        <div className={`h-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className={`border-b pb-3 ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h3 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {copy.topPerformers}
                </h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {!report.topPerformers || report.topPerformers.length === 0 ? (
                <div className="py-8 text-center">
                  <Trophy className={`mx-auto mb-2 h-12 w-12 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`} />
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    {copy.noSalesData}
                  </p>
                </div>
              ) : (
                report.topPerformers.slice(0, 5).map((product, idx) => (
                  <div
                    key={product.id || idx}
                    className={`flex items-center justify-between rounded-lg p-3 transition-colors ${
                      theme === "dark" ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          idx === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : idx === 1
                              ? theme === "dark"
                                ? "bg-gray-600 text-gray-200"
                                : "bg-gray-200 text-gray-700"
                              : idx === 2
                                ? "bg-orange-100 text-orange-700"
                                : theme === "dark"
                                  ? "bg-gray-700 text-gray-400"
                                  : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <span className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                          {product.name}
                        </span>
                        <div className="mt-0.5 flex items-center gap-2">
                          {getMomentumIcon(product.momentum)}
                          <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            {copy.sold(product.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getMomentumBadge(product.momentum, product.momentumValue)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className={`border-b pb-3 ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {copy.attentionNeeded}
                </h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {!report.attentionNeeded || report.attentionNeeded.length === 0 ? (
                <div className="py-6 text-center">
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>
                    {copy.allSafe}
                  </p>
                  <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                    {copy.allSafeHint}
                  </p>
                </div>
              ) : (
                report.attentionNeeded.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 ${
                      theme === "dark"
                        ? item.priority === "critical"
                          ? "border-red-800 bg-red-900/30"
                          : item.priority === "high"
                            ? "border-orange-800 bg-orange-900/30"
                            : "border-yellow-800 bg-yellow-900/30"
                        : item.priority === "critical"
                          ? "border-red-200 bg-red-50"
                          : item.priority === "high"
                            ? "border-orange-200 bg-orange-50"
                            : "border-yellow-200 bg-yellow-50"
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between">
                      <span className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        {item.name}
                      </span>
                      {getPriorityBadge(item.priority, item.status)}
                    </div>
                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      {item.detail}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {report.topPerformers && report.topPerformers.length > 0 && (
          <Card>
            <CardHeader className={`border-b ${theme === "dark" ? "border-gray-700" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className={`h-5 w-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                  <h3 className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {copy.detailTitle}
                  </h3>
                </div>
                <Badge variant="secondary">{copy.productsCount(report.topPerformers.length)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={theme === "dark" ? "bg-gray-800" : "bg-gray-50"}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>#</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{copy.product}</th>
                      <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Qty</th>
                      <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Revenue</th>
                      <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{copy.status}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
                    {report.topPerformers.map((product, idx) => (
                      <tr key={product.id || idx} className={theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-50"}>
                        <td className={`px-6 py-4 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{idx + 1}</td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{product.name}</span>
                        </td>
                        <td className={`px-6 py-4 text-right text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{product.quantity}</td>
                        <td className={`px-6 py-4 text-right text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{formatCurrency(product.revenue || 0)}</td>
                        <td className="px-6 py-4 text-center">{getMomentumBadge(product.momentum, product.momentumValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
