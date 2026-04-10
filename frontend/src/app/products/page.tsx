"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import Navbar from '@/components/ui/Navbar';
import { Package, Plus, TrendingUp, TrendingDown, Minus, PackageOpen, BarChart3, List, ChevronRight, Sparkles, Trash2, ChevronLeft } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getUserId, getAuthHeaders, handleAuthError, requireAuth } from "@/lib/auth";
import { sanitizeProductName, sanitizeNumber } from "@/lib/sanitize";
import { logger } from "@/lib/logger";
import { useTheme } from "@/lib/theme-context";
import { useNotification } from "@/components/ui/NotificationToast";
import { useLanguage } from "@/lib/language-context";

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Pcs' },
  { value: 'porsi', label: 'Porsi' },
  { value: 'cup', label: 'Cup' },
  { value: 'botol', label: 'Botol' },
  { value: 'bungkus', label: 'Bungkus' },
  { value: 'kg', label: 'Kg' },
  { value: 'box', label: 'Box' },
];

interface ProductWithAnalytics {
  id: string;
  name: string;
  unit: string;
  price: number | null;
  analytics: {
    momentum_combined: number;
    momentum_label: string;
    burst_score: number;
    burst_level: string;
    priority_score: number;
    priority_rank: number | null;
  } | null;
  sparkline: number[];
  totalSales7d: number;
}

type ViewMode = 'grid' | 'ranking';

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const { language, locale } = useLanguage();
  const isEnglish = language === "en";
  const copy = isEnglish
    ? {
        title: "Product Management",
        subtitle: "Manage your catalog, performance, and product ranking.",
        ranking: "Ranking",
        grid: "Grid",
        total: "Total",
        items: "items",
        addNew: "Add New Product",
        addDesc: "Register your menu items here.",
        productName: "Product Name",
        productPlaceholder: "Example: Honey Grilled Chicken",
        unitLabel: "Unit",
        unitPlaceholder: "Choose unit...",
        priceLabel: "Price (Optional)",
        pricePlaceholder: "Example: 25000",
        saveProduct: "Save Product",
        loadingCatalog: "Loading catalog data...",
        emptyTitle: "No products yet",
        emptyDesc: "Your catalog is still empty. Add your first product to get started.",
        page: "Page",
        products: "products",
        sold7d: "sold (7d)",
        delete: "Delete",
        cancel: "Cancel",
        deleteTitle: "Delete product",
        prev: "Previous",
        next: "Next",
        nameRequired: "Product name cannot be empty",
        unitRequired: "Please choose a unit",
        priceNumber: "Price must be numeric",
        priceNegative: "Price cannot be negative",
        priceLarge: "Price is too large",
        nameMin: (count: number) => `Product name must be at least ${count} characters`,
        nameMax: (count: number) => `Product name must be at most ${count} characters`,
        nameChars: "Product name may only contain letters, numbers, spaces, and (-_.,)",
        duplicate: (name: string) => `Product "${name}" already exists. Use a different name.`,
        saveFailed: "Failed to save",
        deleteFailed: "Failed to delete product",
        deleteFailedWithReason: (reason: string) => `Failed to delete: ${reason}`,
        routeMissing: "Route not found (404). The backend may need a restart.",
        burstTitle: "Burst Alert Detected",
        burstMessage: (name: string) => `Product "${name}" is seeing a sales spike`,
      }
    : {
        title: "Manajemen Produk",
        subtitle: "Kelola katalog, lihat performa, dan ranking produk.",
        ranking: "Ranking",
        grid: "Grid",
        total: "Total",
        items: "item",
        addNew: "Tambah Produk Baru",
        addDesc: "Daftarkan menu jualanmu di sini.",
        productName: "Nama Produk",
        productPlaceholder: "Contoh: Ayam Bakar Madu",
        unitLabel: "Satuan (Unit)",
        unitPlaceholder: "Pilih satuan...",
        priceLabel: "Harga (Optional)",
        pricePlaceholder: "Contoh: 25000",
        saveProduct: "Simpan Produk",
        loadingCatalog: "Sedang memuat data katalog...",
        emptyTitle: "Belum ada produk",
        emptyDesc: "Katalogmu masih kosong. Mulai tambahkan produk pertamamu.",
        page: "Halaman",
        products: "produk",
        sold7d: "terjual (7h)",
        delete: "Hapus",
        cancel: "Batal",
        deleteTitle: "Hapus produk",
        prev: "Sebelumnya",
        next: "Selanjutnya",
        nameRequired: "Nama produk tidak boleh kosong",
        unitRequired: "Silakan pilih satuan unit",
        priceNumber: "Harga harus berupa angka",
        priceNegative: "Harga tidak boleh negatif",
        priceLarge: "Harga terlalu besar",
        nameMin: (count: number) => `Nama produk minimal ${count} karakter`,
        nameMax: (count: number) => `Nama produk maksimal ${count} karakter`,
        nameChars: "Nama produk hanya boleh huruf, angka, spasi, dan tanda (-_.,)",
        duplicate: (name: string) => `Produk "${name}" sudah ada. Gunakan nama lain.`,
        saveFailed: "Gagal menyimpan",
        deleteFailed: "Gagal menghapus produk",
        deleteFailedWithReason: (reason: string) => `Gagal menghapus: ${reason}`,
        routeMissing: "Route tidak ditemukan (404). Backend mungkin perlu restart.",
        burstTitle: "Peringatan Lonjakan",
        burstMessage: (name: string) => `Produk "${name}" mengalami lonjakan penjualan`,
      };
  const [products, setProducts] = useState<ProductWithAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('ranking');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [name, setName] = useState('');
  const [unit, setUnit] = useState(''); 
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifiedBursts, setNotifiedBursts] = useState<Set<string>>(new Set());

  // Check auth on mount
  useEffect(() => {
    if (!requireAuth(router)) {
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  // Pagination logic
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = products.slice(startIndex, endIndex);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (!requireAuth(router)) return;
      
      const res = await fetch(`${API_URL}/api/products/ranking`, {
        headers: getAuthHeaders()
      });

      if (handleAuthError(res.status, router)) return;

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType?.includes('text/html')) {
          throw new Error(copy.routeMissing);
        }
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `HTTP ${res.status}`);
        } catch {
          throw new Error(`HTTP ${res.status}: ${errorText.substring(0, 100)}`);
        }
      }

      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (err) {
      logger.error('Fetch products error:', err);
      // Fallback to regular endpoint
      try {
        const res = await fetch(`${API_URL}/api/products`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
          if (data.success) {
            setProducts((data.data || []).map((p: Omit<ProductWithAnalytics, "analytics" | "sparkline" | "totalSales7d">) => ({
            ...p,
            analytics: null,
            sparkline: [],
            totalSales7d: 0
          })));
        }
      } catch (e) {
        logger.error('Fallback fetch error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchProducts();
  }, [isAuthenticated]);

  // cek burst alerts dan tampilkan notifikasi
  useEffect(() => {
    if (!products.length) return;
    
    products.forEach(product => {
      if (product.analytics?.burst_level && 
          product.analytics.burst_level !== 'NORMAL' &&
          !notifiedBursts.has(product.id)) {
        
        addNotification({
          type: "burst",
          title: copy.burstTitle,
          message: copy.burstMessage(product.name),
          productName: product.name,
          burstLevel: product.analytics.burst_level,
        });
        
        setNotifiedBursts(prev => new Set([...prev, product.id]));
      }
    });
  }, [products, notifiedBursts, addNotification]);

  // Validation regex patterns
  const PRODUCT_NAME_REGEX = /^[a-zA-Z0-9\s\-\_\.\,]+$/;
  const PRODUCT_NAME_MIN_LENGTH = 2;
  const PRODUCT_NAME_MAX_LENGTH = 100;

  const sanitizeNumericInput = (value: string) => value.replace(/[^\d]/g, "");

  const validateProductName = (value: string): string | null => {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return copy.nameRequired;
    }
    
    if (trimmed.length < PRODUCT_NAME_MIN_LENGTH) {
      return copy.nameMin(PRODUCT_NAME_MIN_LENGTH);
    }
    
    if (trimmed.length > PRODUCT_NAME_MAX_LENGTH) {
      return copy.nameMax(PRODUCT_NAME_MAX_LENGTH);
    }
    
    if (!PRODUCT_NAME_REGEX.test(trimmed)) {
      return copy.nameChars;
    }
    
    return null;
  };

  const validatePrice = (value: string): string | null => {
    if (!value) return null;
    
    const numPrice = parseFloat(value);
    
    if (isNaN(numPrice)) {
      return copy.priceNumber;
    }
    
    if (numPrice < 0) {
      return copy.priceNegative;
    }
    
    if (numPrice > 999999999) {
      return copy.priceLarge;
    }
    
    return null;
  };

  const handlePriceInputChange = (rawValue: string) => {
    const sanitized = sanitizeNumericInput(rawValue);
    setPrice(sanitized);
  };

  const blockNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const blockedKeys = ["-", "+", "e", "E"];
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameError = validateProductName(name);
    if (nameError) {
      setError(nameError);
      return;
    }

    if (!unit) {
      setError(copy.unitRequired);
      return;
    }

    const priceError = validatePrice(price);
    if (priceError) {
      setError(priceError);
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = getUserId(); 
      const sanitizedName = sanitizeProductName(name);

      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          name: sanitizedName,
          unit: unit,
          price: price ? sanitizeNumber(price) : null
        })
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.error?.includes('sudah ada') || result.error?.includes('already exist')) {
          setError(copy.duplicate(name.trim()));
        } else {
          setError(result.error || copy.saveFailed);
        }
        return;
      }

      if (result.data) {
        setProducts(prev => [{
          ...result.data,
          analytics: null,
          sparkline: [],
          totalSales7d: 0
        }, ...prev]);
      }

      setName('');
      setUnit(''); 
      setPrice('');
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.saveFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(productId);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const handleConfirmDelete = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(productId);
    setError('');
    
    const previousProducts = [...products];
    setProducts(prev => prev.filter(p => p.id !== productId));
    
    try {
      if (!requireAuth(router)) {
        setProducts(previousProducts);
        return;
      }

      const res = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (handleAuthError(res.status, router)) {
        setProducts(previousProducts);
        return;
      }

      if (!res.ok) {
        setProducts(previousProducts);
        const contentType = res.headers.get('content-type');
        if (contentType?.includes('text/html')) {
          throw new Error(copy.routeMissing);
        }
        const errorText = await res.text();
        let errorMessage = `HTTP ${res.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText.substring(0, 100);
        }
        setError(errorMessage);
        return;
      }

      const result = await res.json();
      
      if (!result.success) {
        setProducts(previousProducts);
        setError(result.error || copy.deleteFailed);
      }
    } catch (err: unknown) {
      logger.error('Delete error:', err);
      setProducts(previousProducts);
      setError(copy.deleteFailedWithReason(err instanceof Error ? err.message : "Network error"));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const getMomentumIcon = (label: string | undefined) => {
    if (!label) return <Minus className="w-4 h-4 text-gray-400" />;
    
    switch (label) {
      case 'TRENDING_UP':
      case 'GROWING':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'FALLING':
      case 'DECLINING':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMomentumBadge = (label: string | undefined, momentum: number | undefined) => {
    if (!label) return null;
    
    const pct = ((momentum || 0) * 100).toFixed(1);

    if (label === "TRENDING_UP") {
      return <Badge className="bg-green-100 text-green-700 border-green-200">{isEnglish ? "Up" : "Naik"} +{pct}%</Badge>;
    }
    if (label === "GROWING") {
      return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">{isEnglish ? "Growing" : "Tumbuh"} +{pct}%</Badge>;
    }
    if (label === "FALLING") {
      return <Badge className="bg-red-100 text-red-700 border-red-200">{isEnglish ? "Down" : "Turun"} {pct}%</Badge>;
    }
    if (label === "DECLINING") {
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200">{isEnglish ? "Declining" : "Melemah"} {pct}%</Badge>;
    }
    if (label === "STABLE") {
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200">{isEnglish ? "Stable" : "Stabil"}</Badge>;
    }
    
    switch (label) {
      case 'TRENDING_UP':
        return <Badge className="bg-green-100 text-green-700 border-green-200">📈 +{pct}%</Badge>;
      case 'GROWING':
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">↗ +{pct}%</Badge>;
      case 'FALLING':
        return <Badge className="bg-red-100 text-red-700 border-red-200">📉 {pct}%</Badge>;
      case 'DECLINING':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">↘ {pct}%</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">➡️ Stabil</Badge>;
    }
  };

  const getBurstBadge = (level: string | undefined) => {
    if (!level || level === 'NORMAL') return null;

    if (level === "CRITICAL") {
      return <Badge className="bg-red-500 text-white animate-pulse">Viral</Badge>;
    }
    if (level === "HIGH") {
      return <Badge className="bg-orange-500 text-white">{isEnglish ? "Burst" : "Lonjakan"}</Badge>;
    }
    if (level === "MEDIUM") {
      return <Badge className="bg-yellow-100 text-yellow-700">{isEnglish ? "Rising" : "Naik"}</Badge>;
    }
    
    switch (level) {
      case 'CRITICAL':
        return <Badge className="bg-red-500 text-white animate-pulse">🔥 VIRAL</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500 text-white">⚡ Burst</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-700">📊 Naik</Badge>;
      default:
        return null;
    }
  };

  const formatRupiah = (num: number | null) => {
    if (!num) return '-';
    return new Intl.NumberFormat(locale, { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  const Sparkline = ({ data }: { data: number[] }) => {
    if (!data || data.length === 0) return <span className="text-gray-400 text-xs">{isEnglish ? "No data" : "Belum ada data"}</span>;
    
    const max = Math.max(...data, 1);
    const width = 60;
    const height = 20;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (v / max) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="inline-block">
        <polyline
          fill="none"
          stroke="#DC2626"
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen selection:bg-red-600 selection:text-white transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-slate-900"
    }`}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{copy.title}</h1>
              <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                {copy.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex rounded-lg border p-1 shadow-sm ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <button
                  onClick={() => setViewMode('ranking')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                    viewMode === 'ranking' 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : theme === "dark" ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  {copy.ranking}
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                    viewMode === 'grid' 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : theme === "dark" ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List className="w-4 h-4" />
                  {copy.grid}
                </button>
              </div>
              <Badge variant="outline" className={`px-4 py-2 text-sm font-medium shadow-sm ${
                theme === "dark" ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200"
              }`}>
                <Package className="w-4 h-4 mr-2 text-red-600" />
                {copy.total}: <span className={`ml-1 font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{products.length} {copy.items}</span>
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-3">
              <Card className="sticky top-8 border-t-4 border-t-red-600 shadow-md">
                <CardHeader>
                  <h2 className={`text-base font-bold flex items-center gap-2 ${theme === "dark" ? "text-white" : ""}`}>
                    <Plus className="w-4 h-4 text-red-600" />
                    {copy.addNew}
                  </h2>
                  <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{copy.addDesc}</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className={`p-3 border rounded-lg text-sm ${
                        theme === "dark" ? "bg-red-900/30 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-600"
                      }`}>
                        ⚠️ {error}
                      </div>
                    )}
                    <Input 
                      label={copy.productName} 
                      placeholder={copy.productPlaceholder}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="focus:ring-red-500"
                    />
                    <Select 
                      label={copy.unitLabel}
                      placeholder={copy.unitPlaceholder}
                      options={UNIT_OPTIONS}
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                    <Input 
                      label={copy.priceLabel}
                      placeholder={copy.pricePlaceholder}
                      type="number"
                      value={price}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      step={500}
                      onChange={(e) => handlePriceInputChange(e.target.value)}
                      onKeyDown={blockNonNumericKeys}
                      className="focus:ring-red-500"
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 shadow-sm transition-all" 
                      isLoading={isSubmitting}
                    >
                      + {copy.saveProduct}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-9">
              {loading ? (
                <div className={`flex flex-col items-center justify-center py-20 rounded-lg border ${
                  theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{copy.loadingCatalog}</p>
                </div>
              ) : products.length === 0 ? (
                <div className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center ${
                  theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-300 bg-gray-50/50"
                }`}>
                  <div className={`p-4 rounded-full shadow-sm mb-4 ${theme === "dark" ? "bg-gray-700" : "bg-white"}`}>
                    <PackageOpen className={`h-10 w-10 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                  </div>
                  <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{copy.emptyTitle}</h3>
                  <p className={`text-sm max-w-sm mt-1 mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    {copy.emptyDesc}
                  </p>
                </div>
              ) : viewMode === 'ranking' ? (
                <Card className="overflow-hidden">
                  <CardHeader className={`border-b ${
                    theme === "dark" ? "bg-gradient-to-r from-red-900/20 to-orange-900/20 border-gray-700" : "bg-gradient-to-r from-red-50 to-orange-50"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-red-600" />
                          <h3 className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{isEnglish ? "Product Ranking" : "Ranking Produk"}</h3>
                      </div>
                      <div className="flex items-center gap-2 sm:ml-auto">
                        <Badge variant="secondary" className="text-xs">
                          {copy.page} {currentPage}/{totalPages || 1}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {products.length} {copy.products}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <div className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                    {currentProducts.map((product, index) => (
                      <div 
                        key={product.id} 
                        className={`p-4 transition-colors cursor-pointer group ${
                          theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
                            startIndex + index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            startIndex + index === 1 ? (theme === "dark" ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700') :
                            startIndex + index === 2 ? 'bg-orange-100 text-orange-700' :
                            (theme === "dark" ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                          }`}>
                            {startIndex + index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                              <h4 className={`font-semibold truncate group-hover:text-red-600 transition-colors text-sm ${
                                theme === "dark" ? "text-gray-100" : "text-gray-900"
                              }`}>
                                {product.name}
                              </h4>
                              {getBurstBadge(product.analytics?.burst_level)}
                            </div>
                            <div className={`flex flex-wrap items-center gap-1 sm:gap-3 text-xs ${
                              theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}>
                              <span>{formatRupiah(product.price)}/{product.unit}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                {product.totalSales7d} {copy.sold7d}
                              </span>
                            </div>
                          </div>

                          <div className="hidden md:block">
                            <Sparkline data={product.sparkline} />
                          </div>

                          <div className="hidden sm:flex items-center gap-2">
                            {getMomentumIcon(product.analytics?.momentum_label)}
                            {getMomentumBadge(product.analytics?.momentum_label, product.analytics?.momentum_combined)}
                          </div>
                          <div className="flex sm:hidden items-center">
                            {getMomentumIcon(product.analytics?.momentum_label)}
                          </div>

                          {confirmDeleteId === product.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {deletingId === product.id ? (
                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => handleConfirmDelete(product.id, e)}
                                    className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                                  >
                                    {copy.delete}
                                  </button>
                                  <button
                                    onClick={handleCancelDelete}
                                    className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                  >
                                    {copy.cancel}
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <button
                                onClick={(e) => handleDeleteClick(product.id, e)}
                                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors sm:opacity-0 group-hover:opacity-100"
                                title={copy.deleteTitle}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                          )}

                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className={`flex items-center justify-between px-4 py-3 border-t ${
                      theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-gray-50"
                    }`}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                          theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">{copy.prev}</span>
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            return page === 1 || 
                                   page === totalPages || 
                                   Math.abs(page - currentPage) <= 1;
                          })
                          .map((page, idx, arr) => (
                            <React.Fragment key={page}>
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span className={`px-1 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === page 
                                    ? 'bg-red-600 text-white' 
                                    : theme === "dark" ? 'bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))
                        }
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                          theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <span className="hidden sm:inline">{copy.next}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {copy.page} {currentPage}/{totalPages || 1} | {products.length} {copy.products}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      className={`group relative overflow-hidden transition-all duration-200 cursor-pointer ${
                        theme === "dark" 
                          ? "bg-gray-800 hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)] hover:border-gray-600" 
                          : "bg-white hover:shadow-md hover:border-red-200"
                      }`}
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 group-hover:bg-red-500 transition-colors ${
                        theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                      }`} />
                      
                      <CardContent className="p-5 pl-7">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <h3 className={`font-bold group-hover:text-red-500 transition-colors line-clamp-1 ${
                              theme === "dark" ? "text-white" : "text-gray-800"
                            }`}>
                              {product.name}
                            </h3>
                            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                              {formatRupiah(product.price)} / {product.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getBurstBadge(product.analytics?.burst_level)}
                            {confirmDeleteId === product.id ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {deletingId === product.id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => handleConfirmDelete(product.id, e)}
                                      className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                                    >
                                      {copy.delete}
                                    </button>
                                    <button
                                      onClick={handleCancelDelete}
                                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                        theme === "dark" ? "text-gray-300 bg-gray-700 hover:bg-gray-600" : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                                      }`}
                                    >
                                      {copy.cancel}
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={(e) => handleDeleteClick(product.id, e)}
                                className={`p-1.5 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
                                  theme === "dark" ? "text-gray-500 hover:bg-red-900/30" : "text-gray-400 hover:bg-red-50"
                                }`}
                                title={copy.deleteTitle}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getMomentumIcon(product.analytics?.momentum_label)}
                            <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              {product.totalSales7d} {copy.sold7d}
                            </span>
                          </div>
                          {getMomentumBadge(product.analytics?.momentum_label, product.analytics?.momentum_combined)}
                        </div>

                        {product.sparkline.length > 0 && (
                          <div className={`mt-3 pt-3 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
                            <Sparkline data={product.sparkline} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                          theme === "dark" ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {copy.prev}
                      </button>
                      
                      <span className={`px-4 py-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        {currentPage} / {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                          theme === "dark" ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {copy.next}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
