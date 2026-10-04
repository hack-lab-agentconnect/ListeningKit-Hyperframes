// Extra storyboard arcs — the objects that had a narration but no arc yet.
//
// Each arc is authored as its own shape on purpose: the brief is "they all have
// to be different". Beat `t` is AUDIO-RELATIVE seconds, taken from the Deepgram
// sentence anchors in assets/timing/<slug>.json (`npm run times -- sentences
// <slug>`). Tones are resolved by the same pass in storyboards.mjs, so most
// beats leave `tone` unset and alternate white/blue.
//
// These are merged into ARCS in storyboards.mjs (Object.assign) BEFORE the tone
// pass runs, so FORCED_TONE still applies to the single-stage kinds.

import { expandArc } from "./expand-arcs.mjs";

export const EXTRA_ARCS = {
  // ==========================================================================
  // agency-campaigns — the unit of measurement. Arc: pile → campaign → attribution.
  // ==========================================================================
  "agency-campaigns": {
    arc: "Pile → the campaign row → attribution → the status switch",
    promise: "One campaign row answers which outbound motion actually worked.",
    beats: [
      { t: 0.2, kind: "countup",
        a: { label: "Agency Campaigns", count: 6, sub: "A named outbound motion, with its own prospects, leads and scripts." } },
      { t: 9.8, kind: "split",
        a: {
          kicker: "One enormous pile, or campaigns",
          left: ["ONE PILE", "200 undifferentiated prospects", "nobody can say which motion worked"],
          right: ["CAMPAIGNS", "the tinting shops, their leads, their scripts", "one row answers the question"],
          foot: "Instead of one enormous pile, we group them into campaigns.",
        } },
      { t: 16.9, kind: "record",
        a: {
          kicker: "Open the campaign",
          title: "Campaign", api: "agencyCampaigns",
          r: [["name", "Window Tinting Lead Gen"], ["status", "live"], ["campaignType", "cold call + text"]],
          focus: "name",
          note: "A campaign called Window Tinting Lead Gen holds the tinting shops.",
        } },
      { t: 25.7, kind: "typewriter",
        a: {
          kicker: "The unit of measurement",
          lines: ["When somebody asks how tint lead gen is performing,"],
          hold: "we answer by looking at one campaign, not by hand-filtering the database.",
        } },
      { t: 40.3, kind: "record",
        a: {
          kicker: "The fields · the business story",
          title: "Campaign", api: "agencyCampaigns",
          r: [["name", "Window Tinting Lead Gen"], ["status", "live"], ["campaignType", "cold call + text"]],
          focus: "status",
          note: "Name and status say which motion is live and which are paused.",
        } },
      { t: 46.3, kind: "journey",
        a: {
          kicker: "The four technical fields people overlook",
          steps: [
            ["urlKey", "stamped onto every link we publish", "1"],
            ["funnelBaseUrl", "where the landing page actually lives", "2"],
            ["templateBaseUrl", "the other place the key resolves to", "3"],
            ["packDir", "the folder of assets for this motion", "4"],
          ],
          note: "The link that gets clicked carries this campaign's URL key.",
        } },
      { t: 58.0, kind: "record",
        a: {
          kicker: "Attribution lives on the campaign, not the prospect",
          title: "Campaign", api: "agencyCampaigns",
          r: [["urlKey", "tint-az-01"], ["funnelBaseUrl", "go.listeningkit.com/tint"], ["templateBaseUrl", "pages.listeningkit.com/tint"]],
          focus: "urlKey",
          note: "So when a shop brings us back, the key says which motion produced the conversation.",
        } },
      { t: 65.2, kind: "relations",
        a: {
          title: "Campaign", api: "agencyCampaigns",
          r: [["name", "Window Tinting Lead Gen"], ["status", "live"]],
          links: [
            ["agencyProspects", "the shops in this motion"],
            ["agencyLeads", "the people who came out of it"],
            ["agencyScripts", "the words aimed at it"],
          ],
        } },
      { t: 97.2, kind: "typewriter",
        a: {
          kicker: "Without it",
          lines: ["Every lead just looks like a lead."],
          hold: "And we are arguing about marketing on opinion.",
        } },
      { t: 112.0, kind: "agentWork",
        a: {
          head: "Open the campaign, answer four questions",
          steps: ["which prospects are in this motion", "which leads came out of it", "which scripts are aimed at it", "is it working"],
          foot: "Compare fit scores, compare connect rates, compare how far the leads got.",
        } },
      { t: 152.0, kind: "table",
        a: {
          kicker: "The one field you touch daily",
          title: "Campaigns", api: "agencyCampaigns", count: "draft → live → paused",
          cols: ["name", "status", "campaignType"],
          rows: [
            ["Window Tinting Lead Gen", "live", "cold call"],
            ["Autobody Q4", "paused", "text"],
            ["Detailing Nurture", "draft", "blend"],
          ],
          focus: 0, focusCol: "status",
          note: "Draft while the script is written. Live only when compliance is done. Paused when the evidence says stop.",
        } },
      { t: 189.0, kind: "typewriter",
        a: {
          kicker: "One sentence",
          lines: ["It lets you switch emotion off."],
          hold: "The switch lives in a table, not in somebody's head.",
        } },
    ],
    outro: {
      t: 199.0, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "Agency Campaigns — the unit of measurement for the outbound engine", url: "twenty.inferencesaver.com/objects/agencyCampaigns" },
    },
  },

  // ==========================================================================
  // agency-opportunities — the money object. Arc: activity vs money → four fields.
  // ==========================================================================
  "agency-opportunities": {
    arc: "Activity vs money → the four fields → forecast → the handover",
    promise: "The first object in the system that represents money we might actually receive.",
    beats: [
      { t: 0.2, kind: "countup",
        a: { label: "Agency Opportunities", count: 0, sub: "A priced, staged, owned piece of work. Zero today, and that is not a bug." } },
      { t: 10.0, kind: "split",
        a: {
          kicker: "Everything else is activity",
          left: ["ACTIVITY", "prospects were found", "leads were rung, calls placed, scripts read"],
          right: ["MONEY", "an opportunity is a deal in flight", "priced, staged, and owned by a name"],
          foot: "An opportunity is the moment a lead stops being a conversation.",
        } },
      { t: 18.1, kind: "relations",
        a: {
          title: "Opportunity", api: "agencyOpportunities",
          r: [["name", "Desert Tint Co. — Full Stack"]],
          links: [
            ["agencyLeads", "it sits on top of a lead, always"],
            ["agencyOffers", "created off the sellable package"],
          ],
        } },
      { t: 35.3, kind: "journey",
        a: {
          kicker: "Four fields, and every one earns its place",
          steps: [
            ["name", "the deal's identity", "1"],
            ["stage", "the field that drives forecasting", "2"],
            ["description", "what is sold, and at what price", "3"],
            ["owner", "the single most important field", "4"],
          ],
          note: "An opportunity without a named owner is a deal nobody is chasing.",
        } },
      { t: 45.3, kind: "record",
        a: {
          kicker: "The field that drives forecasting",
          title: "Opportunity", api: "agencyOpportunities",
          r: [["name", "Desert Tint Co. — Full Stack"], ["stage", "proposal"], ["description", "Full stack, $5,300 / mo"], ["owner", "Marcus"]],
          focus: "stage",
          note: "Every forecast anybody gives is a rollup of opportunity stages.",
        } },
      { t: 57.1, kind: "typewriter",
        a: {
          kicker: "The owner",
          lines: ["A deal with no name on it is a deal nobody is chasing."],
          hold: "The owner is who picks up the phone.",
        } },
      { t: 69.5, kind: "split",
        a: {
          kicker: "Why a separate object, not a status on the lead?",
          left: ["A STATUS ON THE LEAD", "mixes activity and money", "the forecast cannot be trusted"],
          right: ["ITS OWN OBJECT", "its own stage, its own owner", "one honest number"],
          foot: "Because it separates activity from money.",
        } },
      { t: 111.6, kind: "agentWork",
        a: {
          head: "Two places this object gets used",
          steps: ["forecasting: group by stage to answer how much and when", "handover: create it off the offer, set the stage, assign the owner", "the moment the conversation becomes a commitment"],
          foot: "The sales conversation becomes a commitment here.",
        } },
      { t: 137.2, kind: "table",
        a: {
          kicker: "Zero opportunities, eighteen leads",
          title: "Opportunities", api: "agencyOpportunities", count: "the pipeline",
          cols: ["name", "stage", "owner"],
          rows: [
            ["—", "—", "—"],
          ],
          focus: 0, focusCol: "stage",
          note: "The motion is running, but the closing conversation has not landed yet.",
        } },
      { t: 141.0, kind: "typewriter",
        a: {
          kicker: "Why the count is zero",
          lines: ["It is a fact about where the business is."],
          hold: "Not a data problem.",
        } },
    ],
    outro: {
      t: 144.0, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "Agency Opportunities — where activity turns into money", url: "twenty.inferencesaver.com/objects/agencyOpportunities" },
    },
  },

  // ==========================================================================
  // agency-offers — the commercial centre. Arc: the thing bought → how it reaches a human.
  // ==========================================================================
  "agency-offers": {
    arc: "The thing being bought → the copy fields → the two links that convert",
    promise: "Everything else in the system exists to help us sell one of these.",
    beats: [
      { t: 0.2, kind: "countup",
        a: { label: "Agency Offers", count: 1, sub: "One sellable package. Still working out the product is normal at this stage." } },
      { t: 12.2, kind: "zoomOut",
        a: { mystery: "1", big: "The commercial centre", sub: "Everything else exists to help us sell one of these." } },
      { t: 18.6, kind: "converge",
        a: {
          kicker: "One offer, everything else pointed at it",
          n: 4,
          labels: ["agencyProspects", "agencyLeads", "agencyCalls", "agencyOpportunities"],
          label: "exists to sell it",
          verdict: "THE THING BEING BOUGHT",
        } },
      { t: 30.7, kind: "record",
        a: {
          kicker: "The words on the page",
          title: "Offer", api: "agencyOffers",
          r: [["name", "Full Stack"], ["brandName", "ListeningKit"], ["heroH1", "A steady flow of booked jobs"]],
          focus: "heroH1",
          note: "The big headline that appears at the top of the offer page.",
        } },
      { t: 43.7, kind: "journey",
        a: {
          kicker: "The fields tell you how an offer reaches a human",
          steps: [
            ["name + brandName", "whose product this is", "1"],
            ["heroH1", "the headline at the top of the page", "2"],
            ["ctaType", "book a call, buy, or start a chat", "3"],
            ["status", "live, draft, or paused", "4"],
          ],
          note: "One row drives the page, the advert, and the calendar link.",
        } },
      { t: 56.3, kind: "record",
        a: {
          kicker: "The two fields that actually make money",
          title: "Offer", api: "agencyOffers",
          r: [["calendlyUrl", "calendly.com/listeningkit/intro"], ["metaPixelId", "120…4471"], ["status", "live"]],
          focus: "metaPixelId",
          note: "The pixel is what attributes an advert all the way to a booked call.",
        } },
      { t: 79.1, kind: "split",
        a: {
          kicker: "Why hold the pitch inside the CRM?",
          left: ["ONE PLACE", "the offer page, the advert, the call", "all say the same thing"],
          right: ["SCATTERED", "page says one thing, advert another", "the customer is confused, we lose the credit"],
          foot: "Consistency, and attribution.",
        } },
      { t: 112.1, kind: "agentWork",
        a: {
          head: "Where you meet an offer in practice",
          steps: ["on the website, where the offer page renders", "in the advertising, behind the pixel", "on the call, as the thing being pitched"],
          foot: "One active offer forces one sharp description of what we do.",
        } },
      { t: 138.5, kind: "typewriter",
        a: {
          kicker: "When the second one appears",
          lines: ["This object is where you model it."],
          hold: "The fields tell you what to fill in before you can launch.",
        } },
    ],
    outro: {
      t: 142.0, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "Agency Offers — the thing we are actually selling", url: "twenty.inferencesaver.com/objects/agencyOffers" },
    },
  },

  // ==========================================================================
  // agency-scripts — data, not documents. Arc: document vs data → structure → training.
  // ==========================================================================
  "agency-scripts": {
    arc: "A document that drifts → structured data → one source of truth",
    promise: "The actual words we say, stored as data so every dialer and agent reads the same version.",
    beats: [
      { t: 0.1, kind: "countup",
        a: { label: "Scripts", count: 9, sub: "The actual words we say on a call, or put in a text." } },
      { t: 8.9, kind: "split",
        a: {
          kicker: "A script feels like a document",
          left: ["A GOOGLE DOC", "it drifts, it gets forked", "two people say different things"],
          right: ["A SCRIPT ROW", "handed to a dialer, versioned, reviewed", "one source of truth"],
          foot: "A script living in a document is already dead.",
        } },
      { t: 35.0, kind: "journey",
        a: {
          kicker: "Three fields, and the second is the interesting one",
          steps: [
            ["name", "identifies the script", "1"],
            ["scriptData", "the script itself — structured", "2"],
            ["campaign", "the motion it was written for", "3"],
          ],
          note: "The word structured is doing real work.",
        } },
      { t: 54.5, kind: "record",
        a: {
          kicker: "Not a blob of prose — the parts a machine can read",
          title: "Script", api: "agencyScripts",
          r: [["opening", "“Hi, is this the owner?”"], ["qualifying", "“How many bays do you run?”"], ["objection", "“We already have someone.”"], ["close", "“Can I book fifteen minutes?”"]],
          focus: "objection",
          note: "The opener, the qualifying questions, the objection handling, the close.",
        } },
      { t: 64.5, kind: "relations",
        a: {
          title: "Script", api: "agencyScripts",
          r: [["name", "Tint — cold call opener"], ["campaign", "Window Tinting Lead Gen"]],
          links: [["agencyCampaigns", "the motion it belongs to"]],
        } },
      { t: 93.3, kind: "typewriter",
        a: {
          kicker: "One source of truth",
          lines: ["The whole team, and every automated agent,"],
          hold: "works from exactly the same words.",
        } },
      { t: 112.7, kind: "agentWork",
        a: {
          head: "Where a script actually gets used",
          steps: ["the dialer reads it when it places a call", "a follow-up text takes its wording from here", "a new joiner reads the nine end to end"],
          foot: "The fastest way to understand how the business sells.",
        } },
      { t: 140.7, kind: "typewriter",
        a: {
          kicker: "A tiny object",
          lines: ["Nine scripts, an outsized effect"],
          hold: "on the whole sales floor.",
        } },
    ],
    outro: {
      t: 145.0, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "Scripts — the words we say, stored as data", url: "twenty.inferencesaver.com/objects/agencyScripts" },
    },
  },

  // ==========================================================================
  // agency-listings — local search. Arc: one query → the page → the receipt.
  // ==========================================================================
  "agency-listings": {
    arc: "One search term → one thin local page → the screenshot receipt",
    promise: "The cheapest repeatable win in the business: a page built for one local search.",
    beats: [
      { t: 0.2, kind: "countup",
        a: { label: "Agency Listings", count: 2, sub: "A directory-style page, published to show up for one local search." } },
      { t: 7.6, kind: "typewriter",
        a: {
          kicker: "A very old idea",
          lines: ["Somebody in Leeds searches for window tinting."],
          hold: "We want a page of ours to be the result.",
        } },
      { t: 18.5, kind: "split",
        a: {
          kicker: "What a listing is not",
          left: ["NOT A HOMEPAGE", "takes a year to rank", "one page, everything, nobody"],
          right: ["A LOCATION PAGE", "thin, local, highly specific", "one place, one thing to rank for"],
          foot: "Each listing is one such page.",
        } },
      { t: 32.5, kind: "record",
        a: {
          kicker: "The field that makes the record meaningful",
          title: "Listing", api: "agencyListings",
          r: [["title", "Window Tinting Leeds"], ["locationQuery", "window tinting leeds"], ["status", "live"]],
          focus: "locationQuery",
          note: "A listing without a location query is just a page.",
        } },
      { t: 48.5, kind: "journey",
        a: {
          kicker: "Two fields for the messy reality of SEO",
          steps: [
            ["parentListingId", "the page this one grew from", "1"],
            ["supersededById", "the page that replaced it", "2"],
            ["the point", "rewrite without losing earned traffic", "3"],
          ],
          note: "A rewrite should not throw away months of ranking.",
        } },
      { t: 61.2, kind: "record",
        a: {
          kicker: "Proof the page rendered",
          title: "Listing", api: "agencyListings",
          r: [["screenshotUrl", "listings/leeds-tint.png"], ["status", "live"]],
          focus: "screenshotUrl",
          note: "It sounds cosmetic and it is not — it is the first thing that breaks.",
        } },
      { t: 82.3, kind: "split",
        a: {
          kicker: "Why listings rather than nicer pages",
          left: ["A HOMEPAGE", "a year to rank", "one page for everyone"],
          right: ["A LOCATION PAGE", "inquiries in weeks", "cost per page falls as we build more"],
          foot: "Local intent is the cheapest repeatable win available to us.",
        } },
      { t: 109.3, kind: "agentWork",
        a: {
          head: "Three times a person uses this object",
          steps: ["prove a listing is live — the screenshot is the receipt", "rewrite a page — parent and superseded keep the ranking", "the website renders from here"],
          foot: "It is the clearest example of a play that scales without more headcount.",
        } },
      { t: 131.1, kind: "typewriter",
        a: {
          kicker: "Two records today",
          lines: ["It is very early."],
          hold: "And it is how the search side of this business works.",
        } },
    ],
    outro: {
      t: 139.0, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "Agency Listings — one page, one place, one search", url: "twenty.inferencesaver.com/objects/agencyListings" },
    },
  },

  // ==========================================================================
  // agency-contents — the CMS in the CRM. Arc: one row one URL → read a row in order.
  // ==========================================================================
  "agency-contents": {
    arc: "One row per URL → the family → read a row in order",
    promise: "Every page on the site is a CRM row, so copy and pipeline finally share one record.",
    beats: [
      { t: 0.2, kind: "countup",
        a: { label: "Agency Contents", count: 14, sub: "One row equals one URL. This object is the content management system." } },
      { t: 14.9, kind: "split",
        a: {
          kicker: "Not a blog, not a page builder",
          left: ["A DEPLOYMENT", "the CRM never learns anything", "marketing and sales are separate"],
          right: ["A CRM TABLE", "the website reads from it", "one record, copy and pipeline"],
          foot: "It lives here in the CRM.",
        } },
      { t: 32.6, kind: "record",
        a: {
          kicker: "Identity first",
          title: "Content", api: "agencyContents",
          r: [["name", "Window Tinting"], ["slug", "window-tinting"], ["canonicalPath", "/window-tinting"]],
          focus: "canonicalPath",
          note: "The canonical path is the definitive address of the page.",
        } },
      { t: 41.1, kind: "journey",
        a: {
          kicker: "The family groups pages that belong together",
          steps: [
            ["service", "the tinting pages", "1"],
            ["comparison", "the versus pages", "2"],
            ["resource", "the guides", "3"],
            ["careers", "the hiring pages", "4"],
          ],
          note: "Change something once and have it land in many places.",
        } },
      { t: 58.0, kind: "record",
        a: {
          kicker: "The SEO line and the next step",
          title: "Content", api: "agencyContents",
          r: [["seoTitle", "Window Tinting in Leeds — ListeningKit"], ["primaryCta", "Book a call"], ["primaryHref", "/book"]],
          focus: "seoTitle",
          note: "The highest-leverage three seconds of text on the page.",
        } },
      { t: 78.6, kind: "typewriter",
        a: {
          kicker: "Why it matters that the site renders from a table",
          lines: ["Because of where the accountability sits."],
          hold: "The same record carries the copy, the search metadata, and the action.",
        } },
      { t: 108.6, kind: "agentWork",
        a: {
          head: "Where this object gets used day to day",
          steps: ["launch a page — this is the record that gets written", "change an offer — the matching page wording changes", "analyse performance — SEO title or CTA"],
          foot: "Updating four tinting pages is four edits, not four deployments.",
        } },
      { t: 151.2, kind: "table",
        a: {
          kicker: "Read a row properly, in this order",
          title: "Contents", api: "agencyContents", count: "14 rows",
          cols: ["canonicalPath", "family", "status", "primaryCta"],
          rows: [
            ["/window-tinting", "service", "live", "Book a call"],
            ["/window-tinting-vs-tintpro", "comparison", "draft", "Read"],
            ["/careers/installer", "careers", "live", "Apply"],
            ["/guides/tint-laws", "resource", "live", "Book a call"],
          ],
          focus: 0, focusCol: "canonicalPath",
          note: "The path, the family, the status, the action — that is what a page is for.",
        } },
      { t: 183.3, kind: "typewriter",
        a: {
          kicker: "Those last two fields",
          lines: ["Right or wrong is the difference"],
          hold: "between a page that generates a call and a page somebody nods at and leaves.",
        } },
    ],
    outro: {
      t: 196.0, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "Agency Contents — the site is a table in the CRM", url: "twenty.inferencesaver.com/objects/agencyContents" },
    },
  },

  // ==========================================================================
  // agency-competitors — the fact base. Arc: opinion vs facts → ranked keywords → pre-flight.
  // ==========================================================================
  "agency-competitors": {
    arc: "Comparison pages are won on facts → ranked keywords → the pre-flight check",
    promise: "A deliberately boring fact base, so every comparison claim has a source behind it.",
    beats: [
      { t: 0.3, kind: "countup",
        a: { label: "Agency Competitors", count: 1, sub: "What we can verify about a business competing for the same customers." } },
      { t: 12.9, kind: "split",
        a: {
          kicker: "Why this object exists",
          left: ["MARKETING OPINION", "“we are better than them”", "does not survive a skeptical buyer"],
          right: ["A FACT BASE", "every claim has a source", "the comparison page holds up"],
          foot: "Comparison pages are won on facts.",
        } },
      { t: 37.0, kind: "record",
        a: {
          kicker: "Identifiers and measurements",
          title: "Competitor", api: "agencyCompetitors",
          r: [["name", "TintPro"], ["domainName", "tintpro.co.uk"], ["industry", "window tinting"], ["competitiveLevel", "direct"]],
          focus: "competitiveLevel",
          note: "In our market and geography, or merely adjacent.",
        } },
      { t: 56.9, kind: "record",
        a: {
          kicker: "The most valuable field on the object",
          title: "Competitor", api: "agencyCompetitors",
          r: [["rankedKeywords", "cheap window tinting leeds"], ["rankedKeywords", "tint prices leeds"], ["rankedKeywords", "mobile tinting"]],
          focus: "rankedKeywords",
          note: "The list of searches this competitor already ranks for.",
        } },
      { t: 84.0, kind: "converge",
        a: {
          kicker: "A competitor's keyword list is an honest description of what they sell",
          n: 12,
          label: "what customers search for",
          verdict: "THE OPENINGS",
        } },
      { t: 110.8, kind: "agentWork",
        a: {
          head: "It is a pre-flight check",
          steps: ["open the record before writing a comparison", "map every claim to a field in here", "if it is not supported, it does not get published"],
          foot: "That discipline stops us saying something embarrassing.",
        } },
      { t: 137.4, kind: "typewriter",
        a: {
          kicker: "Small and deliberately boring",
          lines: ["It is what lets us compete on facts"],
          hold: "once it is not.",
        } },
      { t: 160.7, kind: "record",
        a: {
          kicker: "Read the keyword list as the outline",
          title: "Competitor", api: "agencyCompetitors",
          r: [["rankedKeywords", "cheap window tinting leeds"], ["gtmPriority", "high — worth a page"], ["competitiveLevel", "direct"]],
          focus: "gtmPriority",
          note: "Every phrase is a person at a keyboard comparing options.",
        } },
      { t: 188.6, kind: "typewriter",
        a: {
          kicker: "The industry field is the sanity check",
          lines: ["Verify the row before you write a word."],
          hold: "A wrong row quietly poisons everything built on it.",
        } },
    ],
    outro: {
      t: 203.5, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "Agency Competitors — argue from evidence, not opinion", url: "twenty.inferencesaver.com/objects/agencyCompetitors" },
    },
  },

  // ==========================================================================
  // agency-careers — a job advert is a page. Arc: it is a page → fields → same rigour.
  // ==========================================================================
  "agency-careers": {
    arc: "A job advert is a page → the fields prove it → the same rigour as marketing",
    promise: "A hiring page gets the same treatment as a service page, because it is one.",
    beats: [
      { t: 0.0, kind: "countup",
        a: { label: "Agency Careers", count: 1, sub: "A job advert we have published on the careers section of the site." } },
      { t: 6.6, kind: "split",
        a: {
          kicker: "It looks nothing like a marketing page",
          left: ["A JOB ADVERT", "a PDF somebody uploaded", "no owner, no status, no address"],
          right: ["A PAGE", "a slug, a canonical path, a family", "rendered by Agency Content"],
          foot: "Structurally, it is identical.",
        } },
      { t: 28.5, kind: "record",
        a: {
          kicker: "A managed page, not an upload",
          title: "Career", api: "agencyCareers",
          r: [["name", "Installer — Leeds"], ["title", "Window Tint Installer"], ["slug", "installer-leeds"], ["canonicalPath", "/careers/installer-leeds"]],
          focus: "canonicalPath",
          note: "If the address changes after it is advertised, we lose the applicants.",
        } },
      { t: 52.3, kind: "journey",
        a: {
          kicker: "The rest of the fields",
          steps: [
            ["status", "live or closed", "1"],
            ["family", "groups the careers section", "2"],
            ["primaryHref", "where the Apply button goes", "3"],
          ],
          note: "A filled role can be retired, not left ranking.",
        } },
      { t: 70.3, kind: "typewriter",
        a: {
          kicker: "Why a hiring page gets this treatment",
          lines: ["A broken sales page loses a lead."],
          hold: "A broken hiring page loses every applicant you have.",
        } },
      { t: 105.3, kind: "agentWork",
        a: {
          head: "Where a person uses this object",
          steps: ["decide to hire — the record gets written and published", "advertise — every link points at the canonical path here", "role filled — status updated, page retired"],
          foot: "So we know which adverts people actually clicked.",
        } },
      { t: 128.0, kind: "table",
        a: {
          kicker: "The careers section",
          title: "Careers", api: "agencyCareers", count: "1 live",
          cols: ["title", "canonicalPath", "status", "primaryHref"],
          rows: [
            ["Window Tint Installer", "/careers/installer-leeds", "live", "/apply/installer"],
          ],
          focus: 0, focusCol: "canonicalPath",
          note: "Applicants who come through it land in Agency Career Applications.",
        } },
      { t: 143.8, kind: "typewriter",
        a: {
          kicker: "A careers page is a page",
          lines: ["It has an address. It gets crawled."],
          hold: "So it gets the same rigour as any other page.",
        } },
      { t: 169.2, kind: "journey",
        a: {
          kicker: "In this database it gets the things pages get",
          steps: [
            ["an owner", "somebody is responsible", "1"],
            ["a canonical path", "we know which advert is the real one", "2"],
            ["a status", "a closed role is retired", "3"],
            ["a family", "a new city is a copy, not an invention", "4"],
          ],
          note: "The same treatment as a service page.",
        } },
    ],
    outro: {
      t: 185.0, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "Agency Careers — a job advert is a page", url: "twenty.inferencesaver.com/objects/agencyCareers" },
    },
  },

  // ==========================================================================
  // agency-career-applications — inbox vs pipeline. Arc: liability vs pipeline → read one.
  // ==========================================================================
  "agency-career-applications": {
    arc: "An inbox is a liability → a record is a pipeline → how to read one",
    promise: "The object where the careers flow stops being a website and becomes people.",
    beats: [
      { t: 0.3, kind: "countup",
        a: { label: "Career Applications", count: 4, sub: "One application against one published role." } },
      { t: 21.1, kind: "split",
        a: {
          kicker: "Where an applicant lives",
          left: ["A SHARED INBOX", "the Monday reply never goes out", "they take another offer"],
          right: ["A RECORD WITH A STATUS", "same pipeline view as leads", "nothing quietly falls through"],
          foot: "An applicant in an inbox is a liability.",
        } },
      { t: 30.7, kind: "record",
        a: {
          kicker: "Who they are, and what they applied for",
          title: "Career Application", api: "agencyCareerApplications",
          r: [["name", "Priya Nair"], ["email", "priya@…"], ["phone", "(xxx) xxx-4471"], ["roleTitle", "Window Tint Installer"]],
          focus: "roleTitle",
          note: "The role title is what lets us compare adverts by quality of applicant.",
        } },
      { t: 42.7, kind: "journey",
        a: {
          kicker: "What they sent us, and where they sit",
          steps: [
            ["resumeUrl", "the document they uploaded", "1"],
            ["coverLetter", "often tells you more than the CV", "2"],
            ["status", "where they sit in the process", "3"],
          ],
          note: "The status field is the whole game.",
        } },
      { t: 66.2, kind: "typewriter",
        a: {
          kicker: "Why store applications here",
          lines: ["Everything else has a status, an owner, a next action."],
          hold: "Hiring was the one part running entirely on somebody remembering.",
        } },
      { t: 103.2, kind: "agentWork",
        a: {
          head: "The quality of applicants is feedback on the advert",
          steps: ["read the role title — did they answer the advert we posted", "read the cover letter — a specific reason, a specific thing, or a question", "open the resume last"],
          foot: "A template means they are mass applying — worth knowing before you spend an hour.",
        } },
      { t: 130.2, kind: "typewriter",
        a: {
          kicker: "Reading an application well",
          lines: ["Takes about forty five seconds,"],
          hold: "and almost none of it is spent on the CV.",
        } },
      { t: 156.4, kind: "typewriter",
        a: {
          kicker: "You are not grading the writing",
          lines: ["You are looking for one of three things."],
          hold: "A reason, a thing they have done, or a question.",
        } },
      { t: 176.6, kind: "typewriter",
        a: {
          kicker: "Only after that",
          lines: ["Do you open the resume."],
          hold: "Four applications today is the beginning of a real hiring process.",
        } },
    ],
    outro: {
      t: 186.0, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "Career Applications — a record with a status, not an inbox", url: "twenty.inferencesaver.com/objects/agencyCareerApplications" },
    },
  },

  // ==========================================================================
  // agency-messages — the atom. Arc: thread vs atom → delivery receipt → silent failure.
  // ==========================================================================
  "agency-messages": {
    arc: "The atom of the texting motion → the delivery receipt → silent failure",
    promise: "One row per text, so the outbound pipeline is auditable down to a single carrier event.",
    beats: [
      { t: 0.2, kind: "countup",
        a: { label: "Messages", count: 0, sub: "One individual text, sent or received. Zero today — and that tells you where the motion is." } },
      { t: 17.2, kind: "split",
        a: {
          kicker: "The thread, and the atom",
          left: ["A CONVERSATION", "the whole back and forth", "the readable thread"],
          right: ["A MESSAGE", "one row per text", "the unit that makes delivery auditable"],
          foot: "The conversation is the finished thread. The message is the raw material.",
        } },
      { t: 29.2, kind: "record",
        a: {
          kicker: "The words, the direction, the numbers",
          title: "Message", api: "agencyMessages",
          r: [["body", "“Sorry we missed you — want a callback?”"], ["direction", "outbound"], ["fromNumber", "(xxx) xxx-0147"], ["toNumber", "(xxx) xxx-9920"]],
          focus: "direction",
          note: "Direction matters enormously when you reconstruct a conversation.",
        } },
      { t: 47.8, kind: "journey",
        a: {
          kicker: "The delivery state",
          steps: [
            ["queued", "waiting on the carrier", "1"],
            ["sent", "handed over", "2"],
            ["delivered", "it landed", "3"],
            ["failed", "and nobody was told", "4"],
          ],
          note: "Every one of those steps can fail silently.",
        } },
      { t: 53.8, kind: "record",
        a: {
          kicker: "The reference our provider gives us",
          title: "Message", api: "agencyMessages",
          r: [["telnyxMessageId", "4031…9f2c"], ["status", "delivered"]],
          focus: "telnyxMessageId",
          note: "It lets us go back to the carrier and prove what happened to that message.",
        } },
      { t: 89.2, kind: "overwhelm",
        a: {
          label: "IT CAN FAIL SILENTLY",
          blockers: ["queued at midnight", "filtered by the carrier", "a bad number", "a registration that lapsed"],
        } },
      { t: 95.9, kind: "typewriter",
        a: {
          kicker: "Without this log",
          lines: ["We would believe we had followed up."],
          hold: "When in fact nothing was ever delivered.",
        } },
      { t: 107.7, kind: "agentWork",
        a: {
          head: "Where a person uses this object",
          steps: ["a lead says they never got the text — the status settles it", "reconstruct a conversation — these rows are the evidence", "audit a number — the failure rate shows up here first"],
          foot: "This object is our proof that we did the thing.",
        } },
      { t: 132.8, kind: "typewriter",
        a: {
          kicker: "Zero records today",
          lines: ["The texting side is not running yet."],
          hold: "When it starts, this is what makes it trustworthy.",
        } },
    ],
    outro: {
      t: 141.0, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "Messages — one row per text, every delivery auditable", url: "twenty.inferencesaver.com/objects/agencyMessages" },
    },
  },

  // ==========================================================================
  // agency-conversations — the thread. Arc: a pile is not a conversation → the inbox.
  // ==========================================================================
  "agency-conversations": {
    arc: "A pile is not a conversation → the stable pair key → the inbox view",
    promise: "Messages rolled up into one readable thread, so the outbound motion feels human.",
    beats: [
      { t: 0.0, kind: "countup",
        a: { label: "Conversations", count: 0, sub: "A rolling thread of messages with one phone number." } },
      { t: 21.8, kind: "split",
        a: {
          kicker: "Raw material, and the finished thread",
          left: ["MESSAGES", "one text at a time", "a scatter, a pile"],
          right: ["A CONVERSATION", "all the texts with one person, in order", "a thing a human can read"],
          foot: "The value in talking to a prospect is in the context of what was already said.",
        } },
      { t: 34.2, kind: "record",
        a: {
          kicker: "The fields keep a thread stable and readable",
          title: "Conversation", api: "agencyConversations",
          r: [["pairKey", "4471:9920"], ["peerPhone", "(xxx) xxx-9920"], ["latestPreview", "“yes send me the price”"], ["latestDirection", "inbound"]],
          focus: "pairKey",
          note: "The pair key stops a thread fragmenting because the number formatting changed.",
        } },
      { t: 58.5, kind: "typewriter",
        a: {
          kicker: "The latest direction changes who is chasing",
          lines: ["If the last message was ours,"],
          hold: "it is our turn, and we are being ignored.",
        } },
      { t: 70.3, kind: "journey",
        a: {
          kicker: "Why roll messages up at all",
          steps: [
            ["context", "what was already said", "1"],
            ["the person on the phone", "needs it instantly", "2"],
            ["the latest direction", "whose turn it is", "3"],
          ],
          note: "A scatter of messages is not a conversation.",
        } },
      { t: 105.9, kind: "agentWork",
        a: {
          head: "It becomes the inbox for the whole outbound motion",
          steps: ["open the object and sort by latest activity", "work the top of the list", "hand off between the dialer and whoever replies"],
          foot: "The screen that makes it feel like a real sales floor.",
        } },
      { t: 124.6, kind: "table",
        a: {
          kicker: "The inbox",
          title: "Conversations", api: "agencyConversations", count: "sorted by latest activity",
          cols: ["peerPhone", "latestPreview", "latestDirection"],
          rows: [
            ["(xxx) xxx-9920", "“yes send me the price”", "inbound"],
            ["(xxx) xxx-4471", "“we already have someone”", "outbound"],
          ],
          focus: 0, focusCol: "latestDirection",
          note: "The object a new joiner reads first to learn how the business talks.",
        } },
      { t: 170.1, kind: "record",
        a: {
          kicker: "The pair key is the part people get wrong",
          title: "Conversation", api: "agencyConversations",
          r: [["pairKey", "4471:9920"], ["note", "a fingerprint, not an id"]],
          focus: "pairKey",
          note: "It is computed, not typed. Change how and you orphan every thread.",
        } },
      { t: 190.9, kind: "typewriter",
        a: {
          kicker: "If you build anything that reads these",
          lines: ["Use the key as given."],
          hold: "Never parse it.",
        } },
    ],
    outro: {
      t: 196.0, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "Conversations — the thread that makes outbound feel human", url: "twenty.inferencesaver.com/objects/agencyConversations" },
    },
  },

  // ==========================================================================
  // agency-overview — the outline. What ListeningKit is, what we sell, who buys.
  // ==========================================================================
  "agency-overview": {
    arc: "What we are → seven services → who buys → the price card",
    promise: "ListeningKit is a marketing agency for local shops, selling one thing: a steady flow of booked jobs.",
    beats: [
      { t: 0.4, kind: "countup",
        a: { label: "ListeningKit", count: 1, sub: "A marketing agency for local shops. We sell one thing: a steady flow of booked jobs." } },
      { t: 6.7, kind: "typewriter",
        a: {
          kicker: "One promise",
          lines: ["Websites that load fast and rank."],
          hold: "Then everything that turns a click into a booked job.",
        } },
      { t: 24.3, kind: "journey",
        a: {
          kicker: "Seven services, one booked job",
          steps: [
            ["Websites", "everything points at the site", "1"],
            ["SEO", "so Google finds you", "2"],
            ["PPC", "ads for immediate calls", "3"],
            ["AEO", "so AI assistants quote you by name", "4"],
            ["Missed-call capture", "texts back every missed caller", "5"],
            ["Intent listening", "reviews, competitors, demand signals", "6"],
            ["CRM + follow-up", "every click and call into an appointment", "7"],
          ],
          note: "Websites first, because everything points at the site.",
        } },
      { t: 47.2, kind: "split",
        a: {
          kicker: "Who we sell to",
          left: ["LOCAL SHOPS", "tint, detailing, autobody", "local trades with vans on the road"],
          right: ["THE TEST", "one owner, a small crew", "a phone that has to ring"],
          foot: "If the business lives or dies on booked jobs, it fits.",
        } },
      { t: 61.6, kind: "costCount",
        a: { label: "Set-up, first phone line", from: 0, to: 1000, unit: "$", sub: "One price card, the same for every shop." } },
      { t: 65.7, kind: "table",
        a: {
          kicker: "The uniform price card",
          title: "Pricing", api: "agencyOffers", count: "the same for every shop",
          cols: ["line", "price"],
          rows: [
            ["Set-up, first phone line", "$1,000"],
            ["Each added line", "$500"],
            ["Capped per line / month", "$5,300"],
            ["Bundle", "$5.50–$800 / mo"],
            ["Tooling", "at cost, pass-through"],
          ],
          focus: 0, focusCol: "price",
          note: "Tooling is passed through at cost, never marked up.",
        } },
      { t: 82.2, kind: "journey",
        a: {
          kicker: "Then pick a rung on the follow-up",
          steps: [
            ["Start", "on-site, prove the phones", "1"],
            ["Grow", "$9.99 — the full stack", "2"],
            ["AEO + intent listening", "priority support", "3"],
          ],
          note: "Start on-site, climb to Grow when the phones prove it.",
        } },
      { t: 93.7, kind: "typewriter",
        a: {
          kicker: "The whole business in a sentence",
          lines: ["Websites, SEO, ads, AEO, calls, listening, CRM."],
          hold: "Seven services, one booked job.",
        } },
      { t: 99.9, kind: "endcard",
        a: { word: "ListeningKit", cta: "One agency offer for local shops — a steady flow of booked jobs", url: "listeningkit.com" } },
    ],
    outro: {
      t: 104.0, kind: "endcard", tone: "blue", fx: "wordmark-lockup",
      a: { word: "ListeningKit", cta: "One agency offer for local shops", url: "listeningkit.com" },
    },
  },
};

// Fill the gaps so every extra arc meets the pacing gate (no beat over ~10.5s,
// mean under 7s). The authored beats stay; this only adds beats between them.
for (const [slug, arc] of Object.entries(EXTRA_ARCS)) expandArc(slug, arc);
