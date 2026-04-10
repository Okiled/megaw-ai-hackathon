"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, CheckCircle, FileSpreadsheet, FolderOpen, History, Minus, Package, Plus, Save, Upload } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { API_URL } from "@/lib/api";
import { getAuthHeaders, getToken, requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";

type Product = { id: string; name: string; unit?: string; price?: number };
type HistoryRow = { date: string; product_name: string; quantity: number; unit_price?: number | null; revenue?: number | null };

function getTodayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function InputPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { language, locale } = useLanguage();
  const copy = language === "en"
    ? {
        title: "Daily Sales Input", subtitle: "Enter sold quantities for each product", saleDate: "Sales Date",
        upload: "Upload Sales Data", chooseFile: "Choose File", saveAll: "Save All", summary: "Input Summary",
        history: "Latest Sales History", products: "Product List", noProducts: "No products yet", addProduct: "Add Product",
        important: "Products must be registered before sales data can be processed.", tips: "For better AI results, upload at least 30 consecutive days of sales data.",
        loadProducts: "Loading product list...", totalItems: "total items", unsupported: "Unsupported file format.",
        uploading: "Uploading file...", uploadDone: "File uploaded successfully.", uploadFail: "Failed to upload file",
        futureDate: "Date cannot be in the future", oldDate: "Date cannot be older than 1 year",
        sessionExpired: "Session expired. Please sign in again.", needOne: "Enter at least one product with quantity above 0",
        saved: (count: number) => `${count} products saved successfully.`, records: (count: number) => `${count} records`,
      }
    : {
        title: "Input Penjualan Harian", subtitle: "Masukkan jumlah terjual untuk setiap produk", saleDate: "Tanggal Penjualan",
        upload: "Upload Data Penjualan", chooseFile: "Pilih File", saveAll: "Simpan Semua", summary: "Ringkasan Input",
        history: "Riwayat Penjualan Terbaru", products: "Daftar Produk", noProducts: "Belum ada produk", addProduct: "Tambah Produk",
        important: "Produk harus didaftarkan terlebih dahulu agar data penjualan bisa diproses.", tips: "Untuk hasil AI lebih baik, upload minimal 30 hari data penjualan berturut-turut.",
        loadProducts: "Memuat daftar produk...", totalItems: "total item", unsupported: "Format file tidak didukung.",
        uploading: "Mengupload file...", uploadDone: "File berhasil diupload.", uploadFail: "Gagal upload file",
        futureDate: "Tanggal tidak boleh di masa depan", oldDate: "Tanggal tidak boleh lebih dari 1 tahun lalu",
        sessionExpired: "Session habis. Login ulang.", needOne: "Isi minimal 1 produk dengan quantity lebih dari 0",
        saved: (count: number) => `${count} produk berhasil disimpan.`, records: (count: number) => `${count} data`,
      };

  const [products, setProducts] = useState<Product[]>([]);
  const [entries, setEntries] = useState<Record<string, number>>({});
  const [saleDate, setSaleDate] = useState(getTodayDate());
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!requireAuth(router)) return;
    setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      setLoading(true);
      try {
        const [productsRes, historyRes] = await Promise.all([
          fetch(`${API_URL}/api/products`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/api/sales/history?limit=20`, { headers: getAuthHeaders() }),
        ]);
        const productsJson = await productsRes.json();
        const historyJson = await historyRes.json();
        if (productsJson.success) {
          setProducts(productsJson.data || []);
          const initial: Record<string, number> = {};
          (productsJson.data || []).forEach((product: Product) => {
            initial[product.id] = 0;
          });
          setEntries(initial);
        }
        if (historyJson.success) setHistory(historyJson.data || []);
      } catch (err) {
        logger.error("Input page load failed", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const validateDate = () => {
    const selected = new Date(saleDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selected > today) return copy.futureDate;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (selected < oneYearAgo) return copy.oldDate;
    return null;
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/(\.xlsx|\.xls|\.csv|\.docx)$/i.test(file.name)) {
      setMessage({ type: "error", text: copy.unsupported });
      return;
    }
    setUploading(true);
    setMessage({ type: "success", text: copy.uploading });
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sale_date", saleDate);
      const res = await fetch(`${API_URL}/api/sales/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setMessage({ type: data.success ? "success" : "error", text: data.success ? copy.uploadDone : data.error || copy.uploadFail });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : copy.uploadFail });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const token = getToken();
      if (!token) {
        setMessage({ type: "error", text: copy.sessionExpired });
        return;
      }
      const dateError = validateDate();
      if (dateError) {
        setMessage({ type: "error", text: dateError });
        return;
      }
      const payload = products
        .filter((product) => (entries[product.id] || 0) > 0)
        .map((product) => ({ product_id: product.id, product_name: product.name, quantity: entries[product.id] || 0 }));
      if (!payload.length) {
        setMessage({ type: "error", text: copy.needOne });
        return;
      }
      const res = await fetch(`${API_URL}/api/sales/bulk`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ sale_date: saleDate, entries: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage({ type: "success", text: copy.saved(payload.length) });
      const reset: Record<string, number> = {};
      products.forEach((product) => { reset[product.id] = 0; });
      setEntries(reset);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const totalProducts = Object.values(entries).filter((value) => value > 0).length;
  const totalQuantity = Object.values(entries).reduce((sum, value) => sum + value, 0);

  if (!isAuthenticated) {
    return <div className={`flex min-h-screen items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" /></div>;
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-black"}`}>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className={`rounded-lg p-2 ${theme === "dark" ? "bg-red-900/30" : "bg-red-100"}`}><FolderOpen className="text-[#DC2626]" size={24} /></div>
          <div>
            <h1 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>{copy.title}</h1>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{copy.subtitle}</p>
          </div>
        </div>

        <div className={`mb-4 flex items-start gap-3 rounded-xl border p-4 ${theme === "dark" ? "border-amber-800 bg-amber-900/20" : "border-amber-200 bg-amber-50"}`}>
          <AlertCircle className={`mt-0.5 h-5 w-5 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`} />
          <p className={`text-sm ${theme === "dark" ? "text-amber-300" : "text-amber-800"}`}>{copy.important}</p>
        </div>

        <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${theme === "dark" ? "border-blue-800 bg-blue-900/20" : "border-blue-200 bg-blue-50"}`}>
          <AlertCircle className={`mt-0.5 h-5 w-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
          <p className={`text-sm ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}>{copy.tips}</p>
        </div>

        <Card className="mb-6 border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className={`h-5 w-5 ${theme === "dark" ? "text-green-400" : "text-green-600"}`} />
                <p className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{copy.upload}</p>
              </div>
              <div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv,.docx" className="hidden" onChange={handleUpload} />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-green-600 text-white hover:bg-green-700">
                  <Upload className="mr-2 h-4 w-4" /> {copy.chooseFile}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-l-4 border-l-red-500">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Calendar className={`h-5 w-5 ${theme === "dark" ? "text-white" : "text-gray-500"}`} />
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>{copy.saleDate}</p>
                <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className={`bg-transparent text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`} />
              </div>
            </div>
            <Badge variant="secondary">{new Date(`${saleDate}T00:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</Badge>
          </CardContent>
        </Card>

        {message && (
          <div className={`mb-6 flex items-center gap-3 rounded-xl p-4 ${
            message.type === "success"
              ? theme === "dark" ? "border border-green-700 bg-green-900/40 text-green-300" : "border border-green-200 bg-green-50 text-green-700"
              : theme === "dark" ? "border border-red-700 bg-red-900/40 text-red-300" : "border border-red-200 bg-red-50 text-red-700"
          }`}>
            {message.type === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{message.text}</span>
          </div>
        )}

        <Card>
          <CardHeader className={`border-b ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Package className="h-5 w-5" /><h3 className="font-bold">{copy.products}</h3></div>
              <Badge variant="outline">{products.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center"><p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{copy.loadProducts}</p></div>
            ) : !products.length ? (
              <div className="py-12 text-center">
                <p className={`font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{copy.noProducts}</p>
                <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={() => router.push("/products")}>{copy.addProduct}</Button>
              </div>
            ) : (
              <div className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <h4 className={`truncate font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{product.name}</h4>
                      <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{product.unit || "pcs"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setEntries((prev) => ({ ...prev, [product.id]: Math.max(0, (prev[product.id] || 0) - 1) }))} className={`flex h-10 w-10 items-center justify-center rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}><Minus className="h-4 w-4" /></button>
                      <input type="number" value={entries[product.id] > 0 ? entries[product.id] : ""} placeholder="0" onChange={(e) => setEntries((prev) => ({ ...prev, [product.id]: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))} className={`h-12 w-20 rounded-lg border text-center text-lg font-bold ${theme === "dark" ? "border-gray-600 bg-gray-800 text-white" : "border-gray-200 bg-white text-gray-900"}`} />
                      <button type="button" onClick={() => setEntries((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }))} className={`flex h-10 w-10 items-center justify-center rounded-full ${theme === "dark" ? "bg-red-900/50" : "bg-red-100"}`}><Plus className="h-4 w-4 text-red-600" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 border-t-4 border-t-green-500">
          <CardContent className="p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{copy.summary}</p>
                <div className="flex items-center gap-4">
                  <div><span className="text-2xl font-bold">{totalProducts}</span></div>
                  <div><span className="text-2xl font-bold">{totalQuantity}</span> <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{copy.totalItems}</span></div>
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={submitting} isLoading={submitting} className="bg-green-600 text-white hover:bg-green-700">
                <Save className="mr-2 h-4 w-4" /> {copy.saveAll}
              </Button>
            </div>
          </CardContent>
        </Card>

        {history.length > 0 && (
          <Card className="mt-8">
            <CardHeader className={`border-b ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <h3 className="font-bold">{copy.history}</h3>
                <Badge variant="outline" className="ml-auto">{copy.records(history.length)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={theme === "dark" ? "bg-gray-800" : "bg-gray-50"}>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm">Produk</th>
                      <th className="px-4 py-3 text-right text-sm">Qty</th>
                      <th className="px-4 py-3 text-right text-sm">Harga</th>
                      <th className="px-4 py-3 text-right text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                    {history.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm">{new Date(row.date).toLocaleDateString(locale)}</td>
                        <td className="px-4 py-3 text-sm">{row.product_name}</td>
                        <td className="px-4 py-3 text-right text-sm">{row.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm">{row.unit_price ? new Intl.NumberFormat(locale, { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(row.unit_price) : "-"}</td>
                        <td className="px-4 py-3 text-right text-sm">{row.revenue ? new Intl.NumberFormat(locale, { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(row.revenue) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
