-- ═══════════════════════════════════════════════════════════════
--  WESCO Assessment — Cloudflare D1 schema
--  รันด้วย:  npx wrangler d1 execute wesco_assessment --remote --file=./db/schema.sql
-- ═══════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ── พนักงาน (Lock in ด้วยรหัสพนักงาน) ──────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_code      TEXT    NOT NULL UNIQUE,
  first_name    TEXT    NOT NULL,
  last_name     TEXT    NOT NULL,
  position      TEXT    NOT NULL,
  department    TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_emp_code ON employees(emp_code);

-- ── ผู้ดูแลระบบ (รหัสผ่านเก็บเป็น PBKDF2-SHA256 เท่านั้น) ────────
CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  display_name  TEXT,
  pw_hash       TEXT    NOT NULL,
  pw_salt       TEXT    NOT NULL,
  pw_iter       INTEGER NOT NULL DEFAULT 150000,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- ── เซสชัน (ใช้ร่วมกันทั้งพนักงานและแอดมิน) ─────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  kind       TEXT    NOT NULL,            -- 'employee' | 'admin'
  subject_id INTEGER NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sess_exp ON sessions(expires_at);

-- ── หัวข้อสอบ ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topics (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  code           TEXT    NOT NULL UNIQUE,
  title          TEXT    NOT NULL,
  subtitle       TEXT,
  description    TEXT,
  category       TEXT,
  time_limit_min INTEGER NOT NULL DEFAULT 0,   -- 0 = ไม่จับเวลา
  practical_max  REAL    NOT NULL DEFAULT 0,   -- คะแนนภาคปฏิบัติที่ Admin กรอก (0 = ปิด)
  shuffle        INTEGER NOT NULL DEFAULT 1,   -- สลับลำดับข้อ/ตัวเลือก
  is_active      INTEGER NOT NULL DEFAULT 1,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT
);

-- ── เอกสาร/ตารางอ้างอิงที่เปิดดูได้ระหว่างทำข้อสอบ ───────────────
CREATE TABLE IF NOT EXISTS topic_refs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id   INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  image_url  TEXT,
  html       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ref_topic ON topic_refs(topic_id);

-- ── คำถาม ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id    INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  seq         INTEGER NOT NULL DEFAULT 0,
  qtype       TEXT    NOT NULL DEFAULT 'single',  -- 'single' = ปรนัย | 'text' = อัตนัย (Admin ตรวจ)
  text        TEXT    NOT NULL,
  image_url   TEXT,
  explanation TEXT,
  points      REAL    NOT NULL DEFAULT 1,
  is_active   INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_q_topic ON questions(topic_id, seq);

-- ── ตัวเลือก ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS choices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label       TEXT    NOT NULL,
  text        TEXT    NOT NULL,
  is_correct  INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ch_q ON choices(question_id, sort_order);

-- ── การเข้าสอบ ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attempts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id     INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  topic_id        INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  status          TEXT    NOT NULL DEFAULT 'in_progress', -- in_progress | submitted | reviewed
  started_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  submitted_at    TEXT,
  duration_sec    INTEGER,
  quiz_score      REAL    NOT NULL DEFAULT 0,
  quiz_max        REAL    NOT NULL DEFAULT 0,
  practical_score REAL,
  practical_max   REAL    NOT NULL DEFAULT 0,
  total_score     REAL,
  total_max       REAL,
  percent         REAL,
  grade           TEXT,
  needs_review    INTEGER NOT NULL DEFAULT 0,
  reviewer_id     INTEGER,
  reviewed_at     TEXT,
  review_note     TEXT,
  attachment      TEXT
);
CREATE INDEX IF NOT EXISTS idx_att_emp   ON attempts(employee_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_att_topic ON attempts(topic_id);
CREATE INDEX IF NOT EXISTS idx_att_stat  ON attempts(status, needs_review);

-- ── คำตอบรายข้อ ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attempt_answers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id    INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id   INTEGER NOT NULL,
  choice_id     INTEGER,
  text_answer   TEXT,
  is_correct    INTEGER,
  points_earned REAL    NOT NULL DEFAULT 0,
  points_max    REAL    NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_ans_att ON attempt_answers(attempt_id);

-- ── ตั้งค่าระบบหลังบ้าน ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ── บันทึกกิจกรรมของ Admin ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER,
  action     TEXT NOT NULL,
  detail     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log(created_at DESC);

-- ── ค่าตั้งต้น ─────────────────────────────────────────────────
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('site_title',      'ระบบแบบทดสอบความสามารถพนักงาน'),
  ('site_subtitle',   'Wesco — Employee Competency Assessment'),
  ('grade_a_min',     '100'),
  ('grade_b_min',     '70'),
  ('allow_retake',    '1'),
  ('show_answers',    '1'),
  ('show_leaderboard','0'),
  ('registration_open','1');
