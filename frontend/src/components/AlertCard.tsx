"use client";

import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

type AlertLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;

interface AlertCardProps {
  productName: string;
  score: number;
  level: AlertLevel;
  onDismiss: () => void;
}

export function AlertCard({ productName, score, level, onDismiss }: AlertCardProps) {
  const { language } = useLanguage();
  const isCritical = level === "CRITICAL" || score >= 3.5;
  const copy = language === "en"
    ? {
        critical: "Critical Anomaly",
        alert: "High Alert",
        scoreLabel: "Burst Score",
        title: `Product spike detected: ${productName}`,
        body: `Sales activity is running ${score.toFixed(1)}x above normal. Check stock immediately to avoid stockout.`,
      }
    : {
        critical: "Anomali Kritis",
        alert: "High Alert",
        scoreLabel: "Burst Score",
        title: `Ada lonjakan produk: ${productName}`,
        body: `Aktivitas penjualan terdeteksi ${score.toFixed(1)}x lebih tinggi dari biasanya. Cek stok segera untuk menghindari kehabisan barang.`,
      };
  
  const styles = isCritical
    ? "bg-red-50 border-red-200 text-red-900"
    : "bg-orange-50 border-orange-200 text-orange-900";

  const iconColor = isCritical ? "text-red-600" : "text-orange-600";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full rounded-xl border p-4 shadow-sm mb-6 ${styles}`}
      >
        <div className="flex items-start gap-4">
          <div className={`mt-1 rounded-full bg-white p-2 shadow-sm ${iconColor}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white ${iconColor} border border-current`}>
                {isCritical ? copy.critical : copy.alert}
              </span>
              <span className="text-xs font-medium opacity-75">
                {copy.scoreLabel}: {score.toFixed(2)}
              </span>
            </div>
            
            <h4 className="font-bold text-lg">
              {copy.title}
            </h4>
            
            <p className="text-sm mt-1 opacity-90 leading-relaxed">
              {copy.body}
            </p>
          </div>

          <button 
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="h-5 w-5 opacity-50" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
