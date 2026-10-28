/* Module H: CCR sizing, insulation resistance trend, loop resistance check, lights on a curve. */
(function () {
  const XFMR = [
    ["10/15 W", 15, 0.70], ["20/25 W", 25, 0.75], ["30/45 W", 45, 0.80], ["65 W", 65, 0.85],
    ["100 W", 100, 0.88], ["150 W", 150, 0.89], ["200 W", 200, 0.90], ["300 W", 300, 0.91]
  ];
  const CCR_SIZES = [2.5, 4, 5, 7.5, 10, 15, 20, 25, 30];
  const ALPHA_CU = 0.00393;
  const I_MAX = 6.6;
  const EXAMPLE_ROWS = [
    { d: "Runway edge, elevated white", q: 22, w: 150, x: 5 },
    { d: "Runway edge, elevated yellow", q: 5, w: 150, x: 5 },
    { d: "Threshold / end, bidirectional", q: 4, w: 200, x: 6 }
  ];
  const EXAMPLE_IR = [
    ["2025-11-04", 520], ["2025-12-02", 480], ["2026-01-06", 450], ["2026-02-03", 400],
    ["2026-03-03", 300], ["2026-04-07", 210], ["2026-05-05", 140], ["2026-06-02", 95],
    ["2026-07-07", 60], ["2026-08-04", 31], ["2026-09-01", 14], ["2026-10-06", 6]
  ];
  const fmt = (n, d) => n.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
  const num = id => parseFloat(document.getElementById(id).value) || 0;
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  /* ---------- CCR sizing ---------- */
  let rowSeq = 0;
  function addRow(r) {
    const id = "r" + rowSeq++;
    const row = document.createElement("div");
    row.className = "calc-row";
    row.innerHTML = `
      <label class="field desc"><span data-l="Fixture group"></span><input type="text" id="${id}-d" value="${esc(AGL.t(r.d))}"></label>
      <label class="field"><span data-l="Qty"></span><input type="number" id="${id}-q" min="0" step="1" value="${r.q}"></label>
      <label class="field"><span data-l="Lamp W"></span><input type="number" id="${id}-w" min="0" step="1" value="${r.w}"></label>
      <label class="field"><span data-l="Transformer"></span><select id="${id}-x">${XFMR.map((t, k) => `<option value="${k}"${k === r.x ? " selected" : ""}>${t[0]}</option>`).join("")}</select></label>
      <label class="field"><span data-l="Efficiency"></span><input type="number" id="${id}-e" min="0.3" max="1" step="0.01" value="${XFMR[r.x][2]}"></label>
      <button type="button" class="btn x" data-l="Remove"></button>`;
    labelRow(row);
    row.querySelector(`#${id}-x`).addEventListener("change", e => {
      row.querySelector(`#${id}-e`).value = XFMR[+e.target.value][2];
      computeCCR();
    });
    row.querySelector(".x").addEventListener("click", () => { row.remove(); computeCCR(); });
    row.addEventListener("input", computeCCR);
    row.dataset.id = id;
    document.getElementById("calc-rows").appendChild(row);
  }

  // Row labels and example descriptions follow the language; typed descriptions are left alone
  function labelRow(row) {
    row.querySelectorAll("[data-l]").forEach(n => { n.textContent = AGL.t(n.dataset.l); });
    row.querySelector(".x").setAttribute("aria-label", AGL.t("Remove this fixture group"));
  }
  function relabelRows() {
    const names = EXAMPLE_ROWS.map(r => r.d).concat("New fixture group");
    document.querySelectorAll("#calc-rows .calc-row").forEach(row => {
      labelRow(row);
      const d = row.querySelector(`#${row.dataset.id}-d`);
      const en = names.find(n => n === d.value || AGL.HE.STR && AGL.HE.STR[n] === d.value);
      if (en) d.value = AGL.t(en);
    });
  }

  function computeCCR() {
    const notes = [];
    let lampW = 0, lossW = 0;
    document.querySelectorAll("#calc-rows .calc-row").forEach(row => {
      const id = row.dataset.id;
      const name = row.querySelector(`#${id}-d`).value || AGL.t("Unnamed group");
      const q = parseFloat(row.querySelector(`#${id}-q`).value) || 0;
      const w = parseFloat(row.querySelector(`#${id}-w`).value) || 0;
      const x = XFMR[+row.querySelector(`#${id}-x`).value];
      const e = Math.min(1, Math.max(0.3, parseFloat(row.querySelector(`#${id}-e`).value) || x[2]));
      lampW += q * w;
      lossW += q * w * (1 / e - 1);
      if (w > x[1]) notes.push(["bad", AGL.t("{name}: {w} W lamp on a {x} transformer is overloaded. The lamp will run dim; choose a larger transformer.", { name, w, x: x[0] })]);
      else if (w > 0 && w < x[1] * 0.4) notes.push(["warn", AGL.t("{name}: {x} transformer is much larger than the {w} W lamp. It works, but adds magnetising load.", { name, w, x: x[0] })]);
    });
    const len = num("c-len"), r = num("c-cond"), t = num("c-temp");
    const cableOhm = (len / 1000) * r * (1 + ALPHA_CU * (t - 20));
    const cableW = I_MAX * I_MAX * cableOhm;
    const totalW = lampW + lossW + cableW;
    const pf = Math.min(1, Math.max(0.5, num("c-pf") || 0.9));
    const va = totalW / pf;
    const spare = num("c-spare");
    const need = va * (1 + spare / 100);
    const size = CCR_SIZES.find(s => s * 1000 >= need);
    const vOut = va / I_MAX;

    const res = [
      [AGL.t("Lamp load"), fmt(lampW, 0) + " W"],
      [AGL.t("Transformer losses"), fmt(lossW, 0) + " W"],
      [AGL.t("Cable resistance at {t} °C", { t: fmt(t, 0) }), fmt(cableOhm, 2) + " Ω"],
      [AGL.t("Cable losses at 6.6 A"), fmt(cableW, 0) + " W"],
      [AGL.t("Total real power"), fmt(totalW, 0) + " W"],
      [AGL.t("Apparent power"), fmt(va / 1000, 2) + " kVA"],
      [AGL.t("Output voltage at 6.6 A"), fmt(vOut, 0) + " V"],
      [AGL.t("Required with {p} % spare", { p: fmt(spare, 0) }), fmt(need / 1000, 2) + " kVA"]
    ];
    if (size) res.push([AGL.t("Loading of recommended CCR"), fmt(va / (size * 10), 0) + " %"]);
    document.getElementById("c-results").innerHTML = res.map(([k, v]) => `<tr><td>${k}</td><td class="num"><bdi dir="ltr">${v}</bdi></td></tr>`).join("");

    const sizeEl = document.getElementById("c-size");
    const sizeNote = document.getElementById("c-size-note");
    if (!size) {
      sizeEl.textContent = AGL.t("Split the circuit");
      sizeNote.textContent = AGL.t("{s} kVA is more than the largest common 6.6 A regulator (30 kVA).", { s: fmt(need / 1000, 1) });
      notes.push(["bad", AGL.t("Load exceeds 30 kVA. Divide the fixtures across two circuits; for critical systems, interleave them.")]);
    } else {
      sizeEl.textContent = `${fmt(size, size % 1 ? 1 : 0)} kVA`;
      sizeNote.textContent = AGL.t("6.6 A output, up to {v} V at step 5.", { v: fmt(size * 1000 / I_MAX, 0) });
      if (va / (size * 1000) < 0.5) notes.push(["warn", AGL.t("The regulator would run below half load. Power factor and efficiency fall at light load; check whether a smaller size or less spare capacity fits.")]);
    }
    if (vOut > 5000) notes.push(["bad", AGL.t("Output voltage exceeds the 5 kV class of standard primary cable.")]);
    else if (vOut > 4000) notes.push(["warn", AGL.t("Output voltage is close to the 5 kV cable class. Leave margin for future extension.")]);
    if (!notes.length) notes.push(["", AGL.t("No issues found with these inputs.")]);
    document.getElementById("c-notes").innerHTML = notes.map(([cls, t]) => `<li class="${cls}">${esc(t)}</li>`).join("");
  }

  /* ---------- Insulation resistance trend ---------- */
  const IR_KEY = "agl-ir-readings";
  const IR_RECENT = 5;
  let ir = [], irIsExample = true, irAll = false;
  const BANDS = [
    [50, 1000, "Good", "--ok"], [10, 50, "Watch", "--warn"], [1, 10, "Investigate", "--warn"], [0.1, 1, "Fault", "--bad"]
  ];
  function condition(v) {
    if (v >= 50) return ["on-ok", AGL.t("Good")];
    if (v >= 10) return ["on-warn", AGL.t("Watch")];
    if (v >= 1) return ["on-warn", AGL.t("Investigate")];
    return ["on-bad", AGL.t("Fault")];
  }
  function saveIR() {
    try { localStorage.setItem(IR_KEY, JSON.stringify(ir)); } catch (e) { /* storage unavailable */ }
  }
  function loadIR() {
    try {
      const s = JSON.parse(localStorage.getItem(IR_KEY) || "null");
      if (Array.isArray(s)) { ir = s; irIsExample = false; return; }
    } catch (e) { /* storage unavailable */ }
    ir = EXAMPLE_IR.slice();
  }
  function shortDate(d) {
    const dt = new Date(d + "T00:00:00");
    return isNaN(dt) ? d : dt.toLocaleDateString(AGL.lang === "he" ? "he-IL" : "en-GB", { month: "short", year: "2-digit" });
  }

  function renderIR() {
    ir.sort((a, b) => a[0].localeCompare(b[0]));
    document.getElementById("ir-title").textContent = AGL.t(irIsExample ? "Example circuit: taxiway A edge" : "Your readings");
    const first = irAll ? 0 : Math.max(0, ir.length - IR_RECENT);
    const more = document.getElementById("ir-more");
    more.hidden = ir.length <= IR_RECENT;
    more.textContent = irAll ? AGL.t("Show recent readings only") : AGL.t("Show all {n} readings", { n: ir.length });
    document.getElementById("ir-rows").innerHTML = ir.length ? ir.map(([d, v], k) => {
      if (k < first) return "";
      const [cls, label] = condition(v);
      return `<tr><td class="num">${esc(d)}</td><td class="num">${fmt(v, v < 10 ? 1 : 0)}</td><td><span class="pill ${cls}">${label}</span></td><td><button type="button" class="btn" data-del="${k}" aria-label="${esc(AGL.t("Delete reading of {d}", { d }))}">${AGL.t("Delete")}</button></td></tr>`;
    }).reverse().join("") : `<tr><td colspan="4" class="muted">${AGL.t("No readings yet. Add your first test result below.")}</td></tr>`;

    const W = 520, H = 250, L = 52, R = 14, T = 14, B = 34;
    const y = v => T + (H - T - B) * (3 - Math.log10(Math.min(1000, Math.max(0.1, v)))) / 4;
    const x = k => ir.length < 2 ? L + (W - L - R) / 2 : L + (W - L - R) * k / (ir.length - 1);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(AGL.t("Insulation resistance readings on a logarithmic scale"))}">`;
    BANDS.forEach(([lo, hi, label, tok]) => {
      s += `<rect x="${L}" y="${y(hi)}" width="${W - L - R}" height="${y(lo) - y(hi)}" fill="var(${tok})" opacity="0.08"/>`;
      s += `<text x="${W - R - 4}" y="${y(hi) + 13}" text-anchor="end" font-size="13" fill="var(${tok})">${AGL.t(label)}</text>`;
    });
    [0.1, 1, 10, 100, 1000].forEach(v => {
      s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--rule)" stroke-width="1"/>`;
      s += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="13" fill="var(--muted)" font-family="IBM Plex Mono, monospace">${v}</text>`;
    });
    s += `<text x="12" y="${T + (H - T - B) / 2}" font-size="13" fill="var(--muted)" transform="rotate(-90 12 ${T + (H - T - B) / 2})" text-anchor="middle">${AGL.t("MΩ (log scale)")}</text>`;
    if (ir.length) {
      const pts = ir.map(([, v], k) => `${x(k).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
      if (ir.length > 1) s += `<polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>`;
      ir.forEach(([d, v], k) => {
        const last = k === ir.length - 1;
        s += `<circle cx="${x(k)}" cy="${y(v)}" r="${last ? 5 : 3}" fill="${last ? "var(--accent)" : "var(--surface)"}" stroke="var(--accent)" stroke-width="2"/>`;
      });
      const every = Math.max(1, Math.ceil(ir.length / 6));
      ir.forEach(([d], k) => {
        if (k % every === 0 || k === ir.length - 1) s += `<text x="${x(k)}" y="${H - 12}" text-anchor="middle" font-size="13" fill="var(--muted)">${esc(shortDate(d))}</text>`;
      });
      const [, lastV] = ir[ir.length - 1];
      s += `<text x="${Math.min(x(ir.length - 1), W - R - 40)}" y="${y(lastV) - 10}" text-anchor="middle" font-size="14" font-weight="600" fill="var(--ink)">${fmt(lastV, lastV < 10 ? 1 : 0)} MΩ</text>`;
    }
    s += "</svg>";
    document.getElementById("ir-chart").innerHTML = s;
    AGL.bidiSvg(document.getElementById("ir-chart"));
  }

  /* ---------- Loop resistance ---------- */
  function computeLoop() {
    const exp = (num("lr-len") / 1000) * num("lr-cond") * (1 + ALPHA_CU * (num("lr-t") - 20)) + num("lr-n") * num("lr-w");
    const m = num("lr-m");
    const out = document.getElementById("lr-dev");
    const txt = document.getElementById("lr-text");
    if (!m || !exp) { out.textContent = "–"; txt.textContent = AGL.t("Enter the circuit data and a measured value."); return; }
    const dev = (m - exp) / exp * 100;
    out.innerHTML = `<bdi dir="ltr">${(dev > 0 ? "+" : "") + fmt(dev, 1)} %</bdi>`;
    let msg = AGL.t("Expected about {e} Ω, measured {m} Ω.", { e: fmt(exp, 1), m: fmt(m, 1) }) + " ";
    if (Math.abs(dev) <= 10) msg += AGL.t("Consistent with a healthy loop. Record it as your baseline.");
    else if (dev > 10) msg += AGL.t("Higher than expected. Look for a high-resistance or corroded connector, or a route longer than the records show. Compare with the commissioning value.");
    else msg += AGL.t("Lower than expected. Check the recorded length and transformer count. A section may be bypassed by a short circuit.");
    txt.textContent = msg;
  }

  /* ---------- Lights on a curve ---------- */
  // Maximum centreline spacing on a curve by radius (ICAO Annex 14 / FAA AC 150/5340-30 typical)
  function curveMax(rule, r) {
    if (rule === "own") return num("cv-s");
    if (rule === "low") return r < 150 ? 7.5 : 15;
    return r <= 400 ? 7.5 : r < 900 ? 15 : 30;
  }
  let cvLines = [];

  function computeCurve() {
    const R = num("cv-r"), A = Math.min(180, num("cv-a")), W = num("cv-w"), on = document.getElementById("cv-on").value;
    const rule = document.getElementById("cv-rule").value;
    document.getElementById("cv-s").disabled = rule !== "own";
    const theta = A * Math.PI / 180;
    const defs = [];
    if (on !== "edges") defs.push({ key: "cl", name: AGL.t("Centreline"), r: R });
    if (on !== "cl") {
      defs.push({ key: "in", name: AGL.t("Inner edge"), r: R - W / 2 });
      defs.push({ key: "out", name: AGL.t("Outer edge"), r: R + W / 2 });
    }
    const notes = [];
    cvLines = defs.filter(d => {
      if (d.r > 0.5) return true;
      notes.push(AGL.t("The inner edge has no radius left: the taxiway is wider than the curve allows."));
      return false;
    }).map(d => {
      const max = curveMax(rule, d.r);
      const L = d.r * theta;
      const n = Math.max(1, Math.ceil(L / max - 1e-9));
      const sp = L / n;
      return Object.assign(d, { max, L, n, sp, chord: 2 * d.r * Math.sin(sp / (2 * d.r)), lights: n + 1 });
    });
    const total = document.getElementById("cv-total"), note = document.getElementById("cv-total-note");
    const body = document.getElementById("cv-results");
    if (!R || !A || !cvLines.length || cvLines.some(l => !(l.max > 0))) {
      total.textContent = "–";
      note.textContent = AGL.t("Enter a radius, an angle and a maximum spacing.");
      body.innerHTML = "";
      document.getElementById("cv-draw").innerHTML = "";
      document.getElementById("cv-rows").innerHTML = "";
      return;
    }
    const sum = cvLines.reduce((t, l) => t + l.lights, 0);
    total.innerHTML = `<bdi dir="ltr">${sum}</bdi>`;
    note.textContent = AGL.t("including the lights at the tangent points; {k} of them lie between the tangent points", { k: cvLines.reduce((t, l) => t + l.n - 1, 0) }) +
      (notes.length ? ". " + notes.join(" ") : "");
    const row = (k, v) => `<tr><td>${esc(k)}</td><td class="num"><bdi dir="ltr">${v}</bdi></td></tr>`;
    body.innerHTML = cvLines.map(l => `<tr class="cv-head"><td colspan="2">${esc(l.name)}</td></tr>` +
      row(AGL.t("Radius"), fmt(l.r, 1) + " m") + row(AGL.t("Arc length"), fmt(l.L, 1) + " m") +
      row(AGL.t("Maximum spacing"), fmt(l.max, 1) + " m") + row(AGL.t("Spacing along the arc"), fmt(l.sp, 2) + " m") +
      row(AGL.t("Chord between lights"), fmt(l.chord, 2) + " m") + row(AGL.t("Lights"), l.lights)).join("");

    // Line picker for the setting-out table
    const sel = document.getElementById("cv-line"), keep = sel.value;
    sel.innerHTML = cvLines.map(l => `<option value="${l.key}">${esc(l.name)}</option>`).join("");
    sel.value = cvLines.some(l => l.key === keep) ? keep : cvLines[0].key;
    renderCurveTable();
    drawCurve(theta);
  }

  function renderCurveTable() {
    const l = cvLines.find(x => x.key === document.getElementById("cv-line").value) || cvLines[0];
    if (!l) return;
    let rows = "";
    for (let i = 0; i <= l.n; i++) {
      const d = i * l.sp / l.r;
      const label = i === 0 ? AGL.t("TP 1") : i === l.n ? AGL.t("TP 2") : String(i);
      rows += `<tr><td>${esc(label)}</td><td class="num">${fmt(i * l.sp, 2)}</td><td class="num">${fmt(2 * l.r * Math.sin(d / 2), 2)}</td>
        <td class="num">${fmt(d / 2 * 180 / Math.PI, 3)}</td><td class="num">${fmt(l.r * Math.sin(d), 2)}</td><td class="num">${fmt(l.r * (1 - Math.cos(d)), 2)}</td></tr>`;
    }
    document.getElementById("cv-rows").innerHTML = rows;
  }

  // Plan of the curve: the arcs with every light, both tangents and the radius
  function drawCurve(theta) {
    const W = 640, H = 400, pad = 46;
    const Rmax = Math.max(...cvLines.map(l => l.r));
    // The curve starts at TP1 heading +x and turns left about the centre (0, R)
    const Rc = num("cv-r");
    const pt = (r, a) => [r * Math.sin(a), Rc - r * Math.cos(a)];
    const tan = Math.max(Rmax * 0.35, 10);
    const pts = [[-tan, Rc - Rmax], [0, Rc - Rmax]];
    cvLines.forEach(l => { for (let k = 0; k <= 24; k++) pts.push(pt(l.r, theta * k / 24)); });
    const endA = theta;
    pts.push([Rmax * Math.sin(endA) + tan * Math.cos(endA), Rc - Rmax * Math.cos(endA) + tan * Math.sin(endA)], [0, Rc]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = Math.min((W - 2 * pad) / (x1 - x0 || 1), (H - 2 * pad) / (y1 - y0 || 1));
    // Screen y points up the page, so the curve bends upwards
    const X = x => pad + (x - x0) * k + ((W - 2 * pad) - (x1 - x0) * k) / 2;
    const Y = y => H - pad - (y - y0) * k - ((H - 2 * pad) - (y1 - y0) * k) / 2;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(AGL.t("Plan of the curve with every light"))}">`;
    const cx = X(0), cy = Y(Rc);
    s += `<circle class="cv-c" cx="${cx}" cy="${cy}" r="4"/><text class="cv-lab" x="${cx + 8}" y="${cy - 8}">${esc(AGL.t("Centre"))}</text>`;
    cvLines.forEach(l => {
      const [ax, ay] = pt(l.r, 0), [bx, by] = pt(l.r, theta);
      const tx = Math.cos(theta), ty = Math.sin(theta);
      s += `<path class="cv-tan" d="M${X(ax - tan)},${Y(ay)} L${X(ax)},${Y(ay)} M${X(bx)},${Y(by)} L${X(bx + tan * tx)},${Y(by + tan * ty)}"/>`;
      let d = "";
      for (let i = 0; i <= 48; i++) { const [x, y] = pt(l.r, theta * i / 48); d += (i ? "L" : "M") + X(x).toFixed(1) + "," + Y(y).toFixed(1); }
      s += `<path class="cv-arc ${l.key}" d="${d}"/>`;
      for (let i = 0; i <= l.n; i++) {
        const [x, y] = pt(l.r, i * l.sp / l.r);
        s += `<circle class="cv-light ${l.key}${i === 0 || i === l.n ? " tp" : ""}" cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="${l.key === "cl" ? 5 : 4.5}"/>`;
      }
    });
    const main = cvLines.find(l => l.key === "cl") || cvLines[cvLines.length - 1];
    const [mx, my] = pt(main.r, theta / 2);
    s += `<path class="cv-rad" d="M${cx},${cy} L${X(mx)},${Y(my)}"/>
      <text class="cv-lab" x="${(cx + X(mx)) / 2 + 6}" y="${(cy + Y(my)) / 2}">R ${fmt(main.r, 1)} m</text>`;
    const [p1x, p1y] = pt(main.r, 0), [p2x, p2y] = pt(main.r, theta);
    s += `<text class="cv-lab tp" x="${X(p1x)}" y="${Y(p1y) + 22}" text-anchor="middle">${esc(AGL.t("TP 1"))}</text>
      <text class="cv-lab tp" x="${X(p2x) + 14 * Math.cos(theta)}" y="${Y(p2y) - 14}" text-anchor="middle">${esc(AGL.t("TP 2"))}</text>`;
    s += "</svg>";
    const host = document.getElementById("cv-draw");
    host.innerHTML = s;
    AGL.bidiSvg(host);
  }

  AGL.initCalc = function () {
    EXAMPLE_ROWS.forEach(addRow);
    document.getElementById("calc-add").addEventListener("click", () => {
      addRow({ d: "New fixture group", q: 10, w: 45, x: 2 });
      computeCCR();
    });
    ["c-len", "c-cond", "c-temp", "c-pf", "c-spare"].forEach(id => document.getElementById(id).addEventListener("input", computeCCR));
    computeCCR();

    loadIR();
    document.getElementById("ir-date").value = new Date().toISOString().slice(0, 10);
    document.getElementById("ir-add").addEventListener("click", () => {
      const d = document.getElementById("ir-date").value;
      const v = parseFloat(document.getElementById("ir-val").value);
      if (!d || !(v >= 0)) { document.getElementById("ir-val").focus(); return; }
      if (irIsExample) { ir = []; irIsExample = false; }
      ir.push([d, v]);
      document.getElementById("ir-val").value = "";
      saveIR();
      renderIR();
    });
    document.getElementById("ir-sample").addEventListener("click", () => {
      ir = EXAMPLE_IR.slice();
      irIsExample = true;
      try { localStorage.removeItem(IR_KEY); } catch (e) { /* storage unavailable */ }
      renderIR();
    });
    document.getElementById("ir-rows").addEventListener("click", e => {
      const b = e.target.closest("[data-del]");
      if (!b) return;
      ir.splice(+b.dataset.del, 1);
      if (irIsExample) irIsExample = false;
      saveIR();
      renderIR();
    });
    document.getElementById("ir-more").addEventListener("click", () => { irAll = !irAll; renderIR(); });
    renderIR();

    ["lr-len", "lr-cond", "lr-n", "lr-w", "lr-t", "lr-m"].forEach(id => document.getElementById(id).addEventListener("input", computeLoop));
    computeLoop();

    ["cv-r", "cv-a", "cv-on", "cv-w", "cv-rule", "cv-s"].forEach(id => document.getElementById(id).addEventListener("input", computeCurve));
    document.getElementById("cv-line").addEventListener("change", renderCurveTable);
    computeCurve();

    AGL.onLang(() => { relabelRows(); computeCCR(); renderIR(); computeLoop(); computeCurve(); });
  };
})();
