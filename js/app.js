/* Module routing: one module on stage at a time, addressed by #hash. */
(function () {
  const MODULES = ["overview", "lights", "series", "equipment", "design", "calc", "maint", "quiz", "glossary"];

  function show(id, scroll) {
    if (!MODULES.includes(id)) id = "overview";
    document.querySelectorAll("[data-module]").forEach(s => { s.hidden = s.dataset.module !== id; });
    document.querySelectorAll(".rail a").forEach(a => {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    const active = document.querySelector('.rail a[aria-current="page"]');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (scroll) window.scrollTo(0, 0);
  }

  // In-page links switch modules even where the host frame does not report hash changes
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (!MODULES.includes(id)) return;
    e.preventDefault();
    try { history.replaceState(null, "", "#" + id); } catch (err) { /* sandboxed frame */ }
    show(id, true);
  });
  window.addEventListener("hashchange", () => show(location.hash.slice(1), true));

  AGL.initAirfield();
  AGL.initCircuit();
  AGL.initCalc();
  AGL.initLearn();
  AGL.initLang();
  show(location.hash.slice(1), false);
})();
