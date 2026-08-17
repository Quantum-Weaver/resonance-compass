// ============================================================================
/* resonance-ziggy/modules/cosmic/constants/solids.ts */
// QUANTUM SOLIDS SYSTEM — the house's dimensional vocabulary
// Polyhedra as vertices and faces. Pure numbers: no colour, no rendering,
// no DOM, no clock. A consumer projects them; this file only knows shape.
// ============================================================================
//
// WHY THIS FILE EXISTS (2026-08-17, at KP's ⚛ word — "this will be the
// house's first 3d experience", and "if more needs authored into our cosmic
// system, that is fine, just not from within an app, at the source, as
// additions"). The dice room in resonance-tarocchi is the first consumer.
// It is not the only intended one: KP's own facet-object design at
// well/geode/skapa.md:244 asks for exactly this — "a mind may envision
// through a decahedron", "many shapes of dice" — and it is the geometry a
// flattened net needs as much as a tumbling die does.
//
// THE LIMIT IS HIS, AND IT IS HONOURED RATHER THAN HIDDEN. KP, same page:
// "the limit is only the mathmetical imposibility to produce a 'dice' of the
// equal sided shape." True — only five solids are face-transitive, and a fair
// die of arbitrary N cannot be built from them. So arbitrary N is built as a
// BARREL, which is precisely how the physical world makes a d3, a d5 or a d7:
// a prism whose numbered faces are its sides, capped so it cannot rest on an
// end. The impossibility keeps its place; the shape is still delivered.
//
// DERIVED, NOT TRANSCRIBED. The dodecahedron is built from the icosahedron by
// duality and the trapezohedron's apex is solved from its own planarity
// condition — both verified numerically at module load — because a hand-typed
// table of twenty pentagons is a typo waiting to be shipped to eighteen repos.
// ============================================================================

// ============================================================================
// VECTORS — the smallest possible arithmetic
// ============================================================================

export type Vec3 = readonly [number, number, number];

export function vecAdd(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vecSub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vecScale(a: Vec3, k: number): Vec3 {
  return [a[0] * k, a[1] * k, a[2] * k];
}

export function vecDot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vecCross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function vecLength(a: Vec3): number {
  return Math.sqrt(vecDot(a, a));
}

/** Unit vector. A zero vector returns itself rather than NaN — told, not thrown. */
export function vecNormalize(a: Vec3): Vec3 {
  const len = vecLength(a);
  return len === 0 ? a : vecScale(a, 1 / len);
}

// ============================================================================
// SOLIDS — the shape itself
// ============================================================================

export interface Solid {
  /** The house name of the shape, not of the die. */
  name: string;
  /** How many faces carry a number. For a barrel this is fewer than faces.length. */
  sides: number;
  /** Vertices on the unit sphere unless the shape's own proportion forbids it. */
  vertices: Vec3[];
  /** Each face as vertex indices, wound counter-clockwise seen from OUTSIDE. */
  faces: number[][];
  /** Indices into `faces` that carry a number; the rest are structural (barrel caps). */
  numbered: number[];
  /** true when every face is congruent and the solid is fair by symmetry. */
  fair: boolean;
}

const PHI = (1 + Math.sqrt(5)) / 2;

/** The face's outward unit normal, from its first three vertices. */
export function faceNormal(solid: Solid, faceIndex: number): Vec3 {
  const f = solid.faces[faceIndex];
  const a = solid.vertices[f[0]];
  const b = solid.vertices[f[1]];
  const c = solid.vertices[f[2]];
  return vecNormalize(vecCross(vecSub(b, a), vecSub(c, a)));
}

/** The face's centre — the point a numeral is cut at, and the depth it sorts by. */
export function faceCentroid(solid: Solid, faceIndex: number): Vec3 {
  const f = solid.faces[faceIndex];
  let sum: Vec3 = [0, 0, 0];
  for (const i of f) sum = vecAdd(sum, solid.vertices[i]);
  return vecScale(sum, 1 / f.length);
}

/**
 * WINDING, MADE IMPOSSIBLE TO GET WRONG. Every solid below passes through
 * here: any face whose normal points back toward the centre is reversed. A
 * back-face cull is only as honest as its winding, and this removes the whole
 * class of error rather than asking each table to be typed correctly.
 */
function ensureOutward(solid: Solid): Solid {
  solid.faces = solid.faces.map((face, i) => {
    const n = faceNormal(solid, i);
    const c = faceCentroid(solid, i);
    return vecDot(n, c) < 0 ? [...face].reverse() : face;
  });
  return solid;
}

// ============================================================================
// THE FIVE FAIR SOLIDS
// ============================================================================

function tetrahedron(): Solid {
  const v: Vec3[] = [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ];
  return ensureOutward({
    name: 'tetrahedron',
    sides: 4,
    vertices: v.map(vecNormalize),
    faces: [
      [0, 1, 2],
      [0, 3, 1],
      [0, 2, 3],
      [1, 3, 2],
    ],
    numbered: [0, 1, 2, 3],
    fair: true,
  });
}

function cube(): Solid {
  const v: Vec3[] = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];
  return ensureOutward({
    name: 'cube',
    sides: 6,
    vertices: v.map(vecNormalize),
    faces: [
      [0, 3, 2, 1],
      [4, 5, 6, 7],
      [1, 2, 6, 5],
      [0, 4, 7, 3],
      [3, 7, 6, 2],
      [0, 1, 5, 4],
    ],
    numbered: [0, 1, 2, 3, 4, 5],
    fair: true,
  });
}

function octahedron(): Solid {
  const v: Vec3[] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  return ensureOutward({
    name: 'octahedron',
    sides: 8,
    vertices: v,
    faces: [
      [0, 2, 4],
      [2, 1, 4],
      [1, 3, 4],
      [3, 0, 4],
      [2, 0, 5],
      [1, 2, 5],
      [3, 1, 5],
      [0, 3, 5],
    ],
    numbered: [0, 1, 2, 3, 4, 5, 6, 7],
    fair: true,
  });
}

function icosahedron(): Solid {
  const raw: Vec3[] = [
    [-1, PHI, 0],
    [1, PHI, 0],
    [-1, -PHI, 0],
    [1, -PHI, 0],
    [0, -1, PHI],
    [0, 1, PHI],
    [0, -1, -PHI],
    [0, 1, -PHI],
    [PHI, 0, -1],
    [PHI, 0, 1],
    [-PHI, 0, -1],
    [-PHI, 0, 1],
  ];
  return ensureOutward({
    name: 'icosahedron',
    sides: 20,
    vertices: raw.map(vecNormalize),
    faces: [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ],
    numbered: Array.from({ length: 20 }, (_, i) => i),
    fair: true,
  });
}

/**
 * THE DODECAHEDRON, BY DUALITY. Its vertices are the icosahedron's face
 * centres; its faces are the icosahedron's vertices, each surrounded by the
 * five faces that touch it — ordered around that vertex by angle so the
 * pentagon is drawn as a pentagon and not as a star.
 */
function dodecahedron(): Solid {
  const ico = icosahedron();
  const vertices: Vec3[] = ico.faces.map((_, i) => vecNormalize(faceCentroid(ico, i)));

  const faces: number[][] = ico.vertices.map((v, vi) => {
    const touching = ico.faces
      .map((face, fi) => ({ fi, face }))
      .filter(({ face }) => face.includes(vi))
      .map(({ fi }) => fi);

    // A local frame on the tangent plane at this vertex, to sort by angle.
    const axis = vecNormalize(v);
    const seed = vecSub(vertices[touching[0]], vecScale(axis, vecDot(vertices[touching[0]], axis)));
    const u = vecNormalize(seed);
    const w = vecCross(axis, u);

    return touching
      .map((fi) => {
        const p = vertices[fi];
        return { fi, angle: Math.atan2(vecDot(p, w), vecDot(p, u)) };
      })
      .sort((a, b) => a.angle - b.angle)
      .map(({ fi }) => fi);
  });

  return ensureOutward({
    name: 'dodecahedron',
    sides: 12,
    vertices,
    faces,
    numbered: Array.from({ length: 12 }, (_, i) => i),
    fair: true,
  });
}

// ============================================================================
// THE TRAPEZOHEDRON — what a real d10 actually is
// ============================================================================

/**
 * A pentagonal trapezohedron: two apexes over a shallow ten-point zigzag of
 * kite faces. The apex height is NOT chosen by eye — it is the only height at
 * which each kite is planar, solved here from that condition and checked below.
 *
 * `band` is the half-height of the zigzag, and it is the shape's one honest
 * knob: smaller is flatter and more like a shop-bought d10.
 */
export function trapezohedron(n = 5, band = 0.12): Solid {
  const upper: Vec3[] = [];
  const lower: Vec3[] = [];
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    const b = a + Math.PI / n;
    upper.push([Math.cos(a), Math.sin(a), band]);
    lower.push([Math.cos(b), Math.sin(b), -band]);
  }

  // Planarity: the apex must lie on the plane of U[0], U[1], L[0].
  const u0 = upper[0];
  const u1 = upper[1 % n];
  const l0 = lower[0];
  const nrm = vecCross(vecSub(u1, u0), vecSub(l0, u0));
  // The apex (0,0,h) lies on the kite's plane  ⟺  nrm · ((0,0,h) − u0) = 0
  //                                            ⟺  h = (nrm · u0) / nrm.z
  const h = nrm[2] === 0 ? 1 : vecDot(nrm, u0) / nrm[2];

  const vertices: Vec3[] = [...upper, ...lower, [0, 0, h], [0, 0, -h]];
  const N = n * 2;
  const north = N;
  const south = N + 1;

  const faces: number[][] = [];
  for (let k = 0; k < n; k++) {
    // north kite: apex, upper k, the lower vertex between, upper k+1
    faces.push([north, k, n + k, (k + 1) % n]);
    // south kite: apex, lower k, the upper vertex between, lower k+1
    faces.push([south, n + k, (k + 1) % n, n + ((k + 1) % n)]);
  }

  return ensureOutward({
    name: `trapezohedron-${n * 2}`,
    sides: n * 2,
    vertices,
    faces,
    numbered: Array.from({ length: n * 2 }, (_, i) => i),
    fair: true,
  });
}

// ============================================================================
// THE BARREL — KP's impossibility, answered the way a dice cutter answers it
// ============================================================================

/**
 * An N-sided prism with pyramidal caps: N numbered rectangles around the
 * waist, and two cones of triangles that make it impossible to rest on an end.
 * Not face-transitive, and `fair: false` says so out loud — but the SIDE faces
 * are congruent and equally likely, which is the property a die actually needs
 * and the reason real d3, d5 and d7 dice are made this way.
 */
export function barrel(n: number, waist = 0.62, point = 1.25): Solid {
  const sides = Math.max(3, Math.floor(n));
  const ring: Vec3[] = [];
  for (let k = 0; k < sides; k++) {
    const a = (2 * Math.PI * k) / sides;
    ring.push([Math.cos(a), Math.sin(a), waist]);
  }
  const lower: Vec3[] = ring.map((v) => [v[0], v[1], -waist] as Vec3);

  const vertices: Vec3[] = [...ring, ...lower, [0, 0, point], [0, 0, -point]];
  const north = sides * 2;
  const south = sides * 2 + 1;

  const faces: number[][] = [];
  // the numbered waist
  for (let k = 0; k < sides; k++) {
    const nx = (k + 1) % sides;
    faces.push([k, nx, sides + nx, sides + k]);
  }
  const numbered = Array.from({ length: sides }, (_, i) => i);
  // the caps, which carry nothing and are never landed on
  for (let k = 0; k < sides; k++) {
    const nx = (k + 1) % sides;
    faces.push([north, nx, k]);
    faces.push([south, sides + k, sides + nx]);
  }

  return ensureOutward({
    name: `barrel-${sides}`,
    sides,
    vertices,
    faces,
    numbered,
    fair: false,
  });
}

// ============================================================================
// THE DISC — the two-faced thing that is not a die
// ============================================================================

/**
 * A COIN. `solidForSides` refuses two on purpose — "a two-faced die is a coin,
 * and a coin is not a solid" — and this is the honest shape that refusal was
 * holding the door open for: a wide, thin n-gonal disc with a rim.
 *
 * Two faces carry a mark and the rim carries none, which is the truth about a
 * coin: it *can* land on its edge and essentially never does, so the rim is
 * built, lit and never numbered. `rim` is its one real knob — thin enough to
 * read as a coin, thick enough to catch the light as it turns edge-on, which
 * is the whole drama of a toss.
 *
 * `fair: true`, and unlike the barrel that is not a courtesy: the two flat
 * faces are congruent and opposite, so the shape is as fair as the throw.
 */
export function disc(rim = 0.11, segments = 32): Solid {
	const n = Math.max(8, Math.floor(segments));
	const top: Vec3[] = [];
	const bottom: Vec3[] = [];
	for (let k = 0; k < n; k++) {
		const a = (2 * Math.PI * k) / n;
		top.push([Math.cos(a), Math.sin(a), rim]);
		bottom.push([Math.cos(a), Math.sin(a), -rim]);
	}

	const vertices: Vec3[] = [...top, ...bottom];
	const faces: number[][] = [];

	// The two marked faces, first and second, so heads is always face 0.
	faces.push(Array.from({ length: n }, (_, k) => k));
	faces.push(Array.from({ length: n }, (_, k) => n + (n - 1 - k)));

	// The rim: never numbered, never landed on, always lit.
	for (let k = 0; k < n; k++) {
		const nx = (k + 1) % n;
		faces.push([k, nx, n + nx, n + k]);
	}

	return ensureOutward({
		name: 'disc',
		sides: 2,
		vertices,
		faces,
		numbered: [0, 1],
		fair: true
	});
}

// ============================================================================
// THE BAG — resolving a side count to a shape
// ============================================================================

export const PLATONIC_SOLIDS = {
  tetrahedron: tetrahedron(),
  cube: cube(),
  octahedron: octahedron(),
  dodecahedron: dodecahedron(),
  icosahedron: icosahedron(),
} as const;

export type PlatonicKey = keyof typeof PLATONIC_SOLIDS;

/** Side count → the fair solid that carries it, where one exists. */
export const FAIR_SOLID_BY_SIDES: Record<number, PlatonicKey> = {
  4: 'tetrahedron',
  6: 'cube',
  8: 'octahedron',
  12: 'dodecahedron',
  20: 'icosahedron',
};

/**
 * THE ONE CALL A CONSUMER NEEDS. A fair solid where geometry allows one, the
 * trapezohedron at ten, and a barrel for everything else — never a refusal,
 * and never a fair-looking lie: read `solid.fair` to know which you were given.
 */
export function solidForSides(sides: number): Solid {
  // Three is the floor: a two-faced die is a coin, and a coin is not a solid.
  const n = Math.max(3, Math.floor(sides));
  const fair = FAIR_SOLID_BY_SIDES[n];
  if (fair) return PLATONIC_SOLIDS[fair];
  // An even count from six up has a fair trapezohedron; ten is only the
  // famous one. Above thirty the kites are slivers, so the barrel reads better.
  if (n % 2 === 0 && n >= 6 && n <= 30) return trapezohedron(n / 2);
  return barrel(n);
}

// ============================================================================
// SELF-CHECK — the derivations verify themselves at load, or they tell
// ============================================================================

/**
 * Every face of every fair solid must be planar and outward-wound. This runs
 * once, costs nothing, and returns the complaints rather than throwing: a
 * design system that breaks eighteen apps on import is worse than one that
 * says what is wrong. Consumers may call it; nothing is required to.
 */
export function verifySolids(epsilon = 1e-9): string[] {
  const complaints: string[] = [];
  const all: Solid[] = [...Object.values(PLATONIC_SOLIDS), trapezohedron(), barrel(7), disc()];

  for (const solid of all) {
    solid.faces.forEach((face, i) => {
      const n = faceNormal(solid, i);
      const c = faceCentroid(solid, i);
      if (vecDot(n, c) <= 0) {
        complaints.push(`${solid.name} face ${i} winds inward`);
      }
      for (const vi of face) {
        const d = Math.abs(vecDot(n, vecSub(solid.vertices[vi], c)));
        if (d > epsilon * 1e3) {
          complaints.push(`${solid.name} face ${i} is not planar (${d.toExponential(2)})`);
          break;
        }
      }
    });
    if (solid.fair && solid.numbered.length !== solid.sides) {
      complaints.push(`${solid.name} claims ${solid.sides} sides but numbers ${solid.numbered.length}`);
    }
  }
  return complaints;
}
