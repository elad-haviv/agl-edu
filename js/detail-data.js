/* Module E content: part names, bubble text, descriptions and key facts for the 3D details.
   Values are typical; follow the project specification and the manufacturer's data. */
window.AGL = window.AGL || {};
AGL.HE = AGL.HE || {};

AGL.DETAIL = {
  models: {
    elevated: "Elevated light on an L-867 base",
    inset: "In-pavement light on an L-868 base"
  },
  intro: {
    elevated: "An elevated edge light on a non-load-bearing base, set in soil with a concrete collar. The cutaway removes one quarter of the ground, collar and base so you can see the transformer and connectors inside.",
    inset: "An inset light on a load-bearing base, encased in concrete within the pavement. The fixture sits nearly flush with the surface and carries aircraft wheel loads."
  },
  parts: {
    fixture: {
      name: "Light fixture",
      short: "Lens, lamp and housing, a few hundred mm above grade",
      text: "The optical head: a ribbed glass or plastic lens over a halogen lamp or LED engine, in a painted housing. Its colour filter and photometric class set what the pilot sees. The head can be replaced without disturbing the base.",
      specs: [["Height", "Edge lights typically no more than about 350 mm (14 in) above grade"], ["Source", "Halogen lamp or LED engine"], ["Standards", "FAA AC 150/5345-46 (L-861, L-862); ICAO Annex 14 §5.3"]]
    },
    stem: {
      name: "Mounting column",
      short: "Tube that sets the light height; carries the lead",
      text: "A short steel or aluminium column between the frangible coupling and the light head. The secondary lead runs up inside it. Its length sets the light height, which is chosen to clear snow-plough blades and stay below the height limit.",
      specs: [["Typical", "2 in (51 mm) EMT or aluminium tube"], ["Inside", "Fixture lead to the lamp"]]
    },
    coupling: {
      name: "Frangible coupling",
      short: "Snaps at its groove if an aircraft strikes the light",
      text: "A threaded coupling with a machined groove. It is designed to break cleanly at the groove when struck, so the light breaks away instead of damaging an aircraft, while staying strong enough for jet blast and wind. Never replace it with a solid pipe nipple.",
      specs: [["Break point", "Machined groove just above the base plate"], ["Requirement", "Frangibility per ICAO Aerodrome Design Manual Part 6 and FAA AC 150/5345-46"]]
    },
    plate: {
      name: "Base plate",
      short: "Bolted cover with a threaded hub for the coupling",
      text: "A steel cover plate closes the light base and carries the light. Six bolts clamp it to the base flange over a gasket. A threaded hub in the centre takes the frangible coupling, and the fixture lead passes through it.",
      specs: [["Bolts", "6 stainless bolts, tightened evenly"], ["Hub", "2 in threaded, typical"], ["Bonding", "Metal-to-metal contact with the base, or a bonding jumper"]]
    },
    gasket: {
      name: "Gasket",
      short: "Seals the cover plate to the base flange",
      text: "A neoprene gasket between the flange and the cover plate keeps water out of the base. Replace it whenever the plate is removed and the gasket is torn or permanently compressed.",
      specs: [["Material", "Neoprene or closed-cell rubber"]]
    },
    can: {
      name: "Light base (L-867)",
      short: "Steel can that houses the transformer and connectors",
      text: "A galvanised steel or composite cylinder set in the ground. It keeps the transformer and connectors dry and accessible and provides the mount for the light. Conduit hubs on the side take the ducts, and a ground lug on the outside bonds it to the counterpoise.",
      specs: [["Type", "FAA L-867, non-load-bearing (shoulders, infield)"], ["Size", "12 in (305 mm) diameter × 24 in (610 mm) deep, typical"], ["Fittings", "2 in conduit hubs, external ground lug"]]
    },
    transformer: {
      name: "Isolation transformer (L-830)",
      short: "Couples the lamp to the 6.6 A series loop",
      text: "The series isolation transformer has its primary in the field loop and its secondary feeding the lamp. It keeps the loop closed if the lamp fails and isolates the lamp from the high-voltage primary. It is fully encapsulated in rubber and sits on the floor of the base.",
      specs: [["Rating", "Matched to the lamp, e.g. 6.6/6.6 A, 30/45 W or 100 W"], ["Standards", "FAA L-830 (AC 150/5345-47), IEC 61823"], ["Leads", "Two primary leads with L-823 connectors, one secondary lead"]]
    },
    connectors: {
      name: "Primary connectors (L-823)",
      short: "Plug and receptacle joints sealed with heat-shrink",
      text: "Each field cable end carries an L-823 plug or receptacle that mates with a transformer primary lead. The mated joint is covered with heat-shrink tubing to keep water out. Badly made connectors are the most common source of earth faults.",
      specs: [["Rating", "5 kV, for 6.6 A series circuits"], ["Standard", "FAA L-823 (AC 150/5345-26)"], ["Seal", "Heat-shrink sleeve or tape over the mated joint"]]
    },
    secondary: {
      name: "Secondary lead and connector",
      short: "Low-voltage lead from the transformer to the lamp",
      text: "The transformer's secondary lead ends in a two-pin connector that mates with the lead from the light fixture. The circuit is low voltage while the lamp is in place, but an open secondary on a live loop carries high peak voltages, so isolate before unplugging it.",
      specs: [["Connector", "Two-pin L-823 secondary connector"], ["Safety", "Isolate the loop before opening the secondary"]]
    },
    cables: {
      name: "Primary cable (L-824)",
      short: "5 kV series cable looping in and out of each base",
      text: "Single-core 5 kV cable carries the series current from light to light. It enters the base through one conduit, connects to the transformer and leaves through the other. A slack loop in each base lets the connectors be lifted out for work.",
      specs: [["Type", "FAA L-824, 5 kV, 8 AWG (8.4 mm²) copper, typical"], ["Current", "6.6 A series, brightness steps 2.8–6.6 A"]]
    },
    conduits: {
      name: "Conduits (ducts)",
      short: "PVC ducts that protect the cable between bases",
      text: "Rigid PVC or HDPE ducts protect the primary cable and allow it to be pulled in and replaced. They join the base at threaded hubs and are laid to fall away from the base, so water drains out rather than in.",
      specs: [["Size", "2 in (50 mm), typical"], ["Cover", "Per project specification, below frost depth"]]
    },
    counterpoise: {
      name: "Counterpoise and bonding jumper",
      short: "Bare copper that diverts lightning; bonded to the base",
      text: "A bare copper conductor laid in the trench above the ducts and routed around each base. A jumper from the base's ground lug bonds the base to it, so lightning current travels in the counterpoise rather than through the cable insulation.",
      specs: [["Conductor", "6 AWG bare copper, typical"], ["Position", "Above the ducts, centred over the cables"], ["Joints", "Exothermic weld or listed clamp"]]
    },
    groundrod: {
      name: "Ground rod",
      short: "Driven rod that ties the counterpoise to earth",
      text: "A copper-clad steel rod driven beside the base, or at intervals along the circuit, and welded to the counterpoise. It gives lightning current a low-impedance path into the ground.",
      specs: [["Typical", "5/8 in × 8 ft (16 mm × 2.4 m) copper-clad steel"], ["Joint", "Exothermic weld to the counterpoise"]]
    },
    collar: {
      name: "Concrete collar",
      short: "Holds the base level and resists frost heave",
      text: "Concrete placed around the top of the base fixes it at the right height and level, resists frost heave and protects it from mowers. Its top slopes away from the cover so water runs off.",
      specs: [["Typical", "About 600 mm diameter, top at finished grade"]]
    },
    soil: {
      name: "Ground",
      short: "Compacted backfill and topsoil around the base",
      text: "Backfill around the base is compacted in layers so the base does not settle or tilt. Finished grade is level with the edge of the collar, so mowers and vehicles can pass without striking the base.",
      specs: [["Layers", "Topsoil over compacted subsoil backfill"]]
    },
    insetfix: {
      name: "In-pavement light fixture",
      short: "Low-profile fixture that aircraft wheels roll over",
      text: "A cast, load-bearing fixture with prism windows that throw the beam along the runway or taxiway. It sits nearly flush with the pavement and must carry full aircraft wheel loads. Prisms need regular cleaning, because rubber and dirt cut the light output quickly.",
      specs: [["Protrusion", "A few millimetres above the pavement; check the fixture specification"], ["Standards", "FAA AC 150/5345-46 (L-850 series); ICAO Annex 14 §5.3"], ["Beam", "Unidirectional or bidirectional prisms"]]
    },
    bolts: {
      name: "Hold-down bolts",
      short: "Stainless bolts clamping the fixture to the base",
      text: "Six stainless steel bolts clamp the fixture to the base through the spacer ring. They take high cyclic loads from aircraft wheels, so they are tightened to the specified torque with anti-seize compound and checked on a schedule. A loose fixture can be thrown out by a passing wheel.",
      specs: [["Typical", "6 × 3/8 in stainless steel"], ["Torque", "Per manufacturer; check during maintenance"]]
    },
    oring: {
      name: "O-ring",
      short: "Seals the fixture to the base against water",
      text: "An O-ring between the fixture and the spacer ring keeps water out of the base. Replace it whenever the fixture is removed.",
      specs: [["Material", "Synthetic rubber"]]
    },
    spacer: {
      name: "Spacer ring",
      short: "Sets the fixture height to the pavement surface",
      text: "Spacer and extension rings raise the mounting flange so the fixture sits at the right height. They are used at installation and again when the pavement is overlaid, instead of resetting the base.",
      specs: [["Use", "Height adjustment and pavement overlays"]]
    },
    can868: {
      name: "Light base (L-868)",
      short: "Load-bearing base set in the pavement",
      text: "A load-bearing steel base that carries wheel loads into the concrete encasement and houses the transformer and connectors. It is held to line, level and orientation with a setting jig while the concrete is placed.",
      specs: [["Type", "FAA L-868, load-bearing (runways and taxiways)"], ["Size", "12 in (305 mm) diameter, typical; two-piece bases allow height adjustment"]]
    },
    sealant: {
      name: "Joint sealant",
      short: "Flexible seal between fixture and pavement",
      text: "A flexible pavement sealant fills the gap between the fixture and the pavement around it. It keeps water and debris out and takes up movement between the steel base and the pavement.",
      specs: [["Type", "Flexible pavement joint sealant compatible with the pavement"]]
    },
    encasement: {
      name: "Concrete encasement",
      short: "Concrete around the base that carries wheel loads",
      text: "Concrete placed around and under the base locks it to line, level and orientation and spreads aircraft loads into the pavement structure.",
      specs: [["Typical", "High-strength concrete around and under the base"]]
    },
    pavement: {
      name: "Pavement layers",
      short: "Surface course over base course and subgrade",
      text: "An asphalt or concrete surface course over a crushed-stone base course and the subgrade. Inset bases are placed before paving in new pavement, or in core-drilled holes in existing pavement.",
      specs: [["Layers", "Surface course, base course, subgrade"]]
    }
  }
};

AGL.HE.DETAIL = {
  models: {
    elevated: "פנס מוגבה על בסיס L-867",
    inset: "פנס שקוע על בסיס L-868"
  },
  intro: {
    elevated: "פנס שוליים מוגבה על בסיס שאינו נושא עומס, המותקן בקרקע עם צווארון בטון. החתך מסיר רבע מהקרקע, מהצווארון ומהבסיס כדי שתוכלו לראות את השנאי והמחברים שבפנים.",
    inset: "פנס שקוע על בסיס נושא עומס, עטוף בבטון בתוך המסעה. הגוף כמעט בגובה פני המסעה ונושא את עומסי הגלגלים של המטוסים."
  },
  parts: {
    fixture: {
      name: "גוף התאורה",
      short: "עדשה, נורה ובית, כמה מאות מ״מ מעל הקרקע",
      text: "הראש האופטי: עדשה מצולעת מזכוכית או פלסטיק מעל נורת הלוגן או מנוע LED, בתוך בית צבוע. המסנן הצבעוני והסיווג הפוטומטרי קובעים מה הטייס רואה. אפשר להחליף את הראש בלי לגעת בבסיס.",
      specs: [["גובה", "פנסי שוליים בדרך כלל עד כ־350 מ״מ (14 אינץ׳) מעל הקרקע"], ["מקור אור", "נורת הלוגן או מנוע LED"], ["תקנים", "FAA AC 150/5345-46 (L-861, L-862); ICAO Annex 14 §5.3"]]
    },
    stem: {
      name: "עמוד הרכבה",
      short: "צינור שקובע את גובה הפנס ומוביל את המוליך",
      text: "עמוד קצר מפלדה או מאלומיניום בין המחבר השביר לראש הפנס. המוליך המשני עובר בתוכו. אורכו קובע את גובה הפנס, שנבחר כך שיעבור מעל להבי מפלסת השלג ויישאר מתחת למגבלת הגובה.",
      specs: [["טיפוסי", "צינור EMT או אלומיניום 2 אינץ׳ (51 מ״מ)"], ["בתוכו", "מוליך הגוף אל הנורה"]]
    },
    coupling: {
      name: "מחבר שביר",
      short: "נשבר בחריץ אם מטוס פוגע בפנס",
      text: "מחבר מוברג עם חריץ מעובד. הוא מתוכנן להישבר בצורה נקייה בחריץ בעת פגיעה, כך שהפנס מתנתק במקום לפגוע במטוס, ועדיין חזק מספיק לסילון מנועים ולרוח. לעולם אל תחליפו אותו בניפל צינור מלא.",
      specs: [["נקודת שבירה", "חריץ מעובד מעט מעל לוח הבסיס"], ["דרישה", "שבירות לפי ICAO Aerodrome Design Manual חלק 6 ו־FAA AC 150/5345-46"]]
    },
    plate: {
      name: "לוח בסיס",
      short: "מכסה מוברג עם שקע מוברג למחבר",
      text: "לוח כיסוי מפלדה סוגר את בסיס הפנס ונושא את הפנס. שישה ברגים מהדקים אותו לאוגן הבסיס מעל אטם. שקע מוברג במרכז מקבל את המחבר השביר, ומוליך הגוף עובר דרכו.",
      specs: [["ברגים", "6 ברגי נירוסטה, מהודקים באופן אחיד"], ["שקע", "הברגה 2 אינץ׳, טיפוסי"], ["חיבור הארקה", "מגע מתכת־מתכת עם הבסיס, או מגשר הארקה"]]
    },
    gasket: {
      name: "אטם",
      short: "אוטם את הלוח לאוגן הבסיס",
      text: "אטם ניאופרן בין האוגן ללוח הכיסוי מונע כניסת מים לבסיס. החליפו אותו בכל פעם שהלוח מוסר והאטם קרוע או לחוץ לצמיתות.",
      specs: [["חומר", "ניאופרן או גומי בעל תאים סגורים"]]
    },
    can: {
      name: "בסיס פנס (L-867)",
      short: "מיכל פלדה שמכיל את השנאי והמחברים",
      text: "גליל מפלדה מגולוונת או מחומר מרוכב המוטמן בקרקע. הוא שומר על השנאי והמחברים יבשים ונגישים ומשמש תושבת לפנס. שקעי צנרת בצד מקבלים את הצינורות, ונעל הארקה בחוץ מחבר אותו ל־counterpoise.",
      specs: [["סוג", "FAA L-867, לא נושא עומס (שוליים, שטחים פתוחים)"], ["מידות", "קוטר 12 אינץ׳ (305 מ״מ) × עומק 24 אינץ׳ (610 מ״מ), טיפוסי"], ["אביזרים", "שקעי צנרת 2 אינץ׳, נעל הארקה חיצונית"]]
    },
    transformer: {
      name: "שנאי בידוד (L-830)",
      short: "מצמיד את הנורה ללולאה הטורית של 6.6 A",
      text: "הליפוף הראשוני של שנאי הבידוד הטורי מחובר ללולאת השדה, והמשני מזין את הנורה. הוא שומר על הלולאה סגורה אם הנורה נשרפת ומבודד את הנורה מהמעגל הראשוני במתח גבוה. הוא יצוק כולו בגומי ומונח על רצפת הבסיס.",
      specs: [["דירוג", "מותאם לנורה, למשל 6.6/6.6 A, 30/45 W או 100 W"], ["תקנים", "FAA L-830 (AC 150/5345-47), IEC 61823"], ["מוליכים", "שני מוליכים ראשוניים עם מחברי L-823, מוליך משני אחד"]]
    },
    connectors: {
      name: "מחברים ראשוניים (L-823)",
      short: "צמדי תקע־שקע אטומים בשרוול מתכווץ",
      text: "בקצה כל כבל שדה יש תקע או שקע L-823 שמתחבר למוליך ראשוני של השנאי. החיבור מכוסה בשרוול מתכווץ כדי למנוע כניסת מים. מחברים שהורכבו גרוע הם המקור הנפוץ ביותר לקצרים לאדמה.",
      specs: [["דירוג", "5 kV, למעגלים טוריים של 6.6 A"], ["תקן", "FAA L-823 (AC 150/5345-26)"], ["אטימה", "שרוול מתכווץ או סרט מעל החיבור"]]
    },
    secondary: {
      name: "מוליך ומחבר משני",
      short: "מוליך במתח נמוך מהשנאי אל הנורה",
      text: "המוליך המשני של השנאי מסתיים במחבר דו־פיני שמתחבר למוליך שיורד מגוף התאורה. המעגל במתח נמוך כל עוד הנורה במקומה, אבל משני פתוח בלולאה חיה נושא מתחי שיא גבוהים, ולכן נתקו את הלולאה לפני שמנתקים אותו.",
      specs: [["מחבר", "מחבר משני דו־פיני L-823"], ["בטיחות", "נתקו את הלולאה לפני פתיחת המשני"]]
    },
    cables: {
      name: "כבל ראשוני (L-824)",
      short: "כבל טורי 5 kV שנכנס ויוצא מכל בסיס",
      text: "כבל חד־גידי 5 kV מוביל את הזרם הטורי מפנס לפנס. הוא נכנס לבסיס דרך צינור אחד, מתחבר לשנאי ויוצא דרך הצינור השני. לולאת רזרבה בכל בסיס מאפשרת להרים את המחברים החוצה לעבודה.",
      specs: [["סוג", "FAA L-824, 5 kV, נחושת 8 AWG (8.4 מ״מ²), טיפוסי"], ["זרם", "6.6 A טורי, דרגות עוצמה 2.8–6.6 A"]]
    },
    conduits: {
      name: "צנרת",
      short: "צינורות PVC שמגנים על הכבל בין הבסיסים",
      text: "צינורות PVC או HDPE קשיחים מגנים על הכבל הראשוני ומאפשרים להשחיל ולהחליף אותו. הם מתחברים לבסיס בשקעים מוברגים ומונחים בשיפוע הרחק מהבסיס, כך שמים מתנקזים החוצה ולא פנימה.",
      specs: [["קוטר", "2 אינץ׳ (50 מ״מ), טיפוסי"], ["כיסוי", "לפי מפרט הפרויקט, מתחת לעומק הקפיאה"]]
    },
    counterpoise: {
      name: "Counterpoise ומגשר הארקה",
      short: "נחושת חשופה שמסיטה ברקים; מחוברת לבסיס",
      text: "מוליך נחושת חשוף המונח בתעלה מעל הצינורות ועוקף כל בסיס. מגשר מנעל ההארקה של הבסיס מחבר אליו את הבסיס, כך שזרם ברק עובר ב־counterpoise ולא דרך בידוד הכבל.",
      specs: [["מוליך", "נחושת חשופה 6 AWG, טיפוסי"], ["מיקום", "מעל הצינורות, ממורכז מעל הכבלים"], ["חיבורים", "ריתוך תרמי (אקזותרמי) או מהדק מאושר"]]
    },
    groundrod: {
      name: "אלקטרודת הארקה",
      short: "מוט נעוץ שמחבר את ה־counterpoise לאדמה",
      text: "מוט פלדה מצופה נחושת הנעוץ ליד הבסיס, או במרווחים לאורך המעגל, ומרותך ל־counterpoise. הוא נותן לזרם ברק מסלול בעכבה נמוכה אל הקרקע.",
      specs: [["טיפוסי", "פלדה מצופה נחושת 5/8 אינץ׳ × 8 רגל (16 מ״מ × 2.4 מ׳)"], ["חיבור", "ריתוך תרמי ל־counterpoise"]]
    },
    collar: {
      name: "צווארון בטון",
      short: "מחזיק את הבסיס מפולס ומונע הרמה מקפיאה",
      text: "בטון סביב החלק העליון של הבסיס מקבע אותו בגובה ובפילוס הנכונים, מונע הרמה מקפיאה ומגן עליו ממכסחות. החלק העליון משופע הרחק מהמכסה כדי שמים יזרמו החוצה.",
      specs: [["טיפוסי", "קוטר כ־600 מ״מ, החלק העליון בגובה פני הקרקע המוגמרים"]]
    },
    soil: {
      name: "קרקע",
      short: "מילוי מהודק ואדמה עליונה סביב הבסיס",
      text: "המילוי סביב הבסיס מהודק בשכבות כדי שהבסיס לא ישקע או ייטה. פני הקרקע המוגמרים בגובה שפת הצווארון, כך שמכסחות ורכבים עוברים בלי לפגוע בבסיס.",
      specs: [["שכבות", "אדמה עליונה מעל מילוי מהודק"]]
    },
    insetfix: {
      name: "גוף תאורה שקוע",
      short: "גוף נמוך שגלגלי המטוס עוברים מעליו",
      text: "גוף יצוק נושא עומס עם חלונות פריזמה שמטילים את האלומה לאורך המסלול או מסלול ההסעה. הוא כמעט בגובה פני המסעה וחייב לשאת עומסי גלגלים מלאים. הפריזמות דורשות ניקוי סדיר, כי גומי ולכלוך מורידים מהר את עוצמת האור.",
      specs: [["בליטה", "מילימטרים ספורים מעל המסעה; בדקו במפרט הגוף"], ["תקנים", "FAA AC 150/5345-46 (סדרת L-850); ICAO Annex 14 §5.3"], ["אלומה", "פריזמות חד־כיווניות או דו־כיווניות"]]
    },
    bolts: {
      name: "ברגי עיגון",
      short: "ברגי נירוסטה שמהדקים את הגוף לבסיס",
      text: "שישה ברגי נירוסטה מהדקים את הגוף לבסיס דרך טבעת המרווח. הם נושאים עומסים מחזוריים גבוהים מגלגלי המטוסים, ולכן מהודקים למומנט שנקבע עם משחה נגד היתפסות ונבדקים לפי לוח זמנים. גוף רופף עלול להיזרק החוצה על ידי גלגל חולף.",
      specs: [["טיפוסי", "6 ברגי נירוסטה 3/8 אינץ׳"], ["מומנט", "לפי היצרן; בדיקה בזמן תחזוקה"]]
    },
    oring: {
      name: "טבעת O",
      short: "אוטמת את הגוף לבסיס נגד מים",
      text: "טבעת O בין הגוף לטבעת המרווח מונעת כניסת מים לבסיס. החליפו אותה בכל פעם שהגוף מוסר.",
      specs: [["חומר", "גומי סינתטי"]]
    },
    spacer: {
      name: "טבעת מרווח",
      short: "קובעת את גובה הגוף לפני המסעה",
      text: "טבעות מרווח והגבהה מרימות את אוגן ההרכבה כך שהגוף יישב בגובה הנכון. משתמשים בהן בהתקנה ושוב כשמוסיפים שכבת ריבוד למסעה, במקום לכוון מחדש את הבסיס.",
      specs: [["שימוש", "כוונון גובה וריבוד מסעה"]]
    },
    can868: {
      name: "בסיס פנס (L-868)",
      short: "בסיס נושא עומס המותקן בתוך המסעה",
      text: "בסיס פלדה נושא עומס שמעביר את עומסי הגלגלים לעטיפת הבטון ומכיל את השנאי והמחברים. הוא מוחזק בקו, בפילוס ובכיוון הנכונים באמצעות מתקן כיוון בזמן יציקת הבטון.",
      specs: [["סוג", "FAA L-868, נושא עומס (מסלולים ומסלולי הסעה)"], ["מידות", "קוטר 12 אינץ׳ (305 מ״מ), טיפוסי; בסיסים דו־חלקיים מאפשרים כוונון גובה"]]
    },
    sealant: {
      name: "חומר איטום",
      short: "איטום גמיש בין הגוף למסעה",
      text: "חומר איטום גמיש למסעות ממלא את המרווח בין הגוף למסעה שסביבו. הוא מונע כניסת מים ולכלוך ובולע תזוזות בין בסיס הפלדה למסעה.",
      specs: [["סוג", "חומר איטום גמיש לתפרים, תואם לסוג המסעה"]]
    },
    encasement: {
      name: "עטיפת בטון",
      short: "בטון סביב הבסיס שנושא את עומסי הגלגלים",
      text: "בטון שנוצק סביב הבסיס ומתחתיו נועל אותו בקו, בפילוס ובכיוון, ומפזר את עומסי המטוסים אל מבנה המסעה.",
      specs: [["טיפוסי", "בטון בחוזק גבוה סביב הבסיס ומתחתיו"]]
    },
    pavement: {
      name: "שכבות המסעה",
      short: "שכבה עליונה מעל שכבת מצע ותשתית",
      text: "שכבה עליונה מאספלט או מבטון מעל שכבת מצע מאבן גרוסה ומעל התשתית. בסיסים שקועים מוצבים לפני הסלילה במסעה חדשה, או בחורים קדוחים במסעה קיימת.",
      specs: [["שכבות", "שכבה עליונה, מצע, תשתית"]]
    }
  }
};
