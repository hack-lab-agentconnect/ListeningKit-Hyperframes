// Storyboard for the ListeningKit Twenty-object explainers.
//
// Beat `t` is AUDIO-RELATIVE seconds, matched against the Deepgram word timings
// in assets/timing/<slug>.json (see cues.mjs output for the anchor times).
// Blueprint shapes come from hyperframes-animation/blueprints/ and the role ->
// shape menu in skills/product-launch-video/references/story-design.md.
//
// Transition flags per beat (applied by build-beats.mjs):
//   zx    -> zoom-through    (section boundaries: new chapter)
//   blur  -> blur-crossfade (backgrounds clash)
//   slide -> push-slide      (a run of consecutive feature beats)
//
// `tone` is the stage colour: "blue" = #2A8CFF flat, "white" = #FFFFFF flat.
// Tones strictly alternate down the video. That is deliberate — it is what stops
// the piece reading as one held layout, and it is the app's own two-tone
// idiom (OnboardingShell `tone` prop, OnboardingShell.tsx:64).

export const ARCS = {
  // Beat times are AUDIO-RELATIVE seconds, matched against the Deepgram word
  // timings in assets/timing/agency-prospects.json. The narration runs 161.5s.
  "agency-prospects": {
    arc: "PAS + Feature-Benefit Cascade",
    promise:
      "Every other object in this library hangs off a prospect — so this is the one row to understand first.",
    beats: [
      // ── ACT 1 — what a prospect actually is ──
      {
        t: 0.0,
        kind: "countup",
        tone: "white",
        a: {
          label: "Agency Prospects",
          count: 200,
          sub: "One row, one real business we might be able to win.",
        },
      },
      {
        t: 15.5,
        kind: "overwhelm",
        tone: "blue",
        blur: true,
        a: {
          label: "A PROSPECT",
          blockers: ["not a person", "not a conversation", "not a deal", "not a quote", "not a task"],
        },
      },
      {
        t: 30.8,
        kind: "journey",
        tone: "white",
        slide: true,
        a: {
          kicker: "Just a business, in a city, doing a kind of work",
          steps: [
            ["Autobody shops", "collision, paint, panel", "niche"],
            ["Detailing shops", "ceramic, tint, wrap", "niche"],
            ["Window tinting", "the highest-fit niche", "niche"],
          ],
          note: "The niche is what tells us whether we know how to sell into this shop at all.",
        },
      },
      {
        t: 35.9,
        kind: "relations",
        tone: "blue",
        blur: true,
        a: {
          title: "Prospect",
          api: "agencyProspects",
          r: [
            ["niche", "autobody"],
            ["city", "Tucson"],
            ["region", "AZ"],
          ],
          links: [
            ["agencyLeads", "the people we found there"],
            ["agencyCalls", "dialled to the number on this row"],
            ["agencyCampaigns", "aimed at the niche on this row"],
          ],
        },
      },

      // ── ACT 2 — what lives inside the row ──
      {
        t: 43.4,
        kind: "record",
        tone: "white",
        zx: true,
        a: {
          kicker: "Inside a prospect row — identity",
          title: "Prospect",
          api: "agencyProspects",
          r: [
            ["name", "Desert Tint Co."],
            ["slug", "desert-tint-co"],
            ["niche", "window tinting"],
          ],
          focus: "slug",
          note: "The slug is a clean, web-friendly version of the name. It is what stops “Desert Tint Co. #2” becoming a second business.",
        },
      },
      {
        t: 48.7,
        kind: "record",
        tone: "blue",
        slide: true,
        a: {
          title: "Prospect",
          api: "agencyProspects",
          r: [
            ["niche", "window tinting"],
            ["city", "Tucson"],
            ["region", "AZ"],
          ],
          focus: "city",
          note: "Niche, city, region — what they do, and where they are. This is how a market gets sized.",
        },
      },
      {
        t: 57.1,
        kind: "record",
        tone: "white",
        slide: true,
        a: {
          title: "Prospect",
          api: "agencyProspects",
          r: [
            ["phone", "(xxx) xxx-4471"],
            ["email", "hello@…"],
            ["emailConfidence", "0.82"],
          ],
          focus: "emailConfidence",
          note: "The confidence score tells us how sure we are that address is genuinely theirs and not a guess. 0.82 is not 1.00.",
        },
      },
      {
        t: 66.6,
        kind: "agentWork",
        tone: "blue",
        zx: true,
        a: {
          head: "aiFitScore · fitReason · techStack — written for every prospect",
          steps: [
            "reading the niche and the market",
            "scoring the fit out of one hundred",
            "writing the sentence that justifies it",
          ],
          foot: "The number is never the whole answer. The sentence is there so you can argue with the number.",
        },
      },
      {
        t: 76.6,
        kind: "record",
        tone: "white",
        slide: true,
        a: {
          kicker: "And the two fields that keep it honest",
          title: "Prospect",
          api: "agencyProspects",
          r: [
            ["aiFitScore", "94 / 100"],
            ["fitReason", "“Owns 3 tint bays, no competitor within 4 mi”"],
            ["techStack", "Tektronix, Dealertrack"],
          ],
          focus: "fitReason",
          note: "fitReason is the actual sentence explaining the score. If it is vague, fix it before you dial — that sentence is what the caller reads first.",
        },
      },

      // ── ACT 3 — why it matters ──
      {
        t: 87.4,
        kind: "converge",
        tone: "blue",
        blur: true,
        a: {
          kicker: "Everything downstream exists only because this row does",
          n: 9,
          // Nine chips, nine real objects. Repeating one phrase across all of
          // them said nothing about what actually hangs off a prospect - it was
          // nine identical cards arranged in a ring.
          labels: [
            "agencyLeads",
            "agencyCalls",
            "agencyPhones",
            "agencyOpportunities",
            "agencyTasks",
            "agencyMessages",
            "agencyConversations",
            "agencyCompetitors",
            "agencyScripts",
          ],
          label: "hangs off a prospect",
          verdict: "THE SPINE",
        },
      },
      {
        t: 105.9,
        kind: "split",
        tone: "white",
        zx: true,
        a: {
          kicker: "Get one of these wrong and the damage spreads",
          left: ["ORPHANED LEADS", "leads that had no other home", "a duplicate delete, or a bad merge"],
          right: ["CALLS POINTING AT NOTHING", "reporting quietly starts lying", "the dialer has nowhere to call back"],
          foot: "This is the object we protect most carefully. It is the spine of the whole database.",
        },
      },

      // ── ACT 4 — where it is used, and your first day on it ──
      {
        t: 121.5,
        kind: "journey",
        tone: "blue",
        zx: true,
        a: {
          kicker: "Where a prospect actually comes from, and what happens next",
          steps: [
            ["Found in the wild", "their own site, plus directory listings", "in"],
            ["Queue ordered", "aiFitScore decides who gets worked first", "queued"],
            ["The number dialled", "the phone on this row is the number called", "out"],
          ],
          note: "A high-scoring tinting shop in a good market jumps the queue over a low-scoring one.",
        },
      },
      {
        t: 144.5,
        kind: "record",
        tone: "white",
        zx: true,
        cursor: true,
        a: {
          kicker: "As deals progress, one field marks where they sit",
          title: "Prospect",
          api: "agencyProspects",
          r: [
            ["label", "new"],
            ["label", "working"],
            ["label", "won"],
            ["label", "lost"],
          ],
          focus: "label",
          cursor: true,
          note: "New. Working. Won. Lost. If the label is blank, nobody has looked at this row — it is still raw machine output.",
        },
      },
      {
        t: 156.2,
        kind: "journey",
        tone: "blue",
        slide: true,
        a: {
          kicker: "Your first day: open one record, check four things",
          steps: [
            ["The name is real", "look it up on a map", "1"],
            ["The phone is real", "not a scraper placeholder", "2"],
            ["The score is earned", "does fitReason justify it?", "3"],
            ["The label is set", "has a human touched this?", "4"],
          ],
          note: "If those four are right, the row is ready to be worked. It is not a spreadsheet entry — it is a bet that this business is worth an hour of somebody's time.",
        },
      },
    ],
    outro: {
      t: 162.4,
      kind: "endcard",
      tone: "blue",
      a: {
        word: "ListeningKit",
        cta: "Agency Prospects — one real business, every other object hangs off it",
        url: "twenty.inferencesaver.com/objects/agencyProspects",
      },
    },
  },

  "agency-calls": {
    arc: "PAS + Feature-Benefit Cascade",
    promise:
      "Every call we place leaves a permanent, readable record — and that record is how the sales team gets measurably better.",
    beats: [
      // ── ACT 1 — what it is, and why it exists ──
      {
        t: 0.0,
        kind: "countup",
        tone: "white",
        a: { label: "One outbound call = one record", count: 29, sub: "We have twenty-nine of them." },
      },
      {
        t: 6.0,
        kind: "overwhelm",
        tone: "blue",
        blur: true,
        a: { blockers: ["“I rung 40 shops”", "no transcript", "no recording", "no sentiment", "no way to check"] },
      },
      {
        t: 20.5,
        kind: "zoomOut",
        tone: "white",
        zx: true,
        a: {
          mystery: "1",
          big: "29 RECORDS",
          sub: "One call leaves a permanent trail somebody can read back and learn from.",
        },
      },

      // ── ACT 2 — what lives inside it ──
      {
        t: 30.2,
        kind: "record",
        tone: "blue",
        zx: true,
        a: {
          kicker: "Inside a call record",
          title: "Call",
          api: "agencyCalls",
          r: [
            ["direction", "outbound"],
            ["status", "connected"],
            ["fromNumber", "(xxx) xxx-0147"],
            ["toNumber", "(xxx) xxx-9920"],
          ],
          focus: "direction",
          note: "Did we call out, or did somebody call in?",
        },
      },
      {
        t: 38.0,
        kind: "record",
        tone: "white",
        slide: true,
        a: {
          title: "Call",
          api: "agencyCalls",
          r: [
            ["direction", "outbound"],
            ["status", "connected"],
            ["fromNumber", "(xxx) xxx-0147"],
            ["toNumber", "(xxx) xxx-9920"],
          ],
          focus: "status",
          note: "Did it connect, bounce, or go to voicemail?",
        },
      },
      {
        t: 43.0,
        kind: "relations",
        tone: "blue",
        blur: true,
        a: {
          r: [
            ["fromNumber", "(xxx) xxx-0147"],
            ["toNumber", "(xxx) xxx-9920"],
          ],
          links: [
            ["agencyPhones", "one of our own numbers"],
            ["agencyProspect", "the shop on the other end"],
          ],
        },
      },
      {
        t: 50.0,
        kind: "transcript",
        tone: "white",
        zx: true,
        a: {
          kicker: "Then the useful part",
          lines: [
            "Yeah so we're calling about the review you booked.",
            "We already have quotes off two other places.",
            "The cancellation clause is the bit I'm not sure about.",
            "Can you send that in writing?",
            "I'd need to check with my manager before I commit to anything.",
          ],
          marker: 2,
        },
      },
      {
        t: 60.3,
        kind: "agentWork",
        tone: "blue",
        zx: true,
        a: {
          head: "aiSummary · aiSentiment — written for every call",
          steps: ["transcribing the audio", "summarising what it was about", "reading the tone"],
          foot: "Nobody has to sit through 41 minutes of playback.",
        },
      },

      // ── ACT 3 — why it matters ──
      {
        t: 69.4,
        kind: "costCount",
        tone: "white",
        zx: true,
        a: {
          label: "Time spent on playback, per call, after a shift",
          from: 20,
          to: 0,
          unit: "min",
          sub: "Nobody does it by hand.",
        },
      },
      {
        t: 82.9,
        kind: "sentiment",
        tone: "blue",
        slide: true,
        a: {
          kicker: "In aggregate, are we landing warmly",
          bars: [
            ["wk 1", "86%", "warm"],
            ["wk 2", "78%", "warm"],
            ["wk 3", "71%", "warm"],
            ["wk 4", "64%", "cooling"],
            ["wk 5", "52%", "nuisance"],
          ],
          note: "Five weeks, and the tone is dropping. You only see that because every call was recorded.",
        },
      },
      {
        t: 89.1,
        kind: "converge",
        tone: "white",
        blur: true,
        a: {
          kicker: "And the transcript is where objections live",
          n: 12,
          label: "cancel clause",
          verdict: "A POSITIONING PROBLEM",
        },
      },
      {
        t: 103.6,
        kind: "record",
        tone: "blue",
        zx: true,
        cursor: true,
        a: {
          kicker: "Day to day — in two directions",
          title: "Prospect",
          api: "agencyProspect",
          r: [
            ["previousCalls", "7 records"],
            ["lastObjection", "cancellation clause"],
            ["lastSentiment", "cooling"],
            ["nextAction", "call back Thursday"],
          ],
          focus: "previousCalls",
          cursor: true,
          note: "BEFORE YOU DIAL — open the last calls for that number so you pick up the thread instead of starting cold.",
        },
      },
      {
        t: 116.2,
        kind: "journey",
        tone: "white",
        zx: true,
        a: {
          kicker: "AFTER a call",
          steps: [
            ["Summary read", "The AI wrote it, you didn't", "10 sec"],
            ["Sentiment checked", "warm, cooling, or nuisance", "10 sec"],
            ["Next dialer informed", "the mood of the shop carries forward", "10 sec"],
          ],
          note: "The next person to dial that number already knows how the last one went.",
        },
      },
      {
        t: 122.9,
        kind: "journey",
        tone: "blue",
        slide: true,
        a: {
          kicker: "IF YOU ARE NEW",
          steps: [
            ["Read ten records", "end to end, not just the summaries", "1 hour"],
            ["Include the transcript", "the summaries are compressed", "—"],
            ["Listen for what was implied", "and then avoided", "—"],
          ],
          note: "The most honest documentation of how we sell — written by the prospects themselves.",
        },
      },

      // ── ACT 4 — the craft: how to actually read one ──
      {
        t: 137.7,
        kind: "typewriter",
        tone: "white",
        zx: true,
        a: {
          kicker: "HOW TO READ A CALL RECORD",
          lines: ["Do not start with the transcript.", "Start at the bottom.", "Summary first. Sentiment second. Transcript last."],
          hold: "The summary is the compressed version somebody already did the work on.",
        },
      },
      {
        t: 148.9,
        kind: "split",
        tone: "blue",
        zx: true,
        a: {
          kicker: "Then check whether the compression was honest",
          left: ["WHAT WAS AGREED", "the quote, the price, the date", "the summary gets this right"],
          right: ["WHAT WAS AVOIDED", "the clause nobody would name", "the summary flattens this"],
          foot: "The interesting part of a sales call is rarely what was agreed.",
        },
      },
      {
        t: 164.8,
        kind: "transcript",
        tone: "white",
        zx: true,
        a: {
          kicker: "Two moments worth stopping on",
          lines: [
            "The quote came in at four-fifty a month.",
            "...",
            "Right. And the cancellation — how does that work?",
            "Ah. Well. That's the sort of thing I'd have to check.",
            "Send it over and I'll come back to you.",
          ],
          marker: 3,
        },
      },
      {
        t: 178.6,
        kind: "typewriter",
        tone: "blue",
        zx: true,
        a: {
          kicker: "ONE LAST CHECK",
          lines: [
            "Check direction before you read a word.",
            "Inbound and outbound are two different conversations that happen to share a table.",
          ],
          hold: "Do it on a handful of records and the table stops being a log. It becomes a training set.",
        },
      },
    ],
    outro: {
      t: 192.6,
      kind: "endcard",
      tone: "blue",
      a: {
        word: "ListeningKit",
        cta: "Call records — one per call, kept forever",
        url: "twenty.inferencesaver.com/objects/agencyCalls",
      },
    },
  },

  // ============================================================================
  // agency-leads
  //
  // Its own arc, not a re-skin of prospects. The object has a different job: a
  // prospect is a company, a lead is a PERSON inside that company, and the whole
  // video turns on that one distinction plus the three status fields people
  // confuse. Beat times are anchored to assets/timing/agency-leads.json, which
  // runs 0.2s - 150.9s across utterances 0-29.
  // ============================================================================
  "agency-leads": {
    arc: "Distinction → three status fields → the hinge → the ladder",
    promise:
      "A prospect is a company. A lead is the person inside it — and this is the only object where the money starts.",
    beats: [
      // ── ACT 1 — the distinction the object exists to make ──
      {
        t: 0.0,
        kind: "countup",
        tone: "white",
        a: {
          label: "Agency Leads",
          count: 18,
          sub: "One row per human being we want on a call.",
        },
      },
      {
        t: 12.2,
        kind: "overwhelm",
        tone: "blue",
        blur: true,
        a: {
          label: "THE DISTINCTION",
          blockers: [
            "a prospect is a company",
            "a lead is a person",
            "one shop, three people",
            "each one, a different conversation",
          ],
        },
      },
      {
        t: 16.5,
        kind: "journey",
        tone: "white",
        slide: true,
        a: {
          kicker: "One shop in Leeds is one prospect — and three leads",
          steps: [
            ["The owner", "decides whether this ever happens", "1"],
            ["The service manager", "owns the day-to-day work", "2"],
            ["The body shop manager", "owns the jobs that pay", "3"],
          ],
          note: "Same company, same phone number, three separate conversations. The object has to be per-person or the second call lands on the wrong record.",
        },
      },
      {
        t: 25.8,
        kind: "record",
        tone: "blue",
        blur: true,
        a: {
          kicker: "This is where the commercial state lands",
          title: "Lead",
          api: "agencyLeads",
          r: [
            ["status", "new"],
            ["status", "working"],
          ],
          focus: "status",
          note: "Once something is a lead it has a status, and a status can move. Before that it is just a row of shops in a database.",
        },
      },

      // ── ACT 2 — what is actually inside the row ──
      {
        t: 35.6,
        kind: "record",
        tone: "white",
        zx: true,
        a: {
          kicker: "Identity and provenance",
          title: "Lead",
          api: "agencyLeads",
          r: [
            ["contactName", "Marcus Webb"],
            ["source", "campaign"],
            ["source", "inbound"],
            ["source", "found ourselves"],
          ],
          focus: "contactName",
          note: "The name tells us exactly who we are talking to. The source tells us why we are talking to them at all — a campaign, an enquiry, or our own digging.",
        },
      },
      {
        t: 49.4,
        kind: "agentWork",
        tone: "blue",
        blur: true,
        a: {
          head: "Three status fields. Three different questions. This is the most confused part of the table.",
          steps: [
            "status — is this a real person, or a name on a list?",
            "qualificationStatus — are they actually a fit, and if not, why not?",
            "coldCallStatus — have we rung them, and did it connect?",
          ],
          foot: "Each one is read by a different person. The dialer reads one, the qualification argument reads another, and the record belongs to both.",
        },
      },
      {
        t: 64.3,
        kind: "record",
        tone: "white",
        slide: true,
        a: {
          kicker: "coldCallStatus — the operational truth",
          title: "Lead",
          api: "agencyLeads",
          r: [
            ["coldCallStatus", "not called"],
            ["coldCallStatus", "connected"],
            ["coldCallStatus", "voicemail"],
          ],
          focus: "coldCallStatus",
          note: "This is the field the dialer reads before it picks up the phone. It is how nobody gets rung twice in a day.",
        },
      },
      {
        t: 69.7,
        kind: "typewriter",
        tone: "blue",
        a: {
          kicker: "outboundMessage — the words we actually sent",
          lines: [
            "Hi Marcus — Sam from ListeningKit.",
            "We build booking systems for tinting shops.",
            "Worth 15 minutes this week?",
          ],
          hold: "Kept on the row, not in somebody's sent folder. Six weeks later this is the only honest record of what was promised.",
        },
      },

      // ── ACT 3 — why it matters, and the hinge ──
      {
        t: 74.4,
        kind: "costCount",
        tone: "white",
        zx: true,
        a: {
          label: "Rows we have decided to spend money and time on",
          from: 0,
          to: 18,
          unit: "leads",
          sub: "Prospects are cheap — they are just rows. A lead is somebody we have decided to ring, message, and chase.",
        },
      },
      {
        t: 88.8,
        kind: "relations",
        tone: "blue",
        blur: true,
        a: {
          title: "Lead",
          api: "agencyLeads",
          r: [
            ["agencyProspects", "the company"],
            ["agencyLeads", "the person we are working"],
            ["agencyOpportunities", "the signed piece of work"],
          ],
          links: [
            ["agencyCalls", "the calls placed against them"],
            ["agencyMessages", "the texts sent to them"],
          ],
        },
      },
      {
        t: 97.5,
        kind: "record",
        tone: "white",
        slide: true,
        a: {
          kicker: "Ask where a number in a report came from",
          title: "Report",
          api: "agencyOpportunities",
          r: [
            ["£4,200", "signed"],
            ["agencyOpportunities", "the deal"],
            ["agencyLeads", "who we actually rang"],
            ["agencyProspects", "the shop"],
          ],
          focus: "£4,200",
          note: "It almost always traces back through a lead. That chain is the reason the object is structured rather than a note on a spreadsheet.",
        },
      },

      // ── ACT 4 — the two places it is used, then the ladder ──
      {
        t: 110.7,
        kind: "journey",
        tone: "blue",
        zx: true,
        a: {
          kicker: "Where leads are used day to day — two places, mainly",
          steps: [
            ["The call queue", "the dialer reads coldCallStatus before it dials", "1"],
            ["The qualification argument", "real, in-market, able to pay", "2"],
          ],
          note: "Both are automated or delegated decisions, and both write their answer back onto this row.",
        },
      },
      {
        t: 130.8,
        kind: "record",
        tone: "white",
        zx: true,
        cursor: true,
        a: {
          kicker: "qualificationStatus — the verdict, and the reason behind it",
          title: "Lead",
          api: "agencyLeads",
          r: [
            ["qualified", "real, in market, able to pay"],
            ["disqualified", "and the reason it was not"],
          ],
          focus: "qualified",
          cursor: true,
          note: "The reason is the part that earns its place. It is what stops the same bad fit being re-qualified six weeks from now.",
        },
      },
      {
        t: 141.9,
        kind: "converge",
        tone: "blue",
        slide: true,
        a: {
          kicker: "The practical summary",
          n: 3,
          label: "the ladder",
          labels: ["agencyProspects", "agencyLeads", "agencyOpportunities"],
          label: "the ladder",
          verdict: "A PROSPECT IS A MAYBE",
        },
      },
    ],
    outro: {
      t: 151.2,
      kind: "endcard",
      tone: "blue",
      a: {
        word: "ListeningKit",
        cta: "Agency Leads — the person, not the company",
        url: "twenty.inferencesaver.com/objects/agencyLeads",
      },
    },
  },
};
