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
