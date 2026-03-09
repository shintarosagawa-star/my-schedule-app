import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendLineMessage } from "@/lib/line";

// 毎月1日に実行されるCronジョブ
// 閲覧用パスワードを自動更新し、LINEで通知する
// GET /api/cron
export async function GET(request: NextRequest) {
  try {
    // Cronシークレットで認証（不正実行防止）
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ランダムパスワードを生成（8文字の英数字）
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let newPassword = "";
    for (let i = 0; i < 8; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // ハッシュ化してDBに保存
    const hash = await bcrypt.hash(newPassword, 10);

    const { error } = await getSupabaseAdmin()
      .from("settings")
      .upsert(
        {
          key: "viewer_password_hash",
          value: hash,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (error) {
      console.error("パスワード更新エラー:", error);
      return NextResponse.json({ error: "パスワード更新に失敗しました" }, { status: 500 });
    }

    // 平文のパスワードも保存（管理画面表示用）
    await getSupabaseAdmin()
      .from("settings")
      .upsert(
        {
          key: "viewer_password_plain",
          value: newPassword,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    // LINEで新パスワードを通知
    const now = new Date();
    const month = now.getMonth() + 1;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    try {
      const lineMessage = [
        "🔑 今月のスケジュール閲覧パスワード",
        "━━━━━━━━━━━━━━━",
        `📅 有効期間：${month}月1日〜${month}月${lastDay}日`,
        `🔐 パスワード：${newPassword}`,
        "━━━━━━━━━━━━━━━",
        "相手にURLと一緒にお伝えください。",
      ].join("\n");

      await sendLineMessage(lineMessage);
    } catch (lineError) {
      console.error("LINE通知エラー:", lineError);
    }

    return NextResponse.json({ success: true, message: "パスワードを更新しました" });
  } catch {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
