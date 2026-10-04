/**
 * Heroicons (outline, 24px, v2.2.0) for the video.
 *
 * Read at build time out of the app's own installed package, so the icons in
 * the video are byte-identical to the icons the product ships:
 *
 *   <repo>/node_modules/.bun/@heroicons+react@2.2.0_<hash>/node_modules/@heroicons/react/24/outline/<Name>Icon.js
 *
 * We do not use React in the composition, so we take the same default
 * attributes the components declare (stroke currentColor, strokeWidth 1.5,
 * round linecaps, viewBox 0 0 24 24) and the same `d` strings, and emit plain
 * SVG markup.
 *
 *   icon("phone")      -> <svg ...>...</svg> at 24px
 *   icon("phone", 64)  -> 64px
 *   icon("phone", 64, "blue") -> 64px, brand-blue stroke
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The product's own Heroicons package, when it is present. The build must NOT
// depend on it: a fresh clone has no `node_modules/.bun`, and a render machine
// that cannot reach that path still has to emit a composition. So the lookup is
// lazy and the paths are vendored into src/heroicon-paths.json (regenerate with
// `npm run vendor:icons`).
const ROOT = "C:/Users/0/.buzz/REPOS/listeningkit-hackathon/node_modules/.bun";
let PKG_ROOT = null;
try {
  PKG_ROOT = path.join(
    ROOT,
    fs.readdirSync(ROOT).find((d) => d.startsWith("@heroicons+react@")),
    "node_modules/@heroicons/react/24/outline",
  );
} catch {
  PKG_ROOT = null;
}

// Vendored fallback: bare PascalCase icon name (no "Icon" suffix) -> array of
// `d` strings, generated once from the package via `npm run vendor:icons`.
const FALLBACK_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "heroicon-paths.json");
let FALLBACK = {};
try {
  FALLBACK = JSON.parse(fs.readFileSync(FALLBACK_FILE, "utf8"));
} catch {
  FALLBACK = {};
}
// Lower-cased name -> canonical key, so a caller can write "magnifying-glass",
// "MagnifyingGlass", "magnifying glass" or "MagnifyingGlassIcon" and hit the
// same entry. Without this, `pascal("square-3-stack-3d")` = "Square3Stack3d"
// missed the real "Square3Stack3D" and the icon silently threw at build time.
const FALLBACK_BY_KEY = {};
for (const key of Object.keys(FALLBACK)) FALLBACK_BY_KEY[key.toLowerCase()] = key;

/** name (any case, kebab / pascal / spaced, with or without the Icon suffix) -> svg markup. */
export function icon(name, size = 24, color = "currentColor") {
  const d = iconPaths(name);
  if (!d) throw new Error(`icon "${name}" not found (no package and not in heroicon-paths.json)`);
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
 stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
 aria-hidden="true" focusable="false">${d.map((p) => `<path d="${p}"/>`).join("")}</svg>`;
}

/** Path data for an icon name, from the package if present, else the vendored map. */
function iconPaths(name) {
  const bare = pascal(name);
  const key = FALLBACK_BY_KEY[bare.toLowerCase()] || FALLBACK_BY_KEY[kebab(name)];
  if (PKG_ROOT && key) {
    try {
      return paths(path.join(PKG_ROOT, key + "Icon.js"));
    } catch {
      /* fall through to the vendored copy */
    }
  }
  return key ? FALLBACK[key] : null;
}

/**
 * The icon-bearing card primitive.
 *
 * A heroicon on the left, a hard grey offset shadow down, plain rounded-md.
 * This replaces the squircle: a squircle is a clip-path on a fixed-size box,
 * and these cards are content-sized, so the clip was cropping the fill and the
 * ring mask was painting a border outside the visible shape.
 */
export function iconCard(iconName, { maxW = 520, r = 14, stroke = 1.5, fill = "rgba(255,255,255,0.10)", border = "rgba(255,255,255,0.30)", shadow = "rgba(13,42,76,0.22)", shadowY = 6, gap = 20, iconSize = 40, extra = "" } = {}) {
  return `max-width:${maxW}px;background:${fill};border-radius:${r}px;` +
    `box-shadow:0 ${shadowY}px 0 0 ${shadow}${stroke ? `,inset 0 0 0 ${stroke}px ${border}` : ""};` +
    (extra ? `${extra};` : "");
}

/** Same box, with the icon + gap wired in. Returns the full inner markup. */
export function iconRow(iconName, inner, opts = {}) {
  const { iconSize = 40, gap = 20, align = "center" } = opts;
  return `<div style="display:flex;align-items:${align};gap:${gap}px"><span class="ico" style="display:flex;flex:none">${icon(
    iconName,
    iconSize,
  )}</span><span style="flex:1;min-width:0">${inner}</span></div>`;
}

/**
 * field name -> Heroicons name. One map, applied automatically to every record
 * row in every object video, so the icon column is consistent across the whole
 * series rather than chosen per-beat.
 */
export const FIELD_ICON = {
  // identity
  name: "building-storefront",
  // Heroicons ships no `TextIcon`; `document-text` is the title/text glyph that
  // exists. It was a latent build error — resolve it lazily and the map row that
  // named a non-existent icon blows up the first beat that uses it.
  title: "document-text",
  slug: "link",
  label: "tag",
  status: "flag",
  kind: "tag",
  type: "squares-2x2",
  // place
  city: "map-pin",
  region: "map",
  country: "globe-americas",
  address: "map-pin",
  zip: "map-pin",
  market: "globe-americas",
  // contact
  phone: "phone",
  phones: "phone",
  email: "envelope",
  emailConfidence: "shield-check",
  phoneConfidence: "shield-check",
  fromNumber: "phone-arrow-down-left",
  toNumber: "phone-arrow-up-right",
  // ai
  aiFitScore: "sparkles",
  fitReason: "chat-bubble-bottom-center-text",
  techStack: "wrench-screwdriver",
  aiSummary: "sparkles",
  aiSentiment: "face-smile",
  summary: "sparkles",
  sentiment: "face-smile",
  score: "chart-bar",
  confidence: "shield-check",
  // money / pipeline
  value: "banknotes",
  amount: "banknotes",
  stage: "signal",
  outcome: "trophy",
  won: "trophy",
  lost: "x-circle",
  // content
  transcript: "document-text",
  body: "document-text",
  content: "document-text",
  url: "link",
  source: "arrow-top-right-on-square",
  // time
  createdAt: "clock",
  updatedAt: "clock",
  dueAt: "clock",
  duration: "clock",
};

/** Field name -> icon name, falling back to a neutral square. */
export const fieldIcon = (k) => FIELD_ICON[k] || "square-3-stack-3d";

/* ----------------------------------------------------------------- internals */

const paths = (file) => {
  const src = fs.readFileSync(file, "utf8");
  const out = [...src.matchAll(/d:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (!out.length) throw new Error(`no path data in ${file}`);
  return out;
};

const kebab = (s) => {
  const base = String(s).replace(/Icon$/, "");
  return base.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
};

/** Any spelling (kebab / spaced / pascal, optional Icon suffix) -> bare PascalCase. */
const pascal = (s) =>
  String(s)
    .replace(/Icon$/, "")
    .split(/[-\s_]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");

/** Twenty object -> heroicon, used on every record panel header and by components/table. */
export const OBJECT_ICON = {
  agencyProspects: "building-storefront",
  agencyCalls: "phone",
  agencyLeads: "users",
  agencyPhones: "phone",
  agencyMessages: "chat-bubble-left-right",
  agencyConversations: "chat-bubble-left-ellipsis",
  agencyCampaigns: "megaphone",
  agencyOffers: "tag",
  agencyListings: "building-office",
  agencyCompetitors: "trophy",
  agencyContents: "document-text",
  agencyScripts: "document",
  agencyTasks: "check-circle",
  agencyCareerApplications: "briefcase",
  agencyCareers: "briefcase",
  agencyOpportunities: "chart-bar",
  agencyServiceVerticals: "squares-plus",
  agencyModels: "cpu-chip",
};
