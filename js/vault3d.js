/* Module F: 3D vault tour. The building and its equipment are built from solids in millimetres
   (x east, y up, z south; the CCR hall's north-west corner at the origin), drawn with d3 as SVG
   polygons using the module E engine. Walls facing the camera drop to waist height so the rooms
   stay visible, like a cutaway model. */
(function () {
  const TAU = Math.PI * 2;

  /* ---------- Box with outward normals (culled when facing away) and subdivided faces ---------- */
  function blk(F, x0, x1, y0, y1, z0, z1, c, o) {
    o = o || {};
    const step = o.step || 900;
    const cols = o.cols || {};
    const skip = o.skip || [];
    const grid = (a, b, cc, d, n, col) => {
      const nu = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / step));
      const nv = Math.max(1, Math.ceil(Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]) / step));
      const L = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const P = (u, v) => L(L(a, b, u), L(d, cc, u), v);
        F.push({ p: [P(i / nu, j / nv), P((i + 1) / nu, j / nv), P((i + 1) / nu, (j + 1) / nv), P(i / nu, (j + 1) / nv)], c: col, n, op: o.op, layer: o.layer });
      }
    };
    const f = {
      top: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0]],
      bottom: [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0], [0, -1, 0]],
      south: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]],
      north: [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]],
      east: [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]],
      west: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]]
    };
    Object.keys(f).forEach(k => {
      if (skip.includes(k)) return;
      const [a, b, cc, d, n] = f[k];
      grid(a, b, cc, d, n, cols[k] || c);
    });
  }

  // Panel on a face: a thin box standing proud of the surface, facing direction `dir`
  function panel(F, dir, at, u0, u1, v0, v1, depth, c, o) {
    // at: plane coordinate of the face; (u, v) are along the face; v is always height
    const d = depth;
    if (dir === "south") blk(F, u0, u1, v0, v1, at, at + d, c, o);
    if (dir === "north") blk(F, u0, u1, v0, v1, at - d, at, c, o);
    if (dir === "east") blk(F, at, at + d, v0, v1, u0, u1, c, o);
    if (dir === "west") blk(F, at - d, at, v0, v1, u0, u1, c, o);
  }

  /* ---------- The building ---------- */
  const W = 16000, D = 8000, HT = 3500, CUT = 1100, INNER = 1700, T = 200;
  const COL = {
    floorHall: "#c4c9cc", floorSide: "#b7bcbf", wall: "#e3e1dc", wallTop: "#a7a39b", wallIn: "#d6d3cc",
    cab: "#c9cfd4", cabDoor: "#d6dbdf", plinth: "#2a2e32", dark: "#24292e", screen: "#163b2a", screenLit: "#7cf2a0",
    chrome: "#dfe3e6", white: "#f4f5f2", red: "#c8102e", green: "#2e8b57", amber: "#f2a93b", yellow: "#f2c200",
    copper: "#c97c3c", galv: "#b9c1c6", cable: "#2b2f33", black: "#16191c", wood: "#b08655", blue: "#1d6fb8",
    rmu: "#7f9a88", resin: "#55667f", core: "#3d4348", gen: "#5d6a73", alt: "#2f4f6f", radiator: "#22272b",
    tank: "#8a8f86", batt: "#262a2e", concrete: "#a9a59b", lens: "#9fb6c7"
  };

  // A wall run along x (north or south side) or z (east or west side), with door openings
  function wallRun(F, axis, fixed0, fixed1, from, to, h, doors, face) {
    const cuts = [from, ...doors.flatMap(d => [d[0], d[1]]), to];
    for (let i = 0; i < cuts.length; i += 2) {
      const a = cuts[i], b = cuts[i + 1];
      if (b - a < 1) continue;
      if (axis === "x") blk(F, a, b, 0, h, fixed0, fixed1, COL.wall, { cols: { top: COL.wallTop, [face]: COL.wallIn }, step: 1100 });
      else blk(F, fixed0, fixed1, 0, h, a, b, COL.wall, { cols: { top: COL.wallTop, [face]: COL.wallIn }, step: 1100 });
    }
    doors.forEach(([a, b, kind]) => {
      const dh = Math.min(h, 2100);
      // lintel above the opening
      if (h > 2100) {
        if (axis === "x") blk(F, a, b, 2100, h, fixed0, fixed1, COL.wall, { cols: { top: COL.wallTop, [face]: COL.wallIn } });
        else blk(F, fixed0, fixed1, 2100, h, a, b, COL.wall, { cols: { top: COL.wallTop, [face]: COL.wallIn } });
      }
      if (kind === "open") return;
      // door leaf set into the opening, with a panic bar on the inside face
      const mid = (fixed0 + fixed1) / 2;
      if (axis === "x") {
        blk(F, a + 20, b - 20, 0, dh, mid - 25, mid + 25, kind === "steel" ? "#7d8a94" : "#8c96a0");
        if (dh > 1050) blk(F, a + 120, b - 120, 980, 1030, face === "north" ? mid - 70 : mid + 25, face === "north" ? mid - 25 : mid + 70, COL.chrome);
      } else {
        blk(F, mid - 25, mid + 25, 0, dh, a + 20, b - 20, kind === "steel" ? "#7d8a94" : "#8c96a0");
        if (dh > 1050) blk(F, face === "west" ? mid - 70 : mid + 25, face === "west" ? mid - 25 : mid + 70, 980, 1030, a + 120, b - 120, COL.chrome);
      }
    });
  }

  // Exterior walls know which way they face, so the near ones can be cut down.
  const WALLS = [
    { id: "wallN", n: [0, 0, -1], build: (F, h) => wallRun(F, "x", -T, 0, -T, W + T, h, [], "south") },
    { id: "wallS", n: [0, 0, 1], build: (F, h) => {
      wallRun(F, "x", D, D + T, -T, W + T, h, [[850, 1750, "door"], [9650, 10550, "door"]], "north");
      if (h < HT) return;
      [1300, 10100].forEach(x => {                                                                             // exit signs
        blk(F, x - 250, x + 250, 2200, 2400, 7940, 8000, COL.green);
        panel(F, "north", 7940, x - 180, x - 40, 2240, 2360, 4, COL.white);
      });
    } },
    { id: "wallW", n: [-1, 0, 0], build: (F, h) => wallRun(F, "z", -T, 0, 0, D, h, [], "east") },
    { id: "wallE", n: [1, 0, 0], build: (F, h) => {
      wallRun(F, "z", W, W + T, 0, D, h, [[800, 1800, "steel"], [2850, 4050, "steel"]], "west");
      if (h < HT) return;
      blk(F, 15960, 16000, 1400, 2900, 4300, 5300, "#7c868d");                                                  // generator air intake louvre
      for (let i = 0; i < 6; i++) panel(F, "west", 15960, 4340, 5260, 1500 + i * 230, 1550 + i * 230, 30, "#5e676d");
      blk(F, 15960, 16000, 2400, 2900, 6800, 7300, "#7c868d");                                                  // battery room extract fan
    } }
  ];

  function floor(F) {
    const rows = [[0, 1000], [1000, 1500], [1500, 2000], [2000, 3000], [3000, 4000], [4000, 5000], [5000, 6000], [6000, 7000], [7000, 8000]];
    for (let x = 0; x < W; x += 1000) rows.forEach(([z0, z1]) => {
      // the cable trench replaces the floor between z 1000 and 1500 along the CCR row
      if (z0 === 1000 && x >= 1000 && x < 11000) return;
      // skip the tiles under the mats, which lie on the floor in their place
      if (z0 === 1500 && x >= 1000 && x < 11000) return;
      F.push({ p: [[x, 0, z0], [x + 1000, 0, z0], [x + 1000, 0, z1], [x, 0, z1]], c: x < 11500 ? COL.floorHall : COL.floorSide, n: [0, 1, 0], layer: 0 });
    });
  }

  /* ---------- Equipment ---------- */
  function ccrRow(F) {
    for (let k = 0; k < 7; k++) {
      const x0 = 1500 + k * 1250, x1 = x0 + 900, zf = 900;
      blk(F, x0 + 20, x1 - 20, 0, 100, 160, 880, COL.plinth);
      blk(F, x0, x1, 100, 2000, 150, zf, COL.cab, { cols: { top: "#b3babf" } });
      panel(F, "south", zf, x0 + 30, x1 - 30, 140, 1960, 6, COL.cabDoor);
      for (let r = 0; r < 3; r++) panel(F, "south", zf + 6, x0 + 120, x1 - 120, 1770 + r * 50, 1790 + r * 50, 4, COL.dark);   // top louvres
      for (let r = 0; r < 3; r++) panel(F, "south", zf + 6, x0 + 120, x1 - 120, 260 + r * 50, 280 + r * 50, 4, COL.dark);     // bottom louvres
      panel(F, "south", zf + 6, x0 + 280, x0 + 620, 1430, 1600, 8, COL.screen);
      panel(F, "south", zf + 14, x0 + 310, x0 + 520, 1530, 1560, 2, COL.screenLit);
      panel(F, "south", zf + 6, x0 + 250, x0 + 650, 1640, 1700, 4, COL.white);                                               // nameplate
      [COL.green, COL.amber, COL.red].forEach((c, i) => panel(F, "south", zf + 6, x0 + 300 + i * 110, x0 + 350 + i * 110, 1320, 1370, 22, c));
      panel(F, "south", zf + 6, x0 + 400, x0 + 500, 1150, 1250, 30, COL.black);                                              // step selector
      panel(F, "south", zf + 36, x0 + 440, x0 + 460, 1160, 1240, 6, COL.white);
      panel(F, "south", zf + 6, x1 - 90, x1 - 60, 850, 1150, 40, COL.chrome);                                               // handle
    }
  }

  function trench(F) {
    // Chequer-plate covers with one plate lifted off to show the series cables
    for (let x = 1000; x < 11000; x += 1000) {
      if (x === 6000) continue;
      blk(F, x + 8, x + 992, -12, 0, 1004, 1496, "#8e979d", { cols: { top: "#9aa3a8" }, layer: 1 });
      for (let s = 0; s < 2; s++) blk(F, x + 250 + s * 450, x + 290 + s * 450, 0, 4, 1050, 1450, "#7f888e", { skip: ["bottom"], layer: 1 });
    }
    // Open pit
    const pit = (p, c, n) => F.push({ p, c, n, layer: -1 });
    pit([[6000, -600, 1000], [7000, -600, 1000], [7000, -600, 1500], [6000, -600, 1500]], "#5d625f", [0, 1, 0]);
    pit([[7000, -600, 1000], [6000, -600, 1000], [6000, 0, 1000], [7000, 0, 1000]], COL.concrete, [0, 0, 1]);
    pit([[6000, -600, 1500], [7000, -600, 1500], [7000, 0, 1500], [6000, 0, 1500]], "#9a968c", [0, 0, -1]);
    pit([[6000, -600, 1500], [6000, -600, 1000], [6000, 0, 1000], [6000, 0, 1500]], "#26292b", [1, 0, 0]);
    pit([[7000, -600, 1000], [7000, -600, 1500], [7000, 0, 1500], [7000, 0, 1000]], "#26292b", [-1, 0, 0]);
    [[-430, 1120], [-430, 1250], [-430, 1380], [-300, 1180], [-300, 1320]].forEach(([y, z], i) => {
      const G = [];
      AGL.D3.tube(G, [[6005, y, z], [6995, y, z]], 32, { seg: 6, c: i < 3 ? COL.cable : "#3d434a", caps: false });
      G.forEach(f => { f.layer = -0.5; F.push(f); });
    });
    // the lifted plate, leaning on the CCR plinth
    blk(F, 6050, 6950, 0, 12, 2150, 2650, "#8e979d", { cols: { top: "#9aa3a8" } });
  }

  function matsAndMarks(F) {
    blk(F, 1000, 11000, 0, 14, 1500, 2000, "#1f2326", { cols: { top: "#2b3035" }, step: 1000, layer: 1 });
    // Working clearance marked out in yellow on the floor
    [[1300, 10600, 2100, 2160], [1300, 10600, 3240, 3300]].forEach(([a, b, c, d]) => blk(F, a, b, 0, 4, c, d, COL.yellow, { skip: ["bottom"], step: 1100, layer: 1 }));
    [[1300, 1360], [10540, 10600]].forEach(([a, b]) => blk(F, a, b, 0, 4, 2100, 3300, COL.yellow, { skip: ["bottom"], layer: 1 }));
  }

  function lvBoard(F) {
    const x1 = 650;
    blk(F, 0, x1, 0, 100, 2000, 5800, COL.plinth, { step: 1200 });
    blk(F, 0, x1, 100, 2200, 2000, 5800, COL.cab, { step: 800, cols: { top: "#b3babf" } });
    for (let s = 0; s < 5; s++) {
      const z0 = 2000 + s * 760;
      panel(F, "east", x1, z0 + 25, z0 + 735, 130, 2170, 6, COL.cabDoor);
      if (s === 0) {
        panel(F, "east", x1 + 6, z0 + 180, z0 + 580, 900, 1500, 40, COL.dark);                         // incomer breaker
        [0, 1, 2].forEach(i => panel(F, "east", x1 + 6, z0 + 130 + i * 180, z0 + 270 + i * 180, 1650, 1790, 10, COL.white));
      } else {
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++)
          panel(F, "east", x1 + 6, z0 + 90 + c * 150, z0 + 190 + c * 150, 700 + r * 260, 880 + r * 260, 26, c === 3 && r === 0 ? COL.red : COL.dark);
        panel(F, "east", x1 + 6, z0 + 230, z0 + 530, 1780, 1880, 4, COL.white);
      }
      panel(F, "east", x1 + 6, z0 + 25, z0 + 735, 1960, 1990, 3, s % 2 ? COL.blue : COL.red);          // mimic line
    }
  }

  function ats(F) {
    blk(F, 0, 650, 0, 2000, 6000, 6700, "#bfc6cb", { cols: { top: "#aab2b8" } });
    panel(F, "east", 650, 6030, 6670, 120, 1960, 6, COL.cabDoor);
    panel(F, "east", 656, 6150, 6550, 1000, 1500, 6, "#3a4652");                                       // viewing window
    panel(F, "east", 662, 6250, 6450, 1150, 1350, 20, COL.black);                                      // changeover mechanism
    [COL.green, COL.amber].forEach((c, i) => panel(F, "east", 656, 6200 + i * 200, 6260 + i * 200, 1650, 1710, 20, c));
    panel(F, "east", 656, 6300, 6400, 1750, 1850, 30, COL.black);                                      // mode selector
  }

  function earthBar(F) {
    blk(F, 0, 30, 600, 650, 6950, 7800, COL.copper);
    [7000, 7750].forEach(z => blk(F, 0, 60, 580, 670, z - 30, z + 30, COL.white));                     // insulators
    for (let i = 0; i < 6; i++) {
      const z = 7050 + i * 120;
      AGL.D3.tube(F, [[45, 600, z], [90, 450, z], [90, 300, z], [90, 150, z], [90, 0, z]], 9, { seg: 4, band: j => (j % 2 ? COL.yellow : COL.green), caps: false });
    }
    AGL.D3.tube(F, [[45, 650, 7700], [60, 1500, 7700], [60, 2300, 7700], [60, 2300, 600]], 10, { seg: 4, band: j => (j % 2 ? COL.yellow : COL.green), caps: false });
  }

  function alcms(F) {
    [3000, 3900].forEach((x0, r) => {
      const x1 = x0 + 800, zf = 7000;
      blk(F, x0, x1, 0, 2100, zf, 7950, "#30363c", { cols: { top: "#3d444a" } });
      for (let u = 0; u < 7; u++) {
        const y0 = 250 + u * 240;
        panel(F, "north", zf - 2, x0 + 60, x1 - 60, y0, y0 + 180, 20, u % 3 === 1 ? "#4a525a" : "#1d2125");
        for (let l = 0; l < 5; l++) panel(F, "north", zf - 22, x0 + 110 + l * 60, x0 + 135 + l * 60, y0 + 120, y0 + 145, 6, (l + u + r) % 4 === 0 ? COL.amber : COL.screenLit);
      }
      panel(F, "north", zf - 30, x0 + 20, x1 - 20, 60, 2060, 10, COL.lens, { op: 0.32 });                  // glass door
      panel(F, "north", zf - 40, x1 - 80, x1 - 60, 900, 1200, 30, COL.chrome);
    });
  }

  function hvac(F) {
    [1000, 9300].forEach(x0 => {
      blk(F, x0, x0 + 1100, 2550, 2900, 0, 260, COL.white, { cols: { south: "#e9ebe7" } });
      panel(F, "south", 260, x0 + 80, x0 + 1020, 2570, 2610, 20, "#c3c7c4");                             // louvre
      panel(F, "south", 260, x0 + 950, x0 + 1000, 2820, 2860, 4, COL.screenLit);
    });
  }

  function tray(F) {
    const y = 2300;
    const rails = (a, b, axis, c0) => {
      const o = { step: 2500 };
      if (axis === "x") { blk(F, a, b, y, y + 80, c0, c0 + 20, COL.galv, o); blk(F, a, b, y, y + 80, c0 + 380, c0 + 400, COL.galv, o); for (let x = a; x < b; x += 600) blk(F, x, x + 30, y, y + 20, c0, c0 + 400, COL.galv, { skip: ["bottom"] }); }
      else { blk(F, c0, c0 + 20, y, y + 80, a, b, COL.galv, o); blk(F, c0 + 380, c0 + 400, y, y + 80, a, b, COL.galv, o); for (let z = a; z < b; z += 600) blk(F, c0, c0 + 400, y, y + 20, z, z + 30, COL.galv, { skip: ["bottom"] }); }
    };
    rails(700, 10700, "x", 300);
    rails(700, 3400, "z", 150);
    [[380, COL.cable], [470, "#3d434a"], [560, COL.cable]].forEach(([z, c]) =>
      AGL.D3.tube(F, [[10600, y + 45, z], [350 + (z - 380), y + 45, z], [350 + (z - 380), y + 45, 3300]], 22, { seg: 5, c, caps: false }));
    // drops from the tray to each CCR roof
    for (let k = 0; k < 7; k++) AGL.D3.tube(F, [[1950 + k * 1250, y, 500], [1950 + k * 1250, 2000, 500]], 18, { seg: 5, c: COL.cable, caps: false });
  }

  function board(F) {
    blk(F, 5300, 6900, 950, 2050, 7960, 8000, "#1d4f8a");
    panel(F, "north", 7960, 5380, 6150, 1150, 1950, 4, COL.white);                                        // single-line diagram
    [[1700, COL.red], [1500, COL.blue], [1300, COL.green]].forEach(([y, c]) => panel(F, "north", 7956, 5450, 6080, y, y + 14, 2, c));
    [5450, 5650, 5850, 6050].forEach(x => panel(F, "north", 7956, x, x + 8, 1300, 1714, 2, COL.dark));
    panel(F, "north", 7960, 6250, 6420, 1150, 1500, 60, "#f07a1a");                                        // insulated gloves
    panel(F, "north", 7960, 6480, 6650, 1150, 1500, 60, "#f07a1a");
    panel(F, "north", 7960, 6730, 6790, 650, 2000, 50, COL.yellow);                                         // discharge stick
    panel(F, "north", 7960, 6250, 6650, 1600, 1950, 90, COL.red);                                           // lockout station
    [0, 1, 2, 3].forEach(i => panel(F, "north", 7870, 6290 + i * 90, 6350 + i * 90, 1650, 1720, 20, [COL.yellow, COL.blue, COL.green, COL.red][i]));
    panel(F, "north", 7960, 5380, 5700, 980, 1120, 90, COL.green);                                           // first aid
    panel(F, "north", 7870, 5520, 5560, 1000, 1100, 4, COL.white);
    panel(F, "north", 7870, 5490, 5590, 1035, 1065, 4, COL.white);
  }

  function bench(F) {
    const z0 = 7300, z1 = 7950, x0 = 7300, x1 = 9300, y = 900;
    blk(F, x0, x1, y - 40, y, z0, z1, COL.wood, { cols: { top: "#c19663" } });
    [[x0 + 40, z0 + 40], [x1 - 100, z0 + 40], [x0 + 40, z1 - 100], [x1 - 100, z1 - 100]].forEach(([x, z]) => blk(F, x, x + 60, 0, y - 40, z, z + 60, COL.galv));
    blk(F, x1 - 600, x1 - 120, 150, y - 40, z0 + 60, z1 - 60, "#7e8a93");                                   // drawer unit
    for (let i = 0; i < 3; i++) panel(F, "north", z0 + 60, x1 - 580, x1 - 140, 200 + i * 220, 380 + i * 220, 6, "#8f9aa3");
    blk(F, x0 + 150, x0 + 450, y, y + 160, z0 + 150, z0 + 400, COL.yellow);                                  // insulation tester
    panel(F, "north", z0 + 150, x0 + 190, x0 + 410, y + 60, y + 140, 4, COL.dark);
    blk(F, x0 + 560, x0 + 640, y, y + 260, z0 + 200, z0 + 260, COL.yellow);                                   // clamp meter
    blk(F, x0 + 800, x0 + 1150, y, y + 220, z0 + 120, z0 + 460, "#c9a26b");                                   // box of spare lamps
    blk(F, x0 + 1250, x0 + 1450, y, y + 70, z0 + 150, z0 + 300, COL.black);                                   // spare transformer
    blk(F, x0 + 150, x1 - 150, 1700, 1730, 7700, 7980, COL.wood);                                             // wall shelf
    [0, 1, 2, 3].forEach(i => blk(F, x0 + 200 + i * 420, x0 + 520 + i * 420, 1730, 1980, 7720, 7960, i % 2 ? "#4f6b8a" : "#7a8590"));
  }

  function fire(F) {
    [[1900, 7700], [9100, 7700], [11100, 300]].forEach(([x, z]) => {
      AGL.D3.cyl(F, { r1: 90, y0: 0, y1: 640, cx: x, cz: z, seg: 10, c: COL.red, bottom: false });
      AGL.D3.cyl(F, { r1: 30, y0: 640, y1: 720, cx: x, cz: z, seg: 6, c: COL.black, bottom: false });
      AGL.D3.tube(F, [[x, 700, z], [x + 70, 690, z], [x + 120, 560, z]], 14, { seg: 4, c: COL.black });
    });
    blk(F, 0, 60, 1350, 1500, 7100, 7250, COL.red);                                                          // manual call point
    [[3500, 3000], [7500, 3000], [9500, 5800]].forEach(([x, z]) => {
      AGL.D3.cyl(F, { r1: 70, y0: 3420, y1: 3460, cx: x, cz: z, seg: 10, c: COL.white });                    // smoke detectors at ceiling height
      AGL.D3.cyl(F, { r1: 8, y0: 3460, y1: 3500, cx: x, cz: z, seg: 4, c: COL.galv, bottom: false });
    });
  }

  function exitsAndLights(F) {
    [3000, 8500].forEach(x => blk(F, x - 200, x + 200, 2950, 3050, 0, 120, COL.white));                       // emergency luminaires
  }

  function rmu(F) {
    const xf = 12600;
    blk(F, 11800, xf, 0, 1750, 300, 2000, COL.rmu, { cols: { top: "#6c8676" } });
    [0, 1, 2].forEach(i => {
      const z0 = 350 + i * 550;
      panel(F, "east", xf, z0, z0 + 500, 1000, 1600, 5, "#8fa998");
      panel(F, "east", xf + 5, z0 + 230, z0 + 270, 1050, 1550, 4, COL.white);                               // mimic busbar
      panel(F, "east", xf + 5, z0 + 180, z0 + 320, 1250, 1300, 4, COL.white);
      panel(F, "east", xf + 5, z0 + 200, z0 + 300, 1380, 1480, 18, COL.black);                              // operating point
      panel(F, "east", xf, z0 + 60, z0 + 180, 1650, 1720, 10, COL.white);                                   // gauge
      panel(F, "east", xf, z0, z0 + 500, 150, 900, 5, "#728d7c");                                           // cable box
    });
  }

  // Cast-resin transformer in a mesh enclosure
  function transformer(F) {
    const tz = 1250;
    blk(F, 13900, 15800, 0, 140, 600, 1900, "#3a3f44");
    blk(F, 14050, 15650, 140, 260, tz - 160, tz + 160, COL.core);
    blk(F, 14050, 15650, 1450, 1570, tz - 160, tz + 160, COL.core);
    [14350, 14850, 15350].forEach(x => {
      AGL.D3.cyl(F, { r0: 0, r1: 230, y0: 300, y1: 1410, cx: x, cz: tz, seg: 14, c: COL.resin, bottom: false });
      AGL.D3.cyl(F, { r1: 22, y0: 1570, y1: 1720, cx: x, cz: tz - 80, seg: 6, c: "#c9c3b4", bottom: false });  // HV bushings
      blk(F, x - 30, x + 30, 1300, 1700, tz + 150, tz + 190, COL.copper);                                    // LV busbars
    });
    [[13850, 15850, 550, 570], [13850, 15850, 1930, 1950]].forEach(([a, b, c, d]) => blk(F, a, b, 0, 1900, c, d, "#8d9aa4", { op: 0.28, step: 700 }));
    [[13850, 13870], [15830, 15850]].forEach(([a, b]) => blk(F, a, b, 0, 1900, 570, 1930, "#8d9aa4", { op: 0.28, step: 700 }));
  }

  function genRoom(F) {
    const z0 = 3450, z1 = 4550, zc = 4000;
    blk(F, 12200, 15700, 0, 220, z0, z1, "#2c3034");                                                          // skid
    blk(F, 12300, 12700, 220, 1950, z0 + 50, z1 - 50, COL.radiator, { cols: { west: "#30363b" } });          // radiator
    for (let i = 0; i < 6; i++) panel(F, "west", 12300, z0 + 120, z1 - 120, 400 + i * 250, 420 + i * 250, 6, "#555c62");
    blk(F, 12750, 14550, 300, 1400, z0 + 150, z1 - 150, COL.gen, { cols: { top: "#6c7a83" } });              // engine block
    [12950, 13500, 14050].forEach(x => blk(F, x, x + 420, 1400, 1550, z0 + 280, z1 - 280, "#7d8a93"));       // rocker covers
    AGL.D3.tube(F, [[14550, 900, zc], [15500, 900, zc]], 440, { seg: 14, c: COL.alt, cCap: "#264058" });      // alternator
    blk(F, 15550, 15700, 300, 1500, zc - 300, zc + 300, "#283f56");                                          // terminal box
    blk(F, 15100, 15700, 700, 1500, 2650, 2850, "#d9dcd8");                                                  // control panel
    panel(F, "south", 2850, 15180, 15620, 1200, 1420, 6, COL.screen);
    blk(F, 15350, 15450, 0, 700, 2700, 2800, COL.galv);
    AGL.D3.tube(F, [[13700, 1550, zc], [13700, 2200, zc], [13700, 2700, zc - 200], [13900, 2900, zc - 200]], 70, { seg: 8, smooth: 2, c: "#a7aca8" });   // exhaust riser
    AGL.D3.tube(F, [[13900, 2900, zc - 200], [15300, 2900, zc - 200]], 220, { seg: 12, c: "#c3c6c2", cCap: "#8c908c" });   // silencer
    AGL.D3.tube(F, [[15300, 2900, zc - 200], [16000, 2900, zc - 200]], 80, { seg: 8, c: "#a7aca8" });
    blk(F, 12900, 13300, 220, 500, z1 + 50, z1 + 300, COL.black);                                            // starter battery
    // Day tank in a bund
    const bx0 = 14700, bx1 = 15900, bz0 = 4800, bz1 = 5450;
    blk(F, bx0, bx1, 0, 300, bz0, bz0 + 100, COL.concrete); blk(F, bx0, bx1, 0, 300, bz1 - 100, bz1, COL.concrete);
    blk(F, bx0, bx0 + 100, 0, 300, bz0, bz1, COL.concrete); blk(F, bx1 - 100, bx1, 0, 300, bz0, bz1, COL.concrete);
    [14950, 15650].forEach(x => blk(F, x - 60, x + 60, 0, 300, 5000, 5250, "#2c3034"));
    AGL.D3.tube(F, [[14850, 560, 5125], [15750, 560, 5125]], 260, { seg: 12, c: COL.tank, cCap: "#7a7f77" });
    AGL.D3.tube(F, [[15000, 820, 5125], [15000, 1300, 5125], [14000, 1300, 4600], [14000, 400, 4450]], 14, { seg: 4, c: COL.black });
  }

  function upsRoom(F) {
    blk(F, 12000, 13000, 0, 2000, 5800, 6600, "#3a4046", { cols: { top: "#454c53" } });
    panel(F, "south", 6600, 12050, 12950, 80, 1960, 6, "#454c53");
    panel(F, "south", 6606, 12300, 12700, 1500, 1750, 6, COL.screen);
    panel(F, "south", 6612, 12330, 12560, 1640, 1670, 2, COL.screenLit);
    [COL.green, COL.green, COL.amber].forEach((c, i) => panel(F, "south", 6606, 12350 + i * 110, 12400 + i * 110, 1380, 1430, 14, c));
    for (let i = 0; i < 5; i++) panel(F, "south", 6606, 12150, 12850, 250 + i * 110, 280 + i * 110, 4, "#2a2f34");
    [6100, 7100].forEach(zr => {
      const x0 = 13500, x1 = 15700, z0 = zr, z1 = zr + 500;
      [[x0, z0], [x1 - 50, z0], [x0, z1 - 50], [x1 - 50, z1 - 50]].forEach(([x, z]) => blk(F, x, x + 50, 0, 1700, z, z + 50, "#5a6a7a"));
      [150, 750, 1350].forEach(y => {
        blk(F, x0, x1, y - 30, y, z0, z1, "#6b7b8b");
        for (let b = 0; b < 5; b++) {
          const bx = x0 + 100 + b * 415;
          blk(F, bx, bx + 300, y, y + 240, z0 + 70, z1 - 70, COL.batt, { cols: { top: "#33383d" } });
          blk(F, bx + 40, bx + 80, y + 240, y + 270, z0 + 200, z0 + 240, COL.red);
          blk(F, bx + 220, bx + 260, y + 240, y + 270, z0 + 200, z0 + 240, COL.black);
        }
      });
    });
    blk(F, 11700, 11760, 1150, 1450, 7300, 7600, COL.green);                                                 // eyewash station
    panel(F, "east", 11760, 7400, 7500, 1250, 1350, 4, COL.white);
  }

  function interior(F) {
    const h = INNER;
    const opts = face => ({ cols: { top: COL.wallTop, [face]: COL.wallIn }, step: 1100 });
    // Hall / side rooms partition, with the doorway to the UPS room
    blk(F, 11500, 11700, 0, h, 0, 7000, COL.wall, opts("east"));
    blk(F, 11500, 11700, 0, h, 7900, 8000, COL.wall, opts("east"));
    blk(F, 11500, 11700, 0, h, 7000, 7900, "#8c96a0", { skip: ["top"] });
    blk(F, 11420, 11500, 900, 960, 7120, 7780, COL.chrome);
    blk(F, 11700, 16000, 0, h, 2400, 2600, COL.wall, opts("south"));
    blk(F, 11700, 16000, 0, h, 5500, 5700, COL.wall, opts("south"));
  }

  const PARTS = [
    { id: "ccrs", build: ccrRow }, { id: "trench", build: trench }, { id: "mats", build: matsAndMarks },
    { id: "lv", build: lvBoard }, { id: "ats", build: ats }, { id: "earthbar", build: earthBar },
    { id: "alcms", build: alcms }, { id: "hvac", build: hvac }, { id: "tray", build: tray },
    { id: "board", build: board }, { id: "bench", build: bench }, { id: "fire", build: fire },
    { id: "exits", build: exitsAndLights }, { id: "rmu", build: rmu }, { id: "txr", build: transformer },
    { id: "gen", build: genRoom }, { id: "ups", build: upsRoom },
    { id: "floor", build: floor, quiet: true }, { id: "walls", build: interior, quiet: true }
  ];
  /* ---------- Viewer ---------- */
  const LIGHT = AGL.D3 ? AGL.D3.unit([-0.35, 0.85, 0.45]) : [0, 1, 0];
  const HOME = { yaw: 0.55, pitch: 0.62, zoom: 1, target: [8000, 600, 4000] };
  // Camera for each tour stop (titles and texts are in vault-data.js, in the same order)
  const STOPS = [
    { part: null, view: HOME },
    { part: "ccrs", view: { yaw: 0.22, pitch: 0.3, zoom: 2.2, target: [5700, 1000, 900] } },
    { part: "trench", view: { yaw: 0.45, pitch: 0.78, zoom: 4.2, target: [6500, -150, 1600] } },
    { part: "lv", view: { yaw: 1.25, pitch: 0.32, zoom: 2.4, target: [500, 1100, 3900] } },
    { part: "ats", view: { yaw: 2.0, pitch: 0.45, zoom: 3, target: [300, 1000, 6700] } },
    { part: "alcms", view: { yaw: Math.PI + 0.25, pitch: 0.32, zoom: 3, target: [3900, 1100, 7300] } },
    { part: "board", view: { yaw: Math.PI - 0.2, pitch: 0.3, zoom: 2.6, target: [7000, 1300, 7700] } },
    { part: "tray", view: { yaw: 0.35, pitch: 0.22, zoom: 2, target: [5200, 2300, 600] } },
    { part: "exits", view: { yaw: 0.05, pitch: 0.42, zoom: 1.6, target: [5600, 900, 7500] } },
    { part: "txr", view: { yaw: 1.85, pitch: 0.55, zoom: 2.6, target: [13600, 800, 1200] } },
    { part: "gen", view: { yaw: 0.85, pitch: 0.78, zoom: 2.3, target: [14100, 900, 4100] } },
    { part: "ups", view: { yaw: 0.45, pitch: 0.48, zoom: 2.5, target: [14000, 900, 6700] } }
  ];

  function Tour(host) {
    const D3 = AGL.D3;
    const st = Object.assign({ sel: null, hover: null, stop: -1, t: d3.zoomIdentity }, JSON.parse(JSON.stringify(HOME)));
    let parts = [], walls = [], pending = false;

    host.innerHTML = `
      <div class="d3d-stage v3">
        <div class="d3d-bar">
          <span class="v3-tourbar">
            <button type="button" class="btn" data-a="prev"></button>
            <button type="button" class="btn primary" data-a="next"></button>
          </span>
          <span class="d3d-zoom">
            <button type="button" class="btn" data-z="in">+</button><button type="button" class="btn" data-z="out">−</button>
            <button type="button" class="btn" data-z="reset"></button>
          </span>
        </div>
        <div class="v3-view">
          <svg class="d3d-svg" tabindex="0" role="img"></svg>
          <div class="v3-tip" hidden></div>
        </div>
        <p class="d3d-hint"></p>
      </div>
      <div class="d3d-below">
        <ol class="d3d-parts v3-parts"></ol>
        <aside class="panel d3d-info v3-info" aria-live="polite"></aside>
      </div>`;
    const svg = d3.select(host).select("svg");
    const gFaces = svg.append("g");
    const tipEl = host.querySelector(".v3-tip");
    const C = () => AGL.d("VAULT3D");

    parts = PARTS.map(p => { const F = []; p.build(F); return Object.assign({}, p, { faces: F }); });
    walls = WALLS.map(w => {
      const full = [], cut = [];
      w.build(full, HT);
      w.build(cut, CUT);
      return Object.assign({}, w, { full, cut });
    });

    function size() {
      const w = host.querySelector(".d3d-stage").clientWidth || 1000;
      const Wv = D3.clamp(Math.round(w), 340, 1100);
      return { W: Wv, H: Math.round(Wv * (w < 700 ? 0.95 : 0.6)) };
    }

    function render() {
      pending = false;
      const { W: Wv, H } = size();
      svg.attr("viewBox", `0 0 ${Wv} ${H}`).style("aspect-ratio", `${Wv} / ${H}`).attr("aria-label", AGL.t("3D tour of an AGL vault"));
      const k = Wv / 21000 * st.zoom;
      const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      const tg = st.target, Dcam = 26000 / st.zoom;
      const rot = p => {
        const x = p[0] * cy - p[2] * sy, z = p[0] * sy + p[2] * cy, y = p[1];
        return [x, y * cp - z * sp, y * sp + z * cp];
      };
      const proj = p => {
        const r = rot([p[0] - tg[0], p[1] - tg[1], p[2] - tg[2]]);
        const f = Dcam / Math.max(200, Dcam - r[2]);
        return [st.t.applyX(Wv / 2 + r[0] * f * k), st.t.applyY(H / 2 - r[1] * f * k), r[2], r];
      };
      const out = [];
      const pushFaces = (faces, part, base) => {
        const hl = st.sel === part.id || st.hover === part.id;
        const dim = st.sel && st.sel !== part.id && !part.quiet ? 0.35 : 1;
        faces.forEach(f => {
          const q = f.p.map(proj);
          let z = 0, cxv = 0, cyv = 0, czv = 0;
          q.forEach(v => { z += v[2]; cxv += v[3][0]; cyv += v[3][1]; czv += v[3][2]; });
          const n = q.length;
          z /= n;
          let shadeK;
          if (f.n) {
            const nv = rot(f.n);
            // Cull faces turned away from the camera
            if (-cxv / n * nv[0] - cyv / n * nv[1] + (Dcam - czv / n) * nv[2] <= 0) return;
            shadeK = 0.5 + 0.55 * Math.max(0, D3.dot(nv, LIGHT));
          } else {
            const a = q[0][3], b = q[1][3], c = q[2] ? q[2][3] : q[1][3];
            const nn = D3.unit(D3.cross(D3.sub(b, a), D3.sub(c, a)));
            shadeK = 0.5 + 0.55 * Math.abs(D3.dot(nn, LIGHT));
          }
          if (hl) shadeK *= 1.22;
          const fill = D3.shade(f.c, shadeK);
          // Floor-level faces are drawn first, in fixed layers, so they never cover what stands on them
          const zs = f.layer === undefined ? z : -1e9 + f.layer * 1e7 + z;
          out.push({ part, d: "M" + q.map(v => v[0].toFixed(1) + "," + v[1].toFixed(1)).join("L") + "Z", fill, z: zs, op: (f.op === undefined ? 1 : f.op) * dim * (base || 1) });
        });
      };
      // Walls turned towards the camera drop to waist height
      walls.forEach(w => {
        const nv = rot(w.n);
        pushFaces(nv[2] > 0.15 ? w.cut : w.full, { id: w.id, quiet: true });
      });
      parts.forEach(p => pushFaces(p.faces, p));
      out.sort((a, b) => a.z - b.z);
      gFaces.selectAll("path").data(out).join("path")
        .attr("d", d => d.d)
        .attr("class", d => (d.part.quiet ? "q" : "p"))
        .attr("style", d => `fill:${d.fill};fill-opacity:${d.op};stroke:${d.op < 0.99 ? "none" : d.fill}`);
    }
    const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(render); } };

    function showTip(ev, pid) {
      if (!pid) { tipEl.hidden = true; return; }
      const P = C().parts[pid];
      tipEl.innerHTML = `<strong>${escape(P.name)}</strong><span>${escape(P.short)}</span>`;
      tipEl.dir = AGL.lang === "he" ? "rtl" : "ltr";
      tipEl.hidden = false;
      const box = host.querySelector(".v3-view").getBoundingClientRect();
      const x = ev.clientX - box.left, y = ev.clientY - box.top;
      const tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
      tipEl.style.left = Math.min(Math.max(8, x + 16), box.width - tw - 8) + "px";
      tipEl.style.top = (y - th - 14 < 8 ? y + 20 : y - th - 14) + "px";
    }
    const escape = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

    function renderInfo() {
      const c = C(), stops = c.stops;
      host.querySelector('[data-a="prev"]').textContent = AGL.t("Previous stop");
      host.querySelector('[data-a="next"]').textContent = st.stop < 0 ? AGL.t("Start the tour") : st.stop < stops.length - 1 ? AGL.t("Next stop") : AGL.t("Back to the start");
      host.querySelector('[data-a="prev"]').disabled = st.stop <= 0;
      host.querySelector('[data-z="reset"]').textContent = AGL.t("Reset view");
      host.querySelector('[data-z="in"]').setAttribute("aria-label", AGL.t("Zoom in"));
      host.querySelector('[data-z="out"]').setAttribute("aria-label", AGL.t("Zoom out"));
      host.querySelector(".d3d-hint").textContent = AGL.t("Drag to look around · scroll or pinch to zoom · point at equipment for a description");
      const ids = PARTS.filter(p => !p.quiet).map(p => p.id);
      host.querySelector(".v3-parts").innerHTML = ids.map((pid, i) =>
        `<li><button type="button" data-p="${pid}" aria-pressed="${st.sel === pid}"><span class="pn">${i + 1}</span>${escape(c.parts[pid].name)}</button></li>`).join("");
      const box = host.querySelector(".v3-info");
      if (st.sel) {
        const P = c.parts[st.sel];
        box.innerHTML = `<span class="tag">${escape(AGL.t("Equipment"))}</span><h4>${escape(P.name)}</h4><p>${escape(P.text)}</p>`;
      } else if (st.stop >= 0) {
        const S = stops[st.stop];
        box.innerHTML = `<span class="tag">${escape(AGL.t("Stop {i} of {n}", { i: st.stop + 1, n: stops.length }))}</span><h4>${escape(S.title)}</h4><p>${escape(S.text)}</p>`;
      } else {
        box.innerHTML = `<span class="tag">${escape(AGL.t("3D tour"))}</span><h4>${escape(c.intro.title)}</h4><p>${escape(c.intro.text)}</p>`;
      }
    }

    function flyTo(view, pid) {
      st.sel = null;
      st.hover = pid || null;
      const from = { yaw: st.yaw, pitch: st.pitch, zoom: st.zoom, target: st.target.slice() };
      let dy = view.yaw - from.yaw;
      dy = ((dy + Math.PI) % TAU + TAU) % TAU - Math.PI;   // turn the short way round
      const to = { yaw: from.yaw + dy, pitch: view.pitch, zoom: view.zoom, target: view.target };
      svg.call(zoom.transform, d3.zoomIdentity);
      const apply = t => {
        st.yaw = from.yaw + (to.yaw - from.yaw) * t;
        st.pitch = from.pitch + (to.pitch - from.pitch) * t;
        st.zoom = Math.exp(Math.log(from.zoom) + (Math.log(to.zoom) - Math.log(from.zoom)) * t);
        st.target = from.target.map((v, i) => v + (to.target[i] - v) * t);
        render();
      };
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { apply(1); return; }
      d3.select(host).transition("fly").duration(1300).ease(d3.easeCubicInOut).tween("cam", () => apply);
    }

    function goStop(i) {
      const stops = C().stops;
      if (i >= stops.length) i = -1;
      st.stop = i;
      if (i < 0) flyTo(HOME, null);
      else flyTo(STOPS[i].view, STOPS[i].part);
      renderInfo();
    }

    host.querySelector(".v3-tourbar").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      goStop(b.dataset.a === "next" ? st.stop + 1 : Math.max(0, st.stop - 1));
    });
    const zoom = d3.zoom().scaleExtent([0.6, 6])
      .filter(ev => ev.type === "wheel" || (ev.type === "touchstart" && ev.touches.length > 1) || ev.type === "touchmove")
      .on("zoom", ev => { st.t = ev.transform; schedule(); });
    svg.call(zoom).on("dblclick.zoom", null);
    host.querySelector(".d3d-zoom").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.z === "in") svg.transition().duration(250).call(zoom.scaleBy, 1.3);
      else if (b.dataset.z === "out") svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.3);
      else { st.stop = -1; st.sel = null; flyTo(HOME, null); renderInfo(); }
    });
    svg.call(d3.drag()
      .filter(ev => !ev.ctrlKey && !ev.button && (!ev.touches || ev.touches.length === 1))
      .clickDistance(5)
      .on("drag", ev => {
        st.yaw -= ev.dx * 0.007;
        st.pitch = D3.clamp(st.pitch + ev.dy * 0.005, 0.05, 1.45);
        tipEl.hidden = true;
        schedule();
      }));
    svg.on("keydown", ev => {
      const k = ev.key;
      if (k === "ArrowLeft") st.yaw += 0.1;
      else if (k === "ArrowRight") st.yaw -= 0.1;
      else if (k === "ArrowUp") st.pitch = D3.clamp(st.pitch + 0.08, 0.05, 1.45);
      else if (k === "ArrowDown") st.pitch = D3.clamp(st.pitch - 0.08, 0.05, 1.45);
      else if (k === "+" || k === "=") svg.call(zoom.scaleBy, 1.2);
      else if (k === "-") svg.call(zoom.scaleBy, 1 / 1.2);
      else return;
      ev.preventDefault();
      schedule();
    });
    gFaces.on("pointermove", ev => {
      const d = d3.select(ev.target).datum();
      const pid = d && d.part && !d.part.quiet ? d.part.id : null;
      if (pid !== st.hover) { st.hover = pid; schedule(); }
      showTip(ev, pid);
    }).on("pointerleave", () => { st.hover = null; tipEl.hidden = true; schedule(); })
      .on("click", ev => {
        const d = d3.select(ev.target).datum();
        if (!d || !d.part || d.part.quiet) return;
        st.sel = st.sel === d.part.id ? null : d.part.id;
        renderInfo();
        schedule();
      });
    host.querySelector(".v3-parts").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      st.sel = st.sel === b.dataset.p ? null : b.dataset.p;
      renderInfo();
      schedule();
    });
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(host.querySelector(".d3d-stage"));
    renderInfo();
    render();
    return { relang() { renderInfo(); render(); }, render: schedule };
  }

  AGL.initVault3D = function () {
    const host = document.getElementById("vault-3d");
    if (!host) return;
    if (!window.d3 || !AGL.D3) {
      host.innerHTML = `<p class="callout">${AGL.t("The 3D viewer needs an internet connection to load d3.js. Connect and reload the page.")}</p>`;
      return;
    }
    const v = Tour(host);
    AGL.onLang(() => v.relang());
    document.addEventListener("agl:lesson", () => v.render());
  };
})();
