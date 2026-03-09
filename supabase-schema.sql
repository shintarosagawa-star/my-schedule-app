-- スケジュール共有アプリ: Supabase テーブル作成SQL
-- Supabase の SQL Editor で実行してください

-- 1. schedules テーブル（スケジュールの○×管理）
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  is_available BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, time_slot)
);

-- 2. bookings テーブル（申し込みデータ）
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. settings テーブル（パスワードなどの設定値）
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule_id ON bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- 初期データ: 閲覧用パスワードを仮設定（初回は手動で設定 or Cronを実行）
-- bcrypt hash of "initial123" (実運用時はCronジョブで自動更新されます)
INSERT INTO settings (key, value)
VALUES
  ('viewer_password_hash', '$2a$10$dummyhashplaceholder'),
  ('viewer_password_plain', 'initial123')
ON CONFLICT (key) DO NOTHING;
