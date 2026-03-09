"use client";

import { useState, useEffect, useCallback } from "react";
import ScheduleGrid, { ScheduleSlot } from "@/components/ScheduleGrid";

export default function AdminPage() {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // 月送り
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule?year=${viewYear}&month=${viewMonth}`);
      const data = await res.json();
      if (res.ok) setSchedules(data.schedules);
    } catch (err) {
      console.error("スケジュール取得エラー:", err);
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const goNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleSlotClick = async (date: string, timeSlot: string, _currentState: boolean, nextStatus?: string) => {
    const status = nextStatus || "available";
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time_slot: timeSlot, status }),
      });

      if (res.ok) {
        const is_available = status === "available";
        const is_booked = status === "booked";
        setSchedules((prev) => {
          const existing = prev.find((s) => s.date === date && s.time_slot === timeSlot);
          if (existing) {
            return prev.map((s) =>
              s.date === date && s.time_slot === timeSlot
                ? { ...s, is_available, is_booked, status }
                : s
            );
          } else {
            return [...prev, { id: crypto.randomUUID(), date, time_slot: timeSlot, is_available, is_booked, status }];
          }
        });
      }
    } catch (err) {
      console.error("スケジュール更新エラー:", err);
    }
  };

  // 一括操作: 全て○ / 全て×
  const bulkSetAll = async (status: string) => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const timeSlots = [
      "09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
      "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30",
      "17:00","17:30","18:00","18:30","19:00","19:30",
    ];

    // 平日のみ一括設定（土日は除く）
    const promises = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth - 1, day);
      const dow = d.getDay();
      if (dow === 0 || dow === 6) continue; // 土日スキップ
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      for (const ts of timeSlots) {
        promises.push(
          fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: dateStr, time_slot: ts, status }),
          })
        );
      }
    }
    await Promise.all(promises);
    fetchSchedules();
  };

  return (
    <div>
      {/* ヘッダー + 月送り */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: "#1E3A8A" }}>
            スケジュール編集
          </h2>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            コマをクリックして ×→○→済 と切り替えます。
          </p>
        </div>

        {/* 月送りボタン */}
        <div className="flex items-center gap-3">
          <button
            onClick={goPrevMonth}
            className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50"
            style={{ color: "#1E3A8A" }}
          >
            ←
          </button>
          <span className="text-base font-bold min-w-[120px] text-center" style={{ color: "#1E3A8A" }}>
            {viewYear}年{viewMonth}月
          </span>
          <button
            onClick={goNextMonth}
            className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50"
            style={{ color: "#1E3A8A" }}
          >
            →
          </button>
        </div>
      </div>

      {/* 一括操作ボタン */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => bulkSetAll("available")}
          className="px-4 py-2 text-xs font-medium text-white"
          style={{ backgroundColor: "#22C55E" }}
        >
          平日を全て○にする
        </button>
        <button
          onClick={() => bulkSetAll("unavailable")}
          className="px-4 py-2 text-xs font-medium border border-gray-300"
          style={{ color: "#6B7280" }}
        >
          平日を全て×にする
        </button>
      </div>

      {/* スケジュール表 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="text-sm" style={{ color: "#6B7280" }}>読み込み中...</div>
        </div>
      ) : (
        <ScheduleGrid year={viewYear} month={viewMonth} schedules={schedules} isAdmin={true} onSlotClick={handleSlotClick} />
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
      <p className="text-xs mt-3" style={{ color: "#6B7280" }}>
        クリックで × → ○ → 済 → × と切り替わります
      </p>
    </div>
  );
}
