/* Module F content: the AGL vault (substation). Single-line diagram parts, circuits and floor plan.
   Values are typical; follow the local electrical code, the authority's rules and the design. */
window.AGL = window.AGL || {};
AGL.HE = AGL.HE || {};

AGL.VAULT = {
  parts: {
    feeders: {
      name: "Utility feeders",
      text: "Two independent medium-voltage feeders from the airport network, ideally from different upstream substations. Either one can supply the vault, so a single cable fault or upstream outage does not take the airfield lighting down.",
      specs: [["Voltage", "Medium voltage, set by the local network"], ["Arrangement", "Two feeders, one in service and one ready"]]
    },
    mv: {
      name: "MV switchgear",
      text: "A ring main unit or MV switchgear selects the feeder, protects the transformer and lets it be isolated for maintenance. Only staff qualified and authorised for medium voltage may operate it.",
      specs: [["Protection", "Transformer breaker or fuses"], ["Access", "MV-authorised staff only, usually in a separate room"]]
    },
    transformer: {
      name: "Distribution transformer",
      text: "Steps the medium voltage down to the low voltage the CCRs use, such as 400 V or 480 V. It is sized for every CCR at full brightness plus building loads and future growth. Large or critical vaults often have two transformers.",
      specs: [["Output", "400 V or 480 V, three-phase"], ["Sizing", "All CCRs at step 5, building loads, growth margin"]]
    },
    generator: {
      name: "Standby generator",
      text: "A diesel generator that takes over when the mains fails. It starts automatically and is usually ready to take load in about 10 seconds. That meets 15 s switch-over times, but not 1 s ones, which is why the critical CCRs need a no-break supply.",
      specs: [["Start to load", "Typically 8–12 s"], ["Fuel", "Enough for the required running time"], ["Testing", "Regular start tests and on-load tests"]]
    },
    ats: {
      name: "Automatic transfer switch",
      text: "Watches the mains. When it fails, the ATS starts the generator, waits until its voltage and frequency are stable, then moves the essential bus onto it. When the mains has been stable for a set time, it transfers back.",
      specs: [["Transfer", "Break-before-make, after the generator is stable"], ["Retransfer", "After a time delay on healthy mains"]]
    },
    lvboard: {
      name: "Main LV switchboard",
      text: "The essential bus. It feeds each CCR through its own breaker, and also the UPS, the ALCMS, air conditioning and building loads. Every CCR feeder is labelled with the circuit it serves.",
      specs: [["Feeders", "One breaker per CCR, labelled with the circuit"], ["Also feeds", "UPS, ALCMS, HVAC, building services"]]
    },
    ups: {
      name: "UPS (no-break supply)",
      text: "A battery-backed supply for loads that cannot wait for the generator: the ALCMS and, for CAT II/III operations, the CCRs feeding the 1 s circuits. It carries them through the gap until the generator is on line.",
      specs: [["Transfer", "No break"], ["Autonomy", "At least the generator start time, plus margin"], ["Loads", "ALCMS, and the CCRs for 1 s circuits"]]
    },
    ccr: {
      name: "Constant current regulator",
      text: "One CCR per field circuit. Each one takes 400 V from its feeder and drives the regulated series current into its circuit. Interleaved circuits, such as runway edge A and B, are on separate CCRs, and where possible on separate feeders.",
      specs: [["Output", "2.8–6.6 A series current, up to several kV"], ["Monitoring", "Built-in insulation resistance monitor (IRMS) and lamp-failure detection"]]
    },
    standby: {
      name: "Standby CCR and changeover",
      text: "A spare CCR that can be switched onto any circuit through a changeover switch, so a failed CCR does not leave a circuit dark for long. It must be at least as large as the largest circuit it may replace. Operate the changeover only with both CCRs off.",
      specs: [["Rating", "Equal to the largest circuit it can serve"], ["Changeover", "Interlocked selector; switch with CCRs off"]]
    },
    cutout: {
      name: "Series cutouts",
      text: "A disconnect between each CCR and its field circuit. Opening it isolates the field circuit for testing and work, and can short the CCR side for tests. In FAA terms this is the S-1 cutout.",
      specs: [["Use", "Isolation for insulation tests and field work"], ["Rule", "Never open under load; switch the CCR off first"]]
    },
    surge: {
      name: "Surge arresters",
      text: "Field circuits are kilometres long and pick up lightning surges. Arresters at the CCR outputs divert surges to the vault earth before they reach the regulator electronics.",
      specs: [["Location", "CCR output terminals"], ["Bonding", "Short, direct leads to the earth bar"]]
    },
    alcms: {
      name: "ALCMS controller",
      text: "Redundant controllers that switch the CCRs and set their brightness steps on commands from the tower. They also collect alarms: CCR faults, lamp failures and low insulation. Fed from the UPS so that control survives a power failure.",
      specs: [["Redundancy", "Duplicated controllers and networks for CAT II/III"], ["Power", "From the UPS"], ["Modes", "Remote (tower) or local (vault)"]]
    },
    tower: {
      name: "Tower control panel",
      text: "The air traffic controller's lighting panel or touchscreen. Commands reach the vault over redundant links, usually fibre. Maintenance staff switch the vault to local control so the tower cannot energise a circuit they are working on.",
      specs: [["Link", "Redundant, usually fibre"], ["Handover", "Local control during maintenance, agreed with ATC"]]
    },
    earth: {
      name: "Earthing system",
      text: "The main earth bar bonds the building earth electrode, the transformer neutral, equipment frames, cable screens, surge arresters and the airfield counterpoise. One common, low-resistance reference keeps touch voltages safe and gives surges a path to ground.",
      specs: [["Bonds", "Electrode ring, neutral, frames, screens, arresters, counterpoise"], ["Testing", "Periodic earth resistance and continuity tests"]]
    }
  },
  circuits: {
    twy: "Taxiway lights",
    edgeA: "Runway edge A",
    edgeB: "Runway edge B",
    standby: "Standby CCR",
    appr: "Approach (inner 300 m)",
    thr: "Threshold and end",
    rcl: "Runway centreline",
    tdz: "Touchdown zone",
    stop: "Stop bars"
  },
  plan: {
    ccrs: { name: "CCR row", text: "CCRs stand in a row against the wall, each labelled with its circuit, with spare floor space for future regulators." },
    clear: { name: "Working clearance", text: "Clear space in front of the CCRs and switchboards so doors open fully and staff can work and escape safely. The depth is set by the local electrical code." },
    mats: { name: "Insulating mats", text: "Rubber insulating mats in front of the CCRs and switchboards, where staff stand to operate and test." },
    trench: { name: "Cable trench", text: "A covered floor trench carries the field cables from the CCR outputs to the duct bank leaving the building. Medium-voltage, low-voltage, control and series cables are kept apart." },
    lv: { name: "LV switchboard and ATS", text: "The main switchboard and transfer switch, with the single-line diagram mounted beside them." },
    alcms: { name: "ALCMS cabinets", text: "Control cabinets with redundant controllers, network equipment and the local control panel." },
    earthbar: { name: "Main earth bar", text: "The bar where all earthing and bonding conductors meet, labelled and accessible for testing." },
    hvac: { name: "Air conditioning", text: "CCRs and UPS units give off heat. Air conditioning or forced ventilation keeps the electronics within their temperature limits, with redundancy in critical vaults." },
    board: { name: "Safety board", text: "Single-line diagram, switching procedures and emergency contacts, plus insulated gloves, a voltage detector, a discharge stick and the lockout kit." },
    bench: { name: "Workbench and spares", text: "Spare lamps, transformers, connector kits and CCR cards, plus test equipment: a true-RMS clamp meter and an insulation tester." },
    fire: { name: "Fire protection", text: "Smoke detection, suitable extinguishers for electrical fires and, in larger vaults, a fixed suppression system." },
    exits: { name: "Exits and emergency lighting", text: "Two exits with doors opening outward and panic hardware, and emergency lighting so staff can leave in a power failure." },
    mvroom: { name: "MV room", text: "Medium-voltage switchgear and the transformer in a separate, locked room with access only for MV-authorised staff." },
    genroom: { name: "Generator room", text: "A separate fire compartment for the generator, with a bunded fuel tank, exhaust and combustion air." },
    battery: { name: "UPS and battery room", text: "UPS and batteries in a ventilated, temperature-controlled room. Battery rooms need ventilation for the gas some batteries release while charging." }
  }
};

AGL.HE.VAULT = {
  parts: {
    feeders: {
      name: "הזנות מהרשת",
      text: "שתי הזנות מתח גבוה בלתי תלויות מרשת שדה התעופה, רצוי מתחנות משנה שונות. כל אחת מהן יכולה להזין את מרכז החשמל, כך שתקלה בכבל אחד או הפסקה ברשת לא מכבה את תאורת השדה.",
      specs: [["מתח", "מתח גבוה, לפי הרשת המקומית"], ["סידור", "שתי הזנות, אחת בפעולה ואחת מוכנה"]]
    },
    mv: {
      name: "מפסקי מתח גבוה",
      text: "יחידת טבעת (RMU) או לוח מתח גבוה שבוחרים את ההזנה, מגינים על השנאי ומאפשרים לנתק אותו לתחזוקה. רק אנשי צוות מוסמכים ומורשים למתח גבוה רשאים להפעיל אותם.",
      specs: [["הגנה", "מפסק או נתיכים לשנאי"], ["גישה", "רק למורשי מתח גבוה, בדרך כלל בחדר נפרד"]]
    },
    transformer: {
      name: "שנאי חלוקה",
      text: "מוריד את המתח הגבוה למתח הנמוך שהווסתים עובדים בו, למשל 400 V או 480 V. גודלו נקבע לכל הווסתים בעוצמה מלאה, לעומסי המבנה ולגידול עתידי. במרכזי חשמל גדולים או קריטיים יש לעיתים קרובות שני שנאים.",
      specs: [["יציאה", "400 V או 480 V, תלת־מופעי"], ["גודל", "כל הווסתים בדרגה 5, עומסי מבנה, מרווח לגידול"]]
    },
    generator: {
      name: "גנרטור חירום",
      text: "גנרטור דיזל שנכנס לפעולה כשהרשת נופלת. הוא מתניע אוטומטית ומוכן בדרך כלל לקבל עומס תוך כ־10 שניות. זה עומד בזמני מעבר של 15 שניות אבל לא בזמנים של שנייה אחת, ולכן הווסתים הקריטיים צריכים הזנה ללא הפסקה.",
      specs: [["מהתנעה לעומס", "בדרך כלל 8–12 שניות"], ["דלק", "מספיק לזמן הפעולה הנדרש"], ["בדיקות", "בדיקות התנעה ובדיקות בעומס באופן סדיר"]]
    },
    ats: {
      name: "מפסק העברה אוטומטי",
      text: "עוקב אחרי הרשת. כשהיא נופלת, מפסק ההעברה (ATS) מתניע את הגנרטור, ממתין שהמתח והתדר שלו יתייצבו, ואז מעביר אליו את הפס החיוני. כשהרשת יציבה במשך זמן שנקבע, הוא מעביר בחזרה.",
      specs: [["העברה", "ניתוק לפני חיבור, אחרי שהגנרטור יציב"], ["החזרה", "אחרי השהיה על רשת תקינה"]]
    },
    lvboard: {
      name: "לוח מתח נמוך ראשי",
      text: "הפס החיוני. הוא מזין כל וסת דרך מפסק משלו, וגם את ה־UPS, ה־ALCMS, מיזוג האוויר ועומסי המבנה. כל יציאה לווסת מסומנת בשם המעגל שהיא מזינה.",
      specs: [["יציאות", "מפסק לכל וסת, מסומן בשם המעגל"], ["מזין גם", "UPS, ALCMS, מיזוג, שירותי מבנה"]]
    },
    ups: {
      name: "UPS (הזנה ללא הפסקה)",
      text: "הזנה מגובת סוללות לעומסים שלא יכולים לחכות לגנרטור: ה־ALCMS, ובזמן פעולת CAT II/III, הווסתים של המעגלים שדורשים שנייה אחת. היא מגשרת עליהם על הפער עד שהגנרטור עולה.",
      specs: [["העברה", "ללא הפסקה"], ["זמן גיבוי", "לפחות זמן ההתנעה של הגנרטור, עם מרווח"], ["עומסים", "ALCMS, והווסתים של מעגלי השנייה האחת"]]
    },
    ccr: {
      name: "וסת זרם קבוע",
      text: "וסת אחד לכל מעגל שדה. כל וסת מקבל 400 V מהמפסק שלו ומזרים את הזרם הטורי המווסת למעגל שלו. מעגלים שזורים, כמו שולי מסלול A ו־B, נמצאים על וסתים נפרדים, ובמידת האפשר גם על הזנות נפרדות.",
      specs: [["יציאה", "זרם טורי 2.8–6.6 A, עד כמה kV"], ["ניטור", "מנטר התנגדות בידוד (IRMS) מובנה וגילוי נורות שרופות"]]
    },
    standby: {
      name: "וסת רזרבי ומחליף",
      text: "וסת רזרבי שאפשר להעביר לכל מעגל דרך מפסק החלפה, כך שווסת תקול לא משאיר מעגל חשוך לאורך זמן. הוא חייב להיות גדול לפחות כמו המעגל הגדול ביותר שהוא עשוי להחליף. הפעילו את המחליף רק כששני הווסתים כבויים.",
      specs: [["דירוג", "שווה למעגל הגדול ביותר שהוא יכול לשרת"], ["החלפה", "בורר עם נעילה הדדית; החלפה כשהווסתים כבויים"]]
    },
    cutout: {
      name: "מנתקי מעגל טורי",
      text: "מנתק בין כל וסת למעגל השדה שלו. פתיחתו מנתקת את מעגל השדה לבדיקות ולעבודה, ויכולה לקצר את צד הווסת לבדיקות. במינוח FAA זה ה־S-1 cutout.",
      specs: [["שימוש", "ניתוק לבדיקות בידוד ולעבודה בשטח"], ["כלל", "לעולם לא לפתוח בעומס; קודם לכבות את הווסת"]]
    },
    surge: {
      name: "מגיני ברק (מתנעי נחשולים)",
      text: "מעגלי השדה ארוכים קילומטרים וקולטים נחשולי ברק. מגיני הנחשולים ביציאות הווסתים מסיטים את הנחשולים להארקת מרכז החשמל לפני שהם מגיעים לאלקטרוניקה של הווסת.",
      specs: [["מיקום", "הדקי היציאה של הווסת"], ["חיבור", "מוליכים קצרים וישירים לפס ההארקה"]]
    },
    alcms: {
      name: "בקר ALCMS",
      text: "בקרים כפולים שמדליקים את הווסתים וקובעים את דרגות העוצמה לפי פקודות מהמגדל. הם גם אוספים התראות: תקלות וסת, נורות שרופות ובידוד נמוך. הם מוזנים מה־UPS כדי שהבקרה תשרוד הפסקת חשמל.",
      specs: [["יתירות", "בקרים ורשתות כפולים ל־CAT II/III"], ["הזנה", "מה־UPS"], ["מצבים", "מרחוק (מגדל) או מקומי (מרכז החשמל)"]]
    },
    tower: {
      name: "לוח בקרה במגדל",
      text: "לוח התאורה או מסך המגע של בקר התעבורה האווירית. הפקודות מגיעות למרכז החשמל דרך קישורים כפולים, בדרך כלל סיב אופטי. צוות התחזוקה מעביר את מרכז החשמל לבקרה מקומית כדי שהמגדל לא יוכל להפעיל מעגל שעובדים עליו.",
      specs: [["קישור", "כפול, בדרך כלל סיב אופטי"], ["העברה", "בקרה מקומית בזמן תחזוקה, בתיאום עם הבקרה"]]
    },
    earth: {
      name: "מערכת הארקה",
      text: "פס ההארקה הראשי מחבר את אלקטרודת ההארקה של המבנה, את האפס של השנאי, את גופי הציוד, את סיכוכי הכבלים, את מגיני הנחשולים ואת ה־counterpoise של השדה. ייחוס משותף אחד בהתנגדות נמוכה שומר על מתחי מגע בטוחים ונותן לנחשולים מסלול לאדמה.",
      specs: [["מחברת", "טבעת הארקה, אפס, גופי ציוד, סיכוכים, מגיני נחשולים, counterpoise"], ["בדיקות", "בדיקות התנגדות הארקה ורציפות תקופתיות"]]
    }
  },
  circuits: {
    twy: "תאורת מסלולי הסעה",
    edgeA: "שולי מסלול A",
    edgeB: "שולי מסלול B",
    standby: "וסת רזרבי",
    appr: "גישה (300 מ׳ פנימיים)",
    thr: "סף וקצה",
    rcl: "קו מרכז מסלול",
    tdz: "אזור הנגיעה",
    stop: "פסי עצירה"
  },
  plan: {
    ccrs: { name: "שורת הווסתים", text: "הווסתים עומדים בשורה לאורך הקיר, כל אחד מסומן בשם המעגל שלו, עם שטח רצפה פנוי לווסתים עתידיים." },
    clear: { name: "מרווח עבודה", text: "שטח פנוי לפני הווסתים והלוחות כדי שהדלתות ייפתחו עד הסוף והצוות יוכל לעבוד ולהימלט בבטחה. העומק נקבע לפי תקנות החשמל המקומיות." },
    mats: { name: "שטיחי בידוד", text: "שטיחי גומי מבודדים לפני הווסתים והלוחות, במקום שבו הצוות עומד כדי להפעיל ולבדוק." },
    trench: { name: "תעלת כבלים", text: "תעלת רצפה מכוסה מובילה את כבלי השדה מיציאות הווסתים אל מערך הצינורות שיוצא מהמבנה. כבלי מתח גבוה, מתח נמוך, בקרה ומעגלים טוריים מופרדים זה מזה." },
    lv: { name: "לוח מתח נמוך ו־ATS", text: "הלוח הראשי ומפסק ההעברה, עם תרשים החד־קווי תלוי לידם." },
    alcms: { name: "ארונות ALCMS", text: "ארונות בקרה עם בקרים כפולים, ציוד רשת ולוח הבקרה המקומי." },
    earthbar: { name: "פס הארקה ראשי", text: "הפס שבו נפגשים כל מוליכי ההארקה והשוואת הפוטנציאלים, מסומן ונגיש לבדיקות." },
    hvac: { name: "מיזוג אוויר", text: "הווסתים ויחידות ה־UPS פולטים חום. מיזוג או אוורור מאולץ שומרים על האלקטרוניקה בגבולות הטמפרטורה שלה, עם יתירות במרכזי חשמל קריטיים." },
    board: { name: "לוח בטיחות", text: "תרשים חד־קווי, נוהלי מיתוג ואנשי קשר לחירום, וגם כפפות מבודדות, גלאי מתח, מוט פריקה וערכת נעילה." },
    bench: { name: "שולחן עבודה וחלפים", text: "נורות, שנאים, ערכות מחברים וכרטיסי וסת רזרביים, וציוד בדיקה: מד צבת True RMS ובודק בידוד." },
    fire: { name: "הגנה מפני אש", text: "גילוי עשן, מטפים מתאימים לשריפות חשמל, ובמרכזים גדולים מערכת כיבוי קבועה." },
    exits: { name: "יציאות ותאורת חירום", text: "שתי יציאות עם דלתות שנפתחות החוצה וידיות בהלה, ותאורת חירום כדי שהצוות יוכל לצאת בהפסקת חשמל." },
    mvroom: { name: "חדר מתח גבוה", text: "לוח מתח גבוה והשנאי בחדר נפרד ונעול, עם גישה רק למורשי מתח גבוה." },
    genroom: { name: "חדר גנרטור", text: "מדור אש נפרד לגנרטור, עם מיכל דלק במאצרה, פליטה ואוויר בעירה." },
    battery: { name: "חדר UPS וסוללות", text: "UPS וסוללות בחדר מאוורר וממוזג. חדרי סוללות זקוקים לאוורור בגלל הגז שחלק מהסוללות משחררות בזמן טעינה." }
  }
};

AGL.VAULT3D = {
  intro: {
    title: "Walk through the vault",
    text: "The roof is off and the walls nearest you drop to waist height as you turn, so you can see into every room. Point at any piece of equipment for a description, select it for details, or take the guided tour."
  },
  parts: {
    ccrs: { name: "Constant current regulators", short: "One CCR per field circuit, with display, step selector and status lamps", text: "Each cabinet regulates one series circuit. The display shows output current and alarms, the selector switches between remote, local and off, and the lamps show running, alarm and fault. The output cable drops into the trench below." },
    trench: { name: "Cable trench", short: "Covered floor trench carrying the series cables out of the building", text: "Chequer-plate covers sit over a concrete trench running along the CCR row. One plate is lifted here to show the 5 kV series cables on their way to the duct bank. Replace covers before leaving: an open trench is a fall hazard." },
    mats: { name: "Insulating mats and clearance", short: "Rubber mats and the yellow-marked working clearance", text: "Rubber insulating mats run along the front of the CCRs. The yellow lines mark the working clearance that must stay free of stored material, so doors open fully and staff can step back safely." },
    lv: { name: "Main LV switchboard", short: "Incomer and one breaker per CCR, with metering", text: "The first section holds the incoming breaker and meters; the others hold the outgoing breakers, one per CCR and service. The red and blue line along the top is the mimic diagram. Every breaker is labelled with the circuit it feeds." },
    ats: { name: "Automatic transfer switch", short: "Moves the essential bus between mains and generator", text: "The window shows the changeover mechanism. Lamps show which source is connected, and the selector sets automatic, manual or test mode. Transfer tests are coordinated with operations, because the lights blink on transfer." },
    earthbar: { name: "Main earth bar", short: "Copper bar where all earthing conductors meet", text: "A copper bar on insulators, with green and yellow conductors to the building earth electrode, the transformer neutral, equipment frames, cable screens and the airfield counterpoise. Each conductor is labelled so it can be disconnected and tested." },
    alcms: { name: "ALCMS cabinets", short: "Redundant controllers and network equipment", text: "Two racks behind glass doors hold the duplicated ALCMS controllers, network switches, the fibre patch panel to the tower and the local control terminal. Status LEDs show which controller is active." },
    hvac: { name: "Air conditioning", short: "Keeps CCRs and UPS electronics within temperature limits", text: "Wall-mounted units remove the heat from the regulators. A vault full of CCRs at step 5 gives off several kilowatts; losing cooling can trip the regulators on over-temperature." },
    tray: { name: "Cable tray", short: "Galvanised ladder tray from the switchboard to the CCRs", text: "The supply cables run from the LV switchboard along the ladder tray and drop to the roof of each CCR. Power and control cables are kept on separate trays or separated within them." },
    board: { name: "Safety board", short: "Single-line diagram, gloves, discharge stick, lockout station, first aid", text: "Everything needed for safe switching in one place: the single-line diagram, insulated gloves, the discharge stick, a lockout station with personal padlocks, the emergency contacts and a first-aid kit." },
    bench: { name: "Workbench and spares", short: "Test equipment, spare lamps, transformers and CCR cards", text: "An insulation tester, a true-RMS clamp meter, spare lamps and an isolation transformer on the bench, with spare CCR cards and connector kits on the shelf above." },
    fire: { name: "Fire protection", short: "CO2 extinguishers, smoke detectors and a call point", text: "CO2 extinguishers by each exit, smoke detectors at ceiling height and a manual call point. CO2 is suitable for electrical fires; never use water on live equipment." },
    exits: { name: "Exits and emergency lighting", short: "Outward-opening doors with panic bars, exit signs", text: "Two exits with panic bars, illuminated exit signs above them and emergency luminaires that stay lit in a power failure, so staff can always get out." },
    rmu: { name: "Ring main unit (MV)", short: "Medium-voltage switchgear with mimic diagram", text: "Three panels: two feeders and the transformer circuit. The mimic diagram, operating points and gauges are on the front, with cable boxes below. Only MV-authorised staff operate it." },
    txr: { name: "Distribution transformer", short: "Cast-resin transformer, MV to 400 V", text: "Three resin-cast coils on a steel core, with HV bushings on top and copper LV busbars at the back, inside a mesh enclosure. Cast-resin units suit indoor vaults because they contain no oil." },
    gen: { name: "Standby generator", short: "Diesel genset, exhaust silencer and day tank in a bund", text: "Radiator, diesel engine and alternator on a common skid, with the control panel beside it. The exhaust rises to a silencer and leaves through the wall; combustion air comes in through the louvre. The day tank sits in a bund that would contain a leak." },
    ups: { name: "UPS and batteries", short: "No-break supply and its battery racks", text: "The UPS cabinet holds the rectifier, inverter and static bypass; its display shows load and battery state. The racks hold the battery strings, with an extract fan for ventilation and an eyewash station by the door." }
  },
  stops: [
    { title: "The whole vault", text: "The CCR hall on the left, and on the right the MV room, the generator room and the UPS room. Power arrives in the MV room, is backed up by the generator and UPS, and leaves through the CCRs in the hall." },
    { title: "The CCR row", text: "One regulator per field circuit, side by side along the north wall. Each one has its own breaker on the LV switchboard and its own output cable into the trench." },
    { title: "The cable trench", text: "Series cables leave each CCR downwards into the trench and run to the duct bank outside. Keep covers on, and keep series cables apart from low-voltage and control cables." },
    { title: "Main LV switchboard", text: "Everything in the vault is fed from here. Before working on a CCR, open and lock its breaker in this board." },
    { title: "Transfer switch and earth bar", text: "The ATS brings the generator in when the mains fails. Beside it, the main earth bar ties together every earth in the vault and the airfield counterpoise." },
    { title: "ALCMS cabinets", text: "The controllers that take commands from the tower and report alarms. Switching a circuit to local control here is the first step before field work." },
    { title: "Safety board and workbench", text: "Gloves, discharge stick, padlocks and diagrams are kept by the work area, with test equipment and spares on the bench." },
    { title: "Cable tray and air conditioning", text: "Supply cables run overhead from the switchboard to each CCR. The air conditioning removes the heat the regulators give off." },
    { title: "Exits and fire protection", text: "Two exits with panic bars, emergency lighting and CO2 extinguishers by each door." },
    { title: "MV room", text: "The ring main unit takes the utility feeders and supplies the cast-resin transformer, which steps down to 400 V for the vault." },
    { title: "Generator room", text: "The standby generator, its exhaust and silencer, the air intake and the fuel day tank in its bund." },
    { title: "UPS room", text: "The UPS and its batteries keep the ALCMS and the CCRs for the 1 s circuits running without a break when the mains fails." }
  ]
};

AGL.HE.VAULT3D = {
  intro: {
    title: "סיור במרכז החשמל",
    text: "הגג הוסר, והקירות הקרובים אליכם יורדים לגובה המותניים כשאתם מסתובבים, כך שאפשר לראות לתוך כל חדר. הצביעו על כל פריט ציוד כדי לקבל תיאור, בחרו בו לפרטים, או צאו לסיור המודרך."
  },
  parts: {
    ccrs: { name: "וסתי זרם קבוע", short: "וסת לכל מעגל שדה, עם תצוגה, בורר דרגות ונוריות מצב", text: "כל ארון מווסת מעגל טורי אחד. התצוגה מראה את זרם היציאה וההתראות, הבורר מעביר בין מרחוק, מקומי וכבוי, והנוריות מראות פעולה, התראה ותקלה. כבל היציאה יורד לתעלה שמתחת." },
    trench: { name: "תעלת כבלים", short: "תעלת רצפה מכוסה שמובילה את הכבלים הטוריים אל מחוץ למבנה", text: "פלטות מרוקעות מכסות תעלת בטון לאורך שורת הווסתים. פלטה אחת הוסרה כאן כדי להראות את כבלי 5 kV בדרכם אל מערך הצינורות. החזירו את הכיסויים לפני שאתם יוצאים: תעלה פתוחה היא סכנת נפילה." },
    mats: { name: "שטיחי בידוד ומרווח עבודה", short: "שטיחי גומי ומרווח העבודה המסומן בצהוב", text: "שטיחי גומי מבודדים לאורך חזית הווסתים. הקווים הצהובים מסמנים את מרווח העבודה שחייב להישאר פנוי מאחסון, כדי שהדלתות ייפתחו עד הסוף והצוות יוכל לסגת בבטחה." },
    lv: { name: "לוח מתח נמוך ראשי", short: "מפסק ראשי ומפסק לכל וסת, עם מדידה", text: "התא הראשון מכיל את המפסק הראשי ומכשירי המדידה; האחרים מכילים את המפסקים היוצאים, אחד לכל וסת ולכל שירות. הקו האדום והכחול בחלק העליון הוא התרשים המימי. כל מפסק מסומן בשם המעגל שהוא מזין." },
    ats: { name: "מפסק העברה אוטומטי", short: "מעביר את הפס החיוני בין הרשת לגנרטור", text: "החלון מראה את מנגנון ההעברה. הנוריות מראות איזה מקור מחובר, והבורר קובע מצב אוטומטי, ידני או בדיקה. בדיקות העברה מתואמות עם התפעול, כי האורות מהבהבים בזמן ההעברה." },
    earthbar: { name: "פס הארקה ראשי", short: "פס נחושת שבו נפגשים כל מוליכי ההארקה", text: "פס נחושת על מבדדים, עם מוליכים ירוק־צהוב אל אלקטרודת ההארקה של המבנה, אפס השנאי, גופי הציוד, סיכוכי הכבלים וה־counterpoise של השדה. כל מוליך מסומן כדי שאפשר יהיה לנתק ולבדוק אותו." },
    alcms: { name: "ארונות ALCMS", short: "בקרים כפולים וציוד תקשורת", text: "שני ארונות מאחורי דלתות זכוכית מכילים את בקרי ה־ALCMS הכפולים, מתגי רשת, לוח החיבורים של הסיב האופטי למגדל ומסוף הבקרה המקומי. נוריות מצב מראות איזה בקר פעיל." },
    hvac: { name: "מיזוג אוויר", short: "שומר על האלקטרוניקה של הווסתים וה־UPS בגבולות הטמפרטורה", text: "יחידות קיר מסלקות את החום מהווסתים. מרכז חשמל מלא בווסתים בדרגה 5 פולט כמה קילוואט; אובדן הקירור עלול להפיל את הווסתים על טמפרטורת יתר." },
    tray: { name: "תעלת כבלים עילית", short: "סולם כבלים מגולוון מהלוח אל הווסתים", text: "כבלי ההזנה עוברים מלוח המתח הנמוך לאורך סולם הכבלים ויורדים לגג של כל וסת. כבלי הספק ובקרה מופרדים בסולמות נפרדים או בתוך הסולם." },
    board: { name: "לוח בטיחות", short: "תרשים חד־קווי, כפפות, מוט פריקה, עמדת נעילה, עזרה ראשונה", text: "כל מה שצריך למיתוג בטוח במקום אחד: התרשים החד־קווי, כפפות מבודדות, מוט הפריקה, עמדת נעילה עם מנעולים אישיים, אנשי קשר לחירום וערכת עזרה ראשונה." },
    bench: { name: "שולחן עבודה וחלפים", short: "ציוד בדיקה, נורות, שנאים וכרטיסי וסת רזרביים", text: "בודק בידוד, מד צבת True RMS, נורות רזרביות ושנאי בידוד על השולחן, עם כרטיסי וסת וערכות מחברים על המדף שמעליו." },
    fire: { name: "הגנה מפני אש", short: "מטפי CO2, גלאי עשן ולחצן אזעקה", text: "מטפי CO2 ליד כל יציאה, גלאי עשן בגובה התקרה ולחצן אזעקה ידני. CO2 מתאים לשריפות חשמל; לעולם אין להשתמש במים על ציוד חי." },
    exits: { name: "יציאות ותאורת חירום", short: "דלתות הנפתחות החוצה עם ידיות בהלה ושלטי יציאה", text: "שתי יציאות עם ידיות בהלה, שלטי יציאה מוארים מעליהן וגופי תאורת חירום שנשארים דולקים בהפסקת חשמל, כך שהצוות תמיד יכול לצאת." },
    rmu: { name: "יחידת טבעת (מתח גבוה)", short: "מפסקי מתח גבוה עם תרשים מימי", text: "שלושה תאים: שתי הזנות ומעגל השנאי. התרשים המימי, נקודות ההפעלה ומדי הלחץ בחזית, ותיבות הכבלים מתחת. רק מורשי מתח גבוה מפעילים אותה." },
    txr: { name: "שנאי חלוקה", short: "שנאי יצוק בשרף, ממתח גבוה ל־400 V", text: "שלושה סלילים יצוקים בשרף על ליבת פלדה, עם מבודדי מתח גבוה למעלה ופסי נחושת של מתח נמוך מאחור, בתוך מתחם רשת. שנאים יצוקים מתאימים למרכזי חשמל פנימיים כי אין בהם שמן." },
    gen: { name: "גנרטור חירום", short: "גנרטור דיזל, משתיק פליטה ומיכל יומי במאצרה", text: "רדיאטור, מנוע דיזל וגנרטור (אלטרנטור) על שלדה משותפת, ולוח הבקרה לידם. הפליטה עולה למשתיק ויוצאת דרך הקיר; אוויר הבעירה נכנס דרך התריס. המיכל היומי נמצא במאצרה שתכיל דליפה." },
    ups: { name: "UPS וסוללות", short: "הזנה ללא הפסקה ומדפי הסוללות שלה", text: "ארון ה־UPS מכיל את המיישר, הממיר ומעקף סטטי; התצוגה שלו מראה עומס ומצב סוללות. המדפים מחזיקים את שרשראות הסוללות, עם מאוורר יניקה לאוורור ועמדת שטיפת עיניים ליד הדלת." }
  },
  stops: [
    { title: "מרכז החשמל כולו", text: "אולם הווסתים משמאל, ומימין חדר המתח הגבוה, חדר הגנרטור וחדר ה־UPS. החשמל מגיע לחדר המתח הגבוה, מגובה על ידי הגנרטור וה־UPS, ויוצא דרך הווסתים שבאולם." },
    { title: "שורת הווסתים", text: "וסת אחד לכל מעגל שדה, זה לצד זה לאורך הקיר הצפוני. לכל אחד מפסק משלו בלוח המתח הנמוך וכבל יציאה משלו אל התעלה." },
    { title: "תעלת הכבלים", text: "הכבלים הטוריים יורדים מכל וסת אל התעלה וממשיכים אל מערך הצינורות בחוץ. השאירו את הכיסויים במקומם, והפרידו בין כבלים טוריים לכבלי מתח נמוך ובקרה." },
    { title: "לוח מתח נמוך ראשי", text: "כל מה שבמרכז החשמל מוזן מכאן. לפני עבודה על וסת, פתחו ונעלו את המפסק שלו בלוח הזה." },
    { title: "מפסק העברה ופס הארקה", text: "ה־ATS מכניס את הגנרטור כשהרשת נופלת. לידו, פס ההארקה הראשי מחבר את כל ההארקות של מרכז החשמל ואת ה־counterpoise של השדה." },
    { title: "ארונות ALCMS", text: "הבקרים שמקבלים פקודות מהמגדל ומדווחים על התראות. העברת מעגל לבקרה מקומית כאן היא הצעד הראשון לפני עבודה בשטח." },
    { title: "לוח בטיחות ושולחן עבודה", text: "כפפות, מוט פריקה, מנעולים ותרשימים נמצאים ליד אזור העבודה, וציוד הבדיקה והחלפים על השולחן." },
    { title: "סולם כבלים ומיזוג אוויר", text: "כבלי ההזנה עוברים מעל הראש מהלוח אל כל וסת. מיזוג האוויר מסלק את החום שהווסתים פולטים." },
    { title: "יציאות והגנה מפני אש", text: "שתי יציאות עם ידיות בהלה, תאורת חירום ומטפי CO2 ליד כל דלת." },
    { title: "חדר מתח גבוה", text: "יחידת הטבעת מקבלת את הזנות הרשת ומזינה את השנאי היצוק, שמוריד את המתח ל־400 V עבור מרכז החשמל." },
    { title: "חדר הגנרטור", text: "גנרטור החירום, הפליטה והמשתיק שלו, פתח כניסת האוויר ומיכל הדלק היומי במאצרה." },
    { title: "חדר ה־UPS", text: "ה־UPS והסוללות שלו ממשיכים להזין ללא הפסקה את ה־ALCMS ואת הווסתים של מעגלי השנייה האחת כשהרשת נופלת." }
  ]
};
