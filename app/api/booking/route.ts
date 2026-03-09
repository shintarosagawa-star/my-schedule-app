import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendLineMessage } from "@/lib/line";
import { sendConfirmationEmail } from "@/lib/mail";

// 申し込みAPI
// POST /api/booking
// body: { schedule_id: string, name: string, phone: string, email: string, purpose: string }
export async function POST(request: NextRequest) {
  try {
    const { schedule_id, name, phone, email, purpose } = await request.json();

    // バリデーション
    if (!schedule_id || !name || !phone || !email || !purpose) {
      return NextResponse.json({ error: "すべての項目を入力してください" }, { status: 400 });
    }

    // スケジュールの存在確認・空き確認
    const { data: schedule, error: scheduleError } = await getSupabaseAdmin()
      .from("schedules")
      .select("*")
      .eq("id", schedule_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: "指定されたスケジュールが見つかりません" }, { status: 404 });
    }

    if (!schedule.is_available) {
      return NextResponse.json({ error: "この時間帯は空きがありません" }, { status: 400 });
    }

    // 重複チェック
    const { data: existingBooking } = await getSupabaseAdmin()
      .from("bookings")
      .select("id")
      .eq("schedule_id", schedule_id)
      .single();

    if (existingBooking) {
      return NextResponse.json({ error: "この時間帯は既に予約されています" }, { status: 409 });
    }

    // 申し込みデータを保存
    const { data: booking, error: bookingError } = await getSupabaseAdmin()
      .from("bookings")
      .insert({ schedule_id, name, phone, email, purpose })
      .select()
      .single();

    if (bookingError) {
      console.error("申し込み保存エラー:", bookingError);
      return NextResponse.json({ error: "申し込みの保存に失敗しました" }, { status: 500 });
    }

    // 日付を日本語形式に整形
    const d = new Date(schedule.date);
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    const dateStr = `${d.getMonth() + 1}月${d.getDate()}日（${dayNames[d.getDay()]}）`;

    // LINE通知（失敗しても申し込みは保存済み）
    try {
      const lineMessage = [
        "📩 新しい申し込みがありました",
        "━━━━━━━━━━━━━━━",
        `📅 希望日時：${dateStr} ${schedule.time_slot}`,
        `👤 名前：${name}`,
        `📞 連絡先：${phone}`,
        `📧 メール：${email}`,
        `💬 用件：${purpose}`,
        "━━━━━━━━━━━━━━━",
      ].join("\n");

      await sendLineMessage(lineMessage);
    } catch (lineError) {
      console.error("LINE通知エラー（申し込みは保存済み）:", lineError);
    }

    // 確認メール送信（失敗しても申し込みは保存済み）
    try {
      await sendConfirmationEmail({
        to: email,
        name,
        date: dateStr,
        timeSlot: schedule.time_slot,
        purpose,
      });
    } catch (mailError) {
      console.error("メール送信エラー（申し込みは保存済み）:", mailError);
    }

    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
