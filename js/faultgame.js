/* Module J: "Find the short", a fault-location game on a runway edge circuit.
   The loop leaves the vault (point 0), passes bases 1..N and returns to the vault (point N+1).
   The hidden fault sits at a point p on that line: just inside base j (j - 0.25, a wet or damaged
   connector) or halfway along a cable span (k + 0.5). Opening a pit splits the loop there, and a
   megger test reads low only on the section that contains p. */
(function () {
  const LEVELS = { easy: 12, normal: 24, hard: 40 };
  const COST = { isolate: 10, open: 15, close: 10, test: 5, inspect: 5, fixConn: 30, dig: 120, final: 5 };
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const T = (s, v) => AGL.t(s, v);

  const st = { level: "normal" };

  function newGame() {
    const N = LEVELS[st.level];
    let fault;
    if (Math.random() < 0.75) {
      const j = 1 + Math.floor(Math.random() * N);
      fault = { kind: "conn", base: j, p: j - 0.25 };
    } else {
      const k = Math.floor(Math.random() * (N + 1));       // span k..k+1, where 0 and N+1 are the vault
      fault = { kind: "span", a: k, b: k + 1, p: k + 0.5 };
    }
    Object.assign(st, { N, fault, isolated: false, open: new Set(), minutes: 0, tests: 0, opened: 0, warnings: 0, wrong: 0,
      log: [], sel: "vault", done: false, msg: null, measured: [] });
    render();
  }

  // Section of the loop seen from point s looking in direction d (-1 towards the vault-out end, +1 onwards)
  function section(s, d) {
    const open = [...st.open].sort((a, b) => a - b);
    if (d < 0) return [Math.max(0, ...open.filter(x => x < s)), s];
    return [s, Math.min(st.N + 1, ...open.filter(x => x > s))];
  }
  const holds = ([a, b]) => st.fault.p > a && st.fault.p < b;
  const pointName = x => (x === 0 || x === st.N + 1 ? T("the vault") : T("base {n}", { n: x }));

  function megger(sec, from) {
    st.minutes += COST.test;
    st.tests++;
    const low = holds(sec);
    const value = low ? (0.02 + Math.random() * 0.4) : (400 + Math.random() * 1600);
    // Isolated so the number and unit keep their order inside Hebrew text
    const reading = "\u2066" + (low ? value.toFixed(2) : Math.round(value)) + " MΩ\u2069";
    st.measured.push({ sec, low });
    const whole = sec[0] === 0 && sec[1] === st.N + 1;
    st.log.unshift({ low, text: whole ? T("From {from}: whole loop, {r}", { from, r: reading })
      : T("From {from}: {a} to {b}, {r}", { from, a: pointName(sec[0]), b: pointName(sec[1]), r: reading }) });
    st.msg = { kind: low ? "bad" : "ok", text: low ? T("Low insulation: the short is in this section.") : T("Insulation good: this section is clear.") };
  }

  function needIsolation() {
    if (st.isolated) return false;
    st.warnings++;
    st.msg = { kind: "bad", text: T("Stop: the circuit is live. Isolate and lock out the CCR at the vault first.") };
    return true;
  }

  function finish() {
    st.done = true;
    st.minutes += st.open.size * COST.close + COST.final;
    const k = Math.ceil(Math.log2(st.N + 1));
    const par = COST.isolate + k * (COST.open + 2 * COST.test + COST.close) + COST.inspect + COST.fixConn + COST.final;
    st.par = par;
    st.stars = st.warnings ? 1 : st.minutes <= par ? 3 : st.minutes <= par * 1.5 ? 2 : 1;
  }

  function act(a, arg) {
    if (st.done) return;
    st.msg = null;
    const s = st.sel;
    switch (a) {
      case "isolate":
        st.isolated = true;
        st.minutes += COST.isolate;
        st.msg = { kind: "ok", text: T("CCR off, input breaker locked, series cutout open, field side proved dead. You can work on the circuit.") };
        break;
      case "testOut":
        if (needIsolation()) break;
        megger(section(0, 1), T("the vault (outgoing leg)"));
        break;
      case "testRet":
        if (needIsolation()) break;
        megger(section(st.N + 1, -1), T("the vault (return leg)"));
        break;
      case "open":
        if (needIsolation()) break;
        st.open.add(s);
        st.opened++;
        st.minutes += COST.open;
        st.msg = { kind: "info", text: T("Pit open and connectors separated. The loop is split at base {n}.", { n: s }) };
        break;
      case "close":
        st.open.delete(s);
        st.minutes += COST.close;
        st.msg = { kind: "info", text: T("Connectors remade and sealed, pit closed.") };
        break;
      case "test":
        if (needIsolation()) break;
        megger(section(s, arg), T("base {n}", { n: s }));
        break;
      case "inspect": {
        st.minutes += COST.inspect;
        const here = st.fault.kind === "conn" && st.fault.base === s;
        st.msg = here ? { kind: "bad", text: T("Water in the base and a split boot on a primary connector. This looks like the fault.") }
          : { kind: "ok", text: T("Base dry, connectors and boots look sound.") };
        break;
      }
      case "fix":
        st.minutes += COST.fixConn;
        if (st.fault.kind === "conn" && st.fault.base === s) { finish(); st.msg = { kind: "ok", text: T("Connector replaced and sealed. The whole loop now meggers above 500 MΩ.") }; }
        else { st.wrong++; st.msg = { kind: "bad", text: T("New connector fitted, but the insulation is still low. The short is somewhere else.") }; }
        break;
      case "dig": {
        st.minutes += COST.dig;
        const [a2, b2] = arg < 0 ? [s - 1, s] : [s, s + 1];
        if (st.fault.kind === "span" && st.fault.a === a2 && st.fault.b === b2) { finish(); st.msg = { kind: "ok", text: T("Damaged cable found and replaced. The whole loop now meggers above 500 MΩ.") }; }
        else { st.wrong++; st.msg = { kind: "bad", text: T("Two hours of digging and the cable is undamaged. The short is somewhere else.") }; }
        break;
      }
    }
    render();
  }

  /* ---------- Drawing ---------- */
  function layout() {
    const N = st.N, m = Math.ceil(N / 2);
    const P = [[110, 190]];
    for (let i = 1; i <= N; i++) {
      if (i <= m) P.push([150 + (i - 1) * (760 / Math.max(1, m - 1)), 100]);
      else P.push([910 - (i - m - 1) * (760 / Math.max(1, N - m - 1)), 340]);
    }
    P.push([110, 250]);
    return { P, m };
  }

  function spanPath(k, P, m) {
    const a = P[k], b = P[k + 1];
    if (k === 0) return `M${a[0]},${a[1]} H128 V${b[1]} H${b[0]}`;
    if (k === m) return `M${a[0]},${a[1]} H955 V${b[1]} H${b[0]}`;
    if (k === st.N) return `M${a[0]},${a[1]} H128 V${b[1]} H${b[0]}`;
    return `M${a[0]},${a[1]} L${b[0]},${b[1]}`;
  }

  function svg() {
    const { P, m } = layout();
    const N = st.N;
    // Colour each span by the latest measurement that covered it
    const spanState = new Array(N + 1).fill("");
    st.measured.forEach(({ sec, low }) => { for (let k = Math.ceil(sec[0]); k < sec[1]; k++) spanState[k] = low ? "low" : "ok"; });
    let s = `<svg viewBox="0 0 1000 440" class="fg" role="img" aria-label="${esc(T("Runway edge circuit with {n} light bases", { n: N }))}">`;
    s += `<rect class="rwy" x="150" y="160" width="760" height="120" rx="4"/><path class="cl" d="M170,220 H890"/>`;
    s += `<text class="lab" x="530" y="200" text-anchor="middle">${esc(T("Runway"))}</text>`;
    for (let k = 0; k <= N; k++) s += `<path class="span ${spanState[k]}" d="${spanPath(k, P, m)}"/>`;
    // Vault
    s += `<g class="pick${st.sel === "vault" ? " on" : ""}" data-sel="vault" tabindex="0" role="button" aria-label="${esc(T("Vault"))}">
      <rect class="vault" x="20" y="165" width="90" height="110" rx="4"/><text class="lab${AGL.lang === "he" ? " small" : ""}" x="65" y="215" text-anchor="middle">${esc(T("Vault"))}</text>
      <text class="lab small" x="65" y="234" text-anchor="middle">CCR</text>${st.isolated ? `<rect class="lock" x="52" y="252" width="26" height="18" rx="3"/><path class="lockbow" d="M57,252 v-5 a8,8 0 0 1 16,0 v5"/>` : ""}</g>`;
    for (let i = 1; i <= N; i++) {
      const [x, y] = P[i], top = i <= m, open = st.open.has(i), on = st.sel === i;
      const ly = top ? y + 30 : y - 30;
      s += `<g class="pick${on ? " on" : ""}" data-sel="${i}" tabindex="0" role="button" aria-label="${esc(T("Base {n}", { n: i }))}${open ? ", " + esc(T("open")) : ""}">
        <circle class="light" cx="${x}" cy="${ly}" r="5"/>
        <rect class="pit${open ? " open" : ""}" x="${x - 12}" y="${y - 12}" width="24" height="24" rx="3"/>
        ${open ? `<rect class="lid" x="${x + 14}" y="${y - 10}" width="9" height="20" rx="2"/><path class="gap" d="M${x - 5},${y - 6} L${x + 5},${y + 6} M${x + 5},${y - 6} L${x - 5},${y + 6}"/>` : ""}
        <text class="num" x="${x}" y="${top ? y - 18 : y + 30}" text-anchor="middle">${i}</text></g>`;
    }
    if (st.done) {
      const f = st.fault;
      const [x, y] = f.kind === "conn" ? P[f.base] : [(P[f.a][0] + P[f.b][0]) / 2, (P[f.a][1] + P[f.b][1]) / 2];
      s += `<g class="fault"><circle cx="${x}" cy="${y}" r="18"/><path d="M${x + 3},${y - 12} L${x - 6},${y + 2} L${x},${y + 2} L${x - 3},${y + 12} L${x + 6},${y - 2} L${x},${y - 2} Z"/></g>`;
    }
    s += `<text class="lab small" x="20" y="420">${esc(T("Outgoing leg: bases 1–{m} · return leg: bases {m1}–{n}", { m, m1: m + 1, n: N }))}</text>`;
    return s + "</svg>";
  }

  function actions() {
    if (st.done) return "";
    const b = (a, label, arg, cls) => `<button type="button" class="btn${cls ? " " + cls : ""}" data-act="${a}"${arg !== undefined ? ` data-arg="${arg}"` : ""}>${esc(label)}</button>`;
    const s = st.sel;
    if (s === "vault") {
      return `<h4>${esc(T("Vault"))}</h4><div class="fg-acts">
        ${st.isolated ? `<span class="pill on-ok">${esc(T("Isolated and locked out"))}</span>` : b("isolate", T("Isolate and lock out the CCR ({m} min)", { m: COST.isolate }), undefined, "primary")}
        ${b("testOut", T("Megger the outgoing leg ({m} min)", { m: COST.test }))}
        ${b("testRet", T("Megger the return leg ({m} min)", { m: COST.test }))}</div>`;
    }
    const prev = pointName(s - 1), next = pointName(s + 1);
    if (!st.open.has(s)) {
      return `<h4>${esc(T("Base {n}", { n: s }))}</h4><div class="fg-acts">${b("open", T("Open the pit and separate the connectors ({m} min)", { m: COST.open }), undefined, "primary")}</div>`;
    }
    return `<h4>${esc(T("Base {n}", { n: s }))} <span class="pill on-warn">${esc(T("open"))}</span></h4>
      <div class="fg-acts">
        ${b("test", T("Megger towards {p} ({m} min)", { p: prev, m: COST.test }), -1, "primary")}
        ${b("test", T("Megger towards {p} ({m} min)", { p: next, m: COST.test }), 1, "primary")}
        ${b("inspect", T("Inspect the base and connectors ({m} min)", { m: COST.inspect }))}
        ${b("fix", T("Replace the connector here ({m} min)", { m: COST.fixConn }))}
        ${b("dig", T("Dig up the cable to {p} ({m} min)", { p: prev, m: COST.dig }), -1)}
        ${b("dig", T("Dig up the cable to {p} ({m} min)", { p: next, m: COST.dig }), 1)}
        ${b("close", T("Remake the connectors and close the pit ({m} min)", { m: COST.close }))}
      </div>`;
  }

  function result() {
    if (!st.done) return "";
    const f = st.fault;
    const where = f.kind === "conn" ? T("a wet, damaged connector in base {n}", { n: f.base }) : T("damaged cable between {a} and {b}", { a: pointName(f.a), b: pointName(f.b) });
    const stars = "★".repeat(st.stars) + "☆".repeat(3 - st.stars);
    return `<div class="fg-result">
      <span class="fg-stars" aria-label="${esc(T("{n} of 3 stars", { n: st.stars }))}">${stars}</span>
      <h4>${esc(T("Fault cleared in {h} h {m} min", { h: Math.floor(st.minutes / 60), m: st.minutes % 60 }))}</h4>
      <p>${esc(T("The short was {where}.", { where }))} ${esc(T("Par for this circuit, splitting it in half each time, is about {p} min.", { p: st.par }))}</p>
      ${st.warnings ? `<p class="fg-warn">${esc(T("Safety: you tried to work on a live circuit {n} time(s). On a real airfield that could be fatal.", { n: st.warnings }))}</p>` : ""}
      <button type="button" class="btn primary" data-new>${esc(T("Play again"))}</button></div>`;
  }

  function render() {
    const host = document.getElementById("fg");
    if (!host || !st.fault) return;
    host.querySelector(".fg-map").innerHTML = svg();
    AGL.bidiSvg(host.querySelector(".fg-map"));
    const pills = [
      [T("Time"), `${Math.floor(st.minutes / 60)}:${String(st.minutes % 60).padStart(2, "0")}`],
      [T("Pits opened"), st.opened],
      [T("Tests"), st.tests],
      [T("Wrong repairs"), st.wrong],
      [T("Safety warnings"), st.warnings]
    ];
    host.querySelector(".fg-stats").innerHTML = pills.map(([k, v], i) =>
      `<div class="readout${i === 4 && st.warnings ? " warn" : ""}"><span class="k">${esc(k)}</span><span class="v"><bdi dir="ltr">${esc(v)}</bdi></span></div>`).join("");
    host.querySelector(".fg-panel").innerHTML = (st.msg ? `<div class="feedback fg-msg ${st.msg.kind}">${esc(st.msg.text)}</div>` : "") + result() + actions();
    host.querySelector(".fg-log").innerHTML = st.log.length
      ? st.log.map(l => `<li><span class="pill ${l.low ? "on-bad" : "on-ok"}">${esc(l.low ? T("Low") : T("Good"))}</span> ${esc(l.text)}</li>`).join("")
      : `<li class="muted">${esc(T("No measurements yet. Start at the vault."))}</li>`;
    host.querySelectorAll("#fg-level button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.level === st.level)));
  }

  AGL.initFaultGame = function () {
    const host = document.getElementById("fg");
    if (!host) return;
    const pick = sel => {
      if (st.done) return;
      st.sel = sel === "vault" ? "vault" : +sel;
      st.msg = null;
      render();
    };
    host.querySelector(".fg-map").addEventListener("click", e => { const g = e.target.closest(".pick"); if (g) pick(g.dataset.sel); });
    host.querySelector(".fg-map").addEventListener("keydown", e => {
      const g = e.target.closest(".pick");
      if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(g.dataset.sel); host.querySelector(`.pick[data-sel="${g.dataset.sel}"]`).focus(); }
    });
    host.querySelector(".fg-panel").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-new")) { newGame(); return; }
      act(b.dataset.act, b.dataset.arg !== undefined ? +b.dataset.arg : undefined);
    });
    host.querySelector("#fg-level").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      st.level = b.dataset.level;
      newGame();
    });
    host.querySelector("#fg-new").addEventListener("click", newGame);
    newGame();
    AGL.onLang(render);
  };
})();
