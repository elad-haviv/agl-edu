/* Language support. English lives in the markup and the JS source; Hebrew (RTL)
   comes from js/he.js. Strings missing from the Hebrew tables fall back to English. */
(function () {
  const KEY = "agl-lang";
  const HEB = /[֐-׿]/;
  // Containers whose content the modules render themselves in the current language
  const SKIP = "#airfield, #map-legend, #light-info, #sim, #sim-steps, #sim-readouts, #sim-alarms, #sim-log, " +
    "#calc-rows, #c-results, #c-notes, #c-size, #c-size-note, #ir-rows, #ir-chart, #ir-title, #lr-dev, #lr-text, " +
    "#ts-pick, #ts-card, #quiz-card, #quiz-best, #gloss-list, #step-label, #fail-a, #fail-b, #lang-seg, #ir-more, #resume, #cv-total, #cv-total-note, #cv-results, #cv-draw, #cv-rows, #cv-line, #flows, .cd-diagram, .cd-info, .cd-read, .cd-note, .cd-wave-host, .cd-kva, .cd-lamps-v, " +
    ".crumb, .crumb-bar, .pager, .sublessons, .d3d, #vault-sld, #vault-sld-info, #vault-sim, #vault-sim-table, #vault-sim-status, " +
    "#vault-fail, #vault-gen-label, #vault-plan, #vault-plan-info, #vault-plan-list, #vault-3d, .fg-stats, .fg-map, .fg-msg, .fg-log, script, style";
  const ATTRS = ["aria-label", "placeholder", "title"];
  const CONTROL = "input, select, textarea, button, svg";
  const norm = s => s.replace(/\s+/g, " ").trim();
  const touched = [];
  const hooks = [];
  let staticMap = null;

  AGL.HE = AGL.HE || {};

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  // Hebrew unless the reader has chosen English
  AGL.lang = stored() === "en" ? "en" : "he";

  /* UI string: the English text is the key and the fallback. {name} placeholders are filled from vars. */
  AGL.t = function (en, vars) {
    let s = AGL.lang === "he" && AGL.HE.STR && AGL.HE.STR[en] !== undefined ? AGL.HE.STR[en] : en;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
  };

  /* Course data (LIGHTS, QUIZ, SCENARIOS, GLOSSARY) in the current language */
  AGL.d = name => (AGL.lang === "he" && AGL.HE[name]) || AGL[name];

  AGL.onLang = fn => hooks.push(fn);

  /* SVG text does not take its direction from the page, so set it per label */
  AGL.bidiSvg = function (root) {
    if (!root) return;
    root.querySelectorAll("text").forEach(t => {
      if (t.dataset.anchor === undefined) t.dataset.anchor = t.getAttribute("text-anchor") || "start";
      const a = t.dataset.anchor;
      const rtl = HEB.test(t.textContent);
      t.setAttribute("direction", rtl ? "rtl" : "ltr");
      t.setAttribute("text-anchor", rtl ? (a === "start" ? "end" : a === "end" ? "start" : a) : a);
    });
  };

  /* Collect translatable pieces of the static markup, in document order */
  function collect(root, out) {
    for (const n of root.children) {
      if (n.matches(SKIP)) continue;
      ATTRS.forEach(a => { if (n.hasAttribute(a)) out.push({ type: "attr", el: n, name: a, key: norm(n.getAttribute(a)) }); });
      if (n.tagName === "SELECT") { collect(n, out); continue; }
      if (n.matches("input, textarea, svg")) continue;
      const texts = [...n.childNodes].filter(c => c.nodeType === 3 && c.textContent.trim());
      if (texts.length && !n.querySelector(CONTROL)) {
        out.push({ type: "html", el: n, key: norm(n.innerHTML) });
        continue;
      }
      texts.forEach(c => out.push({ type: "text", el: c, key: norm(c.textContent) }));
      collect(n, out);
    }
    return out;
  }
  AGL.i18nCandidates = () => collect(document.body, []).map(c => c.key);

  function applyStatic() {
    while (touched.length) {
      const r = touched.pop();
      if (r.type === "html") r.el.innerHTML = r.en;
      else if (r.type === "text") r.el.textContent = r.en;
      else r.el.setAttribute(r.name, r.en);
    }
    if (AGL.lang !== "he") return;
    if (!staticMap) staticMap = new Map((AGL.HE.STATIC || []).map(([en, he]) => [norm(en), he]));
    collect(document.body, []).forEach(c => {
      const he = staticMap.get(c.key);
      if (he === undefined) return;
      if (c.type === "html") { touched.push({ type: "html", el: c.el, en: c.el.innerHTML }); c.el.innerHTML = he; }
      else if (c.type === "text") {
        const lead = /^\s/.test(c.el.textContent) ? " " : "", trail = /\s$/.test(c.el.textContent) ? " " : "";
        touched.push({ type: "text", el: c.el, en: c.el.textContent });
        c.el.textContent = lead + he + trail;
      } else { touched.push({ type: "attr", el: c.el, name: c.name, en: c.el.getAttribute(c.name) }); c.el.setAttribute(c.name, he); }
    });
  }

  AGL.setLang = function (lang, initial) {
    AGL.lang = lang === "he" ? "he" : "en";
    const root = document.documentElement;
    root.setAttribute("lang", AGL.lang);
    root.setAttribute("dir", AGL.lang === "he" ? "rtl" : "ltr");
    if (!initial) { try { localStorage.setItem(KEY, AGL.lang); } catch (e) { /* storage unavailable */ } }
    applyStatic();
    if (!initial) hooks.forEach(fn => fn());
    document.querySelectorAll("#lang-seg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === AGL.lang)));
  };

  AGL.initLang = function () {
    const seg = document.getElementById("lang-seg");
    seg.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (b && b.dataset.lang !== AGL.lang) AGL.setLang(b.dataset.lang);
    });
    AGL.setLang(AGL.lang, true);
  };
})();
