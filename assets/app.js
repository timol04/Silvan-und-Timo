(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    kids.flat().forEach(k => n.append(k));
    return n;
  };
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem('st:' + k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem('st:' + k, JSON.stringify(v)); } catch { /* Speicher gesperrt, Demo läuft trotzdem */ } },
    del(k) { try { localStorage.removeItem('st:' + k); } catch { /* ignorieren */ } },
  };
  const pad = n => String(n).padStart(2, '0');
  const mmss = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };

  /* ---------- Kopfzeile: Uhr + Servicestatus ---------- */
  (() => {
    const clock = $('#clock'), text = $('#statusText'), dot = $('#statusDot');
    const tick = () => {
      const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
      clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const lunch = h >= 11 && h < 14, dinner = h >= 17.5 && h < 23;
      text.textContent = lunch ? 'Mittagsservice' : dinner ? 'Abendservice' : 'Pass ruhig';
      dot.classList.toggle('rest', !(lunch || dinner));
    };
    tick(); setInterval(tick, 20000);
  })();

  /* ---------- 1. Bon-Schiene ---------- */
  (() => {
    const MENU = ['Rösti mit Spiegelei', 'Zürcher Geschnetzeltes', 'Cordon bleu', 'Wurstsalat', 'Tagessuppe', 'Pommes frites', 'Hauptsalat', 'Panna cotta'];
    const tableSel = $('#bonTable'), menuEl = $('#bonMenu'), draftEl = $('#bonDraft'), sendBtn = $('#bonSend');
    const kitchen = $('#bonKitchen'), emptyEl = $('#bonEmpty');
    const statOpen = $('#statOpen'), statDone = $('#statDone'), statAvg = $('#statAvg');

    for (let i = 1; i <= 12; i++) tableSel.append(el('option', { value: i, textContent: `Tisch ${i}` }));
    tableSel.value = 4;

    const seed = () => {
      const now = Date.now();
      return { next: 3, done: 0, doneMs: 0, open: [
        { id: 1, table: 9, lines: { 'Tagessuppe': 4, 'Zürcher Geschnetzeltes': 2 }, t0: now - 7 * 60000 },
        { id: 2, table: 2, lines: { 'Cordon bleu': 1, 'Pommes frites': 1, 'Hauptsalat': 1 }, t0: now - 2 * 60000 - 20000 },
      ] };
    };
    let state = store.get('bon', null) || seed();
    let draft = {};
    const save = () => store.set('bon', state);

    MENU.forEach(name => {
      const b = el('button', { type: 'button', textContent: name });
      b.dataset.name = name;
      b.addEventListener('click', () => { draft[name] = (draft[name] || 0) + 1; renderDraft(); });
      menuEl.append(b);
    });

    function renderDraft() {
      menuEl.querySelectorAll('button').forEach(b => {
        b.querySelector('.n')?.remove();
        if (draft[b.dataset.name]) b.append(el('span', { className: 'n', textContent: draft[b.dataset.name] }));
      });
      draftEl.replaceChildren();
      const names = Object.keys(draft);
      if (!names.length) { draftEl.append(el('p', { className: 'none', textContent: 'Noch nichts gewählt. Gerichte antippen.' })); sendBtn.disabled = true; return; }
      const ul = el('ul');
      names.forEach(n => {
        const minus = el('button', { type: 'button', textContent: '−', ariaLabel: `${n} entfernen` });
        minus.addEventListener('click', () => { if (--draft[n] <= 0) delete draft[n]; renderDraft(); });
        ul.append(el('li', {}, el('span', { textContent: `${draft[n]}× ${n}` }), minus));
      });
      draftEl.append(ul);
      sendBtn.disabled = false;
    }

    sendBtn.addEventListener('click', () => {
      state.open.push({ id: state.next++, table: +tableSel.value, lines: { ...draft }, t0: Date.now() });
      draft = {}; save(); renderDraft(); renderKitchen(); stats();
    });

    function renderKitchen() {
      kitchen.replaceChildren();
      state.open.slice().sort((a, b) => a.t0 - b.t0).forEach(o => {
        const timer = el('span', { className: 'timer' });
        timer.dataset.t0 = o.t0;
        const done = el('button', { type: 'button', textContent: 'Fertig' });
        done.addEventListener('click', () => finish(o.id, li));
        const li = el('li', { className: 'ticket' },
          el('b', { textContent: `TISCH ${o.table}` }),
          el('span', { textContent: new Date(o.t0).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) }),
          el('hr'),
          el('ul', {}, Object.entries(o.lines).map(([n, q]) => el('li', { textContent: `${q}× ${n}` }))),
          timer, done);
        kitchen.append(li);
      });
      emptyEl.hidden = state.open.length > 0;
      timers(); stats();
    }

    function finish(id, li) {
      li.classList.add('leaving');
      const go = () => {
        const i = state.open.findIndex(o => o.id === id);
        if (i < 0) return;
        const [o] = state.open.splice(i, 1);
        state.done++; state.doneMs += Date.now() - o.t0;
        save(); renderKitchen();
      };
      matchMedia('(prefers-reduced-motion: reduce)').matches ? go() : setTimeout(go, 420);
    }

    function timers() {
      kitchen.querySelectorAll('.timer').forEach(t => {
        const ms = Date.now() - +t.dataset.t0;
        t.textContent = mmss(ms);
        t.classList.toggle('late', ms >= 5 * 60000 && ms < 10 * 60000);
        t.classList.toggle('vlate', ms >= 10 * 60000);
      });
    }
    function stats() {
      statOpen.textContent = state.open.length;
      statDone.textContent = state.done;
      statAvg.textContent = state.done ? mmss(state.doneMs / state.done) : '–';
    }

    $('#bonReset').addEventListener('click', () => { store.del('bon'); state = seed(); draft = {}; save(); renderDraft(); renderKitchen(); });
    renderDraft(); renderKitchen(); setInterval(timers, 1000);
  })();

  /* ---------- 2. Reservation ---------- */
  (() => {
    const CAP = [2, 2, 2, 4, 4, 4, 6, 8];
    const SLOTS = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
    const days = [0, 1, 2].map(i => {
      const d = new Date(); d.setDate(d.getDate() + i);
      const label = i === 0 ? 'Heute' : i === 1 ? 'Morgen' : d.toLocaleDateString('de-CH', { weekday: 'long' });
      return { label, long: i === 0 ? 'heute' : i === 1 ? 'morgen' : d.toLocaleDateString('de-CH', { weekday: 'long' }), date: d.toLocaleDateString('de-CH', { day: 'numeric', month: 'numeric' }) };
    });

    const seed = () => ({
      '0|19:00': { 0: { name: 'Meier', pax: 2 }, 3: { name: 'Keller', pax: 4 }, 6: { name: 'Geburtstag Frei', pax: 6 } },
      '0|19:30': { 4: { name: 'Brunner', pax: 3 }, 7: { name: 'Firma Roth', pax: 8 } },
      '0|20:00': { 1: { name: 'Huber', pax: 2 }, 2: { name: 'Steiner', pax: 2 }, 3: { name: 'Gerber', pax: 4 }, 4: { name: 'Fischer', pax: 4 }, 5: { name: 'Weber', pax: 4 }, 6: { name: 'Baumann', pax: 5 }, 7: { name: 'Zimmermann', pax: 7 }, 0: { name: 'Koch', pax: 2 } },
      '1|19:00': { 3: { name: 'Schmid', pax: 4 } },
    });
    let book = store.get('res', null) || seed();
    let day = 0, pax = 2, slot = null, fresh = null;

    const daysEl = $('#resDays'), slotsEl = $('#resSlots'), tablesEl = $('#resTables'), msg = $('#resMsg');
    const paxOut = $('#paxOut'), nameIn = $('#resName'), sms = $('#resSms'), smsText = $('#resSmsText');
    const key = (d, s) => `${d}|${s}`;
    const at = (d, s) => book[key(d, s)] || {};
    const freeFor = (d, s, p) => CAP.map((c, i) => ({ c, i })).filter(t => t.c >= p && !at(d, s)[t.i]).sort((a, b) => a.c - b.c);
    const setMsg = (t, cls = '') => { msg.textContent = t; msg.className = 'form-msg ' + cls; };

    function renderDays() {
      daysEl.querySelectorAll('button').forEach(b => b.remove());
      days.forEach((d, i) => {
        const b = el('button', { type: 'button', ariaPressed: String(i === day) }, d.label, el('small', { textContent: d.date }));
        b.addEventListener('click', () => { day = i; slot = null; fresh = null; sms.hidden = true; setMsg(''); renderAll(); });
        daysEl.append(b);
      });
    }
    function renderSlots() {
      slotsEl.querySelectorAll('button').forEach(b => b.remove());
      SLOTS.forEach(s => {
        const n = freeFor(day, s, pax).length;
        const b = el('button', { type: 'button', disabled: n === 0, ariaPressed: String(slot === s) }, s, el('small', { textContent: n ? `${n} frei` : 'voll' }));
        b.addEventListener('click', () => { slot = s; setMsg(''); renderAll(); });
        slotsEl.append(b);
      });
    }
    function renderFloor() {
      $('#floorLabel').textContent = slot ? `${days[day].label}, ${slot}` : 'Zeit wählen';
      tablesEl.replaceChildren();
      const cur = slot ? at(day, slot) : {};
      CAP.forEach((c, i) => {
        const t = cur[i];
        const n = el('div', { className: 'tbl' + (t ? ' taken' : '') + (fresh === i && t ? ' new' : '') },
          el('b', { textContent: `T${i + 1}` }),
          el('span', { textContent: `${c} Plätze` }),
          el('span', { className: 'who', textContent: t ? `${t.name} · ${t.pax}` : slot ? 'frei' : '' }));
        tablesEl.append(n);
      });
    }
    const renderAll = () => { paxOut.textContent = pax; renderDays(); renderSlots(); renderFloor(); };

    $('#paxMinus').addEventListener('click', () => { pax = Math.max(1, pax - 1); if (slot && !freeFor(day, slot, pax).length) slot = null; renderAll(); });
    $('#paxPlus').addEventListener('click', () => { pax = Math.min(8, pax + 1); if (slot && !freeFor(day, slot, pax).length) slot = null; renderAll(); });

    $('#resForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = nameIn.value.trim();
      if (!slot) return setMsg('Bitte eine Zeit wählen.', 'err');
      if (!name) { nameIn.focus(); return setMsg('Bitte einen Namen eingeben.', 'err'); }
      const t = freeFor(day, slot, pax)[0];
      if (!t) {
        const alt = SLOTS.find(s => freeFor(day, s, pax).length);
        return setMsg(alt ? `Um ${slot} ist nichts mehr frei. Nächster Platz: ${alt}.` : 'Heute ist leider alles voll.', 'err');
      }
      const k = key(day, slot);
      book[k] = { ...(book[k] || {}), [t.i]: { name, pax } };
      store.set('res', book); fresh = t.i;
      smsText.textContent = `Hallo ${name}, Ihr Tisch für ${pax} ${pax === 1 ? 'Person' : 'Personen'} ist ${days[day].long} um ${slot} Uhr reserviert (Tisch ${t.i + 1}). Wir freuen uns auf Sie! Falls es nicht klappt: einfach mit NEIN antworten.`;
      sms.hidden = false;
      setMsg(`Tisch ${t.i + 1} vergeben (${t.c} Plätze).`, 'ok');
      nameIn.value = '';
      renderAll();
    });
    $('#resReset').addEventListener('click', () => { store.del('res'); book = seed(); slot = null; fresh = null; sms.hidden = true; setMsg(''); renderAll(); });
    renderAll();
  })();

  /* ---------- 3. Dienstplan ---------- */
  (() => {
    const PEOPLE = ['Anna', 'Luca', 'Meret', 'Dario'];
    const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const SH = { '': { l: '–', h: 0 }, F: { l: 'F', h: 8, start: 7, end: 15 }, T: { l: 'T', h: 9, start: 10, end: 22 }, S: { l: 'S', h: 8, start: 16, end: 24 } };
    const ORDER = ['', 'F', 'T', 'S'];
    const seed = () => [
      ['F', 'F', '', 'F', 'F', 'S', ''],
      ['S', 'S', '', 'F', 'F', 'T', ''],
      ['', 'F', 'F', '', 'S', 'S', 'F'],
      ['T', '', 'T', 'S', '', 'T', 'S'],
    ];
    let grid = store.get('plan', null) || seed();
    const table = $('#plan'), alertsEl = $('#planAlerts');

    // Ruhezeit zwischen Ende eines Dienstes und Beginn des nächsten am Folgetag
    const restShort = (p, d) => {
      const a = SH[grid[p][d]], b = SH[grid[p][d + 1]];
      return a && b && a.end && b.start && (24 - a.end + b.start) < 11;
    };

    function render() {
      table.querySelectorAll('thead, tbody, tfoot').forEach(n => n.remove());
      const head = el('thead', {}, el('tr', {}, el('th'), DAYS.map(d => el('th', { scope: 'col', textContent: d })), el('th', { scope: 'col', textContent: 'Std.' })));
      const body = el('tbody');
      const msgs = [];
      PEOPLE.forEach((name, p) => {
        const hours = grid[p].reduce((s, c) => s + SH[c].h, 0);
        const tr = el('tr', {}, el('th', { scope: 'row', className: 'who', textContent: name }));
        grid[p].forEach((c, d) => {
          const warn = restShort(p, d) || (d > 0 && restShort(p, d - 1));
          const b = el('button', { type: 'button', className: `cell ${c.toLowerCase()}${warn ? ' warn' : ''}`, textContent: SH[c].l });
          b.ariaLabel = `${name}, ${DAYS[d]}: ${c ? { F: 'Früh', T: 'Geteilt', S: 'Spät' }[c] : 'frei'}`;
          b.addEventListener('click', () => { grid[p][d] = ORDER[(ORDER.indexOf(c) + 1) % ORDER.length]; store.set('plan', grid); render(); });
          tr.append(el('td', {}, b));
          if (d < 6 && restShort(p, d)) msgs.push(`${name}: ${DAYS[d]} ${c} → ${DAYS[d + 1]} ${grid[p][d + 1]}, nur ${24 - SH[c].end + SH[grid[p][d + 1]].start} Std. Ruhezeit.`);
        });
        tr.append(el('td', { className: 'hrs' + (hours > 45 ? ' many' : ''), textContent: hours }));
        body.append(tr);
        if (hours > 45) msgs.push(`${name}: ${hours} Std. in dieser Woche.`);
      });

      const foot = el('tfoot', {}, el('tr', {}, el('th', { scope: 'row', textContent: 'Besetzt' }),
        DAYS.map((_, d) => {
          const n = PEOPLE.filter((_, p) => grid[p][d]).length;
          if (!n) msgs.push(`${DAYS[d]}: niemand eingeteilt.`);
          return el('td', { className: n ? '' : 'zero', textContent: n ? `${n} P.` : 'leer' });
        }), el('td')));
      table.append(head, body, foot);

      alertsEl.replaceChildren(...(msgs.length ? msgs.map(m => el('p', { textContent: m })) : [el('p', { className: 'fine-ok', textContent: 'Plan passt. Keine Konflikte gefunden.' })]));
    }
    $('#planReset').addEventListener('click', () => { store.del('plan'); grid = seed(); render(); });
    render();
  })();

  /* ---------- Kontakt ---------- */
  $('#contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = `Betrieb: ${f.get('betrieb')}\nName: ${f.get('name')}\n\nWas nervt im Alltag am meisten?\n${f.get('problem') || '(noch offen)'}\n`;
    location.href = `mailto:kontakt@example.ch?subject=${encodeURIComponent('Anfrage von ' + f.get('betrieb'))}&body=${encodeURIComponent(body)}`;
  });
})();
