/* Navigation: modules split into lessons, addressed by sign codes (#D2) or module names (#equipment). */
(function () {
  const VISITED_KEY = "agl-visited";
  const LAST_KEY = "agl-last";
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  // Course outline, read from the markup: modules in order, each with its lessons
  const modules = [...document.querySelectorAll("[data-module]")].map(sec => {
    const m = { name: sec.dataset.module, code: sec.dataset.code, sec };
    m.lessons = [...sec.querySelectorAll(":scope > .lesson")].map((el, i) => {
      el.dataset.lesson = m.code + (i + 1);
      return { code: m.code + (i + 1), el, m, i };
    });
    return m;
  });
  const flat = modules.flatMap(m => m.lessons);
  let visited = new Set();
  try { visited = new Set(JSON.parse(store.get(VISITED_KEY) || "[]")); } catch (e) { /* ignore */ }
  let current = null;

  const railLink = m => document.querySelector(`.rail a[data-code="${m.code}"]`);
  const moduleName = m => railLink(m).querySelector(".label").textContent;
  function lessonTitle(l) {
    const h = l.el.querySelector("h3");
    if (h) return h.textContent;
    if (l.el.dataset.title) return AGL.t(l.el.dataset.title);
    return moduleName(l.m);
  }

  function resolve(token) {
    if (!token) return flat[0];
    const t = token.toUpperCase();
    return flat.find(l => l.code === t) || (modules.find(m => m.name === token) || {}).lessons?.[0] ||
      (modules.find(m => m.code === t) || {}).lessons?.[0] || flat[0];
  }

  function crumbHtml(l) {
    const n = l.m.lessons.length;
    const multi = n > 1;
    return `<nav class="crumb" aria-label="${esc(AGL.t("You are here"))}">
      <a class="sign crumb-sign" href="#${l.m.code}1"><span class="loc">${l.m.code}</span>${multi ? `<span class="dir">${l.code}</span>` : ""}</a>
      <span class="crumb-text"><span class="crumb-module">${esc(moduleName(l.m))}</span>${multi ? `<span class="crumb-count">${esc(AGL.t("Lesson {i} of {n}", { i: l.i + 1, n }))}</span>` : ""}</span>
    </nav>
    ${multi ? `<div class="crumb-bar" aria-hidden="true"><i style="width:${(l.i + 1) / n * 100}%"></i></div>` : ""}`;
  }

  function pagerHtml(l) {
    const k = flat.indexOf(l);
    const prev = flat[k - 1], next = flat[k + 1];
    const link = (x, cls, label) => x ? `<a class="pg ${cls}" href="#${x.code}">
        <span class="arr" aria-hidden="true">${cls === "prev" ? "←" : "→"}</span>
        <span class="pg-text"><span class="pg-label">${esc(label)}</span><span class="pg-title"><b>${x.code}</b> ${esc(lessonTitle(x))}</span></span>
      </a>` : "<span></span>";
    return `<nav class="pager" aria-label="${esc(AGL.t("Lessons"))}">${link(prev, "prev", AGL.t("Previous"))}${link(next, "next", AGL.t("Next"))}</nav>`;
  }

  function renderRail(l) {
    document.querySelectorAll(".rail .sublessons").forEach(n => n.remove());
    modules.forEach(m => {
      const a = railLink(m);
      a.setAttribute("href", "#" + m.code + "1");
      if (m === l.m) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    if (l.m.lessons.length < 2) return;
    const ol = document.createElement("ol");
    ol.className = "sublessons";
    ol.innerHTML = l.m.lessons.map(x => `<li><a href="#${x.code}"${x === l ? ' aria-current="page"' : ""} class="${visited.has(x.code) ? "seen" : ""}">
      <span class="subchip">${x.code}</span><span class="sublabel">${esc(lessonTitle(x))}</span></a></li>`).join("");
    railLink(l.m).after(ol);
  }

  function renderResume() {
    const host = document.getElementById("resume");
    const last = resolve(store.get(LAST_KEY) || "");
    const target = last && last.code !== "A1" ? last : flat[1];
    const label = last && last.code !== "A1" ? AGL.t("Continue where you left off") : AGL.t("Start the course");
    host.innerHTML = `<a class="pg next resume" href="#${target.code}">
      <span class="arr" aria-hidden="true">→</span>
      <span class="pg-text"><span class="pg-label">${esc(label)}</span><span class="pg-title"><b>${target.code}</b> ${esc(lessonTitle(target))}</span></span></a>`;
  }

  function show(token, scroll) {
    const l = resolve(token);
    current = l;
    modules.forEach(m => { m.sec.hidden = m !== l.m; });
    l.m.lessons.forEach(x => { x.el.hidden = x !== l; });
    l.m.sec.querySelectorAll(":scope > .crumb, :scope > .crumb-bar, :scope > .pager").forEach(n => n.remove());
    l.m.sec.insertAdjacentHTML("afterbegin", crumbHtml(l));
    l.m.sec.insertAdjacentHTML("beforeend", pagerHtml(l));
    visited.add(l.code);
    store.set(VISITED_KEY, JSON.stringify([...visited]));
    if (l.code !== "A1") store.set(LAST_KEY, l.code);
    renderRail(l);
    if (l.code === "A1") renderResume();
    document.dispatchEvent(new Event("agl:lesson"));
    const active = railLink(l.m);
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (scroll) window.scrollTo(0, 0);
  }

  // Stacked (card) tables on phones label each cell with its column heading
  function labelTables() {
    document.querySelectorAll("table.stack").forEach(t => {
      const heads = [...t.querySelectorAll("thead th")].map(th => th.textContent);
      t.querySelectorAll("tbody tr").forEach(tr => [...tr.children].forEach((td, i) => {
        if (i > 0 && heads[i]) td.dataset.label = heads[i];
      }));
    });
  }

  // In-page links switch lessons even where the host frame does not report hash changes
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (id === "main") return;
    e.preventDefault();
    try { history.replaceState(null, "", "#" + id); } catch (err) { /* sandboxed frame */ }
    show(id, true);
    if (e.detail === 0) document.getElementById("main").focus({ preventScroll: true });
  });
  window.addEventListener("hashchange", () => show(location.hash.slice(1), true));

  AGL.initAirfield();
  AGL.initCircuit();
  AGL.initCalc();
  AGL.initLearn();
  AGL.initDetail3D();
  AGL.initVault();
  AGL.initVault3D();
  AGL.initFaultGame();
  AGL.initFlows();
  AGL.initCCRHow();
  AGL.initLang();
  labelTables();
  AGL.onLang(() => { labelTables(); show(current.code, false); });
  show(location.hash.slice(1), false);
})();
