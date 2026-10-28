/* Module D: how a constant current regulator works. A block diagram of the power path (supply to
   field loop) and the control path (step command, regulation, protection, monitoring); selecting a
   block explains it. Below it a working model: pick the step, the load and the rating and see the
   output voltage, firing angle or modulation, loading and the output current waveform. */
(function () {
  const L = (en, he) => ({ en, he });
  const STEPS = [2.8, 3.4, 4.1, 5.2, 6.6];
  const RATINGS = [4, 7.5, 10, 15, 20, 25, 30];
  const BLOCKS = [
    { id: "supply", row: 0, x: 14, w: 104, name: L("Mains supply", "הזנת רשת"),
      role: L("A single- or three-phase LV supply from the vault switchboard, typically 230 to 400 V at 50 or 60 Hz, on its own protected feeder. The essential board behind it is backed by the standby generator and, for some systems, a UPS.",
        "הזנת מתח נמוך חד־פאזית או תלת־פאזית מלוח מרכז החשמל, בדרך כלל 230 עד 400 V ב־50 או 60 Hz, על מזין מוגן משלה. הלוח החיוני שמאחוריה מגובה בגנרטור ולעיתים גם ב־UPS."),
      fail: L("Feeder breaker tripped or a phase lost: the CCR stops. A low supply voltage: it may not reach step 5 on a heavy loop.",
        "מפסק המזין נפל או פאזה חסרה: הווסת נעצר. מתח הזנה נמוך: הוא עלול לא להגיע לדרגה 5 בלולאה עמוסה.") },
    { id: "contactor", row: 0, x: 134, w: 110, name: L("Input breaker and contactor", "מפסק כניסה ומגען"),
      role: L("The breaker protects and isolates the regulator: this is where you switch off and lock out. The main contactor connects the power stage when the CCR is commanded on and drops out on any protection trip.",
        "המפסק מגן ומבודד את הווסת: כאן מכבים ונועלים. המגען הראשי מחבר את שלב ההספק כשהווסת מקבל פקודת הפעלה, ונופל בכל הפעלת הגנה."),
      fail: L("A failed coil or burnt contacts: the CCR will not energize, or it chatters on and off.",
        "סליל תקול או מגעים שרופים: הווסת לא נדלק, או שהוא מקפץ ונכבה.") },
    { id: "power", row: 0, x: 260, w: 124, name: L("Power stage", "שלב ההספק"),
      role: {
        scr: L("Two thyristors in anti-parallel switch each half-cycle of the supply on part-way through. Firing later in the half-cycle (a larger firing angle) passes less voltage, so the output current falls.",
          "שני תיריסטורים במקביל־הפוך מדליקים כל חצי מחזור של ההזנה באמצעו. הדלקה מאוחרת יותר בחצי המחזור (זווית הצתה גדולה יותר) מעבירה פחות מתח, וזרם היציאה יורד."),
        igbt: L("A rectifier charges a DC bus and an IGBT bridge switches it at several kHz with pulse-width modulation, building a near-sinusoidal output whose amplitude sets the current.",
          "מיישר טוען אפיק DC וגשר IGBT ממתג אותו בכמה kHz באפנון רוחב פולס, ובונה יציאה כמעט סינוסית שהמשרעת שלה קובעת את הזרם.")
      },
      fail: L("A shorted device: overcurrent trip or no control of the current. An open device: no output, or a half-wave output whose DC component saturates the transformers.",
        "רכיב מקוצר: הפלה על זרם יתר או אובדן שליטה בזרם. רכיב פתוח: אין יציאה, או יציאה של חצי גל שרכיב ה־DC שלה מרווה את השנאים.") },
    { id: "otx", row: 0, x: 400, w: 112, name: L("Output transformer", "שנאי יציאה"),
      role: L("Raises the voltage to what the loop needs, up to a few kV on a large circuit, and isolates the series loop from the mains. Its output taps are matched to the circuit load at commissioning.",
        "מעלה את המתח למה שהלולאה צריכה, עד כמה kV במעגל גדול, ומבודד את הלולאה הטורית מהרשת. ההדקים שלו מותאמים לעומס המעגל בהפעלה הראשונה."),
      fail: L("Overheating when overloaded, and insulation breakdown with age or after surges.", "התחממות כשהוא בעומס יתר, ופריצת בידוד עם הגיל או אחרי נחשולים.") },
    { id: "ct", row: 0, x: 528, w: 92, name: L("Current sensor (CT)", "חיישן זרם (CT)"),
      role: L("A current transformer on the output measures the loop current. It is the feedback for regulation, for the protections and for the display.",
        "שנאי זרם על היציאה מודד את זרם הלולאה. הוא המשוב לוויסות, להגנות ולתצוגה."),
      fail: L("A drifting sensor makes the CCR regulate the wrong current while its display still reads correctly: always check with an independent true-RMS clamp meter.",
        "חיישן שזז מכיול גורם לווסת לווסת זרם שגוי בזמן שהתצוגה שלו עדיין מראה נכון: בדקו תמיד במד צבת true-RMS עצמאי.") },
    { id: "out", row: 0, x: 636, w: 108, name: L("Output terminals and arresters", "הדקי יציאה ומגיני ברק"),
      role: L("The output terminals with surge arresters against lightning on the long field cable, and the voltage sensing used by open-circuit detection.",
        "הדקי היציאה עם מגיני נחשולים נגד ברקים על כבל השדה הארוך, וחישת המתח שמשמשת לזיהוי נתק."),
      fail: L("An arrester that has failed short puts an earth fault on the loop.", "מגן ברק שנכשל בקצר יוצר קצר לאדמה על הלולאה.") },
    { id: "cutout", row: 0, x: 760, w: 92, name: L("Series cutout", "מנתק טורי"),
      role: L("Pulling the plug disconnects the field loop and shorts the CCR output, so the field can be worked on and the regulator can be tested into a short.",
        "שליפת התקע מנתקת את לולאת השדה ומקצרת את יציאת הווסת, כך שאפשר לעבוד בשדה ולבדוק את הווסת לתוך קצר."),
      fail: L("Burnt or loose contacts in the plug: an intermittent open circuit right in the vault.", "מגעים שרופים או רופפים בתקע: נתק לסירוגין בתוך מרכז החשמל.") },
    { id: "loop", row: 0, x: 868, w: 118, name: L("Field loop", "לולאת השדה"),
      role: L("The primary cable through every isolating transformer. Its load changes with the number of lights, failed lamps, cable length and temperature; the CCR changes its voltage to keep the current constant.",
        "הכבל הראשוני דרך כל שנאי הבידוד. העומס שלו משתנה עם מספר הפנסים, נורות שרופות, אורך הכבל והטמפרטורה; הווסת משנה את המתח כדי לשמור על זרם קבוע."),
      fail: L("Open circuit, earth faults, and many lamps out (open secondaries raise the load seen by the CCR).", "נתק, קצרים לאדמה, והרבה נורות שרופות (משניים פתוחים מגדילים את העומס שהווסת רואה).") },
    { id: "ctlpower", row: 1, x: 14, w: 150, name: L("Control power and fuse", "מתח פיקוד ונתיך"),
      role: L("A small control transformer and fuse feed the electronics, the relays and the display.", "שנאי פיקוד קטן ונתיך מזינים את האלקטרוניקה, הממסרים והתצוגה."),
      fail: L("A blown control fuse: dark display and no response to any command.", "נתיך פיקוד שרוף: תצוגה חשוכה ואין תגובה לשום פקודה.") },
    { id: "cmd", row: 1, x: 180, w: 150, name: L("Step command: local or remote", "פקודת דרגה: מקומי או מרחוק"),
      role: L("The brightness step comes from the front panel in Local, or from the ALCMS through I/O or a network interface in Remote.",
        "דרגת הבהירות מגיעה מהלוח הקדמי במצב מקומי, או מה־ALCMS דרך כרטיסי קלט/פלט או ממשק רשת במצב מרחוק."),
      fail: L("Interface or cabling fault: the CCR works in Local but ignores the ALCMS.", "תקלה בממשק או בכבילה: הווסת עובד במצב מקומי אבל מתעלם מה־ALCMS.") },
    { id: "reg", row: 1, x: 346, w: 170, name: L("Regulation board", "כרטיס הוויסות"),
      role: L("Compares the measured current with the setpoint of the selected step every half-cycle and moves the firing angle (or the PWM duty) to hold the current within about ±0.1 A, whatever the load does.",
        "משווה את הזרם הנמדד לערך היעד של הדרגה שנבחרה בכל חצי מחזור, ומזיז את זווית ההצתה (או את מחזור העבודה של ה־PWM) כדי להחזיק את הזרם בתוך כ־±0.1 A, מה שלא יעשה העומס."),
      fail: L("Drift: the wrong current at every step. A failing board: hunting and flicker, or no output.", "סטייה: זרם שגוי בכל דרגה. כרטיס שכושל: תנודות והבהובים, או אין יציאה.") },
    { id: "prot", row: 1, x: 532, w: 160, name: L("Protection logic", "לוגיקת ההגנות"),
      role: L("Open circuit: the current collapses while the voltage rises, so the CCR trips within a few seconds and latches. Overcurrent: a current above the step by a set margin trips it. Also input undervoltage and over-temperature.",
        "נתק: הזרם קורס בזמן שהמתח עולה, ולכן הווסת נופל תוך שניות ספורות וננעל. זרם יתר: זרם מעל הדרגה במרווח שנקבע מפיל אותו. וגם מתח כניסה נמוך וטמפרטורת יתר."),
      fail: L("A faulty board trips on open circuit even into a short at the cutout: that proves the fault is in the CCR, not the field.",
        "כרטיס תקול מפיל על נתק גם לתוך קצר במנתק: זה מוכיח שהתקלה בווסת ולא בשדה.") },
    { id: "irms", row: 1, x: 708, w: 140, name: L("Insulation monitor", "מנטר בידוד"),
      role: L("Injects a DC test voltage between the loop and earth and measures the leakage continuously. Below the alarm threshold it raises the earth fault alarm; the lights stay on.",
        "מזריק מתח בדיקה DC בין הלולאה לאדמה ומודד את הזליגה ברציפות. מתחת לסף ההתראה הוא מפעיל התראת קצר לאדמה; הפנסים נשארים דולקים."),
      fail: L("A single earth fault only alarms; a second one bypasses the lights between them.", "קצר יחיד לאדמה רק מתריע; קצר שני עוקף את הפנסים שביניהם.") },
    { id: "mon", row: 1, x: 864, w: 122, name: L("Display and ALCMS feedback", "תצוגה ומשוב ל־ALCMS"),
      role: L("Shows the step, current, voltage and alarms, and reports to the ALCMS: on or off, step feedback, faults and the number of lamps out, estimated from the change in load.",
        "מציג דרגה, זרם, מתח והתראות, ומדווח ל־ALCMS: פועל או כבוי, משוב דרגה, תקלות ומספר הנורות השרופות, שמוערך לפי השינוי בעומס."),
      fail: L("Wrong feedback can hide a real fault: confirm what the ALCMS shows at the CCR.", "משוב שגוי יכול להסתיר תקלה אמיתית: אמתו במכשיר עצמו את מה שה־ALCMS מציג.") }
  ];

  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const tx = o => o[AGL.lang] || o.en;
  const fmt = (n, d) => n.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
  const st = { sel: "reg", tech: "scr", step: 5, lamps: 40, kva: 10 };

  const rowY = [70, 250], H = 74;
  const mid = b => [b.x + b.w / 2, rowY[b.row] + H / 2];
  const byId = id => BLOCKS.find(b => b.id === id);

  function wrapLines(text, max) {
    const out = [];
    let line = "";
    text.split(" ").forEach(w => { if ((line + " " + w).trim().length > max) { out.push(line.trim()); line = w; } else line += " " + w; });
    if (line.trim()) out.push(line.trim());
    return out;
  }

  /* ---------- The schematic ----------
     Power circuit as a two-wire schematic with IEC symbols; control circuit as function blocks.
     Each component is a group with an invisible hit box; the selected one is highlighted. */
  const yL = 90, yN = 170;
  const coilV = (x, y1, y2, dir) => {           // vertical winding, bumps to the right (dir 1) or left (-1)
    const n = 4, h = (y2 - y1) / n;
    let d = `M${x},${y1}`;
    for (let i = 0; i < n; i++) d += ` a${h / 2},${h / 2} 0 0 ${dir > 0 ? 1 : 0} 0,${h}`;
    return d;
  };
  const coilH = (x1, x2, y, dir) => {           // horizontal winding, bumps up (dir -1) or down (1)
    const n = 3, w = (x2 - x1) / n;
    let d = `M${x1},${y}`;
    for (let i = 0; i < n; i++) d += ` a${w / 2},${w / 2} 0 0 ${dir < 0 ? 1 : 0} ${w},0`;
    return d;
  };
  const earth = (x, y) => `M${x},${y} v6 M${x - 9},${y + 6} h18 M${x - 6},${y + 10} h12 M${x - 3},${y + 14} h6`;
  // Normally open contact on a horizontal wire: x1 fixed end, x2 moving end; mark "x" breaker or "c" contactor
  function contact(x1, x2, y, mark) {
    let d = `M${x1 - 14},${y} H${x1} M${x2},${y} H${x2 + 14} M${x2},${y} L${x1 + 2},${y - 14}`;
    if (mark === "x") d += ` M${x1 - 4},${y - 4} l8,8 M${x1 + 4},${y - 4} l-8,8`;
    return `<path class="sym" d="${d}"/>` + (mark === "c" ? `<path class="sym" d="M${x1},${y} a4,4 0 0 1 -8,0" />` : "");
  }

  // Short captions for the schematic; the full names appear in the explanation panel
  const SHORT = {
    supply: L("Mains supply", "הזנת רשת"), contactor: L("Breaker and contactor", "מפסק ומגען"), otx: L("Output transformer", "שנאי יציאה"),
    ct: L("Current sensor", "חיישן זרם"), out: L("Surge arresters", "מגיני ברק"), cutout: L("Series cutout", "מנתק טורי"),
    loop: L("Field loop", "לולאת השדה"), ctlpower: L("Control supply and fuse", "הזנת פיקוד ונתיך")
  };
  function comp(id, box, body, des, nameY, nameX, wrapAt) {
    const b = byId(id), on = st.sel === id;
    let name = tx(SHORT[id] || b.name);
    if (id === "power") name = st.tech === "scr" ? AGL.t("Thyristors") : AGL.t("Inverter");
    const [x, y, w, h] = box;
    const lines = wrapLines(name, wrapAt || Math.max(14, Math.floor(w / 6.4)));
    const nx = nameX !== undefined ? nameX : x + w / 2;
    return `<g class="cd-comp${on ? " on" : ""}" data-block="${id}" tabindex="0" role="button" aria-pressed="${on}" aria-label="${esc(des + " " + tx(b.name))}">
      <rect class="hl" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>${body}
      ${des ? `<text class="des" x="${nx}" y="${nameY}" text-anchor="middle">${esc(des)}</text>` : ""}
      ${lines.slice(0, 2).map((l, i) => `<text class="cap" x="${nx}" y="${nameY + (des ? 14 : 0) + i * 13}" text-anchor="middle">${esc(l)}</text>`).join("")}</g>`;
  }
  function block(id, x, y, w, h, des) {
    const b = byId(id), on = st.sel === id;
    const lines = wrapLines(tx(b.name), Math.floor(w / 7.2));
    return `<g class="cd-comp blk${on ? " on" : ""}" data-block="${id}" tabindex="0" role="button" aria-pressed="${on}" aria-label="${esc(des + " " + tx(b.name))}">
      <rect class="hl" x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="6"/>
      <rect class="box" x="${x}" y="${y}" width="${w}" height="${h}"/>
      <text class="des" x="${x + 6}" y="${y + 15}">${des}</text>
      ${lines.map((l, i) => `<text class="cap in" x="${x + w / 2}" y="${y + h / 2 + 8 + (i - (lines.length - 1) / 2) * 14}" text-anchor="middle">${esc(l)}</text>`).join("")}</g>`;
  }

  function diagram() {
    const W = 1000, Hh = 420;
    let s = `<svg viewBox="0 0 ${W} ${Hh}" role="group" aria-label="${esc(AGL.t("How a constant current regulator works"))}">
      <defs><marker id="ccr-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" class="cd-arrhead"/></marker></defs>
      <rect class="cd-sheet" x="4" y="4" width="${W - 8}" height="${Hh - 8}"/>
      <text class="cd-row" x="${W - 14}" y="${Hh - 14}" text-anchor="end">${esc(AGL.t("Control circuit"))}</text>
      <text class="cd-row" x="${W - 14}" y="240" text-anchor="end">${esc(AGL.t("Power circuit"))}</text>
      <path class="cd-div" d="M8,252 H${W - 8}"/>`;
    // Wires of the power circuit (drawn first, symbols on top)
    s += `<path class="wire" d="M40,${yL} H56 M98,${yL} H126 M168,${yL} H212 M308,${yL} H350 V100 M40,${yN} H56 M98,${yN} H126 M168,${yN} H350 V160
      M378,100 V${yL} H588 M378,160 V${yN} H588 M632,${yL} H700 M752,${yL} H838 M890,${yL} H975 V${yN} H632"/>`;
    // Supply terminals
    s += comp("supply", [12, 8, 56, 182], `<circle class="term" cx="40" cy="${yL}" r="4"/><circle class="term" cx="40" cy="${yN}" r="4"/>
      <text class="pin" x="22" y="${yL + 4}">L</text><text class="pin" x="22" y="${yN + 4}">N</text>`, "X1", 22, 34, 7);
    // Q1 breaker and K1 contactor (two poles each, linked), with K1's coil in the control circuit
    s += comp("contactor", [52, 8, 136, 250], contact(70, 84, yL, "x") + contact(70, 84, yN, "x") + `<path class="mech" d="M78,${yL - 9} V${yN - 9}"/>` +
      contact(140, 154, yL, "c") + contact(140, 154, yN, "c") + `<path class="mech" d="M148,${yL - 9} V${yN - 9} M148,${yN - 9} V232"/>
      <rect class="sym fillw" x="138" y="232" width="20" height="16"/><text class="pin" x="164" y="244">K1</text>`, "Q1 · K1", 22, 118, 12);
    // Power stage: anti-parallel thyristors, or an inverter
    if (st.tech === "scr") {
      s += comp("power", [206, 8, 108, 184], `<path class="wire" d="M212,${yL} H224 V${yL - 22} H244 M276,${yL - 22} H296 V${yL} H308 M224,${yL} V${yL + 22} H244 M276,${yL + 22} H296 V${yL}"/>
        <path class="sym fillk" d="M244,${yL - 32} L264,${yL - 22} L244,${yL - 12} Z"/><path class="sym" d="M264,${yL - 32} V${yL - 12} M264,${yL - 22} H276 M258,${yL - 15} l10,10"/>
        <path class="sym fillk" d="M276,${yL + 12} L256,${yL + 22} L276,${yL + 32} Z"/><path class="sym" d="M256,${yL + 12} V${yL + 32} M244,${yL + 22} H256 M262,${yL + 29} l-10,10"/>`, "V1 · V2", 22);
    } else {
      s += comp("power", [206, 8, 108, 184], `<path class="wire" d="M212,${yL} H230 M290,${yL} H308"/>
        <rect class="sym fillw" x="230" y="${yL - 26}" width="60" height="52"/><path class="sym" d="M230,${yL + 26} L290,${yL - 26}"/>
        <text class="pin" x="236" y="${yL - 10}">~</text><text class="pin" x="266" y="${yL + 20}">~</text><text class="pin small" x="246" y="${yL + 6}">=</text>`, "U1", 22);
    }
    // T1 output transformer
    s += comp("otx", [334, 8, 60, 186], `<path class="sym" d="${coilV(350, 100, 160, 1)}"/><path class="sym" d="M362,98 V162 M366,98 V162"/>
      <path class="sym" d="${coilV(378, 100, 160, -1)}"/>`, "T1", 22, 364);
    // TA1 current transformer on the output
    s += comp("ct", [414, 8, 56, 108], `<circle class="sym fillw" cx="442" cy="${yL}" r="10"/><circle class="sym fillw" cx="442" cy="${yL}" r="10" style="fill:none"/>
      <path class="sig" d="M442,${yL + 10} V230 H428 V292"/>`, "TA1", 22, 442, 8);
    // F1, F2 surge arresters to earth
    s += comp("out", [476, 8, 78, 224], `<path class="wire" d="M496,${yL} V104 M530,${yN} V184"/><rect class="sym fillw" x="490" y="104" width="12" height="22"/><path class="sym" d="M496,108 v14 m-4,-5 l4,5 l4,-5"/>
      <path class="sym" d="M496,126 V132 ${earth(496, 132)}"/>
      <rect class="sym fillw" x="524" y="184" width="12" height="22"/><path class="sym" d="M530,188 v14 m-4,-5 l4,5 l4,-5"/><path class="sym" d="M530,206 V212 ${earth(530, 212)}"/>`, "F1 · F2", 22, 520, 9);
    // S1 series cutout: plug bridging each pole, shorting link on the CCR side when withdrawn
    s += comp("cutout", [562, 8, 100, 186], `<path class="mech dash" d="M574,70 H650 V190 H574 Z"/>
      <circle class="term" cx="588" cy="${yL}" r="4"/><circle class="term" cx="632" cy="${yL}" r="4"/><path class="sym thick" d="M592,${yL} H628"/>
      <circle class="term" cx="588" cy="${yN}" r="4"/><circle class="term" cx="632" cy="${yN}" r="4"/><path class="sym thick" d="M592,${yN} H628"/>
      <path class="mech" d="M582,${yL + 4} V${yN - 4}"/>`, "S1", 22, 612);
    // Field loop: isolating transformers in series, each feeding its lamp
    const lamp = (x) => `<path class="sym" d="${coilH(x - 26, x + 26, yL, -1)}"/><path class="sym" d="M${x - 26},${yL + 6} H${x + 26} M${x - 26},${yL + 10} H${x + 26}"/>
      <path class="sym" d="${coilH(x - 26, x + 26, yL + 16, 1)}"/><path class="wire" d="M${x - 26},${yL + 16} V${yL + 46} H${x - 9} M${x + 26},${yL + 16} V${yL + 46} H${x + 9}"/>
      <circle class="sym fillw" cx="${x}" cy="${yL + 46}" r="9"/><path class="sym" d="M${x - 6},${yL + 40} l12,12 M${x + 6},${yL + 40} l-12,12"/>`;
    s += comp("loop", [670, 8, 320, 182], lamp(726) + lamp(864) + `<text class="pin" x="795" y="${yL + 4}">· · ·</text>`, "", 22, 820);
    // Control circuit: control supply, then the function blocks
    s += comp("ctlpower", [12, 192, 122, 178], `<path class="wire" d="M48,${yL} V196 M48,218 V238"/><circle class="dot" cx="48" cy="${yL}" r="3"/>
      <rect class="sym fillw" x="42" y="196" width="12" height="22"/><path class="sym" d="M48,196 V218"/>
      <circle class="sym" cx="48" cy="246" r="8" style="fill:none"/><circle class="sym" cx="48" cy="258" r="8" style="fill:none"/>
      <path class="sig" d="M48,266 V300 H174" marker-end="url(#ccr-arr)"/>`, "F3 · T2", 328, 66);
    s += block("cmd", 176, 282, 120, 52, "A2");
    s += block("reg", 324, 282, 140, 52, "A1");
    s += block("prot", 494, 282, 140, 52, "A3");
    s += block("irms", 676, 282, 128, 52, "A4");
    s += block("mon", 836, 282, 148, 52, "A5");
    // Signals
    s += `<path class="sig" d="M296,308 H322" marker-end="url(#ccr-arr)"/>
      <path class="sig" d="M342,282 V244 H${st.tech === "scr" ? 262 : 260} V${st.tech === "scr" ? yL + 36 : yL + 28}" marker-end="url(#ccr-arr)"/>
      <text class="slab" x="${st.tech === "scr" ? 270 : 268}" y="238">${esc(st.tech === "scr" ? AGL.t("firing pulses") : AGL.t("PWM"))}</text>
      <path class="sig" d="M428,230 H560 V280" marker-end="url(#ccr-arr)"/><text class="slab" x="452" y="246">${esc(AGL.t("measured current"))}</text>
      <path class="sig" d="M560,334 V352 H148 V250" marker-end="url(#ccr-arr)"/><text class="slab" x="330" y="366">${esc(AGL.t("trip: opens K1"))}</text>
      <path class="wire" d="M700,${yN} V280"/><circle class="dot" cx="700" cy="${yN}" r="3"/><path class="sym" d="M760,334 V344 ${earth(760, 344)}"/>
      <path class="sig" d="M804,308 H834" marker-end="url(#ccr-arr)"/>
      <path class="sig" d="M634,300 H660 V262 H900 V280" marker-end="url(#ccr-arr)"/>
      <path class="sig" d="M984,308 H994"/><text class="slab" x="980" y="352" text-anchor="end">${esc(AGL.t("to the ALCMS"))}</text>`;
    return s + "</svg>";
  }

  // The regulator in operation: what it must do to hold the selected step on this load
  function model() {
    const I = STEPS[st.step - 1];
    const z = st.lamps * 4.6 + 6;                  // loop impedance, Ω: each light through its transformer, plus the cable
    const vMax = st.kva * 1000 / 6.6;             // the most the output transformer can deliver
    const vNeed = I * z;
    const held = vNeed <= vMax;
    const iOut = held ? I : vMax / z;
    const vOut = iOut * z;
    const r = Math.min(1, vOut / vMax);           // fraction of full output
    // Thyristor firing angle for that fraction of RMS output: solve (π − α + sin2α / 2) / π = r²
    let a = 0;
    if (st.tech === "scr") {
      let lo = 0, hi = Math.PI;
      for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2, f = (Math.PI - m + Math.sin(2 * m) / 2) / Math.PI; if (f > r * r) lo = m; else hi = m; }
      a = (lo + hi) / 2;
    }
    return { I, iOut, vOut, vMax, held, r, a, load: vOut * iOut / (st.kva * 1000) };
  }

  function wave(m) {
    const W = 420, Hh = 170, x0 = 34, y0 = Hh / 2, sx = (W - x0 - 10) / (2 * Math.PI), amp = m.iOut * Math.SQRT2, sy = 68 / (6.6 * Math.SQRT2);
    let pts = "", ref = "";
    for (let k = 0; k <= 240; k++) {
      const th = k / 240 * 2 * Math.PI, ph = th % Math.PI;
      let v;
      if (st.tech === "scr") {
        // Chopped sine scaled so its RMS equals the regulated current
        const full = m.iOut / Math.max(0.05, m.r);
        v = ph < m.a ? 0 : full * Math.SQRT2 * Math.sin(th);
      } else v = amp * Math.sin(th);
      pts += `${(x0 + th * sx).toFixed(1)},${(y0 - v * sy).toFixed(1)} `;
      ref += `${(x0 + th * sx).toFixed(1)},${(y0 - 6.6 * Math.SQRT2 * sy * Math.sin(th)).toFixed(1)} `;
    }
    return `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(AGL.t("Output current over one cycle"))}">
      <path class="cd-axis" d="M${x0},${y0} H${W - 6} M${x0},10 V${Hh - 10}"/>
      <polyline class="cd-ref" points="${ref}"/>
      <polyline class="cd-wave" points="${pts}"/>
      <text class="cd-lab" x="${x0 + 4}" y="18">${esc(AGL.t("output current"))}</text>
      <text class="cd-lab" x="${W - 8}" y="${Hh - 6}" text-anchor="end">${esc(AGL.t("one cycle"))}</text></svg>`;
  }

  function render() {
    const host = document.getElementById("ccr-how");
    if (!host) return;
    const b = byId(st.sel), m = model();
    const role = b.id === "power" ? b.role[st.tech] : b.role;
    host.querySelector(".cd-diagram").innerHTML = diagram();
    host.querySelector(".cd-info").innerHTML = `<span class="tag">${esc(AGL.t(b.row ? "Control path" : "Power path"))}</span>
      <h4>${esc(tx(b.name))}</h4><p>${esc(tx(role))}</p><p class="cd-fail"><strong>${esc(AGL.t("When it fails"))}:</strong> ${esc(tx(b.fail))}</p>`;
    const rows = [
      [AGL.t("Set current"), fmt(m.I, 1) + " A"],
      [AGL.t("Output current (true RMS)"), fmt(m.iOut, 2) + " A"],
      [AGL.t("Output voltage"), fmt(m.vOut, 0) + " V"],
      [AGL.t("Maximum output voltage"), fmt(m.vMax, 0) + " V"],
      [AGL.t("Loading"), fmt(m.load * 100, 0) + " %"],
      st.tech === "scr" ? [AGL.t("Firing angle"), fmt(m.a * 180 / Math.PI, 0) + "°"] : [AGL.t("Modulation"), fmt(m.r * 100, 0) + " %"]
    ];
    host.querySelector(".cd-read").innerHTML = rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num"><bdi dir="ltr">${v}</bdi></td></tr>`).join("");
    const note = host.querySelector(".cd-note");
    note.className = "cd-note feedback " + (m.held ? "ok" : "bad");
    note.textContent = m.held
      ? (st.tech === "scr" ? AGL.t("The CCR holds the current. Lighter load or a lower step: a later firing angle, a more chopped waveform and a poorer power factor.")
        : AGL.t("The CCR holds the current with a clean sine wave at every step."))
      : AGL.t("Overloaded: the loop needs {v} V but this CCR can give only {m} V, so the current falls short and the lights dim. Fit a larger CCR or split the circuit.",
        { v: fmt(m.I * (st.lamps * 4.6 + 6), 0), m: fmt(m.vMax, 0) });
    host.querySelector(".cd-wave-host").innerHTML = wave(m);
    host.querySelectorAll(".cd-tech button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.tech === st.tech)));
    host.querySelectorAll(".cd-step button").forEach(x => x.setAttribute("aria-pressed", String(+x.dataset.step === st.step)));
    host.querySelector(".cd-lamps-v").textContent = st.lamps;
    AGL.bidiSvg(host.querySelector(".cd-diagram"));
    AGL.bidiSvg(host.querySelector(".cd-wave-host"));
  }

  AGL.initCCRHow = function () {
    const host = document.getElementById("ccr-how");
    if (!host) return;
    const kva = host.querySelector(".cd-kva");
    kva.innerHTML = RATINGS.map(k => `<option value="${k}"${k === st.kva ? " selected" : ""}>${k} kVA</option>`).join("");
    host.querySelector(".cd-diagram").addEventListener("click", e => {
      const g = e.target.closest("[data-block]");
      if (g) { st.sel = g.dataset.block; render(); host.querySelector(`[data-block="${st.sel}"]`).focus({ preventScroll: true }); }
    });
    host.querySelector(".cd-diagram").addEventListener("keydown", e => {
      const g = e.target.closest("[data-block]");
      if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); st.sel = g.dataset.block; render(); host.querySelector(`[data-block="${st.sel}"]`).focus({ preventScroll: true }); }
    });
    host.querySelector(".cd-tech").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { st.tech = b.dataset.tech; render(); } });
    host.querySelector(".cd-step").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { st.step = +b.dataset.step; render(); } });
    host.querySelector(".cd-lamps").addEventListener("input", e => { st.lamps = +e.target.value; render(); });
    kva.addEventListener("change", e => { st.kva = +e.target.value; render(); });
    render();
    AGL.onLang(render);
  };
})();
