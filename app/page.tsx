"use client";

import { useState, useEffect, useMemo } from "react";
import ScheduleGrid, { ScheduleSlot } from "@/components/ScheduleGrid";
import BookingForm, { BookingData } from "@/components/BookingForm";

export default function ViewerPage() {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; timeSlot: string; scheduleId: string } | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule?year=${year}&month=${month}`);
      const data = await res.json();
      if (res.ok) setSchedules(data.schedules);
    } catch (err) {
      console.error("スケジュール取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  // 空きコマ数を集計
  const availableCount = useMemo(() => {
    return schedules.filter((s) => s.is_available && !s.is_booked && s.status !== "booked").length;
  }, [schedules]);

  const handleSlotClick = (date: string, timeSlot: string) => {
    const slot = schedules.find((s) => s.date === date && s.time_slot === timeSlot);
    if (slot && slot.is_available && !slot.is_booked) {
      setSelectedSlot({ date, timeSlot, scheduleId: slot.id });
    }
  };

  const handleBookingSubmit = async (formData: BookingData) => {
    if (!selectedSlot) return;
    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedule_id: selectedSlot.scheduleId, ...formData }),
    });
    if (res.ok) {
      setSelectedSlot(null);
      setBookingComplete(true);
      fetchSchedules();
    } else {
      const data = await res.json();
      alert(data.error || "申し込みに失敗しました");
    }
  };

  if (bookingComplete) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "#22C55E" }}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#1E3A8A" }}>申し込みが完了しました</h2>
          <p className="text-sm mb-8" style={{ color: "#6B7280" }}>確認メールをお送りしました。ご確認ください。</p>
          <button
            onClick={() => setBookingComplete(false)}
            className="px-8 py-3 text-sm font-medium text-white"
            style={{ backgroundColor: "#1E3A8A" }}
          >
            スケジュールに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー部分 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#1E3A8A" }}>
          {year}年{month}月のスケジュール
        </h2>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          緑色（○）のコマをクリックすると申し込みができます。
        </p>
        {!loading && (
          <p className="text-sm mt-2 font-medium" style={{ color: availableCount > 0 ? "#22C55E" : "#EF4444" }}>
            {availableCount > 0 ? `現在 ${availableCount} 件の空きがあります` : "現在空きはありません"}
          </p>
        )}
      </div>

      {/* スケジュール表 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="text-sm" style={{ color: "#6B7280" }}>読み込み中...</div>
        </div>
      ) : (
        <ScheduleGrid year={year} month={month} schedules={schedules} isAdmin={false} onSlotClick={handleSlotClick} />
      )}

      {/* 凡例 */}
      <div className="flex flex-wrap gap-4 sm:gap-6 mt-6 text-xs" style={{ color: "#6B7280" }}>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 inline-block rounded-sm" style={{ backgroundColor: "#22C55E" }}></span>
          ○ 空き
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 inline-block rounded-sm" style={{ backgroundColor: "#3B82F6" }}></span>
          済 予約済み
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 inline-block rounded-sm" style={{ backgroundColor: "#E5E7EB" }}></span>
          × 埋まり
        </div>
      </div>

      {/* 申し込みフォーム */}
      {selectedSlot && (
        <BookingForm
          date={selectedSlot.date}
          timeSlot={selectedSlot.timeSlot}
          onSubmit={handleBookingSubmit}
          onCancel={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
