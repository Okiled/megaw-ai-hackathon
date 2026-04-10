"use client";

import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

type OnboardingModalProps = {
  open: boolean;
  onClose: () => void;
};

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const { language } = useLanguage();
  const copy = language === "en"
    ? {
        title: "How to use this dashboard",
        intro: "2 minutes to understand: open this dashboard every morning for the latest update.",
        tip: "Tip: follow the recommendation two days before the peak to prepare stock and team allocation.",
        close: "Understood",
        steps: [
          {
            title: "Check the sales status",
            desc: "See instantly whether sales are rising, falling, or stable.",
          },
          {
            title: "Watch burst detection",
            desc: "We will flag unusual spikes or early viral signals.",
          },
          {
            title: "Read the 7-day forecast",
            desc: "Blue line = most likely forecast, shaded area = safer range.",
          },
          {
            title: "Follow the recommendation",
            desc: "Practical suggestions you can execute right away for stock, promo, and team.",
          },
        ],
      }
    : {
        title: "Cara pakai dashboard ini",
        intro: "2 menit untuk paham: buka dashboard ini setiap pagi untuk update terbaru.",
        tip: "Tips: gunakan rekomendasi H-2 sebelum puncak untuk belanja bahan dan atur tim.",
        close: "Mengerti",
        steps: [
          {
            title: "Lihat status penjualan",
            desc: "Langsung tahu apakah penjualan sedang naik, turun, atau stabil.",
          },
          {
            title: "Cek deteksi lonjakan",
            desc: "Kami kasih tahu kalau ada tanda-tanda viral atau anomali.",
          },
          {
            title: "Baca prediksi 7 hari",
            desc: "Garis biru = prediksi paling mungkin, area hijau = rentang aman.",
          },
          {
            title: "Ikuti saran",
            desc: "Saran praktis yang bisa langsung dijalankan untuk stok, promo, dan tim.",
          },
        ],
      };

  const steps = [
    {
      title: copy.steps[0].title,
      desc: copy.steps[0].desc,
    },
    { title: copy.steps[1].title, desc: copy.steps[1].desc },
    { title: copy.steps[2].title, desc: copy.steps[2].desc },
    { title: copy.steps[3].title, desc: copy.steps[3].desc },
  ];

  return (
    <Modal isOpen={open} onClose={onClose} title={copy.title}>
      <div className="space-y-4 text-sm text-gray-700">
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-800">
          <PlayCircle className="h-6 w-6" />
          <p>{copy.intro}</p>
        </div>
        <ol className="space-y-3">
          {steps.map((step, idx) => (
            <li key={step.title} className="flex gap-3">
              <CheckCircle2 className="mt-1 h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {idx + 1}. {step.title}
                </p>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
          {copy.tip}
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} size="sm">
            {copy.close}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
