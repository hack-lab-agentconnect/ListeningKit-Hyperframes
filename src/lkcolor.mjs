/**
 * lkcolor.mjs - the LIP: the visible edge of an extruded element, derived from the element's own colour.
 *
 * A slab's side (the lip that shows under an element when it lifts: on hover, on a press, while it rises) is NEVER a
 * colour somebody picked. It is the element's own base colour, taken at render time from its COMPUTED background,
 * with its lightness lowered in OKLCH while the hue and the chroma are kept. So the lip of a blue card is a deeper
 * blue, the lip of a pale row is a deeper pale-blue, the lip of a red dot is a deeper red, and a new colour needs no
 * second colour defined for it.
 *
 *   OKLCH is perceptual: lowering L darkens without the hue drift and the muddy greys that HSL or "mix with black"
 *   give. If the darker colour falls outside sRGB at that chroma, the chroma (never the hue) is reduced until it fits.
 *
 *   near  the slice right behind the face     L x 0.78
 *   far   the deepest slice                   L x 0.58      (the slab shades from near to far)
 *
 * `colorModule` is one self-contained function (like lkspring / lkfx): tests call it directly and `colorRuntimeJS`
 * serialises the same function into a page as `__oklch` / `__lip`, so what is tested is what renders.
 */

export function colorModule() {
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  /** "rgb(r, g, b)" / "rgba(r, g, b, a)" / "#rrggbb" / "#rgb" -> { r, g, b, a } with r, g, b in 0..255. */
  function parse(css) {
    const s = String(css).trim().toLowerCase();
    let m = s.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (m) {
      const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
    }
    return null;
  }

  const toLinear = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const fromLinear = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

  /** sRGB (0..255) -> OKLCH { L: 0..1, C, h: degrees }. */
  function toOklch({ r, g, b }) {
    const R = toLinear(r), G = toLinear(g), B = toLinear(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return { L, C: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
  }

  /** OKLCH -> linear sRGB channels (may be outside 0..1: out of gamut). */
  function toLinearRgb({ L, C, h }) {
    const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  }
  const inGamut = (c) => c.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

  /** OKLCH -> sRGB (0..255, rounded). If it does not fit sRGB, the CHROMA is reduced (never the hue or the lightness). */
  function fromOklch(k) {
    let lin = toLinearRgb(k);
    if (!inGamut(lin)) {
      let lo = 0, hi = k.C;
      for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (inGamut(toLinearRgb({ L: k.L, C: mid, h: k.h }))) lo = mid; else hi = mid; }
      lin = toLinearRgb({ L: k.L, C: lo, h: k.h });
    }
    const [r, g, b] = lin.map((v) => Math.round(Math.min(255, Math.max(0, fromLinear(clamp01(v))))));
    return { r, g, b };
  }

  const LIP = { near: 0.78, far: 0.58 };

  /**
   * The lip colour for a base colour, `t` in 0..1 from the slice right behind the face (0) to the deepest (1):
   * the base's OKLCH with the lightness multiplied down and the hue and chroma kept.
   */
  function lip(base, t, spec) {
    const sp = spec || LIP, k = toOklch(base);
    const f = sp.near + (sp.far - sp.near) * (t || 0);
    return fromOklch({ L: k.L * f, C: k.C, h: k.h });
  }

  const css = (c) => "rgb(" + c.r + ", " + c.g + ", " + c.b + ")";

  /**
   * Derive and set the lip of EVERY slab under `root`, at render time, from each host's computed background. A slab
   * host is any `.x3d` with `.xl` slices as children; each slice carries `data-t` (its depth, 0..1). Hosts with no
   * solid background are skipped. Cutout slices (images) shade by filter instead.
   */
  function apply(root) {
    const hosts = root.querySelectorAll(".x3d");
    let n = 0;
    hosts.forEach((host) => {
      const slices = Array.prototype.filter.call(host.children, (el) => el.classList.contains("xl") && el.tagName !== "IMG");
      if (!slices.length) return;
      const base = parse(getComputedStyle(host).backgroundColor);
      if (!base || base.a < 0.5) return;
      slices.forEach((el) => { el.style.backgroundColor = css(lip(base, parseFloat(el.getAttribute("data-t")) || 0)); n++; });
    });
    return n;
  }

  return { parse, toOklch, fromOklch, lip, css, apply, LIP };
}

export const colorRuntimeJS = `const __oklch = (${colorModule.toString()})();
const __lip = { apply: __oklch.apply };`;
