/**
 * lkextrude.mjs - thickness for things that live in 3D space.
 *
 * Everything in the films' 3D world (cards, panels, depth-set components, the lab's dots) used to be a
 * flat plane: the camera could tilt and orbit around it, and it stayed paper-thin, a 2D sticker
 * floating in 3D. That reads as a bug the moment the camera moves. An object in a 3D scene has
 * sides.
 *
 * THE TECHNIQUE
 * CSS has no extrude, so a slab is built from SLICES: `layers` solid copies of the face's silhouette,
 * stacked behind it at `step` px intervals along -z. Seen from the front they are hidden behind the
 * face; seen from an angle, or when the element lifts, they are the object's sides: the LIP.
 *
 * THE LIP HAS NO COLOUR OF ITS OWN. Nothing in this file is a colour. Each slice carries only its depth
 * (`data-t`, 0 at the face to 1 at the back) and the runtime (lkcolor.mjs `__lip.apply`) derives its colour at
 * render time from the host's COMPUTED background: the same colour with its lightness lowered in OKLCH, hue and
 * chroma kept. So the lip of a blue card is a deeper blue, of a red dot a deeper red, of a pale row a deeper pale
 * blue, and a new colour needs no second colour defined. Perspective makes the far slices smaller, which gives the
 * sides a believable taper.
 *
 * REQUIREMENTS ON THE HOST
 *   - the host element needs `transform-style: preserve-3d` (class `x3d`);
 *   - the host must NOT have `overflow:hidden` (it flattens its children to the plane: no sides);
 *   - the slices inherit the host's `border-radius`, so a rounded card has a rounded slab.
 * The slices are static: nothing tweens them, so they never conflict with the host's own animation,
 * and they inherit its scale (an entrance from scale 0 grows the whole slab).
 */

/**
 * The camera's perspective distance (px). Each slice is scaled by (1 + depth / PERSPECTIVE) to cancel the
 * foreshortening, so the slab is a PRISM: its back outline projects the same size as its face and only the
 * LEAN shows. Without it a wide panel's deep slices shrink behind the face and the extrusion vanishes.
 */
export const PERSPECTIVE = 1600;

/** The slab's geometry. No colour: the lip is derived from the host's own colour at render time (lkcolor.mjs). */
export const SLAB = {
  layers: 6,
  step: 3, // px between slices: 6 x 3 = 18 px of thickness
  /** the face carries a 4px black outer stroke + a drop; slices extend to match it so the join is seamless */
  grow: { top: 4, right: 4, bottom: 10, left: 4 },
};

/**
 * The slices for one host, as markup to place INSIDE it (before its content). `opts` overrides SLAB:
 * { layers, step, grow, round }. `round: true` makes circular slices (the lab's dots). No colour option: the lip is derived.
 */
export function slab(opts = {}) {
  const o = { ...SLAB, ...opts, grow: { ...SLAB.grow, ...(opts.grow || {}) }, lean: { x: 0, y: 0, ...(opts.lean || {}) }, prism: !!opts.prism };
  const g = o.grow;
  let out = "";
  for (let i = o.layers; i >= 1; i--) {
    const t = +(o.layers === 1 ? 0 : (i - 1) / (o.layers - 1)).toFixed(3); // 0 at the face .. 1 at the back
    // LEAN: each slice also steps toward the lower left in proportion to its depth, so the thickness shows
    // head-on at rest (the way the black drop reads), not only when the camera tilts. A slab that only
    // shows its side under camera tilt is flat for most of every shot.
    const lx = +(o.lean.x * (i / o.layers)).toFixed(2), ly = +(o.lean.y * (i / o.layers)).toFixed(2);
    out += `<i class="xl" data-t="${t}" style="inset:-${g.top}px -${g.right}px -${g.bottom}px -${g.left}px;transform:translate3d(${lx}px,${ly}px,0) translateZ(-${+(i * o.step).toFixed(2)}px) ${o.prism ? ` scale(${+(1 + (i * o.step) / PERSPECTIVE).toFixed(4)})` : ""}${o.round ? ";border-radius:50%" : ""}"></i>`;
  }
  return out;
}

/** The thickness in px a slab with these options has. */
export const thickness = (opts = {}) => ((opts.layers ?? SLAB.layers) * (opts.step ?? SLAB.step));

export const extrudeCSS = `
/* ---- extrusion (lkextrude.mjs): a host that is a slab, and its slices */
/* A slab is OWNED by its host: the host is the slices' containing block (position:relative), so the extrusion
   moves, scales and rotates with the element and can never be positioned off some other layer. Without this the
   absolutely-positioned slices attach to the nearest positioned ancestor the moment the host's own transform
   clears at rest: the "extruded off the layer the div is on" bug. */
.x3d{transform-style:preserve-3d;position:relative}
/* the chain of preserve-3d: a slab sitting under a flat wrapper is flattened into the plane, so everything inside
   the stage keeps the 3D context (overflow:hidden leaves flatten themselves, which is fine: they have no slab) */
.stagec,.stagec *:not(svg):not(svg *){transform-style:preserve-3d}
.xl{position:absolute;pointer-events:none;border-radius:inherit;background:currentColor} /* the runtime replaces it with the derived lip */
`;

/**
 * THE MARKER. `card()` (components/card) stamps every opaque card it builds with `--slab:<role>` in its inline style.
 * `applySlabs(html)` is the ONE build pass that turns each marked card into an owned slab:
 *   - adds the `x3d` class and `position:relative` (unless it is already absolute / fixed / relative);
 *   - puts the slices as the card's FIRST child, so they are part of the card, not a sibling layer;
 *   - skips a card that already is a slab (a component built its own), and a card with `overflow:hidden`
 *     (it clips its content, which would flatten the sides): those get `data-slab-exempt="clip"`.
 * Nothing is left unprocessed: a stray `--slab:` marker is a lint failure (lint-components C11).
 */
export function applySlabs(html) {
  return html.replace(/<(div|section|article|span)\b([^>]*?)>/g, (tag, name, attrs) => {
    const sm = attrs.match(/style="([^"]*)"/);
    if (!sm || !/--slab:\w+/.test(sm[1])) return tag;
    const role = sm[1].match(/--slab:(\w+)/)[1];
    let style = sm[1].replace(/--slab:\w+;?/, "");
    let rest = attrs.replace(sm[0], `style="${style}"`);
    const cm = rest.match(/class="([^"]*)"/);
    if (cm && /\bx3d\b/.test(cm[1])) return `<${name}${rest}>`; // a component already built its own slab
    if (/overflow\s*:\s*hidden/.test(style)) return `<${name}${rest} data-slab-exempt="clip">`;
    if (/position\s*:\s*static/.test(style)) style = style.replace(/position\s*:\s*static/, "position:relative");
    else if (!/position\s*:/.test(style)) style += (style.endsWith(";") || !style ? "" : ";") + "position:relative";
    rest = rest.replace(/style="[^"]*"/, `style="${style}"`);
    rest = cm ? rest.replace(cm[0], `class="${cm[1]} x3d"`) : ` class="x3d"${rest}`;
    return `<${name}${rest} data-slab="${role}">${slabFor(role)}`;
  });
}


/**
 * DEPTH TOKENS. A restrained slab: a few px of side, real depth that shows when the camera tilts. It must
 * stay subtle (the black outer stroke and the card do the separating); `lean` and `prism` exist for a
 * deliberate oblique look but are OFF by default, because they made every component read as a block. `MIN_DEPTH` is what lint-components enforces; `DEPTH` is what components use.
 */
export const DEPTH = { panel: 30, card: 22, pill: 18, row: 10, chip: 8, sticker: 8 };
export const MIN_DEPTH = { panel: 20, card: 14, pill: 12, row: 6, chip: 5, sticker: 5 };
const STEP = { panel: 5, card: 4, pill: 3, row: 2, chip: 2, sticker: 2 };

/** A slab for a role at its standard depth. `opts` can override colours / `round` / `grow`. */
export function slabFor(role, opts = {}) {
  const px = DEPTH[role];
  if (!px) throw new Error(`unknown slab role "${role}". Roles: ${Object.keys(DEPTH).join(", ")}`);
  const layers = Math.round(px / STEP[role]);
  return slab({ layers, step: px / layers, ...opts });
}

/**
 * How many px of side a slab of `depth` shows when the camera is yawed `deg` degrees: the number the
 * visibility rule is built on (depth x sin(yaw)).
 */
export const visibleSide = (depth, deg) => depth * Math.sin((deg * Math.PI) / 180);
