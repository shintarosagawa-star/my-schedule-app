import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateViewerToken, generateAdminToken } from "@/lib/auth";

// パスワード認証API
// POST /api/auth
// body: { password: string, type: "viewer" | "admin" }
export async function POST(request: NextRequest) {
  try {
    const { password, type } = await request.json();

    if (!password || !type) {
      return NextResponse.json({ error: "パスワードとタイプは必須です" }, { status: 400 });
    }

    // 管理者認証
    if (type === "admin") {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        return NextResponse.json({ error: "サーバー設定エラー" }, { status: 500 });
      }

      if (password === adminPassword) {
        const token = generateAdminToken();
        return NextResponse.json({ token });
      }

      return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
    }

    // 閲覧者認証
    if (type === "viewer") {
      // DBから閲覧用パスワードのハッシュを取得
      const { data, error } = await getSupabaseAdmin()
        .from("settings")
        .select("value")
        .eq("key", "viewer_password_hash")
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "サーバー設定エラー" }, { status: 500 });
      }

      const isValid = await bcrypt.compare(password, data.value);
      if (isValid) {
        const token = generateViewerToken();
        return NextResponse.json({ token });
      }

      return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
    }

    return NextResponse.json({ error: "不正なタイプです" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "認証処理に失敗しました" }, { status: 500 });
  }
}
