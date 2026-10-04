/**
 * lksatellites.mjs — the depth set.
 *
 * A beat's content sits on one plane, so a camera tilting across it only ever sees
 * a flat card tilt. This module places a few MORE COMPONENTS around the content, at
 * different depths in front of and behind it, so the camera has parallax to pull
 * apart and the active component has a background and a foreground to rise out of.
 * Separation between layers comes from scale (perspective), the black outer stroke
 * and the lift of the active component - never from blur or dimming.
 *
 * WHAT GOES IN IT (criteria M9)
 * Components from the beat's own FAMILY, never decoration and never subtitle text:
 *   - a beat that shows an object's fields  -> the object's OTHER fields
 *   - a beat about relationships / the whole -> the object's related objects
 * Anything already on screen in the beat is skipped. Each is the same component the
 * rest of the series uses: a card with a tile and a heroicon (DESIGN_SYSTEM 1.5),
 * so the satellites are recognisably the same family as the thing they surround.
 *
 * The pool is real: field lists come from narrations/<slug>.json `keyFields`, related
 * objects from the storyboards. Nothing here is invented.
 */

import { fieldIcon, OBJECT_ICON } from "./lkicons.mjs";
import * as SAT from "./components/satellite/index.mjs";
import * as CUT from "./components/cutout/index.mjs";
import { slotsFor, isForeground } from "./components/layout.mjs";

/** Per object video: the object's own fields, and the objects that hang off it. */
export const FAMILY = {
  "agency-prospects": {
    fields: ["name", "slug", "niche", "city", "region", "phone", "email", "emailConfidence", "aiFitScore", "fitReason", "techStack", "label"],
    objects: ["agencyLeads", "agencyCalls", "agencyCampaigns", "agencyPhones", "agencyOpportunities", "agencyTasks", "agencyMessages", "agencyConversations", "agencyCompetitors", "agencyScripts"],
  },
  "agency-calls": {
    fields: ["direction", "status", "fromNumber", "toNumber", "transcript", "recordingUrl", "aiSummary", "aiSentiment"],
    objects: ["agencyPhones", "agencyProspects", "agencyLeads", "agencyCampaigns", "agencyScripts"],
  },
  "agency-leads": {
    fields: ["name", "contactName", "source", "status", "qualificationStatus", "coldCallStatus", "outboundMessage"],
    objects: ["agencyProspects", "agencyCalls", "agencyMessages", "agencyOpportunities", "agencyConversations", "agencyTasks"],
  },
  "agency-phones": {
    fields: ["phoneNumber", "countryCode", "numberType", "state", "tenDlcCampaignId", "tollFreeVerificationId", "messagingProfileId"],
    objects: ["agencyMessages", "agencyCalls", "agencyCampaigns", "agencyConversations"],
  },
  "agency-tasks": {
    fields: ["title", "status", "assignee", "dueAt"],
    objects: ["agencyProspects", "agencyLeads", "agencyOpportunities", "agencyCampaigns", "agencyContents", "agencyCalls", "agencyMessages"],
  },
};

/** Beats that are about relationships or the whole object draw from the related objects. */
const OBJECT_KINDS = new Set(["relations", "converge", "split", "journey", "overwhelm", "zoomOut", "agentWork"]);

// Where they stand: components/layout.mjs (one placement system for the films and every lab).

const COUNT = 5;
/** Which depth-set slot holds the ear cutout (a back slot, so it never competes with the foreground cards). */
export const CUT_SLOT = 3;

const fieldsShown = (a = {}) => new Set([...(a.r || []).map((r) => (r.length === 3 ? r[1] : r[0])), ...(a.keys || [])]);
const objectsShown = (a = {}) => new Set([...(a.links || []).map((l) => l[0]), ...(a.labels || []), a.api].filter(Boolean));

/**
 * The depth set for one beat: `{ html, spec }` or null. `spec` is plain JSON the
 * director animates (positions in world px, so its camera can fly to them without
 * measuring a projected box).
 */
export function satellitesFor(slug, beat, index) {
  const fam = FAMILY[slug];
  if (!fam || beat.kind === "endcard") return null;
  const a = beat.a || {};
  const useObjects = OBJECT_KINDS.has(beat.kind);
  const pool = (useObjects ? fam.objects : fam.fields).filter((n) => !(useObjects ? objectsShown(a) : fieldsShown(a)).has(n));
  if (!pool.length) return null;
  // Rotate through the pool by beat index, so each beat shows different members of the family.
  const picks = Array.from({ length: Math.min(COUNT, pool.length) }, (_, k) => pool[(index * 2 + k) % pool.length]);
  const slots = slotsFor(index);
  const onBlue = beat.tone === "blue";
  const items = picks.map((name, k) => ({ name, ...slots[k], fg: isForeground(slots[k]) }));
  // each one is the satellite COMPONENT: a card + tile + icon + label, extruded (components/satellite); ONE of them
  // (the back slot, CUT_SLOT) is the brand's ear cutout (components/cutout), chosen by what the beat is about
  const ear = CUT.earFor(beat.kind, index);
  const html = items
    .map((s, k) => (k === CUT_SLOT && items.length > CUT_SLOT
      ? CUT.html({ ear, i: k, fg: s.fg, rot: index % 2 ? 9 : -9, extrude: true })
      : SAT.html({ name: s.name, icon: useObjects ? OBJECT_ICON[s.name] || fieldIcon(s.name) : fieldIcon(s.name), tone: beat.tone, fg: s.fg, i: k, extrude: true })))
    .join("");
  // data-layout-allow-overlap: the depth set is DELIBERATE layering (components at depth around the
  // content), which is precisely what the layout audit would otherwise report as overlap.
  return { html: `<div class="satset" data-layout-allow-overlap>${html}</div>`, spec: items.map(({ x, y, z, name }) => ({ x, y, z, name })) };
}

export const satelliteCSS = SAT.css + CUT.css;
