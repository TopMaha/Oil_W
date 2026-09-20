/* ═══════════════════════════════════════════════════════════════
   WESCO Assessment — แอปฝั่งพนักงาน
   ═══════════════════════════════════════════════════════════════ */
import {
  $, el, esc, clear, icon, iconHtml, store, makeApi, ApiError, toast, modal, confirmDialog,
  lightbox, fmtDate, fmtDuration, fmtNum, clock, gradeBadge, gradeLabel, gradeRing,
  initTheme, themeButton, emptyState, skeletonCards, note, field, withLoading,
} from './core.js';

const api = makeApi('wesco-emp-token');
const view = $('#view');
const actions = $('#topbarActions');

const state = {
  config: null,
  me: null,
  exam: null,      // { attempt, topic, refs, questions, answers, index, timer }
};

/* ───────────────────────── boot ───────────────────────── */
initTheme();
window.addEventListener('hashchange', render);
boot();

async function boot() {
  view.append(skeletonCards(3));
  try {
    state.config = await api('/config');
    applyConfig();
  } catch (e) {
    clear(view).append(note('dang',
      `เชื่อมต่อระบบไม่ได้: ${esc(e.message)}<br><span class="small">หากเพิ่งติดตั้งระบบ ให้ตรวจสอบว่าผูกฐานข้อมูล D1 (binding <code>DB</code>) และรัน schema.sql แล้ว</span>`));
    return;
  }

  if (api.token.get()) {
    try {
      const r = await api('/me');
      state.me = r.employee;
    } catch { api.token.clear(); }
  }
  render();
}

function applyConfig() {
  const c = state.config;
  if (c.site_title) { $('#siteTitle').textContent = c.site_title; document.title = `${c.site_title} · Wesco`; }
  if (c.site_subtitle) $('#siteSub').textContent = c.site_subtitle;
}

function paintTopbar() {
  clear(actions);
  if (state.me) {
    actions.append(
      el('button', {
        class: 'btn btn-ghost btn-sm', type: 'button', title: 'ประวัติการสอบ',
        onclick: () => go('#/history'),
      }, [icon('history'), el('span', { class: 'sr-only', text: 'ประวัติการสอบ' })]),
      themeButton(),
      el('button', {
        class: 'btn btn-ghost btn-icon btn-sm', type: 'button', 'aria-label': 'ออกจากระบบ', title: 'ออกจากระบบ',
        onclick: logout,
      }, [icon('logout')]),
    );
  } else {
    actions.append(themeButton());
  }
}

const go = hash => { location.hash = hash; };

async function logout() {
  confirmDialog({
    title: 'ออกจากระบบ',
    message: 'ต้องการออกจากระบบใช่หรือไม่? ข้อสอบที่ทำค้างไว้จะยังถูกเก็บไว้',
    confirmLabel: 'ออกจากระบบ',
    onConfirm: async () => {
      try { await api('/auth/logout', { method: 'POST' }); } catch { }
      api.token.clear();
      state.me = null;
      state.exam = null;
      go('#/');
      render();
      toast('ออกจากระบบแล้ว');
    },
  });
}

/* ───────────────────────── router ───────────────────────── */
function render() {
  paintTopbar();
  if (!state.me) return viewAuth();

  const [, route, param] = location.hash.split('/');
  if (route === 'exam' && param) return viewExam(Number(param));
  if (route === 'result' && param) return viewResult(Number(param));
  if (route === 'history') return viewHistory();
  return viewHome();
}

const setView = node => { clear(view).append(node); window.scrollTo({ top: 0, behavior: 'instant' }); };

/* ═══════════════════ 1 · Lock in (ลงทะเบียน / เข้าสู่ระบบ) ═══════════════════ */
function viewAuth() {
  let mode = store.get('wesco-auth-mode') === 'register' ? 'register' : 'login';

  const host = el('div', { class: 'shell-narrow', style: 'margin-inline:auto' });

  const paint = () => {
    clear(host);

    host.append(el('div', { class: 'stack', style: 'text-align:center;padding:24px 0 8px' }, [
      el('img', { src: '/assets/logo-mark.svg', alt: 'Wesco', style: 'height:46px;width:auto;margin-inline:auto' }),
      el('h1', { style: 'font-size:1.375rem;margin-top:4px', text: 'แบบทดสอบความสามารถพนักงาน' }),
      el('p', { class: 'muted small', style: 'max-width:40ch;margin-inline:auto', text: 'ลงทะเบียนด้วยรหัสพนักงานเพื่อเริ่มทำแบบทดสอบ และดูผลคะแนนพร้อมเกรดได้ทันที' }),
    ]));

    const tabs = el('div', { class: 'tabs', role: 'tablist', style: 'margin:20px 0 16px' }, [
      el('button', {
        class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(mode === 'login'),
        onclick: () => { mode = 'login'; store.set('wesco-auth-mode', mode); paint(); },
      }, ['เข้าสู่ระบบ']),
      el('button', {
        class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(mode === 'register'),
        onclick: () => { mode = 'register'; store.set('wesco-auth-mode', mode); paint(); },
      }, ['ลงทะเบียนใหม่']),
    ]);
    host.append(tabs);

    const card = el('div', { class: 'card card-pad card-accent' });
    const form = el('form', { class: 'stack', novalidate: true });

    const fCode = field({
      label: 'รหัสพนักงาน', name: 'emp_code', required: true,
      placeholder: 'เช่น E12345', autocomplete: 'username',
      help: mode === 'login' ? 'ใช้รหัสเดียวกับที่ลงทะเบียนไว้' : 'ตัวอักษร ตัวเลข . _ - เท่านั้น',
    });
    form.append(fCode);

    let fFirst, fLast, fPos, fDept;
    if (mode === 'register') {
      fFirst = field({ label: 'ชื่อ', name: 'first_name', required: true, autocomplete: 'given-name' });
      fLast = field({ label: 'นามสกุล', name: 'last_name', required: true, autocomplete: 'family-name' });
      fPos = field({ label: 'ตำแหน่ง', name: 'position', required: true, placeholder: 'เช่น QA Inspector', autocomplete: 'organization-title' });
      fDept = field({ label: 'แผนก', name: 'department', placeholder: 'ไม่บังคับ', autocomplete: 'organization' });
      form.append(
        el('div', { class: 'stack', style: 'gap:16px' }, [fFirst, fLast]),
        fPos, fDept,
      );
    }

    const submit = el('button', {
      class: 'btn btn-primary btn-lg btn-block', type: 'submit',
      style: 'margin-top:4px',
    }, [icon(mode === 'login' ? 'lock' : 'user'), mode === 'login' ? 'เข้าสู่ระบบ' : 'ลงทะเบียนและเริ่มสอบ']);
    form.append(submit);

    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const fields = [fCode, fFirst, fLast, fPos].filter(Boolean);
      fields.forEach(f => f.setError(''));

      let bad = null;
      for (const f of fields) {
        if (f.input.required && !f.input.value.trim()) {
          f.setError('กรุณากรอกข้อมูลในช่องนี้');
          bad = bad || f;
        }
      }
      if (bad) { bad.input.focus(); return; }

      const payload = { emp_code: fCode.input.value.trim() };
      if (mode === 'register') {
        payload.first_name = fFirst.input.value.trim();
        payload.last_name = fLast.input.value.trim();
        payload.position = fPos.input.value.trim();
        payload.department = fDept.input.value.trim();
      }

      await withLoading(submit, async () => {
        try {
          const r = await api(mode === 'login' ? '/auth/login' : '/auth/register', { method: 'POST', body: payload });
          api.token.set(r.token);
          state.me = r.employee;
          toast(mode === 'login' ? `ยินดีต้อนรับ ${r.employee.first_name}` : 'ลงทะเบียนสำเร็จ', 'ok');
          go('#/');
          render();
        } catch (e) {
          const f = { emp_code: fCode, first_name: fFirst, last_name: fLast, position: fPos }[e.data?.field];
          if (f) { f.setError(e.message); f.input.focus(); }
          else toast(e.message, 'err');
          if (e.data?.need_register) { mode = 'register'; store.set('wesco-auth-mode', mode); paint(); }
        }
      });
    });

    card.append(form);
    host.append(card);

    if (mode === 'register' && !state.config.registration_open) {
      host.append(el('div', { style: 'margin-top:16px' },
        [note('warn', 'ขณะนี้ผู้ดูแลระบบปิดรับการลงทะเบียนชั่วคราว')]));
    }

    host.append(el('p', { class: 'small muted', style: 'text-align:center;margin-top:20px' }, [
      'สำหรับผู้ดูแลระบบ ',
      el('a', { href: '/admin.html', text: 'เข้าสู่หน้าหลังบ้าน' }),
    ]));
  };

  paint();
  setView(host);
}

/* ═══════════════════ 2 · หน้าแรก — เลือกหัวข้อสอบ ═══════════════════ */
async function viewHome() {
  const host = el('div', { class: 'stack-6' });
  const me = state.me;

  host.append(el('div', { class: 'card card-pad card-accent' }, [
    el('div', { class: 'row-between wrap' }, [
      el('div', { class: 'stack-2 grow' }, [
        el('div', { class: 'small muted', text: 'ยินดีต้อนรับ' }),
        el('h1', { style: 'font-size:1.375rem', text: `${me.first_name} ${me.last_name}` }),
        el('div', { class: 'row wrap', style: 'gap:8px;margin-top:2px' }, [
          el('span', { class: 'badge', text: me.emp_code }),
          el('span', { class: 'badge badge-info', text: me.position }),
          me.department ? el('span', { class: 'badge', text: me.department }) : null,
        ]),
      ]),
    ]),
  ]));

  const statHost = el('div');
  const listHost = el('div', { class: 'stack' }, [skeletonCards(6)]);
  host.append(statHost, el('div', { class: 'stack' }, [
    el('div', { class: 'row-between' }, [
      el('h2', { text: 'เลือกหัวข้อที่ต้องการสอบ' }),
    ]),
    listHost,
  ]));
  setView(host);

  let data, meData;
  try {
    [data, meData] = await Promise.all([api('/topics'), api('/me')]);
  } catch (e) {
    clear(listHost).append(note('dang', esc(e.message)));
    return;
  }

  /* สรุปผลของฉัน */
  const s = meData.stats || {};
  if (s.attempts) {
    statHost.append(el('div', { class: 'stat-grid' }, [
      statTile('clipboard', 'สอบไปแล้ว', `${s.attempts}`, 'ครั้ง'),
      statTile('award', 'เกรด A', `${s.a || 0}`, 'ครั้ง'),
      statTile('checkCircle', 'เกรด B', `${s.b || 0}`, 'ครั้ง'),
      statTile('clock', 'รอตรวจ', `${s.pending || 0}`, 'รายการ'),
    ]));
  }

  /* จัดกลุ่มตามหมวด */
  clear(listHost);
  if (!data.topics.length) {
    listHost.append(emptyState('book', 'ยังไม่มีหัวข้อสอบ', 'ผู้ดูแลระบบยังไม่ได้เพิ่มหัวข้อสอบเข้ามา กรุณาติดต่อหัวหน้างาน'));
    return;
  }

  const groups = {};
  for (const t of data.topics) (groups[t.category || 'ทั่วไป'] ||= []).push(t);

  for (const [cat, items] of Object.entries(groups)) {
    listHost.append(
      el('div', { class: 'row', style: 'gap:10px;margin-top:4px' }, [
        el('h3', { style: 'font-size:.8125rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3)', text: cat }),
        el('hr', { class: 'divider grow' }),
      ]),
      el('div', { class: 'topic-grid' }, items.map(t => topicCard(t, data.allow_retake))),
    );
  }
}

function statTile(iconName, label, value, unit) {
  return el('div', { class: 'stat' }, [
    el('div', { class: 'stat-label' }, [icon(iconName, 'ic-sm'), label]),
    el('div', { class: 'stat-value num' }, [value, unit ? el('span', { class: 'stat-note', style: 'font-weight:500;margin-inline-start:4px', text: unit }) : null]),
  ]);
}

function topicCard(t, allowRetake) {
  const locked = !allowRetake && t.my_attempts > 0;

  const card = el('button', {
    class: 'topic', type: 'button',
    'aria-label': `${t.title} — ${t.question_count} ข้อ`,
    onclick: () => startTopic(t, locked),
  }, [
    el('div', { class: 'topic-top' }, [
      el('div', { class: 'stack-2 grow' }, [
        el('span', { class: 'topic-code', text: t.code }),
        el('div', { class: 'topic-title', text: t.title }),
      ]),
      t.my_pending ? el('span', { class: 'grade grade-pending', title: 'รอผู้ดูแลตรวจ', text: '…' })
        : t.my_best_grade ? gradeBadge(t.my_best_grade) : null,
    ]),
    t.subtitle ? el('div', { class: 'topic-sub', text: t.subtitle }) : null,
    el('div', { class: 'topic-meta' }, [
      el('span', {}, [icon('book', 'ic-sm'), `${t.question_count} ข้อ`]),
      t.time_limit_min ? el('span', {}, [icon('clock', 'ic-sm'), `${t.time_limit_min} นาที`]) : null,
      t.ref_count ? el('span', {}, [icon('file', 'ic-sm'), `เอกสาร ${t.ref_count}`]) : null,
      t.practical_max > 0 ? el('span', {}, [icon('user', 'ic-sm'), `ปฏิบัติ ${fmtNum(t.practical_max)}`]) : null,
      t.resume_id ? el('span', { class: 'text-warn strong' }, [icon('play', 'ic-sm'), 'ทำค้างไว้']) : null,
      locked ? el('span', { class: 'muted' }, [icon('lock', 'ic-sm'), 'สอบได้ครั้งเดียว']) : null,
    ]),
  ]);
  return card;
}

async function startTopic(t, locked) {
  if (locked) {
    toast('หัวข้อนี้อนุญาตให้สอบได้เพียงครั้งเดียว', 'err');
    return;
  }

  if (t.resume_id) {
    confirmDialog({
      title: 'ทำข้อสอบต่อ',
      message: `คุณมีข้อสอบ "${t.title}" ที่ทำค้างไว้ ต้องการทำต่อหรือเริ่มใหม่?`,
      confirmLabel: 'ทำต่อ',
      onConfirm: () => { go(`#/exam/${t.resume_id}`); },
    });
    return;
  }

  const body = el('div', { class: 'stack' }, [
    el('div', { class: 'stack-2' }, [
      el('span', { class: 'topic-code', style: 'align-self:flex-start', text: t.code }),
      el('h3', { text: t.title }),
      t.subtitle ? el('p', { class: 'small muted', text: t.subtitle }) : null,
    ]),
    el('dl', { class: 'score-grid' }, [
      tile('จำนวนข้อ', `${t.question_count}`),
      tile('เวลา', t.time_limit_min ? `${t.time_limit_min} น.` : 'ไม่จำกัด'),
      tile('เอกสารอ้างอิง', t.ref_count ? `${t.ref_count}` : '—'),
      tile('ครั้งที่สอบ', `${(t.my_attempts || 0) + 1}`),
    ]),
    t.practical_max > 0
      ? note('info', `หัวข้อนี้มี<strong>คะแนนภาคปฏิบัติอีก ${fmtNum(t.practical_max)} คะแนน</strong> ซึ่งผู้ดูแล/หัวหน้างานจะเป็นผู้กรอกให้ภายหลัง เกรดสุดท้ายจะออกเมื่อตรวจครบแล้ว`)
      : null,
    t.text_count > 0
      ? note('warn', `มีคำถามแบบเขียนตอบ ${t.text_count} ข้อ ซึ่งต้องรอผู้ดูแลตรวจให้คะแนน`)
      : null,
  ]);

  modal({
    title: 'เริ่มทำแบบทดสอบ',
    body,
    actions: [
      { label: 'ยกเลิก', class: 'btn-ghost' },
      {
        label: 'เริ่มทำข้อสอบ', class: 'btn-primary', icon: 'play',
        onClick: async () => {
          try {
            const r = await api('/attempts', { method: 'POST', body: { topic_id: t.id } });
            loadExam(r);
            go(`#/exam/${r.attempt.id}`);
          } catch (e) { toast(e.message, 'err'); return false; }
        },
      },
    ],
  });

  function tile(label, value) {
    return el('div', { class: 'score-tile' }, [el('dt', { text: label }), el('dd', { class: 'num', text: value })]);
  }
}

/* ═══════════════════ 3 · ทำข้อสอบ ═══════════════════ */
function loadExam(payload) {
  const saved = store.json(`wesco-exam-${payload.attempt.id}`, {});
  state.exam = {
    ...payload,
    answers: saved.answers || {},
    index: Math.min(saved.index || 0, payload.questions.length - 1),
    deadline: payload.topic.time_limit_min
      ? new Date(tsOf(payload.attempt.started_at) + payload.topic.time_limit_min * 60000)
      : null,
  };
}

const tsOf = iso => new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z').getTime();

const saveExam = () => {
  if (!state.exam) return;
  store.setJson(`wesco-exam-${state.exam.attempt.id}`, {
    answers: state.exam.answers, index: state.exam.index,
  });
};

async function viewExam(attemptId) {
  if (!state.exam || state.exam.attempt.id !== attemptId) {
    setView(el('div', { class: 'stack' }, [skeletonCards(1), el('div', { class: 'skel skel-line' })]));
    try {
      const r = await api(`/attempts/${attemptId}`);
      if (r.attempt.status !== 'in_progress') return go(`#/result/${attemptId}`);
      loadExam(r);
    } catch (e) {
      setView(note('dang', esc(e.message)));
      return;
    }
  }
  paintExam();
}

function paintExam() {
  const ex = state.exam;
  const q = ex.questions[ex.index];
  const total = ex.questions.length;
  const answered = countAnswered();

  const head = el('div', { class: 'exam-head' }, [
    el('div', { class: 'shell exam-head-in' }, [
      el('div', { class: 'row-between' }, [
        el('button', {
          class: 'btn btn-ghost btn-sm', type: 'button', onclick: leaveExam,
        }, [icon('arrowLeft', 'ic-sm'), 'ออก']),
        el('div', { class: 'stack-2', style: 'text-align:center;flex:1;min-width:0' }, [
          el('div', { class: 'small strong', style: 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis', text: ex.topic.title }),
          el('div', { class: 'small muted num', text: `ทำแล้ว ${answered}/${total} ข้อ` }),
        ]),
        ex.deadline ? el('span', { class: 'timer', id: 'timer' }, [icon('clock', 'ic-sm'), el('span', { class: 'num', text: '--:--' })])
          : el('span', { style: 'width:52px' }),
      ]),
      el('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': String(answered), 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-label': 'ความคืบหน้า' },
        [el('div', { class: 'progress-bar', style: `width:${(answered / total) * 100}%` })]),
      el('div', { class: 'qdots' }, ex.questions.map((qq, i) =>
        el('button', {
          class: `qdot${i === ex.index ? ' current' : hasAnswer(qq) ? ' done' : ''}`,
          type: 'button', 'aria-label': `ไปข้อที่ ${i + 1}`,
          onclick: () => { ex.index = i; saveExam(); paintExam(); },
        }, [String(i + 1)])
      )),
    ]),
  ]);

  const body = el('div', { class: 'shell-narrow', style: 'margin-inline:auto;padding-top:24px' }, [
    el('div', { class: 'stack' }, [
      el('div', { class: 'row-between' }, [
        el('span', { class: 'qnum', text: `ข้อ ${ex.index + 1} / ${total}` }),
        ex.refs.length
          ? el('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: showRefs }, [icon('file', 'ic-sm'), 'เอกสารอ้างอิง'])
          : null,
      ]),
      el('h1', { class: 'qtext', text: q.text }),
      q.image_url ? el('div', {
        class: 'qimage', role: 'button', tabindex: '0',
        'aria-label': 'ดูรูปประกอบขนาดเต็ม',
        onclick: () => lightbox(q.image_url, 'รูปประกอบคำถาม'),
        onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lightbox(q.image_url, 'รูปประกอบคำถาม'); } },
      }, [el('img', { src: q.image_url, alt: 'รูปประกอบคำถาม', loading: 'lazy' })]) : null,
      q.qtype === 'text' ? textAnswer(q) : choiceList(q),
    ]),
  ]);

  const isLast = ex.index === total - 1;
  const foot = el('div', { class: 'exam-foot' }, [
    el('div', { class: 'shell-narrow row', style: 'margin-inline:auto' }, [
      el('button', {
        class: 'btn', type: 'button', disabled: ex.index === 0,
        onclick: () => { ex.index--; saveExam(); paintExam(); },
      }, [icon('chevronL', 'ic-sm'), 'ก่อนหน้า']),
      isLast
        ? el('button', { class: 'btn btn-primary', type: 'button', onclick: reviewAndSubmit }, [icon('check', 'ic-sm'), 'ตรวจทานและส่ง'])
        : el('button', {
          class: 'btn btn-primary', type: 'button',
          onclick: () => { ex.index++; saveExam(); paintExam(); },
        }, ['ถัดไป', icon('chevronR', 'ic-sm')]),
    ]),
  ]);

  clear(view).append(head, body, foot);
  window.scrollTo({ top: 0, behavior: 'instant' });
  startTimer();
}

const hasAnswer = q => {
  const v = state.exam.answers[q.id];
  return q.qtype === 'text' ? !!(v && String(v).trim()) : !!v;
};
const countAnswered = () => state.exam.questions.filter(hasAnswer).length;

function choiceList(q) {
  const ex = state.exam;
  return el('div', { class: 'choices', role: 'radiogroup', 'aria-label': 'ตัวเลือกคำตอบ' },
    q.choices.map(c => {
      const selected = ex.answers[q.id] === c.id;
      const input = el('input', { type: 'radio', name: `q${q.id}`, value: String(c.id) });
      input.checked = selected;
      const label = el('label', { class: `choice${selected ? ' selected' : ''}` }, [
        input,
        el('span', { class: 'choice-key', text: c.label }),
        el('span', { class: 'choice-text', text: c.text }),
      ]);
      input.addEventListener('change', () => {
        ex.answers[q.id] = c.id;
        saveExam();
        // ไปข้อถัดไปให้อัตโนมัติ เพื่อลดการกดบนมือถือ
        if (ex.index < ex.questions.length - 1) setTimeout(() => { ex.index++; paintExam(); }, 180);
        else paintExam();
      });
      return label;
    }));
}

function textAnswer(q) {
  const ex = state.exam;
  const ta = el('textarea', {
    class: 'textarea', rows: 5, placeholder: 'พิมพ์คำตอบของคุณที่นี่…',
    'aria-label': 'คำตอบแบบเขียนตอบ',
  });
  ta.value = ex.answers[q.id] || '';
  ta.addEventListener('input', () => { ex.answers[q.id] = ta.value; saveExam(); });
  ta.addEventListener('blur', paintDots);
  return el('div', { class: 'stack-2' }, [
    ta,
    el('div', { class: 'help', text: 'คำถามข้อนี้เป็นแบบเขียนตอบ ผู้ดูแลระบบจะเป็นผู้ตรวจให้คะแนน' }),
  ]);
}

function paintDots() {
  const ex = state.exam;
  if (!ex) return;
  const dots = view.querySelectorAll('.qdot');
  ex.questions.forEach((qq, i) => {
    const d = dots[i];
    if (!d) return;
    d.className = `qdot${i === ex.index ? ' current' : hasAnswer(qq) ? ' done' : ''}`;
  });
  const n = countAnswered();
  const bar = view.querySelector('.progress-bar');
  if (bar) bar.style.width = `${(n / ex.questions.length) * 100}%`;
}

let timerId;
function startTimer() {
  clearInterval(timerId);
  const ex = state.exam;
  if (!ex || !ex.deadline) return;
  const tick = () => {
    const node = document.getElementById('timer');
    if (!node) { clearInterval(timerId); return; }
    const left = (ex.deadline - Date.now()) / 1000;
    node.querySelector('span').textContent = clock(left);
    node.className = 'timer' + (left <= 60 ? ' danger' : left <= 300 ? ' warn' : '');
    if (left <= 0) {
      clearInterval(timerId);
      toast('หมดเวลาแล้ว ระบบกำลังส่งคำตอบให้อัตโนมัติ', 'err');
      submitExam(true);
    }
  };
  tick();
  timerId = setInterval(tick, 1000);
}

function showRefs() {
  const ex = state.exam;
  const body = el('div', { class: 'stack' }, ex.refs.map(r => el('div', { class: 'stack-2' }, [
    el('h4', { text: r.title }),
    r.image_url ? el('div', {
      class: 'qimage', style: 'margin:0', role: 'button', tabindex: '0',
      'aria-label': `ดู ${r.title} ขนาดเต็ม`,
      onclick: () => lightbox(r.image_url, r.title),
      onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lightbox(r.image_url, r.title); } },
    }, [el('img', { src: r.image_url, alt: r.title, loading: 'lazy' })]) : null,
    r.html ? el('div', { class: 'table-wrap', style: 'max-height:56vh;overflow:auto', html: `<div class="ref-table-host">${r.html}</div>` }) : null,
  ])));
  body.querySelectorAll('table').forEach(t => t.classList.add('ref-table'));
  modal({ title: 'เอกสารอ้างอิง', body, wide: true });
}

function leaveExam() {
  confirmDialog({
    title: 'ออกจากข้อสอบ',
    message: 'คำตอบที่ทำไว้จะถูกบันทึกในเครื่องนี้ และกลับมาทำต่อได้ภายหลัง',
    confirmLabel: 'ออกจากข้อสอบ',
    onConfirm: () => { clearInterval(timerId); saveExam(); state.exam = null; go('#/'); },
  });
}

function reviewAndSubmit() {
  const ex = state.exam;
  const missing = ex.questions.map((q, i) => ({ q, i })).filter(({ q }) => !hasAnswer(q));

  const body = el('div', { class: 'stack' }, [
    el('dl', { class: 'score-grid' }, [
      el('div', { class: 'score-tile' }, [el('dt', { text: 'ทั้งหมด' }), el('dd', { class: 'num', text: String(ex.questions.length) })]),
      el('div', { class: 'score-tile' }, [el('dt', { text: 'ตอบแล้ว' }), el('dd', { class: 'num text-ok', text: String(countAnswered()) })]),
      el('div', { class: 'score-tile' }, [el('dt', { text: 'ยังไม่ตอบ' }), el('dd', { class: 'num' + (missing.length ? ' text-dang' : ''), text: String(missing.length) })]),
    ]),
    missing.length
      ? el('div', { class: 'stack-2' }, [
        note('warn', `ยังมี <strong>${missing.length} ข้อ</strong> ที่ยังไม่ได้ตอบ ข้อที่ไม่ตอบจะได้ 0 คะแนน`),
        el('div', { class: 'chip-row' }, missing.slice(0, 24).map(({ i }) =>
          el('button', {
            class: 'chip', type: 'button',
            onclick: ev => { ex.index = i; paintExam(); ev.target.closest('.overlay')?.remove(); document.body.style.overflow = ''; },
          }, [`ข้อ ${i + 1}`]))),
      ])
      : note('ok', 'ตอบครบทุกข้อแล้ว พร้อมส่งคำตอบ'),
  ]);

  modal({
    title: 'ตรวจทานก่อนส่ง',
    body,
    actions: [
      { label: 'กลับไปแก้ไข', class: 'btn-ghost' },
      { label: 'ส่งคำตอบ', class: 'btn-primary', icon: 'check', onClick: () => submitExam(false) },
    ],
  });
}

let submitting = false;
async function submitExam(auto) {
  if (submitting) return;
  submitting = true;
  clearInterval(timerId);
  const ex = state.exam;

  const answers = ex.questions.map(q => q.qtype === 'text'
    ? { question_id: q.id, text_answer: ex.answers[q.id] || '' }
    : { question_id: q.id, choice_id: ex.answers[q.id] || null });

  try {
    const r = await api(`/attempts/${ex.attempt.id}/submit`, { method: 'POST', body: { answers } });
    store.del(`wesco-exam-${ex.attempt.id}`);
    state.exam = null;
    state.lastResult = r;
    go(`#/result/${r.attempt.id}`);
    render();
    if (!auto) toast('ส่งคำตอบเรียบร้อย', 'ok');
  } catch (e) {
    toast(e.message, 'err');
    submitting = false;
    return false;
  }
  submitting = false;
}

/* ═══════════════════ 4 · ผลสอบ ═══════════════════ */
async function viewResult(attemptId) {
  let r = state.lastResult && state.lastResult.attempt.id === attemptId ? state.lastResult : null;
  state.lastResult = null;

  if (!r) {
    setView(el('div', { class: 'skel skel-card', style: 'height:280px' }));
    try { r = await api(`/attempts/${attemptId}`); }
    catch (e) { setView(note('dang', esc(e.message))); return; }
  }

  const a = r.attempt;
  const pending = !!a.needs_review;

  const host = el('div', { class: 'stack-6 shell-narrow', style: 'margin-inline:auto' });

  host.append(el('div', { class: 'card' }, [
    el('div', { class: 'result-hero' }, [
      gradeRing(a.percent, a.grade),
      el('div', { class: 'stack-2' }, [
        el('h1', { style: 'font-size:1.25rem', text: r.topic.title }),
        el('div', { class: 'small muted', text: `${r.topic.code} · ส่งเมื่อ ${fmtDate(a.submitted_at)}` }),
      ]),
      pending
        ? el('span', { class: 'badge badge-warn' }, [icon('clock', 'ic-sm'), 'รอผู้ดูแลตรวจคะแนนส่วนที่เหลือ'])
        : el('span', { class: `badge badge-${a.grade === 'A' ? 'ok' : a.grade === 'B' ? 'info' : 'dang'}` },
          [icon(a.grade === 'C' ? 'alert' : 'checkCircle', 'ic-sm'), `เกรด ${a.grade} — ${gradeLabel(a.grade)}`]),
    ]),
    el('div', { style: 'padding:0 20px 20px' }, [
      el('dl', { class: 'score-grid' }, [
        scoreTile('คะแนนข้อสอบ', `${fmtNum(a.quiz_score)}/${fmtNum(a.quiz_max)}`),
        a.practical_max > 0
          ? scoreTile('ภาคปฏิบัติ', a.practical_score === null ? 'รอตรวจ' : `${fmtNum(a.practical_score)}/${fmtNum(a.practical_max)}`)
          : scoreTile('ภาคปฏิบัติ', '—'),
        scoreTile('คะแนนรวม', a.total_score === null ? 'รอตรวจ' : `${fmtNum(a.total_score)}/${fmtNum(a.total_max)}`),
        scoreTile('เวลาที่ใช้', fmtDuration(a.duration_sec)),
      ]),
    ]),
  ]));

  if (pending) {
    host.append(note('info', 'ผลสอบส่วนที่เป็นปรนัยคำนวณให้แล้ว ส่วนคะแนนภาคปฏิบัติ/ข้อเขียน ผู้ดูแลระบบจะกรอกให้ภายหลัง <strong>เกรดสุดท้ายจะแสดงเมื่อตรวจครบ</strong>'));
  }
  if (a.review_note) {
    host.append(el('div', { class: 'card card-pad' }, [
      el('h3', { style: 'margin-bottom:6px', text: 'หมายเหตุจากผู้ตรวจ' }),
      el('p', { class: 'small', style: 'white-space:pre-wrap', text: a.review_note }),
    ]));
  }

  host.append(el('div', { class: 'row', style: 'gap:8px' }, [
    el('button', { class: 'btn btn-primary grow', type: 'button', onclick: () => go('#/') }, [icon('home', 'ic-sm'), 'กลับหน้าแรก']),
    el('button', { class: 'btn grow', type: 'button', onclick: () => go('#/history') }, [icon('history', 'ic-sm'), 'ประวัติการสอบ']),
  ]));

  /* เฉลยรายข้อ */
  if (r.show_answers && r.answers.length) {
    const list = el('div', {});
    for (const ans of r.answers) {
      const correct = ans.is_correct === 1;
      const ungraded = ans.is_correct === null;
      list.append(el('div', { class: 'review-item' }, [
        el('div', { class: 'row', style: 'align-items:flex-start;gap:10px' }, [
          el('span', {
            class: `grade ${ungraded ? 'grade-pending' : correct ? 'grade-A' : 'grade-C'}`,
            style: 'width:26px;height:26px;font-size:.75rem',
            'aria-label': ungraded ? 'รอตรวจ' : correct ? 'ถูก' : 'ผิด',
            text: String(ans.seq),
          }),
          el('div', { class: 'stack-2 grow' }, [
            el('div', { class: 'strong', style: 'font-size:.9375rem;line-height:1.5', text: ans.question_text }),
            ans.qtype === 'text'
              ? el('div', { class: 'small' }, [
                el('span', { class: 'muted', text: 'คำตอบของคุณ: ' }),
                el('span', { style: 'white-space:pre-wrap', text: ans.text_answer || '(ไม่ได้ตอบ)' }),
                ungraded ? el('div', { class: 'badge badge-warn', style: 'margin-top:6px' }, ['รอผู้ดูแลตรวจ']) : null,
              ])
              : el('div', { class: 'choices', style: 'margin-top:4px' }, ans.choices.map(c => {
                const chosen = c.id === ans.choice_id;
                const cls = c.is_correct ? ' correct' : chosen ? ' wrong' : '';
                return el('div', { class: `choice${cls}`, style: 'min-height:auto;padding:8px 12px' }, [
                  el('span', { class: 'choice-key', text: c.label }),
                  el('span', { class: 'choice-text', style: 'font-size:.875rem', text: c.text }),
                  c.is_correct ? icon('check', 'ic-sm') : chosen ? icon('x', 'ic-sm') : null,
                ]);
              })),
            ans.explanation ? el('div', { class: 'note note-info small', style: 'margin-top:6px' }, [ans.explanation]) : null,
          ]),
        ]),
      ]));
    }
    host.append(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('h2', { text: 'เฉลยและคำตอบของคุณ' })]),
      el('div', { style: 'padding:0 20px' }, [list]),
    ]));
  }

  setView(host);
}

const scoreTile = (label, value) =>
  el('div', { class: 'score-tile' }, [el('dt', { text: label }), el('dd', { class: 'num', text: value })]);

/* ═══════════════════ 5 · ประวัติการสอบ ═══════════════════ */
async function viewHistory() {
  const host = el('div', { class: 'stack shell-narrow', style: 'margin-inline:auto' });
  host.append(el('div', { class: 'row-between' }, [
    el('h1', { style: 'font-size:1.25rem', text: 'ประวัติการสอบ' }),
    el('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => go('#/') }, [icon('home', 'ic-sm'), 'หน้าแรก']),
  ]));
  const listHost = el('div', { class: 'stack' }, [el('div', { class: 'skel skel-card' })]);
  host.append(listHost);
  setView(host);

  let data;
  try { data = await api('/history'); }
  catch (e) { clear(listHost).append(note('dang', esc(e.message))); return; }

  clear(listHost);
  if (!data.history.length) {
    listHost.append(emptyState('history', 'ยังไม่มีประวัติการสอบ', 'เมื่อทำแบบทดสอบเสร็จ ผลสอบจะแสดงที่นี่',
      el('button', { class: 'btn btn-primary', type: 'button', onclick: () => go('#/') }, ['เลือกหัวข้อสอบ'])));
    return;
  }

  const card = el('div', { class: 'card' });
  for (const h of data.history) {
    card.append(el('button', {
      class: 'list-row', type: 'button',
      style: 'width:100%;text-align:start;background:none;border:0;border-bottom:1px solid var(--border);cursor:pointer',
      onclick: () => go(`#/result/${h.id}`),
    }, [
      h.needs_review ? el('span', { class: 'grade grade-pending', text: '…' }) : gradeBadge(h.grade),
      el('div', { class: 'stack-2 grow', style: 'min-width:0' }, [
        el('div', { class: 'strong', style: 'font-size:.9375rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', text: h.topic_title }),
        el('div', { class: 'small muted', text: `${h.topic_code} · ${fmtDate(h.submitted_at)}` }),
      ]),
      el('div', { style: 'text-align:end;flex:none' }, [
        el('div', { class: 'strong num', text: h.percent === null ? 'รอตรวจ' : `${fmtNum(h.percent)}%` }),
        el('div', { class: 'small muted num', text: `${fmtNum(h.quiz_score)}/${fmtNum(h.quiz_max)}` }),
      ]),
      icon('chevronR', 'ic-sm'),
    ]));
  }
  listHost.append(card);
}
