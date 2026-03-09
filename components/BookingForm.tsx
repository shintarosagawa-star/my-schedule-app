"use client";

import { useState } from "react";

interface BookingFormProps {
  date: string;
  timeSlot: string;
  onSubmit: (data: BookingData) => Promise<void>;
  onCancel: () => void;
}

export interface BookingData {
  name: string;
  phone: string;
  email: string;
  purpose: string;
}

export default function BookingForm({ date, timeSlot, onSubmit, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingData>({
    name: "",
    phone: "",
    email: "",
    purpose: "",
  });
  const [errors, setErrors] = useState<Partial<BookingData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Partial<BookingData> = {};
    if (!formData.name.trim()) newErrors.name = "名前を入力してください";
    if (!formData.phone.trim()) newErrors.phone = "連絡先を入力してください";
    if (!formData.email.trim()) {
      newErrors.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "正しいメールアドレスを入力してください";
    }
    if (!formData.purpose.trim()) newErrors.purpose = "用件を入力してください";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 日付を見やすく整形
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${dayNames[d.getDay()]}）`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded w-full max-w-md p-8 shadow-lg">
        <h2 className="text-lg font-bold mb-1" style={{ color: "#1E3A8A" }}>
          面談申し込み
        </h2>
        <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
          {formatDate(date)} {timeSlot}〜
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 名前 */}
          <div>
            <label className="block text-sm font-medium mb-1">名前</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-800"
              placeholder="山田 太郎"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* 連絡先 */}
          <div>
            <label className="block text-sm font-medium mb-1">連絡先（電話番号）</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-800"
              placeholder="090-1234-5678"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-medium mb-1">メールアドレス</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-800"
              placeholder="example@email.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* 用件 */}
          <div>
            <label className="block text-sm font-medium mb-1">用件</label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-800 resize-none"
              rows={3}
              placeholder="転職面談の日程調整について"
            />
            {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-gray-300 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#1E3A8A" }}
            >
              {isSubmitting ? "送信中..." : "申し込む"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
