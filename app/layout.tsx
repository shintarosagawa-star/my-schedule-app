import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "スケジュール共有",
  description: "スケジュールの空き状況を確認・申し込みできるWebアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`min-h-screen bg-white ${notoSansJP.className}`}>
        <header className="border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "#1E3A8A" }}>
              Schedule
            </h1>
            <nav className="flex gap-6 text-sm font-medium">
              <a href="/" className="hover:opacity-70 transition-opacity" style={{ color: "#1F2937" }}>
                スケジュール
              </a>
              <a href="/admin" className="hover:opacity-70 transition-opacity" style={{ color: "#6B7280" }}>
                管理
              </a>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
          {children}
        </main>

        <footer className="border-t border-gray-100 mt-20">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <p className="text-sm" style={{ color: "#6B7280" }}>
              &copy; {new Date().getFullYear()} Schedule App
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
