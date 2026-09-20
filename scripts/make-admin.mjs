#!/usr/bin/env node
/**
 * สร้าง SQL สำหรับเพิ่มผู้ดูแลระบบ หรือรีเซ็ตรหัสผ่าน (ใช้ตอนลืมรหัสผ่าน)
 *
 *   node scripts/make-admin.mjs --user admin --pass "รหัสผ่านที่ต้องการ"
 *
 * แล้วนำ SQL ที่ได้ไปรันกับฐานข้อมูล:
 *   npx wrangler d1 execute wesco_assessment --remote --command "<SQL ที่ได้>"
 *
 * หมายเหตุ: ปกติควรสร้างบัญชีแรกผ่านหน้าเว็บ /admin.html ซึ่งจะแสดงฟอร์ม
 * "ตั้งค่าระบบครั้งแรก" ให้อัตโนมัติเมื่อยังไม่มีผู้ดูแลในระบบ
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const args = process.argv.slice(2);
const arg = name => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : undefined;
};

const username = (arg('user') || '').toLowerCase().trim();
const password = arg('pass') || '';
const display = arg('name') || username;

if (!/^[a-z0-9._-]{3,60}$/.test(username) || password.length < 8) {
  console.error(`
วิธีใช้:  node scripts/make-admin.mjs --user <ชื่อผู้ใช้> --pass <รหัสผ่าน> [--name "ชื่อที่แสดง"]

  --user   a-z 0-9 . _ -  ความยาว 3-60 ตัว
  --pass   อย่างน้อย 8 ตัวอักษร
`);
  process.exit(1);
}

const ITER = 150000;
const salt = randomBytes(16).toString('hex');
const hash = pbkdf2Sync(password, Buffer.from(salt, 'hex'), ITER, 32, 'sha256').toString('hex');
const q = s => `'${String(s).replace(/'/g, "''")}'`;

const sql =
  `INSERT INTO admins (username, display_name, pw_hash, pw_salt, pw_iter) ` +
  `VALUES (${q(username)}, ${q(display)}, ${q(hash)}, ${q(salt)}, ${ITER}) ` +
  `ON CONFLICT(username) DO UPDATE SET pw_hash = excluded.pw_hash, pw_salt = excluded.pw_salt, ` +
  `pw_iter = excluded.pw_iter, display_name = excluded.display_name, is_active = 1;`;

console.log(`
สร้าง SQL สำเร็จ — รหัสผ่านถูกแปลงเป็น PBKDF2-SHA256 (${ITER.toLocaleString()} รอบ) แล้ว
ไม่มีการเก็บรหัสผ่านจริงลงฐานข้อมูล

รันคำสั่งนี้เพื่อบันทึกลงฐานข้อมูลจริง:

npx wrangler d1 execute wesco_assessment --remote --command "${sql.replace(/"/g, '\\"')}"

หรือกับฐานข้อมูลบนเครื่อง (สำหรับทดสอบ):

npx wrangler d1 execute wesco_assessment --local --command "${sql.replace(/"/g, '\\"')}"
`);
