/* Course content: light systems, quiz questions, fault scenarios, glossary. */
window.AGL = window.AGL || {};

AGL.LIGHTS = {
  appr: {
    name: "Approach lighting system",
    colour: "var(--l-white)",
    colourText: "White; red side-row barrettes in the inner 270 m (CAT II/III)",
    purpose: "Leads the pilot from final approach onto the extended centreline and gives roll guidance before the runway comes into view.",
    specs: [
      ["Length", "900 m from the threshold for a precision approach"],
      ["Centreline", "Barrettes every 30 m"],
      ["Crossbars", "At 300 m (CAT I); an extra crossbar at 150 m for CAT II/III"],
      ["Inner 300 m", "CAT II/III adds red side rows either side of the centreline"],
      ["Switch-over", "Inner 300 m: 1 s (CAT II/III). Remainder: 15 s"]
    ],
    electrical: "Fed from two or more interleaved circuits so the loss of one leaves a uniform pattern. Elevated lights sit on frangible masts; those inside the runway strip are inset. Sequenced flashers, where fitted, have their own power and timing cabinet.",
    refs: "ICAO Annex 14 Vol I §5.3.4 · FAA AC 150/5340-30 (ALSF-2, MALSR)",
    circuits: "A/B interleaved"
  },
  thr: {
    name: "Runway threshold lights",
    colour: "var(--l-green)",
    colourText: "Green, unidirectional toward the approach",
    purpose: "Marks the start of the runway available for landing.",
    specs: [
      ["Position", "A row across the runway at the threshold, or just outside it"],
      ["Spacing", "≤ 3 m on a precision approach runway"],
      ["Switch-over", "1 s (CAT II/III), 15 s (CAT I)"]
    ],
    electrical: "Threshold and runway end lights are often one bidirectional fixture: green toward the approach, red toward the runway. The two faces can be on different circuits, so a fixture that is half-lit is a clue, not a mystery.",
    refs: "ICAO Annex 14 Vol I §5.3.10",
    circuits: "Single circuit, often shared with the reciprocal end lights"
  },
  edge: {
    name: "Runway edge lights",
    colour: "var(--l-white)",
    colourText: "White; yellow over the last 600 m (caution zone)",
    purpose: "Outline the width and length of the runway.",
    specs: [
      ["Spacing", "≤ 60 m on an instrument runway (≤ 100 m non-instrument)"],
      ["Position", "Along both edges, no more than 3 m outside the runway edge"],
      ["Fixture", "Elevated on frangible couplings; inset where aircraft or vehicles cross"],
      ["Switch-over", "15 s"]
    ],
    electrical: "Usually two interleaved circuits with alternate lights on each. In this view, 'Lose circuit A' shows why: the runway stays outlined, just at twice the spacing.",
    refs: "ICAO Annex 14 Vol I §5.3.9",
    circuits: "A/B interleaved"
  },
  rcl: {
    name: "Runway centreline lights",
    colour: "var(--l-white)",
    colourText: "White; alternate red/white from 900 m to 300 m before the end; red over the last 300 m",
    purpose: "Guidance along the centre of the runway during the landing roll and take-off in low visibility. The colour code tells the pilot how much runway is left.",
    specs: [
      ["Spacing", "15 m (30 m permitted for some CAT I operations)"],
      ["Fixture", "Inset, offset slightly from the painted centreline"],
      ["Required", "CAT II/III and low-visibility take-off"],
      ["Switch-over", "1 s"]
    ],
    electrical: "Inset fixtures in L-868 bases with the transformer in the base. Two interleaved circuits. Inset fixtures carry aircraft loads: check bolt torque and seals on every visit, and never run halogen inset lights outside their bases, where they overheat.",
    refs: "ICAO Annex 14 Vol I §5.3.12",
    circuits: "A/B interleaved"
  },
  tdz: {
    name: "Touchdown zone lights",
    colour: "var(--l-white)",
    colourText: "White barrettes",
    purpose: "Show the pilot the touchdown area: a lit 'carpet' over the first 900 m.",
    specs: [
      ["Extent", "From the threshold for 900 m"],
      ["Pattern", "Pairs of barrettes either side of the centreline"],
      ["Spacing", "30 m or 60 m longitudinally"],
      ["Switch-over", "1 s"]
    ],
    electrical: "Each barrette is several inset lights, each on its own transformer. Typically on dedicated interleaved circuits; a high-density inset load, so check voltage at step 5.",
    refs: "ICAO Annex 14 Vol I §5.3.13",
    circuits: "A/B interleaved"
  },
  end: {
    name: "Runway end lights",
    colour: "var(--l-red)",
    colourText: "Red, unidirectional toward the runway",
    purpose: "Marks the end of the runway available for take-off and landing.",
    specs: [
      ["Quantity", "At least six lights across the runway end"],
      ["Switch-over", "1 s (CAT II/III), 15 s (CAT I)"]
    ],
    electrical: "Often the red face of a bidirectional threshold/end fixture serving the opposite runway direction.",
    refs: "ICAO Annex 14 Vol I §5.3.11",
    circuits: "Single circuit"
  },
  papi: {
    name: "PAPI",
    colour: "var(--l-red)",
    colourText: "Each unit shows red below its setting angle and white above it",
    purpose: "Precision Approach Path Indicator. Four units beside the runway show the pilot whether they are on, above or below the glide path.",
    specs: [
      ["Position", "Left of the runway, near the aiming point"],
      ["On slope", "Two red (nearest the runway) and two white"],
      ["Unit settings", "For a 3° slope: 3°30′, 3°10′, 2°50′, 2°30′ from the runway outward"],
      ["Switch-over", "15 s"]
    ],
    electrical: "Usually fed from its own circuit. Each unit holds two or three lamps. Many designs include a tilt switch that turns the system off if a unit is knocked out of alignment. Re-check aiming after any work on a unit.",
    refs: "ICAO Annex 14 Vol I §5.3.5 · FAA AC 150/5345-28",
    circuits: "Single circuit",
    papi: true
  },
  twyedge: {
    name: "Taxiway edge lights",
    colour: "var(--l-blue)",
    colourText: "Blue, omnidirectional",
    purpose: "Outline the edges of taxiways and aprons.",
    specs: [
      ["Spacing", "≤ 60 m on straight sections, closer on curves"],
      ["Fixture", "Elevated, frangible; low wattage"]
    ],
    electrical: "One circuit often covers a large area, so a single taxiway circuit can be long. 3-step regulators (4.8, 5.5, 6.6 A) are common. Low lamp wattage means small transformers (10/15 W or 20/25 W) with lower efficiency.",
    refs: "ICAO Annex 14 Vol I §5.3.18",
    circuits: "Single circuit"
  },
  twycl: {
    name: "Taxiway centreline lights",
    colour: "var(--l-green)",
    colourText: "Green; alternating green/yellow from the runway to the edge of the ILS sensitive area or runway strip",
    purpose: "Continuous guidance along the taxi route. The green/yellow section warns that the aircraft is inside the runway or ILS protected area.",
    specs: [
      ["Spacing", "≤ 15 m on straight sections for low-visibility operations; closer on curves"],
      ["Fixture", "Inset, bi- or unidirectional"]
    ],
    electrical: "For surface movement guidance (SMGCS), route segments are switched individually: 'follow the greens'. This uses addressable switching on the series circuit or many small circuits.",
    refs: "ICAO Annex 14 Vol I §5.3.17",
    circuits: "Segment switched"
  },
  stopbar: {
    name: "Stop bar",
    colour: "var(--l-red)",
    colourText: "Red, unidirectional toward approaching aircraft",
    purpose: "A row of red lights across the taxiway at the runway-holding position. A lit stop bar means stop; ATC switches it off to give clearance.",
    specs: [
      ["Spacing", "3 m across the taxiway, plus elevated lights at each end"],
      ["Required", "Where operations are conducted below 550 m RVR"],
      ["Switch-over", "1 s"]
    ],
    electrical: "Switched individually through the ALCMS. Interlocked with the lead-on centreline: when the stop bar goes off, the first segment of green beyond it comes on, and the bar re-lights automatically after the aircraft passes.",
    refs: "ICAO Annex 14 Vol I §5.3.20",
    circuits: "Individually switched"
  },
  rgl: {
    name: "Runway guard lights",
    colour: "var(--l-yellow)",
    colourText: "Yellow, flashing alternately",
    purpose: "Warn pilots and drivers that they are about to enter an active runway.",
    specs: [
      ["Configuration A", "A pair of elevated lights each side of the taxiway"],
      ["Configuration B", "A row of inset lights across the taxiway"],
      ["Flash rate", "30 to 60 flashes per minute per light, alternating"]
    ],
    electrical: "A flasher unit, in the fixture or a separate box, is powered from the series circuit through its own transformer. Treat the flasher as part of the load in sizing calculations.",
    refs: "ICAO Annex 14 Vol I §5.3.23",
    circuits: "Taxiway circuit or dedicated"
  },
  signs: {
    name: "Guidance signs",
    colour: "var(--sign-red)",
    colourText: "Mandatory: white on red. Location: yellow on black. Direction: black on yellow",
    purpose: "Tell pilots where they are, where to go and where they must stop. The sign at this holding position reads '09-27' (mandatory) next to 'A' (location).",
    specs: [
      ["Mandatory instruction", "Runway designators, holding positions, no entry"],
      ["Location", "The taxiway the aircraft is on"],
      ["Lighting", "Internally lit for night and low-visibility use"]
    ],
    electrical: "Internally lit signs draw from the series circuit through one or more transformers and an internal power supply. A multi-module sign is a significant load: include it in the CCR calculation.",
    refs: "ICAO Annex 14 Vol I §5.4 · FAA AC 150/5345-44",
    circuits: "Taxiway circuit"
  }
};

AGL.SCENARIOS = [
  {
    id: "open",
    title: "CCR trips at dusk",
    brief: "At evening switch-on, the runway edge circuit B CCR shows 'OPEN CIRCUIT' and trips. Circuit A is lit. Reset trips again within seconds.",
    steps: [
      {
        q: "What is your first action?",
        options: [
          { t: "Reset the CCR a few more times; it may hold.", ok: false, fb: "Each reset drives the CCR toward full voltage into a break. That stresses insulation and risks an arc at the fault. The protection is telling you the loop is open." },
          { t: "Report the outage to ATC, isolate and lock out the CCR, open the series cutout and prove dead.", ok: true, fb: "Right. Operations need to know the runway edge is at half density, and nothing gets tested until the circuit is isolated." },
          { t: "Drive the runway to look for an unlit light.", ok: false, fb: "With an open loop every light on circuit B is out, so a drive tells you nothing about where the break is." }
        ]
      },
      {
        q: "Continuity across the circuit at the cutout reads open (OL). What next?",
        options: [
          { t: "Replace the CCR.", ok: false, fb: "The CCR correctly detected an open loop. The fault is in the field." },
          { t: "Split the loop at a pit near the middle and test continuity each way back to the vault.", ok: true, fb: "Right. Sectionalising halves the search each time. Six splits narrow a 64-pit circuit to one pit." },
          { t: "Megger the circuit at 5 kV.", ok: false, fb: "An insulation test checks for a path to earth, not continuity. On an open circuit it will not find the break." }
        ]
      },
      {
        q: "You narrow it to the section between two light bases. Inside one base the L-823 connector has pulled apart and is full of water. How do you finish?",
        options: [
          { t: "Push the connector back together and re-energise.", ok: false, fb: "A wet connector will become an earth fault next. Dry, replace and seal it." },
          { t: "Replace the connector kit, seal with heat-shrink, megger the whole circuit, then restore and confirm current at every step.", ok: true, fb: "Right. Repair, prove insulation, then prove the circuit works at each step before you hand it back." },
          { t: "Tape the joint and plan a proper repair later.", ok: false, fb: "Taped joints in light bases fill with water and fail again." }
        ]
      }
    ]
  },
  {
    id: "insul",
    title: "Insulation falling after rain",
    brief: "The insulation monitor on taxiway circuit 7 has dropped from 450 MΩ last month to 6 MΩ after two days of rain. All lights work.",
    steps: [
      {
        q: "How urgent is this?",
        options: [
          { t: "Not urgent: all lights work.", ok: false, fb: "A single earth fault causes no visible symptom. A second one can bypass part of the circuit. Low insulation is the early warning." },
          { t: "Plan an investigation soon and watch the trend daily.", ok: true, fb: "Right. 6 MΩ is low but not yet a failure. A trend that keeps falling, or a reading below about 1 MΩ, makes it urgent." },
          { t: "Shut the circuit down immediately.", ok: false, fb: "The circuit is still working and the taxiway may need it. Investigate in a planned outage unless the reading collapses." }
        ]
      },
      {
        q: "How do you find the weak section?",
        options: [
          { t: "Isolate the circuit, split it at a mid-point pit, and megger each half.", ok: true, fb: "Right. The low half carries the fault. Keep splitting. Discharge the cable after every test." },
          { t: "Replace every connector on the circuit.", ok: false, fb: "That is expensive and introduces new workmanship risk. Find the fault first." },
          { t: "Use a continuity tester.", ok: false, fb: "The conductor is intact. You are looking for leakage to earth, which needs an insulation tester." }
        ]
      },
      {
        q: "The low section has four light bases. Two are flooded. What is the lasting fix?",
        options: [
          { t: "Pump them out.", ok: false, fb: "The water will be back with the next rain." },
          { t: "Dry and replace the affected connectors and transformer leads, then fix the base drainage or seals that let the water in.", ok: true, fb: "Right. Repair the insulation and remove the cause." }
        ]
      }
    ]
  },
  {
    id: "double",
    title: "A dark block of edge lights",
    brief: "Five consecutive taxiway edge lights are very dim or out. Every other light on the circuit is normal and the CCR reads 6.6 A at step 5. The lamps are not failed.",
    steps: [
      {
        q: "What does this pattern suggest?",
        options: [
          { t: "An open circuit.", ok: false, fb: "An open circuit would trip the CCR and put out every light on the loop." },
          { t: "Two earth faults, one each side of the dark block, letting current bypass that section through the ground.", ok: true, fb: "Right. The CCR still holds 6.6 A, but most of it flows through the earth path between the two faults, so the lights between them starve. Try it in the series circuit simulator." },
          { t: "Five lamps failed at once.", ok: false, fb: "Possible but very unlikely, and the brief says the lamps are good." }
        ]
      },
      {
        q: "What does the insulation monitor most likely show?",
        options: [
          { t: "Normal insulation.", ok: false, fb: "Two solid earth faults mean very low insulation resistance, often near zero." },
          { t: "Very low insulation resistance.", ok: true, fb: "Right. This is the classic consequence of ignoring a single earth fault until a second one appears." }
        ]
      },
      {
        q: "How do you locate both faults?",
        options: [
          { t: "Isolate, then megger by section around the dark block; the faults are usually in the pits at either end of it.", ok: true, fb: "Right. The dark block tells you where to start. Repair both faults and trend the insulation afterwards." },
          { t: "Swap the CCR for a bigger one.", ok: false, fb: "The CCR is regulating correctly. More capacity will not stop current bypassing through the earth." }
        ]
      }
    ]
  }
];

AGL.QUIZ = [
  { aud: "all", q: "Why does AGL use series circuits instead of parallel feeds?", o: ["Series circuits need less cable", "Every light carries the same current, so intensity is uniform along the circuit", "Series circuits need no transformers", "Lamps last longer at a constant voltage"], a: 1, x: "Voltage drop along a long parallel feed would make distant lights dimmer. With one regulated current through every light, intensity is the same everywhere." },
  { aud: "elec", q: "What is the full-brightness (B5) current of a standard 6.6 A, 5-step circuit?", o: ["2.8 A", "5.2 A", "6.6 A", "20 A"], a: 2, x: "The 5-step currents are 2.8, 3.4, 4.1, 5.2 and 6.6 A. 20 A circuits exist in older installations." },
  { aud: "elec", q: "A lamp fails open. What happens to the rest of the circuit?", o: ["All lights go out", "The other lights stay lit; the CCR holds the current and its output voltage changes slightly", "The CCR trips on overcurrent", "The other lamps get brighter"], a: 1, x: "The isolation transformer keeps the primary loop closed. With an open secondary it saturates, adding reactive load, and the CCR keeps current constant." },
  { aud: "all", q: "What colour are taxiway edge lights?", o: ["Green", "Yellow", "Blue", "White"], a: 2, x: "Taxiway edges are blue; taxiway centrelines are green (green/yellow near the runway)." },
  { aud: "all", q: "Runway centreline lights over the last 300 m of the runway are:", o: ["White", "Red", "Alternating red and white", "Yellow"], a: 1, x: "White, then alternating red/white from 900 m to 300 m from the end, then red for the last 300 m." },
  { aud: "des", q: "On an instrument runway, runway edge lights over the last 600 m are:", o: ["Red", "Yellow", "Green", "White, like the rest"], a: 1, x: "The last 600 m (or one third of the runway, whichever is less) is a yellow caution zone." },
  { aud: "des", q: "Maximum secondary power switch-over time for runway centreline lights on a CAT II/III runway?", o: ["1 s", "15 s", "30 s", "2 min"], a: 0, x: "Centreline, TDZ, threshold, end, stop bars and the inner 300 m of approach lights need 1 s on CAT II/III runways." },
  { aud: "des", q: "Why are runway edge lights fed from two interleaved circuits?", o: ["To halve cable cost", "So one circuit failure leaves a uniform pattern at half density rather than a dark gap", "To allow two colours", "Because CCRs cannot exceed 30 lights"], a: 1, x: "Alternating lights between two circuits keeps the runway outlined if one circuit, CCR or cable fails." },
  { aud: "elec", q: "Why must you never open a primary connector on an energised series circuit?", o: ["It drops the current to zero safely", "The CCR drives up to its full output voltage, several kV, across the break until it trips", "It blows the CCR fuse", "It is only a problem with LED fixtures"], a: 1, x: "A CCR does whatever it takes to keep current flowing. Across an open break that means kilovolts and an arc." },
  { aud: "eng", q: "A block of lights between two pits is dim, the rest are normal, and the CCR reads 6.6 A. Most likely cause?", o: ["Open circuit", "Wrong brightness step", "Two earth faults bypassing that section", "CCR undersized"], a: 2, x: "Current takes the earth path between the faults and the lights between them starve. Check the insulation reading." },
  { aud: "elec", q: "Before an insulation resistance test of a series circuit you must:", o: ["Leave the CCR on step 1", "Isolate the CCR, open the series cutout, lock out and prove dead", "Remove every lamp", "Short the circuit to earth during the test"], a: 1, x: "The test is done on a dead, isolated circuit. Discharge the cable afterwards." },
  { aud: "eng", q: "A circuit load is 9.5 kVA. With 20 % spare capacity, the smallest standard CCR is:", o: ["7.5 kVA", "10 kVA", "15 kVA", "30 kVA"], a: 2, x: "9.5 × 1.2 = 11.4 kVA, so the next standard size up is 15 kVA." },
  { aud: "eng", q: "About what is the maximum output voltage of a 20 kVA, 6.6 A CCR?", o: ["400 V", "1 000 V", "3 000 V", "20 000 V"], a: 2, x: "20 000 VA ÷ 6.6 A ≈ 3 030 V." },
  { aud: "all", q: "A pilot on the correct glide path sees the PAPI as:", o: ["Four white", "Four red", "Two red nearest the runway, two white", "Two white nearest the runway, two red"], a: 2, x: "On slope: two red (nearest the runway) and two white. More white means high, more red means low." },
  { aud: "eng", q: "Why measure CCR output current with a true-RMS meter?", o: ["It is more robust", "Thyristor CCR output is not sinusoidal, especially at low steps", "It reads DC as well", "It is required for LED fixtures only"], a: 1, x: "Phase-controlled output is a chopped waveform. Average-responding meters misread it." },
  { aud: "des", q: "Stop bars are required where operations are conducted at RVR below:", o: ["1 500 m", "800 m", "550 m", "50 m"], a: 2, x: "ICAO requires stop bars at runway-holding positions serving a runway used below 550 m RVR." },
  { aud: "eng", q: "The main purpose of the series isolation transformer is to:", o: ["Step up the voltage for the lamp", "Keep the loop closed if a lamp fails and isolate the lamp from the primary", "Regulate current", "Filter harmonics"], a: 1, x: "It keeps the series loop intact and gives a separated low-voltage secondary for the lamp." },
  { aud: "des", q: "The standby generator takes about 10 s to accept load. How is a 1 s switch-over met for CAT II/III runway centreline lights?", o: ["A bigger generator", "Feed the critical CCRs from a UPS no-break bus or a continuously running source", "Run the CCR on step B1", "It cannot be met"], a: 1, x: "No generator starts within 1 s. The 1 s circuits run from a UPS, or from a source already running during low-visibility operations." },
  { aud: "elec", q: "Before working on a field circuit, what stops the tower from switching its CCR on?", o: ["Closing the series cutout", "Switching the circuit to local control at the vault, then isolating and locking its input breaker", "Switching off the UPS", "Asking the controller verbally"], a: 1, x: "In local control the tower and ALCMS cannot command the CCR, and the lock and tag keep it off." },
  { aud: "des", q: "What does individual lamp monitoring give you that CCR lamp-out detection cannot?", o: ["Lower cost", "The location of each failed light, so the 'no two adjacent failures' rule can be checked", "Brighter lights", "Faster switch-over"], a: 1, x: "CCR detection estimates how many lamps are out from load changes. Only per-lamp monitoring tells you which ones." }
];

AGL.GLOSSARY = [
  ["AGL", "Airfield Ground Lighting: all lights, signs and associated power and control equipment on the movement area."],
  ["ALCMS", "Airfield Lighting Control and Monitoring System. Operator interface, PLCs and communications that switch circuits and report alarms."],
  ["ALS", "Approach Lighting System, the pattern of lights extending from the threshold into the approach area."],
  ["Barrette", "Three or more lights closely spaced in a transverse line, so they read as a short bar of light."],
  ["Brightness step (B1–B5)", "A selectable output current of the CCR, each giving a defined light intensity."],
  ["CCR", "Constant Current Regulator. Supplies a series circuit with a regulated current regardless of load."],
  ["Counterpoise", "Bare copper conductor buried above the AGL cable or duct and bonded to light bases to divert lightning currents."],
  ["Crossbar", "A transverse row of approach lights at a set distance from the threshold, giving a horizon reference."],
  ["Earth fault", "An unintended connection between the circuit and earth. One causes no symptom; two can bypass a section."],
  ["Elevated light", "A fixture standing above ground on a frangible coupling, used where aircraft do not run over it."],
  ["Frangible", "Designed to break away on impact so that it does not damage an aircraft."],
  ["ILCMS", "Individual Lamp Control and Monitoring System. Addressable modules at each fixture that report its status and switch it."],
  ["Inset light", "A fixture installed flush with the pavement, built to take aircraft wheel loads."],
  ["Insulation resistance", "Resistance between the circuit conductor and earth, measured with an insulation tester (megger)."],
  ["Interleaving", "Feeding alternate lights of one system from two circuits so one failure leaves a uniform pattern."],
  ["IRMS", "Insulation Resistance Monitoring System, built into or added to a CCR, that measures circuit insulation continuously."],
  ["Isolation transformer", "Series transformer, one per light, that keeps the loop closed and isolates the lamp from the primary."],
  ["L-823", "FAA specification for primary and secondary cable connectors used in AGL."],
  ["L-824", "FAA specification for underground 5 kV airfield lighting cable."],
  ["L-828 / L-829", "FAA specifications for constant current regulators; L-829 adds monitoring."],
  ["L-830", "FAA specification for series isolation transformers."],
  ["L-867 / L-868", "FAA specifications for light bases: L-867 non-load-bearing, L-868 load-bearing."],
  ["LOTO", "Lockout/tagout: isolating and locking equipment so it cannot be energised during work."],
  ["PAPI", "Precision Approach Path Indicator. Four light units showing red or white to indicate glide-path position."],
  ["Primary circuit", "The high-voltage series loop from the CCR through every transformer primary."],
  ["RGL", "Runway Guard Lights. Alternately flashing yellow lights that warn of an active runway ahead."],
  ["RVR", "Runway Visual Range: the distance a pilot on the centreline can see runway lights or markings."],
  ["Secondary circuit", "The low-voltage circuit between a transformer's secondary winding and its lamp."],
  ["Secondary power", "Standby supply (generator, UPS or second feeder) that takes over when the main supply fails."],
  ["Series cutout", "A disconnect between the CCR and the field circuit, used to isolate the circuit (S-1 cutout in FAA terms)."],
  ["SMGCS / A-SMGCS", "(Advanced) Surface Movement Guidance and Control System: procedures and equipment, including switched centreline lights, that guide traffic on the ground."],
  ["Stop bar", "A row of red inset lights across a taxiway, switched by ATC to control entry to the runway."],
  ["Switch-over time", "The maximum time for a light to recover after a failure of the normal power supply."],
  ["TDZ", "Touchdown Zone lights: white barrettes over the first 900 m of a CAT II/III runway."],
  ["Thyristor", "Semiconductor switch (SCR) used for phase-controlled power regulation in many CCRs."],
  ["True RMS", "A meter that measures the real heating value of any waveform, needed for chopped CCR outputs."],
  ["Vault", "The AGL substation: the building that holds the incoming supplies, generator, UPS, CCRs and ALCMS equipment."],
  ["ATS", "Automatic transfer switch. Detects mains failure, starts the generator and moves the essential bus onto it once it is stable."],
  ["UPS", "Uninterruptible power supply. Battery-backed no-break supply for control equipment and for CCRs feeding 1 s switch-over circuits."]
];
