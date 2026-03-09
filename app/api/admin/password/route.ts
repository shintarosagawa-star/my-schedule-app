import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

// 閲覧用パスワードの平文を取得（管理者のみ）
// GET /api/admin/password
export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const payload = token ? verifyToken(token) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("settings")
      .select("value")
      .eq("key", "viewer_password_plain")
      .single();

    if (error || !data) {
      return NextResponse.json({ password: "未設定（Cronジョブを実行してください）" });
    }

    return NextResponse.json({ password: data.value });
  } catch {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
