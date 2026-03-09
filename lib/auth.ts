import jwt from "jsonwebtoken";

// JWT署名用のシークレット（環境変数またはフォールバック）
const JWT_SECRET = process.env.CRON_SECRET || "default-jwt-secret";

// 閲覧者用トークンを生成（有効期限: 24時間）
export function generateViewerToken(): string {
  return jwt.sign({ role: "viewer" }, JWT_SECRET, { expiresIn: "24h" });
}

// 管理者用トークンを生成（有効期限: 8時間）
export function generateAdminToken(): string {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
}

// トークンを検証し、ロールを返す
export function verifyToken(token: string): { role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { role: string };
  } catch {
    return null;
  }
}
