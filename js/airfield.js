/* Module B: interactive airfield lighting plan (runway 09, landing eastward). */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const W = 1160, H = 520;
  const X0 = 290, X1 = 1090;           // threshold 09 and runway end (3000 m)
  const K = (X1 - X0) / 3000;          // px per metre, longitudinal
  const CY = 220, EY1 = 200, EY2 = 240; // runway centre and edges (lateral is exaggerated)
  const COL = {
    white: "var(--l-white)", yellow: "var(--l-yellow)", red: "var(--l-red)",
    green: "var(--l-green)", blue: "var(--l-blue)"
  };
  const CIRC = { A: "var(--c-a)", B: "var(--c-b)", S: "var(--c-s)" };
  const OPACITY = [0, 0.32, 0.48, 0.66, 0.84, 1];
  const ORDER = ["appr", "thr", "edge", "rcl", "tdz", "end", "papi", "twyedge", "twycl", "stopbar", "rgl", "signs"];

  const UNLIT = "#3b4754";
  const state = { cat: 3, step: 5, view: "color", failed: { A: false, B: false }, sel: "edge", dimmed: false, papiAngle: 3.0 };
  const lights = [];
  const groups = {};
  const labels = [];
  let svg;

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function group(id) {
    if (!groups[id]) {
      const g = el("g", { class: "light-group", "data-g": id }, svg);
      g.addEventListener("click", () => select(id, true));
      groups[id] = g;
    }
    return groups[id];
  }

  function light(gid, x, y, color, opts) {
    const o = opts || {};
    const c = el("circle", {
      cx: x.toFixed(1), cy: y.toFixed(1), r: o.r || 2.1,
      class: "light" + (o.cls ? " " + o.cls : ""),
      stroke: "transparent", "stroke-width": 7
    }, group(gid));
    lights.push({ gid, el: c, color, circ: o.circ || "S", cat3: !!o.cat3 });
  }

  function barrette(gid, x, ys, color, opts) {
    ys.forEach(y => light(gid, x, y, color, opts));
  }

  function text(x, y, str, attrs, vars) {
    const t = el("text", Object.assign({ x, y, fill: "var(--night-ink)", "font-size": 18, "font-weight": 500, "font-family": "IBM Plex Sans, IBM Plex Sans Hebrew, system-ui, sans-serif" }, attrs || {}), svg);
    labels.push([t, str, vars]);
    t.textContent = AGL.t(str, vars);
    return t;
  }

  function relabel() {
    labels.forEach(([t, str, vars]) => { t.textContent = AGL.t(str, vars); });
    svg.setAttribute("aria-label", AGL.t("Plan of runway 09/27 with approach, runway, taxiway and apron lighting"));
    AGL.bidiSvg(svg);
  }

  function build(host) {
    svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" });
    host.appendChild(svg);

    const defs = el("defs", {}, svg);
    const f = el("filter", { id: "glow", x: "-200%", y: "-200%", width: "500%", height: "500%" }, defs);
    el("feGaussianBlur", { stdDeviation: 2.2, result: "b" }, f);
    const m = el("feMerge", {}, f);
    el("feMergeNode", { in: "b" }, m);
    el("feMergeNode", { in: "SourceGraphic" }, m);

    // Ground, pavements, paint
    el("rect", { x: 0, y: 0, width: W, height: H, fill: "var(--grass)" }, svg);
    el("rect", { x: X0, y: EY1, width: X1 - X0, height: EY2 - EY1, fill: "var(--pavement)" }, svg);
    el("line", { x1: X0 + 40, y1: CY, x2: X1 - 40, y2: CY, stroke: "#4a5866", "stroke-width": 1, "stroke-dasharray": "10 8" }, svg);
    el("rect", { x: 400, y: 388, width: 610, height: 24, fill: "var(--pavement)" }, svg);
    el("rect", { x: 422, y: EY2, width: 16, height: 148, fill: "var(--pavement)" }, svg);
    el("rect", { x: 952, y: EY2, width: 16, height: 148, fill: "var(--pavement)" }, svg);
    el("rect", { x: 732, y: 412, width: 16, height: 18, fill: "var(--pavement)" }, svg);
    el("rect", { x: 600, y: 430, width: 280, height: 76, fill: "var(--pavement)" }, svg);
    el("line", { x1: 422, y1: 300, x2: 438, y2: 300, stroke: "#b89a2a", "stroke-width": 1 }, svg);
    el("line", { x1: 952, y1: 300, x2: 968, y2: 300, stroke: "#b89a2a", "stroke-width": 1 }, svg);
    text(X0 + 14, CY + 5, "09", { fill: "#5f6e7b", "font-size": 14, "font-weight": 600 });
    text(X1 - 32, CY + 5, "27", { fill: "#5f6e7b", "font-size": 14, "font-weight": 600 });

    // Approach lighting (900 m, barrettes every 30 m)
    let i = 0;
    for (let d = 30; d <= 900; d += 30, i++) {
      const x = X0 - d * K;
      barrette("appr", x, [CY - 3, CY, CY + 3], COL.white, { circ: i % 2 ? "B" : "A" });
    }
    const crossbar = (d, half, cat3) => {
      const x = X0 - d * K;
      let j = 0;
      for (let y = 8; y <= half; y += 4, j++) {
        light("appr", x, CY - y, COL.white, { circ: j % 2 ? "B" : "A", cat3 });
        light("appr", x, CY + y, COL.white, { circ: j % 2 ? "A" : "B", cat3 });
      }
    };
    crossbar(300, 28, false);
    crossbar(150, 16, true);
    i = 0;
    for (let d = 30; d <= 270; d += 30, i++) {
      const x = X0 - d * K;
      barrette("appr", x, [CY - 14, CY - 11, CY - 8], COL.red, { circ: i % 2 ? "B" : "A", cat3: true });
      barrette("appr", x, [CY + 8, CY + 11, CY + 14], COL.red, { circ: i % 2 ? "A" : "B", cat3: true });
    }

    // Threshold (green) and runway end (red)
    for (let y = EY1 + 2; y <= EY2 - 2; y += 4.5) {
      light("thr", X0 - 3, y, COL.green);
      light("end", X1 + 3, y, COL.red);
    }

    // Runway edge: 60 m spacing, yellow over the last 600 m
    i = 0;
    for (let d = 0; d <= 3000; d += 60, i++) {
      const x = X0 + d * K;
      const c = d > 3000 - 600 ? COL.yellow : COL.white;
      light("edge", x, EY1 - 5, c, { circ: i % 2 ? "B" : "A" });
      light("edge", x, EY2 + 5, c, { circ: i % 2 ? "B" : "A" });
    }

    // Runway centreline: 15 m spacing, colour-coded by distance to go
    i = 0;
    for (let d = 7.5; d < 3000; d += 15, i++) {
      const rem = 3000 - d;
      let c = COL.white;
      if (rem <= 300) c = COL.red;
      else if (rem <= 900) c = i % 2 ? COL.red : COL.white;
      light("rcl", X0 + d * K, CY, c, { circ: i % 2 ? "B" : "A", cat3: true, r: 1.7 });
    }

    // Touchdown zone: barrette pairs every 60 m over 900 m
    i = 0;
    for (let d = 60; d <= 900; d += 60, i++) {
      const x = X0 + d * K;
      barrette("tdz", x, [CY - 14, CY - 11, CY - 8], COL.white, { circ: i % 2 ? "B" : "A", cat3: true, r: 1.7 });
      barrette("tdz", x, [CY + 8, CY + 11, CY + 14], COL.white, { circ: i % 2 ? "A" : "B", cat3: true, r: 1.7 });
    }

    // PAPI: four units left of the runway; on slope = two red nearest the runway
    const px = X0 + 300 * K;
    [COL.red, COL.red, COL.white, COL.white].forEach((c, u) => {
      light("papi", px, EY1 - 16 - u * 8, c, { r: 3 });
    });

    // Taxiway edge (blue): parallel taxiway and apron
    for (let x = 400; x <= 1010; x += 22) {
      if (Math.abs(x - 430) > 14 && Math.abs(x - 960) > 14) light("twyedge", x, 385, COL.blue, { r: 1.9 });
      if (Math.abs(x - 740) > 14) light("twyedge", x, 415, COL.blue, { r: 1.9 });
    }
    for (let x = 600; x <= 880; x += 22) {
      if (Math.abs(x - 740) > 14) light("twyedge", x, 427, COL.blue, { r: 1.9 });
      light("twyedge", x, 509, COL.blue, { r: 1.9 });
    }
    for (let y = 449; y <= 491; y += 21) {
      light("twyedge", 597, y, COL.blue, { r: 1.9 });
      light("twyedge", 883, y, COL.blue, { r: 1.9 });
    }

    // Taxiway centreline (green; green/yellow inside the runway strip)
    [430, 960].forEach(x => {
      let j = 0;
      for (let y = 248; y <= 396; y += 7, j++) {
        const c = y < 330 && j % 2 ? COL.yellow : COL.green;
        light("twycl", x, y, c, { r: 1.7 });
      }
    });
    for (let x = 412; x <= 1000; x += 9) light("twycl", x, 400, COL.green, { r: 1.7, cat3: true });
    for (let y = 408; y <= 428; y += 7) light("twycl", 740, y, COL.green, { r: 1.7 });

    // Stop bars, runway guard lights, signs at both holding positions
    [430, 960].forEach((x, n) => {
      for (let sx = x - 8; sx <= x + 8; sx += 4) light("stopbar", sx, 300, COL.red, { r: 1.8, cat3: true });
      [x - 15, x + 15].forEach(rx => {
        light("rgl", rx, 296, COL.yellow, { r: 2, cls: "rgl-a" });
        light("rgl", rx, 304, COL.yellow, { r: 2, cls: "rgl-b" });
      });
      const g = group("signs");
      const sx = x + 22;
      el("rect", { x: sx, y: 286, width: 14, height: 13, fill: "var(--sign-black)", stroke: "var(--sign-yellow)", "stroke-width": 1, class: "light" }, g);
      const t1 = el("text", { x: sx + 7, y: 296, "text-anchor": "middle", "font-size": 10, "font-weight": 700, fill: "var(--sign-yellow)", "font-family": "Barlow Condensed, Arial Narrow, sans-serif", class: "light" }, g);
      t1.textContent = n ? "B" : "A";
      el("rect", { x: sx + 15, y: 286, width: 32, height: 13, fill: "var(--sign-red)", class: "light" }, g);
      const t2 = el("text", { x: sx + 31, y: 296, "text-anchor": "middle", "font-size": 10, "font-weight": 700, fill: "var(--sign-white)", "font-family": "Barlow Condensed, Arial Narrow, sans-serif", class: "light" }, g);
      t2.textContent = "09-27";
    });

    // Labels and scale
    text(40, 300, "Approach lighting · 900 m");
    text(X0 - 6, 272, "THR 09", { "text-anchor": "middle" });
    text(640, 275, "Runway 09/27 · 3000 m × 45 m");
    text(X1, 272, "END", { "text-anchor": "middle" });
    text(px + 8, EY1 - 30, "PAPI");
    text(470, 440, "Taxiway P");
    text(406, 330, "A", { "font-size": 16, "font-weight": 600 });
    text(978, 330, "B", { "font-size": 16, "font-weight": 600 });
    text(740, 474, "Apron", { "text-anchor": "middle" });
    const sbx = 40, sby = 480, sbw = 500 * K;
    el("line", { x1: sbx, y1: sby, x2: sbx + sbw, y2: sby, stroke: "var(--night-muted)", "stroke-width": 1 }, svg);
    [0, 250, 500].forEach(m => {
      const x = sbx + m * K;
      el("line", { x1: x, y1: sby - 4, x2: x, y2: sby + 4, stroke: "var(--night-muted)" }, svg);
      text(x, sby + 18, "{m} m", { "text-anchor": "middle", "font-size": 16 }, { m });
    });
    text(sbx, sby - 10, "Longitudinal scale", { "font-size": 16 });
  }

  function render() {
    const glow = state.step >= 3;
    lights.forEach(L => {
      L.el.style.display = !L.cat3 || state.cat === 3 ? "" : "none";
      // Lights are drawn unlit when the circuits are switched off or their circuit has failed
      const lit = state.step > 0 && !state.failed[L.circ];
      L.el.classList.toggle("unlit", !lit);
      L.el.style.fill = lit ? (state.view === "circuit" ? CIRC[L.circ] : L.color) : UNLIT;
      L.el.style.opacity = lit ? OPACITY[state.step] : 1;
    });
    Object.keys(groups).forEach(id => {
      groups[id].classList.toggle("dim", state.dimmed && id !== state.sel);
      if (id !== "signs") groups[id].setAttribute("filter", glow ? "url(#glow)" : "");
    });
    groups.signs.style.opacity = state.step > 0 ? "" : "0.45";
    renderLegend();
    renderInfo();
  }

  function renderLegend() {
    const host = document.getElementById("map-legend");
    host.innerHTML = "";
    if (state.view === "circuit") {
      [["A", AGL.t("Circuit A")], ["B", AGL.t("Circuit B (interleaved)")], ["S", AGL.t("Single / individually switched")]].forEach(([k, label]) => {
        const s = document.createElement("span");
        s.className = "pill";
        s.style.color = "var(--night-ink)";
        s.style.background = "transparent";
        s.style.borderColor = "#2a3b4c";
        s.innerHTML = `<i class="dot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${CIRC[k]}"></i>${label}`;
        host.appendChild(s);
      });
    }
    ORDER.forEach(id => {
      const info = AGL.d("LIGHTS")[id];
      const hidden = state.cat !== 3 && (id === "rcl" || id === "tdz" || id === "stopbar");
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-pressed", String(state.sel === id));
      b.innerHTML = `<span class="dot" style="background:${info.colour}"></span>${info.name}${hidden ? " (CAT II/III)" : ""}`;
      b.addEventListener("click", () => select(id, true));
      host.appendChild(b);
    });
  }

  function papiHtml() {
    const settings = [2.5, 2.8333, 3.1667, 3.5]; // pilot's view, left (outer) to right (nearest runway)
    const whites = settings.filter(s => state.papiAngle > s).length;
    const msg = AGL.t(["Well below the glide path", "Slightly low", "On the glide path", "Slightly high", "Well above the glide path"][whites]);
    const units = settings.map(s => `<i style="background:${state.papiAngle > s ? "var(--l-white)" : "var(--l-red)"}"></i>`).join("");
    return `<div class="section">
      <h4>${AGL.t("Fly the PAPI")}</h4>
      <label class="ctl-label" for="papi-angle">${AGL.t("Approach angle")} <span class="mono" dir="ltr">${state.papiAngle.toFixed(2)}°</span></label>
      <input type="range" id="papi-angle" min="2" max="4" step="0.05" value="${state.papiAngle}">
      <div class="papi" aria-hidden="true">${units}</div>
      <p class="small"><strong>${msg}.</strong> ${AGL.t("{r} red, {w} white.", { r: 4 - whites, w: whites })}</p>
    </div>`;
  }

  function renderInfo() {
    const info = AGL.d("LIGHTS")[state.sel];
    const host = document.getElementById("light-info");
    const specs = info.specs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    host.innerHTML = `
      <span class="tag">${AGL.t("Selected system")}</span>
      <h4>${info.name}</h4>
      <p class="small"><span class="swatch" style="background:${info.colour}"></span>${info.colourText}</p>
      <p>${info.purpose}</p>
      <dl>${specs}<dt>${AGL.t("Circuits")}</dt><dd>${info.circuits}</dd></dl>
      ${info.papi ? papiHtml() : ""}
      <h4>${AGL.t("Electrical notes")}</h4>
      <p class="small">${info.electrical}</p>
      <p class="ref" dir="ltr">${info.refs}</p>`;
    const r = document.getElementById("papi-angle");
    if (r) r.addEventListener("input", e => {
      state.papiAngle = parseFloat(e.target.value);
      renderInfo();
      document.getElementById("papi-angle").focus();
    });
  }

  function select(id, user) {
    if (user && state.sel === id && state.dimmed) state.dimmed = false;
    else { state.sel = id; state.dimmed = !!user; }
    render();
  }

  function segment(id, attr, onPick) {
    const seg = document.getElementById(id);
    seg.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      onPick(b.dataset[attr]);
    });
  }

  AGL.initAirfield = function () {
    build(document.getElementById("airfield"));
    segment("cat-seg", "cat", v => { state.cat = +v; render(); });
    segment("view-seg", "view", v => { state.view = v; render(); });
    const step = document.getElementById("map-step");
    const stepLabel = () => {
      const text = state.step ? "B" + state.step : AGL.t("Off");
      document.getElementById("step-label").textContent = text;
      step.setAttribute("aria-valuetext", text);
    };
    step.addEventListener("input", () => {
      state.step = +step.value;
      stepLabel();
      render();
    });
    const failButtons = ["A", "B"].map(c => {
      const b = document.getElementById("fail-" + c.toLowerCase());
      const label = () => { b.textContent = AGL.t(state.failed[c] ? "Restore circuit " + c : "Lose circuit " + c); };
      b.hidden = false;
      b.addEventListener("click", () => {
        state.failed[c] = !state.failed[c];
        b.setAttribute("aria-pressed", String(state.failed[c]));
        label();
        render();
      });
      return label;
    });
    const labels = () => { stepLabel(); failButtons.forEach(f => f()); };
    labels();
    relabel();
    render();
    AGL.onLang(() => { labels(); relabel(); render(); });
  };
})();
