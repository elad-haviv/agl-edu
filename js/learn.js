/* Modules G, H, J: fault-finding scenarios, knowledge check, glossary. */
(function () {
  const letters = () => (AGL.lang === "he" ? "אבגדהוז" : "ABCDEFG");
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  function choiceButtons(options, onPick) {
    const wrap = document.createElement("div");
    wrap.className = "choices";
    options.forEach((text, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.innerHTML = `<span class="letter">${letters()[k]}</span><span>${esc(text)}</span>`;
      b.addEventListener("click", () => onPick(k, b, wrap));
      wrap.appendChild(b);
    });
    return wrap;
  }

  /* ---------- Fault-finding scenarios ---------- */
  const ts = { s: 0, step: 0, done: false };

  function renderPick() {
    const host = document.getElementById("ts-pick");
    host.innerHTML = "";
    AGL.d("SCENARIOS").forEach((sc, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = sc.title;
      b.setAttribute("aria-pressed", String(k === ts.s));
      b.addEventListener("click", () => { ts.s = k; ts.step = 0; ts.done = false; renderPick(); renderScenario(); });
      host.appendChild(b);
    });
  }

  function renderScenario() {
    const SC = AGL.d("SCENARIOS");
    const sc = SC[ts.s];
    const card = document.getElementById("ts-card");
    const n = sc.steps.length;
    card.innerHTML = `
      <span class="tag">${AGL.t("Scenario {i} of {n}", { i: ts.s + 1, n: SC.length })}</span>
      <h4>${esc(sc.title)}</h4>
      <p>${esc(sc.brief)}</p>
      <div class="progress" aria-hidden="true"><i style="width:${(ts.done ? n : ts.step) / n * 100}%"></i></div>`;
    if (ts.done) {
      const p = document.createElement("div");
      p.className = "feedback";
      p.innerHTML = `<strong>${AGL.t("Scenario complete.")}</strong>${AGL.t("You isolated safely, found the fault by splitting the circuit, and proved the repair before handing the circuit back.")}`;
      card.appendChild(p);
      const next = SC[(ts.s + 1) % SC.length];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn primary";
      b.textContent = AGL.t("Next scenario: {t}", { t: next.title });
      b.addEventListener("click", () => { ts.s = (ts.s + 1) % SC.length; ts.step = 0; ts.done = false; renderPick(); renderScenario(); });
      card.appendChild(b);
      return;
    }
    const st = sc.steps[ts.step];
    const q = document.createElement("p");
    q.innerHTML = `<strong>${AGL.t("Step {i} of {n}.", { i: ts.step + 1, n })}</strong> ${esc(st.q)}`;
    card.appendChild(q);
    const fb = document.createElement("div");
    fb.className = "feedback";
    fb.hidden = true;
    fb.setAttribute("aria-live", "polite");
    const choices = choiceButtons(st.options.map(o => o.t), (k, b, wrap) => {
      const o = st.options[k];
      fb.hidden = false;
      fb.innerHTML = `<strong>${AGL.t(o.ok ? "Correct" : "Not this one")}</strong>${esc(o.fb)}`;
      if (o.ok) {
        b.classList.add("right");
        wrap.querySelectorAll("button").forEach(x => { x.disabled = true; });
        const next = document.createElement("button");
        next.type = "button";
        next.className = "btn primary";
        next.textContent = AGL.t(ts.step + 1 < n ? "Next step" : "Finish scenario");
        next.addEventListener("click", () => {
          if (ts.step + 1 < n) ts.step++; else ts.done = true;
          renderScenario();
        });
        card.appendChild(next);
        next.focus();
      } else {
        b.classList.add("wrong");
        b.disabled = true;
      }
    });
    card.appendChild(choices);
    card.appendChild(fb);
  }

  /* ---------- Knowledge check ---------- */
  const qz = { aud: "all", list: [], i: 0, score: 0 };
  const bestKey = aud => "agl-quiz-best-" + aud;

  function startQuiz() {
    qz.list = AGL.d("QUIZ").filter(q => qz.aud === "all" || q.aud === qz.aud || q.aud === "all");
    qz.i = 0;
    qz.score = 0;
    renderBest();
    renderQuestion();
  }

  function renderBest() {
    const b = store.get(bestKey(qz.aud));
    document.getElementById("quiz-best").textContent = b ? AGL.t("Your best: {b}", { b }) : "";
  }

  function renderQuestion() {
    const card = document.getElementById("quiz-card");
    const n = qz.list.length;
    if (qz.i >= n) {
      const pct = Math.round(qz.score / n * 100);
      const prev = store.get(bestKey(qz.aud));
      const prevPct = prev ? parseInt(prev.split("(")[1], 10) : -1;
      if (pct > prevPct) store.set(bestKey(qz.aud), `${qz.score}/${n} (${pct} %)`);
      renderBest();
      const verdict = AGL.t(pct >= 80 ? "Ready for the field." : pct >= 60 ? "Good base. Revisit the modules linked from the questions you missed." : "Work through the modules again, then retry.");
      card.innerHTML = `
        <span class="tag">${AGL.t("Result")}</span>
        <div class="result-big num">${qz.score} / ${n}</div>
        <p>${pct} %. ${verdict}</p>`;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn primary";
      b.textContent = AGL.t("Start again");
      b.addEventListener("click", startQuiz);
      card.appendChild(b);
      return;
    }
    const q = qz.list[qz.i];
    const audLabel = AGL.t({ all: "Everyone", elec: "Electrician", eng: "Engineer", des: "Designer" }[q.aud]);
    card.innerHTML = `
      <div class="controls" style="justify-content:space-between"><span class="tag">${AGL.t("Question {i} of {n}", { i: qz.i + 1, n })} · ${audLabel}</span><span class="tag num">${AGL.t("Score {s}", { s: qz.score })}</span></div>
      <div class="progress" aria-hidden="true"><i style="width:${qz.i / n * 100}%"></i></div>
      <h4>${esc(q.q)}</h4>`;
    const fb = document.createElement("div");
    fb.className = "feedback";
    fb.hidden = true;
    fb.setAttribute("aria-live", "polite");
    const choices = choiceButtons(q.o, (k, b, wrap) => {
      const ok = k === q.a;
      if (ok) qz.score++;
      wrap.querySelectorAll("button").forEach((x, j) => {
        x.disabled = true;
        if (j === q.a) x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      fb.hidden = false;
      fb.innerHTML = `<strong>${AGL.t(ok ? "Correct" : "Not quite")}</strong>${esc(q.x)}`;
      const next = document.createElement("button");
      next.type = "button";
      next.className = "btn primary";
      next.textContent = AGL.t(qz.i + 1 < n ? "Next question" : "See result");
      next.addEventListener("click", () => { qz.i++; renderQuestion(); });
      card.appendChild(next);
      next.focus();
    });
    card.appendChild(choices);
    card.appendChild(fb);
  }

  /* ---------- Glossary ---------- */
  function renderGlossary(filter) {
    const f = (filter || "").trim().toLowerCase();
    const items = AGL.d("GLOSSARY").filter(([t, d]) => !f || t.toLowerCase().includes(f) || d.toLowerCase().includes(f));
    document.getElementById("gloss-list").innerHTML = items.length
      ? items.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join("")
      : `<div><dt>${AGL.t("No matches")}</dt><dd>${AGL.t("Try a shorter term, such as “lamp” or “circuit”.")}</dd></div>`;
  }

  AGL.initLearn = function () {
    renderPick();
    renderScenario();

    const seg = document.getElementById("quiz-filter");
    seg.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      qz.aud = b.dataset.aud;
      startQuiz();
    });
    startQuiz();

    const q = document.getElementById("gloss-q");
    q.addEventListener("input", () => renderGlossary(q.value));
    renderGlossary("");

    AGL.onLang(() => {
      renderPick();
      renderScenario();
      qz.list = AGL.d("QUIZ").filter(x => qz.aud === "all" || x.aud === qz.aud || x.aud === "all");
      renderBest();
      renderQuestion();
      renderGlossary(q.value);
    });
  };
})();
