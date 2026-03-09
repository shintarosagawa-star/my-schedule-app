import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
// スケジュール取得API
// GET /api/schedule?year=2026&month=3
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || "");
    const month = parseInt(searchParams.get("month") || "");

    if (!year || !month) {
      return NextResponse.json({ error: "yearとmonthは必須です" }, { status: 400 });
    }

    // 月の開始日と終了日
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

    // スケジュールデータを取得（statusカラムを含む）
    const { data: schedules, error } = await getSupabaseAdmin()
      .from("schedules")
      .select("id, date, time_slot, is_available, status")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date")
      .order("time_slot");

    if (error) {
      console.error("スケジュール取得エラー:", error);
      return NextResponse.json({ error: "データの取得に失敗しました" }, { status: 500 });
    }

    // 実際の予約済みスケジュールIDを取得
    const scheduleIds = schedules?.map((s) => s.id) || [];
    let bookedIds: string[] = [];

    if (scheduleIds.length > 0) {
      const { data: bookings } = await getSupabaseAdmin()
        .from("bookings")
        .select("schedule_id")
        .in("schedule_id", scheduleIds);

      bookedIds = bookings?.map((b) => b.schedule_id) || [];
    }

    // statusとis_bookedを統合
    const result = (schedules || []).map((s) => ({
      ...s,
      // 実際の予約がある、または管理者が手動で「済」にした場合
      is_booked: bookedIds.includes(s.id) || s.status === "booked",
    }));

    return NextResponse.json({ schedules: result });
  } catch {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}

// スケジュール更新API（管理者のみ）
// POST /api/schedule
// body: { date: string, time_slot: string, status: "available" | "unavailable" | "booked" }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, time_slot, status } = body;

    // 後方互換: is_available が来た場合も対応
    const validStatuses = ["available", "unavailable", "booked"];
    let finalStatus = status;
    if (!finalStatus && typeof body.is_available === "boolean") {
      finalStatus = body.is_available ? "available" : "unavailable";
    }

    if (!date || !time_slot || !validStatuses.includes(finalStatus)) {
      return NextResponse.json({ error: "パラメータが不正です" }, { status: 400 });
    }

    const is_available = finalStatus === "available";

    // upsert（存在すれば更新、なければ挿入）
    const { data, error } = await getSupabaseAdmin()
      .from("schedules")
      .upsert(
        {
          date,
          time_slot,
          is_available,
          status: finalStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "date,time_slot" }
      )
      .select()
      .single();

    if (error) {
      console.error("スケジュール更新エラー:", error);
      return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ schedule: data });
  } catch {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
