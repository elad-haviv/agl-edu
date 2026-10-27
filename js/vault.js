/* Module F: the vault. An interactive single-line diagram (F1), a mains-failure simulation
   on the same diagram (F2) and a clickable floor plan (F3). Plain SVG, no libraries. */
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const T = (s, v) => esc(AGL.t(s, v));
  const C = () => AGL.d("VAULT");

  // CCR row, left to right. Critical circuits need 1 s switch-over in CAT II/III.
  const CCRS = [
    { id: "twy", critical: false }, { id: "edgeA", critical: false }, { id: "edgeB", critical: false },
    { id: "standby", critical: false, spare: true },
    { id: "appr", critical: true }, { id: "thr", critical: true }, { id: "rcl", critical: true },
    { id: "tdz", critical: true }, { id: "stop", critical: true }
  ];
  const cx = i => 40 + i * 102 + 42;
  const BUS = 260, NB = 380, CCR_Y = 430;

  function wrap(text, max) {
    const out = [];
    let line = "";
    String(text).split(/\s+/).forEach(w => {
      if ((line + " " + w).trim().length > max && line) { out.push(line); line = w; }
      else line = (line + " " + w).trim();
    });
    if (line) out.push(line);
    return out.slice(0, 3);
  }

  /* ---------- Single-line diagram ---------- */
  // st: { mains, genState: "off"|"starting"|"on", busLive, nbLive, nobreak, lit: {id: bool}, t }
  function sldSvg(st, sel) {
    const live = on => on ? "live" : "dead";
    const part = (id, inner, label) => `<g class="vp${sel === id ? " on" : ""}" data-part="${id}" tabindex="0" role="button" aria-label="${esc(label || C().parts[id].name)}">${inner}</g>`;
    let s = `<svg viewBox="0 0 1000 660" class="sld" role="img" aria-label="${T("Single-line diagram of the AGL vault")}">`;

    // Lines first, so the boxes sit on top of them
    s += `<path class="ln ${live(st.mains)}" d="M160,48 H180 V70 H200 M160,102 H180 V90 H200"/>`;
    s += `<path class="ln ${live(st.mains)}" d="M330,80 H388"/>`;
    s += `<path class="ln ${live(st.mains)}" d="M462,80 H590 V100"/>`;
    s += `<path class="ln ${live(st.genState === "on")}" d="M446,172 H560 V150"/>`;
    s += `<path class="ln ${live(st.busLive)}" d="M620,150 V${BUS}"/>`;
    s += `<path class="ln ${live(st.busLive)}" d="M790,${BUS} V196"/>`;
    s += `<path class="ln ${live(st.nbLive)}" d="M880,168 H970 V${NB} H950"/>`;
    // CCR feeds: from the essential bus, or for critical circuits from the no-break bus
    CCRS.forEach((c, i) => {
      const x = cx(i);
      if (c.critical && st.nobreak) s += `<path class="ln ${live(st.nbLive)}" d="M${x},${NB} V${CCR_Y}"/>`;
      else if (c.critical) s += `<path class="ln ${live(st.busLive)}" d="M${x},${BUS} V${NB - 8} A8,8 0 0 1 ${x},${NB + 8} V${CCR_Y}"/>`;
      else s += `<path class="ln ${live(st.busLive)}" d="M${x},${BUS} V${CCR_Y}"/>`;
      const out = !c.spare && st.lit[c.id];
      s += `<path class="ln out ${live(out)}" d="M${x},500 V515 M${x},533 V600"/><path class="arrow ${live(out)}" d="M${x - 6},592 L${x},604 L${x + 6},592 Z"/>`;
    });
    // Control network
    s += `<path class="ctl" d="M830,38 H860 M830,50 H860"/>`;
    s += `<path class="ctl" d="M935,66 V412 H${cx(0)}"/>`;
    CCRS.forEach((c, i) => { s += `<path class="ctl" d="M${cx(i)},412 V${CCR_Y}"/>`; });
    s += `<text class="lab tiny" x="845" y="90" text-anchor="middle">${T("Fibre link")}</text>`;

    // Equipment
    s += part("feeders", `<rect class="box" x="30" y="30" width="130" height="36" rx="4"/><text class="lab" x="95" y="53" text-anchor="middle">${T("Feeder A")}</text>
      <rect class="box" x="30" y="84" width="130" height="36" rx="4"/><text class="lab" x="95" y="107" text-anchor="middle">${T("Feeder B")}</text>`);
    s += part("mv", `<rect class="box" x="200" y="40" width="130" height="80" rx="4"/><text class="lab" x="265" y="76" text-anchor="middle">${T("MV")}</text><text class="lab" x="265" y="96" text-anchor="middle">${T("switchgear")}</text>`);
    s += part("transformer", `<circle class="box" cx="410" cy="80" r="22"/><circle class="box see" cx="440" cy="80" r="22"/><text class="lab small" x="425" y="124" text-anchor="middle">${T("Transformer")}</text>`);
    const genText = st.genState === "starting" ? T("Starting {s} s", { s: st.t.toFixed(1) }) : st.genState === "on" ? T("On load") : T("Standby");
    s += part("generator", `<circle class="box gen ${st.genState}" cx="420" cy="172" r="26"/><text class="lab big" x="420" y="180" text-anchor="middle">G</text>
      <text class="lab small" x="420" y="214" text-anchor="middle">${T("Generator")}</text><text class="lab small state" x="420" y="230" text-anchor="middle">${genText}</text>`);
    const atsText = st.mains ? T("Mains") : st.genState === "on" ? T("Generator") : T("No supply");
    s += part("ats", `<rect class="box" x="530" y="100" width="120" height="50" rx="4"/><text class="lab" x="590" y="122" text-anchor="middle">ATS</text><text class="lab small state" x="590" y="141" text-anchor="middle">${atsText}</text>`);
    s += part("lvboard", `<rect class="hit" x="30" y="246" width="930" height="24"/><path class="bus ${live(st.busLive)}" d="M40,${BUS} H950"/><text class="lab small" x="40" y="250">${T("Main LV switchboard (essential bus)")}</text>`);
    s += part("ups", `<rect class="box" x="760" y="140" width="120" height="56" rx="4"/><text class="lab" x="820" y="166" text-anchor="middle">UPS</text>
      <path class="batt" d="M786,180 h10 M791,176 v8 M810,180 h22 M818,184 h6"/><text class="lab small" x="820" y="186" text-anchor="middle"></text>
      <rect class="hit" x="430" y="366" width="540" height="24"/><path class="bus ${live(st.nbLive)}" d="M430,${NB} H970"/><text class="lab small" x="440" y="371">${T("No-break bus (UPS)")}</text>`);
    s += part("tower", `<rect class="box" x="700" y="20" width="130" height="46" rx="4"/><text class="lab" x="765" y="40" text-anchor="middle">${T("Tower")}</text><text class="lab small" x="765" y="57" text-anchor="middle">${T("control panel")}</text>`);
    s += part("alcms", `<rect class="box" x="860" y="20" width="120" height="46" rx="4"/><text class="lab" x="920" y="40" text-anchor="middle">ALCMS</text><text class="lab small" x="920" y="57" text-anchor="middle">${T("controllers")}</text>`);

    const names = C().circuits;
    CCRS.forEach((c, i) => {
      const x = 40 + i * 102, lit = st.lit[c.id];
      const lines = wrap(names[c.id], 11);
      s += part(c.spare ? "standby" : "ccr:" + c.id, `<rect class="ccr${c.spare ? " spare" : ""}${lit && !c.spare ? " lit" : ""}" x="${x}" y="${CCR_Y}" width="84" height="70" rx="4"/>
        <text class="lab small strong" x="${x + 42}" y="${CCR_Y + 18}" text-anchor="middle">${c.spare ? T("Standby") : "CCR " + (i < 3 ? i + 1 : i)}</text>
        ${lines.map((l, k) => `<text class="lab tiny" x="${x + 42}" y="${CCR_Y + (lines.length > 2 ? 34 : 38) + k * 13}" text-anchor="middle">${esc(l)}</text>`).join("")}`,
        names[c.id]);
      if (!c.spare) {
        s += part("cutout", `<rect class="box" x="${cx(i) - 14}" y="515" width="28" height="18" rx="2"/><text class="lab tiny" x="${cx(i)}" y="528" text-anchor="middle">S-1</text>`);
        s += part("surge", `<path class="surge" d="M${cx(i)},560 H${cx(i) + 20} V570 M${cx(i) + 14},570 h12 l-6,10 Z M${cx(i) + 20},580 V628"/>`);
      }
    });
    s += `<path class="ctl" d="M${cx(3)},500 V510 H${cx(8) + 30}" /><text class="lab tiny" x="${cx(3) + 6}" y="508">${T("changeover")}</text>`;
    s += `<text class="lab small" x="960" y="652" text-anchor="end">${T("To airfield circuits")} ↓</text>`;
    s += part("earth", `<rect class="earthbar" x="30" y="628" width="930" height="8"/><text class="lab small" x="30" y="652">${T("Main earth bar")}</text>`);
    s += "</svg>";
    return s;
  }

  function partInfo(pid) {
    const c = C();
    if (pid.startsWith("ccr:")) {
      const id = pid.slice(4), P = c.parts.ccr;
      return { name: `${P.name}: ${c.circuits[id]}`, text: P.text, specs: P.specs };
    }
    return c.parts[pid];
  }

  function infoHtml(pid, intro) {
    if (!pid) return `<span class="tag">${T("Single-line diagram")}</span><p>${esc(intro)}</p>`;
    const P = partInfo(pid);
    return `<span class="tag">${T("Selected")}</span><h4>${esc(P.name)}</h4><p>${esc(P.text)}</p>
      ${P.specs ? `<dl>${P.specs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : ""}`;
  }

  const allLit = () => Object.fromEntries(CCRS.map(c => [c.id, !c.spare]));

  function bindParts(host, onPick) {
    host.addEventListener("click", e => { const g = e.target.closest(".vp"); if (g) onPick(g.dataset.part); });
    host.addEventListener("keydown", e => {
      const g = e.target.closest(".vp");
      if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onPick(g.dataset.part); }
    });
  }

  /* ---------- F1: explore the diagram ---------- */
  function explorer() {
    const host = document.getElementById("vault-sld");
    const info = document.getElementById("vault-sld-info");
    let sel = null;
    const render = () => {
      host.innerHTML = sldSvg({ mains: true, genState: "off", busLive: true, nbLive: true, nobreak: true, lit: allLit(), t: 0 }, sel);
      AGL.bidiSvg(host);
      info.innerHTML = infoHtml(sel, AGL.t("Select any piece of equipment in the diagram. Yellow lines are energised."));
    };
    bindParts(host, pid => {
      sel = sel === pid ? null : pid;
      render();
      const g = host.querySelector(`[data-part="${CSS.escape(pid)}"]`);
      if (g) g.focus({ preventScroll: true });
    });
    render();
    return render;
  }

  /* ---------- F2: mains failure simulation ---------- */
  function simulator() {
    const host = document.getElementById("vault-sim");
    const out = document.getElementById("vault-sim-table");
    const status = document.getElementById("vault-sim-status");
    const S = { cat: 3, nobreak: true, genStart: 10, failed: false, t: 0, raf: 0, last: 0 };
    const SPEED = 2;     // simulated seconds per real second
    const RESTART = 1;   // CCR ramp-up after its supply returns, s
    const need = c => (S.cat === 3 && c.critical ? 1 : 15);
    const onNoBreak = c => c.critical && S.nobreak;
    const restoredAt = c => (onNoBreak(c) ? 0 : S.genStart + RESTART);

    function state() {
      const genState = !S.failed ? "off" : S.t >= S.genStart ? "on" : "starting";
      const busLive = !S.failed || genState === "on";
      const lit = {};
      CCRS.forEach(c => { lit[c.id] = !c.spare && (!S.failed || S.t >= restoredAt(c)); });
      return { mains: !S.failed, genState, busLive, nbLive: true, nobreak: S.nobreak, lit, t: Math.min(S.t, S.genStart) };
    }

    function render() {
      host.innerHTML = sldSvg(state(), null);
      AGL.bidiSvg(host);
      const names = C().circuits;
      status.innerHTML = S.failed
        ? `<span class="pill on-bad">${T("Mains failed")}</span> <span class="mono">t = ${S.t.toFixed(1)} s</span>`
        : `<span class="pill on-ok">${T("Mains healthy")}</span>`;
      out.innerHTML = `<thead><tr><th>${T("Circuit")}</th><th>${T("Fed from")}</th><th class="num">${T("Required")}</th><th class="num">${T("Back after")}</th><th>${T("Result")}</th></tr></thead><tbody>` +
        CCRS.filter(c => !c.spare).map(c => {
          const req = need(c), at = restoredAt(c);
          const done = S.failed && S.t >= at;
          let back = "–", res = `<span class="pill">${T("Not tested")}</span>`;
          if (S.failed) {
            back = done ? (at === 0 ? T("No break") : at.toFixed(1) + " s") : T("Dark");
            const ok = at <= req;
            if (done || S.t > req) res = ok ? `<span class="pill on-ok">${T("Meets {r} s", { r: req })}</span>` : `<span class="pill on-bad">${T("Too slow")}</span>`;
            else res = `<span class="pill on-warn">${T("Waiting")}</span>`;
          }
          return `<tr><td>${esc(names[c.id])}</td><td>${onNoBreak(c) ? T("UPS no-break bus") : T("Essential bus")}</td><td class="num">${req} s</td><td class="num">${back}</td><td>${res}</td></tr>`;
        }).join("") + "</tbody>";
    }

    function tick(now) {
      S.t += (now - S.last) / 1000 * SPEED;
      S.last = now;
      render();
      if (S.t < S.genStart + RESTART + 3) S.raf = requestAnimationFrame(tick);
    }

    const btn = document.getElementById("vault-fail");
    const label = () => { btn.textContent = AGL.t(S.failed ? "Restore the mains" : "Fail the mains"); };
    btn.addEventListener("click", () => {
      cancelAnimationFrame(S.raf);
      S.failed = !S.failed;
      S.t = 0;
      if (S.failed) {
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { S.t = S.genStart + RESTART + 3; }
        else { S.last = performance.now(); S.raf = requestAnimationFrame(tick); }
      }
      label();
      render();
    });
    document.getElementById("vault-cat").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      S.cat = +b.dataset.cat;
      b.parentNode.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
    const nb = document.getElementById("vault-nobreak");
    nb.addEventListener("click", () => {
      S.nobreak = !S.nobreak;
      nb.setAttribute("aria-pressed", String(S.nobreak));
      render();
    });
    const gen = document.getElementById("vault-gen");
    gen.addEventListener("input", () => {
      S.genStart = +gen.value;
      document.getElementById("vault-gen-label").textContent = S.genStart + " s";
      render();
    });
    label();
    render();
    return () => { label(); render(); };
  }

  /* ---------- F3: floor plan ---------- */
  const PLAN = [
    { id: "ccrs", n: [380, 66], draw: () => [0, 1, 2, 3, 4, 5, 6].map(k => `<rect class="eq" x="${140 + k * 70}" y="34" width="56" height="50" rx="3"/><text class="lab tiny" x="${168 + k * 70}" y="63" text-anchor="middle">CCR</text>`).join("") },
    { id: "trench", n: [656, 50], draw: () => `<rect class="trench" x="128" y="26" width="504" height="64"/>` },
    { id: "mats", n: [656, 100], draw: () => `<rect class="mat" x="130" y="92" width="500" height="16"/>` },
    { id: "clear", n: [380, 160], draw: () => `<rect class="clear" x="130" y="108" width="500" height="96"/><text class="lab small" x="380" y="196" text-anchor="middle">${T("Working clearance")}</text>` },
    { id: "lv", n: [70, 255], draw: () => `<rect class="eq" x="24" y="140" width="36" height="230" rx="3"/><text class="lab tiny vert" x="42" y="255" text-anchor="middle" transform="rotate(-90 42 255)">${T("LV switchboard")}</text><rect class="eq" x="24" y="380" width="36" height="40" rx="3"/><text class="lab tiny" x="42" y="404" text-anchor="middle">ATS</text>` },
    { id: "earthbar", n: [70, 462], draw: () => `<rect class="earthbar" x="26" y="436" width="8" height="50"/>` },
    { id: "alcms", n: [254, 424], draw: () => `<rect class="eq" x="200" y="436" width="50" height="58" rx="3"/><rect class="eq" x="256" y="436" width="50" height="58" rx="3"/><text class="lab tiny" x="253" y="470" text-anchor="middle">ALCMS</text>` },
    { id: "board", n: [376, 464], draw: () => `<rect class="board" x="330" y="478" width="90" height="16"/>` },
    { id: "bench", n: [506, 424], draw: () => `<rect class="eq light" x="440" y="436" width="130" height="58" rx="3"/>` },
    { id: "hvac", n: [640, 270], draw: () => [200, 280].map(y => `<rect class="eq" x="658" y="${y}" width="38" height="50" rx="3"/><circle class="fan" cx="677" cy="${y + 25}" r="13"/>`).join("") },
    { id: "fire", n: [300, 330], draw: () => `<circle class="det" cx="300" cy="300" r="9"/><circle class="det" cx="500" cy="300" r="9"/><circle class="ext" cx="140" cy="486" r="7"/><circle class="ext" cx="586" cy="486" r="7"/>` },
    { id: "exits", n: [95, 545], draw: () => [70, 600].map(x => `<rect class="gap" x="${x}" y="496" width="50" height="8"/><path class="door" d="M${x},500 L${x},550 A50,50 0 0 0 ${x + 50},500"/><rect class="emerg" x="${x + 16}" y="474" width="18" height="12"/>`).join("") },
    { id: "mvroom", n: [940, 50], draw: () => `<rect class="eq" x="730" y="50" width="90" height="70" rx="3"/><text class="lab tiny" x="775" y="90" text-anchor="middle">RMU</text><circle class="eq" cx="880" cy="95" r="34"/><text class="lab tiny" x="880" y="99" text-anchor="middle">${T("Transformer")}</text>` },
    { id: "genroom", n: [940, 200], draw: () => `<rect class="eq" x="730" y="210" width="150" height="80" rx="6"/><text class="lab small" x="805" y="255" text-anchor="middle">${T("Generator")}</text><rect class="bund" x="890" y="290" width="76" height="50"/><rect class="eq light" x="898" y="298" width="60" height="34" rx="10"/><text class="lab tiny" x="928" y="319" text-anchor="middle">${T("Fuel")}</text>` },
    { id: "battery", n: [940, 380], draw: () => `<rect class="eq" x="730" y="380" width="70" height="90" rx="3"/><text class="lab tiny" x="765" y="430" text-anchor="middle">UPS</text>${[0, 1, 2].map(k => `<rect class="eq light" x="${820 + k * 42}" y="400" width="34" height="70" rx="2"/>`).join("")}<text class="lab tiny" x="883" y="488" text-anchor="middle">${T("Batteries")}</text>` }
  ];

  function plan() {
    const host = document.getElementById("vault-plan");
    const info = document.getElementById("vault-plan-info");
    const list = document.getElementById("vault-plan-list");
    let sel = null;
    const render = () => {
      const c = C().plan;
      let s = `<svg viewBox="0 0 1000 570" class="plan" role="img" aria-label="${T("Floor plan of an AGL vault")}">
        <defs><pattern id="hatch" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><path d="M0,0 V10" class="hatch-line"/></pattern></defs>
        <rect class="room" x="20" y="20" width="960" height="480"/>
        <path class="wall" d="M700,20 V500 M700,170 H980 M700,350 H980"/>
        <text class="lab room-name" x="40" y="128">${T("CCR hall")}</text>
        <text class="lab room-name" x="716" y="40">${T("MV room")}</text>
        <text class="lab room-name" x="716" y="194">${T("Generator room")}</text>
        <text class="lab room-name" x="716" y="374">${T("UPS and battery room")}</text>`;
      PLAN.forEach((it, i) => {
        s += `<g class="vp${sel === it.id ? " on" : ""}" data-part="${it.id}" tabindex="0" role="button" aria-label="${esc((i + 1) + ". " + c[it.id].name)}">${it.draw()}
          <circle class="pin" cx="${it.n[0]}" cy="${it.n[1]}" r="13"/><text class="pin-n" x="${it.n[0]}" y="${it.n[1] + 5}" text-anchor="middle">${i + 1}</text></g>`;
      });
      s += "</svg>";
      host.innerHTML = s;
      AGL.bidiSvg(host);
      list.innerHTML = PLAN.map((it, i) => `<li><button type="button" data-part="${it.id}" aria-pressed="${sel === it.id}"><span class="pn">${i + 1}</span>${esc(c[it.id].name)}</button></li>`).join("");
      info.innerHTML = sel ? `<span class="tag">${PLAN.findIndex(p => p.id === sel) + 1}</span><h4>${esc(c[sel].name)}</h4><p>${esc(c[sel].text)}</p>`
        : `<span class="tag">${T("Floor plan")}</span><p>${T("Select a numbered item on the plan or in the list.")}</p>`;
    };
    const pick = pid => { sel = sel === pid ? null : pid; render(); };
    bindParts(host, pick);
    list.addEventListener("click", e => { const b = e.target.closest("button"); if (b) pick(b.dataset.part); });
    render();
    return render;
  }

  AGL.initVault = function () {
    const renders = [explorer(), simulator(), plan()];
    AGL.onLang(() => renders.forEach(r => r()));
  };
})();
