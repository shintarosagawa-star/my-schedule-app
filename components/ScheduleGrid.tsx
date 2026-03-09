"use client";

import { useState } from "react";

// 時間帯（9:00〜19:30の30分刻み）
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30",
];

// スケジュールデータの型
export interface ScheduleSlot {
  id: string;
  date: string;
  time_slot: string;
  is_available: boolean;
  is_booked?: boolean;
  status?: string;
}

interface ScheduleGridProps {
  year: number;
  month: number;
  schedules: ScheduleSlot[];
  isAdmin?: boolean;
  onSlotClick: (date: string, timeSlot: string, currentState: boolean, nextStatus?: string) => void;
}

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function getNextStatus(slot: ScheduleSlot | undefined): string {
  if (!slot) return "available";
  const status = slot.status || (slot.is_available ? "available" : "unavailable");
  switch (status) {
    case "unavailable": return "available";
    case "available": return "booked";
    case "booked": return "unavailable";
    default: return "available";
  }
}

function getEffectiveStatus(slot: ScheduleSlot | undefined): string {
  if (!slot) return "unavailable";
  if (slot.status) return slot.status;
  if (slot.is_booked) return "booked";
  return slot.is_available ? "available" : "unavailable";
}

// 今日から翌週日曜日までの日数を計算
function getDaysUntilNextSunday(): number {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=日, 1=月, ...
  // 今週の残り + 翌週全部（日曜まで）
  // 翌週の日曜 = 7 - dayOfWeek + 7 (ただし今日が日曜なら14日後)
  const daysUntilNextSunday = dayOfWeek === 0 ? 14 : (7 - dayOfWeek) + 7;
  return daysUntilNextSunday;
}

// 日付文字列を生成
function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ScheduleGrid({
  year,
  month,
  schedules,
  isAdmin = false,
  onSlotClick,
}: ScheduleGridProps) {
  // 週のオフセット（0 = 初期表示、1 = 1週間先、...）
  const [weekOffset, setWeekOffset] = useState(0);

  // 月の全日付を生成
  const daysInMonth = new Date(year, month, 0).getDate();
  const allDates = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    return { day, dateStr, dayOfWeek, dateObj: d };
  });

  // 管理者は月全体、閲覧者は週単位で表示
  let visibleDates = allDates;

  if (!isAdmin) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 初期表示: 今日〜翌週日曜日
    const initialDays = getDaysUntilNextSunday();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + weekOffset * 7);

    let endDate: Date;
    if (weekOffset === 0) {
      // 初期表示は翌週日曜まで
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() + initialDays);
    } else {
      // それ以降は1週間単位
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
    }

    visibleDates = allDates.filter(({ dateObj }) => {
      return dateObj >= (weekOffset === 0 ? today : startDate) && dateObj <= endDate;
    });
  }

  // スケジュールデータをマップに変換
  const scheduleMap = new Map<string, ScheduleSlot>();
  schedules.forEach((s) => {
    scheduleMap.set(`${s.date}_${s.time_slot}`, s);
  });

  const getCellStyle = (date: string, timeSlot: string) => {
    const slot = scheduleMap.get(`${date}_${timeSlot}`);
    const status = getEffectiveStatus(slot);
    switch (status) {
      case "available":
        return { backgroundColor: "#22C55E", cursor: "pointer", color: "#FFFFFF" };
      case "booked":
        return { backgroundColor: "#3B82F6", cursor: isAdmin ? "pointer" : "default", color: "#FFFFFF" };
      default:
        return { backgroundColor: "#E5E7EB", cursor: isAdmin ? "pointer" : "default", color: "#9CA3AF" };
    }
  };

  const getCellLabel = (date: string, timeSlot: string) => {
    const slot = scheduleMap.get(`${date}_${timeSlot}`);
    const status = getEffectiveStatus(slot);
    switch (status) {
      case "available": return "○";
      case "booked": return "済";
      default: return "×";
    }
  };

  const handleClick = (date: string, timeSlot: string) => {
    const slot = scheduleMap.get(`${date}_${timeSlot}`);
    if (isAdmin) {
      const nextStatus = getNextStatus(slot);
      onSlotClick(date, timeSlot, slot?.is_available ?? false, nextStatus);
    } else {
      const status = getEffectiveStatus(slot);
      if (status === "available") {
        onSlotClick(date, timeSlot, true);
      }
    }
  };

  // 次の週に進めるか（月末を超えない）
  const canGoNext = !isAdmin && visibleDates.length > 0 && (() => {
    const lastVisible = visibleDates[visibleDates.length - 1].dateObj;
    const monthEnd = new Date(year, month - 1, daysInMonth);
    return lastVisible < monthEnd;
  })();

  // 前の週に戻れるか
  const canGoPrev = !isAdmin && weekOffset > 0;

  // 表示期間のラベル
  const periodLabel = visibleDates.length > 0
    ? `${visibleDates[0].dateObj.getMonth() + 1}/${visibleDates[0].day}〜${visibleDates[visibleDates.length - 1].dateObj.getMonth() + 1}/${visibleDates[visibleDates.length - 1].day}`
    : "";

  return (
    <div>
      {/* 閲覧者用: 週送りナビゲーション */}
      {!isAdmin && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
            disabled={!canGoPrev}
            className="px-4 py-2 text-sm font-medium border border-gray-300 disabled:opacity-30 disabled:cursor-default hover:bg-gray-50 transition-colors"
            style={{ color: "#1E3A8A" }}
          >
            ← 前の週
          </button>
          <span className="text-sm font-medium" style={{ color: "#1F2937" }}>
            {periodLabel}
          </span>
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            disabled={!canGoNext}
            className="px-4 py-2 text-sm font-medium border border-gray-300 disabled:opacity-30 disabled:cursor-default hover:bg-gray-50 transition-colors"
            style={{ color: "#1E3A8A" }}
          >
            次の週 →
          </button>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="min-w-max border-collapse text-xs">
          <thead>
            <tr>
              <th
                className="sticky top-0 left-0 z-20 bg-white border border-gray-200 px-2 py-2 font-semibold"
                style={{ color: "#1E3A8A", minWidth: "60px" }}
              >
                時間
              </th>
              {visibleDates.map(({ day, dateStr, dayOfWeek, dateObj }) => (
                <th
                  key={dateStr}
                  className="sticky top-0 z-10 bg-white border border-gray-200 px-1 py-2 font-medium whitespace-nowrap"
                  style={{
                    color: dayOfWeek === 0 ? "#EF4444" : dayOfWeek === 6 ? "#3B82F6" : "#1F2937",
                    minWidth: "40px",
                  }}
                >
                  <div>{dateObj.getMonth() + 1}/{day}</div>
                  <div className="text-[10px]">({DAY_NAMES[dayOfWeek]})</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((timeSlot) => (
              <tr key={timeSlot}>
                <td
                  className="sticky left-0 z-10 bg-white border border-gray-200 px-2 py-1 font-medium whitespace-nowrap text-center"
                  style={{ color: "#1E3A8A" }}
                >
                  {timeSlot}
                </td>
                {visibleDates.map(({ day, dateStr }) => {
                  const style = getCellStyle(dateStr, timeSlot);
                  const label = getCellLabel(dateStr, timeSlot);
                  return (
                    <td
                      key={`${dateStr}_${timeSlot}`}
                      className="border border-gray-200 text-center font-bold select-none"
                      style={{
                        ...style,
                        width: "40px",
                        height: "32px",
                        fontSize: "11px",
                        transition: "background-color 0.15s",
                      }}
                      onClick={() => handleClick(dateStr, timeSlot)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleClick(dateStr, timeSlot);
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`${day} ${timeSlot} ${label}`}
                    >
                      {label}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
