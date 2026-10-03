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
    // PACING: no beat runs past ~8s, and each one is a different picture of the
    // sentence it sits on (docs/MOTION_CRITERIA.md M1). `t` is audio-relative, matched
    // to the Deepgram word timings. Tones alternate down the film.
    beats: [
      // ── ACT 1 — what a prospect actually is ──
      { t: 0.0, kind: "countup", tone: "white", fx: "number-tick",
        a: { label: "Agency Prospects", count: 200, sub: "One row, one real business we might be able to win." } },
      { t: 5.4, kind: "table", tone: "blue",
        a: {
          kicker: "The CRM · open the object",
          title: "Prospects", api: "agencyProspects", count: "200 rows",
          cols: ["name", "niche", "city", "region", "aiFitScore"],
          rows: [
            ["Desert Tint Co.", "window tinting", "Tucson", "AZ", "94"],
            ["Pioneer Collision", "autobody", "Phoenix", "AZ", "88"],
            ["Gloss Lab Detailing", "detailing", "Mesa", "AZ", "81"],
            ["Summit Auto Glass", "window tinting", "Flagstaff", "AZ", "76"],
            ["Rio Paint & Panel", "autobody", "Yuma", "AZ", "63"],
          ],
          focus: 0, focusCol: "name",
        } },
      { t: 13.1, kind: "record", tone: "white",
        a: {
          kicker: "Open one row",
          title: "Prospect", api: "agencyProspects",
          r: [["name", "Desert Tint Co."], ["niche", "window tinting"], ["city", "Tucson"]],
          focus: "name",
          note: "The very first card we deal. Everything else in the funnel is played on top of it.",
        } },
      { t: 18.8, kind: "overwhelm", tone: "blue",
        a: {
          label: "A PROSPECT",
          blockers: ["not a person", "not a conversation", "not a deal", ["just a business", "building-storefront"]],
        } },
      { t: 23.9, kind: "record", tone: "white",
        a: {
          kicker: "The shop itself, in a city, doing a kind of work",
          title: "Prospect", api: "agencyProspects",
          r: [["city", "Tucson"], ["region", "AZ"], ["niche", "window tinting"]],
          focus: "city",
          note: "Where it is, and what it does. That is all a prospect is.",
        } },
      { t: 29.4, kind: "journey", tone: "blue", fx: "marker-highlight",
        a: {
          kicker: "Three niches we sell into",
          steps: [
            ["Autobody shops", "collision, paint, panel", "niche"],
            ["Detailing shops", "ceramic, tint, wrap", "niche"],
            ["Window tinting", "the highest-fit niche", "niche"],
          ],
          note: "The niche is what tells us whether we know how to sell into this shop at all.",
          fx: { phrase: "niche", target: ".note", at: 2.4 },
        } },
      { t: 35.9, kind: "relations", tone: "white",
        a: {
          title: "Prospect", api: "agencyProspects",
          r: [["niche", "autobody"], ["city", "Tucson"], ["region", "AZ"]],
          links: [
            ["agencyLeads", "the people we found there"],
            ["agencyCalls", "dialled to the number on this row"],
            ["agencyCampaigns", "aimed at the niche on this row"],
          ],
        } },

      // ── ACT 2 — what lives inside the row ──
      { t: 41.8, kind: "record", tone: "blue",
        a: {
          kicker: "Inside a prospect row — identity",
          title: "Prospect", api: "agencyProspects",
          r: [["name", "Desert Tint Co."], ["slug", "desert-tint-co"], ["niche", "window tinting"]],
          focus: "slug",
          note: "The slug is a clean, web-friendly version of the name. It is what stops “Desert Tint Co. #2” becoming a second business.",
        } },
      { t: 48.7, kind: "record", tone: "white",
        a: {
          title: "Prospect", api: "agencyProspects",
          r: [["niche", "window tinting"], ["city", "Tucson"], ["region", "AZ"]],
          focus: "niche",
          note: "Niche, city, region — what they do, and where they are. This is how a market gets sized.",
        } },
      { t: 54.7, kind: "record", tone: "blue",
        a: {
          kicker: "Then the practical contact stuff",
          title: "Prospect", api: "agencyProspects",
          r: [["phone", "(xxx) xxx-4471"], ["email", "hello@…"], ["emailConfidence", "0.82"]],
          focus: "phone",
          note: "A phone number we can ring.",
        } },
      { t: 58.6, kind: "record", tone: "white",
        a: {
          title: "Prospect", api: "agencyProspects",
          r: [["phone", "(xxx) xxx-4471"], ["email", "hello@…"], ["emailConfidence", "0.82"]],
          focus: "email",
          note: "And an email address, with a confidence score attached.",
        } },
      { t: 61.8, kind: "sentiment", tone: "blue",
        a: {
          kicker: "emailConfidence — how sure are we it is theirs?",
          bars: [["theirs", 82, "0.82"], ["a guess", 18, "0.18"]],
          note: "0.82 is not 1.00. The score is how sure we are the address is genuinely theirs and not a guess.",
        } },
      { t: 66.6, kind: "costCount", tone: "white",
        a: { label: "aiFitScore", from: 0, to: 94, unit: "/ 100", sub: "An AI score for how well this shop fits what we sell." } },
      { t: 69.8, kind: "record", tone: "blue",
        a: {
          kicker: "And the sentence that justifies it",
          title: "Prospect", api: "agencyProspects",
          r: [["aiFitScore", "94 / 100"], ["fitReason", "“Owns 3 tint bays, no competitor within 4 mi”"], ["techStack", "Tektronix, Dealertrack"]],
          focus: "fitReason",
          note: "fitReason is the actual sentence explaining the score — so you can always challenge the number.",
        } },
      { t: 74.4, kind: "record", tone: "white",
        a: {
          kicker: "The tools we detected the shop already runs",
          title: "Prospect", api: "agencyProspects",
          r: [["aiFitScore", "94 / 100"], ["fitReason", "“Owns 3 tint bays, no competitor within 4 mi”"], ["techStack", "Tektronix, Dealertrack"]],
          focus: "techStack",
          note: "techStack is the list of tools we detected the shop is already running.",
        } },

      // ── ACT 3 — why it matters ──
      { t: 81.7, kind: "zoomOut", tone: "blue",
        a: { mystery: "1", big: "Nothing exists without one", sub: "Every other object in the funnel sits on top of a prospect." } },
      { t: 87.45, kind: "converge", tone: "white", fx: "converge-chain",
        a: {
          kicker: "Everything downstream exists only because this row does",
          n: 9,
          labels: ["agencyLeads", "agencyCalls", "agencyPhones", "agencyOpportunities", "agencyTasks", "agencyMessages", "agencyConversations", "agencyCompetitors", "agencyScripts"],
          label: "hangs off a prospect",
          verdict: "THE SPINE",
        } },
      { t: 95.3, kind: "typewriter", tone: "blue", fx: "typewriter-run",
        a: {
          kicker: "Why it matters",
          lines: ["This is the spine of the whole database."],
          hold: "Get it wrong and the damage spreads in every direction.",
        } },
      { t: 100.8, kind: "split", tone: "white", fx: "comparison-wipe",
        a: {
          kicker: "Two ways to get it wrong",
          left: ["MERGED BADLY", "two shops become one", "the wrong history sticks to the wrong business"],
          right: ["DELETED AS A DUPLICATE", "it only looked like one", "and there is no undo for the people under it"],
          foot: "If somebody merges two shops badly, or deletes a prospect because it looks like a duplicate…",
        } },
      { t: 105.97, kind: "relations", tone: "blue",
        a: {
          title: "Prospect · deleted", api: "agencyProspects",
          r: [["name", "Desert Tint Co."], ["status", "gone"], ["label", "—"]],
          links: [
            ["agencyLeads", "orphaned: no other home"],
            ["agencyCalls", "pointing at nothing"],
            ["agencyOpportunities", "the reporting quietly starts lying"],
          ],
        } },
      { t: 114.94, kind: "typewriter", tone: "white", fx: "typewriter-run",
        a: {
          kicker: "That is exactly why",
          lines: ["The object we protect most carefully."],
          hold: "Where is it actually used, day to day?",
        } },

      // ── ACT 4 — where it is used, and your first day on it ──
      { t: 121.5, kind: "agentWork", tone: "blue",
        a: {
          head: "Where a prospect comes from",
          steps: ["their own public websites", "directory listings, tracked by agencyListings", "a new row in agencyProspects"],
          foot: "We find these shops out in the wild.",
        } },
      { t: 129.96, kind: "table", tone: "white",
        a: {
          kicker: "The queue · ordered by aiFitScore",
          title: "Prospects", api: "agencyProspects", count: "worked first → last",
          cols: ["name", "niche", "city", "aiFitScore"],
          rows: [
            ["Desert Tint Co.", "window tinting", "Tucson", "94"],
            ["Pioneer Collision", "autobody", "Phoenix", "88"],
            ["Gloss Lab Detailing", "detailing", "Mesa", "81"],
            ["Rio Paint & Panel", "autobody", "Yuma", "63"],
          ],
          focus: 0, focusCol: "aiFitScore",
          note: "A high-scoring tinting shop in a good market jumps the queue over a low-scoring one.",
        } },
      { t: 139.0, kind: "record", tone: "blue", cursor: true,
        a: {
          kicker: "Then the dialer",
          title: "Prospect", api: "agencyProspects",
          r: [["name", "Desert Tint Co."], ["phone", "(xxx) xxx-4471"], ["aiFitScore", "94 / 100"]],
          focus: "phone",
          cursor: true,
          note: "The phone number stored on this row is literally the number the dialer calls.",
        } },
      { t: 144.5, kind: "record", tone: "white", cursor: true,
        a: {
          kicker: "As deals progress, one field marks where they sit",
          title: "Prospect", api: "agencyProspects",
          r: [["label", "new"], ["label", "working"], ["label", "won"], ["label", "lost"]],
          focus: "label",
          cursor: true,
          note: "If the label is blank, nobody has looked at this row — it is still raw machine output.",
        } },
      { t: 149.8, kind: "journey", tone: "blue", slide: true,
        a: {
          kicker: "The label",
          steps: [["New", "raw machine output", "1"], ["Working", "someone is on it", "2"], ["Won", "a client", "3"], ["Lost", "not this time", "4"]],
          note: "New. Working. Won. Lost.",
        } },
      { t: 153.5, kind: "typewriter", tone: "white", fx: "typewriter-run",
        a: {
          kicker: "When you know nothing else",
          lines: ["Open this object first."],
          hold: "When you join the organization, start here.",
        } },
      { t: 159.0, kind: "zoomOut", tone: "blue",
        a: { mystery: "1", big: "The map of who we are trying to reach", sub: "It is not a spreadsheet entry. It is a bet that this business is worth an hour of somebody's time." } },
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
    // PACING: no beat past ~9s, most 3-8s (docs/MOTION_CRITERIA.md M1). Tones are
    // resolved by resolveTones(): single-stage kinds keep theirs, the rest alternate.
    beats: [
      // ── ACT 1 — what it is, and why it exists ──
      { t: 0.0, kind: "countup",
        a: { label: "One outbound call = one record", count: 29, sub: "We have twenty-nine of them." } },
      { t: 4.4, kind: "table",
        a: {
          kicker: "The CRM · the evidence trail",
          title: "Calls", api: "agencyCalls", count: "29 rows",
          cols: ["direction", "status", "toNumber", "aiSentiment"],
          rows: [
            ["outbound", "connected", "(xxx) xxx-9920", "warm"],
            ["outbound", "voicemail", "(xxx) xxx-4471", "—"],
            ["outbound", "connected", "(xxx) xxx-3306", "cooling"],
            ["outbound", "bounced", "(xxx) xxx-7718", "—"],
            ["outbound", "connected", "(xxx) xxx-5502", "warm"],
          ],
          focus: 0, focusCol: "status",
        } },
      { t: 13.84, kind: "overwhelm",
        a: { label: "COLD CALLING", blockers: ["“I rung 40 shops”", "no transcript", "no recording", "no sentiment", "no way to check"] } },
      { t: 20.89, kind: "record",
        a: {
          kicker: "With it, every call leaves a record",
          title: "Call", api: "agencyCalls",
          r: [["direction", "outbound"], ["status", "connected"], ["aiSummary", "asked about the cancellation clause"]],
          focus: "aiSummary",
          note: "A permanent record somebody can read back and learn from.",
        } },
      { t: 25.77, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "Why it exists",
          lines: ["Not a log for its own sake."],
          hold: "It is how the sales team gets better.",
        } },

      // ── ACT 2 — what lives inside it ──
      { t: 30.5, kind: "record",
        a: {
          kicker: "Inside a call record — the mechanical facts first",
          title: "Call", api: "agencyCalls",
          r: [["direction", "outbound"], ["status", "connected"], ["fromNumber", "(xxx) xxx-0147"], ["toNumber", "(xxx) xxx-9920"]],
          focus: "direction",
          note: "Did we call out, or did somebody call in?",
        } },
      { t: 34.04, kind: "record",
        a: {
          title: "Call", api: "agencyCalls",
          r: [["direction", "outbound"], ["status", "connected"], ["fromNumber", "(xxx) xxx-0147"], ["toNumber", "(xxx) xxx-9920"]],
          focus: "direction",
          note: "The direction: out, or in.",
        } },
      { t: 38.2, kind: "record", fx: "scramble-resolve",
        a: {
          title: "Call", api: "agencyCalls",
          fx: { at: 0.8, steps: 9 },
          r: [["direction", "outbound"], ["status", "connected"], ["fromNumber", "(xxx) xxx-0147"], ["toNumber", "(xxx) xxx-9920"]],
          focus: "status",
          note: "Did it connect, bounce, or go to voicemail?",
        } },
      { t: 43.19, kind: "relations",
        a: {
          title: "Call", api: "agencyCalls",
          r: [["fromNumber", "(xxx) xxx-0147"], ["toNumber", "(xxx) xxx-9920"]],
          links: [["agencyPhones", "one of our own numbers"], ["agencyProspects", "the shop on the other end"]],
        } },
      { t: 50.1, kind: "transcript",
        a: {
          kicker: "Then the useful part — a full transcript",
          lines: [
            "Yeah so we're calling about the review you booked.",
            "We already have quotes off two other places.",
            "The cancellation clause is the bit I'm not sure about.",
            "Can you send that in writing?",
            "I'd need to check with my manager before I commit to anything.",
          ],
          marker: 2,
          dur: 3.4,
        } },
      { t: 54.39, kind: "record",
        a: {
          kicker: "And a recording",
          title: "Call", api: "agencyCalls",
          r: [["transcript", "full text of what was said"], ["recordingUrl", "audio of the actual call"]],
          focus: "recordingUrl",
          note: "Hear the actual conversation, rather than a machine's version of it.",
        } },
      { t: 60.6, kind: "agentWork",
        a: {
          head: "aiSummary · aiSentiment — written for every call",
          steps: ["transcribing the audio", "summarising what it was about", "reading the tone"],
          foot: "Nobody has to sit through 41 minutes of playback.",
        } },

      // ── ACT 3 — why it matters ──
      { t: 69.6, kind: "costCount",
        a: { label: "Playback after a shift, per call", from: 20, to: 0, unit: "min", sub: "Why does an AI summary sound like small potatoes? It is not." } },
      { t: 75.86, kind: "record",
        a: {
          kicker: "Summarised automatically, every call",
          title: "Call", api: "agencyCalls",
          r: [["aiSummary", "asked about the cancellation clause; wants it in writing"], ["aiSentiment", "cooling"]],
          focus: "aiSummary",
          note: "Nobody spends twenty minutes listening to recordings after a shift.",
        } },
      { t: 83.22, kind: "sentiment",
        a: {
          kicker: "In aggregate, are we landing warmly?",
          bars: [["wk 1", "86%", "warm"], ["wk 2", "78%", "warm"], ["wk 3", "71%", "warm"], ["wk 4", "64%", "cooling"], ["wk 5", "52%", "nuisance"]],
          note: "Five weeks, and the tone is dropping. You only see that because every call was recorded.",
        } },
      { t: 89.34, kind: "transcript",
        a: {
          kicker: "The transcript is where objections live",
          lines: ["...", "The cancellation clause is the bit I'm not sure about.", "Can you send that in writing?"],
          marker: 1,
          dur: 2.2,
        } },
      { t: 91.9, kind: "converge",
        a: {
          kicker: "12 calls this month, the same concern",
          n: 12,
          label: "cancel clause",
          verdict: "A POSITIONING PROBLEM",
        } },
      { t: 100.42, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "This object is how we catch it",
          lines: ["Before it costs us a quarter."],
          hold: "Seen in the transcripts, not in the quarterly numbers.",
        } },
      { t: 103.9, kind: "zoomOut",
        a: { mystery: "2", big: "Two directions", sub: "Where does this get used, day to day?" } },
      { t: 107.7, kind: "table",
        a: {
          kicker: "BEFORE a call — the previous records for that number",
          title: "Calls", api: "agencyCalls", count: "(xxx) xxx-9920",
          cols: ["direction", "status", "aiSentiment", "lastObjection"],
          rows: [
            ["outbound", "connected", "warm", "—"],
            ["outbound", "connected", "cooling", "cancellation clause"],
            ["outbound", "voicemail", "—", "—"],
          ],
          focus: 1, focusCol: "lastObjection",
          note: "So you know what you were told last time, and can pick up the thread rather than starting cold.",
        } },
      { t: 116.47, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "AFTER a call",
          steps: [
            ["Summary read", "the AI wrote it, you didn't", "1"],
            ["Sentiment checked", "warm, cooling, or nuisance", "2"],
            ["Next dialer informed", "the mood of the shop carries forward", "3"],
          ],
          note: "The next person to dial that number already knows how the last one went.",
        } },
      { t: 123.19, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "IF YOU ARE NEW",
          steps: [
            ["Read ten records", "end to end, not just the summaries", "1"],
            ["Include the transcript", "the summaries are compressed", "2"],
            ["Listen for what was implied", "and then avoided", "3"],
          ],
          note: "Read ten of these records end to end.",
        } },
      { t: 130.89, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "Why",
          lines: ["The most honest documentation of how we sell."],
          hold: "Written by the prospects themselves.",
        } },

      // ── ACT 4 — the craft: how to actually read one ──
      { t: 138.0, kind: "record",
        a: {
          kicker: "When you open a call record",
          title: "Call", api: "agencyCalls",
          r: [["aiSummary", "the compressed version"], ["aiSentiment", "cooling"], ["transcript", "the full text"]],
          focus: "transcript",
          note: "Do not start with the transcript.",
        } },
      { t: 141.82, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "HOW TO READ A CALL RECORD",
          steps: [["Summary first", "aiSummary — somebody already did the work", "1"], ["Sentiment second", "aiSentiment — the mood", "2"], ["Transcript last", "check the compression was honest", "3"]],
          note: "Start at the bottom, with the summary and the sentiment.",
        } },
      { t: 149.1, kind: "split", fx: "comparison-wipe",
        a: {
          kicker: "Then check whether the compression was honest",
          left: ["WHAT WAS AGREED", "the quote, the price, the date", "the summary gets this right"],
          right: ["WHAT WAS AVOIDED", "the clause nobody would name", "the summary flattens this"],
          foot: "The interesting part of a sales call is rarely what was agreed.",
        } },
      { t: 156.42, kind: "transcript",
        a: {
          kicker: "What was implied, and then avoided",
          lines: [
            "The quote came in at four-fifty a month.",
            "...",
            "Right. And the cancellation — how does that work?",
            "Ah. Well. That's the sort of thing I'd have to check.",
            "Send it over and I'll come back to you.",
          ],
          marker: 3,
          dur: 7.0,
        } },
      { t: 165.32, kind: "split", fx: "comparison-wipe",
        a: {
          kicker: "Moment one — your signal",
          left: ["THE CALLER", "named a price", "..."],
          right: ["THE PROSPECT", "did not flinch", "..."],
          foot: "That is your signal.",
        } },
      { t: 171.48, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "Moment two — your objection",
          lines: ["A question, and a vague answer about timing."],
          hold: "That is your objection, whatever they called it.",
        } },
      { t: 178.92, kind: "record",
        a: {
          kicker: "Check the direction before you read a word",
          title: "Call", api: "agencyCalls",
          r: [["direction", "inbound"], ["direction", "outbound"]],
          focus: "direction",
          note: "Inbound and outbound are two different conversations that happen to share a table.",
        } },
      { t: 186.76, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "Do it on a handful of records",
          lines: ["The table stops being a log."],
          hold: "It starts being a training set.",
        } },
    ],
    outro: {
      t: 192.6,
      kind: "endcard",
      tone: "blue",
      fx: "wordmark-lockup",
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
    // PACING: no beat past ~10s, most 4-7s (docs/MOTION_CRITERIA.md M1). Tones are
    // resolved by resolveTones(): single-stage kinds keep theirs, the rest alternate.
    beats: [
      // ── ACT 1 — the distinction the object exists to make ──
      { t: 0.0, kind: "countup", fx: "number-tick",
        a: { label: "Agency Leads", count: 18, sub: "One row per human being we want on a call." } },
      { t: 6.3, kind: "table",
        a: {
          kicker: "The CRM · the people, not the shops",
          title: "Leads", api: "agencyLeads", count: "18 rows",
          cols: ["contactName", "source", "status", "qualificationStatus"],
          rows: [
            ["Marcus Webb", "campaign", "working", "qualified"],
            ["The service manager", "inbound", "new", "—"],
            ["The body shop manager", "found ourselves", "new", "—"],
            ["Priya Nair", "campaign", "working", "disqualified"],
          ],
          focus: 0, focusCol: "contactName",
        } },
      { t: 12.2, kind: "split", fx: "comparison-wipe",
        a: {
          kicker: "The single most useful distinction",
          left: ["A PROSPECT", "is the company", "a business, in a city"],
          right: ["A LEAD", "is the person inside it", "a human being on a call"],
          foot: "One is a place. The other is somebody who can say yes.",
        } },
      { t: 16.5, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "One shop is one prospect — and three leads",
          steps: [
            ["The owner", "decides whether this ever happens", "1"],
            ["The service manager", "owns the day-to-day work", "2"],
            ["The body shop manager", "owns the jobs that pay", "3"],
          ],
          note: "Same company, same phone number, three separate conversations.",
        } },
      { t: 23.5, kind: "record",
        a: {
          kicker: "Each of them is a different conversation",
          title: "Lead", api: "agencyLeads",
          r: [["contactName", "The owner"], ["contactName", "The service manager"], ["contactName", "The body shop manager"]],
          focus: "contactName",
          note: "The object has to be per-person, or the second call lands on the wrong record. This is also where the commercial state lands.",
        } },
      { t: 28.8, kind: "record", fx: "field-resolve",
        a: {
          kicker: "Once something is a lead, it has a status",
          title: "Lead", api: "agencyLeads",
          r: [["status", "new"], ["status", "working"]],
          focus: "status",
          note: "A status can move. Before that it is just a row of shops in a database.",
        } },

      // ── ACT 2 — what is actually inside the row ──
      { t: 35.6, kind: "record",
        a: {
          kicker: "Identity",
          title: "Lead", api: "agencyLeads",
          r: [["contactName", "Marcus Webb"], ["source", "campaign"], ["status", "working"]],
          focus: "contactName",
          note: "The name tells us exactly who we are talking to.",
        } },
      { t: 40.8, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "source — where this lead came from",
          steps: [
            ["A campaign", "we reached out first", "1"],
            ["An inbound inquiry", "they reached out to us", "2"],
            ["Found ourselves", "our own digging", "3"],
          ],
          note: "The source tells us why we are talking to them at all.",
        } },
      { t: 49.4, kind: "record",
        a: {
          kicker: "Two status fields people often confuse",
          title: "Lead", api: "agencyLeads",
          r: [["status", "working"], ["qualificationStatus", "qualified"], ["coldCallStatus", "connected"]],
          focus: "status",
          note: "status is the general state of the relationship.",
        } },
      { t: 55.57, kind: "record",
        a: {
          kicker: "qualificationStatus — our own judgment",
          title: "Lead", api: "agencyLeads",
          r: [["status", "working"], ["qualificationStatus", "qualified"], ["coldCallStatus", "connected"]],
          focus: "qualificationStatus",
          note: "Is this person actually worth pursuing — are they in a position to say yes?",
        } },
      { t: 64.29, kind: "record", fx: "chip-rail-tick",
        a: {
          kicker: "coldCallStatus — the operational truth",
          title: "Lead", api: "agencyLeads",
          r: [["coldCallStatus", "not called"], ["coldCallStatus", "connected"], ["coldCallStatus", "voicemail"]],
          focus: "coldCallStatus",
          note: "How the phone calls have gone. It is how nobody gets rung twice in a day.",
        } },
      { t: 69.66, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "outboundMessage — the words we actually sent",
          lines: ["Hi Marcus — Sam from ListeningKit.", "We build booking systems for tinting shops.", "Worth 15 minutes this week?"],
          hold: "Kept on the row, not in somebody's sent folder.",
        } },

      // ── ACT 3 — why it matters, and the hinge ──
      { t: 74.4, kind: "costCount", fx: "number-tick",
        a: { label: "Rows we decided to spend money and time on", from: 0, to: 18, unit: "leads", sub: "Why does a lead matter more than a prospect?" } },
      { t: 80.3, kind: "split", fx: "comparison-wipe",
        a: {
          kicker: "Prospects are cheap",
          left: ["A PROSPECT", "just a row", "cheap to hold"],
          right: ["A LEAD", "somebody we decided to ring, message, and chase", "where the time goes"],
          foot: "This is where we start spending money and time.",
        } },
      { t: 87.82, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "The lead is the hinge",
          steps: [["A shop", "agencyProspects", "1"], ["The lead", "the person we are working", "2"], ["Signed work", "agencyOpportunities", "3"]],
          note: "Between a shop and an actual signed piece of work, there is always a lead.",
        } },
      { t: 93.5, kind: "relations", fx: "stroke-trace",
        a: {
          title: "Opportunity", api: "agencyOpportunities",
          r: [["value", "£4,200"], ["status", "signed"]],
          links: [["agencyLeads", "the lead underneath it"], ["agencyProspects", "the shop it started as"]],
        } },
      { t: 99.55, kind: "record", fx: "field-resolve",
        a: {
          kicker: "Ask where a number in a report came from",
          title: "Report", api: "agencyOpportunities",
          r: [["£4,200", "signed"], ["agencyOpportunities", "the deal"], ["agencyLeads", "who we actually rang"], ["agencyProspects", "the shop"]],
          focus: "£4,200",
          note: "It almost always traces back through a lead.",
        } },

      // ── ACT 4 — day to day, then the ladder ──
      { t: 106.98, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "Not every lead converts",
          lines: ["Only 18 — and some will not convert."],
          hold: "That is fine. That is what the status field is for.",
        } },
      { t: 114.2, kind: "zoomOut",
        a: { mystery: "2", big: "Two places, mainly", sub: "Where do we use leads, day to day?" } },
      { t: 118.15, kind: "record",
        a: {
          kicker: "First, the call queue",
          title: "Lead", api: "agencyLeads",
          r: [["contactName", "Marcus Webb"], ["status", "working"], ["coldCallStatus", "not called"]],
          focus: "coldCallStatus",
          note: "When the dialer picks up a job, it is picking up a lead.",
        } },
      { t: 124.0, kind: "table",
        a: {
          kicker: "The queue · read coldCallStatus before dialling",
          title: "Leads", api: "agencyLeads", count: "today",
          cols: ["contactName", "status", "coldCallStatus"],
          rows: [["Marcus Webb", "working", "not called"], ["Priya Nair", "working", "connected"], ["The service manager", "new", "voicemail"]],
          focus: 0, focusCol: "coldCallStatus",
          note: "Has that number already been run today?",
        } },
      { t: 128.31, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "Second, the qualification argument",
          steps: [["Real", "a person, not a name on a list", "1"], ["In market", "able to buy now", "2"], ["Able to pay", "before a consultant hour is spent", "3"]],
          note: "Somebody has to decide before we spend a consultant hour on a shop.",
        } },
      { t: 138.47, kind: "record", cursor: true, fx: "chip-rail-tick",
        a: {
          kicker: "That decision is recorded here",
          title: "Lead", api: "agencyLeads",
          r: [["qualified", "real, in market, able to pay"], ["disqualified", "and the reason it was not"]],
          focus: "qualified",
          note: "The reason stops the same bad fit being re-qualified six weeks from now.",
        } },
      { t: 141.91, kind: "converge", fx: "converge-chain",
        a: {
          kicker: "The practical summary",
          n: 3,
          labels: ["agencyProspects", "agencyLeads", "agencyOpportunities"],
          label: "the ladder",
          verdict: "A PROSPECT IS A MAYBE",
        } },
    ],
    outro: {
      t: 151.2,
      kind: "endcard",
      tone: "blue",
      fx: "wordmark-lockup",
      a: {
        word: "ListeningKit",
        cta: "Agency Leads — the person, not the company",
        url: "twenty.inferencesaver.com/objects/agencyLeads",
      },
    },
  },

  // ============================================================================
  // agency-phones
  //
  // Its own arc: a single row is the thing that decides whether every call we
  // place and every text we send is allowed to happen. Beat times are
  // audio-relative, anchored to `npm run times -- sentences agency-phones`
  // (the narration runs 153.9s). No beat past ~8s; tones alternate.
  // ============================================================================
  "agency-phones": {
    arc: "One row → the four registrations → the blast radius → the send-time check",
    promise:
      "One Agency Phone gates every call and text we place — the registrations on this row decide whether the entire outbound engine is allowed to run.",
    beats: [
      // ── ACT 1 — a single row with an enormous blast radius ──
      { t: 0.0, kind: "countup", fx: "number-tick",
        a: { label: "Agency Phones", count: 1, sub: "One number we own — and it gates every call and text." } },
      { t: 4.4, kind: "record", fx: "field-resolve",
        a: {
          kicker: "One record, and it does not look important",
          title: "Agency Phone", api: "agencyPhones",
          r: [["phoneNumber", "(xxx) xxx-0147"], ["countryCode", "US"], ["numberType", "local"], ["state", "active"]],
          focus: "state",
          note: "One row. At first glance it does not look like a very important object.",
        } },
      { t: 10.4, kind: "overwhelm", tone: "blue",
        a: {
          label: "CONSEQUENTIAL",
          blockers: [
            "a call we place",
            "a text we send",
            "a lead we chase",
            "a conversation we start",
            ["the outbound engine", "phone"],
          ],
        } },
      { t: 15.7, kind: "typewriter", tone: "white", fx: "typewriter-run",
        a: {
          kicker: "That single row decides everything",
          lines: ["Whether every call we place,", "and every text we send,", "is allowed to happen at all."],
          hold: "One row, and it gates the entire outbound engine.",
        } },
      { t: 21.6, kind: "split", fx: "comparison-wipe",
        a: {
          kicker: "Get it wrong and it stops",
          left: ["ONE NUMBER", "gets taken away", "by the carrier or the regulator"],
          right: ["EVERYTHING ELSE", "the calls", "the messages", "the leads"],
          foot: "All of it stops the moment that single row is taken away.",
        } },
      { t: 27.0, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "And all of it stops",
          lines: ["The outbound engine stops.", "The conversations stop."],
          hold: "Get it wrong, and the whole motion dies.",
        } },
      { t: 33.3, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "The fields are regulatory housekeeping",
          lines: ["The fields are mostly regulatory housekeeping.", "And that is the point."],
          hold: "Compliance is stored as data, not in somebody's head.",
        } },

      // ── ACT 2 — the number, then the four registrations behind it ──
      { t: 37.6, kind: "record",
        a: {
          kicker: "The number, and where its rules come from",
          title: "Agency Phone", api: "agencyPhones",
          r: [["phoneNumber", "(xxx) xxx-0147"], ["countryCode", "US"], ["numberType", "local"], ["state", "active"]],
          focus: "countryCode",
          note: "The country code tells the system which country's rules apply.",
        } },
      { t: 43.7, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "numberType — which rulebook the number answers to",
          steps: [
            ["Local", "the default business line", "1"],
            ["Mobile", "a different set of rules again", "2"],
            ["Toll-free", "verified separately before it can send", "3"],
          ],
          note: "The type decides which rules apply before anything is sent.",
        } },
      { t: 50.4, kind: "record", fx: "chip-rail-tick",
        a: {
          kicker: "state — the current status of the number",
          title: "Agency Phone", api: "agencyPhones",
          r: [["state", "active"], ["state", "pending"], ["state", "suspended"]],
          focus: "state",
          note: "The live status. If it is not active, nothing should be leaving this number.",
        } },
      { t: 54.4, kind: "table",
        a: {
          kicker: "And then the three registration IDs — the real payload",
          title: "Agency Phone", api: "agencyPhones", count: "1 row",
          cols: ["tenDlcCampaignId", "tollFreeVerificationId", "messagingProfileId", "state"],
          rows: [
            ["Q2x…", "—", "mp_…", "active"],
          ],
          focus: 0, focusCol: "tenDlcCampaignId",
        } },
      { t: 58.5, kind: "record", fx: "field-resolve",
        a: {
          kicker: "tenDlcCampaignId — business texting, registered",
          title: "Agency Phone", api: "agencyPhones",
          r: [["tenDlcCampaignId", "Q2x…"], ["countryCode", "US"]],
          focus: "tenDlcCampaignId",
          note: "The United States registration that lets us send business text from this number.",
        } },
      { t: 64.5, kind: "record", fx: "field-resolve",
        a: {
          kicker: "tollFreeVerificationId — a separate check",
          title: "Agency Phone", api: "agencyPhones",
          r: [["tollFreeVerificationId", "TFV…"], ["numberType", "toll-free"]],
          focus: "tollFreeVerificationId",
          note: "The separate process a toll-free number has to pass before it can send at all.",
        } },
      { t: 71.0, kind: "relations", fx: "stroke-trace",
        a: {
          title: "Agency Phone", api: "agencyPhones",
          r: [["messagingProfileId", "the sender we present"], ["tenDlcCampaignId", "the texting registration"], ["tollFreeVerificationId", "the separate toll-free check"]],
          links: [["agencyMessages", "every text sent through it"], ["agencyCalls", "every call placed from it"]],
        } },

      // ── ACT 3 — why compliance lives in the CRM at all ──
      { t: 77.0, kind: "split", fx: "comparison-wipe",
        a: {
          kicker: "Compliance is not a preference",
          left: ["WHAT PEOPLE THINK", "a setting somebody ticked", "and can quietly untick"],
          right: ["WHAT IT IS", "a hard constraint", "imposed by carriers and regulators"],
          foot: "Carriers and regulators are not interested in our pipeline.",
        } },
      { t: 84.0, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "Not interested in our pipeline",
          lines: ["Compliance is a hard constraint.", "Not a preference."],
          hold: "Carriers and regulators decide the pace, not us.",
        } },
      { t: 89.5, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "How a number silently fails — part one",
          steps: [
            ["Not registered properly", "texts are silently dropped", "1"],
            ["Complaint rate too high", "the messaging profile is suspended", "2"],
          ],
          note: "Every failure mode is silent. Nothing tells you it failed.",
        } },
      { t: 94.9, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "How a number silently fails — part two",
          steps: [
            ["Toll-free not verified", "nothing arrives", "1"],
            ["No error shown", "you never learn why", "2"],
          ],
          note: "Not registered, suspended, or unverified — all silent.",
        } },
      { t: 99.6, kind: "table",
        a: {
          kicker: "The four ways a send quietly dies",
          title: "Failure modes", api: "agencyPhones", count: "silent",
          cols: ["what went wrong", "what you see", "what the carrier does"],
          rows: [
            ["not registered", "nothing", "drops the text"],
            ["complaints too high", "nothing", "suspends the profile"],
            ["toll-free unverified", "nothing", "sends no error"],
          ],
          focus: 0, focusCol: "what you see",
        } },
      { t: 107.1, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "One row, enormous blast radius",
          lines: ["This object is our single source of truth.", "For whether our outbound is actually permitted."],
          hold: "One row decides whether the whole pipeline is allowed to run.",
        } },
      { t: 112.4, kind: "record", fx: "field-resolve",
        a: {
          kicker: "Where it gets used — at the moment of sending",
          title: "Agency Phone", api: "agencyPhones",
          r: [["state", "active"], ["messagingProfileId", "mp_…"]],
          focus: "messagingProfileId",
          note: "The messaging system reads this record before anything goes out.",
        } },

      // ── ACT 4 — the send-time check, then the closing instruction ──
      { t: 117.2, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "The send-time check, before anything goes out — part one",
          steps: [
            ["Reads this record", "the messaging system opens it first", "1"],
            ["Checks the profile", "is the messaging profile active?", "2"],
          ],
          note: "The check happens before anything goes out.",
        } },
      { t: 123.0, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "The send-time check — part two",
          steps: [
            ["Checks the registration", "is the 10DLC / toll-free valid?", "1"],
            ["Releases the message", "only then does it send", "2"],
          ],
          note: "A legal constraint turned into an automated precondition.",
        } },
      { t: 129.2, kind: "record",
        a: {
          kicker: "When texts are mysteriously not landing",
          title: "Agency Phone", api: "agencyPhones",
          r: [["state", "active"], ["tenDlcCampaignId", "Q2x…"], ["messagingProfileId", "mp_…"]],
          focus: "tenDlcCampaignId",
          note: "This is the first record you open.",
        } },
      { t: 135.6, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "Before you add a second number",
          lines: ["Duplicate the row.", "Get it registered properly first.", "Only then start sending."],
          hold: "And never the other way round.",
        } },
      { t: 141.7, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "The one number, and the four approvals behind it — part one",
          lines: ["10DLC — approved.", "Toll-free — approved."],
          hold: "Read the registrations as four separate answers to four separate authorities.",
        } },
      { t: 148.0, kind: "typewriter", tone: "white", fx: "typewriter-run",
        a: {
          kicker: "The four approvals behind it — part two",
          lines: ["Messaging profile — active.", "State — active."],
          hold: "Before you ever queue a send, confirm the registration is approved, not pending.",
        },
        },
    ],
    outro: {
      t: 153.9,
      kind: "endcard",
      tone: "blue",
      fx: "wordmark-lockup",
      a: {
        word: "ListeningKit",
        cta: "Agency Phones — one number gates every call and text",
        url: "twenty.inferencesaver.com/objects/agencyPhones",
      },
    },
  },

  // ============================================================================
  // agency-tasks
  //
  // Its own arc: a task is not a floating note, it is a commitment that hangs
  // off the record it belongs to. Beat times anchored to
  // `npm run times -- sentences agency-tasks` (the narration runs 127.8s).
  // ============================================================================
  "agency-tasks": {
    arc: "Attached → three fields → next to the record → the habit",
    promise:
      "An Agency Task is follow-up that lives on the record it belongs to — a commitment with a name on it, not a note in a separate list.",
    beats: [
      // ── ACT 1 — attached, not floating ──
      { t: 0.0, kind: "countup", fx: "number-tick",
        a: { label: "Agency Tasks", count: 0, sub: "A to-do that lives on the record it belongs to." } },
      { t: 5.2, kind: "split", fx: "comparison-wipe",
        a: {
          kicker: "The important word is attached",
          left: ["A FLOATING NOTE", "a list somewhere", "Thursday arrives…", "nobody remembers which shop"],
          right: ["AN AGENCY TASK", "hangs off the record", "a prospect, a lead", "an opportunity, an application"],
          foot: "A task is not a floating note. It hangs directly off the record it belongs to.",
        } },
      { t: 8.1, kind: "relations", fx: "stroke-trace",
        a: {
          title: "Agency Task", api: "agencyTasks",
          r: [["title", "call the tinting shop back"], ["status", "to do"], ["assignee", "Sam"]],
          links: [["agencyProspects", "the shop to call"], ["agencyLeads", "the person to call"], ["agencyOpportunities", "the deal it moves"]],
        } },
      { t: 15.5, kind: "overwhelm", tone: "blue",
        a: {
          label: "ZERO TASKS",
          blockers: [
            "an honest picture",
            "of where the team is",
            "no follow-up yet",
            ["the design still matters", "check-circle"],
          ],
        } },
      { t: 20.8, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "Why the design is the thing worth understanding",
          lines: ["The difference between a business that follows up,", "and a business that means to."],
          hold: "The design is the thing worth understanding.",
        } },

      // ── ACT 2 — the three load-bearing fields ──
      { t: 27.6, kind: "record", fx: "field-resolve",
        a: {
          kicker: "Three fields, and all three are load-bearing",
          title: "Agency Task", api: "agencyTasks",
          r: [["title", "call the tinting shop back"], ["status", "to do"], ["assignee", "Sam"]],
          focus: "assignee",
          note: "Drop the assignee and you have a wish. Drop the status and you have a note.",
        } },
      { t: 30.2, kind: "record",
        a: {
          kicker: "title — what the work is",
          title: "Agency Task", api: "agencyTasks",
          r: [["title", "call the tinting shop back"], ["status", "to do"]],
          focus: "title",
          note: "Written so that somebody who was not in the room understands it in two seconds.",
        } },
      { t: 36.0, kind: "record", fx: "chip-rail-tick",
        a: {
          kicker: "status — the real state of the work",
          title: "Agency Task", api: "agencyTasks",
          r: [["status", "to do"], ["status", "in progress"], ["status", "blocked"], ["status", "done"]],
          focus: "status",
          note: "One glance tells anybody whether the work is waiting, moving, stuck, or finished.",
        } },
      { t: 41.0, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "What the status buys you",
          steps: [
            ["To do", "still waiting", "1"],
            ["In progress", "somebody is on it", "2"],
            ["Blocked", "stuck, and visible as stuck", "3"],
            ["Done", "finished, and it shows", "4"],
          ],
          note: "Anybody can glance at the record and see the real state of it.",
        } },
      { t: 45.1, kind: "record", fx: "field-resolve",
        a: {
          kicker: "assignee — the named human doing it",
          title: "Agency Task", api: "agencyTasks",
          r: [["assignee", "Sam"], ["dueAt", "Thu"], ["status", "to do"]],
          focus: "assignee",
          note: "An unassigned task is a wish, and a wish does not get done on Thursday.",
        } },
      { t: 48.0, kind: "split", fx: "comparison-wipe",
        a: {
          kicker: "Drop a field, lose the commitment",
          left: ["DROP THE ASSIGNEE", "you have a wish", "nobody is named"],
          right: ["DROP THE STATUS", "you have a note", "nothing says where it stands"],
          foot: "With all three, you have a commitment with a name on it.",
        } },

      // ── ACT 3 — why follow-up lives next to the record ──
      { t: 55.5, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "Why not a separate list?",
          lines: ["Because separate lists are where work goes to die."],
          hold: "Separate lists are where work goes to die.",
        } },
      { t: 64.7, kind: "table",
        a: {
          kicker: "The note in the notes app, and what happens next",
          title: "Notes app", api: "agencyTasks", count: "0 records",
          cols: ["what was written", "Thursday arrives", "which shop?", "the deal"],
          rows: [
            ["call this shop back Thursday", "—", "nobody remembers", "goes cold"],
          ],
          focus: 0, focusCol: "which shop?",
        } },
      { t: 70.6, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "The deal goes cold",
          lines: ["Nobody can remember which shop.", "The deal goes cold, and nobody can explain why."],
          hold: "Separate lists are where work goes to die.",
        } },
      { t: 76.7, kind: "record", fx: "field-resolve",
        a: {
          kicker: "When the task hangs off the record instead",
          title: "Prospect", api: "agencyProspects",
          r: [["nextAction", "call back Thursday"], ["assignee", "Sam"], ["status", "in progress"]],
          focus: "nextAction",
          note: "Opening the prospect tells you exactly what still needs doing and who owns it.",
        } },
      { t: 84.4, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "You cannot look at a live deal without seeing the work",
          lines: ["You cannot look at a live deal", "without seeing the outstanding work attached to it."],
          hold: "The work is visible on the record itself.",
        } },

      // ── ACT 4 — day to day, then the habit ──
      { t: 89.5, kind: "record",
        a: {
          kicker: "Where it is used — the five-second check",
          title: "Agency Task", api: "agencyTasks",
          r: [["status", "to do"], ["assignee", "Sam"]],
          focus: "status",
          note: "In the five-second check before anything is dropped.",
        } },
      { t: 91.9, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "Three moments, one habit — part one",
          steps: [
            ["A call goes badly", "task: call back Thursday", "1"],
            ["An advert goes live", "task: check rankings in two weeks", "2"],
          ],
          note: "The task appears on the record, at the moment the work appears.",
        } },
      { t: 99.8, kind: "journey", fx: "card-assemble",
        a: {
          kicker: "Three moments, one habit — part two",
          steps: [
            ["An application comes in", "task: reply", "1"],
            ["That is the entire lifecycle", "three moments, one habit", "2"],
          ],
          note: "That is the entire lifecycle — three moments, one habit.",
        } },
      { t: 106.2, kind: "record",
        a: {
          kicker: "The opportunity hiding in zero tasks",
          title: "Agency Task", api: "agencyTasks",
          r: [["count", "0"], ["status", "to do"]],
          focus: "count",
          note: "No tasks is an opportunity, not a problem. The first useful thing anybody does is attach a task.",
        } },
      { t: 113.1, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "The first task you should ever create — part one",
          lines: ["Attach it to the record you are already on.", "Set the status to to-do."],
          hold: "Do it while you are still on the record.",
        } },
      { t: 119.5, kind: "typewriter", fx: "typewriter-run",
        a: {
          kicker: "The first task you should ever create",
          lines: ["Assign it to a named person — you, today.", "Do it every time, and the pipeline runs itself."],
          hold: "Then the record tells the next person what is outstanding. That is the entire return on this object.",
        } },
    ],
    outro: {
      t: 127.0,
      kind: "endcard",
      tone: "blue",
      fx: "wordmark-lockup",
      a: {
        word: "ListeningKit",
        cta: "Agency Tasks — a commitment with a name on it",
        url: "twenty.inferencesaver.com/objects/agencyTasks",
      },
    },
  },
};

/**
 * Stage tones. A scene kind that only works on one stage keeps it (the count-ups sit on
 * white, the pain / reveal / progress scenes on blue); every other beat takes the
 * OPPOSITE of the beat before it, so the film keeps cutting between white-on-blue and
 * blue-on-white (DESIGN_SYSTEM section 4). A beat that sets `tone` itself keeps it.
 */
const FORCED_TONE = {
  countup: "white", costCount: "white", transcript: "white",
  overwhelm: "blue", zoomOut: "blue", agentWork: "blue", sentiment: "blue", endcard: "blue",
};
for (const arc of Object.values(ARCS)) {
  let prev = "blue"; // so the first flexible beat is white
  for (const b of [...arc.beats, arc.outro]) {
    if (!b.tone) b.tone = FORCED_TONE[b.kind] || (prev === "white" ? "blue" : "white");
    prev = b.tone;
  }
}
