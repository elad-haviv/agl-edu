/* Module J: fault-finding games on a runway edge circuit. "Find the short" (J3) hides earth faults;
   "Find the open circuit" (J4) hides breaks in the loop. Everything happens on one drawing: the circuit map on top, a close-up of where you stand
   (the vault or a light base) and an insulation tester whose leads you clip on yourself.
   Loop positions: the vault OUT terminal is 0, base j sits at j, the vault RET terminal is N+1.
   Unplugging the primary connector on side s of base j (s = -1 towards base j-1, +1 towards j+1)
   splits the loop at j + 0.25s. Each hidden fault sits at p: in a cable span (k + 0.5), in a
   cable-side connector (j + 0.3s) or in the isolating transformer (j). An open-circuit fault also
   splits the loop at p, and earthing jumpers bond chosen pieces of loop to earth so that a
   continuity test from any base shows whether that piece still reaches the jumper. */
(function () {
  const LEVELS = { easy: 12, normal: 24, hard: 40 };
  const VOLTS = [0, 250, 500, 1000, 2500, 5000];   // 0 is the low-ohm continuity range
  const COST = { isolate: 10, cutout: 2, lid: 10, lidClose: 5, unplug: 2, replug: 3, clip: 1, conn: 30, txr: 45, span: 120 };
  const SPEED = 4;      // test seconds per real second
  const LOW = 50;       // MΩ: a settled reading below this marks the section faulty on the map
  const MAXR = 1e5;     // MΩ: the tester reads up to 100 GΩ
  const MAXOHM = 2000;  // Ω: the continuity range reads OL above this
  const JPARK = [[44, 679], [88, 679]];
  const JACK = { red: [614, 612], black: [614, 660] };
  const PARK = { red: [572, 612], black: [572, 660] };
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const T = (s, v) => AGL.t(s, v);
  const iso = s => "⁦" + s + "⁩";   // keeps numbers and units in order inside Hebrew text
  const rnd = n => Math.floor(Math.random() * n);
  const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  const mx = (s, x) => (s < 0 ? x : 580 - x);   // mirror close-up geometry for the +1 side

  const vName = v => (v === 0 ? "Ω" : v >= 1000 ? v / 1000 + "k" : String(v));

  function Game(host, mode) {
  const OPEN = mode === "open";
  const st = { level: "normal", diff: "medium", volt: OPEN ? 0 : 1000 };
  let svg = null, raf = 0;
  const vText = v => (v === 0 ? T("continuity") : iso(v + " V"));

  function newGame() {
    cancelAnimationFrame(raf);
    const N = LEVELS[st.level];
    const faults = OPEN ? makeOpens(N, st.diff) : makeFaults(N, st.diff);
    // Harmless wear that looks worrying: old tape on a joint, rust, mud
    const wear = new Map();
    for (let j = 1; j <= N; j++) {
      wear.set(j, { tape: Math.random() < 0.2 ? (Math.random() < 0.5 ? -1 : 1) : 0, rust: Math.random() < 0.2, mud: Math.random() < 0.2 });
    }
    const wet = new Set();
    for (let j = 1; j <= N; j++) if (Math.random() < 0.15) wet.add(j);
    if (!OPEN) faults.forEach(f => { if (f.kind !== "span" && Math.random() < 0.7) wet.add(f.j); });
    // Earth resistance from each base's can to the general mass of earth, Ω
    const re = [0.4];
    for (let j = 1; j <= N; j++) re.push(1.5 + Math.random() * 4);
    Object.assign(st, {
      N, faults, wet, wear, re, jumpers: [null, null], k: 0.8 + Math.random() * 0.5, isolated: false, cutout: false, lids: new Set(), unplugged: new Set(),
      loc: 0, clips: { red: null, black: null }, armed: null, drag: null, testing: false, t: 0, curve: [], reading: Infinity,
      vOut: 0, dis: 0, vDis: 0, result: null, minutes: 0, warnings: 0, wrong: 0, tests: 0, opened: 0, log: [], measured: [], replaced: new Set(),
      done: false, alert: null
    });
    clearTimeout(alertTimer);
    renderAlert();
    if (OPEN) say("info", () => (st.diff === "hard"
      ? T("Work order: after snow clearing, the CCR on this runway edge circuit trips on open circuit. A plough hit several lights, so expect more than one break.")
      : T("Work order: the CCR on this runway edge circuit trips on open circuit and every light on it is out.")) + " " + T("Start in the vault: switch the CCR off and lock it out."));
    else say("info", () => (st.diff === "hard" ? T("Work order: this old runway edge circuit has an earth fault alarm and has not been tested for years. Expect more than one weak spot.")
      : faults[0].hv ? T("Work order: the CCR on this runway edge circuit trips on earth fault, but only at the high brightness steps.")
        : T("Work order: the CCR on this runway edge circuit shows an earth fault alarm.")) + " " + T("Start in the vault: switch the CCR off and lock it out."));
    render();
  }

  /* Difficulty: easy has one wet fault; medium may hide it as a dry crack that only breaks down at
     2500 V and above; hard has 2 to 5 faults, sometimes more than one in the same base. Any cable
     fault may be a dead short (a cable cut through, a few kΩ). */
  function oneFault(N, diff, near) {
    const r = Math.random();
    const j = near || 1 + rnd(N);
    let f;
    if (r < (near ? 0.65 : 0.45)) { const s = Math.random() < 0.5 ? -1 : 1; f = { kind: "conn", j, s, p: j + 0.3 * s, r0: 0.3 + Math.random() * 2.5 }; }
    else if (r < (near ? 1 : 0.65)) f = { kind: "txr", j, p: j, r0: 1 + Math.random() * 6 };
    else {
      const k = rnd(N + 1);
      f = Math.random() < 0.3 ? { kind: "span", k, p: k + 0.5, cut: true, r0: 0.001 + Math.random() * 0.02 }
        : { kind: "span", k, p: k + 0.5, r0: 0.05 + Math.random() * 0.4 };
    }
    f.hv = diff !== "easy" && f.kind !== "txr" && !f.cut && Math.random() < (diff === "hard" ? 0.25 : 0.3);
    return f;
  }
  function makeFaults(N, diff) {
    const want = diff === "hard" ? 2 + rnd(4) : 1, out = [];
    const same = (a, b) => a.kind === b.kind && (a.kind === "span" ? a.k === b.k : a.j === b.j && (a.kind !== "conn" || a.s === b.s));
    for (let guard = 0; out.length < want && guard < 50; guard++) {
      // In hard games a base that already has a fault often has a second one
      const host = out.find(f => f.kind !== "span");
      const f = oneFault(N, diff, out.length && host && Math.random() < 0.35 ? host.j : 0);
      if (!out.some(g => same(f, g))) out.push(f);
    }
    return out;
  }
  /* Open circuits: a connector pulled apart or with a burnt-open contact, a transformer whose
     primary has burnt open, or a broken cable. On easy every break in a base can be seen when the
     base is opened; on medium and hard about half can only be found by measuring (a burnt contact
     shows once the connector is unplugged). Hard has 2 or 3 breaks. */
  function oneOpen(N, diff, near) {
    const r = Math.random(), j = near || 1 + rnd(N);
    const vis = diff === "easy" || Math.random() < 0.5;
    if (r < (near ? 0.6 : 0.45)) { const s = Math.random() < 0.5 ? -1 : 1; return { kind: "conn", j, s, p: j + 0.3 * s, how: vis ? "pulled" : "burnt" }; }
    if (r < (near ? 1 : 0.7)) return { kind: "txr", j, p: j, vis };
    const k = rnd(N + 1);
    return { kind: "span", k, p: k + 0.5 };
  }
  function makeOpens(N, diff) {
    const want = diff === "hard" ? 2 + rnd(2) : 1, out = [];
    const same = (a, b) => a.kind === b.kind && (a.kind === "span" ? a.k === b.k : a.j === b.j && (a.kind !== "conn" || a.s === b.s));
    for (let guard = 0; out.length < want && guard < 50; guard++) {
      const host = out.find(f => f.kind !== "span");
      const f = oneOpen(N, diff, out.length && host && Math.random() < 0.35 ? host.j : 0);
      if (!out.some(g => same(f, g))) out.push(f);
    }
    return out;
  }
  const allFixed = () => st.faults.every(f => f.fixed);

  // Text may be a function so the message follows a language switch
  function say(kind, text) { st.msg = { kind, text }; }
  // A safety incident: counted, explained, and flashed on the drawing where it happened
  let alertTimer = 0;
  // The event log: every measurement, step, repair and safety incident, stamped with the game clock.
  // Text is a function so entries follow a language switch.
  function logEvent(kind, text) { st.log.unshift({ kind, text, at: st.minutes }); }

  function warn(text, at) {
    st.warnings++;
    logEvent("safety", text);
    say("bad", text);
    st.alert = { text, at: at || [500, 400] };
    renderAlert();
    clearTimeout(alertTimer);
    alertTimer = setTimeout(() => { st.alert = null; renderAlert(); }, 4500);
  }

  /* ---------- Circuit model ---------- */
  function splits() {
    const out = [...st.unplugged].map(key => { const [j, s] = key.split(":").map(Number); return j + 0.25 * s; });
    if (OPEN) st.faults.forEach(f => { if (!f.fixed) out.push(f.p); });   // a break splits the loop too
    return out;
  }
  // The piece of loop a terminal at x connects to, looking in direction d
  function segment(x, d) {
    const sp = splits();
    if (d > 0) return [x, Math.min(st.N + 1, ...sp.filter(v => v > x + 1e-9))];
    return [Math.max(0, ...sp.filter(v => v < x - 1e-9)), x];
  }
  const pointName = x => (x <= 0 || x >= st.N + 1 ? T("the vault") : T("base {n}", { n: x }));
  const placeName = j => (j === 0 ? T("Vault") : T("Base {n}", { n: j }));

  function termInfo(id) {
    if (!id) return null;
    const p = id.split(":");
    if (p[0] === "v") {
      if (p[1] === "earth") return { earth: true, loc: 0, label: T("vault earth bar") };
      return p[1] === "out" ? { seg: segment(0, 1), x: 0, label: T("field OUT") } : { seg: segment(st.N + 1, -1), x: st.N + 1, label: T("field RET") };
    }
    const j = +p[1];
    if (p[2] === "earth") return { earth: true, loc: j, label: T("base {n} earth", { n: j }) };
    const s = +p[2], x = j + 0.25 * s;
    return p[3] === "cable" ? { seg: segment(x, s), x, label: T("cable to {p}", { p: pointName(j + s) }) }
      : { seg: segment(x, -s), x, label: T("transformer lead, {p} side", { p: pointName(j + s) }) };
  }

  // Terminals you can clip onto where you stand, with their positions on the drawing
  function terms() {
    const out = [];
    if (st.loc === 0) {
      out.push({ id: "v:earth", x: 495, y: 607 });
      if (st.cutout) out.push({ id: "v:out", x: 300, y: 585 }, { id: "v:ret", x: 384, y: 585 });
    } else if (st.lids.has(st.loc)) {
      const j = st.loc;
      out.push({ id: `b:${j}:earth`, x: 290, y: 650 });
      [-1, 1].forEach(s => {
        if (st.unplugged.has(j + ":" + s)) out.push({ id: `b:${j}:${s}:cable`, x: mx(s, 168), y: 560 }, { id: `b:${j}:${s}:txr`, x: mx(s, 217), y: 560 });
      });
    }
    return out;
  }
  function checkClips() {
    const ids = terms().map(x => x.id);
    ["red", "black"].forEach(c => { if (st.clips[c] && !ids.includes(st.clips[c])) st.clips[c] = null; });
    // A jumper whose terminal disappears (connector replugged, cutout closed) comes off with it
    st.jumpers.forEach((jp, i) => { if (jp && jp.loc === st.loc && !ids.includes(jp.term)) st.jumpers[i] = null; });
  }

  /* ---------- Continuity (low-ohm range), in Ω ---------- */
  const sameSeg = (a, b) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
  // Conductor resistance along the loop between two positions: cable spans and transformer primaries
  function cond(x1, x2) {
    const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
    let r = 0;
    for (let k = 0; k <= st.N; k++) r += Math.max(0, Math.min(hi, k + 1) - Math.max(lo, k)) * (k === 0 || k === st.N ? 0.6 : 0.15);
    for (let j = 1; j <= st.N; j++) if (j > lo && j < hi) r += 0.6;
    return r;
  }
  const reLoc = loc => st.re[loc];
  // Points where a piece of loop is bonded to earth: earthing jumpers, and in the short game any fault
  function earthPoints() {
    const out = [];
    st.jumpers.forEach(jp => {
      if (!jp) return;
      const info = termInfo(jp.term);
      if (!info.earth) out.push({ x: info.x, seg: info.seg, loc: jp.loc, r: 0 });
    });
    if (!OPEN) st.faults.forEach(f => {
      if (!f.fixed && !f.hv) out.push({ x: f.p, seg: null, loc: null, r: f.r0 * 1e6 });
    });
    return out;
  }
  // Best path from a conductor terminal to the earth at location `at`, with the point it went through
  function pathEarth(info, at) {
    let best = { r: Infinity, x: null };
    earthPoints().forEach(e => {
      const on = e.seg ? sameSeg(e.seg, info.seg) : e.x > info.seg[0] && e.x < info.seg[1];
      if (!on) return;
      const link = e.loc === null ? reLoc(at) : e.loc === at ? 0.05 : reLoc(e.loc) + reLoc(at);
      const r = cond(info.x, e.x) + e.r + link;
      if (r < best.r) best = { r, x: e.x };
    });
    return best;
  }
  function continuity() {
    const a = termInfo(st.clips.red), b = termInfo(st.clips.black);
    if (!a || !b) return { r: Infinity };
    let res;
    if (a.earth && b.earth) res = { r: a.loc === b.loc ? 0.05 : reLoc(a.loc) + reLoc(b.loc) };
    else if (a.earth || b.earth) res = pathEarth(a.earth ? b : a, st.loc);
    else if (sameSeg(a.seg, b.seg)) res = { r: cond(a.x, b.x) + 0.02 };
    else res = { r: pathEarth(a, st.loc).r + pathEarth(b, st.loc).r };
    if (!(res.r <= MAXOHM)) res.r = Infinity;
    return res;
  }

  // Insulation resistance of a piece of loop, in MΩ, t seconds into a test
  function rIns(seg, t) {
    const len = Math.max(0.3, seg[1] - seg[0]);
    // Healthy insulation: capacitive charging first, then dielectric absorption (PI about 2)
    let r = st.k * 20000 / len * (1 - Math.exp(-t / 1.2)) * Math.pow(Math.max(t, 0.2) / 60, 0.55);
    // An earthing jumper on this piece shorts it to earth
    if (st.jumpers.some(jp => jp && !termInfo(jp.term).earth && sameSeg(termInfo(jp.term).seg, seg))) return Math.min(r, 2e-5);
    if (!OPEN) st.faults.forEach(f => {
      if (f.fixed || f.p <= seg[0] || f.p >= seg[1] || (f.hv && st.volt < 2500)) return;
      const rf = f.r0 * (1 + 0.03 * t / 60);   // a leakage path barely changes with time
      r = r * rf / (r + rf);                   // faults on the same piece act in parallel
    });
    return r;
  }
  function resistance(t) {
    if (st.volt === 0) return continuity().r;
    const a = termInfo(st.clips.red), b = termInfo(st.clips.black);
    if (!a || !b) return Infinity;
    if (a.earth && b.earth) return 0;
    if (a.earth || b.earth) return rIns((a.earth ? b : a).seg, t);
    if (a.seg[0] === b.seg[0] && a.seg[1] === b.seg[1]) return 0;   // both ends of one conductor: continuity
    return rIns(a.seg, t) + rIns(b.seg, t);
  }
  // The tester's source cannot hold its voltage into a low resistance
  function outVolts(r, t) {
    const ramp = 1 - Math.exp(-t / 0.6);
    if (st.volt === 0) return 4 * ramp * (isFinite(r) ? r / (r + 20) : 1);
    return st.volt * ramp * (isFinite(r) ? r / (r + st.volt * 5e-4) : 1);
  }

  function fmtOhm(r) {
    if (!isFinite(r)) return "OL";
    return r.toFixed(r < 10 ? 2 : r < 100 ? 1 : 0) + " Ω";
  }
  function fmtR(r) {
    if (st.volt === 0) return fmtOhm(r);
    if (!isFinite(r) || r >= MAXR) return "> 100 GΩ";
    if (r >= 1000) return (r / 1000).toFixed(r < 10000 ? 2 : 1) + " GΩ";
    if (r >= 1) return r.toFixed(r < 10 ? 2 : r < 100 ? 1 : 0) + " MΩ";
    if (r >= 0.001) return Math.round(r * 1000) + " kΩ";
    return "0.00 MΩ";
  }

  /* ---------- Testing ---------- */
  function startTest() {
    st.testing = true;
    st.t = 0;
    st.curve = [];
    st.result = null;
    st.tests++;
    const t0 = performance.now();
    const tick = now => {
      st.t = (now - t0) / 1000 * SPEED;
      st.reading = resistance(st.t);
      st.vOut = outVolts(st.reading, st.t);
      const last = st.curve[st.curve.length - 1];
      if (!last || st.t - last[0] >= 0.25) st.curve.push([st.t, st.reading]);
      if (st.t >= 600) { stopTest(); return; }
      renderLive();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    say("info", st.volt === 0 ? T("Measuring continuity. Press TEST again to stop.")
      : T("Testing at {v}. Watch the reading and press TEST again when you have what you need.", { v: iso(st.volt + " V") }));
    render();
  }

  function stopTest() {
    cancelAnimationFrame(raf);
    st.testing = false;
    const t = st.t, r = resistance(t);
    st.minutes += (st.volt === 0 ? 1 : 2) + t / 60;
    if (st.volt === 0) { stopContinuity(t, r); return; }
    const at = s => (st.curve.find(c => c[0] >= s) || [0, null])[1];
    const r15 = t >= 15 ? at(15) : null, r60 = t >= 60 ? at(60) : null;
    st.result = { r, t, r15, r60, pi: r15 && r60 && isFinite(r60) ? r60 / r15 : null };

    const a = termInfo(st.clips.red), b = termInfo(st.clips.black);
    let kind = "info", seg = null;
    if (!a || !b) kind = "leads";
    else if (a.earth !== b.earth) {
      seg = (a.earth ? b : a).seg;
      kind = t < 3 ? "unsettled" : r < LOW ? "low" : "good";
      if (kind !== "unsettled" && !OPEN) st.measured.push({ seg, low: kind === "low" });
    }
    const reading = fmtR(r), pi = st.result.pi;
    logEvent(kind, measureText(st.loc, iso(st.volt + " V"), t, st.clips.red, st.clips.black, reading, pi));

    const msgs = {
      leads: ["info", T("A lead is not connected, so the tester sees an open circuit.")],
      unsettled: ["info", T("You stopped before the reading settled: the cable was still charging. Hold the test for longer.")],
      low: ["bad", T("Low insulation: the short is on the conductor you tested.")],
      good: ["ok", T("Insulation good: the conductor you tested is clear at this voltage.")],
      ...(OPEN ? { low: ["info", T("Near zero: an earthing jumper is on this piece of loop, so it is bonded to earth. Use the continuity range to look for the break.")] } : {}),
      info: ["info", a && b && a.earth && b.earth ? T("Both leads on earth: the tester reads a short, as it should.")
        : r === 0 ? T("Both leads on the same conductor: you measured its continuity, not its insulation. Put one lead on earth.")
          : T("Neither lead is on earth, so this reading is not an insulation test of one section.")]
    };
    say(...msgs[kind]);
    if (kind === "good" && allFixed() && !OPEN) {
      if (seg[0] === 0 && seg[1] === st.N + 1) finish();
      else say("ok", T("This piece is clear. The loop is still split somewhere: plug every connector back in and test the whole loop from the vault."));
    }

    // Discharge the cable through the tester before anyone touches the leads
    st.vDis = st.vOut;
    st.dis = st.vDis > 5 ? 1 : 0;
    if (st.dis) {
      const d0 = performance.now();
      const step = now => {
        st.dis = Math.max(0, 1 - (now - d0) / 1800);
        if (st.dis > 0) { renderLive(); raf = requestAnimationFrame(step); } else render();
      };
      raf = requestAnimationFrame(step);
    }
    render();
  }

  // A continuity measurement: logged, explained, and on the open-circuit game the way to finish
  function stopContinuity(t, r) {
    const a = termInfo(st.clips.red), b = termInfo(st.clips.black);
    let kind = isFinite(r) ? "cont" : "ol", text;
    if (!a || !b) { kind = "leads"; text = T("A lead is not connected, so the tester sees an open circuit."); }
    else if (a.earth && b.earth) text = T("Both leads on earth: the tester reads a short, as it should.");
    else if (a.earth || b.earth) {
      const c = a.earth ? b : a, path = pathEarth(c, st.loc);
      if (isFinite(r)) {
        if (OPEN && path.x !== null) st.measured.push({ seg: [Math.min(c.x, path.x), Math.max(c.x, path.x)], low: false });
        text = OPEN ? T("Continuity to earth: {r}. This conductor is unbroken all the way to an earthing jumper.", { r: iso(fmtOhm(r)) })
          : T("Continuity to earth: {r}. This conductor touches earth somewhere: a dead short.", { r: iso(fmtOhm(r)) });
      } else text = OPEN ? T("Open: no path from this conductor to earth. Either it is broken between here and the jumper, or no jumper is on this piece of loop.")
        : T("No continuity to earth, as healthy insulation should read. Use an insulation range to look for leakage.");
    } else if (sameSeg(a.seg, b.seg)) {
      if (OPEN) st.measured.push({ seg: [Math.min(a.x, b.x), Math.max(a.x, b.x)], low: false });
      text = T("Continuity between the two leads: {r}. The conductor between them is unbroken.", { r: iso(fmtOhm(r)) });
    } else text = isFinite(r) ? T("Continuity through earth: both conductors reach an earthing jumper.")
      : T("Open between the two leads: the conductor between them is broken, or split at an unplugged connector.");
    st.result = { r, t };
    logEvent(kind, measureText(st.loc, null, t, st.clips.red, st.clips.black, fmtOhm(r), null));
    say(kind === "cont" ? "ok" : kind === "ol" ? "bad" : "info", text);
    if (OPEN && kind === "cont" && a && b && !a.earth && !b.earth && sameSeg(a.seg, b.seg) && a.seg[0] === 0 && a.seg[1] === st.N + 1 &&
      [a.x, b.x].includes(0) && [a.x, b.x].includes(st.N + 1) && allFixed()) {
      if (st.jumpers.some(Boolean)) say("bad", T("The loop is continuous again, but an earthing jumper is still on. Remove every jumper before the circuit goes back into service."));
      else finish();
    }
    st.vDis = 0;
    st.dis = 0;
    render();
  }

  function measureText(loc, v, t, red, black, reading, pi) {
    const lab = id => (id ? termInfo(id).label : T("not connected"));
    return () => T("{where}, {v} for {t}. LINE on {red}, EARTH on {black}: {r}", {
      where: placeName(loc), v: v || vText(0), t: iso(mmss(t)), red: lab(red), black: lab(black), r: iso(reading)
    }) + (pi ? " · PI " + iso(pi.toFixed(1)) : "");
  }

  function finish() {
    st.done = true;
    st.clips = { red: null, black: null };
    st.minutes += st.lids.size * COST.lidClose;
    const k = Math.ceil(Math.log2(st.N + 1));
    st.par = Math.round(COST.isolate + COST.cutout + 2 * COST.clip + 3 + st.faults.reduce((t, f) => t + k * 33 + COST[f.kind] + 10, 0) + 8);
    st.stars = st.warnings ? 1 : st.minutes <= st.par ? 3 : st.minutes <= st.par * 1.5 ? 2 : 1;
    logEvent("done", () => T("Circuit restored and handed back to operations."));
    say("ok", () => OPEN ? T("The loop is continuous from OUT to RET and every jumper is off. Circuit restored.")
      : st.faults.length > 1 ? T("Whole loop proved healthy from the vault. All {n} faults cleared.", { n: st.faults.length })
        : T("Whole loop proved healthy from the vault. Fault cleared."));
  }

  /* ---------- Actions ---------- */
  function placeOf(j) {
    if (j === 0) return [60, 150];
    return layout().P[j];
  }

  function placeClip(c, id) {
    st.armed = null;
    if (c[0] === "j") {
      const i = +c[1], loc = st.loc;
      st.jumpers[i] = { loc, term: id };
      st.minutes += COST.clip;
      logEvent("act", () => T("{place}: earthing jumper on {where}.", { place: placeName(loc), where: termInfo(id).label }));
      say("info", termInfo(id).earth ? T("The jumper is on earth at both ends, so it does nothing there.")
        : T("Earthing jumper on {where}: that piece of loop is now bonded to earth.", { where: termInfo(id).label }));
      return;
    }
    if (st.clips[c] !== id) st.minutes += COST.clip;
    st.clips[c] = id;
    say("info", T("{lead} lead clipped on {where}.", { lead: c === "red" ? T("LINE") : T("EARTH"), where: termInfo(id).label }));
  }
  // Touching leads during a test: dangerous on an insulation range, merely premature on continuity
  function touchDuringTest(at) {
    if (st.testing && st.volt === 0) say("info", T("Stop the test first: press TEST again."));
    else if (st.testing) warn(T("Never touch the leads or connectors during a test: the cable is charged to the test voltage."), at);
    else warn(T("Wait for the tester to discharge the cable before you touch the leads or connectors."), at);
  }

  function act(a, arg) {
    if (a === "new") { newGame(); return; }
    if (st.done) return;
    const touch = ["term", "plug", "cutout", "fix-conn", "fix-txr", "dig"].includes(a);
    if (st.testing && a !== "test" && a !== "volt" && a !== "knob") {
      if (touch) touchDuringTest(spot(a, arg));
      else say("info", T("Stop the test first: press TEST again."));
      render();
      return;
    }
    if (st.dis > 0 && a !== "volt" && a !== "knob") {
      if (touch) touchDuringTest(spot(a, arg));
      else say("info", T("The tester is still discharging the cable."));
      render();
      return;
    }
    const j = st.loc;
    const live = () => { if (st.isolated) return false; warn(T("Stop: the circuit is live. Switch off and lock out the CCR in the vault first."), spot(a, arg)); return true; };
    switch (a) {
      case "go": {
        if (arg === j) break;
        const [x1, y1] = placeOf(j), [x2, y2] = placeOf(arg);
        st.minutes += 3 + (Math.abs(x2 - x1) + Math.abs(y2 - y1)) / 40;
        st.loc = arg;
        st.clips = { red: null, black: null };
        st.armed = null;
        say("info", arg === 0 ? T("You are in the vault.") : st.lids.has(arg) ? T("You are at base {n}. The base is open.", { n: arg }) + " " + observations(arg).join(" ")
          : T("You are at base {n}. Click the base plate to open it.", { n: arg }));
        break;
      }
      case "isolate":
        if (st.isolated) { say("info", T("The CCR is already off and locked out. Keep your lock on it until the work is finished.")); break; }
        st.isolated = true;
        st.minutes += COST.isolate;
        logEvent("act", () => T("CCR switched off, locked out and tagged."));
        say("ok", T("CCR off, input breaker locked out and tagged. Now open the series cutout to reach the field cables."));
        break;
      case "cutout":
        if (!st.isolated) { warn(T("Stop: never pull the series cutout with the CCR on. Switch off and lock out first."), spot(a, arg)); break; }
        st.cutout = !st.cutout;
        st.minutes += COST.cutout;
        { const pulled = st.cutout; logEvent("act", () => pulled ? T("Series cutout plug pulled.") : T("Series cutout plug put back.")); }
        checkClips();
        say("info", st.cutout ? T("Cutout plug pulled: the field loop is disconnected from the CCR. Field OUT and RET are exposed for testing.")
          : T("Cutout plug back in: the field loop is connected to the CCR again."));
        break;
      case "lid":
        st.lids.add(j);
        st.opened++;
        st.minutes += COST.lid;
        logEvent("act", () => T("Base {n} opened.", { n: j }));
        say("info", T("Base open.") + " " + observations(j).join(" "));
        break;
      case "close":
        if ([-1, 1].some(s => st.unplugged.has(j + ":" + s))) { say("info", T("Plug both connectors back in before you close the base.")); break; }
        st.lids.delete(j);
        st.minutes += COST.lidClose;
        logEvent("act", () => T("Base {n} closed.", { n: j }));
        checkClips();
        say("info", T("Base plate bolted back on."));
        break;
      case "plug": {
        if (live()) break;
        const key = j + ":" + arg;
        if (st.unplugged.has(key)) {
          st.unplugged.delete(key);
          st.minutes += COST.replug;
          say("info", T("Connector plugged back in and sealed."));
          logEvent("act", () => T("Base {n}: connector towards {p} plugged back in.", { n: j, p: pointName(j + arg) }));
        } else {
          st.unplugged.add(key);
          st.minutes += COST.unplug;
          logEvent("act", () => T("Base {n}: connector towards {p} unplugged.", { n: j, p: pointName(j + arg) }));
          say("info", T("Connector unplugged: the loop is split here. Clip a lead onto either side.") +
            (OPEN && openConn(j, arg) && openConn(j, arg).how === "burnt" ? " " + T("The contact pin is burnt away.") : ""));
        }
        checkClips();
        break;
      }
      case "fix-conn": case "fix-txr": case "dig": {
        if (live()) break;
        const kind = a === "fix-conn" ? "conn" : a === "fix-txr" ? "txr" : "span";
        st.minutes += COST[kind];
        const hit = st.faults.find(f => !f.fixed && f.kind === kind &&
          (kind === "conn" ? f.j === j && f.s === arg : kind === "txr" ? f.j === j : f.k === Math.min(j, j + arg)));
        // Whatever was wrong with it, the part is now brand new
        const k = Math.min(j, j + arg);
        st.replaced.add(kind === "conn" ? `c:${j}:${arg}` : kind === "txr" ? `t:${j}` : `s:${k}`);
        logEvent(hit ? "fix" : "wrong", () => (kind === "conn" ? T("Base {n}: connector towards {p} replaced.", { n: j, p: pointName(j + arg) })
          : kind === "txr" ? T("Base {n}: transformer replaced.", { n: j })
            : T("Cable between {a} and {b} dug up and replaced.", { a: pointName(k), b: pointName(k + 1) })) + " " +
          (hit ? T("The old part was faulty.") : T("The old part was sound.")));
        if (hit && OPEN) {
          hit.fixed = true;
          st.measured = [];
          say("ok", (kind === "conn" ? T("You fitted a new connector. The joint is continuous again.")
            : kind === "txr" ? T("The old transformer's primary winding was burnt open. New transformer fitted.")
              : T("You found the cable snapped where frost heave had pulled it tight in the duct, and spliced in a new length.")) + " " +
            T("Plug everything back in, take off the jumpers and prove the loop continuous from OUT to RET in the vault."));
        } else if (OPEN) {
          st.wrong++;
          say("bad", kind === "span" ? T("Two hours of digging and the cable is intact. The break is somewhere else.")
            : T("The new part went in, but the old one was fine. The break is somewhere else."));
        } else if (hit) {
          hit.fixed = true;
          st.measured = [];
          say("ok", (kind === "conn" ? (hit.hv ? T("You cut out a connector with a hairline crack through its boot and fitted a new one.")
            : T("You cut out a connector with a split, waterlogged boot and fitted a new one."))
            : kind === "txr" ? T("The old transformer had a burnt primary winding. New transformer fitted.")
              : hit.cut ? T("You found the cable sliced through where an earth rod was driven into the duct, and spliced in a new length.")
                : T("You found the cable crushed under an old trench repair and spliced in a new length.")) + " " +
            T("Plug everything back in and prove the whole loop from the vault."));
        } else {
          st.wrong++;
          say("bad", kind === "span" ? T("Two hours of digging and the cable is undamaged. The short is somewhere else.")
            : T("The new part went in, but nothing was wrong with the old one. The short is somewhere else."));
        }
        break;
      }
      case "volt":
      case "knob":
        if (st.testing) { say("info", T("The range switch is locked while a test runs.")); break; }
        st.volt = a === "volt" ? arg : VOLTS[(VOLTS.indexOf(st.volt) + 1) % VOLTS.length];
        say("info", st.volt === 0 ? T("Range set to continuity (Ω): a low-ohm test at 200 mA.") : T("Test voltage set to {v}.", { v: iso(st.volt + " V") }));
        break;
      case "test":
        if (st.testing) stopTest(); else startTest();
        return;
      case "term":
        placeClip(st.armed || (!st.clips.red ? "red" : !st.clips.black ? "black" : "red"), arg);
        break;
    }
    render();
  }

  /* ---------- Drawing: circuit map ---------- */
  function layout() {
    const N = st.N, m = Math.ceil(N / 2);
    const P = [[100, 135]];
    for (let i = 1; i <= N; i++) {
      if (i <= m) P.push([150 + (i - 1) * (760 / (m - 1)), 60]);
      else P.push([910 - (i - m - 1) * (760 / (N - m - 1)), 240]);
    }
    P.push([100, 165]);
    return { P, m };
  }
  function spanPath(k, P, m) {
    const a = P[k], b = P[k + 1];
    if (k === 0 || k === st.N) return `M${a[0]},${a[1]} H122 V${b[1]} H${b[0]}`;
    if (k === m) return `M${a[0]},${a[1]} H955 V${b[1]} H${b[0]}`;
    return `M${a[0]},${a[1]} L${b[0]},${b[1]}`;
  }
  const btn = (act, arg, label) => ` data-act="${act}" data-arg="${arg}" data-key="${act}|${arg}" tabindex="0" role="button" aria-label="${esc(label)}"`;

  function mapSvg() {
    const { P, m } = layout(), N = st.N;
    const spanState = new Array(N + 1).fill(""), baseState = new Array(N + 2).fill("");
    st.measured.forEach(({ seg, low }) => {
      for (let k = 0; k <= N; k++) if (k + 0.5 > seg[0] && k + 0.5 < seg[1]) spanState[k] = low ? "low" : "ok";
      for (let j = 1; j <= N; j++) if (j > seg[0] && j < seg[1]) baseState[j] = low ? "low" : "ok";
    });
    let s = `<rect class="rwy" x="150" y="100" width="760" height="100" rx="4"/><path class="cl" d="M170,150 H890"/>
      <text class="lab" x="530" y="140" text-anchor="middle">${esc(T("Runway"))}</text>`;
    for (let k = 0; k <= N; k++) s += `<path class="span ${spanState[k]}" d="${spanPath(k, P, m)}"/>`;
    const here = st.loc === 0;
    s += `<g class="pick${here ? " on" : ""}"${btn("go", 0, T("Walk to the vault"))}>
      <rect class="vault" x="20" y="105" width="80" height="90" rx="4"/>
      <text class="lab${AGL.lang === "he" ? " small" : ""}" x="60" y="146" text-anchor="middle">${esc(T("Vault"))}</text>
      <text class="lab small" x="60" y="162" text-anchor="middle">CCR</text>
      ${st.isolated ? `<rect class="lock" x="49" y="177" width="22" height="14" rx="3"/><path class="lockbow" d="M54,177 v-3 a6,6 0 0 1 12,0 v3"/>` : ""}</g>`;
    for (let i = 1; i <= N; i++) {
      const [x, y] = P[i], top = i <= m, open = st.lids.has(i), on = st.loc === i;
      s += `<g class="pick${on ? " on" : ""}"${btn("go", i, T("Walk to base {n}", { n: i }) + (open ? ", " + T("open") : ""))}>
        <rect class="hit" x="${x - 18}" y="${y - 30}" width="36" height="62"/>
        <circle class="light" cx="${x}" cy="${top ? y + 28 : y - 28}" r="5"/>
        <rect class="pit${open ? " open" : ""} ${baseState[i]}" x="${x - 11}" y="${y - 11}" width="22" height="22" rx="3"/>`;
      [-1, 1].forEach(sd => {
        if (st.unplugged.has(i + ":" + sd)) { const gx = x + (top ? sd : -sd) * 15; s += `<path class="gap" d="M${gx},${y - 9} V${y + 9}"/>`; }
      });
      s += `<text class="num" x="${x}" y="${top ? y - 17 : y + 28}" text-anchor="middle">${i}</text></g>`;
    }
    const [hx, hy] = placeOf(st.loc);
    const py = st.loc === 0 ? 100 : hy < 150 ? hy - 36 : hy + 36;
    s += st.loc === 0 ? "" : `<path class="here" d="M${hx},${py + (hy < 150 ? 6 : -6)} l-7,${hy < 150 ? -10 : 10} h14 Z"/>`;
    // Earthing jumpers left in place, marked where they are
    st.jumpers.forEach((jp, i) => {
      if (!jp) return;
      const [x, y] = jp.loc === 0 ? [88, 112] : placeOf(jp.loc), dx = i * 10;
      s += `<g class="jmark" transform="translate(${x + 16 + dx},${jp.loc === 0 ? y : y < 150 ? y - 16 : y + 16})"><path d="M0,-7 V0 M-7,0 H7 M-4.5,4 H4.5 M-2,8 H2"/></g>`;
    });
    if (st.done) st.faults.forEach(f => {
      const [x, y] = f.kind === "span" ? [(P[f.k][0] + P[f.k + 1][0]) / 2, (P[f.k][1] + P[f.k + 1][1]) / 2] : P[f.j];
      s += OPEN ? `<g class="fault"><circle cx="${x}" cy="${y}" r="17"/><path class="brk" d="M${x - 11},${y} H${x - 3} l2,-6 M${x + 11},${y} H${x + 3} l-2,6"/></g>`
        : `<g class="fault"><circle cx="${x}" cy="${y}" r="17"/><path d="M${x + 3},${y - 11} L${x - 6},${y + 2} L${x},${y + 2} L${x - 3},${y + 11} L${x + 6},${y - 2} L${x},${y - 2} Z"/></g>`;
    });
    s += `<text class="lab small" x="20" y="288">${esc(T("Outgoing leg: bases 1–{m} · return leg: bases {m1}–{n} · click a base to walk there", { m, m1: m + 1, n: N }))}</text>`;
    return s;
  }

  /* ---------- Drawing: close-up of where you stand ---------- */
  function chip(x, y, w, label, act, arg, cls) {
    return `<g class="chip${cls ? " " + cls : ""}"${btn(act, arg, label)}><rect x="${x}" y="${y}" width="${w}" height="26" rx="13"/>
      <text x="${x + w / 2}" y="${y + 17.5}" text-anchor="middle">${esc(label)}</text></g>`;
  }

  function vaultSvg() {
    const live = !st.isolated;
    let s = `<text class="ins-title" x="30" y="328">${esc(T("Vault: CCR and series cutout"))}</text>
      <rect class="cab" x="40" y="345" width="170" height="320" rx="6"/>
      <text class="lab" x="125" y="372" text-anchor="middle">CCR</text>
      <rect class="ccr-disp" x="70" y="385" width="110" height="32" rx="4"/>
      <text class="ccr-t" x="125" y="407" text-anchor="middle">${esc(live ? (OPEN ? T("Tripped") : T("Step {n}", { n: 3 })) : T("OFF"))}</text>`;
    if (live) s += `<circle class="alarm" cx="125" cy="438" r="8"/><text class="lab small" x="125" y="465" text-anchor="middle">${esc(OPEN ? T("Open circuit") : T("Earth fault"))}</text>`;
    s += `<g class="act-g"${btn("isolate", "", T("Input breaker: switch off and lock out"))}>
      <rect class="brk" x="88" y="478" width="74" height="104" rx="6"/>
      <rect class="brk-h${live ? " on" : ""}" x="113" y="${live ? 490 : 536}" width="24" height="34" rx="4"/>
      <text class="lab small" x="125" y="602" text-anchor="middle">${esc(T("Input breaker"))}</text>
      <text class="lab small ${live ? "hint" : "okt"}" x="125" y="624" text-anchor="middle">${esc(live ? T("Click to switch off") : T("Off, locked out"))}</text>
      ${live ? `<text class="lab small hint" x="125" y="642" text-anchor="middle">${esc(T("and lock out"))}</text>`
        : `<rect class="lock" x="146" y="548" width="22" height="16" rx="3"/><path class="lockbow" d="M151,548 v-4 a6,6 0 0 1 12,0 v4"/>`}</g>
      <path class="wire" d="M210,560 H262 M210,578 H262"/>
      <rect class="cab" x="262" y="345" width="160" height="320" rx="6"/>
      <text class="lab" x="342" y="372" text-anchor="middle">${esc(T("Series cutout"))}</text>
      <rect class="cut-base" x="280" y="440" width="124" height="170" rx="6"/>
      <path class="wire" d="M300,610 V650 H540 M384,610 V640 H540"/>
      <text class="lab small" x="540" y="672" text-anchor="end">${esc(T("to the field"))}</text>
      <rect class="earthbar" x="440" y="600" width="110" height="14" rx="3"/>
      <text class="lab small" x="495" y="592" text-anchor="middle">${esc(T("Earth bar"))}</text>`;
    if (!st.cutout) {
      s += `<g class="act-g"${btn("cutout", "", T("Pull the cutout plug"))}>
        <rect class="cut-plug" x="290" y="452" width="104" height="120" rx="8"/><rect class="cut-handle" x="322" y="468" width="40" height="16" rx="8"/>
        <text class="lab small" x="342" y="530" text-anchor="middle">S-1</text>
        <text class="lab small hint" x="342" y="632" text-anchor="middle">${esc(T("Click to pull the plug"))}</text></g>`;
    } else {
      s += `<text class="lab small" x="300" y="562" text-anchor="middle">OUT</text><text class="lab small" x="384" y="562" text-anchor="middle">RET</text>
        <g class="act-g"${btn("cutout", "", T("Put the cutout plug back"))}>
        <rect class="cut-plug" x="440" y="350" width="104" height="70" rx="8"/><rect class="cut-handle" x="472" y="360" width="40" height="14" rx="7"/>
        <text class="lab small" x="492" y="402" text-anchor="middle">S-1</text>
        <text class="lab small hint" x="492" y="440" text-anchor="middle">${esc(T("Click to put it back"))}</text></g>`;
    }
    return s;
  }

  /* What a failed part looks like once the base is open. A wet connector shows a split boot with
     carbon tracking to the can wall, a dry crack only a hairline, and a failed transformer a scorched,
     swollen and cracked case. Buried cable faults cannot be seen from a base. */
  const connFault = (j, s) => !OPEN && st.faults.find(f => !f.fixed && f.kind === "conn" && f.j === j && f.s === s);
  const openConn = (j, s) => OPEN && st.faults.find(f => !f.fixed && f.kind === "conn" && f.j === j && f.s === s);
  // In the open-circuit game only a transformer that burnt open visibly shows it
  const txrFault = j => st.faults.some(f => !f.fixed && f.kind === "txr" && f.j === j && (!OPEN || f.vis));

  function connLook(j, s) {
    const p = pointName(j + s), w = st.wear.get(j);
    if (isNewConn(j, s)) return T("A new connector, fitted today.");
    const o = openConn(j, s);
    if (o && o.how === "pulled") return T("The connector towards {p} has pulled apart inside its boot: the pin is out of the socket.", { p });
    if (o && st.unplugged.has(j + ":" + s)) return T("The contact pin of the connector towards {p} is burnt away.", { p });
    if (connFault(j, s)) return connFault(j, s).hv ? T("There is a fine hairline crack in the cable-side boot of the connector towards {p}.", { p })
      : T("The cable-side boot of the connector towards {p} is split, with black carbon tracking from the crack to the can wall.", { p });
    if (w.tape === s) return T("The connector towards {p} is wrapped in old tape. Untidy, but that alone is no proof of a fault.", { p });
    return "";
  }
  function txrLook(j) {
    if (txrFault(j)) return OPEN ? T("The transformer case is scorched and swollen: the primary winding may have burnt open.")
      : T("The transformer case is scorched, swollen and cracked, with potting compound oozing out.");
    if (isNewTxr(j)) return T("A new transformer, fitted today.");
    if (st.wear.get(j).rust) return T("There is surface rust on the transformer case.");
    return "";
  }
  function observations(j) {
    const out = [st.wet.has(j) ? T("There is water in the bottom of the can.") : T("The can is dry.")];
    if (st.wear.get(j).mud) out.push(T("Mud has washed in through the conduits."));
    const parts = [connLook(j, -1), connLook(j, 1), txrLook(j)].filter(Boolean);
    return out.concat(parts.length ? parts : [T("The connectors and the transformer look sound.")]);
  }
  const title = text => `<title>${esc(text)}</title>`;
  const isNewConn = (j, s) => st.replaced.has(`c:${j}:${s}`);
  const isNewTxr = j => st.replaced.has(`t:${j}`);

  // Damage and wear drawn over a connector's cable-side boot (x 150..168 or 150..186)
  function connMarks(j, sd, un) {
    const x = v => mx(sd, v), end = un ? 168 : 186;
    let s = "";
    if (st.wear.get(j).tape === sd && !isNewConn(j, sd)) {
      for (let v = 154; v < end - 4; v += 7) s += `<rect class="tape" x="${Math.min(x(v), x(v + 4))}" y="549" width="4" height="22" rx="1"/>`;
    }
    const o = openConn(j, sd);
    if (o && o.how === "pulled" && !un) s += `<rect class="pullgap" x="${Math.min(x(180), x(192))}" y="548" width="12" height="24"/>
      <path class="pin" d="M${x(176)},560 H${x(194)}"/>`;
    if (o && (o.how === "pulled" || un)) s += `<rect class="burntpin" x="${Math.min(x(un ? 162 : 174), x(un ? 168 : 180))}" y="553" width="6" height="14" rx="2"/>`;
    if (connFault(j, sd)) {
      const cx = x(un ? 160 : 166);
      if (connFault(j, sd).hv) s += `<path class="crack thin" d="M${cx},552 l2,5 l-2,4 l2,5"/>`;
      else s += `<ellipse class="scorch" cx="${x(158)}" cy="560" rx="${un ? 16 : 22}" ry="15"/>
        <path class="crack" d="M${cx},551 l3,5 l-3,4 l3,5 l-2,4"/>
        <path class="track" d="M${cx},553 q${-sd * -6},-6 ${x(147) - cx},-9 M${cx},567 q${-sd * -5},6 ${x(147) - cx},10 M${x(156)},556 l${x(148) - x(156)},-3"/>`;
    }
    return s;
  }

  function canSvg(j) {
    const open = st.lids.has(j);
    let s = `<text class="ins-title" x="30" y="328">${esc(T("Base {n}", { n: j }))} · ${esc(T("L-867 base can"))}</text>`;
    [-1, 1].forEach(sd => {
      s += `<path class="cable" d="M${mx(sd, 22)},560 H${mx(sd, 150)}"/>
        <text class="lab small" x="${mx(sd, 26)}" y="548" text-anchor="${sd < 0 ? "start" : "end"}">${esc(T("to {p}", { p: pointName(j + sd) }))}</text>`;
    });
    if (!open) {
      let bolts = "";
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; bolts += `<circle class="bolt" cx="${290 + 132 * Math.cos(a)}" cy="${515 + 132 * Math.sin(a)}" r="6"/>`; }
      return s + `<g class="act-g"${btn("lid", "", T("Open the base"))}>
        <circle class="plate" cx="290" cy="515" r="150"/>${bolts}
        <circle class="fixture" cx="290" cy="490" r="32"/><circle class="lens" cx="290" cy="490" r="17"/>
        <text class="lab" x="290" y="565" text-anchor="middle">${esc(T("Base plate bolted on"))}</text>
        <text class="lab small hint" x="290" y="588" text-anchor="middle">${esc(T("Click to open it ({m} min)", { m: COST.lid }))}</text></g>`;
    }
    s += `<circle class="can-in" cx="290" cy="515" r="150"/>`;
    if (st.wear.get(j).mud) s += `<path class="mud" d="M180,630 q40,-16 90,-4 q50,10 70,-2 q10,18 -40,26 q-70,8 -120,-20 Z"/>`;
    if (st.wet.has(j)) s += `<ellipse class="water" cx="290" cy="622" rx="118" ry="28"/>`;
    s += `<rect class="lug" x="278" y="642" width="24" height="14" rx="2"/>
      <text class="lab small" x="270" y="653" text-anchor="end">${esc(T("can earth"))}</text>
      <path class="wire" d="M275,420 V385 M305,420 V385"/><text class="lab small" x="290" y="378" text-anchor="middle">${esc(T("to the lamp"))}</text>
      <g class="look">${title(txrLook(j) || T("Transformer case clean and intact."))}
      ${txrFault(j) ? `<path class="txr" d="M343,426 Q374,452 343,480 Z"/>` : ""}
      <rect class="txr${isNewTxr(j) ? " fresh" : ""}" x="235" y="420" width="110" height="64" rx="8"/>
      ${st.wear.get(j).rust && !isNewTxr(j) ? `<g class="rust"><circle cx="243" cy="428" r="5"/><circle cx="251" cy="426" r="3"/><circle cx="339" cy="477" r="4"/><circle cx="243" cy="476" r="3"/></g>` : ""}
      ${txrFault(j) ? `<path class="scorch on-txr" d="M296,422 q20,-6 40,4 q12,16 4,34 q-6,20 -30,18 q-22,-2 -24,-22 q-6,-22 10,-34 Z"/>
        <path class="scorch" d="M306,432 q14,-4 24,6 q6,12 0,22 q-10,10 -22,4 q-10,-8 -8,-20 Z"/>
        <path class="crack" d="M302,420 l7,13 l-6,9 l8,12 l-4,8"/>
        <path class="tar" d="M236,436 q-8,4 -7,18 q1,14 -2,30 q3,6 6,0 q1,-10 3,-16 Z"/>` : ""}
      <text class="lab" x="290" y="447" text-anchor="middle">L-830</text>
      <text class="lab small" x="290" y="469" text-anchor="middle">${esc(T("transformer"))}</text></g>
      ${isNewTxr(j) ? `<text class="lab tiny newtag" x="345" y="413" text-anchor="end">${esc(T("NEW"))}</text>` : ""}`;
    s += chip(230, 492, 120, T("Replace ({m} min)", { m: COST.txr }), "fix-txr", "");
    [-1, 1].forEach(sd => {
      const un = st.unplugged.has(j + ":" + sd);
      const rect = (a, b, cls) => { const x1 = mx(sd, a), x2 = mx(sd, b); return `<rect class="${cls}" x="${Math.min(x1, x2)}" y="551" width="${Math.abs(x2 - x1)}" height="18" rx="5"/>`; };
      s += `<path class="lead-w" d="M${mx(sd, 235)},466 C${mx(sd, 205)},466 ${mx(sd, 255)},560 ${mx(sd, un ? 235 : 222)},560"/>
        <g class="act-g plug"${btn("plug", sd, un ? T("Plug the connector back in") : T("Unplug the connector"))}>${title(connLook(j, sd) || T("Connector boots clean and intact."))}
        ${(f => rect(145, 242, "hit") + (un ? rect(150, 168, "conn c" + f) + rect(217, 235, "conn t" + f) : rect(150, 186, "conn c" + f) + rect(186, 222, "conn t" + f)))(isNewConn(j, sd) ? " fresh" : "")}
        ${connMarks(j, sd, un)}</g>`;
      if (isNewConn(j, sd)) s += `<text class="lab tiny newtag" x="${mx(sd, 192)}" y="${un ? 528 : 542}" text-anchor="middle">${esc(T("NEW"))}</text>`;
      if (un) s += `<text class="lab tiny" x="${mx(sd, 166)}" y="541" text-anchor="middle">${esc(T("cable"))}</text>
        <text class="lab tiny" x="${mx(sd, 221)}" y="541" text-anchor="middle">${esc(T("txr"))}</text>`;
      s += `<text class="lab tiny hint" x="${mx(sd, 194)}" y="588" text-anchor="middle">${esc(un ? T("click to plug in") : T("click to unplug"))}</text>`;
      s += chip(sd < 0 ? 140 : 320, 596, 120, T("Replace ({m} min)", { m: COST.conn }), "fix-conn", sd);
      s += chip(sd < 0 ? 20 : 446, 572, 114, T("Dig up ({h} h)", { h: COST.span / 60 }), "dig", sd);
    });
    s += chip(430, 310, 130, T("Close the base"), "close", "");
    return s;
  }

  function wrap(text, x, y, max, cls, lh) {
    const words = text.split(" "), lines = [];
    let line = "";
    words.forEach(w => { if ((line + " " + w).trim().length > max) { lines.push(line.trim()); line = w; } else line += " " + w; });
    if (line.trim()) lines.push(line.trim());
    return { svg: lines.map((l, i) => `<text class="${cls}" x="${x}" y="${y + i * lh}">${esc(l)}</text>`).join(""), h: lines.length * lh };
  }

  function faultName(f) {
    if (OPEN) return f.kind === "conn" ? (f.how === "pulled" ? T("a pulled-apart connector in base {n}, on the side towards {p}", { n: f.j, p: pointName(f.j + f.s) })
      : T("a connector with a burnt-open contact in base {n}, on the side towards {p}", { n: f.j, p: pointName(f.j + f.s) }))
      : f.kind === "txr" ? T("a transformer with an open primary winding in base {n}", { n: f.j })
        : T("a broken cable between {a} and {b}", { a: pointName(f.k), b: pointName(f.k + 1) });
    const where = f.kind === "conn" ? T("a waterlogged connector in base {n}, on the side towards {p}", { n: f.j, p: pointName(f.j + f.s) })
      : f.kind === "txr" ? T("a failed isolating transformer in base {n}", { n: f.j })
        : f.cut ? T("a dead short: cable cut through between {a} and {b}", { a: pointName(f.k), b: pointName(f.k + 1) })
          : T("damaged cable between {a} and {b}", { a: pointName(f.k), b: pointName(f.k + 1) });
    return where + (f.hv ? " " + T("(a dry crack that only broke down at 2500 V and above)") : "");
  }

  function resultSvg() {
    let s = `<text class="fg-stars" x="30" y="352">${"★".repeat(st.stars)}${"☆".repeat(3 - st.stars)}</text>
      <text class="ins-title" x="30" y="390">${esc(T(st.faults.length > 1 ? "All faults cleared in {h} h {m} min" : "Fault cleared in {h} h {m} min", { h: Math.floor(st.minutes / 60), m: Math.round(st.minutes % 60) }))}</text>`;
    let y = 418;
    const add = (text, cls, max, lh) => { const w = wrap(text, 30, y, max || 62, cls, lh || 22); s += w.svg; y += w.h + 6; };
    if (st.faults.length === 1) add(OPEN ? T("The break was {where}.", { where: faultName(st.faults[0]) }) : T("The short was {where}.", { where: faultName(st.faults[0]) }), "lab");
    else {
      add(OPEN ? T("There were {n} breaks:", { n: st.faults.length }) : T("There were {n} faults:", { n: st.faults.length }), "lab");
      st.faults.forEach((f, i) => add(`${i + 1}. ${faultName(f)}`, "lab small", 70, 18));
    }
    add(T("Par for this circuit, splitting it in half each time, is about {p} min.", { p: st.par }) + " " +
      T("{t} tests, {w} wrong repairs.", { t: st.tests, w: st.wrong }), "lab small", 70, 18);
    if (st.warnings) add(T("Safety: {n} unsafe action(s). On a real airfield that could be fatal.", { n: st.warnings }), "lab warnt", 62, 20);
    return s + chip(30, Math.min(y + 2, 656), 160, T("Play again"), "new", "", "primary");
  }

  /* ---------- Drawing: the insulation tester ---------- */
  function instrSvg() {
    const res = st.result, testing = st.testing, dis = st.dis > 0;
    const status = testing ? T("Testing") : dis ? T("Discharging") : res ? T("Last reading") : T("Ready");
    const big = testing ? fmtR(st.reading) : res ? fmtR(res.r) : "– – –";
    const sub = st.volt === 0 ? `${T("Continuity")} · ${iso("200 mA")} · ${iso(mmss(testing ? st.t : res ? res.t : 0))}`
      : testing ? `${iso(st.volt + " V")} · ${T("output")} ${iso(Math.round(st.vOut) + " V")} · ${iso(mmss(st.t))}`
      : dis ? T("Discharging the cable: {v}", { v: iso(Math.round(st.vDis * st.dis) + " V") })
        : res ? `${iso(st.volt + " V")} · ${iso(mmss(res.t))}` : `${iso(st.volt + " V")}`;
    let s = `<text class="lcd-s${testing ? " live" : ""}" x="620" y="358">${esc(status)}</text>
      <text class="lcd-big" x="960" y="410" text-anchor="end">${esc(big)}</text>
      <text class="lcd-s" x="620" y="436">${esc(sub)}</text>`;
    if (st.volt === 0) {
      return s + `<text class="gl big" x="790" y="502" text-anchor="middle">${esc(T("Low-ohm continuity range"))}</text>
        <text class="gl" x="790" y="526" text-anchor="middle">${esc(T("No charging: the reading is instant. OL means open."))}</text>
        <text class="lab tiny ink" x="610" y="580">${esc(T("Drag the clips onto terminals, then press TEST."))}</text>`;
    }
    // Reading against time, on a log scale from 10 kΩ to 100 GΩ
    const curve = testing || dis || res ? st.curve : [];
    const tmax = Math.max(90, ...curve.map(c => c[0]));
    const gx = t => 652 + t / tmax * 316, gy = r => 552 - (Math.log10(Math.min(MAXR, Math.max(0.01, isFinite(r) ? r : MAXR))) + 2) / 7 * 88;
    [[1, "1 MΩ"], [100, "100 MΩ"], [1e4, "10 GΩ"]].forEach(([r, l]) => { s += `<path class="grid" d="M652,${gy(r)} H968"/><text class="gl" x="648" y="${gy(r) + 4}" text-anchor="end">${l}</text>`; });
    [15, 60].forEach(t => { s += `<path class="grid t" d="M${gx(t)},462 V554"/><text class="gl" x="${gx(t) + 3}" y="472">${t} s</text>`; });
    if (curve.length > 1) s += `<polyline class="curve" points="${curve.map(c => `${gx(c[0]).toFixed(1)},${gy(c[1]).toFixed(1)}`).join(" ")}"/>`;
    const pi = res && !testing ? (res.pi ? `R15 ${iso(fmtR(res.r15))} · R60 ${iso(fmtR(res.r60))} · PI ${iso(res.pi.toFixed(1))}`
      : T("Hold a test for 60 s to get the polarization index.")) : T("Drag the clips onto terminals, then press TEST.");
    s += `<text class="lab tiny ink" x="610" y="580">${esc(pi)}</text>`;
    return s;
  }

  // The tester's case and controls, redrawn only when their state changes so clicks land on them
  function caseSvg() {
    const testing = st.testing;
    let s = `<rect class="ins-body" x="590" y="298" width="400" height="392" rx="18"/>
      <text class="ins-name" x="610" y="325">${esc(T("Insulation tester"))}</text>
      <rect class="lcd" x="606" y="336" width="368" height="112" rx="8"/>
      <rect class="graph" x="606" y="456" width="368" height="104" rx="6"/>`;
    const ang = v => (-100 + VOLTS.indexOf(v) * 40) * Math.PI / 180;
    s += `<g class="act-g knob"${btn("knob", "", T("Test voltage {v}, click to change", { v: st.volt === 0 ? "Ω" : st.volt + " V" }))}><circle cx="750" cy="640" r="26"/>
      <path class="knob-p" d="M750,640 L${750 + 22 * Math.sin(ang(st.volt))},${640 - 22 * Math.cos(ang(st.volt))}"/></g>`;
    VOLTS.forEach(v => {
      const a = ang(v), x = 750 + 46 * Math.sin(a), y = 640 - 46 * Math.cos(a) + 4;
      s += `<g class="act-g vsel${v === st.volt ? " on" : ""}"${btn("volt", v, v === 0 ? T("continuity") : v + " V")}><circle class="hit" cx="${x}" cy="${y - 4}" r="13"/>
        <text x="${x}" y="${y}" text-anchor="middle">${vName(v)}</text></g>`;
    });
    s += `<text class="lab tiny" x="750" y="684" text-anchor="middle">${esc(T("Range"))}</text>
      <g class="act-g testbtn${testing ? " on" : ""}"${btn("test", "", testing ? T("Stop the test") : T("Start the test"))}>
      <circle cx="890" cy="636" r="30"/><text x="890" y="641" text-anchor="middle">${esc(testing ? T("STOP") : T("TEST"))}</text></g>
      <text class="lab tiny" x="890" y="684" text-anchor="middle">${esc(T("press to start or stop"))}</text>
      <circle class="jack red" cx="${JACK.red[0]}" cy="${JACK.red[1]}" r="9"/><circle class="jack black" cx="${JACK.black[0]}" cy="${JACK.black[1]}" r="9"/>
      <text class="lab tiny" x="630" y="${JACK.red[1] + 4}">${esc(T("LINE"))}</text>
      <text class="lab tiny" x="630" y="${JACK.black[1] + 4}">${esc(T("EARTH"))}</text>`;
    return s;
  }

  const EARTHPT = () => (st.loc === 0 ? [495, 607] : [290, 650]);
  function clipPos(c) {
    if (st.drag && st.drag.c === c) return [st.drag.x, st.drag.y];
    if (c[0] === "j") {
      const jp = st.jumpers[+c[1]];
      if (!jp) return JPARK[+c[1]];
      if (jp.loc !== st.loc) return null;
      const t = terms().find(x => x.id === jp.term);
      return t ? [t.x - 24, t.y - 28] : null;
    }
    const t = st.clips[c] && terms().find(x => x.id === st.clips[c]);
    if (!t) return PARK[c];
    return c === "black" && st.clips.red === st.clips.black ? [t.x + 12, t.y + 12] : [t.x, t.y];
  }

  function leadsSvg() {
    let s = "";
    ["black", "red"].forEach(c => {
      const [jx, jy] = JACK[c], [x, y] = clipPos(c);
      const sag = Math.min(694, Math.max(jy, y) + 50);
      s += `<path class="lead ${c}" d="M${jx},${jy} C${jx - 40},${sag} ${x + 30},${sag} ${x},${y}"/>`;
    });
    if (OPEN) {
      s += `<text class="lab tiny jtray" x="112" y="684">${esc(T("Earthing jumpers"))}</text>`;
      [0, 1].forEach(i => {
        const c = "j" + i, pos = clipPos(c);
        if (!pos) return;
        const [x, y] = pos, jp = st.jumpers[i];
        const [ex, ey] = EARTHPT();
        if ((jp && jp.loc === st.loc) || (st.drag && st.drag.c === c)) s += `<path class="jlead" d="M${ex},${ey} Q${(ex + x) / 2},${Math.max(ey, y) + 30} ${x},${y}"/>`;
        const label = T("Earthing jumper") + (jp ? ", " + termInfo(jp.term).label : "");
        s += `<g class="clip jumper${st.armed === c ? " armed" : ""}" data-clip="${c}" data-key="clip|${c}" tabindex="0" role="button" aria-label="${esc(label)}" transform="translate(${x},${y})">
          <circle class="clip-hit" r="15"/><path class="jaw" d="M-10,-3 L9,-9 L11,-4 L-5,0 Z M-10,3 L9,9 L11,4 L-5,0 Z"/><circle class="boot" cx="-9" r="6"/></g>`;
      });
    }
    ["black", "red"].forEach(c => {
      const [x, y] = clipPos(c);
      const label = (c === "red" ? T("LINE") : T("EARTH")) + " " + T("clip") + (st.clips[c] ? ", " + termInfo(st.clips[c]).label : "");
      s += `<g class="clip ${c}${st.armed === c ? " armed" : ""}" data-clip="${c}" data-key="clip|${c}" tabindex="0" role="button" aria-label="${esc(label)}" transform="translate(${x},${y})">
        <circle class="clip-hit" r="20"/><path class="jaw" d="M-11,-3 L10,-10 L12,-5 L-6,0 Z M-11,3 L10,10 L12,5 L-6,0 Z"/><circle class="boot" cx="-10" r="7"/></g>`;
    });
    return s;
  }

  function termsSvg() {
    return terms().map(t => `<g class="term${st.armed || st.drag ? " ready" : ""}"${btn("term", t.id, termInfo(t.id).label)} transform="translate(${t.x},${t.y})">
      <circle class="term-hit" r="16"/><circle class="term-dot" r="6"/></g>`).join("");
  }

  // Where on the drawing an action takes place
  function spot(a, arg) {
    if (a === "term") { const t = terms().find(x => x.id === arg); if (t) return [t.x, t.y]; }
    if (a === "plug") return [mx(arg, 186), 560];
    if (a === "fix-conn") return [mx(arg, 168), 560];
    if (a === "fix-txr") return [290, 452];
    if (a === "dig") return [mx(arg, 70), 560];
    if (a === "cutout") return [342, 512];
    return [290, 500];
  }

  function alertSvg() {
    const a = st.alert;
    if (!a) return "";
    const [x, y] = a.at;
    const w = wrap(a.text, 0, 0, 52, "al-text", 21);
    const h = 74 + w.h, bx = 260, by = y > 430 ? 236 : 460;
    let rays = "";
    for (let i = 0; i < 10; i++) {
      const t = i * Math.PI / 5, r1 = 14, r2 = i % 2 ? 30 : 44;
      rays += `M${(x + r1 * Math.cos(t)).toFixed(1)},${(y + r1 * Math.sin(t)).toFixed(1)} L${(x + r2 * Math.cos(t + 0.15)).toFixed(1)},${(y + r2 * Math.sin(t + 0.15)).toFixed(1)} `;
    }
    return `<defs><pattern id="${host.id}-hazard" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="20" height="20" fill="#ffcc00"/><rect width="10" height="20" fill="#111417"/></pattern></defs>
      <rect class="al-flash" x="0" y="0" width="1000" height="700"/>
      <g class="al-spark" style="transform-origin: ${x}px ${y}px">
        <circle class="al-ring" cx="${x}" cy="${y}" r="24"/><path class="al-rays" d="${rays}"/>
        <path class="al-bolt" d="M${x + 4},${y - 16} L${x - 8},${y + 2} L${x},${y + 2} L${x - 4},${y + 16} L${x + 9},${y - 3} L${x + 1},${y - 3} Z"/></g>
      <g class="al-card" data-dismiss="1" role="alert" aria-label="${esc(T("Safety incident") + ": " + a.text)}">
        <rect class="al-border" x="${bx}" y="${by}" width="480" height="${h}" rx="10" fill="url(#${host.id}-hazard)"/>
        <rect class="al-body" x="${bx + 8}" y="${by + 8}" width="464" height="${h - 16}" rx="6"/>
        <path class="al-tri" d="M${bx + 40},${by + 18} l17,30 h-34 Z"/><text class="al-excl" x="${bx + 40}" y="${by + 44}" text-anchor="middle">!</text>
        <text class="al-title" x="${bx + 68}" y="${by + 42}">${esc(T("Safety incident"))}</text>
        <g transform="translate(${bx + 24},${by + 72})">${w.svg}</g>
        <text class="al-hint" x="${bx + 456}" y="${by + 42}" text-anchor="end">${esc(T("Click to dismiss"))}</text></g>`;
  }

  function renderAlert() {
    if (!svg) return;
    const g = group("alert");
    g.innerHTML = alertSvg();
    AGL.bidiSvg(g);
    const map = svg.closest(".fg-map");
    if (st.alert) {
      [map, host.querySelector(".fg-stats")].forEach(el => { el.classList.remove("fg-shake"); void el.getBoundingClientRect(); el.classList.add("fg-shake"); });
    }
  }

  /* ---------- Render ---------- */
  const group = name => svg.querySelector(".g-" + name);

  function renderLive() {
    if (!svg) return;
    group("lcd").innerHTML = instrSvg();
    AGL.bidiSvg(group("lcd"));
  }

  function render() {
    if (!st.faults || !svg) return;
    const key = document.activeElement && svg.contains(document.activeElement) ? document.activeElement.dataset.key : null;
    group("map").innerHTML = mapSvg();
    group("inset").innerHTML = `<rect class="ins-bg" x="10" y="298" width="564" height="392" rx="10"/>` +
      (st.done ? resultSvg() : (st.loc === 0 ? vaultSvg() : canSvg(st.loc)) + termsSvg());
    group("instr").innerHTML = caseSvg();
    group("leads").innerHTML = leadsSvg();
    renderLive();
    AGL.bidiSvg(svg);
    if (key) { const el = svg.querySelector(`[data-key="${CSS.escape(key)}"]`); if (el) el.focus({ preventScroll: true }); }
    svg.setAttribute("aria-label", T("Runway edge circuit with {n} light bases", { n: st.N }));
    const msg = host.querySelector(".fg-msg");
    msg.className = "feedback fg-msg " + st.msg.kind;
    msg.textContent = typeof st.msg.text === "function" ? st.msg.text() : st.msg.text;
    const pills = [
      [T("Time"), `${Math.floor(st.minutes / 60)}:${String(Math.floor(st.minutes % 60)).padStart(2, "0")}`],
      [T("Bases opened"), st.opened],
      [T("Tests"), st.tests],
      [T("Wrong repairs"), st.wrong],
      [T("Safety warnings"), st.warnings]
    ];
    host.querySelector(".fg-stats").innerHTML = pills.map(([k, v], i) =>
      `<div class="readout${i === 4 && st.warnings ? " warn" : ""}"><span class="k">${esc(k)}</span><span class="v"><bdi dir="ltr">${esc(v)}</bdi></span></div>`).join("");
    const pill = { low: ["on-bad", T("Low")], good: ["on-ok", T("Good")], unsettled: ["", T("Not settled")], leads: ["", T("Lead off")], info: ["", T("Check")],
      cont: ["on-ok", T("Continuous")], ol: ["on-bad", T("Break")], act: ["", T("Action")], fix: ["on-ok", T("Repair")],
      wrong: ["on-bad", T("Wrong repair")], safety: ["on-bad", T("Safety")], done: ["on-ok", T("Done")] };
    const clock = m => `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
    host.querySelector(".fg-log").innerHTML = st.log.length
      ? st.log.map(l => `<li><span class="fg-at"><bdi dir="ltr">${clock(l.at)}</bdi></span><span class="pill ${pill[l.kind][0]}">${esc(pill[l.kind][1])}</span>
        <span>${esc(typeof l.text === "function" ? l.text() : l.text)}</span></li>`).join("")
      : `<li class="muted">${esc(T("Nothing in the log yet."))}</li>`;
    host.querySelectorAll(".fg-level button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.level === st.level)));
    host.querySelectorAll(".fg-diff button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.diff === st.diff)));
  }

  /* ---------- Input ---------- */
  function toSvg(e) {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  const argOf = el => { const a = el.dataset.arg; return a === "" ? undefined : isNaN(+a) ? a : +a; };

  function grabBlocked(c) {
    if (st.done) return true;
    if (st.testing || st.dis > 0) { touchDuringTest(clipPos(c)); render(); return true; }
    return false;
  }

  // Take a clip or jumper off: tester clips go back by the tester, jumpers back to the tray
  function unclip(c) {
    if (c[0] === "j") {
      const jp = st.jumpers[+c[1]];
      if (jp) { say("info", T("Earthing jumper removed.")); logEvent("act", () => T("{place}: earthing jumper removed.", { place: placeName(jp.loc) })); }
      st.jumpers[+c[1]] = null;
    } else st.clips[c] = null;
  }

  {
    host.querySelector(".fg-map").innerHTML = `<svg viewBox="0 0 1000 700" class="fg" role="group" style="aspect-ratio: 1000 / 700">
      <g class="g-map"></g><g class="g-inset"></g><g class="g-instr"></g><g class="g-lcd"></g><g class="g-leads"></g><g class="g-alert"></g></svg>`;
    svg = host.querySelector("svg.fg");

    svg.addEventListener("click", e => {
      if (e.target.closest("[data-dismiss]")) { clearTimeout(alertTimer); st.alert = null; renderAlert(); return; }
      const el = e.target.closest("[data-act]");
      if (el) act(el.dataset.act, argOf(el));
    });
    svg.addEventListener("keydown", e => {
      const clip = e.target.closest(".clip");
      if (clip && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        if (!grabBlocked(clip.dataset.clip)) { unclip(clip.dataset.clip); st.armed = null; render(); }
        return;
      }
      if (e.key !== "Enter" && e.key !== " ") return;
      if (clip) { e.preventDefault(); if (!grabBlocked(clip.dataset.clip)) { st.armed = st.armed === clip.dataset.clip ? null : clip.dataset.clip; render(); } return; }
      const el = e.target.closest("[data-act]");
      if (el) { e.preventDefault(); act(el.dataset.act, argOf(el)); }
    });
    // Drag a clip onto a terminal, or tap it and then tap a terminal
    svg.addEventListener("pointerdown", e => {
      const clip = e.target.closest(".clip");
      if (!clip || e.button > 0) return;
      e.preventDefault();
      if (grabBlocked(clip.dataset.clip)) return;
      const p = toSvg(e);
      st.drag = { c: clip.dataset.clip, x: p.x, y: p.y, x0: p.x, y0: p.y, moved: false };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", e => {
      if (!st.drag) return;
      const p = toSvg(e);
      Object.assign(st.drag, { x: p.x, y: p.y });
      if (Math.hypot(p.x - st.drag.x0, p.y - st.drag.y0) > 6) st.drag.moved = true;
      if (st.drag.moved) group("leads").innerHTML = leadsSvg();
    });
    const drop = e => {
      const d = st.drag;
      if (!d) return;
      st.drag = null;
      if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
      if (!d.moved) { st.armed = st.armed === d.c ? null : d.c; render(); return; }
      let best = null, bd = 40;
      terms().forEach(t => { const dd = Math.hypot(t.x - d.x, t.y - d.y); if (dd < bd) { bd = dd; best = t; } });
      if (best) placeClip(d.c, best.id);
      else unclip(d.c);
      render();
    };
    svg.addEventListener("pointerup", drop);
    svg.addEventListener("pointercancel", drop);

    host.querySelector(".fg-level").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      st.level = b.dataset.level;
      newGame();
    });
    host.querySelector(".fg-diff").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      st.diff = b.dataset.diff;
      newGame();
    });
    host.querySelector(".fg-new").addEventListener("click", newGame);
    newGame();
    AGL.onLang(render);
  }
  }

  AGL.initFaultGame = function () {
    document.querySelectorAll(".fg-game[data-mode]").forEach(h => Game(h, h.dataset.mode));
  };
})();
