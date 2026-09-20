/**
 * WESCO Assessment — API (Cloudflare Pages Functions + D1)
 * ทุก endpoint อยู่ใต้ /api/...
 *
 *  - การให้คะแนนทั้งหมดทำฝั่งเซิร์ฟเวอร์เท่านั้น เฉลยไม่เคยถูกส่งออกไปขณะทำข้อสอบ
 *  - รหัสผ่านแอดมินเก็บเป็น PBKDF2-SHA256 เท่านั้น ไม่เก็บรหัสผ่านจริง
 *  - ทุก query ใช้ prepared statement (.bind) กัน SQL injection
 */

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const ok = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

const fail = (message, status = 400, extra = {}) =>
  new Response(JSON.stringify({ error: message, ...extra }), { status, headers: JSON_HEADERS });

/* ───────────────────────── helpers ───────────────────────── */

const SESSION_HOURS = { employee: 12, admin: 8 };

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));

async function pbkdf2(password, saltHex, iterations) {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return hex(bits);
}

/** เปรียบเทียบแบบ constant-time กันการเดารหัสจากเวลาตอบสนอง */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const str = (v, max = 200) => (v === null || v === undefined) ? '' : String(v).trim().slice(0, max);
const num = (v, dflt = 0) => { const n = Number(v); return Number.isFinite(n) ? n : dflt; };
const int = (v, dflt = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : dflt; };
const bool01 = v => (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0;

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function getSettings(db) {
  const { results } = await db.prepare('SELECT key, value FROM settings').all();
  const s = {};
  for (const r of results) s[r.key] = r.value;
  return s;
}

function computeGrade(percent, settings) {
  const aMin = num(settings.grade_a_min, 100);
  const bMin = num(settings.grade_b_min, 70);
  if (percent >= aMin) return 'A';
  if (percent >= bMin) return 'B';
  return 'C';
}

const clientIp = request => request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';

/* ───────────────────────── auth ───────────────────────── */

async function createSession(db, kind, subjectId) {
  const token = randomToken();
  await db.prepare(
    `INSERT INTO sessions (token, kind, subject_id, expires_at)
     VALUES (?1, ?2, ?3, datetime('now', ?4))`
  ).bind(token, kind, subjectId, `+${SESSION_HOURS[kind]} hours`).run();
  return token;
}

function bearer(request) {
  const h = request.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}

async function authenticate(db, request, kind) {
  const token = bearer(request);
  if (!token) return null;
  const row = await db.prepare(
    `SELECT subject_id FROM sessions
      WHERE token = ?1 AND kind = ?2 AND expires_at > datetime('now')`
  ).bind(token, kind).first();
  if (!row) return null;

  if (kind === 'employee') {
    return await db.prepare(
      `SELECT id, emp_code, first_name, last_name, position, department, created_at
         FROM employees WHERE id = ?1 AND is_active = 1`
    ).bind(row.subject_id).first();
  }
  return await db.prepare(
    `SELECT id, username, display_name FROM admins WHERE id = ?1 AND is_active = 1`
  ).bind(row.subject_id).first();
}

const requireEmployee = async (db, request) => {
  const me = await authenticate(db, request, 'employee');
  if (!me) throw fail('กรุณาเข้าสู่ระบบก่อน', 401);
  return me;
};

const requireAdmin = async (db, request) => {
  const me = await authenticate(db, request, 'admin');
  if (!me) throw fail('ต้องเข้าสู่ระบบผู้ดูแลก่อน', 401);
  return me;
};

const audit = (db, adminId, action, detail) =>
  db.prepare('INSERT INTO audit_log (admin_id, action, detail) VALUES (?1, ?2, ?3)')
    .bind(adminId ?? null, action, detail ? String(detail).slice(0, 500) : null).run();

/* ───────────────────── grading / recompute ───────────────────── */

/** คำนวณคะแนนรวม เปอร์เซ็นต์ และเกรดของการสอบครั้งหนึ่งใหม่ทั้งหมด */
async function recomputeAttempt(db, attemptId, settings) {
  const a = await db.prepare('SELECT * FROM attempts WHERE id = ?1').bind(attemptId).first();
  if (!a) return null;

  const agg = await db.prepare(
    `SELECT COALESCE(SUM(points_earned),0) AS earned,
            COALESCE(SUM(points_max),0)    AS max,
            SUM(CASE WHEN is_correct IS NULL THEN 1 ELSE 0 END) AS ungraded
       FROM attempt_answers WHERE attempt_id = ?1`
  ).bind(attemptId).first();

  const quizScore = num(agg.earned, 0);
  const quizMax = num(agg.max, 0);
  const pracMax = num(a.practical_max, 0);
  const pracScore = a.practical_score === null ? null : num(a.practical_score, 0);

  const pendingText = int(agg.ungraded, 0) > 0;
  const pendingPractical = pracMax > 0 && pracScore === null;
  const needsReview = (pendingText || pendingPractical) ? 1 : 0;

  let totalScore = null, totalMax = null, percent = null, grade = null, status = 'submitted';
  if (!needsReview) {
    totalScore = quizScore + (pracScore ?? 0);
    totalMax = quizMax + pracMax;
    percent = totalMax > 0 ? Math.round((totalScore / totalMax) * 1000) / 10 : 0;
    grade = computeGrade(percent, settings);
    status = 'reviewed';
  }

  await db.prepare(
    `UPDATE attempts
        SET quiz_score = ?2, quiz_max = ?3, total_score = ?4, total_max = ?5,
            percent = ?6, grade = ?7, needs_review = ?8, status = ?9
      WHERE id = ?1`
  ).bind(attemptId, quizScore, quizMax, totalScore, totalMax, percent, grade, needsReview, status).run();

  return await db.prepare('SELECT * FROM attempts WHERE id = ?1').bind(attemptId).first();
}

/* ───────────────────────── router ───────────────────────── */

export async function onRequest(context) {
  const { request, env, params } = context;
  const db = env.DB;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS', 'access-control-allow-headers': 'content-type,authorization' },
    });
  }

  if (!db) {
    return fail('ยังไม่ได้ผูกฐานข้อมูล D1 (binding "DB") — ตรวจสอบ wrangler.toml หรือการตั้งค่าใน Cloudflare Dashboard', 500);
  }

  const seg = (params.path || []).map(s => decodeURIComponent(s));
  const method = request.method;
  const url = new URL(request.url);

  let body = {};
  if (method === 'POST' || method === 'PUT') {
    try { body = await request.json(); } catch { body = {}; }
    if (body === null || typeof body !== 'object') body = {};
  }

  try {
    const res = await route({ db, env, request, url, method, seg, body });
    return res || fail('ไม่พบ endpoint นี้', 404);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('API error:', e && e.stack || e);
    return fail('เกิดข้อผิดพลาดภายในระบบ', 500, { detail: String(e && e.message || e) });
  }
}

async function route(ctx) {
  const { seg } = ctx;
  const head = seg[0] || '';
  if (head === 'health') return ok({ ok: true, time: new Date().toISOString() });
  if (head === 'config') return publicConfig(ctx);
  if (head === 'auth') return authRoutes(ctx);
  if (head === 'me') return meRoute(ctx);
  if (head === 'topics') return topicRoutes(ctx);
  if (head === 'attempts') return attemptRoutes(ctx);
  if (head === 'history') return historyRoute(ctx);
  if (head === 'admin') return adminRoutes(ctx);
  return null;
}

/* ───────────────────── public config ───────────────────── */

async function publicConfig({ db }) {
  const s = await getSettings(db);
  const adminCount = await db.prepare('SELECT COUNT(*) AS n FROM admins WHERE is_active = 1').first();
  return ok({
    site_title: s.site_title || 'ระบบแบบทดสอบความสามารถพนักงาน',
    site_subtitle: s.site_subtitle || '',
    grade_a_min: num(s.grade_a_min, 100),
    grade_b_min: num(s.grade_b_min, 70),
    allow_retake: bool01(s.allow_retake),
    show_answers: bool01(s.show_answers),
    registration_open: bool01(s.registration_open),
    needs_bootstrap: int(adminCount.n, 0) === 0,
  });
}

/* ───────────────────── employee auth ───────────────────── */

async function authRoutes({ db, request, method, seg, body }) {
  const action = seg[1];

  if (action === 'register' && method === 'POST') {
    const s = await getSettings(db);
    if (!bool01(s.registration_open)) return fail('ขณะนี้ปิดรับการลงทะเบียนชั่วคราว', 403);

    const emp_code = str(body.emp_code, 40);
    const first_name = str(body.first_name, 80);
    const last_name = str(body.last_name, 80);
    const position = str(body.position, 120);
    const department = str(body.department, 120);

    if (!emp_code) return fail('กรุณากรอกรหัสพนักงาน', 422, { field: 'emp_code' });
    if (!/^[A-Za-z0-9._-]{2,40}$/.test(emp_code))
      return fail('รหัสพนักงานใช้ได้เฉพาะตัวอักษร ตัวเลข . _ - ความยาว 2-40 ตัว', 422, { field: 'emp_code' });
    if (!first_name) return fail('กรุณากรอกชื่อ', 422, { field: 'first_name' });
    if (!last_name) return fail('กรุณากรอกนามสกุล', 422, { field: 'last_name' });
    if (!position) return fail('กรุณากรอกตำแหน่ง', 422, { field: 'position' });

    const dup = await db.prepare('SELECT id FROM employees WHERE emp_code = ?1').bind(emp_code).first();
    if (dup) return fail('รหัสพนักงานนี้ลงทะเบียนไว้แล้ว — กรุณากด "เข้าสู่ระบบ" แทน', 409, { field: 'emp_code' });

    const r = await db.prepare(
      `INSERT INTO employees (emp_code, first_name, last_name, position, department, last_login_at)
       VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))`
    ).bind(emp_code, first_name, last_name, position, department || null).run();

    const id = r.meta.last_row_id;
    const token = await createSession(db, 'employee', id);
    const me = await db.prepare(
      'SELECT id, emp_code, first_name, last_name, position, department FROM employees WHERE id = ?1'
    ).bind(id).first();
    return ok({ token, employee: me }, 201);
  }

  if (action === 'login' && method === 'POST') {
    const emp_code = str(body.emp_code, 40);
    if (!emp_code) return fail('กรุณากรอกรหัสพนักงาน', 422, { field: 'emp_code' });

    const me = await db.prepare(
      'SELECT id, emp_code, first_name, last_name, position, department, is_active FROM employees WHERE emp_code = ?1'
    ).bind(emp_code).first();

    if (!me) return fail('ไม่พบรหัสพนักงานนี้ในระบบ — กรุณาลงทะเบียนก่อน', 404, { field: 'emp_code', need_register: true });
    if (!me.is_active) return fail('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ', 403);

    await db.prepare("UPDATE employees SET last_login_at = datetime('now') WHERE id = ?1").bind(me.id).run();
    const token = await createSession(db, 'employee', me.id);
    delete me.is_active;
    return ok({ token, employee: me });
  }

  if (action === 'logout' && method === 'POST') {
    const token = bearer(request);
    if (token) await db.prepare('DELETE FROM sessions WHERE token = ?1').bind(token).run();
    return ok({ ok: true });
  }

  return null;
}

async function meRoute({ db, request, method }) {
  if (method !== 'GET') return null;
  const me = await requireEmployee(db, request);
  const stats = await db.prepare(
    `SELECT COUNT(*) AS attempts,
            SUM(CASE WHEN grade = 'A' THEN 1 ELSE 0 END) AS a,
            SUM(CASE WHEN grade = 'B' THEN 1 ELSE 0 END) AS b,
            SUM(CASE WHEN grade = 'C' THEN 1 ELSE 0 END) AS c,
            SUM(CASE WHEN needs_review = 1 THEN 1 ELSE 0 END) AS pending
       FROM attempts WHERE employee_id = ?1 AND status <> 'in_progress'`
  ).bind(me.id).first();
  return ok({ employee: me, stats });
}

/* ───────────────────── topics (employee) ───────────────────── */

async function topicRoutes({ db, request, method }) {
  if (method !== 'GET') return null;
  const me = await requireEmployee(db, request);

  const { results } = await db.prepare(
    `SELECT t.id, t.code, t.title, t.subtitle, t.description, t.category,
            t.time_limit_min, t.practical_max, t.sort_order,
            (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id AND q.is_active = 1) AS question_count,
            (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id AND q.is_active = 1 AND q.qtype = 'text') AS text_count,
            (SELECT COUNT(*) FROM topic_refs r WHERE r.topic_id = t.id) AS ref_count,
            (SELECT COUNT(*) FROM attempts a WHERE a.topic_id = t.id AND a.employee_id = ?1 AND a.status <> 'in_progress') AS my_attempts,
            (SELECT MAX(a.percent) FROM attempts a WHERE a.topic_id = t.id AND a.employee_id = ?1 AND a.grade IS NOT NULL) AS my_best,
            (SELECT a.id FROM attempts a WHERE a.topic_id = t.id AND a.employee_id = ?1 AND a.status = 'in_progress' ORDER BY a.id DESC LIMIT 1) AS resume_id,
            (SELECT COUNT(*) FROM attempts a WHERE a.topic_id = t.id AND a.employee_id = ?1 AND a.needs_review = 1) AS my_pending
       FROM topics t
      WHERE t.is_active = 1
      ORDER BY t.sort_order, t.id`
  ).bind(me.id).all();

  // เกรดที่ดีที่สุดของแต่ละหัวข้อ (A ดีกว่า B ดีกว่า C)
  const { results: best } = await db.prepare(
    `SELECT topic_id, MIN(grade) AS best_grade
       FROM attempts WHERE employee_id = ?1 AND grade IS NOT NULL GROUP BY topic_id`
  ).bind(me.id).all();
  const bestMap = Object.fromEntries(best.map(r => [r.topic_id, r.best_grade]));

  const s = await getSettings(db);
  return ok({
    topics: results.map(t => ({ ...t, my_best_grade: bestMap[t.id] || null })),
    allow_retake: bool01(s.allow_retake),
  });
}

/* ───────────────────── attempts (employee) ───────────────────── */

async function attemptRoutes({ db, request, method, seg, body }) {
  const me = await requireEmployee(db, request);
  const s = await getSettings(db);

  /* เริ่มทำข้อสอบ */
  if (method === 'POST' && !seg[1]) {
    const topicId = int(body.topic_id, 0);
    const topic = await db.prepare('SELECT * FROM topics WHERE id = ?1 AND is_active = 1').bind(topicId).first();
    if (!topic) return fail('ไม่พบหัวข้อสอบนี้ หรือถูกปิดใช้งานแล้ว', 404);

    if (!bool01(s.allow_retake)) {
      const done = await db.prepare(
        "SELECT id FROM attempts WHERE employee_id = ?1 AND topic_id = ?2 AND status <> 'in_progress' LIMIT 1"
      ).bind(me.id, topicId).first();
      if (done) return fail('หัวข้อนี้อนุญาตให้สอบได้เพียงครั้งเดียว', 403);
    }

    // ยกเลิกข้อสอบค้างของหัวข้อเดิม เพื่อไม่ให้มีหลายชุดพร้อมกัน
    await db.prepare(
      "DELETE FROM attempts WHERE employee_id = ?1 AND topic_id = ?2 AND status = 'in_progress'"
    ).bind(me.id, topicId).run();

    const ins = await db.prepare(
      'INSERT INTO attempts (employee_id, topic_id, practical_max, status) VALUES (?1, ?2, ?3, \'in_progress\')'
    ).bind(me.id, topicId, num(topic.practical_max, 0)).run();

    const attemptId = ins.meta.last_row_id;
    const payload = await buildExamPayload(db, topic, attemptId);
    if (!payload.questions.length) {
      await db.prepare('DELETE FROM attempts WHERE id = ?1').bind(attemptId).run();
      return fail('หัวข้อนี้ยังไม่มีข้อสอบ', 409);
    }
    return ok(payload, 201);
  }

  const attemptId = int(seg[1], 0);
  if (!attemptId) return null;

  const attempt = await db.prepare('SELECT * FROM attempts WHERE id = ?1 AND employee_id = ?2')
    .bind(attemptId, me.id).first();
  if (!attempt) return fail('ไม่พบข้อมูลการสอบนี้', 404);

  /* ส่งคำตอบ */
  if (method === 'POST' && seg[2] === 'submit') {
    if (attempt.status !== 'in_progress') return fail('ข้อสอบชุดนี้ส่งคำตอบไปแล้ว', 409);

    const topic = await db.prepare('SELECT * FROM topics WHERE id = ?1').bind(attempt.topic_id).first();
    const { results: questions } = await db.prepare(
      "SELECT id, qtype, points FROM questions WHERE topic_id = ?1 AND is_active = 1"
    ).bind(attempt.topic_id).all();

    const { results: correct } = await db.prepare(
      `SELECT c.id, c.question_id FROM choices c
         JOIN questions q ON q.id = c.question_id
        WHERE q.topic_id = ?1 AND q.is_active = 1 AND c.is_correct = 1`
    ).bind(attempt.topic_id).all();
    const correctMap = {};
    for (const c of correct) correctMap[c.question_id] = c.id;

    const answers = Array.isArray(body.answers) ? body.answers : [];
    const byQ = {};
    for (const a of answers) byQ[int(a.question_id, 0)] = a;

    const stmts = [];
    for (const q of questions) {
      const given = byQ[q.id] || {};
      const pMax = num(q.points, 1);
      if (q.qtype === 'text') {
        // อัตนัย: รอผู้ดูแลตรวจ (is_correct = NULL)
        stmts.push(db.prepare(
          `INSERT INTO attempt_answers (attempt_id, question_id, text_answer, is_correct, points_earned, points_max)
           VALUES (?1, ?2, ?3, NULL, 0, ?4)`
        ).bind(attemptId, q.id, str(given.text_answer, 4000) || null, pMax));
      } else {
        const chosen = int(given.choice_id, 0) || null;
        const isCorrect = chosen && correctMap[q.id] === chosen ? 1 : 0;
        stmts.push(db.prepare(
          `INSERT INTO attempt_answers (attempt_id, question_id, choice_id, is_correct, points_earned, points_max)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
        ).bind(attemptId, q.id, chosen, isCorrect, isCorrect ? pMax : 0, pMax));
      }
    }

    stmts.push(db.prepare(
      `UPDATE attempts
          SET status = 'submitted', submitted_at = datetime('now'),
              duration_sec = CAST((julianday('now') - julianday(started_at)) * 86400 AS INTEGER)
        WHERE id = ?1`
    ).bind(attemptId));

    await db.batch(stmts);
    const updated = await recomputeAttempt(db, attemptId, s);
    return ok(await buildResult(db, updated, topic, s));
  }

  /* ยกเลิกข้อสอบที่ยังทำไม่เสร็จ */
  if (method === 'DELETE') {
    if (attempt.status !== 'in_progress') return fail('ลบได้เฉพาะข้อสอบที่ยังทำไม่เสร็จ', 409);
    await db.prepare('DELETE FROM attempts WHERE id = ?1').bind(attemptId).run();
    return ok({ ok: true });
  }

  /* ดูข้อสอบที่ค้างอยู่ หรือดูผลสอบ */
  if (method === 'GET') {
    const topic = await db.prepare('SELECT * FROM topics WHERE id = ?1').bind(attempt.topic_id).first();
    if (attempt.status === 'in_progress') return ok(await buildExamPayload(db, topic, attemptId));
    return ok(await buildResult(db, attempt, topic, s));
  }

  return null;
}

/** ชุดข้อสอบที่ส่งให้ผู้สอบ — ไม่มีเฉลยติดไปด้วยเด็ดขาด */
async function buildExamPayload(db, topic, attemptId) {
  const { results: qs } = await db.prepare(
    `SELECT id, seq, qtype, text, image_url, points
       FROM questions WHERE topic_id = ?1 AND is_active = 1 ORDER BY seq, id`
  ).bind(topic.id).all();

  const { results: chs } = await db.prepare(
    `SELECT c.id, c.question_id, c.label, c.text
       FROM choices c JOIN questions q ON q.id = c.question_id
      WHERE q.topic_id = ?1 AND q.is_active = 1
      ORDER BY c.sort_order, c.id`
  ).bind(topic.id).all();

  const { results: refs } = await db.prepare(
    'SELECT id, title, image_url, html FROM topic_refs WHERE topic_id = ?1 ORDER BY sort_order, id'
  ).bind(topic.id).all();

  const byQ = {};
  for (const c of chs) (byQ[c.question_id] ||= []).push({ id: c.id, label: c.label, text: c.text });

  let questions = qs.map(q => ({ ...q, choices: byQ[q.id] || [] }));
  // สลับเฉพาะลำดับข้อ — ลำดับตัวเลือกคงเดิม เพราะมีตัวเลือกแบบ "ถูกทุกข้อ"
  if (topic.shuffle) questions = shuffled(questions);

  const attempt = await db.prepare('SELECT id, started_at FROM attempts WHERE id = ?1').bind(attemptId).first();

  return {
    attempt: { id: attemptId, started_at: attempt.started_at, status: 'in_progress' },
    topic: {
      id: topic.id, code: topic.code, title: topic.title, subtitle: topic.subtitle,
      time_limit_min: topic.time_limit_min, practical_max: topic.practical_max,
    },
    refs,
    questions,
  };
}

/** ผลสอบ พร้อมเฉลย (ถ้าตั้งค่าให้แสดง) */
async function buildResult(db, attempt, topic, settings) {
  const showAnswers = bool01(settings.show_answers);

  const { results: rows } = await db.prepare(
    `SELECT aa.question_id, aa.choice_id, aa.text_answer, aa.is_correct, aa.points_earned, aa.points_max,
            q.seq, q.qtype, q.text AS question_text, q.image_url, q.explanation
       FROM attempt_answers aa JOIN questions q ON q.id = aa.question_id
      WHERE aa.attempt_id = ?1 ORDER BY q.seq, q.id`
  ).bind(attempt.id).all();

  let choiceMap = {};
  if (showAnswers) {
    const { results: chs } = await db.prepare(
      `SELECT c.id, c.question_id, c.label, c.text, c.is_correct
         FROM choices c JOIN attempt_answers aa ON aa.question_id = c.question_id
        WHERE aa.attempt_id = ?1 ORDER BY c.sort_order, c.id`
    ).bind(attempt.id).all();
    for (const c of chs) (choiceMap[c.question_id] ||= []).push(c);
  }

  return {
    attempt: {
      id: attempt.id, status: attempt.status, needs_review: attempt.needs_review,
      started_at: attempt.started_at, submitted_at: attempt.submitted_at, duration_sec: attempt.duration_sec,
      quiz_score: attempt.quiz_score, quiz_max: attempt.quiz_max,
      practical_score: attempt.practical_score, practical_max: attempt.practical_max,
      total_score: attempt.total_score, total_max: attempt.total_max,
      percent: attempt.percent, grade: attempt.grade, review_note: attempt.review_note,
    },
    topic: { id: topic.id, code: topic.code, title: topic.title, subtitle: topic.subtitle },
    show_answers: showAnswers,
    answers: rows.map(r => ({
      ...r,
      choices: showAnswers ? (choiceMap[r.question_id] || []) : [],
    })),
  };
}

async function historyRoute({ db, request, method }) {
  if (method !== 'GET') return null;
  const me = await requireEmployee(db, request);
  const { results } = await db.prepare(
    `SELECT a.id, a.status, a.needs_review, a.started_at, a.submitted_at, a.duration_sec,
            a.quiz_score, a.quiz_max, a.practical_score, a.practical_max,
            a.total_score, a.total_max, a.percent, a.grade,
            t.code AS topic_code, t.title AS topic_title
       FROM attempts a JOIN topics t ON t.id = a.topic_id
      WHERE a.employee_id = ?1 AND a.status <> 'in_progress'
      ORDER BY a.submitted_at DESC, a.id DESC LIMIT 200`
  ).bind(me.id).all();
  return ok({ history: results });
}

/* ═══════════════════════════ ADMIN ═══════════════════════════ */

async function adminRoutes(ctx) {
  const { db, request, method, seg, body, url } = ctx;
  const a1 = seg[1], a2 = seg[2], a3 = seg[3];

  /* — สร้างผู้ดูแลคนแรก (ทำได้เฉพาะตอนยังไม่มีแอดมินเลย) — */
  if (a1 === 'bootstrap' && method === 'POST') {
    const n = await db.prepare('SELECT COUNT(*) AS n FROM admins').first();
    if (int(n.n, 0) > 0) return fail('ระบบมีผู้ดูแลอยู่แล้ว', 403);

    const username = str(body.username, 60).toLowerCase();
    const password = String(body.password || '');
    if (!/^[a-z0-9._-]{3,60}$/.test(username)) return fail('ชื่อผู้ใช้ใช้ได้เฉพาะ a-z 0-9 . _ - ความยาว 3-60 ตัว', 422, { field: 'username' });
    if (password.length < 8) return fail('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร', 422, { field: 'password' });

    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const iter = 150000;
    const hash = await pbkdf2(password, salt, iter);
    const r = await db.prepare(
      'INSERT INTO admins (username, display_name, pw_hash, pw_salt, pw_iter) VALUES (?1, ?2, ?3, ?4, ?5)'
    ).bind(username, str(body.display_name, 100) || username, hash, salt, iter).run();

    await audit(db, r.meta.last_row_id, 'admin_bootstrap', username);
    const token = await createSession(db, 'admin', r.meta.last_row_id);
    return ok({ token, admin: { id: r.meta.last_row_id, username, display_name: str(body.display_name, 100) || username } }, 201);
  }

  /* — เข้าสู่ระบบผู้ดูแล — */
  if (a1 === 'login' && method === 'POST') {
    const ip = clientIp(request);
    const recent = await db.prepare(
      `SELECT COUNT(*) AS n FROM audit_log
        WHERE action = 'admin_login_fail' AND detail = ?1 AND created_at > datetime('now','-15 minutes')`
    ).bind(ip).first();
    if (int(recent.n, 0) >= 8) return fail('พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอ 15 นาที', 429);

    const username = str(body.username, 60).toLowerCase();
    const password = String(body.password || '');
    const row = await db.prepare('SELECT * FROM admins WHERE username = ?1 AND is_active = 1').bind(username).first();

    // เทียบ hash เสมอแม้ไม่พบผู้ใช้ เพื่อให้เวลาตอบสนองใกล้เคียงกัน
    const salt = row ? row.pw_salt : '00000000000000000000000000000000';
    const iter = row ? int(row.pw_iter, 150000) : 150000;
    const hash = await pbkdf2(password, salt, iter);

    if (!row || !timingSafeEqual(hash, row.pw_hash)) {
      await audit(db, null, 'admin_login_fail', ip);
      return fail('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
    }

    await db.prepare("UPDATE admins SET last_login_at = datetime('now') WHERE id = ?1").bind(row.id).run();
    const token = await createSession(db, 'admin', row.id);
    await audit(db, row.id, 'admin_login', ip);
    return ok({ token, admin: { id: row.id, username: row.username, display_name: row.display_name } });
  }

  if (a1 === 'logout' && method === 'POST') {
    const token = bearer(request);
    if (token) await db.prepare('DELETE FROM sessions WHERE token = ?1').bind(token).run();
    return ok({ ok: true });
  }

  /* ─── ต่อจากนี้ต้องเป็นผู้ดูแลเท่านั้น ─── */
  const admin = await requireAdmin(db, request);

  if (a1 === 'me' && method === 'GET') return ok({ admin });

  if (a1 === 'stats' && method === 'GET') return adminStats(db);

  if (a1 === 'topics') return adminTopics(ctx, admin, a2, a3);
  if (a1 === 'questions') return adminQuestions(ctx, admin, a2);
  if (a1 === 'refs' && method === 'DELETE' && a2) {
    await db.prepare('DELETE FROM topic_refs WHERE id = ?1').bind(int(a2, 0)).run();
    await audit(db, admin.id, 'ref_delete', a2);
    return ok({ ok: true });
  }
  if (a1 === 'employees') return adminEmployees(ctx, admin, a2);
  if (a1 === 'attempts') return adminAttempts(ctx, admin, a2, a3);
  if (a1 === 'settings') return adminSettings(ctx, admin);
  if (a1 === 'admins') return adminAccounts(ctx, admin, a2);
  if (a1 === 'export' && method === 'GET') return adminExport(db, url);
  if (a1 === 'audit' && method === 'GET') {
    const { results } = await db.prepare(
      `SELECT l.id, l.action, l.detail, l.created_at, a.username
         FROM audit_log l LEFT JOIN admins a ON a.id = l.admin_id
        ORDER BY l.id DESC LIMIT 200`
    ).all();
    return ok({ log: results });
  }

  return null;
}

async function adminStats(db) {
  const totals = await db.prepare(
    `SELECT (SELECT COUNT(*) FROM employees WHERE is_active = 1) AS employees,
            (SELECT COUNT(*) FROM topics WHERE is_active = 1)    AS topics,
            (SELECT COUNT(*) FROM questions WHERE is_active = 1) AS questions,
            (SELECT COUNT(*) FROM attempts WHERE status <> 'in_progress') AS attempts,
            (SELECT COUNT(*) FROM attempts WHERE needs_review = 1)        AS pending,
            (SELECT ROUND(AVG(percent),1) FROM attempts WHERE percent IS NOT NULL) AS avg_percent`
  ).first();

  const { results: grades } = await db.prepare(
    "SELECT grade, COUNT(*) AS n FROM attempts WHERE grade IS NOT NULL GROUP BY grade"
  ).all();

  const { results: byTopic } = await db.prepare(
    `SELECT t.id, t.code, t.title,
            COUNT(a.id) AS attempts,
            ROUND(AVG(a.percent),1) AS avg_percent,
            SUM(CASE WHEN a.grade = 'A' THEN 1 ELSE 0 END) AS a,
            SUM(CASE WHEN a.grade = 'B' THEN 1 ELSE 0 END) AS b,
            SUM(CASE WHEN a.grade = 'C' THEN 1 ELSE 0 END) AS c
       FROM topics t LEFT JOIN attempts a ON a.topic_id = t.id AND a.grade IS NOT NULL
      GROUP BY t.id ORDER BY t.sort_order, t.id`
  ).all();

  const { results: recent } = await db.prepare(
    `SELECT a.id, a.percent, a.grade, a.needs_review, a.submitted_at,
            e.emp_code, e.first_name, e.last_name, t.code AS topic_code, t.title AS topic_title
       FROM attempts a JOIN employees e ON e.id = a.employee_id JOIN topics t ON t.id = a.topic_id
      WHERE a.status <> 'in_progress' ORDER BY a.id DESC LIMIT 12`
  ).all();

  return ok({
    totals,
    grades: Object.fromEntries(grades.map(g => [g.grade, g.n])),
    by_topic: byTopic,
    recent,
  });
}

/* ── หัวข้อสอบ ── */
async function adminTopics({ db, method, body }, admin, id, sub) {
  if (method === 'GET' && !id) {
    const { results } = await db.prepare(
      `SELECT t.*,
              (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id AND q.is_active = 1) AS question_count,
              (SELECT COUNT(*) FROM topic_refs r WHERE r.topic_id = t.id) AS ref_count,
              (SELECT COUNT(*) FROM attempts a WHERE a.topic_id = t.id) AS attempt_count
         FROM topics t ORDER BY t.sort_order, t.id`
    ).all();
    return ok({ topics: results });
  }

  if (method === 'POST' && !id) {
    const code = str(body.code, 60);
    const title = str(body.title, 200);
    if (!code) return fail('กรุณากรอกรหัสหัวข้อ', 422, { field: 'code' });
    if (!title) return fail('กรุณากรอกชื่อหัวข้อ', 422, { field: 'title' });
    const dup = await db.prepare('SELECT id FROM topics WHERE code = ?1').bind(code).first();
    if (dup) return fail('รหัสหัวข้อนี้มีอยู่แล้ว', 409, { field: 'code' });

    const maxOrder = await db.prepare('SELECT COALESCE(MAX(sort_order),0) AS m FROM topics').first();
    const r = await db.prepare(
      `INSERT INTO topics (code,title,subtitle,description,category,time_limit_min,practical_max,shuffle,is_active,sort_order)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`
    ).bind(code, title, str(body.subtitle, 300) || null, str(body.description, 2000) || null,
      str(body.category, 100) || null, Math.max(0, int(body.time_limit_min, 0)),
      Math.max(0, num(body.practical_max, 0)), bool01(body.shuffle), bool01(body.is_active ?? 1),
      int(maxOrder.m, 0) + 10).run();

    await audit(db, admin.id, 'topic_create', code);
    return ok({ id: r.meta.last_row_id }, 201);
  }

  const tid = int(id, 0);
  if (!tid) return null;

  /* คำถามภายในหัวข้อ */
  if (sub === 'questions') {
    if (method === 'GET') {
      const { results: qs } = await db.prepare(
        'SELECT * FROM questions WHERE topic_id = ?1 ORDER BY seq, id'
      ).bind(tid).all();
      const { results: chs } = await db.prepare(
        `SELECT c.* FROM choices c JOIN questions q ON q.id = c.question_id
          WHERE q.topic_id = ?1 ORDER BY c.sort_order, c.id`
      ).bind(tid).all();
      const byQ = {};
      for (const c of chs) (byQ[c.question_id] ||= []).push(c);
      return ok({ questions: qs.map(q => ({ ...q, choices: byQ[q.id] || [] })) });
    }
    if (method === 'POST') return saveQuestion({ db, body }, admin, null, tid);
  }

  /* เอกสารอ้างอิงของหัวข้อ */
  if (sub === 'refs') {
    if (method === 'GET') {
      const { results } = await db.prepare(
        'SELECT * FROM topic_refs WHERE topic_id = ?1 ORDER BY sort_order, id'
      ).bind(tid).all();
      return ok({ refs: results });
    }
    if (method === 'POST') {
      const title = str(body.title, 200);
      if (!title) return fail('กรุณากรอกชื่อเอกสารอ้างอิง', 422, { field: 'title' });
      const image_url = str(body.image_url, 500);
      const html = str(body.html, 20000);
      if (!image_url && !html) return fail('ต้องระบุ URL รูปภาพ หรือเนื้อหา HTML อย่างน้อยหนึ่งอย่าง', 422);
      const m = await db.prepare('SELECT COALESCE(MAX(sort_order),-1) AS m FROM topic_refs WHERE topic_id = ?1').bind(tid).first();
      const r = await db.prepare(
        'INSERT INTO topic_refs (topic_id,title,image_url,html,sort_order) VALUES (?1,?2,?3,?4,?5)'
      ).bind(tid, title, image_url || null, html || null, int(m.m, -1) + 1).run();
      await audit(db, admin.id, 'ref_create', title);
      return ok({ id: r.meta.last_row_id }, 201);
    }
  }

  if (method === 'PUT' && !sub) {
    const cur = await db.prepare('SELECT * FROM topics WHERE id = ?1').bind(tid).first();
    if (!cur) return fail('ไม่พบหัวข้อนี้', 404);
    const code = str(body.code, 60) || cur.code;
    if (code !== cur.code) {
      const dup = await db.prepare('SELECT id FROM topics WHERE code = ?1 AND id <> ?2').bind(code, tid).first();
      if (dup) return fail('รหัสหัวข้อนี้มีอยู่แล้ว', 409, { field: 'code' });
    }
    await db.prepare(
      `UPDATE topics SET code=?2, title=?3, subtitle=?4, description=?5, category=?6,
              time_limit_min=?7, practical_max=?8, shuffle=?9, is_active=?10, sort_order=?11,
              updated_at=datetime('now')
        WHERE id=?1`
    ).bind(tid, code, str(body.title, 200) || cur.title, str(body.subtitle, 300) || null,
      str(body.description, 2000) || null, str(body.category, 100) || null,
      Math.max(0, int(body.time_limit_min, cur.time_limit_min)),
      Math.max(0, num(body.practical_max, cur.practical_max)),
      bool01(body.shuffle), bool01(body.is_active), int(body.sort_order, cur.sort_order)).run();

    await audit(db, admin.id, 'topic_update', code);
    return ok({ ok: true });
  }

  if (method === 'DELETE' && !sub) {
    const t = await db.prepare('SELECT code FROM topics WHERE id = ?1').bind(tid).first();
    if (!t) return fail('ไม่พบหัวข้อนี้', 404);
    await db.prepare('DELETE FROM topics WHERE id = ?1').bind(tid).run();
    await audit(db, admin.id, 'topic_delete', t.code);
    return ok({ ok: true });
  }

  return null;
}

/* ── คำถาม ── */
async function adminQuestions(ctx, admin, id) {
  const { db, method, body } = ctx;
  const qid = int(id, 0);
  if (!qid) return null;

  if (method === 'PUT') return saveQuestion(ctx, admin, qid, null);

  if (method === 'DELETE') {
    const q = await db.prepare('SELECT id FROM questions WHERE id = ?1').bind(qid).first();
    if (!q) return fail('ไม่พบคำถามนี้', 404);
    await db.prepare('DELETE FROM questions WHERE id = ?1').bind(qid).run();
    await audit(db, admin.id, 'question_delete', qid);
    return ok({ ok: true });
  }
  return null;
}

async function saveQuestion({ db, body }, admin, qid, topicId) {
  const text = str(body.text, 4000);
  if (!text) return fail('กรุณากรอกโจทย์คำถาม', 422, { field: 'text' });

  const qtype = body.qtype === 'text' ? 'text' : 'single';
  const choices = Array.isArray(body.choices) ? body.choices : [];

  if (qtype === 'single') {
    const valid = choices.filter(c => str(c.text, 1000));
    if (valid.length < 2) return fail('คำถามปรนัยต้องมีตัวเลือกอย่างน้อย 2 ข้อ', 422, { field: 'choices' });
    if (!valid.some(c => bool01(c.is_correct))) return fail('กรุณาเลือกคำตอบที่ถูกต้อง 1 ข้อ', 422, { field: 'choices' });
  }

  const image_url = str(body.image_url, 500) || null;
  const explanation = str(body.explanation, 2000) || null;
  const points = Math.max(0.5, num(body.points, 1));
  const is_active = bool01(body.is_active ?? 1);

  let id = qid;
  if (qid) {
    const cur = await db.prepare('SELECT * FROM questions WHERE id = ?1').bind(qid).first();
    if (!cur) return fail('ไม่พบคำถามนี้', 404);
    await db.prepare(
      `UPDATE questions SET seq=?2, qtype=?3, text=?4, image_url=?5, explanation=?6, points=?7, is_active=?8 WHERE id=?1`
    ).bind(qid, int(body.seq, cur.seq), qtype, text, image_url, explanation, points, is_active).run();
    await db.prepare('DELETE FROM choices WHERE question_id = ?1').bind(qid).run();
  } else {
    const m = await db.prepare('SELECT COALESCE(MAX(seq),0) AS m FROM questions WHERE topic_id = ?1').bind(topicId).first();
    const r = await db.prepare(
      `INSERT INTO questions (topic_id,seq,qtype,text,image_url,explanation,points,is_active)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8)`
    ).bind(topicId, int(body.seq, 0) || int(m.m, 0) + 1, qtype, text, image_url, explanation, points, is_active).run();
    id = r.meta.last_row_id;
  }

  if (qtype === 'single') {
    const stmts = choices.filter(c => str(c.text, 1000)).map((c, i) =>
      db.prepare('INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES (?1,?2,?3,?4,?5)')
        .bind(id, str(c.label, 10) || String.fromCharCode(65 + i), str(c.text, 1000), bool01(c.is_correct), i));
    if (stmts.length) await db.batch(stmts);
  }

  await audit(db, admin.id, qid ? 'question_update' : 'question_create', id);
  return ok({ id }, qid ? 200 : 201);
}

/* ── พนักงาน ── */
async function adminEmployees({ db, method, body, url }, admin, id) {
  if (method === 'GET' && !id) {
    const q = str(url.searchParams.get('q'), 60);
    const filter = q
      ? `WHERE (e.emp_code LIKE ?1 OR e.first_name LIKE ?1 OR e.last_name LIKE ?1 OR e.position LIKE ?1)`
      : '';
    const { results } = await db.prepare(
      `SELECT e.*,
              (SELECT COUNT(*) FROM attempts a WHERE a.employee_id = e.id AND a.status <> 'in_progress') AS attempts,
              (SELECT ROUND(AVG(a.percent),1) FROM attempts a WHERE a.employee_id = e.id AND a.percent IS NOT NULL) AS avg_percent,
              (SELECT COUNT(*) FROM attempts a WHERE a.employee_id = e.id AND a.needs_review = 1) AS pending
         FROM employees e
         ${filter}
        ORDER BY e.id DESC LIMIT 500`
    ).bind(...(q ? [`%${q}%`] : [])).all();
    return ok({ employees: results });
  }

  const eid = int(id, 0);
  if (!eid) return null;

  if (method === 'PUT') {
    const cur = await db.prepare('SELECT * FROM employees WHERE id = ?1').bind(eid).first();
    if (!cur) return fail('ไม่พบพนักงานคนนี้', 404);
    const code = str(body.emp_code, 40) || cur.emp_code;
    if (code !== cur.emp_code) {
      const dup = await db.prepare('SELECT id FROM employees WHERE emp_code = ?1 AND id <> ?2').bind(code, eid).first();
      if (dup) return fail('รหัสพนักงานนี้มีอยู่แล้ว', 409, { field: 'emp_code' });
    }
    await db.prepare(
      `UPDATE employees SET emp_code=?2, first_name=?3, last_name=?4, position=?5, department=?6, is_active=?7 WHERE id=?1`
    ).bind(eid, code, str(body.first_name, 80) || cur.first_name, str(body.last_name, 80) || cur.last_name,
      str(body.position, 120) || cur.position, str(body.department, 120) || null, bool01(body.is_active)).run();
    await audit(db, admin.id, 'employee_update', code);
    return ok({ ok: true });
  }

  if (method === 'DELETE') {
    const e = await db.prepare('SELECT emp_code FROM employees WHERE id = ?1').bind(eid).first();
    if (!e) return fail('ไม่พบพนักงานคนนี้', 404);
    await db.prepare('DELETE FROM employees WHERE id = ?1').bind(eid).run();
    await audit(db, admin.id, 'employee_delete', e.emp_code);
    return ok({ ok: true });
  }
  return null;
}

/* ── ผลสอบ / การตรวจให้คะแนน ── */
async function adminAttempts({ db, method, body, url }, admin, id, sub) {
  if (method === 'GET' && !id) {
    const topic = int(url.searchParams.get('topic'), 0);
    const grade = str(url.searchParams.get('grade'), 2);
    const pending = url.searchParams.get('pending') === '1';
    const q = str(url.searchParams.get('q'), 60);

    const where = ["a.status <> 'in_progress'"];
    const binds = [];
    if (topic) { binds.push(topic); where.push(`a.topic_id = ?${binds.length}`); }
    if (grade && 'ABC'.includes(grade)) { binds.push(grade); where.push(`a.grade = ?${binds.length}`); }
    if (pending) where.push('a.needs_review = 1');
    if (q) {
      binds.push(`%${q}%`);
      where.push(`(e.emp_code LIKE ?${binds.length} OR e.first_name LIKE ?${binds.length} OR e.last_name LIKE ?${binds.length})`);
    }

    const { results } = await db.prepare(
      `SELECT a.id, a.status, a.needs_review, a.submitted_at, a.duration_sec,
              a.quiz_score, a.quiz_max, a.practical_score, a.practical_max,
              a.total_score, a.total_max, a.percent, a.grade,
              e.id AS employee_id, e.emp_code, e.first_name, e.last_name, e.position, e.department,
              t.id AS topic_id, t.code AS topic_code, t.title AS topic_title
         FROM attempts a
         JOIN employees e ON e.id = a.employee_id
         JOIN topics t ON t.id = a.topic_id
        WHERE ${where.join(' AND ')}
        ORDER BY a.id DESC LIMIT 500`
    ).bind(...binds).all();
    return ok({ attempts: results });
  }

  const aid = int(id, 0);
  if (!aid) return null;

  if (method === 'GET') {
    const a = await db.prepare(
      `SELECT a.*, e.emp_code, e.first_name, e.last_name, e.position, e.department,
              t.code AS topic_code, t.title AS topic_title
         FROM attempts a JOIN employees e ON e.id = a.employee_id JOIN topics t ON t.id = a.topic_id
        WHERE a.id = ?1`
    ).bind(aid).first();
    if (!a) return fail('ไม่พบผลสอบนี้', 404);

    const { results: answers } = await db.prepare(
      `SELECT aa.*, q.seq, q.qtype, q.text AS question_text, q.image_url, q.explanation,
              c.label AS chosen_label, c.text AS chosen_text,
              (SELECT c2.label FROM choices c2 WHERE c2.question_id = q.id AND c2.is_correct = 1 LIMIT 1) AS correct_label,
              (SELECT c2.text  FROM choices c2 WHERE c2.question_id = q.id AND c2.is_correct = 1 LIMIT 1) AS correct_text
         FROM attempt_answers aa
         JOIN questions q ON q.id = aa.question_id
         LEFT JOIN choices c ON c.id = aa.choice_id
        WHERE aa.attempt_id = ?1 ORDER BY q.seq, q.id`
    ).bind(aid).all();
    return ok({ attempt: a, answers });
  }

  /* บันทึกผลการตรวจ: คะแนนอัตนัย + คะแนนภาคปฏิบัติ */
  if (method === 'POST' && sub === 'review') {
    const a = await db.prepare('SELECT * FROM attempts WHERE id = ?1').bind(aid).first();
    if (!a) return fail('ไม่พบผลสอบนี้', 404);

    const scores = (body.text_scores && typeof body.text_scores === 'object') ? body.text_scores : {};
    const stmts = [];
    for (const [qidRaw, valRaw] of Object.entries(scores)) {
      const qid = int(qidRaw, 0);
      if (!qid) continue;
      const row = await db.prepare(
        'SELECT points_max FROM attempt_answers WHERE attempt_id = ?1 AND question_id = ?2'
      ).bind(aid, qid).first();
      if (!row) continue;
      const pMax = num(row.points_max, 1);
      const earned = Math.min(pMax, Math.max(0, num(valRaw, 0)));
      stmts.push(db.prepare(
        'UPDATE attempt_answers SET points_earned = ?3, is_correct = ?4 WHERE attempt_id = ?1 AND question_id = ?2'
      ).bind(aid, qid, earned, earned >= pMax ? 1 : 0));
    }

    const pracMax = num(a.practical_max, 0);
    let pracScore = a.practical_score;
    if (pracMax > 0 && body.practical_score !== undefined && body.practical_score !== null && body.practical_score !== '') {
      pracScore = Math.min(pracMax, Math.max(0, num(body.practical_score, 0)));
    }

    stmts.push(db.prepare(
      `UPDATE attempts SET practical_score = ?2, review_note = ?3, attachment = ?4,
              reviewer_id = ?5, reviewed_at = datetime('now') WHERE id = ?1`
    ).bind(aid, pracScore, str(body.review_note, 2000) || null, str(body.attachment, 500) || null, admin.id));

    await db.batch(stmts);
    const s = await getSettings(db);
    const updated = await recomputeAttempt(db, aid, s);
    await audit(db, admin.id, 'attempt_review', aid);
    return ok({ attempt: updated });
  }

  if (method === 'DELETE') {
    await db.prepare('DELETE FROM attempts WHERE id = ?1').bind(aid).run();
    await audit(db, admin.id, 'attempt_delete', aid);
    return ok({ ok: true });
  }
  return null;
}

/* ── ตั้งค่าระบบ ── */
async function adminSettings({ db, method, body }, admin) {
  if (method === 'GET') return ok({ settings: await getSettings(db) });

  if (method === 'PUT') {
    const allowed = ['site_title', 'site_subtitle', 'grade_a_min', 'grade_b_min',
      'allow_retake', 'show_answers', 'show_leaderboard', 'registration_open'];
    const stmts = [];
    for (const key of allowed) {
      if (!(key in body)) continue;
      let value = String(body[key]);
      if (key === 'grade_a_min' || key === 'grade_b_min') value = String(Math.min(100, Math.max(0, num(value, 0))));
      if (['allow_retake', 'show_answers', 'show_leaderboard', 'registration_open'].includes(key)) value = String(bool01(body[key]));
      stmts.push(db.prepare(
        `INSERT INTO settings (key,value) VALUES (?1,?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      ).bind(key, value.slice(0, 500)));
    }
    if (stmts.length) await db.batch(stmts);

    // ถ้าเกณฑ์เกรดเปลี่ยน ให้คำนวณเกรดของผลสอบเดิมใหม่ทั้งหมด
    if ('grade_a_min' in body || 'grade_b_min' in body) {
      const s = await getSettings(db);
      await db.prepare(
        `UPDATE attempts SET grade = CASE
            WHEN percent >= ?1 THEN 'A' WHEN percent >= ?2 THEN 'B' ELSE 'C' END
          WHERE percent IS NOT NULL`
      ).bind(num(s.grade_a_min, 100), num(s.grade_b_min, 70)).run();
    }

    await audit(db, admin.id, 'settings_update', Object.keys(body).join(','));
    return ok({ settings: await getSettings(db) });
  }
  return null;
}

/* ── บัญชีผู้ดูแล ── */
async function adminAccounts({ db, method, body }, admin, id) {
  if (method === 'GET' && !id) {
    const { results } = await db.prepare(
      'SELECT id, username, display_name, is_active, created_at, last_login_at FROM admins ORDER BY id'
    ).all();
    return ok({ admins: results });
  }

  if (method === 'POST' && !id) {
    const username = str(body.username, 60).toLowerCase();
    const password = String(body.password || '');
    if (!/^[a-z0-9._-]{3,60}$/.test(username)) return fail('ชื่อผู้ใช้ใช้ได้เฉพาะ a-z 0-9 . _ - ความยาว 3-60 ตัว', 422, { field: 'username' });
    if (password.length < 8) return fail('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร', 422, { field: 'password' });
    const dup = await db.prepare('SELECT id FROM admins WHERE username = ?1').bind(username).first();
    if (dup) return fail('ชื่อผู้ใช้นี้มีอยู่แล้ว', 409, { field: 'username' });

    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const iter = 150000;
    const hash = await pbkdf2(password, salt, iter);
    const r = await db.prepare(
      'INSERT INTO admins (username, display_name, pw_hash, pw_salt, pw_iter) VALUES (?1,?2,?3,?4,?5)'
    ).bind(username, str(body.display_name, 100) || username, hash, salt, iter).run();
    await audit(db, admin.id, 'admin_create', username);
    return ok({ id: r.meta.last_row_id }, 201);
  }

  const targetId = int(id, 0);
  if (!targetId) return null;

  /* เปลี่ยนรหัสผ่าน */
  if (method === 'PUT') {
    const password = String(body.password || '');
    if (password.length < 8) return fail('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร', 422, { field: 'password' });
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const iter = 150000;
    const hash = await pbkdf2(password, salt, iter);
    await db.prepare('UPDATE admins SET pw_hash=?2, pw_salt=?3, pw_iter=?4 WHERE id=?1')
      .bind(targetId, hash, salt, iter).run();
    // ออกจากระบบทุกอุปกรณ์ของบัญชีนั้น
    await db.prepare("DELETE FROM sessions WHERE kind = 'admin' AND subject_id = ?1").bind(targetId).run();
    await audit(db, admin.id, 'admin_password_change', targetId);
    return ok({ ok: true });
  }

  if (method === 'DELETE') {
    if (targetId === admin.id) return fail('ไม่สามารถลบบัญชีของตัวเองได้', 409);
    const n = await db.prepare('SELECT COUNT(*) AS n FROM admins WHERE is_active = 1').first();
    if (int(n.n, 0) <= 1) return fail('ต้องมีผู้ดูแลอย่างน้อย 1 บัญชี', 409);
    await db.prepare('DELETE FROM admins WHERE id = ?1').bind(targetId).run();
    await db.prepare("DELETE FROM sessions WHERE kind = 'admin' AND subject_id = ?1").bind(targetId).run();
    await audit(db, admin.id, 'admin_delete', targetId);
    return ok({ ok: true });
  }
  return null;
}

/* ── ส่งออกผลสอบเป็น CSV ── */
async function adminExport(db, url) {
  const topic = int(url.searchParams.get('topic'), 0);
  const binds = [];
  let where = "a.status <> 'in_progress'";
  if (topic) { binds.push(topic); where += ` AND a.topic_id = ?1`; }

  const { results } = await db.prepare(
    `SELECT e.emp_code, e.first_name, e.last_name, e.position, e.department,
            t.code AS topic_code, t.title AS topic_title,
            a.quiz_score, a.quiz_max, a.practical_score, a.practical_max,
            a.total_score, a.total_max, a.percent, a.grade, a.status,
            a.submitted_at, a.duration_sec, a.review_note
       FROM attempts a JOIN employees e ON e.id = a.employee_id JOIN topics t ON t.id = a.topic_id
      WHERE ${where} ORDER BY a.id DESC`
  ).bind(...binds).all();

  const head = ['รหัสพนักงาน', 'ชื่อ', 'นามสกุล', 'ตำแหน่ง', 'แผนก', 'รหัสหัวข้อ', 'หัวข้อสอบ',
    'คะแนนข้อสอบ', 'เต็ม', 'คะแนนปฏิบัติ', 'เต็ม', 'คะแนนรวม', 'เต็ม', 'เปอร์เซ็นต์', 'เกรด',
    'สถานะ', 'วันที่ส่ง', 'เวลาที่ใช้ (วินาที)', 'หมายเหตุ'];

  const esc = v => {
    const s = (v === null || v === undefined) ? '' : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [head.join(',')];
  for (const r of results) lines.push(Object.values(r).map(esc).join(','));

  // BOM เพื่อให้ Excel อ่านภาษาไทยได้ถูกต้อง
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="wesco-assessment-${new Date().toISOString().slice(0, 10)}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
