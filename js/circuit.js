/* Module C: series circuit simulator. A CCR, 4 km of primary cable and eight fixtures. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const STEPS = [2.8, 3.4, 4.1, 5.2, 6.6];
  const CABLE_OHMS = 4 * 3.08;      // 4 km of 6 mm² copper
  const EARTH_PATH_OHMS = 8;
  const IR_HEALTHY = 500;           // MΩ
  const FIXTURES = {
    hal: { label: "150 W halogen", watts: 150, eta: 0.88, xRatio: 0.15 },
    led: { label: "30 W LED", watts: 30, eta: 0.75, xRatio: 0.6 }
  };
  // Position of each fixture: 1–4 along the top run, 5–8 back along the bottom
  const POS = [
    [260, "top"], [390, "top"], [520, "top"], [650, "top"],
    [650, "bot"], [520, "bot"], [390, "bot"], [260, "bot"]
  ];
  const TOP = 110, BOT = 260, RIGHT = 770, LEFT = 170;
  const BYPASSED = [2, 3, 4, 5]; // fixture indexes 3–6, between the two earth faults

  const state = { step: 4, fixture: "hal", failed: new Set(), open: false, ef1: false, ef2: false };
  const log = [];
  let svg, parts = {};

  const c = (re, im) => ({ re, im: im || 0 });
  const add = (a, b) => c(a.re + b.re, a.im + b.im);
  const mul = (a, b) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const mag = a => Math.hypot(a.re, a.im);

  // Typical halogen intensity vs current, interpolated on a log scale
  const CURVE = [[2.8, 0.15], [3.4, 1.2], [4.1, 5], [5.2, 25], [6.6, 100]];
  function intensity(i) {
    if (i <= 0.5) return 0;
    if (i < 2.8) return 0.15 * Math.pow(i / 2.8, 6);
    if (i >= 6.6) return 100 * Math.pow(i / 6.6, 6);
    for (let k = 1; k < CURVE.length; k++) {
      const [i0, p0] = CURVE[k - 1], [i1, p1] = CURVE[k];
      if (i <= i1) {
        const t = (i - i0) / (i1 - i0);
        return Math.pow(10, Math.log10(p0) + t * (Math.log10(p1) - Math.log10(p0)));
      }
    }
    return 100;
  }

  function fixtureZ(idx) {
    const f = FIXTURES[state.fixture];
    const req = f.watts / (6.6 * 6.6 * f.eta);
    if (state.failed.has(idx)) return c(0.15 * req, 2.5 * req);
    return c(req, f.xRatio * req);
  }

  function solve() {
    const I = state.open ? 0 : STEPS[state.step];
    const fixtureI = new Array(8).fill(I);
    let z = c(CABLE_OHMS);
    const bypass = state.ef1 && state.ef2;
    if (bypass) {
      let zs = c(CABLE_OHMS * 0.45);
      BYPASSED.forEach(k => { zs = add(zs, fixtureZ(k)); });
      const re = c(EARTH_PATH_OHMS);
      z = add(c(CABLE_OHMS * 0.55), div(mul(zs, re), add(zs, re)));
      const share = mag(re) / mag(add(zs, re));
      BYPASSED.forEach(k => { fixtureI[k] = I * share; });
      for (let k = 0; k < 8; k++) if (!BYPASSED.includes(k)) z = add(z, fixtureZ(k));
    } else {
      for (let k = 0; k < 8; k++) z = add(z, fixtureZ(k));
    }
    const V = I * mag(z);
    const S = V * I;
    const P = I * I * z.re;
    const faults = (state.ef1 ? 1 : 0) + (state.ef2 ? 1 : 0);
    const ir = faults === 0 ? IR_HEALTHY : faults === 1 ? 0.05 : 0.01;
    const lit = fixtureI.map((i, k) => (state.failed.has(k) ? 0 : intensity(i)));
    const nominal = intensity(I);
    const correct = lit.filter(p => nominal > 0 && p >= nominal * 0.5).length;
    return { I, V, S, pf: S > 0 ? P / S : 0, ir, fixtureI, lit, correct, bypass };
  }

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(x, y, s, attrs, parent) {
    const t = el("text", Object.assign({ x, y, fill: "var(--night-muted)", "font-size": 12, "font-family": "IBM Plex Sans, system-ui, sans-serif" }, attrs || {}), parent || svg);
    t.textContent = s;
    return t;
  }

  function earthSymbol(x, y, dir, parent) {
    const g = el("g", { stroke: "var(--l-yellow)", "stroke-width": 2 }, parent);
    const s = dir === "down" ? 1 : -1;
    el("line", { x1: x, y1: y, x2: x, y2: y + 18 * s }, g);
    el("line", { x1: x - 9, y1: y + 18 * s, x2: x + 9, y2: y + 18 * s }, g);
    el("line", { x1: x - 6, y1: y + 22 * s, x2: x + 6, y2: y + 22 * s }, g);
    el("line", { x1: x - 3, y1: y + 26 * s, x2: x + 3, y2: y + 26 * s }, g);
    return g;
  }

  function build(host) {
    svg = el("svg", { viewBox: "0 0 800 360", role: "img", "aria-label": "Series circuit with a constant current regulator and eight fixtures" });
    host.appendChild(svg);
    const defs = el("defs", {}, svg);
    const f = el("filter", { id: "lampglow", x: "-150%", y: "-150%", width: "400%", height: "400%" }, defs);
    el("feGaussianBlur", { stdDeviation: 4 }, f);

    // CCR
    el("rect", { x: 20, y: 140, width: 110, height: 100, rx: 4, fill: "var(--night-2)", stroke: "#3a4c5e" }, svg);
    txt(75, 166, "CCR", { "text-anchor": "middle", fill: "var(--night-ink)", "font-size": 16, "font-weight": 600, "font-family": "Barlow Condensed, Arial Narrow, sans-serif" });
    parts.ccrI = txt(75, 192, "", { "text-anchor": "middle", fill: "var(--sign-yellow)", "font-size": 18, "font-family": "IBM Plex Mono, monospace" });
    parts.ccrS = txt(75, 214, "", { "text-anchor": "middle", "font-size": 11 });
    txt(20, 268, "400 V supply", { "font-size": 11 });

    // Cable loop
    const path = `M130 165 H${LEFT} V${TOP} H${RIGHT} V${BOT} H${LEFT} V215 H130`;
    parts.cable = el("path", { d: path, fill: "none", stroke: "var(--c-a)", "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
    parts.flow = el("path", { d: path, fill: "none", stroke: "var(--sign-yellow)", "stroke-width": 2.5, "stroke-dasharray": "2 18", class: "flow" }, svg);
    parts.cut = el("g", {}, svg);
    el("rect", { x: RIGHT - 8, y: 172, width: 16, height: 26, fill: "var(--night)" }, parts.cut);
    el("path", { d: `M${RIGHT - 7} 168 l14 8 M${RIGHT - 7} 194 l14 8`, stroke: "var(--l-red)", "stroke-width": 2 }, parts.cut);
    txt(RIGHT - 12, 189, "OPEN", { "text-anchor": "end", fill: "var(--l-red)", "font-weight": 600 }, parts.cut);
    txt(RIGHT - 14, (TOP + BOT) / 2 + 50, "4 km primary cable", { "text-anchor": "end", "font-size": 11 });

    // Earth faults and the earth path between them
    parts.ef1 = earthSymbol(455, TOP, "down", svg);
    parts.ef2 = earthSymbol(455, BOT, "up", svg);
    parts.earthPath = el("line", { x1: 455, y1: TOP + 28, x2: 455, y2: BOT - 28, stroke: "var(--l-yellow)", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
    parts.earthLabel = txt(463, (TOP + BOT) / 2 + 4, "current through earth", { fill: "var(--l-yellow)", "font-size": 11 });

    // Fixtures
    parts.fx = POS.map(([x, side], k) => {
      const top = side === "top";
      const yP = top ? TOP : BOT;
      const yS = top ? TOP - 15 : BOT + 15;
      const yL = top ? 46 : 322;
      const g = el("g", { tabindex: 0, role: "button", style: "cursor:pointer" }, svg);
      el("circle", { cx: x, cy: yP, r: 9, fill: "var(--night)", stroke: "var(--night-ink)", "stroke-width": 1.5 }, g);
      el("circle", { cx: x, cy: yS, r: 9, fill: "none", stroke: "var(--night-ink)", "stroke-width": 1.5 }, g);
      el("line", { x1: x - 6, y1: yS + (top ? -7 : 7), x2: x - 6, y2: yL + (top ? 12 : -12), stroke: "var(--night-muted)", "stroke-width": 1.2 }, g);
      el("line", { x1: x + 6, y1: yS + (top ? -7 : 7), x2: x + 6, y2: yL + (top ? 12 : -12), stroke: "var(--night-muted)", "stroke-width": 1.2 }, g);
      const halo = el("circle", { cx: x, cy: yL, r: 18, fill: "var(--l-white)", filter: "url(#lampglow)" }, g);
      const bulb = el("circle", { cx: x, cy: yL, r: 11, fill: "var(--l-white)", stroke: "#56483a", "stroke-width": 1 }, g);
      const cross = el("path", { d: `M${x - 6} ${yL - 6} l12 12 M${x + 6} ${yL - 6} l-12 12`, stroke: "var(--l-red)", "stroke-width": 2 }, g);
      txt(x - 22, yL + 4, String(k + 1), { "text-anchor": "end", fill: "var(--night-ink)", "font-weight": 600 }, g);
      const amps = txt(x + 18, yL + 4, "", { "font-size": 11, "font-family": "IBM Plex Mono, monospace" }, g);
      const toggle = () => toggleLamp(k);
      g.addEventListener("click", toggle);
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
      g.setAttribute("aria-label", `Fixture ${k + 1}: select to fail or repair its lamp`);
      return { halo, bulb, cross, amps };
    });
    txt(20, 24, "Select a lamp to fail it", { "font-size": 11 });
  }

  function fmt(n, d) { return n.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d }); }

  function render() {
    const r = solve();
    const running = !state.open;
    parts.ccrI.textContent = running ? fmt(r.I, 1) + " A" : "TRIP";
    parts.ccrS.textContent = "Step B" + (state.step + 1);
    parts.cable.style.stroke = running ? "var(--c-a)" : "#3a4c5e";
    parts.flow.style.display = running ? "" : "none";
    parts.flow.style.animationDuration = (2.6 - state.step * 0.4) + "s";
    parts.cut.style.display = state.open ? "" : "none";
    parts.ef1.style.display = state.ef1 ? "" : "none";
    parts.ef2.style.display = state.ef2 ? "" : "none";
    parts.earthPath.style.display = r.bypass && running ? "" : "none";
    parts.earthLabel.style.display = r.bypass && running ? "" : "none";

    parts.fx.forEach((fx, k) => {
      const failed = state.failed.has(k);
      const p = r.lit[k];
      const vis = p <= 0 ? 0 : Math.max(0.08, Math.min(1, (Math.log10(p) + 1.2) / 3.2));
      fx.bulb.style.fill = failed || vis === 0 ? "#1b2631" : "var(--l-white)";
      fx.bulb.style.opacity = failed || vis === 0 ? 1 : 0.25 + 0.75 * vis;
      fx.halo.style.opacity = failed ? 0 : vis * 0.9;
      fx.cross.style.display = failed ? "" : "none";
      fx.amps.textContent = failed ? "open" : fmt(r.fixtureI[k], 1) + " A";
      fx.amps.style.fill = !failed && running && r.fixtureI[k] < r.I * 0.95 ? "var(--l-red)" : "var(--night-muted)";
    });

    const ro = [
      ["Output current", running ? fmt(r.I, 2) : "0.00", "A"],
      ["Output voltage", fmt(r.V, 0), "V"],
      ["Load", fmt(r.S / 1000, 2), "kVA"],
      ["Power factor", running ? fmt(r.pf, 2) : "–", ""],
      ["Lights correct", `${r.correct}/8`, ""],
      ["Insulation", r.ir >= 1 ? fmt(r.ir, 0) : fmt(r.ir, 2), "MΩ"]
    ];
    document.getElementById("sim-readouts").innerHTML = ro.map(([k, v, u]) =>
      `<div class="readout"><span class="k">${k}</span><span class="v">${v}<small>${u}</small></span></div>`).join("");

    const pills = [];
    pills.push(running ? ["on-ok", "CCR regulating"] : ["on-bad", "Tripped: open circuit"]);
    pills.push(state.ef1 || state.ef2 ? ["on-warn", "Earth fault alarm"] : ["", "No earth fault"]);
    pills.push(state.failed.size ? ["on-warn", `Lamp-out alarm: ${state.failed.size}`] : ["", "No lamps out"]);
    if (r.bypass && running) pills.push(["on-bad", "Section bypassed through earth"]);
    document.getElementById("sim-alarms").innerHTML = pills.map(([cls, t]) => `<span class="pill ${cls}">${t}</span>`).join("");

    document.getElementById("sim-log").innerHTML = log.map(t => `<p>${t}</p>`).join("");
    return r;
  }

  function note(msg) {
    log.unshift(msg);
    if (log.length > 12) log.pop();
  }

  function act(fn, describe) {
    const before = solve();
    fn();
    const after = render();
    note(describe(before, after));
    render();
  }

  const v = n => fmt(n, 0) + " V";

  function toggleLamp(k) {
    if (state.open) {
      note("The circuit is tripped. Repair the open circuit before testing lamps.");
      render();
      return;
    }
    act(() => { state.failed.has(k) ? state.failed.delete(k) : state.failed.add(k); }, (b, a) =>
      state.failed.has(k)
        ? `Lamp ${k + 1} failed. Its transformer secondary is now open, so the core saturates and the voltage across its primary rises. The loop stays closed: the CCR still delivers ${fmt(a.I, 1)} A and the other lamps are unchanged. Output voltage moved from ${v(b.V)} to ${v(a.V)} and power factor fell from ${fmt(b.pf, 2)} to ${fmt(a.pf, 2)}: that change is how the CCR detects lamp failures.`
        : `Lamp ${k + 1} replaced. Output voltage back to ${v(a.V)}.`);
  }

  AGL.initCircuit = function () {
    build(document.getElementById("sim"));
    const seg = document.getElementById("sim-steps");
    STEPS.forEach((a, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = "B" + (k + 1);
      b.title = a + " A";
      b.setAttribute("aria-pressed", String(k === state.step));
      b.addEventListener("click", () => {
        seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        act(() => { state.step = k; }, (bf, af) => state.open
          ? `Step set to B${k + 1}, but the CCR is tripped and delivers nothing.`
          : `Step B${k + 1}: the CCR now holds ${fmt(af.I, 1)} A. Output voltage changed from ${v(bf.V)} to ${v(af.V)}. Every lamp sees the same current, so all change brightness together (about ${fmt(intensity(af.I), af.I < 4 ? 2 : 0)} % of full intensity for halogen).`);
      });
      seg.appendChild(b);
    });
    document.getElementById("sim-fixture").addEventListener("change", e => {
      act(() => { state.fixture = e.target.value; }, (b, a) =>
        `Fixtures changed to ${FIXTURES[state.fixture].label}. Load at this step is now ${fmt(a.S / 1000, 2)} kVA. Lower lamp power means a much smaller load change when a lamp fails, which is why lamp-out detection is harder on LED circuits.`);
    });
    document.getElementById("sim-open").addEventListener("click", () => {
      if (state.open) return;
      act(() => { state.open = true; }, () =>
        "Primary cable cut. Current falls to zero, so the CCR raises its voltage toward its maximum trying to restore it. Open-circuit protection trips the regulator within seconds. Every lamp on the loop goes out. Isolate, then find the break by sectionalising.");
    });
    document.getElementById("sim-ef1").addEventListener("click", () => {
      if (state.ef1) return;
      act(() => { state.ef1 = true; }, (b, a) => a.bypass
        ? `Second earth fault, near fixture 3. Current now has a path through the ground between the two faults. The CCR still regulates ${fmt(a.I, 1)} A, but fixtures 3 to 6 only get about ${fmt(a.fixtureI[2], 1)} A and go dim or dark.`
        : "Earth fault near fixture 3. One fault gives no return path, so the lamps are unaffected. Only the insulation monitor notices: it drops from 500 MΩ to near zero. This is the time to find it.");
    });
    document.getElementById("sim-ef2").addEventListener("click", () => {
      if (state.ef2) return;
      act(() => { state.ef2 = true; }, (b, a) => a.bypass
        ? `Second earth fault, near fixture 6. Current now has a path through the ground between the two faults. The CCR still regulates ${fmt(a.I, 1)} A, but fixtures 3 to 6 only get about ${fmt(a.fixtureI[2], 1)} A and go dim or dark.`
        : "Earth fault near fixture 6. One fault gives no return path, so the lamps are unaffected. Only the insulation monitor notices. This is the time to find it.");
    });
    document.getElementById("sim-reset").addEventListener("click", () => {
      act(() => { state.failed.clear(); state.open = false; state.ef1 = false; state.ef2 = false; }, (b, a) =>
        `Circuit repaired and re-energised at B${state.step + 1}: ${fmt(a.I, 1)} A, ${v(a.V)}, insulation ${fmt(a.ir, 0)} MΩ.`);
    });
    const r = render();
    note(`Ready. CCR at B${state.step + 1} delivering ${fmt(r.I, 1)} A into eight ${FIXTURES[state.fixture].label} fixtures. Output voltage ${v(r.V)}, load ${fmt(r.S / 1000, 2)} kVA.`);
    render();
  };
})();
