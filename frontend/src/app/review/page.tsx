"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/ui/Navbar";
import { Card, CardContent } from "@/components/ui/Card";
import { useTheme } from "@/lib/theme-context";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

type SentimentResult = {
  sentiment: string;
  confidence: number;
  emoji: string;
  review?: string;
};

type CsvSummary = {
  positive: number;
  negative: number;
  neutral: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  total: number;
};

type ManualAnalyzeResponse = {
  error?: string;
  result?: {
    confidence?: number;
    emoji?: string;
    sentiment?: string;
  };
};

type CsvAnalyzeResponse = {
  error?: string;
  results?: SentimentResult[];
  summary?: CsvSummary | null;
};

type HistoryItem = {
  id: string;
  text: string;
  sentiment: string;
  confidence: number;
  emoji: string;
  timestamp: number;
};

const HISTORY_KEY = "review_history";
const MAX_HISTORY = 5;

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
}

export default function ReviewPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const copy =
    language === "en"
      ? {
          title: "Review",
          subtitle: "Run sentiment analysis manually or in bulk using CSV.",
          manual: "Manual Input",
          csv: "Upload CSV",
          placeholder: "Write one review here...",
          analyze: "Analyze",
          processing: "Processing...",
          confidence: "Confidence",
          history: "Analysis History (Latest 5)",
          clearAll: "Clear All",
          delete: "Delete",
          reviewInput: "Review Data Input",
          uploadHint: "Upload a CSV file for bulk sentiment analysis.",
          columnHint: "Make sure the file includes a Review column.",
          chooseFile: "Choose File",
          summary: "Summary",
          positive: "Positive",
          negative: "Negative",
          neutral: "Neutral",
          total: "Total",
          csvResult: "CSV Result",
          sentiment: "Sentiment",
          noServerResponse: "No response from the server. Check the ML/API service",
          analyzeFailed: "Failed to analyze",
          fileAnalyzeFailed: "Failed to analyze file",
          serviceError: "Failed to connect to analysis service",
        }
      : {
          title: "Review",
          subtitle: "Analisis sentimen review secara manual atau batch lewat CSV.",
          manual: "Input Manual",
          csv: "Upload CSV",
          placeholder: "Tulis satu review di sini...",
          analyze: "Analisa",
          processing: "Memproses...",
          confidence: "Keyakinan",
          history: "Riwayat Analisis (5 Terbaru)",
          clearAll: "Hapus Semua",
          delete: "Hapus",
          reviewInput: "Input Data Review",
          uploadHint: "Upload CSV untuk analisis sentimen massal.",
          columnHint: "Pastikan file memiliki kolom Review.",
          chooseFile: "Pilih File",
          summary: "Ringkasan",
          positive: "Positif",
          negative: "Negatif",
          neutral: "Netral",
          total: "Total",
          csvResult: "Hasil CSV",
          sentiment: "Sentimen",
          noServerResponse: "Tidak ada respons dari server. Cek layanan ML/API",
          analyzeFailed: "Gagal menganalisa",
          fileAnalyzeFailed: "Gagal menganalisa file",
          serviceError: "Gagal terhubung ke layanan analisa",
        };

  const [mode, setMode] = useState<"manual" | "csv">("manual");
  const [text, setText] = useState("");
  const [manualResult, setManualResult] = useState<SentimentResult | null>(null);
  const [csvResults, setCsvResults] = useState<SentimentResult[]>([]);
  const [csvSummary, setCsvSummary] = useState<CsvSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    saveHistory(updated);
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const handleAnalyzeText = async () => {
    setLoading(true);
    setError(null);
    setManualResult(null);
    try {
      const res = await fetch(`${API_URL}/api/sentiment/analyze-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const raw = await res.text();
      let data: ManualAnalyzeResponse;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(raw?.trim() ? raw.slice(0, 200) : copy.noServerResponse);
      }
      if (!res.ok) throw new Error(data?.error || copy.analyzeFailed);

      const result = {
        sentiment: data?.result?.sentiment || "N/A",
        confidence: data?.result?.confidence || 0,
        emoji: data?.result?.emoji || ":|",
      };
      setManualResult(result);

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        text: text.trim(),
        sentiment: result.sentiment,
        confidence: result.confidence,
        emoji: result.emoji,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...history.filter((item) => item.text !== text.trim())].slice(0, MAX_HISTORY);
      setHistory(updated);
      saveHistory(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.serviceError);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setCsvResults([]);
    setCsvSummary(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/sentiment/analyze-file`, {
        method: "POST",
        body: formData,
      });
      const raw = await res.text();
      let data: CsvAnalyzeResponse;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(raw?.trim() ? raw.slice(0, 200) : copy.noServerResponse);
      }
      if (!res.ok) throw new Error(data?.error || copy.fileAnalyzeFailed);

      setCsvSummary(data?.summary || null);
      setCsvResults(
        (data?.results || []).map((item) => ({
          review: item.review,
          sentiment: item.sentiment,
          confidence: item.confidence,
          emoji: item.emoji,
        })),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.serviceError);
    } finally {
      setLoading(false);
    }
  };

  const pieStyle = useMemo(() => {
    if (!csvSummary || csvSummary.total === 0) return {};
    const positivePct = csvSummary.positive_pct || 0;
    const negativePct = csvSummary.negative_pct || 0;
    return {
      backgroundImage: `conic-gradient(#16a34a 0 ${positivePct}%, #dc2626 ${positivePct}% ${positivePct + negativePct}%, #64748b ${positivePct + negativePct}% 100%)`,
    };
  }, [csvSummary]);

  const cardBase =
    theme === "dark"
      ? "bg-gray-800 border-gray-700 text-gray-100"
      : "bg-white border-gray-200 text-gray-900";
  const subText = theme === "dark" ? "text-gray-400" : "text-gray-600";

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold">{copy.title}</h1>
          <p className={`text-sm ${subText}`}>{copy.subtitle}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setMode("manual")}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              mode === "manual"
                ? "border-red-600 bg-red-600 text-white"
                : theme === "dark"
                  ? "border-gray-700 bg-gray-800 text-gray-200"
                  : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            {copy.manual}
          </button>
          <button
            onClick={() => setMode("csv")}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              mode === "csv"
                ? "border-red-600 bg-red-600 text-white"
                : theme === "dark"
                  ? "border-gray-700 bg-gray-800 text-gray-200"
                  : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            {copy.csv}
          </button>
        </div>

        {mode === "manual" && (
          <Card className={`${cardBase} shadow-sm`}>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                className={`w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 ${
                  theme === "dark"
                    ? "border-gray-700 bg-gray-900 text-gray-100"
                    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                }`}
                placeholder={copy.placeholder}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={handleAnalyzeText}
                  disabled={loading || !text.trim()}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold shadow ${
                    loading || !text.trim()
                      ? "cursor-not-allowed bg-gray-300 text-gray-500"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {loading ? copy.processing : copy.analyze}
                </button>
                {error && <span className="text-sm text-red-500">{error}</span>}
              </div>

              {manualResult && (
                <div className={`mt-2 flex items-center gap-3 rounded-lg border p-4 ${cardBase}`}>
                  <span className="text-2xl">{manualResult.emoji}</span>
                  <div>
                    <p className="text-lg font-semibold">{manualResult.sentiment}</p>
                    <p className={`text-sm ${subText}`}>
                      {copy.confidence}: {manualResult.confidence}%
                    </p>
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <div className={`mt-6 border-t pt-4 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{copy.history}</h3>
                    <button
                      onClick={handleClearAllHistory}
                      className={`rounded px-2 py-1 text-xs transition-colors ${
                        theme === "dark"
                          ? "text-red-400 hover:bg-red-900/30"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      {copy.clearAll}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 ${
                          theme === "dark"
                            ? "border-gray-700 bg-gray-900"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <span className="shrink-0 text-xl">{item.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`} title={item.text}>
                            {item.text}
                          </p>
                          <p className={`text-xs ${subText}`}>
                            {item.sentiment} - {item.confidence}%
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          className={`shrink-0 rounded-full p-1.5 transition-colors ${
                            theme === "dark"
                              ? "text-gray-500 hover:bg-red-900/30 hover:text-red-400"
                              : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                          }`}
                          title={copy.delete}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {mode === "csv" && (
          <div className="space-y-4">
            <Card className={`${cardBase} border-l-4 border-l-green-500 shadow-sm`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-green-600 ${theme === "dark" ? "bg-green-900/30" : "bg-green-100"}`}>
                      CSV
                    </div>
                    <div>
                      <p className="text-base font-semibold">{copy.reviewInput}</p>
                      <p className={`text-sm ${subText}`}>{copy.uploadHint}</p>
                      <p className={`mt-1 text-xs ${subText}`}>{copy.columnHint}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAnalyzeFile(file);
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-semibold text-white shadow hover:bg-red-700"
                    >
                      <span>{copy.chooseFile}</span>
                    </button>
                  </div>
                </div>
                {error && <span className="mt-2 block text-sm text-red-500">{error}</span>}
              </CardContent>
            </Card>

            {csvSummary && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className={`${cardBase} shadow-sm`}>
                  <CardContent className="space-y-3 p-4 sm:p-6">
                    <p className="font-semibold">{copy.summary}</p>
                    <div className="flex items-center gap-4">
                      <div className="h-48 w-48 rounded-full border-2 border-blue-200" style={pieStyle} aria-label="Pie summary" />
                      <div className="space-y-1 text-sm">
                        <p className="text-green-600">
                          {copy.positive}: {csvSummary.positive} ({csvSummary.positive_pct}%)
                        </p>
                        <p className="text-red-600">
                          {copy.negative}: {csvSummary.negative} ({csvSummary.negative_pct}%)
                        </p>
                        <p className={subText}>
                          {copy.neutral}: {csvSummary.neutral} ({csvSummary.neutral_pct}%)
                        </p>
                        <p className={subText}>
                          {copy.total}: {csvSummary.total}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${cardBase} overflow-hidden shadow-sm`}>
                  <CardContent className="p-4 sm:p-6">
                    <p className="mb-2 font-semibold">{copy.csvResult}</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={`border-b text-left ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                            <th className="py-2 pr-2">Review</th>
                            <th className="py-2 pr-2">{copy.sentiment}</th>
                            <th className="py-2">{copy.confidence}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvResults.map((result, idx) => (
                            <tr key={idx} className={`border-b last:border-0 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                              <td className="max-w-[240px] truncate py-2 pr-2" title={result.review}>
                                {result.review}
                              </td>
                              <td className="py-2 pr-2">
                                {result.emoji} {result.sentiment}
                              </td>
                              <td className="py-2">{result.confidence}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
