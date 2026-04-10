"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";
import { IntelligenceDashboard } from "@/components/IntelligenceDashboard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Navbar from "@/components/ui/Navbar";
import { API_URL } from "@/lib/api";
import { getToken, requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { useTheme } from "@/lib/theme-context";
import { useNotification } from "@/components/ui/NotificationToast";
import { useLanguage } from "@/lib/language-context";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

type DashboardSummary = {
  today: {
    total_quantity: number;
    total_revenue: number;
    sales_count: number;
  };
  changes: {
    quantity_change: number;
    revenue_change: number;
  };
  burst_alerts: Array<{
    product_id: string;
    product_name: string;
    burst_score: number;
    burst_level: string;
  }>;
  top_products: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
  }>;
};

type Product = { id: string; name: string; unit?: string };

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const { language, locale } = useLanguage();

  const copy =
    language === "en"
      ? {
          title: "Dashboard Overview",
          subtitle: "Monitor daily performance and detect sales anomalies.",
          totalRevenue: "Total Revenue",
          totalItemsSold: "Items Sold",
          transactions: "Transactions",
          fromYesterday: "from yesterday",
          transactionsToday: "Successful transactions today",
          burstAlertTitle: "BURST ALERT DETECTED",
          burstNotificationTitle: "Burst Alert",
          burstNotificationMessage: (name: string) => `"${name}" is seeing an unusual sales spike`,
          burstCardMessage: (name: string, level: string) =>
            `Product ${name} is spiking (Level: ${level})`,
          viewAnalysis: "View Analysis",
          productList: "Product List",
          selectProduct: "Select a Product",
          selectProductHint: "Click a product from the sidebar to open its analysis.",
        }
      : {
          title: "Dashboard Overview",
          subtitle: "Pantau performa harian dan deteksi anomali penjualan.",
          totalRevenue: "Total Pendapatan",
          totalItemsSold: "Total Item Terjual",
          transactions: "Transaksi",
          fromYesterday: "dari kemarin",
          transactionsToday: "Transaksi berhasil hari ini",
          burstAlertTitle: "BURST ALERT TERDETEKSI",
          burstNotificationTitle: "Burst Alert",
          burstNotificationMessage: (name: string) => `"${name}" mengalami lonjakan penjualan`,
          burstCardMessage: (name: string, level: string) =>
            `Produk ${name} mengalami lonjakan (Level: ${level})`,
          viewAnalysis: "Lihat Analisa",
          productList: "Daftar Produk",
          selectProduct: "Pilih Produk",
          selectProductHint: "Klik produk dari sidebar untuk melihat analisa.",
        };

  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifiedBursts, setNotifiedBursts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!requireAuth(router)) {
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  const fetchProducts = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/products`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
        if (!selectedId && data.data?.length > 0) setSelectedId(data.data[0].id);
      }
    } catch (err) {
      logger.error("Gagal load produk:", err);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/analytics/summary`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      logger.error("Gagal load summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    Promise.all([fetchProducts(), fetchSummary()]);

    const interval = setInterval(fetchSummary, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!summary?.burst_alerts?.length) return;

    summary.burst_alerts.forEach((alert) => {
      if (!notifiedBursts.has(alert.product_id)) {
        addNotification({
          type: "burst",
          title: copy.burstNotificationTitle,
          message: copy.burstNotificationMessage(alert.product_name),
          productName: alert.product_name,
          burstLevel: alert.burst_level,
        });

        setNotifiedBursts((prev) => new Set([...prev, alert.product_id]));
      }
    });
  }, [summary, notifiedBursts, addNotification, copy]);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  if (!isAuthenticated) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen selection:bg-red-600 selection:text-white transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-slate-900"
      }`}
    >
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {copy.title}
              </h1>
              <p className={`mt-1 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                {copy.subtitle}
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={fetchSummary}
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 shadow-sm ${
                  theme === "dark" ? "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700" : "bg-white"
                }`}
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </motion.div>
          </motion.div>

          {summary && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <motion.div variants={itemVariants}>
                <Card
                  className={`transition-shadow ${
                    theme === "dark"
                      ? "border-gray-700 bg-gray-800 hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
                      : "hover:shadow-md"
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : ""}`}>
                      {copy.totalRevenue}
                    </CardTitle>
                    <span className="text-xs font-bold text-gray-500">IDR</span>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${theme === "dark" ? "text-white" : ""}`}>
                      {formatCurrency(summary.today.total_revenue)}
                    </div>
                    <p
                      className={`mt-1 flex items-center text-xs font-medium ${
                        summary.changes.revenue_change >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {summary.changes.revenue_change >= 0 ? (
                        <ArrowUpRight className="mr-1 h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4" />
                      )}
                      {Math.abs(summary.changes.revenue_change).toFixed(1)}% {copy.fromYesterday}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card
                  className={`transition-shadow ${
                    theme === "dark"
                      ? "border-gray-700 bg-gray-800 hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
                      : "hover:shadow-md"
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : ""}`}>
                      {copy.totalItemsSold}
                    </CardTitle>
                    <span className="text-xs font-bold text-gray-500">QTY</span>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${theme === "dark" ? "text-white" : ""}`}>
                      {summary.today.total_quantity} pcs
                    </div>
                    <p
                      className={`mt-1 flex items-center text-xs font-medium ${
                        summary.changes.quantity_change >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {summary.changes.quantity_change >= 0 ? (
                        <ArrowUpRight className="mr-1 h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4" />
                      )}
                      {Math.abs(summary.changes.quantity_change).toFixed(1)}% {copy.fromYesterday}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card
                  className={`transition-shadow ${
                    theme === "dark"
                      ? "border-gray-700 bg-gray-800 hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
                      : "hover:shadow-md"
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : ""}`}>
                      {copy.transactions}
                    </CardTitle>
                    <span className="text-xs font-bold text-gray-500">TRX</span>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${theme === "dark" ? "text-white" : ""}`}>
                      {summary.today.sales_count}
                    </div>
                    <p className={`mt-1 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      {copy.transactionsToday}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {summary?.burst_alerts && summary.burst_alerts.length > 0 && (
            <div className="animate-pulse rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900">{copy.burstAlertTitle}</h3>
                  <div className="mt-2 flex flex-col gap-2">
                    {summary.burst_alerts.map((alert) => (
                      <div
                        key={alert.product_id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-red-100 bg-white/60 p-2 text-sm"
                      >
                        <span className="text-red-800">
                          {copy.burstCardMessage(alert.product_name, alert.burst_level)}
                        </span>
                        <Button
                          size="sm"
                          className="h-7 border-0 bg-red-600 text-xs text-white hover:bg-red-700"
                          onClick={() => setSelectedId(alert.product_id)}
                        >
                          {copy.viewAnalysis}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
          >
            <Card className="lg:sticky lg:top-6 lg:col-span-2 shadow-sm">
              <CardHeader className={`border-b pb-3 ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
                <h3 className={`text-base font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {copy.productList}
                </h3>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  className={`max-h-[600px] space-y-1 overflow-y-auto p-2 ${theme === "dark" ? "scrollbar-dark" : ""}`}
                  style={
                    theme === "dark"
                      ? {
                          scrollbarColor: "#4b5563 #1f2937",
                          scrollbarWidth: "thin",
                        }
                      : {}
                  }
                >
                  {products.map((product, idx) => (
                    <motion.button
                      key={product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedId(product.id)}
                      className={`w-full truncate rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                        selectedId === product.id
                          ? theme === "dark"
                            ? "border border-red-800 bg-red-900/40 font-medium text-red-400 shadow-sm"
                            : "border border-red-200 bg-red-50 font-medium text-red-700 shadow-sm"
                          : theme === "dark"
                            ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {product.name}
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-10">
              <AnimatePresence mode="wait">
                {selectedId ? (
                  <motion.div
                    key={selectedId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IntelligenceDashboard productId={selectedId} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex h-[400px] items-center justify-center rounded-xl border-2 border-dashed text-center ${
                      theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50/50"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`mb-4 rounded-full p-4 shadow-sm ${theme === "dark" ? "bg-gray-700" : "bg-white"}`}>
                        <TrendingUp className={`h-8 w-8 ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`} />
                      </div>
                      <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        {copy.selectProduct}
                      </h3>
                      <p className={`mt-1 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        {copy.selectProductHint}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
