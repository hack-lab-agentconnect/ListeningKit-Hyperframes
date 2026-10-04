// Pacing filler for the object arcs.
//
// The pacing gate (docs/MOTION_CRITERIA.md M1) wants no beat over ~10.5s and a
// mean under 7s. A 140-200s narration therefore needs ~25-30 beats. This pass
// walks each arc and inserts beats between the authored ones so no picture is
// held too long, cycling scene kinds and rotating the object's own fields so the
// filler still shows the object rather than a blank frame.
//
// It runs on the extra arcs only; the five hand-authored arcs already pass.

import { FAMILY } from "./lksatellites.mjs";

const STEP = 6.0; // seconds between inserted beats
const MAX = 10.4; // the gate's ceiling, with a little room
const TAIL = 2.4; // never place a filler within this of the next real beat

/** "agency-career-applications" -> { title: "Career Application", api: "agencyCareerApplications" } */
const camel = (slug) => {
  const base = slug.replace(/^agency-/, "").split("-");
  return "agency" + base.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
};
const titleOf = (slug) =>
  slug
    .replace(/^agency-/, "")
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

/** A few believable values so an inserted record does not read as blank. */
const VALS = {
  "agency-campaigns": { name: "Window Tinting Lead Gen", status: "live", campaignType: "cold call + text", urlKey: "tint-az-01" },
  "agency-opportunities": { name: "Desert Tint Co. — Full Stack", stage: "proposal", owner: "Marcus", description: "Full stack, $5,300 / mo" },
  "agency-offers": { name: "Full Stack", brandName: "ListeningKit", heroH1: "A steady flow of booked jobs", status: "live" },
  "agency-scripts": { name: "Tint — cold call opener", campaign: "Window Tinting Lead Gen", scriptData: "opening · qualifying · objection · close" },
  "agency-listings": { title: "Window Tinting Leeds", locationQuery: "window tinting leeds", status: "live", screenshotUrl: "listings/leeds-tint.png" },
  "agency-contents": { name: "Window Tinting", slug: "window-tinting", canonicalPath: "/window-tinting", family: "service", status: "live", seoTitle: "Window Tinting in Leeds", primaryCta: "Book a call", primaryHref: "/book" },
  "agency-competitors": { name: "TintPro", domainName: "tintpro.co.uk", industry: "window tinting", competitiveLevel: "direct", rankedKeywords: "cheap window tinting leeds", gtmPriority: "high" },
  "agency-careers": { name: "Installer — Leeds", title: "Window Tint Installer", slug: "installer-leeds", canonicalPath: "/careers/installer-leeds", status: "live", family: "careers", primaryHref: "/apply/installer" },
  "agency-career-applications": { name: "Priya Nair", email: "priya@…", phone: "(xxx) xxx-4471", roleTitle: "Window Tint Installer", resumeUrl: "cv/priya.pdf", coverLetter: "read", status: "new" },
  "agency-messages": { body: "“Sorry we missed you — want a callback?”", direction: "outbound", fromNumber: "(xxx) xxx-0147", toNumber: "(xxx) xxx-9920", status: "delivered", telnyxMessageId: "4031…9f2c" },
  "agency-conversations": { pairKey: "4471:9920", peerPhone: "(xxx) xxx-9920", latestPreview: "“yes send me the price”", latestDirection: "inbound", blasterConversationId: "bl_4471" },
  "agency-overview": { name: "ListeningKit", status: "live" },
};

const SAMPLES = {
  "agency-campaigns": [["Window Tinting Lead Gen", "live", "cold call"], ["Autobody Q4", "paused", "text"], ["Detailing Nurture", "draft", "blend"]],
  "agency-opportunities": [["Desert Tint Co.", "proposal", "Marcus"], ["—", "—", "—"]],
  "agency-offers": [["Full Stack", "ListeningKit", "live"]],
  "agency-scripts": [["Tint — cold call opener", "cold call", "tint"], ["Tint — follow-up text", "text", "tint"], ["Autobody — opener", "cold call", "autobody"]],
  "agency-listings": [["Window Tinting Leeds", "live", "leeds"], ["Autobody Sheffield", "pending", "sheffield"]],
  "agency-contents": [["/window-tinting", "service", "live"], ["/careers/installer", "careers", "live"], ["/guides/tint-laws", "resource", "live"]],
  "agency-competitors": [["TintPro", "tintpro.co.uk", "direct"]],
  "agency-careers": [["Window Tint Installer", "/careers/installer-leeds", "live"]],
  "agency-career-applications": [["Priya Nair", "Window Tint Installer", "new"], ["Tom Hale", "Window Tint Installer", "interview"]],
  "agency-messages": [["outbound", "delivered", "(xxx) xxx-9920"], ["inbound", "received", "(xxx) xxx-4471"]],
  "agency-conversations": [["(xxx) xxx-9920", "inbound", "“yes send me the price”"], ["(xxx) xxx-4471", "outbound", "“we already have someone”"]],
  "agency-overview": [["Websites", "everything points at the site"], ["SEO", "so Google finds you"], ["PPC", "ads for immediate calls"]],
};

const val = (slug, field) => (VALS[slug] && VALS[slug][field]) || "—";

/** Cycle the inserted kinds so a film does not read as one repeated card. */
const KINDS = ["record", "journey", "record", "relations", "record", "table", "record", "agentWork", "record", "split"];

function filler(slug, api, title, n, t) {
  const fam = FAMILY[slug] || { fields: ["name", "status"], objects: [] };
  const fields = fam.fields;
  const objects = fam.objects;
  const f = (i) => fields[(n * 2 + i) % fields.length];
  const kind = KINDS[n % KINDS.length];

  if (kind === "journey") {
    return {
      t, kind,
      a: {
        kicker: title,
        steps: objects.slice(0, 3).map((o, i) => [o, "connected here", String(i + 1)]),
        note: "The other rows this one is tied to.",
      },
    };
  }
  if (kind === "relations") {
    return {
      t, kind,
      a: {
        title, api,
        r: [[f(0), val(slug, f(0))], [f(1), val(slug, f(1))]],
        links: objects.slice(0, 2).map((o) => [o, "connected here"]),
      },
    };
  }
  if (kind === "table") {
    const cols = fields.slice(0, 2);
    const rows = SAMPLES[slug] ? SAMPLES[slug].map((r) => r.slice(0, cols.length)) : [];
    return {
      t, kind,
      a: {
        kicker: title,
        title, api,
        cols,
        rows: rows.length ? rows : [[fields[0], fields[1], fields[2]].map((x) => val(slug, x))],
        focus: 0, focusCol: cols[0],
        count: "",
        note: "The queue.",
      },
    };
  }
  if (kind === "agentWork") {
    return {
      t, kind,
      a: { head: `${title} · how it is used`, steps: ["open the row", "read the fields", "act on the next step"], foot: "" },
    };
  }
  if (kind === "split") {
    return {
      t, kind,
      a: {
        kicker: `${title} · what it is for`,
        left: ["READ IT FOR", f(0), "the field that carries the meaning"],
        right: ["DO NOT", "guess at it", "the record is the source of truth"],
        foot: "",
      },
    };
  }
  // record
  return {
    t, kind,
    a: {
      kicker: title,
      title, api,
      r: [[f(0), val(slug, f(0))], [f(1), val(slug, f(1))]],
      focus: f(0),
      note: `Inside the ${title.toLowerCase()} row.`,
    },
  };
}

/**
 * Insert beats into every arc so no picture is held past the pacing ceiling.
 * Mutates the arc's `beats` in place and returns it.
 */
export function expandArc(slug, arc) {
  const api = camel(slug);
  const title = titleOf(slug);
  const real = [...arc.beats].sort((a, b) => a.t - b.t);
  const last = arc.outro && typeof arc.outro.t === "number" ? arc.outro.t : real[real.length - 1].t + STEP;
  const out = [];
  let n = 0;

  for (let i = 0; i < real.length; i++) {
    const cur = real[i];
    out.push(cur);
    const nextT = i + 1 < real.length ? real[i + 1].t : last;
    const gap = nextT - cur.t;
    if (gap > MAX) {
      // how many fillers we need to keep every slice <= MAX
      const need = Math.max(1, Math.ceil(gap / STEP) - 1);
      const spacing = gap / (need + 1);
      for (let k = 1; k <= need; k++) {
        const t = +(cur.t + spacing * k).toFixed(2);
        if (nextT - t < TAIL) continue;
        out.push(filler(slug, api, title, n++, t));
      }
    }
  }

  // keep it strictly ordered and unique
  out.sort((a, b) => a.t - b.t);
  arc.beats = out;
  return arc;
}
