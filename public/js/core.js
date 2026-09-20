/* ═══════════════════════════════════════════════════════════════
   WESCO Assessment — core utilities (ใช้ร่วมกันทั้งฝั่งพนักงานและแอดมิน)
   ═══════════════════════════════════════════════════════════════ */

/* ───────────── storage (กันกรณีเบราว์เซอร์ปิด storage) ───────────── */
export const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* โหมดส่วนตัว */ } },
  del(k) { try { localStorage.removeItem(k); } catch { } },
  json(k, dflt = null) { try { return JSON.parse(localStorage.getItem(k)) ?? dflt; } catch { return dflt; } },
  setJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
};

/* ───────────── DOM helpers ───────────── */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** สร้าง element: el('div', {class:'x', onclick:fn}, [children]) */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** หนีอักขระ HTML — ใช้ทุกครั้งที่ต้องต่อสตริงเข้า innerHTML */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const clear = node => { while (node.firstChild) node.firstChild.remove(); return node; };

/* ───────────── icons (Lucide-style, ไม่ใช้ emoji) ───────────── */
const PATHS = {
  book:      '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  check:     '<path d="M20 6 9 17l-5-5"/>',
  checkCircle:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  x:         '<path d="M18 6 6 18M6 6l12 12"/>',
  xCircle:   '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  alert:     '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  info:      '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  clock:     '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  user:      '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users:     '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  logout:    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  chevronR:  '<path d="m9 18 6-6-6-6"/>',
  chevronL:  '<path d="m15 18-6-6 6-6"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  home:      '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  history:   '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  chart:     '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  settings:  '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  plus:      '<path d="M12 5v14M5 12h14"/>',
  edit:      '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash:     '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
  search:    '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  download:  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  file:      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  image:     '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  award:     '<path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/><circle cx="12" cy="8" r="6"/>',
  lock:      '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shield:    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  refresh:   '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
  play:      '<path d="m5 3 14 9-14 9V3z"/>',
  moon:      '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  layers:    '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 12.1-9.17 4.16a2 2 0 0 1-1.66 0L2 12.1"/><path d="m22 17.1-9.17 4.16a2 2 0 0 1-1.66 0L2 17.1"/>',
  target:    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  menu:      '<path d="M4 12h16M4 6h16M4 18h16"/>',
  eye:       '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  save:      '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  zoom:      '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
};

/** ไอคอน SVG — icon('check', 'ic-sm') */
export function icon(name, cls = 'ic') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', cls);
  svg.innerHTML = PATHS[name] || PATHS.info;
  return svg;
}
export const iconHtml = (name, cls = 'ic') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls}">${PATHS[name] || PATHS.info}</svg>`;

/* ───────────── API client ───────────── */
export class ApiError extends Error {
  constructor(message, status, data) { super(message); this.status = status; this.data = data || {}; }
}

export function makeApi(tokenKey) {
  const api = async (path, { method = 'GET', body, raw = false } = {}) => {
    const headers = {};
    const token = store.get(tokenKey);
    if (token) headers.authorization = `Bearer ${token}`;
    if (body !== undefined) headers['content-type'] = 'application/json';

    let res;
    try {
      res = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่', 0);
    }

    if (raw) {
      if (!res.ok) throw new ApiError('ดาวน์โหลดไม่สำเร็จ', res.status);
      return res;
    }

    let data = {};
    try { data = await res.json(); } catch { /* ไม่มี body */ }

    if (!res.ok) {
      if (res.status === 401) { store.del(tokenKey); }
      throw new ApiError(data.error || `เกิดข้อผิดพลาด (${res.status})`, res.status, data);
    }
    return data;
  };
  api.token = {
    get: () => store.get(tokenKey),
    set: t => store.set(tokenKey, t),
    clear: () => store.del(tokenKey),
  };
  return api;
}

/* ───────────── toast ───────────── */
let toastHost;
export function toast(message, kind = '') {
  if (!toastHost) {
    toastHost = el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastHost);
  }
  const iconName = kind === 'ok' ? 'checkCircle' : kind === 'err' ? 'alert' : 'info';
  const node = el('div', { class: `toast ${kind}` }, [icon(iconName, 'ic'), el('span', { text: message })]);
  toastHost.append(node);
  const kill = () => {
    node.style.transition = 'opacity .2s, transform .2s';
    node.style.opacity = '0';
    node.style.transform = 'translateY(8px)';
    setTimeout(() => node.remove(), 200);
  };
  setTimeout(kill, kind === 'err' ? 5200 : 3400);
  node.addEventListener('click', kill);
}

/* ───────────── modal / sheet ───────────── */
let openCount = 0;

export function modal({ title, body, actions = [], wide = false, onClose }) {
  const overlay = el('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'หน้าต่าง' });
  const sheet = el('div', { class: `sheet${wide ? ' sheet-wide' : ''}` });

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    if (--openCount <= 0) { openCount = 0; document.body.style.overflow = ''; }
    prevFocus && prevFocus.focus && prevFocus.focus();
    onClose && onClose();
  };
  const onKey = e => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key === 'Tab') trapFocus(e, sheet);
  };
  const prevFocus = document.activeElement;

  sheet.append(el('div', { class: 'grabber' }));
  if (title) {
    sheet.append(el('div', { class: 'sheet-head' }, [
      el('h2', { text: title }),
      el('button', { class: 'btn btn-ghost btn-icon btn-sm', type: 'button', 'aria-label': 'ปิด', onclick: close }, [icon('x')]),
    ]));
  }
  const bodyNode = el('div', { class: 'sheet-body' });
  bodyNode.append(body instanceof Node ? body : el('div', { html: body || '' }));
  sheet.append(bodyNode);

  if (actions.length) {
    sheet.append(el('div', { class: 'sheet-foot' }, actions.map(a =>
      el('button', {
        class: `btn ${a.class || ''}`, type: 'button',
        onclick: async ev => {
          if (a.keepOpen) { await a.onClick?.(close, ev.currentTarget); return; }
          const btn = ev.currentTarget;
          btn.classList.add('is-loading');
          try { const r = await a.onClick?.(close, btn); if (r !== false) close(); }
          finally { btn.classList.remove('is-loading'); }
        },
      }, [a.icon ? icon(a.icon) : null, a.label])
    )));
  }

  overlay.append(sheet);
  overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  openCount++;
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    const first = sheet.querySelector('input,select,textarea,button:not([aria-label="ปิด"])');
    first && first.focus({ preventScroll: true });
  }, 60);

  return { close, sheet, body: bodyNode };
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function trapFocus(e, root) {
  const items = [...root.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/** กล่องยืนยันก่อนทำสิ่งที่ย้อนกลับไม่ได้ */
export function confirmDialog({ title, message, confirmLabel = 'ยืนยัน', danger = false, onConfirm }) {
  return modal({
    title,
    body: el('p', { class: 'small', style: 'color:var(--text-2);line-height:1.6', text: message }),
    actions: [
      { label: 'ยกเลิก', class: 'btn-ghost' },
      { label: confirmLabel, class: danger ? 'btn-danger' : 'btn-primary', onClick: onConfirm },
    ],
  });
}

/** ดูรูปขนาดเต็ม — แสดงที่ความละเอียดจริงและเลื่อนดูได้ เพื่ออ่านตาราง/แบบบนมือถือได้ชัด */
export function lightbox(src, alt = '') {
  const img = el('img', { src, alt });
  const inner = el('div', { class: 'lightbox-inner' }, [img]);
  const box = el('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': alt || 'ดูรูปขนาดเต็ม' });

  const close = () => {
    box.remove();
    document.removeEventListener('keydown', onKey);
    document.body.style.overflow = prevOverflow;
    prevFocus && prevFocus.focus && prevFocus.focus();
  };
  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  const prevFocus = document.activeElement;
  const prevOverflow = document.body.style.overflow;

  const closeBtn = el('button', { type: 'button', 'aria-label': 'ปิด', onclick: close }, [icon('x')]);
  box.append(
    el('div', { class: 'lightbox-bar' }, [el('h3', { text: alt || 'รูปประกอบ' }), closeBtn]),
    inner,
    el('div', { class: 'lightbox-hint', text: 'เลื่อนนิ้วเพื่อดูส่วนอื่น' }),
  );

  // ปิดเมื่อแตะพื้นหลัง แต่ไม่ปิดเมื่อแตะ/เลื่อนบนตัวรูป
  inner.addEventListener('click', e => { if (e.target !== img) close(); });

  document.addEventListener('keydown', onKey);
  document.body.style.overflow = 'hidden';
  document.body.append(box);
  closeBtn.focus({ preventScroll: true });
}

/* ───────────── formatting ───────────── */
export const fmtDate = iso => {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return iso;
  return d.toLocaleString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const fmtDuration = sec => {
  if (sec === null || sec === undefined) return '—';
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)} ชม. ${m % 60} น.` : m > 0 ? `${m} น. ${s % 60} วิ.` : `${s} วิ.`;
};

export const fmtNum = n => (n === null || n === undefined || n === '') ? '—'
  : (Math.round(Number(n) * 100) / 100).toLocaleString('th-TH');

export const clock = sec => {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export const gradeLabel = g => ({ A: 'ดีเยี่ยม', B: 'ผ่าน', C: 'ต้องปรับปรุง' }[g] || 'รอตรวจ');

export function gradeBadge(grade, large = false) {
  const cls = grade ? `grade grade-${grade}` : 'grade grade-pending';
  return el('span', {
    class: cls + (large ? ' grade-lg' : ''),
    title: gradeLabel(grade),
    'aria-label': grade ? `เกรด ${grade} — ${gradeLabel(grade)}` : 'รอตรวจ',
    text: grade || '…',
  });
}

/* ───────────── theme ───────────── */
export function initTheme() {
  const saved = store.get('wesco-theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
}
export function toggleTheme() {
  const isDark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  const next = isDark ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  store.set('wesco-theme', next);
  return next;
}
export function themeButton() {
  const btn = el('button', {
    class: 'btn btn-ghost btn-icon btn-sm', type: 'button',
    'aria-label': 'สลับโหมดสว่าง/มืด', title: 'สลับโหมดสว่าง/มืด',
  });
  const paint = () => {
    const isDark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    clear(btn).append(icon(isDark ? 'sun' : 'moon'));
  };
  btn.addEventListener('click', () => { toggleTheme(); paint(); });
  paint();
  return btn;
}

/* ───────────── UI blocks ───────────── */
export const logoMark = (h = 30) =>
  el('img', { src: '/assets/logo-mark.svg', alt: 'Wesco', class: 'logo', style: `height:${h}px`, width: 63, height: h });

export function emptyState(iconName, title, text, action) {
  return el('div', { class: 'empty' }, [
    el('div', { class: 'empty-icon' }, [icon(iconName, 'ic-lg')]),
    el('h3', { text: title }),
    text ? el('p', { text }) : null,
    action ? el('div', { style: 'margin-top:16px' }, [action]) : null,
  ]);
}

export const skeletonCards = (n = 3) =>
  el('div', { class: 'topic-grid' }, Array.from({ length: n }, () => el('div', { class: 'skel skel-card' })));

export function note(kind, message, iconName) {
  return el('div', { class: `note note-${kind}` }, [
    icon(iconName || (kind === 'warn' ? 'alert' : kind === 'dang' ? 'xCircle' : kind === 'ok' ? 'checkCircle' : 'info')),
    el('div', { html: message }),
  ]);
}

/** ฟิลด์กรอกข้อมูลพร้อม label / helper / error */
export function field({ label, name, type = 'text', value = '', placeholder = '', required = false,
  help = '', autocomplete, inputmode, textarea = false, options, rows, min, max, step }) {
  const id = `f_${name}_${Math.random().toString(36).slice(2, 7)}`;
  let input;
  if (options) {
    input = el('select', { class: 'select', id, name },
      options.map(o => el('option', { value: o.value, selected: String(o.value) === String(value) }, [o.label])));
  } else if (textarea) {
    input = el('textarea', { class: 'textarea', id, name, placeholder, rows: rows || 3 });
    input.value = value ?? '';
  } else {
    input = el('input', { class: 'input', id, name, type, placeholder, autocomplete, inputmode, min, max, step });
    input.value = value ?? '';
  }
  if (required) input.required = true;

  const errNode = el('div', { class: 'err hidden', role: 'alert' });
  const wrap = el('div', { class: 'field' }, [
    el('label', { class: 'label', for: id, html: `${esc(label)}${required ? '<span class="req" aria-hidden="true">*</span>' : ''}` }),
    input,
    help ? el('div', { class: 'help', text: help }) : null,
    errNode,
  ]);
  wrap.input = input;
  wrap.setError = msg => {
    if (msg) {
      errNode.textContent = msg;
      errNode.classList.remove('hidden');
      input.setAttribute('aria-invalid', 'true');
    } else {
      errNode.classList.add('hidden');
      input.removeAttribute('aria-invalid');
    }
  };
  input.addEventListener('input', () => wrap.setError(''));
  return wrap;
}

export function switchField(label, name, checked = false, help = '') {
  const input = el('input', { type: 'checkbox', name });
  input.checked = !!checked;
  const wrap = el('label', { class: 'switch' }, [
    input,
    el('span', { class: 'switch-track' }),
    el('span', { class: 'stack-2' }, [
      el('span', { class: 'switch-label', text: label }),
      help ? el('span', { class: 'help', text: help }) : null,
    ]),
  ]);
  wrap.input = input;
  return wrap;
}

/** วงแหวนแสดงเปอร์เซ็นต์ + เกรด */
export function gradeRing(percent, grade) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const R = 72, C = 2 * Math.PI * R;
  const ring = el('div', { class: `ring ring-${grade || 'pending'}` });
  ring.innerHTML = `
    <svg viewBox="0 0 168 168" aria-hidden="true">
      <circle class="ring-track" cx="84" cy="84" r="${R}"></circle>
      <circle class="ring-fill" cx="84" cy="84" r="${R}"
              stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"></circle>
    </svg>
    <div class="ring-center">
      <div>
        <div class="ring-grade">${grade ? esc(grade) : '…'}</div>
        <div class="ring-pct num">${grade ? pct.toFixed(pct % 1 ? 1 : 0) + '%' : 'รอตรวจ'}</div>
      </div>
    </div>`;
  requestAnimationFrame(() => {
    const fill = ring.querySelector('.ring-fill');
    if (fill) fill.style.strokeDashoffset = String(C * (1 - pct / 100));
  });
  return ring;
}

/* ───────────── misc ───────────── */
export const debounce = (fn, ms = 280) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

export async function withLoading(btn, fn) {
  if (!btn) return fn();
  btn.classList.add('is-loading');
  btn.disabled = true;
  try { return await fn(); }
  finally { btn.classList.remove('is-loading'); btn.disabled = false; }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
