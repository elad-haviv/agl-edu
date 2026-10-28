/* Module M: troubleshooting flowcharts for the CCR, the vault and the field circuits.
   Each chart runs down a spine of checks. A check ("q") leaves the spine on one answer to a fix
   and carries on down on the other; "do" is a step to carry out; the last check may send both
   answers to fixes. Texts carry English and Hebrew side by side. */
(function () {
  const L = (en, he) => ({ en, he });
  const SYSTEMS = [
    {
      id: "ccr", name: L("CCR", "ווסת"),
      charts: [
        {
          id: "ccr-on", name: L("CCR will not switch on", "הווסת לא נדלק"),
          steps: [
            { t: "do", text: L("Check what the ALCMS or control panel shows for this CCR, and note any fault code on the CCR display.", "בדקו מה מציגים ה־ALCMS או לוח הבקרה עבור הווסת הזה, ורשמו כל קוד תקלה בתצוגת הווסת.") },
            { t: "q", text: L("Is there supply voltage at the CCR input terminals?", "יש מתח הזנה בהדקי הכניסה של הווסת?"), exit: "no",
              fix: L("Check the feeder breaker in the LV switchboard, the supply contactor and fuses. If the breaker trips again on closing, find the cause before you re-close it.", "בדקו את מפסק ההזנה בלוח המתח הנמוך, את מגען ההזנה ואת הנתיכים. אם המפסק נופל שוב בסגירה, מצאו את הסיבה לפני שסוגרים שוב.") },
            { t: "q", text: L("Is the CCR's control circuit alive (display lit, control fuses intact)?", "מעגל הפיקוד של הווסת חי (התצוגה דולקת, נתיכי הפיקוד שלמים)?"), exit: "no",
              fix: L("Replace the control fuses, check the control transformer and the door interlock switch.", "החליפו את נתיכי הפיקוד, ובדקו את שנאי הפיקוד ואת מפסק נעילת הדלת.") },
            { t: "q", text: L("Does it switch on in Local mode from its own panel?", "הוא נדלק במצב מקומי מהלוח שלו?"), exit: "yes",
              fix: L("The CCR is healthy; the remote command is not getting through. Check the selector is on Remote, the ALCMS output and interface card, and the control cable.", "הווסת תקין; הפקודה מרחוק לא מגיעה. בדקו שהבורר במצב מרחוק, את יציאת ה־ALCMS וכרטיס הממשק, ואת כבל הפיקוד.") },
            { t: "q2", text: L("Does the display show a protection lockout (open circuit, overcurrent, earth fault)?", "התצוגה מראה נעילת הגנה (נתק, זרם יתר, קצר לאדמה)?"),
              yes: L("Reset once. If it locks out again, follow “CCR trips or shuts down”.", "אפסו פעם אחת. אם הוא ננעל שוב, עברו לתרשים „הווסת נופל או נכבה”."),
              no: L("Internal fault: main contactor, power module (thyristor or IGBT), regulation board. Isolate and call the manufacturer with the fault log.", "תקלה פנימית: מגען ראשי, מודול הספק (תיריסטור או IGBT), כרטיס ויסות. נתקו והתקשרו ליצרן עם יומן התקלות.") }
          ]
        },
        {
          id: "ccr-trip", name: L("CCR trips or shuts down", "הווסת נופל או נכבה"),
          steps: [
            { t: "q", text: L("Did the open-circuit protection operate?", "הגנת הנתק פעלה?"), exit: "yes", link: "J4",
              fix: L("The series loop is broken. Lock out, pull the cutout and measure continuity from field OUT to RET: OL confirms an open. Locate it with an earthing jumper.", "הלולאה הטורית קטועה. נעלו, שלפו את המנתק ומדדו רציפות מיציאת השדה לחזרה: OL מאשר נתק. אתרו אותו בעזרת מגשר הארקה.") },
            { t: "q", text: L("Did the overcurrent protection operate?", "הגנת זרם היתר פעלה?"), exit: "yes",
              fix: L("Measure the output current at each step with a true-RMS meter. Look for a short across the output in the vault (cutout, cables) and check the current regulation board.", "מדדו את זרם היציאה בכל דרגה במד true-RMS. חפשו קצר על היציאה במרכז החשמל (מנתק, כבלים) ובדקו את כרטיס ויסות הזרם.") },
            { t: "q", text: L("Did the earth-fault (insulation) monitor trip it?", "מנטר הבידוד (קצר לאדמה) הפיל אותו?"), exit: "yes", link: "J3",
              fix: L("Lock out and test insulation from the cutout, vault cables first, then split the field circuit until you find the fault.", "נעלו ובדקו בידוד מהמנתק, קודם את כבלי מרכז החשמל, ואז פצלו את מעגל השדה עד שתמצאו את התקלה.") },
            { t: "q", text: L("Does it trip only at the high brightness steps?", "הוא נופל רק בדרגות הבהירות הגבוהות?"), exit: "yes", link: "H1",
              fix: L("The load is too close to the rating. Measure output voltage and VA at step 5, count lamps out (open secondaries raise the load), and check the CCR size against the connected load.", "העומס קרוב מדי לנקוב. מדדו מתח יציאה ו־VA בדרגה 5, ספרו נורות שרופות (משניים פתוחים מגדילים את העומס), ובדקו את גודל הווסת מול העומס המחובר.") },
            { t: "end", text: L("Check for input voltage dips, over-temperature and blocked ventilation, then the internal components. Give the manufacturer the fault log.", "בדקו נפילות מתח בכניסה, טמפרטורת יתר ואוורור חסום, ואז את הרכיבים הפנימיים. מסרו ליצרן את יומן התקלות.") }
          ]
        },
        {
          id: "ccr-out", name: L("Wrong output current or brightness", "זרם יציאה או בהירות שגויים"),
          steps: [
            { t: "q", text: L("Is the output current right at every step, measured with a true-RMS clamp meter?", "זרם היציאה נכון בכל דרגה, במדידה במד צבת true-RMS?"), exit: "no",
              fix: L("Recalibrate to the manufacturer's procedure and check the current-sensing transformer and the regulation board. An average-reading meter reads wrong on a chopped waveform.", "כיילו מחדש לפי נוהל היצרן ובדקו את שנאי חישת הזרם ואת כרטיס הוויסות. מד שקורא ממוצע מראה ערך שגוי על גל קטוע.") },
            { t: "q", text: L("Does the CCR report back the step the ALCMS commanded?", "הווסת מדווח בחזרה את הדרגה שה־ALCMS פקד?"), exit: "no",
              fix: L("Check the step command and feedback wiring and the interface I/O. Try the same step in Local.", "בדקו את חיווט פקודת הדרגה והמשוב ואת כרטיסי הקלט/פלט בממשק. נסו את אותה דרגה במצב מקומי.") },
            { t: "q", text: L("Are only some lights dim while the current is right?", "רק חלק מהפנסים עמומים בזמן שהזרם נכון?"), exit: "yes",
              fix: L("Look at those fixtures: wrong transformer ratio or rating, wrong lamp, dirty or damaged optics, water in the fitting.", "בדקו את הגופים האלה: יחס או הספק שנאי שגוי, נורה לא נכונה, אופטיקה מלוכלכת או פגועה, מים בגוף.") },
            { t: "end", text: L("The whole circuit is dim at the right current: check the lamp type and the photometric output against the specification.", "כל המעגל עמום בזרם הנכון: בדקו את סוג הנורות ואת התפוקה הפוטומטרית מול המפרט.") }
          ]
        }
      ]
    },
    {
      id: "vault", name: L("Vault", "מרכז החשמל"),
      charts: [
        {
          id: "v-mains", name: L("Mains failure", "הפסקת חשמל ברשת"),
          steps: [
            { t: "q", text: L("Did the standby generator start within its required time?", "הגנרטור הרזרבי הותנע בתוך הזמן הנדרש?"), exit: "no",
              fix: L("Follow “Generator does not start”. Tell ATC which lighting is affected.", "עברו לתרשים „הגנרטור לא מותנע”. עדכנו את הפיקוח אילו מערכות תאורה מושפעות.") },
            { t: "q", text: L("Did the transfer switch (ATS) move the load to the generator?", "מפסק ההעברה (ATS) העביר את העומס לגנרטור?"), exit: "no",
              fix: L("Check the ATS is in Auto and its controller sees generator voltage and frequency in limits. Transfer by hand if your procedure allows.", "בדקו שה־ATS במצב אוטומטי ושהבקר שלו רואה מתח ותדר גנרטור בגבולות. העבירו ידנית אם הנוהל מתיר.") },
            { t: "q", text: L("Are all CCRs back on at the selected steps?", "כל הווסתים חזרו לפעול בדרגות שנבחרו?"), exit: "no", link: "F2",
              fix: L("Some CCRs need a new command after a power loss. Check the ALCMS restored them, then treat any CCR still off with the CCR charts.", "חלק מהווסתים צריכים פקודה חדשה אחרי הפסקת חשמל. בדקו שה־ALCMS החזיר אותם, ואז טפלו בכל ווסת שעדיין כבוי לפי תרשימי הווסת.") },
            { t: "q", text: L("Did the UPS carry the control system and other no-break loads throughout?", "ה־UPS החזיק את מערכת הבקרה ושאר העומסים ללא הפסקה לאורך כל הזמן?"), exit: "no",
              fix: L("Check UPS alarms, battery state and bypass; replace a failed battery string.", "בדקו התראות UPS, מצב הסוללות והמעקף; החליפו שרשרת סוללות פגומה.") },
            { t: "end", text: L("Record the switch-over times against the requirement, watch the fuel, and check the return to mains when it comes back.", "רשמו את זמני המעבר מול הדרישה, עקבו אחרי הדלק, ובדקו את החזרה לרשת כשהיא חוזרת.") }
          ]
        },
        {
          id: "v-gen", name: L("Generator does not start", "הגנרטור לא מותנע"),
          steps: [
            { t: "q", text: L("Is the generator control in Auto with no alarm or emergency stop active?", "בקר הגנרטור במצב אוטומטי, בלי התראה או עצירת חירום פעילה?"), exit: "no",
              fix: L("Clear the alarm, release any emergency stop and set Auto. Find out why the alarm came up.", "נקו את ההתראה, שחררו כל עצירת חירום והעבירו לאוטומטי. בררו למה ההתראה עלתה.") },
            { t: "q", text: L("Is the starter battery voltage normal?", "מתח מצבר ההתנעה תקין?"), exit: "no",
              fix: L("Charge or replace the batteries and check the battery charger.", "טענו או החליפו את המצברים ובדקו את המטען.") },
            { t: "q", text: L("Is there fuel in the day tank with the valves open?", "יש דלק במכל היומי והברזים פתוחים?"), exit: "no",
              fix: L("Refill, open the valves and bleed air from the fuel system.", "מלאו, פתחו את הברזים ונקו אוויר ממערכת הדלק.") },
            { t: "q2", text: L("Does the engine crank?", "המנוע מסתובב בהתנעה?"),
              yes: L("Cranks but will not fire: fuel filters, fuel solenoid, preheat, air in the fuel.", "מסתובב אבל לא מניע: מסנני דלק, סולנואיד דלק, חימום מוקדם, אוויר בדלק."),
              no: L("No crank: starter motor, start relay or control fuse. Call the generator service.", "לא מסתובב: מתנע, ממסר התנעה או נתיך פיקוד. הזמינו שירות גנרטור.") }
          ]
        },
        {
          id: "v-ctl", name: L("Remote control lost", "אובדן שליטה מרחוק"),
          steps: [
            { t: "do", text: L("Tell ATC. Set the lighting by the contingency procedure (local panel or backup control) until control is back.", "עדכנו את הפיקוח. כוונו את התאורה לפי נוהל החירום (לוח מקומי או בקרת גיבוי) עד שהשליטה חוזרת.") },
            { t: "q", text: L("Can you operate the CCRs locally at the vault?", "אפשר להפעיל את הווסתים מקומית במרכז החשמל?"), exit: "no",
              fix: L("The CCRs themselves are at fault: use the CCR charts.", "התקלה בווסתים עצמם: השתמשו בתרשימי הווסת.") },
            { t: "q", text: L("Is the vault controller (PLC) powered and running?", "בקר מרכז החשמל (PLC) מוזן ופועל?"), exit: "no",
              fix: L("Check its no-break supply and restart it by procedure.", "בדקו את ההזנה ללא הפסקה שלו והפעילו אותו מחדש לפי הנוהל.") },
            { t: "q", text: L("Is the communication link up (fibre and network link lights)?", "קו התקשורת פעיל (נוריות קישור בסיב וברשת)?"), exit: "no",
              fix: L("Check media converters, switches and patch cords; change over to the redundant path.", "בדקו ממירי מדיה, מתגים וכבלי חיבור; עברו לנתיב הגיבוי.") },
            { t: "end", text: L("Check the interface I/O cards and the configuration, and log the event.", "בדקו את כרטיסי הקלט/פלט בממשק ואת התצורה, ותעדו את האירוע.") }
          ]
        }
      ]
    },
    {
      id: "field", name: L("Field circuits", "מעגלי השדה"),
      charts: [
        {
          id: "f-dark", name: L("Whole circuit dark", "כל המעגל חשוך"),
          steps: [
            { t: "q", text: L("Is the CCR on and delivering output current?", "הווסת דולק ומספק זרם יציאה?"), exit: "no",
              fix: L("Start with the CCR charts.", "התחילו בתרשימי הווסת.") },
            { t: "q", text: L("Is the series cutout plug in and the right circuit selected?", "תקע המנתק הטורי במקומו והמעגל הנכון נבחר?"), exit: "no",
              fix: L("Refit the cutout plug. Check circuit selector relays, such as on interleaved or stop-bar circuits.", "החזירו את תקע המנתק. בדקו ממסרי בחירת מעגל, למשל במעגלים משולבים או במעגלי פסי עצירה.") },
            { t: "end", link: "J4", text: L("Current flows but no light comes on: suspect the circuit wiring in the vault, then lock out and measure the loop.", "זרם זורם אבל אף פנס לא נדלק: חשדו בחיווט המעגל במרכז החשמל, ואז נעלו ומדדו את הלולאה.") }
          ]
        },
        {
          id: "f-out", name: L("Single lights or groups out", "פנסים בודדים או קבוצות כבויים"),
          steps: [
            { t: "q", text: L("Is it a single light?", "זה פנס בודד?"), exit: "yes",
              fix: L("Replace the lamp or LED fitting. If the new one stays dark, test the isolating transformer and the secondary connector.", "החליפו את הנורה או גוף ה־LED. אם גם החדש נשאר חשוך, בדקו את שנאי הבידוד ואת המחבר המשני.") },
            { t: "q", text: L("Are the dark lights every other light along the row?", "הפנסים החשוכים הם כל פנס שני לאורך השורה?"), exit: "yes", link: "B1",
              fix: L("That is one circuit of an interleaved pair. Treat it as a whole-circuit fault on that circuit.", "זה מעגל אחד מצמד משולב. טפלו בזה כתקלה של כל המעגל הזה.") },
            { t: "q", text: L("Are many lights out across the circuit?", "פנסים רבים כבויים לאורך המעגל?"), exit: "yes",
              fix: L("Replace them quickly: open secondaries load the CCR and a section may breach the allowed number of failed lights.", "החליפו אותם מהר: משניים פתוחים מעמיסים את הווסת, וקטע עלול לחרוג ממספר הפנסים הכבויים המותר.") },
            { t: "end", text: L("A run of neighbouring lights: check the fittings and transformers in that run, and for damage by vehicles or snow ploughs.", "רצף של פנסים סמוכים: בדקו את הגופים והשנאים ברצף הזה, ונזק מרכבים או ממפלסות שלג.") }
          ]
        },
        {
          id: "f-ins", name: L("Earth fault or low insulation", "קצר לאדמה או בידוד נמוך"),
          steps: [
            { t: "do", link: "J1", text: L("Lock out the CCR, pull the cutout and prove the field circuit dead.", "נעלו את הווסת, שלפו את המנתק ואמתו שמעגל השדה מנותק.") },
            { t: "q", text: L("Does the insulation test from the cutout pass your acceptance value?", "בדיקת הבידוד מהמנתק עוברת את ערך הקבלה שלכם?"), exit: "yes",
              fix: L("Not seen at this voltage. Test at a higher voltage or when the ground is wet, and check the insulation monitor and vault wiring.", "לא נראה במתח הזה. בדקו במתח גבוה יותר או כשהקרקע רטובה, ובדקו את מנטר הבידוד ואת החיווט במרכז החשמל.") },
            { t: "q", text: L("Does the reading recover with the vault cables disconnected?", "הקריאה משתפרת כשכבלי מרכז החשמל מנותקים?"), exit: "yes",
              fix: L("The fault is in the vault: cutout, terminations or vault cables.", "התקלה במרכז החשמל: מנתק, סופיות או כבלי מרכז החשמל.") },
            { t: "do", link: "J3", text: L("Open a base near the middle, unplug and test both halves. Keep halving the low part.", "פתחו בסיס קרוב לאמצע, נתקו ובדקו את שני החצאים. המשיכו לחצות את החלק הנמוך.") },
            { t: "end", link: "H2", text: L("Repair the connector, transformer or cable, re-test the whole loop and log the reading in the trend.", "תקנו את המחבר, השנאי או הכבל, בדקו שוב את כל הלולאה ותעדו את הקריאה במגמה.") }
          ]
        }
      ]
    }
  ];

  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const tx = o => esc(o[AGL.lang] || o.en);
  const state = { sys: "ccr", chart: "ccr-on" };

  function linkHtml(code) {
    return code ? ` <a class="fl-link" href="#${code}">${esc(AGL.t("Lesson {c}", { c: code }))}</a>` : "";
  }

  function chartHtml(c) {
    const yes = AGL.t("Yes"), no = AGL.t("No");
    let s = `<ol class="fl-spine">`;
    c.steps.forEach((st, i) => {
      const last = i === c.steps.length - 1;
      if (st.t === "do" || st.t === "end") {
        s += `<li class="fl-row"><div class="fl-node ${st.t}"><span class="fl-n">${i + 1}</span><p>${tx(st.text)}${linkHtml(st.link)}</p></div>
          ${last ? "" : `<span class="fl-down"></span>`}</li>`;
      } else if (st.t === "q") {
        const out = st.exit === "yes" ? yes : no, on = st.exit === "yes" ? no : yes;
        s += `<li class="fl-row"><div class="fl-node q"><span class="fl-n">${i + 1}</span><p>${tx(st.text)}</p></div>
          <div class="fl-branch"><span class="fl-ans ${st.exit}">${esc(out)}</span><div class="fl-fix"><p>${tx(st.fix)}${linkHtml(st.link)}</p></div></div>
          ${last ? "" : `<span class="fl-down">${esc(on)}</span>`}</li>`;
      } else {
        s += `<li class="fl-row two"><div class="fl-node q"><span class="fl-n">${i + 1}</span><p>${tx(st.text)}</p></div>
          <div class="fl-branch"><span class="fl-ans yes">${esc(yes)}</span><div class="fl-fix"><p>${tx(st.yes)}</p></div></div>
          <div class="fl-branch"><span class="fl-ans no">${esc(no)}</span><div class="fl-fix"><p>${tx(st.no)}</p></div></div></li>`;
      }
    });
    return s + "</ol>";
  }

  function render() {
    const host = document.getElementById("flows");
    if (!host) return;
    const sys = SYSTEMS.find(x => x.id === state.sys);
    const chart = sys.charts.find(x => x.id === state.chart) || sys.charts[0];
    state.chart = chart.id;
    host.innerHTML = `<div class="controls fl-pick">
        <span class="seg" role="group" aria-label="${esc(AGL.t("System"))}">${SYSTEMS.map(x =>
          `<button type="button" data-sys="${x.id}" aria-pressed="${x.id === sys.id}">${tx(x.name)}</button>`).join("")}</span>
      </div>
      <div class="scenario-pick fl-charts" role="group" aria-label="${esc(AGL.t("Symptom"))}">${sys.charts.map(x =>
        `<button type="button" class="btn" data-chart="${x.id}" aria-pressed="${x.id === chart.id}">${tx(x.name)}</button>`).join("")}</div>
      <div class="panel fl-panel">
        <h4 class="fl-title">${tx(chart.name)}</h4>
        <p class="fl-key"><span class="fl-node q mini"></span>${esc(AGL.t("Check"))} <span class="fl-node do mini"></span>${esc(AGL.t("Action"))} <span class="fl-fix mini"></span>${esc(AGL.t("Fix or next chart"))}</p>
        ${chartHtml(chart)}
      </div>`;
  }

  AGL.initFlows = function () {
    const host = document.getElementById("flows");
    if (!host) return;
    host.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.sys) { state.sys = b.dataset.sys; state.chart = ""; }
      if (b.dataset.chart) state.chart = b.dataset.chart;
      render();
    });
    render();
    AGL.onLang(render);
  };
})();
