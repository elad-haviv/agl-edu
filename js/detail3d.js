/* Module E: 3D installation details. Each installation is built from simple solids in
   millimetres (y up, ground at y = 0), projected through a perspective camera and drawn
   as SVG polygons with d3 using the painter's algorithm. */
(function () {
  const TAU = Math.PI * 2;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const addv = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const unit = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  /* ---------- Solid builders: each pushes faces { p: [points], c: colour, ... } into an array ---------- */

  // Cylinder or tube between radii r0..r1 and heights y0..y1, optionally only the sector a0..a1
  // (the missing sector is closed with section faces). `drop` lowers the outer edge of the top.
  function cyl(F, o) {
    const r0 = o.r0 || 0, r1 = o.r1, y0 = o.y0, y1 = o.y1, cx = o.cx || 0, cz = o.cz || 0;
    const a0 = o.a0 || 0, a1 = o.a1 === undefined ? TAU : o.a1, drop = o.drop || 0;
    const full = a1 - a0 >= TAU - 1e-6;
    const n = Math.max(3, Math.round((o.seg || 32) * (a1 - a0) / TAU));
    const nv = o.nv || 1, nr = o.nr || 1;
    const P = (r, t, y) => [cx + r * Math.cos(t), y, cz + r * Math.sin(t)];
    const yTop = r => y1 - (r1 > r0 ? drop * (r - r0) / (r1 - r0) : 0);
    const extra = o.x || {};
    const face = (p, c) => F.push(Object.assign({ p, c }, extra));
    for (let i = 0; i < n; i++) {
      const ta = a0 + (a1 - a0) * i / n, tb = a0 + (a1 - a0) * (i + 1) / n;
      if (o.wall !== false) {
        for (let j = 0; j < nv; j++) {
          const f0 = j / nv, f1 = (j + 1) / nv;
          const ya = y0 + (yTop(r1) - y0) * f0, yb = y0 + (yTop(r1) - y0) * f1;
          face([P(r1, ta, ya), P(r1, tb, ya), P(r1, tb, yb), P(r1, ta, yb)], o.band ? o.band(j, i) : o.c);
          if (r0 > 0 && o.inner !== false) {
            const yc = y0 + (y1 - y0) * f0, yd = y0 + (y1 - y0) * f1;
            face([P(r0, ta, yc), P(r0, ta, yd), P(r0, tb, yd), P(r0, tb, yc)], o.cIn || o.c);
          }
        }
      }
      for (let k = 0; k < nr; k++) {
        const ra = r0 + (r1 - r0) * k / nr, rb = r0 + (r1 - r0) * (k + 1) / nr;
        if (o.top !== false) {
          face(ra === 0 ? [P(0, ta, yTop(0)), P(rb, tb, yTop(rb)), P(rb, ta, yTop(rb))]
            : [P(ra, ta, yTop(ra)), P(ra, tb, yTop(ra)), P(rb, tb, yTop(rb)), P(rb, ta, yTop(rb))], o.cTop || o.c);
        }
        if (o.bottom !== false) {
          face(ra === 0 ? [P(0, ta, y0), P(rb, ta, y0), P(rb, tb, y0)]
            : [P(ra, ta, y0), P(rb, ta, y0), P(rb, tb, y0), P(ra, tb, y0)], o.cBot || o.c);
        }
      }
    }
    if (!full) {
      [a0, a1].forEach(t => {
        for (let j = 0; j < nv; j++) {
          const f0 = j / nv, f1 = (j + 1) / nv;
          const yi0 = y0 + (yTop(r0) - y0) * f0, yi1 = y0 + (yTop(r0) - y0) * f1;
          const yo0 = y0 + (yTop(r1) - y0) * f0, yo1 = y0 + (yTop(r1) - y0) * f1;
          face([P(r0, t, yi0), P(r1, t, yo0), P(r1, t, yo1), P(r0, t, yi1)], o.cCut || o.c);
        }
      });
    }
  }

  function box(F, x0, x1, y0, y1, z0, z1, c, x) {
    const v = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]].forEach((q, i) =>
      F.push(Object.assign({ p: q.map(k => v[k]), c: Array.isArray(c) ? c[i] : c }, x || {})));
  }

  // Catmull-Rom path through the control points
  function spline(pts, k) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
      for (let s = 0; s < k; s++) {
        const t = s / k, t2 = t * t, t3 = t2 * t;
        out.push([0, 1, 2].map(d => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  // Round tube swept along a path (cables, conduits, conductors)
  function tube(F, pts, r, o) {
    o = o || {};
    const path = o.smooth ? spline(pts, o.smooth) : pts;
    const seg = o.seg || 8, n = path.length;
    let N = null;
    const rings = [];
    for (let i = 0; i < n; i++) {
      const T = unit(sub(path[Math.min(i + 1, n - 1)], path[Math.max(i - 1, 0)]));
      if (!N) {
        const ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
        N = unit(cross(cross(T, ref), T));
      } else N = unit(sub(N, mul(T, dot(N, T))));
      const B = cross(T, N);
      const ri = typeof r === "function" ? r(i, n) : r;
      const ring = [];
      for (let k = 0; k < seg; k++) {
        const a = TAU * k / seg;
        ring.push(addv(path[i], addv(mul(N, ri * Math.cos(a)), mul(B, ri * Math.sin(a)))));
      }
      rings.push(ring);
    }
    const x = o.x || {};
    for (let i = 0; i < n - 1; i++) {
      for (let k = 0; k < seg; k++) {
        const k1 = (k + 1) % seg;
        F.push(Object.assign({ p: [rings[i][k], rings[i][k1], rings[i + 1][k1], rings[i + 1][k]], c: o.band ? o.band(i, n) : o.c }, x));
      }
    }
    if (o.caps !== false) {
      F.push(Object.assign({ p: rings[0].slice().reverse(), c: o.cCap || o.c }, x));
      F.push(Object.assign({ p: rings[n - 1], c: o.cCap || o.c }, x));
    }
  }

  // Sphere zone between polar angles p0..p1 (0 = top)
  function dome(F, o) {
    const seg = o.seg || 24, rings = o.rings || 6, p0 = o.p0 || 0, p1 = o.p1 === undefined ? Math.PI / 2 : o.p1;
    const P = (ph, th) => [o.cx + o.r * Math.sin(ph) * Math.cos(th), o.cy + o.r * Math.cos(ph), o.cz + o.r * Math.sin(ph) * Math.sin(th)];
    for (let j = 0; j < rings; j++) {
      const pa = p0 + (p1 - p0) * j / rings, pb = p0 + (p1 - p0) * (j + 1) / rings;
      for (let i = 0; i < seg; i++) {
        const ta = TAU * i / seg, tb = TAU * (i + 1) / seg;
        const p = pa < 1e-6 ? [P(0, 0), P(pb, tb), P(pb, ta)] : [P(pa, ta), P(pa, tb), P(pb, tb), P(pb, ta)];
        F.push(Object.assign({ p, c: o.c }, o.x || {}));
      }
    }
  }

  // Ground or pavement block of half-width W with layered sides and a round hole that the
  // installation fills. With `cut`, the quadrant facing the viewer (x > 0, z > 0) is removed.
  function ground(F, o) {
    const W = o.W, cut = o.cut, seg = 48;
    const a0 = cut ? Math.PI / 2 : 0, a1 = TAU;
    const holeAt = y => { const h = o.holes.find(b => y <= b.y1 && y >= b.y0); return h ? h.r : 0; };
    const layerAt = y => o.layers.find(l => y <= l.y1 && y >= l.y0) || o.layers[o.layers.length - 1];
    const edge = t => { const s = W / Math.max(Math.abs(Math.cos(t)), Math.abs(Math.sin(t))); return [s * Math.cos(t), s * Math.sin(t)]; };
    // Top surface: polar strips from the hole edge out to the square boundary
    const rTop = o.holes[0].r;
    const n = Math.round(seg * (a1 - a0) / TAU);
    for (let i = 0; i < n; i++) {
      const ta = a0 + (a1 - a0) * i / n, tb = a0 + (a1 - a0) * (i + 1) / n;
      const ia = [rTop * Math.cos(ta), rTop * Math.sin(ta)], ib = [rTop * Math.cos(tb), rTop * Math.sin(tb)];
      const ea = edge(ta), eb = edge(tb);
      for (let k = 0; k < 4; k++) {
        const f0 = k / 4, f1 = (k + 1) / 4;
        const L = (p, q, f) => [p[0] + (q[0] - p[0]) * f, 0, p[1] + (q[1] - p[1]) * f];
        F.push({ p: [L(ia, ea, f0), L(ib, eb, f0), L(ib, eb, f1), L(ia, ea, f1)], c: o.cTop, top: true });
      }
    }
    // Horizontal bands where either the layer or the hole radius changes
    const ys = [...new Set([0, o.yBot, ...o.layers.flatMap(l => [l.y0, l.y1]), ...o.holes.flatMap(h => [h.y0, h.y1])])]
      .filter(y => y <= 0 && y >= o.yBot).sort((a, b) => b - a);
    const bands = [];
    for (let i = 0; i < ys.length - 1; i++) {
      const top = ys[i], bot = ys[i + 1], mid = (top + bot) / 2;
      // Split tall bands so the depth sort stays reliable
      const parts = Math.max(1, Math.round((top - bot) / 160));
      for (let k = 0; k < parts; k++) bands.push({ top: top - (top - bot) * k / parts, bot: top - (top - bot) * (k + 1) / parts, c: layerAt(mid).c, r: holeAt(mid) });
    }
    const step = 160;
    const strip = (from, to, mk, c) => {
      const pieces = Math.max(1, Math.round(Math.abs(to - from) / step));
      for (let k = 0; k < pieces; k++) {
        const u0 = from + (to - from) * k / pieces, u1 = from + (to - from) * (k + 1) / pieces;
        F.push({ p: mk(u0, u1), c });
      }
    };
    bands.forEach(b => {
      // Outer sides
      strip(-W, cut ? 0 : W, (u0, u1) => [[W, b.bot, u0], [W, b.bot, u1], [W, b.top, u1], [W, b.top, u0]], b.c);
      strip(-W, W, (u0, u1) => [[-W, b.bot, u1], [-W, b.bot, u0], [-W, b.top, u0], [-W, b.top, u1]], b.c);
      strip(-W, cut ? 0 : W, (u0, u1) => [[u1, b.bot, W], [u0, b.bot, W], [u0, b.top, W], [u1, b.top, W]], b.c);
      strip(-W, W, (u0, u1) => [[u0, b.bot, -W], [u1, b.bot, -W], [u1, b.top, -W], [u0, b.top, -W]], b.c);
      if (cut) {
        // Section planes x = 0 and z = 0, from the hole outwards
        strip(b.r, W, (u0, u1) => [[u0, b.bot, 0], [u1, b.bot, 0], [u1, b.top, 0], [u0, b.top, 0]], b.c);
        strip(b.r, W, (u0, u1) => [[0, b.bot, u1], [0, b.bot, u0], [0, b.top, u0], [0, b.top, u1]], b.c);
      }
    });
  }

  /* ---------- Shared electrical parts (transformer, connectors, cables, leads) ---------- */
  const COL = {
    steel: "#a2abb1", steelIn: "#737c82", steelCut: "#c3cacd", galv: "#b9c1c6",
    rubber: "#2b3035", rubberCut: "#40464c", shrink: "#16191c", connector: "#4a5057",
    cable: "#2f3439", secondary: "#5d6b78", pvc: "#9fa8ae", pvcEnd: "#6f777c",
    copper: "#c97c3c", rodCopper: "#b86a2e", weld: "#8c8f86",
    concrete: "#bcb8ae", concreteCut: "#c6c2b8", grass: "#5f7d3b", topsoil: "#5b4331", subsoil: "#8b6b47",
    asphalt: "#45484d", asphaltTop: "#4f5257", baseCourse: "#a29a89", subgrade: "#8b6b47",
    yellow: "#f2b70f", yellowDark: "#c99607", glass: "#dce8f2", glassRib: "#b9cfe0", lamp: "#fff3c4",
    alu: "#c6cbcf", aluDark: "#8f979c", bolt: "#d9dde0", gasket: "#1d2023", lens: "#9fd2ff", label: "#f4d35e"
  };

  // Transformer, connectors, cables and the secondary lead inside a base whose conduit hubs
  // sit at height yHub and whose floor is at yFloor. Returns the parts in order.
  function electrical(yHub, yFloor, ySecTop, W) {
    const tb = yFloor + 4, tt = tb + 62, tm = (tb + tt) / 2;
    const conA = [[80, yHub - 20, 70], [12, yHub - 20, 110]];
    const conB = [[-80, yHub - 20, -70], [-12, yHub - 20, -110]];
    return {
      transformer: F => {
        box(F, -82, 82, tb, tt, -48, 48, COL.rubber);
        box(F, -40, 40, tt, tt + 1, -48, -20, COL.label);           // rating label
        cyl(F, { r1: 16, y0: tt, y1: tt + 14, cx: 0, cz: 0, seg: 12, c: COL.rubber });   // secondary lead boot
        [1, -1].forEach(s => tube(F, [[s * 82, tm, -s * 18], [s * 96, tm, -s * 18]], 10, { seg: 10, c: COL.rubber }));   // primary lead boots
      },
      connectors: F => {
        [conA, conB].forEach(([a, b]) => {
          const m = mul(addv(a, b), 0.5);
          tube(F, [a, mul(addv(a, m), 0.5)], 15, { seg: 10, c: COL.connector });        // plug
          tube(F, [mul(addv(a, m), 0.5), mul(addv(b, m), 0.5)], 18, { seg: 10, c: COL.shrink });  // heat-shrink over the mating joint
          tube(F, [mul(addv(b, m), 0.5), b], 15, { seg: 10, c: COL.connector });        // receptacle
        });
      },
      cables: F => {
        const run = s => [[s * (W + 70), yHub, 0], [s * 175, yHub, 0], [s * 140, yHub, 0], [s * 112, yHub - 4, s * 30]];
        tube(F, [...run(1), [100, yHub - 14, 55], conA[0]], 9, { smooth: 3, seg: 7, c: COL.cable });
        tube(F, [...run(-1), [-100, yHub - 14, -55], conB[0]], 9, { smooth: 3, seg: 7, c: COL.cable });
        // Transformer primary leads from the connectors to the transformer ends
        tube(F, [conA[1], [-38, yHub - 40, 98], [-72, tm + 20, 52], [-88, tm, 18]], 7, { smooth: 4, seg: 7, c: COL.cable });
        tube(F, [conB[1], [38, yHub - 40, -98], [72, tm + 20, -52], [88, tm, -18]], 7, { smooth: 4, seg: 7, c: COL.cable });
      },
      secondary: F => {
        const s1 = [0, ySecTop - 150, 0], s2 = [0, ySecTop - 95, 0];
        tube(F, [[0, tt + 14, 0], [45, tt + 70, 25], [35, (tt + s1[1]) / 2, 45], [-15, s1[1] - 40, 20], s1], 6, { smooth: 4, seg: 6, c: COL.secondary });
        tube(F, [s1, s2], 13, { seg: 10, c: COL.connector });
        tube(F, [mul(addv(s1, s2), 0.5).map((v, i) => i === 1 ? v - 8 : v), mul(addv(s1, s2), 0.5).map((v, i) => i === 1 ? v + 8 : v)], 15, { seg: 10, c: COL.shrink });
        tube(F, [s2, [0, ySecTop - 50, 0], [0, ySecTop, 0]], 6, { smooth: 3, seg: 6, c: COL.secondary });
      }
    };
  }

  function conduits(F, yHub, W) {
    [1, -1].forEach(s => {
      tube(F, [[s * 190, yHub, 0], [s * W, yHub, 0]], 31, { seg: 14, c: COL.pvc, cCap: COL.pvcEnd });
      tube(F, [[s * 150, yHub, 0], [s * 200, yHub, 0]], 37, { seg: 14, c: COL.galv, cCap: COL.steelIn });   // threaded hub on the base
    });
  }

  // Bare counterpoise in the trench, routed around the base on the side facing the viewer
  function counterpoise(F, y, R, W, lug) {
    const pts = [[-W, y, 0], [-R, y, 0]];
    for (let i = 1; i < 12; i++) { const t = Math.PI - Math.PI * i / 12; pts.push([R * Math.cos(t), y, R * Math.sin(t)]); }
    pts.push([R, y, 0], [W, y, 0]);
    tube(F, pts, 5, { seg: 6, c: COL.copper });
    tube(F, [lug, [lug[0] + 40, lug[1] - 10, 0], [R - 20, y + 10, 0], [R, y, 0]], 4, { smooth: 4, seg: 6, c: COL.copper });
    dome(F, { cx: R, cy: y, cz: 0, r: 13, p0: 0, p1: Math.PI, seg: 10, rings: 4, c: COL.weld });
  }

  /* ---------- The two installations ---------- */
  const MODELS = {
    elevated: {
      bounds: { yTop: 470, yBot: -1100, w: 700 },
      explodedTop: 1250,
      parts: cut => {
        const A0 = cut ? Math.PI / 2 : 0;
        const W = 700, yHub = -450;
        const el = electrical(yHub, -585, 20, W);
        return [
          { id: "fixture", anchor: [-40, 420, 40], off: [0, 760, 0], build: F => {
            cyl(F, { r1: 46, y0: 258, y1: 286, seg: 20, c: COL.yellow, bottom: false });
            cyl(F, { r1: 58, y0: 286, y1: 332, seg: 20, nv: 1, c: COL.yellow, cTop: COL.yellowDark });
            cyl(F, { r1: 55, y0: 332, y1: 404, seg: 20, nv: 6, top: false, bottom: false, band: j => j % 2 ? COL.glassRib : COL.glass, x: { op: 0.5 } });
            dome(F, { cx: 0, cy: 404, cz: 0, r: 55, p0: 0, p1: Math.PI / 2, seg: 20, rings: 4, c: COL.glass, x: { op: 0.5 } });
            cyl(F, { r1: 9, y0: 456, y1: 470, seg: 10, c: COL.yellowDark });
            dome(F, { cx: 0, cy: 368, cz: 0, r: 15, p0: 0, p1: Math.PI, seg: 10, rings: 4, c: COL.lamp });
            cyl(F, { r1: 8, y0: 332, y1: 356, seg: 8, c: COL.aluDark });
            F.push({ p: [[0, 372, 0]], c: "glow", glow: 150 });
          } },
          { id: "stem", anchor: [26, 200, 0], off: [0, 600, 0], build: F => {
            cyl(F, { r1: 27, y0: 128, y1: 258, seg: 16, nv: 2, c: COL.galv });
          } },
          { id: "coupling", anchor: [32, 100, 0], off: [0, 470, 0], build: F => {
            cyl(F, { r1: 34, y0: 58, y1: 70, seg: 6, c: COL.aluDark });         // hex wrench flats
            cyl(F, { r1: 31, y0: 70, y1: 88, seg: 16, c: COL.alu });
            cyl(F, { r1: 24, y0: 88, y1: 94, seg: 16, c: "#7a8288", top: false, bottom: false });           // machined break groove
            cyl(F, { r1: 31, y0: 94, y1: 128, seg: 16, c: COL.alu });
          } },
          { id: "plate", anchor: [-150, 40, 90], off: [0, 330, 0], build: F => {
            cyl(F, { r1: 195, y0: 28, y1: 41, seg: 36, nr: 2, c: COL.steel, cTop: "#97a1a7" });
            cyl(F, { r0: 0, r1: 37, y0: 41, y1: 58, seg: 6, c: COL.steel });     // threaded hub for the coupling
            for (let k = 0; k < 6; k++) {
              const t = TAU * k / 6 + Math.PI / 6, x = 172 * Math.cos(t), z = 172 * Math.sin(t);
              cyl(F, { r1: 11, y0: 43, y1: 50, cx: x, cz: z, seg: 6, c: COL.bolt, bottom: false });
              cyl(F, { r1: 15, y0: 41, y1: 43, cx: x, cz: z, seg: 8, c: COL.bolt, bottom: false });
            }
          } },
          { id: "gasket", anchor: [-180, 26, -60], off: [0, 220, 0], build: F => {
            cyl(F, { r0: 150, r1: 195, y0: 25, y1: 28, seg: 32, c: COL.gasket });
          } },
          { id: "can", anchor: [-108, -260, 106], off: [0, 0, 0], build: F => {
            cyl(F, { r0: 148, r1: 152, y0: -585, y1: 15, a0: A0, seg: 36, nv: 4, c: COL.steel, cIn: COL.steelIn, cCut: COL.steelCut });
            cyl(F, { r1: 152, y0: -592, y1: -585, a0: A0, seg: 36, c: COL.steel, cTop: COL.steelIn, cCut: COL.steelCut });
            cyl(F, { r0: 148, r1: 195, y0: 15, y1: 25, a0: A0, seg: 36, c: COL.steel, cTop: "#b4bcc1", cCut: COL.steelCut });
            box(F, 152, 178, -215, -185, -12, 12, COL.copper);                   // ground lug
            cyl(F, { r1: 6, y0: -196, y1: -170, cx: 165, cz: 0, seg: 6, c: COL.bolt });
          } },
          { id: "transformer", anchor: [0, -545, 48], off: [250, 380, 380], build: el.transformer },
          { id: "connectors", anchor: [46, -470, 92], off: [360, 300, 240], build: el.connectors },
          { id: "secondary", anchor: [30, -300, 40], off: [-170, 230, 300], build: el.secondary },
          { id: "cables", anchor: [560, -450, 20], off: [0, 0, 0], build: el.cables },
          { id: "conduits", anchor: [-420, -420, 20], offFn: c => [Math.sign(c[0]) * 230, 0, 0], build: F => conduits(F, yHub, W) },
          { id: "counterpoise", anchor: [230, -250, 230], off: [0, 160, 120], build: F => {
            counterpoise(F, -250, 330, W, [178, -200, 0]);
          } },
          { id: "groundrod", anchor: [560, -760, 0], off: [120, -60, 140], build: F => {
            tube(F, [[560, -250, 0], [560, -1060, 0]], 8, { seg: 10, c: COL.rodCopper });
            cyl(F, { r1: 9, y0: -1080, y1: -1060, cx: 560, cz: 0, seg: 10, c: COL.rodCopper });
            tube(F, [[560, -250, 0], [600, -250, 0]], 5, { seg: 6, c: COL.copper });
            dome(F, { cx: 560, cy: -250, cz: 0, r: 15, p0: 0, p1: Math.PI, seg: 10, rings: 4, c: COL.weld });
          } },
          { id: "collar", anchor: [-200, 8, 200], off: [0, -260, 0], fade: 0.5, build: F => {
            cyl(F, { r0: 152, r1: 300, y0: -300, y1: 25, drop: 25, a0: A0, seg: 36, nv: 2, nr: 2, c: COL.concrete, cCut: COL.concreteCut, inner: false, bottom: false });
          } },
          { id: "soil", anchor: [-520, 0, 420], off: [0, 0, 0], fade: 0.22, ground: true, build: F => ground(F, {
            W, yBot: -1100, cut, cTop: COL.grass,
            layers: [{ y0: -150, y1: 0, c: COL.topsoil }, { y0: -1100, y1: -150, c: COL.subsoil }],
            holes: [{ y0: -300, y1: 0, r: 300 }, { y0: -592, y1: -300, r: 152 }, { y0: -1100, y1: -592, r: 0 }]
          }) }
        ];
      }
    },
    inset: {
      bounds: { yTop: 10, yBot: -900, w: 650 },
      explodedTop: 700,
      parts: cut => {
        const A0 = cut ? Math.PI / 2 : 0;
        const W = 650, yHub = -300;
        const el = electrical(yHub, -380, -42, W);
        return [
          { id: "insetfix", anchor: [-95, 4, 70], off: [0, 420, 0], build: F => {
            cyl(F, { r1: 160, y0: -14, y1: 5, drop: 6, seg: 36, nr: 2, c: COL.alu, cTop: "#b7bdc1", cBot: COL.aluDark });
            cyl(F, { r1: 136, y0: -42, y1: -14, seg: 32, nv: 1, c: COL.aluDark, top: false });
            [1, -1].forEach(s => {
              box(F, -34, 34, -4, 5, s > 0 ? 66 : -112, s > 0 ? 112 : -66, "#30353a");   // lens recess
              F.push({ p: [[-28, 6, s * 104], [28, 6, s * 104], [28, -2, s * 74], [-28, -2, s * 74]].map(p => p), c: COL.lens, op: 0.95 });
              F.push({ p: [[0, 4, s * 122]], c: "glow", glow: 95 });
            });
            box(F, -48, 48, 5, 6, -18, 18, "#959da2");                            // cast nameplate
          } },
          { id: "bolts", anchor: [127, 6, 73], off: [0, 600, 0], build: F => {
            for (let k = 0; k < 6; k++) {
              const t = TAU * k / 6 + Math.PI / 6, x = 147 * Math.cos(t), z = 147 * Math.sin(t);
              cyl(F, { r1: 9, y0: -1, y1: 5, cx: x, cz: z, seg: 6, c: COL.bolt });
              cyl(F, { r1: 5, y0: -70, y1: -1, cx: x, cz: z, seg: 8, nv: 2, c: "#b5bcc0" });
            }
          } },
          { id: "oring", anchor: [-150, -44, -40], off: [0, 300, 0], build: F => {
            cyl(F, { r0: 150, r1: 158, y0: -46, y1: -42, seg: 32, c: COL.gasket });
          } },
          { id: "spacer", anchor: [-162, -54, 30], off: [0, 220, 0], build: F => {
            cyl(F, { r0: 136, r1: 164, y0: -60, y1: -46, seg: 36, c: COL.steel, cIn: COL.steelIn });
          } },
          { id: "can868", anchor: [-108, -220, 106], off: [0, 0, 0], build: F => {
            cyl(F, { r0: 148, r1: 152, y0: -380, y1: -70, a0: A0, seg: 36, nv: 3, c: COL.steel, cIn: COL.steelIn, cCut: COL.steelCut });
            cyl(F, { r1: 152, y0: -387, y1: -380, a0: A0, seg: 36, c: COL.steel, cTop: COL.steelIn, cCut: COL.steelCut });
            cyl(F, { r0: 140, r1: 170, y0: -70, y1: -60, a0: A0, seg: 36, c: COL.steel, cTop: "#b4bcc1", cCut: COL.steelCut });
            box(F, 152, 176, -165, -135, -12, 12, COL.copper);
          } },
          { id: "transformer", anchor: [0, -345, 48], off: [250, 300, 380], build: el.transformer },
          { id: "connectors", anchor: [46, -320, 92], off: [360, 240, 240], build: el.connectors },
          { id: "secondary", anchor: [30, -200, 40], off: [-170, 170, 300], build: el.secondary },
          { id: "cables", anchor: [520, -300, 20], off: [0, 0, 0], build: el.cables },
          { id: "conduits", anchor: [-420, -270, 20], offFn: c => [Math.sign(c[0]) * 220, 0, 0], build: F => conduits(F, yHub, W) },
          { id: "counterpoise", anchor: [190, -200, 190], off: [0, 120, 120], build: F => {
            counterpoise(F, -200, 275, W, [176, -150, 0]);
          } },
          { id: "sealant", anchor: [-125, 0, 125], off: [0, 140, 0], build: F => {
            cyl(F, { r0: 162, r1: 190, y0: -60, y1: 0, a0: A0, seg: 36, c: "#1a1c1e", cCut: "#2a2d30", bottom: false });
          } },
          { id: "encasement", anchor: [-155, -220, 155], off: [0, -200, 0], fade: 0.45, build: F => {
            cyl(F, { r0: 152, r1: 240, y0: -430, y1: -60, a0: A0, seg: 36, nv: 2, nr: 2, c: COL.concrete, cCut: COL.concreteCut, inner: false, bottom: false });
            cyl(F, { r0: 190, r1: 240, y0: -60, y1: 0, a0: A0, seg: 36, c: COL.concrete, cCut: COL.concreteCut, inner: false, bottom: false });
            cyl(F, { r1: 152, y0: -430, y1: -387, a0: A0, seg: 36, c: COL.concrete, cCut: COL.concreteCut, wall: false, bottom: false });
          } },
          { id: "pavement", anchor: [-480, 0, 380], off: [0, 0, 0], fade: 0.22, ground: true, build: F => ground(F, {
            W, yBot: -900, cut, cTop: COL.asphaltTop,
            layers: [{ y0: -120, y1: 0, c: COL.asphalt }, { y0: -380, y1: -120, c: COL.baseCourse }, { y0: -900, y1: -380, c: COL.subgrade }],
            holes: [{ y0: -430, y1: 0, r: 240 }, { y0: -900, y1: -430, r: 0 }]
          }) }
        ];
      }
    }
  };

  /* ---------- Viewer ---------- */
  const LIGHT = unit([-0.35, 0.8, 0.5]);
  const rgbCache = new Map();
  function shade(c, k) {
    let rgb = rgbCache.get(c);
    if (!rgb) { rgb = d3.rgb(c); rgbCache.set(c, rgb); }
    return `rgb(${Math.round(Math.min(255, rgb.r * k))},${Math.round(Math.min(255, rgb.g * k))},${Math.round(Math.min(255, rgb.b * k))})`;
  }
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let uid = 0;

  function Viewer(host, key) {
    const model = MODELS[key];
    const id = "d3d" + (++uid);
    const st = { yaw: 0.62, pitch: 0.36, e: 0, exploded: false, cut: true, labels: true, ground: true, light: true, spin: false, sel: null, hover: null, t: d3.zoomIdentity };
    let parts = [];
    let pending = false;

    host.innerHTML = `
      <div class="d3d-stage">
        <div class="d3d-bar">
          <span class="seg" role="group" data-k="view">
            <button type="button" data-v="0" aria-pressed="true"></button><button type="button" data-v="1" aria-pressed="false"></button>
          </span>
          <span class="d3d-toggles">
            <button type="button" class="btn" data-t="cut" aria-pressed="true"></button>
            <button type="button" class="btn" data-t="labels" aria-pressed="true"></button>
            <button type="button" class="btn" data-t="ground" aria-pressed="true"></button>
            <button type="button" class="btn" data-t="light" aria-pressed="true"></button>
            <button type="button" class="btn" data-t="spin" aria-pressed="false"></button>
          </span>
          <span class="d3d-zoom">
            <button type="button" class="btn" data-z="in" aria-label="+">+</button><button type="button" class="btn" data-z="out" aria-label="−">−</button>
            <button type="button" class="btn" data-z="reset"></button>
          </span>
        </div>
        <svg class="d3d-svg" tabindex="0" role="img"></svg>
        <p class="d3d-hint"></p>
      </div>
      <div class="d3d-below">
        <ol class="d3d-parts"></ol>
        <aside class="panel d3d-info" aria-live="polite"></aside>
      </div>`;
    const svg = d3.select(host).select("svg");
    const defs = svg.append("defs");
    const grad = defs.append("radialGradient").attr("id", id + "-glow");
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#fff7d6").attr("stop-opacity", 0.95);
    grad.append("stop").attr("offset", "35%").attr("stop-color", "#ffe9a0").attr("stop-opacity", 0.45);
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#ffe9a0").attr("stop-opacity", 0);
    const gFaces = svg.append("g").attr("class", "d3d-faces");
    const gLabels = svg.append("g").attr("class", "d3d-labels");
    const gTip = svg.append("g").attr("class", "d3d-tip").style("pointer-events", "none");

    const content = () => AGL.d("DETAIL");
    const order = () => parts.map(p => p.id);

    function rebuild() {
      parts = model.parts(st.cut).map(p => {
        const F = [];
        p.build(F);
        F.forEach(f => {
          const c = f.p.reduce((s, q) => addv(s, q), [0, 0, 0]).map(v => v / f.p.length);
          f.off = p.offFn ? p.offFn(c) : p.off;
        });
        return Object.assign({}, p, { faces: F });
      });
    }

    function size() {
      const w = host.querySelector(".d3d-stage").clientWidth || 1000;
      const W = clamp(Math.round(w), 340, 1100);
      const narrow = w < 700;
      // Leave room for the bubble columns as the parts spread out
      const grow = st.labels ? 0.2 * st.e : 0;
      return { W, H: narrow ? Math.round(W * 1.15) : Math.round(W * (0.66 + grow)), narrow };
    }

    function camera(W, H, narrow) {
      const b = model.bounds, e = st.e;
      const top = b.yTop + (model.explodedTop - b.yTop) * e;
      const span = top - b.yBot;
      const sideRoom = !narrow && st.labels && e > 0.5 ? 500 : 40;
      const k = Math.min((W - sideRoom) / (b.w * 3.2), (H - 40) / (span * 1.12));
      return { k, cy: (top + b.yBot) / 2, W, H, D: 4200 };
    }

    function projector(cam) {
      const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      const t = st.t;
      return p => {
        const x = p[0] * cy - p[2] * sy, z = p[0] * sy + p[2] * cy, y = p[1] - cam.cy;
        const y2 = y * cp - z * sp, z2 = y * sp + z * cp;
        const f = cam.D / (cam.D - z2);
        return [t.applyX(cam.W / 2 + x * f * cam.k), t.applyY(cam.H / 2 - y2 * f * cam.k), z2, x, y2];
      };
    }

    function opacityOf(p) {
      let o = 1;
      if (p.fade !== undefined) o *= 1 - st.e * (1 - p.fade);
      if (st.sel && st.sel !== p.id) o *= 0.22;
      return o;
    }

    function render() {
      pending = false;
      const { W, H, narrow } = size();
      svg.attr("viewBox", `0 0 ${W} ${H}`).style("aspect-ratio", `${W} / ${H}`).attr("aria-label", AGL.t("3D view: {name}", { name: content().models[key] }));
      const cam = camera(W, H, narrow);
      const proj = projector(cam);
      const out = [];
      parts.forEach(p => {
        if (p.ground && !st.ground) return;
        const po = opacityOf(p);
        if (po <= 0.01) return;
        const hov = st.hover === p.id;
        p.faces.forEach(f => {
          const off = mul(f.off, st.e);
          if (f.c === "glow") {
            if (!st.light) return;
            const q = proj(addv(f.p[0], off));
            out.push({ part: p, glow: true, d: `M${q[0] - f.glow * cam.k * st.t.k},${q[1]}a${f.glow * cam.k * st.t.k},${f.glow * cam.k * st.t.k} 0 1,0 ${2 * f.glow * cam.k * st.t.k},0a${f.glow * cam.k * st.t.k},${f.glow * cam.k * st.t.k} 0 1,0 ${-2 * f.glow * cam.k * st.t.k},0`, z: q[2] + 60, op: po });
            return;
          }
          const q = f.p.map(v => proj(addv(v, off)));
          let z = 0;
          for (const v of q) z += v[2];
          z /= q.length;
          let k = 1;
          if (q.length >= 3) {
            const n = unit(cross(sub([q[1][3], q[1][4], q[1][2]], [q[0][3], q[0][4], q[0][2]]), sub([q[2][3], q[2][4], q[2][2]], [q[0][3], q[0][4], q[0][2]])));
            k = 0.42 + 0.62 * Math.abs(dot(n, LIGHT));
          }
          if (hov) k *= 1.18;
          const fill = shade(f.c, k);
          out.push({ part: p, d: "M" + q.map(v => v[0].toFixed(1) + "," + v[1].toFixed(1)).join("L") + "Z", fill, z, op: po * (f.op === undefined ? 1 : f.op) });
        });
      });
      out.sort((a, b) => a.z - b.z);
      const glowFill = `url(#${id}-glow)`;
      gFaces.selectAll("path").data(out).join("path")
        .attr("d", d => d.d)
        .attr("style", d => d.glow ? `fill:${glowFill};fill-opacity:${d.op};stroke:none;pointer-events:none`
          : `fill:${d.fill};fill-opacity:${d.op};stroke:${d.op < 0.99 ? "none" : d.fill}`);
      renderLabels(proj, W, H, narrow);
    }
    const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(render); } };

    function wrap(text, max) {
      const words = String(text).split(/\s+/), lines = [];
      let line = "";
      words.forEach(w => {
        if ((line + " " + w).trim().length > max && line) { lines.push(line); line = w; }
        else line = (line + " " + w).trim();
      });
      if (line) lines.push(line);
      return lines;
    }

    function renderLabels(proj, W, H, narrow) {
      gLabels.selectAll("*").remove();
      const show = st.labels && st.e > 0.6;
      if (!show) return;
      const C = content(), rtl = AGL.lang === "he";
      const ids = order();
      const items = parts.filter(p => !(p.ground && !st.ground)).map(p => {
        const q = proj(addv(p.anchor, mul(p.off || (p.offFn ? p.offFn(p.anchor) : [0, 0, 0]), st.e)));
        return { p, n: ids.indexOf(p.id) + 1, ax: q[0], ay: q[1] };
      });
      if (narrow) {
        // Numbered pins, pushed apart with a collision force and tied back to their parts
        const nodes = items.map(it => ({ it, x: it.ax, y: it.ay }));
        const sim = d3.forceSimulation(nodes)
          .force("x", d3.forceX(d => d.it.ax).strength(0.25))
          .force("y", d3.forceY(d => d.it.ay).strength(0.25))
          .force("collide", d3.forceCollide(19))
          .stop();
        for (let i = 0; i < 120; i++) sim.tick();
        nodes.forEach(nd => {
          nd.x = clamp(nd.x, 18, W - 18);
          nd.y = clamp(nd.y, 18, H - 18);
          const it = nd.it;
          const g = gLabels.append("g").attr("class", "d3d-pin" + (st.sel === it.p.id ? " on" : "")).style("cursor", "pointer")
            .on("click", () => select(it.p.id));
          g.append("path").attr("class", "lead").attr("d", `M${it.ax},${it.ay}L${nd.x},${nd.y}`);
          g.append("circle").attr("class", "dot").attr("cx", it.ax).attr("cy", it.ay).attr("r", 3);
          g.append("circle").attr("class", "pin").attr("cx", nd.x).attr("cy", nd.y).attr("r", 15);
          g.append("text").attr("x", nd.x).attr("y", nd.y + 5).attr("text-anchor", "middle").text(it.n);
        });
        return;
      }
      const bw = 228, gap = 8, title = 15, body = 13;
      items.forEach(it => {
        const info = C.parts[it.p.id];
        it.tlines = wrap(info.name, rtl ? 24 : 22).slice(0, 2);
        it.lines = wrap(info.short, rtl ? 30 : 27).slice(0, 3);
        it.h = 16 + it.tlines.length * 18 + it.lines.length * 17;
      });
      // Each bubble goes to the side its part is on; the fuller side gives its most central items away
      let left = items.filter(it => it.ax < W / 2), right = items.filter(it => it.ax >= W / 2);
      const cap = Math.ceil(items.length / 2);
      while (left.length > cap) { left.sort((a, b) => a.ax - b.ax); right.push(left.pop()); }
      while (right.length > cap) { right.sort((a, b) => b.ax - a.ax); left.push(right.pop()); }
      const place = (col, x) => {
        col.sort((a, b) => a.ay - b.ay);
        let y = 10;
        col.forEach(it => { it.by = Math.max(y, it.ay - it.h / 2); y = it.by + it.h + gap; });
        let over = (col.length ? col[col.length - 1].by + col[col.length - 1].h : 0) - (H - 10);
        for (let i = col.length - 1; i >= 0 && over > 0; i--) {
          const limit = i ? col[i - 1].by + col[i - 1].h + gap : 10;
          const shift = Math.min(over, col[i].by - limit);
          for (let j = i; j < col.length; j++) col[j].by -= shift;
          over -= shift;
          if (over > 0 && i) { /* continue moving the ones above */ }
        }
        col.forEach(it => { it.bx = x; });
      };
      place(left, 12);
      place(right, W - 12 - bw);
      [...left.map(i => [i, true]), ...right.map(i => [i, false])].forEach(([it, isLeft]) => {
        const info = C.parts[it.p.id];
        const on = st.sel === it.p.id;
        const g = gLabels.append("g").attr("class", "d3d-bubble" + (on ? " on" : "")).style("cursor", "pointer")
          .on("click", () => select(it.p.id))
          .on("pointerenter", () => { st.hover = it.p.id; schedule(); })
          .on("pointerleave", () => { st.hover = null; schedule(); });
        const ex = isLeft ? it.bx + bw : it.bx, ey = it.by + it.h / 2;
        const mx = isLeft ? ex + 18 : ex - 18;
        g.append("path").attr("class", "lead").attr("d", `M${it.ax},${it.ay}L${mx},${ey}L${ex},${ey}`);
        g.append("circle").attr("class", "dot").attr("cx", it.ax).attr("cy", it.ay).attr("r", 4);
        g.append("rect").attr("x", it.bx).attr("y", it.by).attr("width", bw).attr("height", it.h).attr("rx", 6);
        // Number badge on the leading side, text after it
        const nx = rtl ? it.bx + bw - 20 : it.bx + 20;
        g.append("circle").attr("class", "nb").attr("cx", nx).attr("cy", it.by + 21).attr("r", 11);
        g.append("text").attr("class", "n").attr("x", nx).attr("y", it.by + 26).attr("text-anchor", "middle").attr("direction", "ltr").text(it.n);
        const tx = rtl ? it.bx + bw - 38 : it.bx + 38;
        it.tlines.forEach((l, i) => g.append("text").attr("class", "t").attr("x", tx).attr("y", it.by + 26 + i * 18).attr("direction", rtl ? "rtl" : "ltr").attr("text-anchor", "start").attr("font-size", title).text(l));
        const y0 = it.by + 26 + it.tlines.length * 18;
        it.lines.forEach((l, i) => g.append("text").attr("class", "s").attr("x", tx).attr("y", y0 + i * 17).attr("direction", rtl ? "rtl" : "ltr").attr("text-anchor", "start").attr("font-size", body).text(l));
      });
    }

    function tip(ev) {
      gTip.selectAll("*").remove();
      if (!st.hover || st.e > 0.6 && st.labels) return;
      const [x, y] = d3.pointer(ev, svg.node());
      const name = content().parts[st.hover].name;
      const rtl = AGL.lang === "he";
      const w = name.length * 8.2 + 24;
      const { W } = size();
      const bx = clamp(x + 14, 4, W - w - 4);
      gTip.append("rect").attr("x", bx).attr("y", y - 34).attr("width", w).attr("height", 28).attr("rx", 5);
      gTip.append("text").attr("x", rtl ? bx + w - 12 : bx + 12).attr("y", y - 15).attr("direction", rtl ? "rtl" : "ltr").attr("text-anchor", "start").text(name);
    }

    function renderInfo() {
      const C = content(), ids = order();
      host.querySelector(".d3d-parts").innerHTML = ids.map((pid, i) =>
        `<li><button type="button" data-p="${pid}" aria-pressed="${st.sel === pid}"><span class="pn">${i + 1}</span>${esc(C.parts[pid].name)}</button></li>`).join("");
      const box = host.querySelector(".d3d-info");
      if (!st.sel) {
        box.innerHTML = `<span class="tag">${esc(AGL.t("Parts"))}</span><h4>${esc(C.models[key])}</h4><p>${esc(C.intro[key])}</p><p class="muted">${esc(AGL.t("Select a part in the view or in the list to read about it."))}</p>`;
        return;
      }
      const P = C.parts[st.sel];
      box.innerHTML = `<span class="tag">${ids.indexOf(st.sel) + 1} · ${esc(C.models[key])}</span><h4>${esc(P.name)}</h4><p>${esc(P.text)}</p>
        ${P.specs && P.specs.length ? `<dl>${P.specs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : ""}
        <button type="button" class="btn" data-clear>${esc(AGL.t("Show all parts"))}</button>`;
    }

    function select(pid) {
      st.sel = st.sel === pid ? null : pid;
      renderInfo();
      schedule();
    }

    function setLabels() {
      const q = s => host.querySelector(s);
      const [a, b] = host.querySelectorAll('[data-k="view"] button');
      a.textContent = AGL.t("Assembled");
      b.textContent = AGL.t("Exploded");
      q('[data-t="cut"]').textContent = AGL.t("Cutaway");
      q('[data-t="labels"]').textContent = AGL.t("Labels");
      q('[data-t="ground"]').textContent = AGL.t("Ground");
      q('[data-t="light"]').textContent = AGL.t("Light on");
      q('[data-t="spin"]').textContent = AGL.t("Auto-rotate");
      q('[data-z="reset"]').textContent = AGL.t("Reset view");
      q('[data-z="in"]').setAttribute("aria-label", AGL.t("Zoom in"));
      q('[data-z="out"]').setAttribute("aria-label", AGL.t("Zoom out"));
      q(".d3d-hint").textContent = AGL.t("Drag to rotate · scroll or pinch to zoom · select a part for details");
      host.querySelector('[data-k="view"]').setAttribute("aria-label", AGL.t("View"));
    }

    function explode(on) {
      st.exploded = on;
      host.querySelectorAll('[data-k="view"] button').forEach(b => b.setAttribute("aria-pressed", String((b.dataset.v === "1") === on)));
      const target = on ? 1 : 0;
      if (reduceMotion()) { st.e = target; schedule(); return; }
      d3.select(host).transition("explode").duration(1100).ease(d3.easeCubicInOut)
        .tween("e", () => { const i = d3.interpolateNumber(st.e, target); return t => { st.e = i(t); render(); }; });
    }

    // Controls
    host.querySelector('[data-k="view"]').addEventListener("click", e => {
      const b = e.target.closest("button");
      if (b) explode(b.dataset.v === "1");
    });
    let timer = null;
    host.querySelector(".d3d-toggles").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      const k = b.dataset.t;
      st[k] = !st[k];
      b.setAttribute("aria-pressed", String(st[k]));
      if (k === "cut") rebuild();
      if (k === "spin") {
        if (st.spin) { let last = 0; timer = d3.timer(el => { st.yaw += (el - last) * 0.00035; last = el; render(); }); }
        else if (timer) { timer.stop(); timer = null; }
      }
      schedule();
    });
    const zoom = d3.zoom().scaleExtent([0.6, 5])
      .filter(ev => ev.type === "wheel" || (ev.type === "touchstart" && ev.touches.length > 1) || ev.type === "touchmove")
      .on("zoom", ev => { st.t = ev.transform; schedule(); });
    svg.call(zoom).on("dblclick.zoom", null);
    host.querySelector(".d3d-zoom").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.z === "in") svg.transition().duration(250).call(zoom.scaleBy, 1.3);
      else if (b.dataset.z === "out") svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.3);
      else { st.yaw = 0.62; st.pitch = 0.36; svg.call(zoom.transform, d3.zoomIdentity); schedule(); }
    });
    svg.call(d3.drag()
      .filter(ev => !ev.ctrlKey && !ev.button && (!ev.touches || ev.touches.length === 1))
      .clickDistance(5)
      .on("drag", ev => {
        st.yaw -= ev.dx * 0.008;
        st.pitch = clamp(st.pitch + ev.dy * 0.006, -0.05, 1.3);
        schedule();
      }));
    svg.on("keydown", ev => {
      const k = ev.key;
      if (k === "ArrowLeft") st.yaw += 0.1;
      else if (k === "ArrowRight") st.yaw -= 0.1;
      else if (k === "ArrowUp") st.pitch = clamp(st.pitch + 0.08, -0.05, 1.3);
      else if (k === "ArrowDown") st.pitch = clamp(st.pitch - 0.08, -0.05, 1.3);
      else if (k === "+" || k === "=") svg.call(zoom.scaleBy, 1.2);
      else if (k === "-") svg.call(zoom.scaleBy, 1 / 1.2);
      else return;
      ev.preventDefault();
      schedule();
    });
    gFaces.on("pointermove", ev => {
      const d = d3.select(ev.target).datum();
      const pid = d && d.part ? d.part.id : null;
      if (pid !== st.hover) { st.hover = pid; schedule(); }
      tip(ev);
    }).on("pointerleave", () => { st.hover = null; gTip.selectAll("*").remove(); schedule(); })
      .on("click", ev => {
        const d = d3.select(ev.target).datum();
        if (d && d.part) select(d.part.id);
      });
    host.querySelector(".d3d-below").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-clear")) select(st.sel);
      else if (b.dataset.p) select(b.dataset.p);
    });
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(host.querySelector(".d3d-stage"));

    rebuild();
    setLabels();
    renderInfo();
    render();
    return { relang() { setLabels(); renderInfo(); render(); }, render: schedule };
  }

  // Shared with the 3D vault tour (module F)
  AGL.D3 = { cyl, box, tube, dome, spline, unit, cross, dot, sub, addv, mul, shade, clamp };

  AGL.initDetail3D = function () {
    const hosts = document.querySelectorAll(".d3d[data-model]");
    if (!window.d3) {
      hosts.forEach(h => { h.innerHTML = `<p class="callout">${esc(AGL.t("The 3D viewer needs an internet connection to load d3.js. Connect and reload the page."))}</p>`; });
      return;
    }
    const viewers = [...hosts].map(h => Viewer(h, h.dataset.model));
    AGL.onLang(() => viewers.forEach(v => v.relang()));
    // Lessons start hidden; draw again when one becomes visible so the size is right
    document.addEventListener("agl:lesson", () => viewers.forEach(v => v.render()));
  };
})();
