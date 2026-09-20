/* ═══════════════════════════════════════════════════════════════
   WESCO Assessment — ระบบหลังบ้าน (Admin Console)
   ═══════════════════════════════════════════════════════════════ */
import {
  $, $$, el, esc, clear, icon, store, makeApi, toast, modal, confirmDialog, lightbox,
  fmtDate, fmtDuration, fmtNum, gradeBadge, gradeLabel, initTheme, themeButton,
  emptyState, note, field, switchField, withLoading, debounce, downloadBlob,
} from './core.js';

const api = makeApi('wesco-admin-token');
const view = $('#view');
const actions = $('#topbarActions');
const sidebar = $('#sidebar');
const sidenav = $('#sidenav');
const bottomnav = $('#bottomnav');
const layout = $('.admin-layout');

/** ซ่อน/แสดงเมนู และให้เนื้อหาใช้ความกว้างเต็มเมื่อยังไม่ล็อกอิน */
const setChrome = on => {
  sidebar.hidden = !on;
  bottomnav.hidden = !on;
  layout.classList.toggle('is-plain', !on);
};

const PAGES = [
  { id: 'dash', label: 'ภาพรวม', icon: 'chart' },
  { id: 'topics', label: 'ข้อสอบ', icon: 'book' },
  { id: 'results', label: 'ผลสอบ', icon: 'clipboard' },
  { id: 'employees', label: 'พนักงาน', icon: 'users' },
  { id: 'settings', label: 'ตั้งค่า', icon: 'settings' },
];

const state = { admin: null, page: 'dash' };

initTheme();
window.addEventListener('hashchange', () => { state.page = pageFromHash(); render(); });
boot();

const pageFromHash = () => {
  const id = location.hash.replace(/^#\/?/, '').split('/')[0];
  return PAGES.some(p => p.id === id) ? id : 'dash';
};

async function boot() {
  view.append(el('div', { class: 'skel skel-card', style: 'height:200px' }));
  let cfg;
  try { cfg = await api('/config'); }
  catch (e) {
    clear(view).append(note('dang',
      `เชื่อมต่อระบบไม่ได้: ${esc(e.message)}<br><span class="small">ตรวจสอบว่าผูกฐานข้อมูล D1 (binding <code>DB</code>) และรัน <code>db/schema.sql</code> แล้ว</span>`));
    return;
  }

  if (cfg.needs_bootstrap) return viewBootstrap();

  if (api.token.get()) {
    try { state.admin = (await api('/admin/me')).admin; }
    catch { api.token.clear(); }
  }
  state.page = pageFromHash();
  render();
}

/* ═══════════════════ ตั้งค่าผู้ดูแลคนแรก ═══════════════════ */
function viewBootstrap() {
  clear(actions).append(themeButton());
  const host = el('div', { class: 'shell-narrow', style: 'margin-inline:auto' });

  const fUser = field({ label: 'ชื่อผู้ใช้', name: 'username', required: true, placeholder: 'admin', autocomplete: 'username', help: 'a-z 0-9 . _ - อย่างน้อย 3 ตัว' });
  const fName = field({ label: 'ชื่อที่แสดง', name: 'display_name', placeholder: 'ผู้ดูแลระบบ' });
  const fPass = field({ label: 'รหัสผ่าน', name: 'password', type: 'password', required: true, autocomplete: 'new-password', help: 'อย่างน้อย 8 ตัวอักษร ควรผสมตัวเลขและตัวอักษร' });
  const fPass2 = field({ label: 'ยืนยันรหัสผ่าน', name: 'password2', type: 'password', required: true, autocomplete: 'new-password' });

  const submit = el('button', { class: 'btn btn-primary btn-lg btn-block', type: 'submit' }, [icon('shield'), 'สร้างบัญชีผู้ดูแล']);
  const form = el('form', { class: 'stack', novalidate: true }, [fUser, fName, fPass, fPass2, submit]);

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    [fUser, fPass, fPass2].forEach(f => f.setError(''));
    if (!fUser.input.value.trim()) return fUser.setError('กรุณากรอกชื่อผู้ใช้');
    if (fPass.input.value.length < 8) return fPass.setError('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร');
    if (fPass.input.value !== fPass2.input.value) return fPass2.setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');

    await withLoading(submit, async () => {
      try {
        const r = await api('/admin/bootstrap', {
          method: 'POST',
          body: { username: fUser.input.value.trim(), display_name: fName.input.value.trim(), password: fPass.input.value },
        });
        api.token.set(r.token);
        state.admin = r.admin;
        toast('สร้างบัญชีผู้ดูแลเรียบร้อย', 'ok');
        state.page = 'dash';
        render();
      } catch (e) {
        const f = { username: fUser, password: fPass }[e.data?.field];
        (f ? f.setError.bind(f) : m => toast(m, 'err'))(e.message);
      }
    });
  });

  host.append(
    el('div', { class: 'stack', style: 'text-align:center;padding:24px 0 8px' }, [
      el('img', { src: '/assets/logo-mark.svg', alt: 'Wesco', style: 'height:44px;width:auto;margin-inline:auto' }),
      el('h1', { style: 'font-size:1.25rem;margin-top:4px', text: 'ตั้งค่าระบบครั้งแรก' }),
      el('p', { class: 'muted small', style: 'max-width:42ch;margin-inline:auto', text: 'ยังไม่มีบัญชีผู้ดูแลในระบบ กรุณาสร้างบัญชีแรกเพื่อเริ่มใช้งาน' }),
    ]),
    el('div', { class: 'card card-pad card-accent', style: 'margin-top:16px' }, [form]),
    note('warn', 'หน้านี้จะใช้ได้เพียงครั้งเดียว เมื่อสร้างบัญชีแรกแล้วระบบจะปิดการเข้าถึงโดยอัตโนมัติ'),
  );
  clear(view).append(host);
  setChrome(false);
}

/* ═══════════════════ เข้าสู่ระบบ ═══════════════════ */
function viewLogin() {
  clear(actions).append(themeButton());
  setChrome(false);

  const fUser = field({ label: 'ชื่อผู้ใช้', name: 'username', required: true, autocomplete: 'username' });
  const fPass = field({ label: 'รหัสผ่าน', name: 'password', type: 'password', required: true, autocomplete: 'current-password' });
  const submit = el('button', { class: 'btn btn-primary btn-lg btn-block', type: 'submit' }, [icon('lock'), 'เข้าสู่ระบบ']);
  const form = el('form', { class: 'stack', novalidate: true }, [fUser, fPass, submit]);

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    [fUser, fPass].forEach(f => f.setError(''));
    if (!fUser.input.value.trim()) return fUser.setError('กรุณากรอกชื่อผู้ใช้');
    if (!fPass.input.value) return fPass.setError('กรุณากรอกรหัสผ่าน');

    await withLoading(submit, async () => {
      try {
        const r = await api('/admin/login', {
          method: 'POST', body: { username: fUser.input.value.trim(), password: fPass.input.value },
        });
        api.token.set(r.token);
        state.admin = r.admin;
        toast(`ยินดีต้อนรับ ${r.admin.display_name || r.admin.username}`, 'ok');
        render();
      } catch (e) { toast(e.message, 'err'); fPass.input.value = ''; fPass.input.focus(); }
    });
  });

  clear(view).append(el('div', { class: 'shell-narrow', style: 'margin-inline:auto' }, [
    el('div', { class: 'stack', style: 'text-align:center;padding:24px 0 8px' }, [
      el('img', { src: '/assets/logo-mark.svg', alt: 'Wesco', style: 'height:44px;width:auto;margin-inline:auto' }),
      el('h1', { style: 'font-size:1.25rem;margin-top:4px', text: 'เข้าสู่ระบบหลังบ้าน' }),
    ]),
    el('div', { class: 'card card-pad card-accent', style: 'margin-top:16px' }, [form]),
    el('p', { class: 'small muted', style: 'text-align:center;margin-top:20px' },
      [el('a', { href: '/', text: '← กลับหน้าทำข้อสอบ' })]),
  ]));
}

/* ═══════════════════ router ═══════════════════ */
function render() {
  if (!state.admin) return viewLogin();

  clear(actions).append(
    el('span', { class: 'badge badge-info nowrap', text: state.admin.display_name || state.admin.username }),
    themeButton(),
    el('button', {
      class: 'btn btn-ghost btn-icon btn-sm', type: 'button', 'aria-label': 'ออกจากระบบ', title: 'ออกจากระบบ',
      onclick: () => confirmDialog({
        title: 'ออกจากระบบ', message: 'ต้องการออกจากระบบหลังบ้านใช่หรือไม่?', confirmLabel: 'ออกจากระบบ',
        onConfirm: async () => {
          try { await api('/admin/logout', { method: 'POST' }); } catch { }
          api.token.clear(); state.admin = null; render();
        },
      }),
    }, [icon('logout')]),
  );

  paintNav();
  ({ dash: viewDash, topics: viewTopics, results: viewResults, employees: viewEmployees, settings: viewSettings })[state.page]();
}

function paintNav() {
  setChrome(true);
  clear(sidenav); clear(bottomnav);
  for (const p of PAGES) {
    const current = state.page === p.id;
    sidenav.append(el('button', {
      type: 'button', 'aria-current': current ? 'page' : null, onclick: () => nav(p.id),
    }, [icon(p.icon), p.label]));
    bottomnav.append(el('button', {
      type: 'button', 'aria-current': current ? 'page' : null, onclick: () => nav(p.id),
    }, [icon(p.icon), el('span', { text: p.label })]));
  }
}

const nav = id => { location.hash = `#/${id}`; };
const setView = node => { clear(view).append(node); window.scrollTo({ top: 0, behavior: 'instant' }); };
const loading = (h = 180) => el('div', { class: 'skel skel-card', style: `height:${h}px` });

function pageHead(title, subtitle, extra) {
  return el('div', { class: 'row-between wrap', style: 'margin-bottom:20px;gap:12px' }, [
    el('div', { class: 'stack-2' }, [
      el('h1', { style: 'font-size:1.375rem', text: title }),
      subtitle ? el('p', { class: 'small muted', text: subtitle }) : null,
    ]),
    extra || null,
  ]);
}

/* ═══════════════════ 1 · ภาพรวม ═══════════════════ */
async function viewDash() {
  const host = el('div', {});
  host.append(pageHead('ภาพรวมระบบ', 'สรุปการใช้งานและผลการสอบทั้งหมด'), loading(220));
  setView(host);

  let d;
  try { d = await api('/admin/stats'); }
  catch (e) { clear(host).append(pageHead('ภาพรวมระบบ'), note('dang', esc(e.message))); return; }

  const t = d.totals;
  const gA = d.grades.A || 0, gB = d.grades.B || 0, gC = d.grades.C || 0;
  const gTotal = gA + gB + gC || 1;

  clear(host).append(
    pageHead('ภาพรวมระบบ', 'สรุปการใช้งานและผลการสอบทั้งหมด',
      t.pending > 0
        ? el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => { location.hash = '#/results'; state.page = 'results'; render(); setTimeout(() => toast(`มี ${t.pending} รายการรอตรวจ`), 300); } },
          [icon('clock', 'ic-sm'), `รอตรวจ ${t.pending} รายการ`])
        : null),

    el('div', { class: 'stat-grid', style: 'margin-bottom:20px' }, [
      stat('users', 'พนักงานที่ลงทะเบียน', t.employees),
      stat('book', 'หัวข้อสอบ', t.topics, `${t.questions} ข้อ`),
      stat('clipboard', 'การสอบทั้งหมด', t.attempts),
      stat('target', 'คะแนนเฉลี่ย', t.avg_percent === null ? '—' : `${fmtNum(t.avg_percent)}%`),
    ]),

    el('div', { class: 'card card-pad', style: 'margin-bottom:20px' }, [
      el('div', { class: 'row-between', style: 'margin-bottom:12px' }, [
        el('h2', { style: 'font-size:1rem', text: 'สัดส่วนเกรด' }),
        el('span', { class: 'small muted num', text: `${gA + gB + gC} รายการ` }),
      ]),
      el('div', { class: 'gradebar', role: 'img', 'aria-label': `เกรด A ${gA}, B ${gB}, C ${gC}` }, [
        el('i', { class: 'gb-A', style: `width:${(gA / gTotal) * 100}%` }),
        el('i', { class: 'gb-B', style: `width:${(gB / gTotal) * 100}%` }),
        el('i', { class: 'gb-C', style: `width:${(gC / gTotal) * 100}%` }),
      ]),
      el('div', { class: 'row wrap', style: 'gap:16px;margin-top:12px' }, [
        legend('A', gA, gTotal), legend('B', gB, gTotal), legend('C', gC, gTotal),
      ]),
    ]),

    el('div', { class: 'card', style: 'margin-bottom:20px' }, [
      el('div', { class: 'card-head' }, [el('h2', { text: 'ผลสอบแยกตามหัวข้อ' })]),
      el('div', { class: 'table-wrap' }, [
        el('table', { class: 'table' }, [
          el('thead', {}, [el('tr', {}, ['หัวข้อ', 'จำนวนครั้ง', 'เฉลี่ย', 'A', 'B', 'C'].map((h, i) =>
            el('th', { class: i > 0 ? 'num' : '', text: h })))]),
          el('tbody', {}, d.by_topic.map(r => el('tr', {}, [
            el('td', {}, [el('div', { class: 'strong small', text: r.title }), el('div', { class: 'small muted', text: r.code })]),
            el('td', { class: 'num', text: String(r.attempts || 0) }),
            el('td', { class: 'num', text: r.avg_percent === null ? '—' : `${fmtNum(r.avg_percent)}%` }),
            el('td', { class: 'num text-ok', text: String(r.a || 0) }),
            el('td', { class: 'num', text: String(r.b || 0) }),
            el('td', { class: 'num text-dang', text: String(r.c || 0) }),
          ]))),
        ]),
      ]),
    ]),

    el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('h2', { text: 'การสอบล่าสุด' })]),
      d.recent.length
        ? el('div', {}, d.recent.map(r => el('button', {
          class: 'list-row', type: 'button',
          style: 'width:100%;text-align:start;background:none;border:0;border-bottom:1px solid var(--border);cursor:pointer',
          onclick: () => openReview(r.id),
        }, [
          r.needs_review ? el('span', { class: 'grade grade-pending', text: '…' }) : gradeBadge(r.grade),
          el('div', { class: 'stack-2 grow', style: 'min-width:0' }, [
            el('div', { class: 'strong small', text: `${r.first_name} ${r.last_name}` }),
            el('div', { class: 'small muted', style: 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis', text: `${r.emp_code} · ${r.topic_title}` }),
          ]),
          el('div', { class: 'small muted num nowrap', text: r.percent === null ? 'รอตรวจ' : `${fmtNum(r.percent)}%` }),
        ])))
        : emptyState('clipboard', 'ยังไม่มีการสอบ', 'เมื่อพนักงานเริ่มทำแบบทดสอบ ผลจะแสดงที่นี่'),
    ]),
  );

  function stat(ic, label, value, sub) {
    return el('div', { class: 'stat' }, [
      el('div', { class: 'stat-label' }, [icon(ic, 'ic-sm'), label]),
      el('div', { class: 'stat-value num', text: String(value ?? 0) }),
      sub ? el('div', { class: 'stat-note', text: sub }) : null,
    ]);
  }
  function legend(g, n, total) {
    return el('span', { class: 'row', style: 'gap:6px' }, [
      gradeBadge(g),
      el('span', { class: 'small muted num', text: `${n} (${Math.round((n / total) * 100)}%)` }),
    ]);
  }
}

/* ═══════════════════ 2 · ข้อสอบ ═══════════════════ */
async function viewTopics() {
  const host = el('div', {});
  host.append(pageHead('จัดการข้อสอบ', 'เพิ่ม แก้ไข หรือลบหัวข้อและคำถาม',
    el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => editTopic(null) }, [icon('plus', 'ic-sm'), 'เพิ่มหัวข้อ'])), loading());
  setView(host);

  let d;
  try { d = await api('/admin/topics'); }
  catch (e) { clear(host).append(note('dang', esc(e.message))); return; }

  const list = el('div', { class: 'stack' });
  if (!d.topics.length) {
    list.append(emptyState('book', 'ยังไม่มีหัวข้อสอบ', 'เริ่มต้นด้วยการเพิ่มหัวข้อแรก',
      el('button', { class: 'btn btn-primary', type: 'button', onclick: () => editTopic(null) }, ['เพิ่มหัวข้อ'])));
  }

  for (const t of d.topics) {
    list.append(el('div', { class: 'card card-accent' }, [
      el('div', { class: 'card-body' }, [
        el('div', { class: 'row-between wrap', style: 'gap:12px' }, [
          el('div', { class: 'stack-2 grow', style: 'min-width:200px' }, [
            el('div', { class: 'row wrap', style: 'gap:8px' }, [
              el('span', { class: 'topic-code', text: t.code }),
              t.is_active ? null : el('span', { class: 'badge badge-warn', text: 'ปิดใช้งาน' }),
              t.category ? el('span', { class: 'badge', text: t.category }) : null,
            ]),
            el('h3', { text: t.title }),
            t.subtitle ? el('p', { class: 'small muted', text: t.subtitle }) : null,
            el('div', { class: 'topic-meta', style: 'margin-top:4px' }, [
              el('span', {}, [icon('book', 'ic-sm'), `${t.question_count} ข้อ`]),
              t.time_limit_min ? el('span', {}, [icon('clock', 'ic-sm'), `${t.time_limit_min} นาที`]) : null,
              t.practical_max > 0 ? el('span', {}, [icon('user', 'ic-sm'), `ปฏิบัติ ${fmtNum(t.practical_max)}`]) : null,
              el('span', {}, [icon('clipboard', 'ic-sm'), `สอบ ${t.attempt_count} ครั้ง`]),
              t.ref_count ? el('span', {}, [icon('file', 'ic-sm'), `เอกสาร ${t.ref_count}`]) : null,
            ]),
          ]),
          el('div', { class: 'row wrap', style: 'gap:6px;align-items:flex-start' }, [
            el('button', { class: 'btn btn-sm', type: 'button', onclick: () => manageQuestions(t) }, [icon('layers', 'ic-sm'), 'คำถาม']),
            el('button', { class: 'btn btn-sm', type: 'button', onclick: () => manageRefs(t) }, [icon('file', 'ic-sm'), 'เอกสาร']),
            el('button', { class: 'btn btn-sm btn-icon', type: 'button', 'aria-label': 'แก้ไขหัวข้อ', title: 'แก้ไขหัวข้อ', onclick: () => editTopic(t) }, [icon('edit', 'ic-sm')]),
            el('button', {
              class: 'btn btn-sm btn-icon btn-danger', type: 'button', 'aria-label': 'ลบหัวข้อ', title: 'ลบหัวข้อ',
              onclick: () => confirmDialog({
                title: 'ลบหัวข้อสอบ', danger: true, confirmLabel: 'ลบถาวร',
                message: `ลบ "${t.title}" พร้อมคำถาม ${t.question_count} ข้อ และผลสอบ ${t.attempt_count} ครั้ง — การลบนี้ย้อนกลับไม่ได้`,
                onConfirm: async () => {
                  await api(`/admin/topics/${t.id}`, { method: 'DELETE' });
                  toast('ลบหัวข้อแล้ว', 'ok'); viewTopics();
                },
              }),
            }, [icon('trash', 'ic-sm')]),
          ]),
        ]),
      ]),
    ]));
  }
  clear(host).append(pageHead('จัดการข้อสอบ', `ทั้งหมด ${d.topics.length} หัวข้อ`,
    el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => editTopic(null) }, [icon('plus', 'ic-sm'), 'เพิ่มหัวข้อ'])), list);
}

function editTopic(t) {
  const fCode = field({ label: 'รหัสหัวข้อ', name: 'code', required: true, value: t?.code || '', placeholder: 'TH-BP-000' });
  const fTitle = field({ label: 'ชื่อหัวข้อ', name: 'title', required: true, value: t?.title || '' });
  const fSub = field({ label: 'คำอธิบายสั้น', name: 'subtitle', value: t?.subtitle || '' });
  const fCat = field({ label: 'หมวดหมู่', name: 'category', value: t?.category || '', placeholder: 'เช่น ระบบคุณภาพ', help: 'ใช้จัดกลุ่มหัวข้อในหน้าเลือกสอบ' });
  const fTime = field({ label: 'เวลาทำข้อสอบ (นาที)', name: 'time_limit_min', type: 'number', min: 0, value: t?.time_limit_min ?? 0, help: 'ใส่ 0 หากไม่ต้องการจับเวลา' });
  const fPrac = field({ label: 'คะแนนภาคปฏิบัติ', name: 'practical_max', type: 'number', min: 0, step: '0.5', value: t?.practical_max ?? 0, help: 'คะแนนที่ผู้ดูแลกรอกให้ภายหลัง — ใส่ 0 หากไม่ใช้ (เกรดจะออกทันทีหลังส่ง)' });
  const sShuffle = switchField('สลับลำดับคำถาม', 'shuffle', t ? !!t.shuffle : true, 'ลำดับตัวเลือกจะคงเดิมเสมอ เพื่อไม่ให้ตัวเลือกแบบ "ถูกทุกข้อ" สลับที่');
  const sActive = switchField('เปิดให้สอบ', 'is_active', t ? !!t.is_active : true);

  const body = el('div', { class: 'stack' }, [fCode, fTitle, fSub, fCat, fTime, fPrac,
    el('hr', { class: 'divider' }), sShuffle, sActive]);

  modal({
    title: t ? 'แก้ไขหัวข้อสอบ' : 'เพิ่มหัวข้อสอบ',
    body,
    actions: [
      { label: 'ยกเลิก', class: 'btn-ghost' },
      {
        label: 'บันทึก', class: 'btn-primary', icon: 'save',
        onClick: async () => {
          [fCode, fTitle].forEach(f => f.setError(''));
          if (!fCode.input.value.trim()) { fCode.setError('กรุณากรอกรหัสหัวข้อ'); return false; }
          if (!fTitle.input.value.trim()) { fTitle.setError('กรุณากรอกชื่อหัวข้อ'); return false; }

          const payload = {
            code: fCode.input.value.trim(), title: fTitle.input.value.trim(),
            subtitle: fSub.input.value.trim(), category: fCat.input.value.trim(),
            time_limit_min: Number(fTime.input.value) || 0,
            practical_max: Number(fPrac.input.value) || 0,
            shuffle: sShuffle.input.checked, is_active: sActive.input.checked,
            sort_order: t?.sort_order,
          };
          try {
            await api(t ? `/admin/topics/${t.id}` : '/admin/topics', { method: t ? 'PUT' : 'POST', body: payload });
            toast(t ? 'บันทึกแล้ว' : 'เพิ่มหัวข้อแล้ว', 'ok');
            viewTopics();
          } catch (e) {
            const f = { code: fCode, title: fTitle }[e.data?.field];
            if (f) { f.setError(e.message); return false; }
            toast(e.message, 'err'); return false;
          }
        },
      },
    ],
  });
}

/* ── คำถามในหัวข้อ ── */
async function manageQuestions(topic) {
  const body = el('div', {}, [loading(120)]);
  const m = modal({ title: `คำถาม — ${topic.title}`, body, wide: true });

  const load = async () => {
    clear(body).append(loading(120));
    let d;
    try { d = await api(`/admin/topics/${topic.id}/questions`); }
    catch (e) { clear(body).append(note('dang', esc(e.message))); return; }

    clear(body).append(
      el('div', { class: 'row-between', style: 'margin-bottom:12px' }, [
        el('span', { class: 'small muted num', text: `${d.questions.length} ข้อ` }),
        el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => editQuestion(topic, null, load) }, [icon('plus', 'ic-sm'), 'เพิ่มคำถาม']),
      ]),
      d.questions.length
        ? el('div', { class: 'card' }, d.questions.map(q => el('div', { class: 'list-row' }, [
          el('span', { class: 'grade', style: 'width:26px;height:26px;font-size:.75rem;background:var(--surface-3);color:var(--text-2)', text: String(q.seq) }),
          el('div', { class: 'stack-2 grow', style: 'min-width:0' }, [
            el('div', { class: 'small strong', style: 'line-height:1.45', text: q.text }),
            el('div', { class: 'row wrap', style: 'gap:6px' }, [
              el('span', { class: 'badge', text: q.qtype === 'text' ? 'เขียนตอบ' : `ปรนัย ${q.choices.length} ตัวเลือก` }),
              el('span', { class: 'badge', text: `${fmtNum(q.points)} คะแนน` }),
              q.image_url ? el('span', { class: 'badge badge-info', text: 'มีรูป' }) : null,
              q.is_active ? null : el('span', { class: 'badge badge-warn', text: 'ปิด' }),
              q.qtype === 'single' && q.choices.find(c => c.is_correct)
                ? el('span', { class: 'badge badge-ok', text: `เฉลย ${q.choices.find(c => c.is_correct).label}` }) : null,
            ]),
          ]),
          el('div', { class: 'row', style: 'gap:4px;flex:none' }, [
            el('button', { class: 'btn btn-sm btn-icon btn-ghost', type: 'button', 'aria-label': 'แก้ไข', onclick: () => editQuestion(topic, q, load) }, [icon('edit', 'ic-sm')]),
            el('button', {
              class: 'btn btn-sm btn-icon btn-ghost', type: 'button', 'aria-label': 'ลบ',
              onclick: () => confirmDialog({
                title: 'ลบคำถาม', danger: true, confirmLabel: 'ลบ',
                message: 'ลบคำถามข้อนี้ถาวร? คำตอบที่เคยบันทึกไว้จะถูกลบไปด้วย',
                onConfirm: async () => { await api(`/admin/questions/${q.id}`, { method: 'DELETE' }); toast('ลบแล้ว', 'ok'); load(); },
              }),
            }, [icon('trash', 'ic-sm')]),
          ]),
        ])))
        : emptyState('layers', 'ยังไม่มีคำถาม', 'เพิ่มคำถามแรกของหัวข้อนี้'),
    );
  };
  load();
  m.close2 = m.close;
}

function editQuestion(topic, q, reload) {
  const isText = q?.qtype === 'text';
  const fText = field({ label: 'โจทย์คำถาม', name: 'text', required: true, textarea: true, rows: 3, value: q?.text || '' });
  const fType = field({
    label: 'ชนิดคำถาม', name: 'qtype', value: q?.qtype || 'single',
    options: [{ value: 'single', label: 'ปรนัย — เลือกคำตอบเดียว' }, { value: 'text', label: 'เขียนตอบ — ผู้ดูแลตรวจให้คะแนน' }],
  });
  const fSeq = field({ label: 'ลำดับข้อ', name: 'seq', type: 'number', min: 1, value: q?.seq ?? '' });
  const fPoints = field({ label: 'คะแนนเต็มของข้อนี้', name: 'points', type: 'number', min: 0.5, step: '0.5', value: q?.points ?? 1 });
  const fImg = field({ label: 'URL รูปประกอบ', name: 'image_url', value: q?.image_url || '', placeholder: '/assets/ref/ตัวอย่าง.png', help: 'ไม่บังคับ — ใส่ path ของไฟล์ในโฟลเดอร์ public หรือ URL เต็ม' });
  const fExp = field({ label: 'คำอธิบายเฉลย', name: 'explanation', textarea: true, rows: 2, value: q?.explanation || '', placeholder: 'ไม่บังคับ — แสดงให้ผู้สอบดูหลังส่งคำตอบ' });
  const sActive = switchField('เปิดใช้งานคำถามนี้', 'is_active', q ? !!q.is_active : true);

  /* ตัวเลือก */
  const choiceHost = el('div', { class: 'stack-2' });
  const rows = [];
  const addRow = (c, i) => {
    const label = el('input', { class: 'input', style: 'width:64px;text-align:center;flex:none', value: c?.label || String.fromCharCode(65 + i), 'aria-label': 'ตัวอักษรกำกับ' });
    const text = el('input', { class: 'input grow', value: c?.text || '', placeholder: `ตัวเลือกที่ ${i + 1}`, 'aria-label': `ข้อความตัวเลือกที่ ${i + 1}` });
    const radio = el('input', { type: 'radio', name: 'correct', style: 'width:22px;height:22px;flex:none;accent-color:var(--brand)', 'aria-label': 'ตั้งเป็นคำตอบที่ถูก' });
    radio.checked = !!c?.is_correct;
    const del = el('button', {
      class: 'btn btn-sm btn-icon btn-ghost', type: 'button', 'aria-label': 'ลบตัวเลือก',
      onclick: () => { const idx = rows.indexOf(row); if (idx > -1) rows.splice(idx, 1); row.node.remove(); },
    }, [icon('x', 'ic-sm')]);
    const node = el('div', { class: 'row', style: 'gap:6px' }, [radio, label, text, del]);
    const row = { node, label, text, radio };
    rows.push(row);
    choiceHost.append(node);
  };

  const choicesBlock = el('div', { class: 'stack-2' }, [
    el('div', { class: 'row-between' }, [
      el('span', { class: 'label', text: 'ตัวเลือก (เลือกวงกลมหน้าข้อที่เป็นคำตอบถูก)' }),
      el('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: () => addRow(null, rows.length) }, [icon('plus', 'ic-sm'), 'เพิ่ม']),
    ]),
    choiceHost,
  ]);

  (q?.choices?.length ? q.choices : [null, null, null, null]).forEach((c, i) => addRow(c, i));

  const toggleType = () => { choicesBlock.style.display = fType.input.value === 'text' ? 'none' : ''; };
  fType.input.addEventListener('change', toggleType);

  const body = el('div', { class: 'stack' }, [fText, fType, choicesBlock,
    el('div', { class: 'row', style: 'gap:12px' }, [fSeq, fPoints]),
    fImg, fExp, el('hr', { class: 'divider' }), sActive]);
  setTimeout(toggleType, 0);

  modal({
    title: q ? `แก้ไขคำถามข้อ ${q.seq}` : 'เพิ่มคำถาม',
    body, wide: true,
    actions: [
      { label: 'ยกเลิก', class: 'btn-ghost' },
      {
        label: 'บันทึก', class: 'btn-primary', icon: 'save',
        onClick: async () => {
          fText.setError('');
          if (!fText.input.value.trim()) { fText.setError('กรุณากรอกโจทย์คำถาม'); return false; }
          const qtype = fType.input.value;
          const choices = rows
            .filter(r => r.text.value.trim())
            .map(r => ({ label: r.label.value.trim(), text: r.text.value.trim(), is_correct: r.radio.checked }));

          if (qtype === 'single') {
            if (choices.length < 2) { toast('ต้องมีตัวเลือกอย่างน้อย 2 ข้อ', 'err'); return false; }
            if (!choices.some(c => c.is_correct)) { toast('กรุณาเลือกคำตอบที่ถูกต้อง', 'err'); return false; }
          }

          const payload = {
            text: fText.input.value.trim(), qtype, choices,
            seq: Number(fSeq.input.value) || undefined,
            points: Number(fPoints.input.value) || 1,
            image_url: fImg.input.value.trim(), explanation: fExp.input.value.trim(),
            is_active: sActive.input.checked,
          };
          try {
            await api(q ? `/admin/questions/${q.id}` : `/admin/topics/${topic.id}/questions`,
              { method: q ? 'PUT' : 'POST', body: payload });
            toast('บันทึกแล้ว', 'ok');
            reload();
          } catch (e) { toast(e.message, 'err'); return false; }
        },
      },
    ],
  });
}

/* ── เอกสารอ้างอิงของหัวข้อ ── */
async function manageRefs(topic) {
  const body = el('div', {}, [loading(120)]);
  modal({ title: `เอกสารอ้างอิง — ${topic.title}`, body, wide: true });

  const load = async () => {
    clear(body).append(loading(120));
    let d;
    try { d = await api(`/admin/topics/${topic.id}/refs`); }
    catch (e) { clear(body).append(note('dang', esc(e.message))); return; }

    const fTitle = field({ label: 'ชื่อเอกสาร', name: 'title', placeholder: 'เช่น Table 1 — Viewing Time & Distance' });
    const fImg = field({ label: 'URL รูปภาพ', name: 'image_url', placeholder: '/assets/ref/ตัวอย่าง.png' });
    const fHtml = field({ label: 'หรือเนื้อหา HTML (เช่น ตาราง)', name: 'html', textarea: true, rows: 3, placeholder: '<table>…</table>' });
    const addBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button' }, [icon('plus', 'ic-sm'), 'เพิ่มเอกสาร']);

    addBtn.addEventListener('click', () => withLoading(addBtn, async () => {
      if (!fTitle.input.value.trim()) return fTitle.setError('กรุณากรอกชื่อเอกสาร');
      if (!fImg.input.value.trim() && !fHtml.input.value.trim()) return toast('ต้องใส่ URL รูป หรือเนื้อหา HTML', 'err');
      try {
        await api(`/admin/topics/${topic.id}/refs`, {
          method: 'POST',
          body: { title: fTitle.input.value.trim(), image_url: fImg.input.value.trim(), html: fHtml.input.value.trim() },
        });
        toast('เพิ่มเอกสารแล้ว', 'ok'); load();
      } catch (e) { toast(e.message, 'err'); }
    }));

    clear(body).append(
      note('info', 'เอกสารอ้างอิงจะมีปุ่มให้ผู้สอบกดเปิดดูได้ตลอดเวลาระหว่างทำข้อสอบ'),
      d.refs.length
        ? el('div', { class: 'card', style: 'margin-block:12px' }, d.refs.map(r => el('div', { class: 'list-row' }, [
          icon(r.image_url ? 'image' : 'file', 'ic-sm'),
          el('div', { class: 'stack-2 grow', style: 'min-width:0' }, [
            el('div', { class: 'small strong', text: r.title }),
            el('div', { class: 'small muted', style: 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis', text: r.image_url || 'เนื้อหา HTML' }),
          ]),
          r.image_url ? el('button', { class: 'btn btn-sm btn-icon btn-ghost', type: 'button', 'aria-label': 'ดูรูป', onclick: () => lightbox(r.image_url, r.title) }, [icon('eye', 'ic-sm')]) : null,
          el('button', {
            class: 'btn btn-sm btn-icon btn-ghost', type: 'button', 'aria-label': 'ลบ',
            onclick: () => confirmDialog({
              title: 'ลบเอกสารอ้างอิง', danger: true, confirmLabel: 'ลบ', message: `ลบ "${r.title}" ออกจากหัวข้อนี้?`,
              onConfirm: async () => { await api(`/admin/refs/${r.id}`, { method: 'DELETE' }); toast('ลบแล้ว', 'ok'); load(); },
            }),
          }, [icon('trash', 'ic-sm')]),
        ])))
        : el('div', { style: 'margin-block:12px' }, [emptyState('file', 'ยังไม่มีเอกสารอ้างอิง', '')]),
      el('hr', { class: 'divider' }),
      el('div', { class: 'stack', style: 'margin-top:12px' }, [fTitle, fImg, fHtml, addBtn]),
    );
  };
  load();
}

/* ═══════════════════ 3 · ผลสอบ ═══════════════════ */
let resultFilters = { topic: 0, grade: '', pending: false, q: '' };

async function viewResults() {
  const host = el('div', {});
  const listHost = el('div', {}, [loading(240)]);

  let topics = [];
  try { topics = (await api('/admin/topics')).topics; } catch { }

  const fQ = el('input', { class: 'input', type: 'search', placeholder: 'ค้นหารหัส/ชื่อพนักงาน…', 'aria-label': 'ค้นหาพนักงาน', value: resultFilters.q });
  fQ.addEventListener('input', debounce(() => { resultFilters.q = fQ.value.trim(); load(); }, 320));

  const fTopic = el('select', { class: 'select', 'aria-label': 'กรองตามหัวข้อ' }, [
    el('option', { value: '0' }, ['ทุกหัวข้อ']),
    ...topics.map(t => el('option', { value: String(t.id), selected: resultFilters.topic === t.id }, [`${t.code} — ${t.title}`])),
  ]);
  fTopic.addEventListener('change', () => { resultFilters.topic = Number(fTopic.value); load(); });

  const chips = el('div', { class: 'chip-row' }, [
    ...['', 'A', 'B', 'C'].map(g => el('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(resultFilters.grade === g),
      onclick: () => { resultFilters.grade = g; viewResults(); },
    }, [g ? `เกรด ${g}` : 'ทุกเกรด'])),
    el('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(resultFilters.pending),
      onclick: () => { resultFilters.pending = !resultFilters.pending; viewResults(); },
    }, [icon('clock', 'ic-sm'), 'รอตรวจ']),
  ]);

  const exportBtn = el('button', { class: 'btn btn-sm', type: 'button' }, [icon('download', 'ic-sm'), 'ส่งออก CSV']);
  exportBtn.addEventListener('click', () => withLoading(exportBtn, async () => {
    try {
      const res = await api(`/admin/export${resultFilters.topic ? `?topic=${resultFilters.topic}` : ''}`, { raw: true });
      downloadBlob(await res.blob(), `wesco-assessment-${new Date().toISOString().slice(0, 10)}.csv`);
      toast('ดาวน์โหลดไฟล์แล้ว', 'ok');
    } catch (e) { toast(e.message, 'err'); }
  }));

  host.append(
    pageHead('ผลสอบ', 'ดูผล ตรวจให้คะแนน และส่งออกข้อมูล', exportBtn),
    el('div', { class: 'card card-pad', style: 'margin-bottom:16px' }, [
      el('div', { class: 'stack', style: 'gap:12px' }, [
        el('div', { class: 'row wrap', style: 'gap:12px' }, [
          el('div', { class: 'grow', style: 'min-width:200px' }, [fQ]),
          el('div', { class: 'grow', style: 'min-width:200px' }, [fTopic]),
        ]),
        chips,
      ]),
    ]),
    listHost,
  );
  setView(host);

  async function load() {
    clear(listHost).append(loading(240));
    const qs = new URLSearchParams();
    if (resultFilters.topic) qs.set('topic', resultFilters.topic);
    if (resultFilters.grade) qs.set('grade', resultFilters.grade);
    if (resultFilters.pending) qs.set('pending', '1');
    if (resultFilters.q) qs.set('q', resultFilters.q);

    let d;
    try { d = await api(`/admin/attempts?${qs}`); }
    catch (e) { clear(listHost).append(note('dang', esc(e.message))); return; }

    clear(listHost);
    if (!d.attempts.length) {
      listHost.append(emptyState('clipboard', 'ไม่พบผลสอบ', 'ลองปรับตัวกรองหรือคำค้นหา'));
      return;
    }

    listHost.append(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('h2', { text: 'รายการผลสอบ' }),
        el('span', { class: 'small muted num', text: `${d.attempts.length} รายการ` }),
      ]),
      el('div', { class: 'table-wrap' }, [
        el('table', { class: 'table table-lg' }, [
          el('thead', {}, [el('tr', {}, [
            el('th', { text: 'พนักงาน' }), el('th', { text: 'หัวข้อ' }),
            el('th', { class: 'num', text: 'ข้อสอบ' }), el('th', { class: 'num', text: 'ปฏิบัติ' }),
            el('th', { class: 'num', text: 'รวม' }), el('th', { class: 'num', text: '%' }),
            el('th', { text: 'เกรด' }), el('th', { text: 'วันที่' }), el('th', { text: '' }),
          ])]),
          el('tbody', {}, d.attempts.map(a => el('tr', {}, [
            el('td', { class: 'cell-id' }, [
              el('div', { class: 'strong small nowrap', text: `${a.first_name} ${a.last_name}` }),
              el('div', { class: 'small muted nowrap', text: `${a.emp_code} · ${a.position}` }),
            ]),
            el('td', { class: 'cell-topic' }, [
              el('div', { class: 'small nowrap', text: a.topic_title }),
              el('div', { class: 'small muted nowrap', text: a.topic_code }),
            ]),
            el('td', { class: 'num small', text: `${fmtNum(a.quiz_score)}/${fmtNum(a.quiz_max)}` }),
            el('td', { class: 'num small', text: a.practical_max > 0 ? (a.practical_score === null ? '—' : `${fmtNum(a.practical_score)}/${fmtNum(a.practical_max)}`) : '–' }),
            el('td', { class: 'num small', text: a.total_score === null ? '—' : `${fmtNum(a.total_score)}/${fmtNum(a.total_max)}` }),
            el('td', { class: 'num small strong', text: a.percent === null ? '—' : `${fmtNum(a.percent)}%` }),
            el('td', {}, [a.needs_review ? el('span', { class: 'badge badge-warn nowrap', text: 'รอตรวจ' }) : gradeBadge(a.grade)]),
            el('td', { class: 'small muted nowrap', text: fmtDate(a.submitted_at) }),
            el('td', {}, [el('button', {
              class: 'btn btn-sm', type: 'button', onclick: () => openReview(a.id, load),
            }, [a.needs_review ? 'ตรวจ' : 'ดู'])]),
          ]))),
        ]),
      ]),
    ]));
  }
  load();
}

async function openReview(attemptId, reload) {
  const body = el('div', {}, [loading(200)]);
  modal({ title: 'รายละเอียดผลสอบ', body, wide: true });

  let d;
  try { d = await api(`/admin/attempts/${attemptId}`); }
  catch (e) { clear(body).append(note('dang', esc(e.message))); return; }

  const a = d.attempt;
  const textAnswers = d.answers.filter(x => x.qtype === 'text');

  const fPrac = a.practical_max > 0
    ? field({
      label: `คะแนนภาคปฏิบัติ (เต็ม ${fmtNum(a.practical_max)})`, name: 'practical_score',
      type: 'number', min: 0, max: a.practical_max, step: '0.5',
      value: a.practical_score ?? '', help: 'คะแนนที่หัวหน้างานประเมินจากการปฏิบัติงานจริง',
    })
    : null;
  const fAttach = field({ label: 'ลิงก์ไฟล์แนบ', name: 'attachment', value: a.attachment || '', placeholder: 'URL ของหลักฐาน/ไฟล์แนบ (ไม่บังคับ)' });
  const fNote = field({ label: 'หมายเหตุถึงผู้สอบ', name: 'review_note', textarea: true, rows: 3, value: a.review_note || '' });

  /* ช่องให้คะแนนข้อเขียน */
  const textScoreInputs = {};
  const textBlock = textAnswers.length ? el('div', { class: 'stack' }, [
    el('h3', { style: 'font-size:.9375rem', text: `ตรวจข้อเขียน (${textAnswers.length} ข้อ)` }),
    ...textAnswers.map(x => {
      const inp = el('input', {
        class: 'input', type: 'number', min: 0, max: x.points_max, step: '0.5',
        style: 'width:110px;flex:none', 'aria-label': `คะแนนข้อ ${x.seq}`,
        value: x.is_correct === null ? '' : String(x.points_earned),
      });
      textScoreInputs[x.question_id] = inp;
      return el('div', { class: 'card card-pad', style: 'background:var(--surface-2)' }, [
        el('div', { class: 'stack-2' }, [
          el('div', { class: 'small strong', text: `ข้อ ${x.seq}. ${x.question_text}` }),
          el('div', { class: 'note note-info small', style: 'white-space:pre-wrap' }, [x.text_answer || '(ไม่ได้ตอบ)']),
          el('div', { class: 'row', style: 'gap:8px' }, [
            el('span', { class: 'small muted nowrap', text: `ให้คะแนน (เต็ม ${fmtNum(x.points_max)}):` }),
            inp,
          ]),
        ]),
      ]);
    }),
  ]) : null;

  /* สรุปคำตอบปรนัย */
  const mcq = d.answers.filter(x => x.qtype !== 'text');
  const mcqBlock = mcq.length ? el('div', { class: 'card', style: 'margin-top:8px' }, [
    el('div', { class: 'card-head' }, [el('h3', { text: `คำตอบปรนัย (${mcq.filter(x => x.is_correct).length}/${mcq.length} ข้อถูก)` })]),
    el('div', {}, mcq.map(x => el('div', { class: 'list-row' }, [
      el('span', {
        class: `grade ${x.is_correct ? 'grade-A' : 'grade-C'}`,
        style: 'width:24px;height:24px;font-size:.6875rem', text: String(x.seq),
        'aria-label': x.is_correct ? 'ถูก' : 'ผิด',
      }),
      el('div', { class: 'stack-2 grow', style: 'min-width:0' }, [
        el('div', { class: 'small', text: x.question_text }),
        el('div', { class: 'small muted' }, [
          `ตอบ: ${x.chosen_label ? `${x.chosen_label}. ${x.chosen_text}` : '(ไม่ได้ตอบ)'}`,
          x.is_correct ? null : el('span', { class: 'text-ok strong' }, [` · เฉลย: ${x.correct_label}. ${x.correct_text}`]),
        ]),
      ]),
    ]))),
  ]) : null;

  clear(body).append(el('div', { class: 'stack' }, [
    el('div', { class: 'card card-pad card-accent' }, [
      el('div', { class: 'row-between wrap', style: 'gap:12px' }, [
        el('div', { class: 'stack-2' }, [
          el('h3', { text: `${a.first_name} ${a.last_name}` }),
          el('div', { class: 'small muted', text: `${a.emp_code} · ${a.position}${a.department ? ' · ' + a.department : ''}` }),
          el('div', { class: 'small muted', text: `${a.topic_code} — ${a.topic_title}` }),
        ]),
        el('div', { style: 'text-align:end' }, [
          a.needs_review ? el('span', { class: 'badge badge-warn', text: 'รอตรวจ' }) : gradeBadge(a.grade, true),
          el('div', { class: 'small muted num', style: 'margin-top:4px', text: a.percent === null ? '' : `${fmtNum(a.percent)}%` }),
        ]),
      ]),
      el('dl', { class: 'score-grid', style: 'margin-top:16px' }, [
        st('ข้อสอบ', `${fmtNum(a.quiz_score)}/${fmtNum(a.quiz_max)}`),
        st('ภาคปฏิบัติ', a.practical_max > 0 ? (a.practical_score === null ? 'รอกรอก' : `${fmtNum(a.practical_score)}/${fmtNum(a.practical_max)}`) : '—'),
        st('รวม', a.total_score === null ? '—' : `${fmtNum(a.total_score)}/${fmtNum(a.total_max)}`),
        st('เวลาที่ใช้', fmtDuration(a.duration_sec)),
      ]),
    ]),

    a.needs_review ? note('warn', 'รายการนี้ยังตรวจไม่ครบ — <strong>เกรดจะออกเมื่อกรอกคะแนนครบทุกส่วน</strong>') : null,

    textBlock,
    fPrac, fAttach, fNote,

    el('div', { class: 'row', style: 'gap:8px' }, [
      (() => {
        const saveBtn = el('button', { class: 'btn btn-primary grow', type: 'button' }, [icon('save', 'ic-sm'), 'บันทึกผลการตรวจ']);
        saveBtn.addEventListener('click', () => withLoading(saveBtn, async () => {
          const text_scores = {};
          for (const [qid, inp] of Object.entries(textScoreInputs)) {
            if (inp.value !== '') text_scores[qid] = Number(inp.value);
          }
          try {
            await api(`/admin/attempts/${attemptId}/review`, {
              method: 'POST',
              body: {
                practical_score: fPrac ? fPrac.input.value : undefined,
                attachment: fAttach.input.value.trim(),
                review_note: fNote.input.value.trim(),
                text_scores,
              },
            });
            toast('บันทึกผลการตรวจแล้ว', 'ok');
            document.querySelector('.overlay')?.remove();
            document.body.style.overflow = '';
            reload ? reload() : render();
          } catch (e) { toast(e.message, 'err'); }
        }));
        return saveBtn;
      })(),
      el('button', {
        class: 'btn btn-danger btn-icon', type: 'button', 'aria-label': 'ลบผลสอบนี้', title: 'ลบผลสอบนี้',
        onclick: () => confirmDialog({
          title: 'ลบผลสอบ', danger: true, confirmLabel: 'ลบถาวร',
          message: `ลบผลสอบของ ${a.first_name} ${a.last_name} ในหัวข้อ ${a.topic_code}? การลบนี้ย้อนกลับไม่ได้`,
          onConfirm: async () => {
            await api(`/admin/attempts/${attemptId}`, { method: 'DELETE' });
            toast('ลบผลสอบแล้ว', 'ok');
            document.querySelectorAll('.overlay').forEach(o => o.remove());
            document.body.style.overflow = '';
            reload ? reload() : render();
          },
        }),
      }, [icon('trash', 'ic-sm')]),
    ]),

    mcqBlock,
  ]));

  function st(label, value) {
    return el('div', { class: 'score-tile' }, [el('dt', { text: label }), el('dd', { class: 'num', style: 'font-size:1rem', text: value })]);
  }
}

/* ═══════════════════ 4 · พนักงาน ═══════════════════ */
async function viewEmployees() {
  const host = el('div', {});
  const listHost = el('div', {}, [loading(240)]);

  const fQ = el('input', { class: 'input', type: 'search', placeholder: 'ค้นหารหัส ชื่อ หรือตำแหน่ง…', 'aria-label': 'ค้นหาพนักงาน' });
  fQ.addEventListener('input', debounce(() => load(fQ.value.trim()), 320));

  host.append(
    pageHead('พนักงาน', 'รายชื่อพนักงานที่ลงทะเบียนเข้าระบบ'),
    el('div', { class: 'card card-pad', style: 'margin-bottom:16px' }, [fQ]),
    listHost,
  );
  setView(host);

  async function load(q = '') {
    clear(listHost).append(loading(240));
    let d;
    try { d = await api(`/admin/employees${q ? `?q=${encodeURIComponent(q)}` : ''}`); }
    catch (e) { clear(listHost).append(note('dang', esc(e.message))); return; }

    clear(listHost);
    if (!d.employees.length) {
      listHost.append(emptyState('users', 'ไม่พบพนักงาน', q ? 'ลองเปลี่ยนคำค้นหา' : 'ยังไม่มีพนักงานลงทะเบียนเข้ามา'));
      return;
    }

    listHost.append(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('h2', { text: 'รายชื่อพนักงาน' }),
        el('span', { class: 'small muted num', text: `${d.employees.length} คน` }),
      ]),
      el('div', { class: 'table-wrap' }, [
        el('table', { class: 'table table-lg' }, [
          el('thead', {}, [el('tr', {}, [
            el('th', { text: 'รหัส' }), el('th', { text: 'ชื่อ-นามสกุล' }), el('th', { text: 'ตำแหน่ง' }),
            el('th', { text: 'แผนก' }), el('th', { class: 'num', text: 'สอบ' }), el('th', { class: 'num', text: 'เฉลี่ย' }),
            el('th', { text: 'สถานะ' }), el('th', { text: '' }),
          ])]),
          el('tbody', {}, d.employees.map(e => el('tr', {}, [
            el('td', { class: 'small strong nowrap', text: e.emp_code }),
            el('td', { class: 'small', text: `${e.first_name} ${e.last_name}` }),
            el('td', { class: 'small muted', text: e.position }),
            el('td', { class: 'small muted', text: e.department || '—' }),
            el('td', { class: 'num small', text: String(e.attempts || 0) }),
            el('td', { class: 'num small', text: e.avg_percent === null ? '—' : `${fmtNum(e.avg_percent)}%` }),
            el('td', {}, [e.is_active ? el('span', { class: 'badge badge-ok', text: 'ใช้งาน' }) : el('span', { class: 'badge badge-warn', text: 'ระงับ' })]),
            el('td', {}, [el('div', { class: 'row', style: 'gap:4px' }, [
              el('button', { class: 'btn btn-sm btn-icon btn-ghost', type: 'button', 'aria-label': 'แก้ไข', onclick: () => editEmployee(e, () => load(q)) }, [icon('edit', 'ic-sm')]),
              el('button', {
                class: 'btn btn-sm btn-icon btn-ghost', type: 'button', 'aria-label': 'ลบ',
                onclick: () => confirmDialog({
                  title: 'ลบพนักงาน', danger: true, confirmLabel: 'ลบถาวร',
                  message: `ลบ ${e.first_name} ${e.last_name} (${e.emp_code}) พร้อมผลสอบ ${e.attempts || 0} รายการ? การลบนี้ย้อนกลับไม่ได้`,
                  onConfirm: async () => { await api(`/admin/employees/${e.id}`, { method: 'DELETE' }); toast('ลบแล้ว', 'ok'); load(q); },
                }),
              }, [icon('trash', 'ic-sm')]),
            ])]),
          ]))),
        ]),
      ]),
    ]));
  }
  load();
}

function editEmployee(e, reload) {
  const fCode = field({ label: 'รหัสพนักงาน', name: 'emp_code', required: true, value: e.emp_code });
  const fFirst = field({ label: 'ชื่อ', name: 'first_name', required: true, value: e.first_name });
  const fLast = field({ label: 'นามสกุล', name: 'last_name', required: true, value: e.last_name });
  const fPos = field({ label: 'ตำแหน่ง', name: 'position', required: true, value: e.position });
  const fDept = field({ label: 'แผนก', name: 'department', value: e.department || '' });
  const sActive = switchField('เปิดให้เข้าสอบ', 'is_active', !!e.is_active, 'ปิดเพื่อระงับการเข้าใช้งานชั่วคราวโดยไม่ลบข้อมูล');

  modal({
    title: 'แก้ไขข้อมูลพนักงาน',
    body: el('div', { class: 'stack' }, [fCode, fFirst, fLast, fPos, fDept, el('hr', { class: 'divider' }), sActive]),
    actions: [
      { label: 'ยกเลิก', class: 'btn-ghost' },
      {
        label: 'บันทึก', class: 'btn-primary', icon: 'save',
        onClick: async () => {
          try {
            await api(`/admin/employees/${e.id}`, {
              method: 'PUT',
              body: {
                emp_code: fCode.input.value.trim(), first_name: fFirst.input.value.trim(),
                last_name: fLast.input.value.trim(), position: fPos.input.value.trim(),
                department: fDept.input.value.trim(), is_active: sActive.input.checked,
              },
            });
            toast('บันทึกแล้ว', 'ok'); reload();
          } catch (err) {
            if (err.data?.field === 'emp_code') { fCode.setError(err.message); return false; }
            toast(err.message, 'err'); return false;
          }
        },
      },
    ],
  });
}

/* ═══════════════════ 5 · ตั้งค่า ═══════════════════ */
async function viewSettings() {
  const host = el('div', {});
  host.append(pageHead('ตั้งค่าระบบ', 'เกณฑ์การให้เกรด การลงทะเบียน และบัญชีผู้ดูแล'), loading(320));
  setView(host);

  let s, admins;
  try {
    s = (await api('/admin/settings')).settings;
    admins = (await api('/admin/admins')).admins;
  } catch (e) { clear(host).append(note('dang', esc(e.message))); return; }

  const fTitle = field({ label: 'ชื่อระบบ', name: 'site_title', value: s.site_title || '' });
  const fSub = field({ label: 'คำอธิบายใต้ชื่อ', name: 'site_subtitle', value: s.site_subtitle || '' });
  const fA = field({ label: 'เกรด A เมื่อได้ตั้งแต่ (%)', name: 'grade_a_min', type: 'number', min: 0, max: 100, value: s.grade_a_min });
  const fB = field({ label: 'เกรด B เมื่อได้ตั้งแต่ (%)', name: 'grade_b_min', type: 'number', min: 0, max: 100, value: s.grade_b_min });

  const sRetake = switchField('อนุญาตให้สอบซ้ำ', 'allow_retake', s.allow_retake === '1', 'ปิดเพื่อให้แต่ละหัวข้อสอบได้ครั้งเดียวต่อคน');
  const sAnswers = switchField('แสดงเฉลยหลังส่งคำตอบ', 'show_answers', s.show_answers === '1', 'ปิดเพื่อไม่ให้ผู้สอบเห็นเฉลยรายข้อ');
  const sReg = switchField('เปิดรับลงทะเบียนพนักงานใหม่', 'registration_open', s.registration_open === '1');

  const saveBtn = el('button', { class: 'btn btn-primary', type: 'button' }, [icon('save', 'ic-sm'), 'บันทึกการตั้งค่า']);
  saveBtn.addEventListener('click', () => withLoading(saveBtn, async () => {
    const a = Number(fA.input.value), b = Number(fB.input.value);
    if (!(a >= 0 && a <= 100) || !(b >= 0 && b <= 100)) return toast('เกณฑ์เกรดต้องอยู่ระหว่าง 0-100', 'err');
    if (b > a) return toast('เกณฑ์เกรด B ต้องไม่สูงกว่าเกรด A', 'err');
    try {
      await api('/admin/settings', {
        method: 'PUT',
        body: {
          site_title: fTitle.input.value.trim(), site_subtitle: fSub.input.value.trim(),
          grade_a_min: a, grade_b_min: b,
          allow_retake: sRetake.input.checked, show_answers: sAnswers.input.checked,
          registration_open: sReg.input.checked,
        },
      });
      toast('บันทึกการตั้งค่าแล้ว — เกรดของผลสอบเดิมถูกคำนวณใหม่ตามเกณฑ์นี้', 'ok');
    } catch (e) { toast(e.message, 'err'); }
  }));

  /* บัญชีผู้ดูแล */
  const adminList = el('div', {}, admins.map(a => el('div', { class: 'list-row' }, [
    icon('shield', 'ic-sm'),
    el('div', { class: 'stack-2 grow' }, [
      el('div', { class: 'small strong', text: a.display_name || a.username }),
      el('div', { class: 'small muted', text: `@${a.username} · เข้าล่าสุด ${a.last_login_at ? fmtDate(a.last_login_at) : 'ยังไม่เคย'}` }),
    ]),
    a.id === state.admin.id ? el('span', { class: 'badge badge-info', text: 'คุณ' }) : null,
    el('button', { class: 'btn btn-sm btn-icon btn-ghost', type: 'button', 'aria-label': 'เปลี่ยนรหัสผ่าน', title: 'เปลี่ยนรหัสผ่าน', onclick: () => changePassword(a) }, [icon('lock', 'ic-sm')]),
    a.id === state.admin.id ? null : el('button', {
      class: 'btn btn-sm btn-icon btn-ghost', type: 'button', 'aria-label': 'ลบบัญชี',
      onclick: () => confirmDialog({
        title: 'ลบบัญชีผู้ดูแล', danger: true, confirmLabel: 'ลบ', message: `ลบบัญชี @${a.username}?`,
        onConfirm: async () => { await api(`/admin/admins/${a.id}`, { method: 'DELETE' }); toast('ลบแล้ว', 'ok'); viewSettings(); },
      }),
    }, [icon('trash', 'ic-sm')]),
  ])));

  clear(host).append(
    pageHead('ตั้งค่าระบบ', 'เกณฑ์การให้เกรด การลงทะเบียน และบัญชีผู้ดูแล'),

    el('div', { class: 'card', style: 'margin-bottom:16px' }, [
      el('div', { class: 'card-head' }, [el('h2', { text: 'เกณฑ์การให้เกรด' })]),
      el('div', { class: 'card-body stack' }, [
        note('info', `ตอนนี้: ได้ <strong>≥ ${esc(s.grade_a_min)}%</strong> → เกรด <strong>A</strong> · ได้ <strong>≥ ${esc(s.grade_b_min)}%</strong> → เกรด <strong>B</strong> · ต่ำกว่านั้น → เกรด <strong>C</strong>`),
        el('div', { class: 'row wrap', style: 'gap:16px' }, [
          el('div', { class: 'grow', style: 'min-width:180px' }, [fA]),
          el('div', { class: 'grow', style: 'min-width:180px' }, [fB]),
        ]),
        note('warn', 'เมื่อบันทึก ระบบจะคำนวณเกรดของผลสอบทั้งหมดที่มีอยู่ใหม่ตามเกณฑ์นี้'),
      ]),
    ]),

    el('div', { class: 'card', style: 'margin-bottom:16px' }, [
      el('div', { class: 'card-head' }, [el('h2', { text: 'การใช้งานทั่วไป' })]),
      el('div', { class: 'card-body stack' }, [fTitle, fSub, el('hr', { class: 'divider' }), sRetake, sAnswers, sReg]),
    ]),

    el('div', { style: 'margin-bottom:24px' }, [saveBtn]),

    el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('h2', { text: 'บัญชีผู้ดูแลระบบ' }),
        el('button', { class: 'btn btn-sm', type: 'button', onclick: addAdmin }, [icon('plus', 'ic-sm'), 'เพิ่มบัญชี']),
      ]),
      adminList,
    ]),
  );
}

function addAdmin() {
  const fUser = field({ label: 'ชื่อผู้ใช้', name: 'username', required: true, help: 'a-z 0-9 . _ - อย่างน้อย 3 ตัว' });
  const fName = field({ label: 'ชื่อที่แสดง', name: 'display_name' });
  const fPass = field({ label: 'รหัสผ่าน', name: 'password', type: 'password', required: true, autocomplete: 'new-password', help: 'อย่างน้อย 8 ตัวอักษร' });

  modal({
    title: 'เพิ่มบัญชีผู้ดูแล',
    body: el('div', { class: 'stack' }, [fUser, fName, fPass]),
    actions: [
      { label: 'ยกเลิก', class: 'btn-ghost' },
      {
        label: 'สร้างบัญชี', class: 'btn-primary', icon: 'plus',
        onClick: async () => {
          try {
            await api('/admin/admins', {
              method: 'POST',
              body: { username: fUser.input.value.trim(), display_name: fName.input.value.trim(), password: fPass.input.value },
            });
            toast('สร้างบัญชีแล้ว', 'ok'); viewSettings();
          } catch (e) {
            const f = { username: fUser, password: fPass }[e.data?.field];
            if (f) { f.setError(e.message); return false; }
            toast(e.message, 'err'); return false;
          }
        },
      },
    ],
  });
}

function changePassword(a) {
  const fPass = field({ label: 'รหัสผ่านใหม่', name: 'password', type: 'password', required: true, autocomplete: 'new-password', help: 'อย่างน้อย 8 ตัวอักษร' });
  const fPass2 = field({ label: 'ยืนยันรหัสผ่านใหม่', name: 'password2', type: 'password', required: true, autocomplete: 'new-password' });

  modal({
    title: `เปลี่ยนรหัสผ่าน — @${a.username}`,
    body: el('div', { class: 'stack' }, [
      fPass, fPass2,
      note('warn', 'เมื่อเปลี่ยนรหัสผ่าน อุปกรณ์ทั้งหมดที่ล็อกอินด้วยบัญชีนี้จะถูกออกจากระบบ'),
    ]),
    actions: [
      { label: 'ยกเลิก', class: 'btn-ghost' },
      {
        label: 'เปลี่ยนรหัสผ่าน', class: 'btn-primary', icon: 'lock',
        onClick: async () => {
          if (fPass.input.value.length < 8) { fPass.setError('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'); return false; }
          if (fPass.input.value !== fPass2.input.value) { fPass2.setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return false; }
          try {
            await api(`/admin/admins/${a.id}`, { method: 'PUT', body: { password: fPass.input.value } });
            toast('เปลี่ยนรหัสผ่านแล้ว', 'ok');
            if (a.id === state.admin.id) { api.token.clear(); state.admin = null; render(); }
          } catch (e) { toast(e.message, 'err'); return false; }
        },
      },
    ],
  });
}
