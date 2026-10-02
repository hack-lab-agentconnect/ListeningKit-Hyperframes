import fs from "node:fs";
import path from "node:path";

// Fifth section appended to each narration so every video clears three minutes.
const ADD = [
  {
    slug: "agency-prospects",
    eyebrow: "Before you use it",
    heading: "What to check on your very first row",
    body: "One row, and everything hangs off it",
    say:
      "So here is what to actually do on your first day with this object. Open any single record and read it top to bottom before you judge anything. You are looking for four things. Does the name match a real business you could look up on a map. Is the phone number a real number, or is it one of those placeholder values that a scraper fills in when it cannot find anything. Is the fit score high, and does the reason next to it actually justify that score, or is it just saying the obvious. And is the label filled in, because that is what tells a human being whether this row has been looked at by a person or is still untouched machine output. If those four things are right, the row is ready to be worked. If the fit reason is vague, fix it in one sentence before you dial, because that sentence is what the caller reads first. A prospect row is not a spreadsheet entry. It is a bet that this business is worth an hour of somebody's time, and every field on it is either supporting that bet or quietly undermining it.",
  },
  {
    slug: "agency-phones",
    eyebrow: "Before you use it",
    heading: "The one number, and the four approvals behind it",
    body: "Sending is a privilege, not a default",
    say:
      "There is only one of these right now, so let us be precise about what it means. This row is not a list of numbers we might dial some day. It is the record of the legal permissions attached to one number we own. Read the registrations as four separate answers to four separate authorities. The ten D L C campaign is the registration that lets us send business text from that number. The toll free verification is the separate process for a toll free number. The messaging profile is the container that decides which sender we are allowed to present. And the country and state fields decide which rulebook applies, because a number registered in Texas is not governed the same way as one in another country. So the practical instruction is simple. Before you ever queue a send, open this record and confirm the registration is approved, not pending. If it is pending, you are not waiting for marketing to be slow. You are waiting for a carrier. Nobody in this building can make that move faster, and pretending otherwise is how a number gets burned.",
  },
  {
    slug: "agency-calls",
    eyebrow: "Before you use it",
    heading: "What to read on the row you are about to open",
    body: "The transcript and the read on it",
    say:
      "When you open a call record, do not start with the transcript. Start at the bottom, with the summary and the sentiment, because that is the compressed version somebody already did the work on. Then read the transcript to check whether the compression was honest. That is a real skill, and it is the whole job here. The summary is going to be occasionally wrong, because the interesting part of a sales call is rarely what was agreed, it is what was implied and then avoided. Look for the moment where the caller named a price and the prospect did not flinch. That is your signal. Look for the moment where they asked a question and got a vague answer about timing. That is your objection, whatever they called it. And check the direction field before you read a word, because inbound and outbound calls are two different conversations that happen to share a table. Once you have done that on a handful of records, the table stops being a log and starts being a training set.",
  },
  {
    slug: "agency-calls-extra",
    skip: true,
  },
  {
    slug: "agency-campaigns",
    eyebrow: "Before you use it",
    heading: "Turning a campaign on and off without guessing",
    body: "Status is the only switch that matters",
    say:
      "So how does a person actually use this object day to day. Almost entirely through one field, and that is the status. A campaign sits in draft while somebody is still writing the script and building the list. It goes live when the script, the numbers and the compliance checks are all done, and not one moment before. And it goes paused when the evidence says stop, which on outbound is usually a specific and measurable thing rather than a feeling. The numbers are in here for a reason. The url key is the little identifier that appears in the link we put in the message, and the funnel and template base urls are the two places that identifier resolves to. That is how a reply or a booking gets attributed back to this exact campaign instead of just to the business. So the reason this object exists at all, in one sentence, is that it lets you switch a motion off. Most teams cannot switch anything off. This one can, and the reason they can is that the switch lives in a table instead of in somebody's head.",
  },
  {
    slug: "agency-scripts",
    eyebrow: "Before you use it",
    heading: "Changing the words and keeping the record",
    body: "Edit here, never in a notes app",
    say:
      "One last practical thing, and it is the one that gets broken most often. When the team improves an opening line, it gets changed in a script record, not in a document, not in a text file, and definitely not in somebody's head before a call. That is the whole reason this object is structured rather than just being a big text field. The structured data means the system can pull out the pieces it needs, like the first line, or the objection responses, and use them in the places they belong. The call script, the text message, and the training material can all read from one record and stay consistent. If you have ever run a team where the version in the dialer and the version in the training doc disagreed, you already know how expensive that is. Somebody gets told the old line on a call. The objection they thought was handled is not handled. So the discipline is small. If you are about to say new words on a call, the words change here first, and everyone downstream picks them up from here.",
  },
  {
    slug: "agency-leads",
    eyebrow: "Before you use it",
    heading: "Reading the status fields honestly",
    body: "Three statuses, and only one is money",
    say:
      "So when you open a lead, read the three status fields together, because they answer three different questions and confusing them is the most common mistake new people make with this table. The status is the ordinary lifecycle. Is this a real person we are working, or a name on a list. The qualification status is the verdict. Are they actually a fit, and if not, why not, because the reason is what stops you re-qualifying the same bad fit six weeks from now. And the cold call status is the operational truth. Have we rung them, did it connect, were we left on voicemail. A lead can be perfectly qualified and never been called, and that combination is the most valuable thing in this entire database. It is a qualified business nobody has rung yet. When you build your day, build it out of that.",
  },
  {
    slug: "agency-career-applications",
    eyebrow: "Before you use it",
    heading: "The forty-five seconds that actually read an application",
    body: "What to look for before the CV",
    say:
      "Reading an application well takes about forty five seconds and almost none of it is spent on the CV. Start with the role title and ask whether this person answered the advert we actually posted or an advert from three months ago that is still floating around. Then the name and the email, because a surprising share of applications come in with a name that does not match the email address, and that mismatch is the first and cheapest fraud signal you get. Then the cover letter, and you are not grading the writing. You are looking for one of three things. A specific reason they want this job. A specific thing they have actually done. Or a question. Anything else is a template, and a template tells you the person is mass applying, which is a fact about them worth knowing before you spend an hour. Only after that do you open the resume.",
  },
  {
    slug: "agency-careers",
    eyebrow: "Before you use it",
    heading: "Why a job advert is a first-class record",
    body: "A page that earns traffic like any other",
    say:
      "It surprises people that a job advert gets its own object here, so let me justify it. A careers page is a page. It has an address, it gets crawled, it competes for the same attention as every marketing page on the site, and it has an advert on it that people actually read. Which means it can be as badly written as any other page, and nobody would notice, because there is no meeting about the careers page. Putting it in this database means it gets the same treatment as a service page. It gets an owner. It gets a canonical path, so we know which advert is the real one when three exist. It gets a status, so a filled role can be retired instead of quietly ranking for a job that is closed. And it gets a family, so a new city or a new role is added by copying a pattern rather than by inventing one from scratch.",
  },
  {
    slug: "agency-competitors",
    eyebrow: "Before you use it",
    heading: "Turning a keyword list into a page",
    body: "From data to a comparison page",
    say:
      "So here is the practical end of this object. You have one competitor row, and it has a ranked keyword list on it. Read that list as a set of questions people are already typing. Every phrase in there is a person at a keyboard who has a problem and is comparing options. That list is the outline for a comparison page. Not the features we happen to like, not the things we are proudest of, but the things people are actively searching for, in the order they search for them. And the priority field tells you which of those phrases is worth a page of its own versus a paragraph. The competitive level tells you how hard the fight is, which decides whether you write something genuinely useful or simply accurate. The industry field is the sanity check. If a record claims to be a competitor in an industry we do not work in, it is a data error and it will quietly poison whatever you build on top of it. So verify the row before you write a word.",
  },
  {
    slug: "agency-contents",
    eyebrow: "Before you use it",
    heading: "Reading one row and knowing the whole page",
    body: "If it is not in this row, we did not build it",
    say:
      "So to read a row properly, imagine you have never seen the website. The path tells you where the page lives. The family tells you what kind of page it is, whether that is a service page, a comparison, a resource, which means every page of the same kind shares a template and a standard. The status tells you whether it is published, in draft, or retired, and that status is the switch that decides whether it appears at all. The SEO title is the line that shows up in a search result, and it is the highest leverage three seconds of text on the entire page. The primary call to action is the button you want somebody to press, and the href is where it actually goes. Those last two fields being right or wrong is the difference between a page that generates a call and a page somebody visits, nods, and leaves. Read them in that order and you can tell somebody exactly what a page is for without opening it.",
  },
  {
    slug: "agency-conversations",
    eyebrow: "Before you use it",
    heading: "The handover, and why the key is stable",
    body: "Picking up a thread mid-flight",
    say:
      "This is the object that makes the outbound motion feel human rather than automated, so it is worth being concrete about the handover. A number rings, it goes to voicemail, and an automated text goes out. Two hours later a human being replies. That reply has to land somewhere a human will actually see, attached to the business it came from, with the earlier automated message still visible above it. That is what a conversation row is. The pair key is the part people get wrong when they first look at it. It is not a database identifier, it is a stable fingerprint of this number paired with this business, and it is deliberately not something a human types. It is computed so that the same thread always lands on the same row. Change how it is computed and you orphan every existing thread. So if you are building anything that reads these, use the key as given and never parse it.",
  },
  {
    slug: "agency-messages",
    eyebrow: "Before you use it",
    heading: "Reading a thread and spotting a failure",
    body: "Direction, status, and the receipt",
    say:
      "So for the practical skill here, it is reading a thread in order and knowing where it broke. The direction field is the first thing you check on every single row, because inbound and outbound sitting next to each other without that label is genuinely how people get embarrassed on a live lead. Then the status. A message that shows as failed did not reach the phone, and the delivery receipt is where you find out why. Not every failure is our fault. Some of them are a full inbox, some are a number that no longer exists, and some are simply a carrier being slow. But the distinction matters, because a full inbox is a retry in five minutes and a dead number is a correction to the prospect record. Read the thread, find the first failure, and fix the cause rather than resending into the same wall.",
  },
  {
    slug: "agency-listings",
    eyebrow: "Before you use it",
    heading: "Reading the chain, and spotting the duplicate",
    body: "One query, one page, one status",
    say:
      "There are only two of these, so let us use one as the lesson. Every row is a single page that we publish against a single location search. Read the title and you know what the page is arguing it will get you. Read the location query and you know the exact phrase it was built to rank for, and that matters, because it is the contract between the page and the measurement. The status tells you whether it is live. The screenshot is the proof, and it is not decoration, it is the receipt, because the day somebody asks whether this is actually ranking, the screenshot is the only honest answer available. Then look at the two linking fields, the parent and the superseded. They are how this table avoids lying to itself. When we build a better page for the same query, we retire the old one and point it at the new one. That chain is what stops you accidentally running two pages against each other and wondering why neither one ranks.",
  },
  {
    slug: "agency-offers",
    eyebrow: "Before you use it",
    heading: "Why one offer beats five offers",
    body: "One record, every surface",
    say:
      "So the discipline this object enforces is that there is exactly one version of the offer, and every surface reads from it. The page reads the hero headline and the call to action. The advert reads the same words. The person on the phone reads the same words. That is not tidiness, that is a conversion rate. Every time the pitch is rewritten by hand for a new channel, it drifts a little further from what actually works, and nobody notices because the drift is invisible in any single place. Having it here means the correction happens once. When we learn that a headline works better, we change it in this one row and the whole system is corrected by tomorrow. The booking link and the tracking pixel live here too, for the same reason. One link, one place it is defined, so a click from any surface is measurable and a booking from any surface lands in the same calendar.",
  },
  {
    slug: "agency-opportunities",
    eyebrow: "Before you use it",
    heading: "What belongs in a deal and what does not",
    body: "Priced work with a name on it",
    say:
      "There are zero of these at the moment, and it is worth saying plainly what that means rather than glossing it. It does not mean there is no revenue. It means that revenue is currently living in leads, in calls, and in somebody's head, and it has not been promoted into this table. That promotion is the moment a lead becomes a deal, and it is the single most valuable action anybody can take in this system. So when you create one, be strict about the fields. The name is the engagement, not the client, because one client can have several. The stage is the real commercial position, not the optimistic one, because a stage that is a week ahead is a forecast you will be embarrassed by. The description is the scope in plain words that a client could read and nod at. And the owner is the human being who will have to deliver it.",
  },
  {
    slug: "agency-tasks",
    eyebrow: "Before you use it",
    heading: "The first task you should ever create",
    body: "Attach it to the record you are already on",
    say:
      "So if you take one action away from this, make it this. The next time you finish a call, or send a text, or publish a page, and you are already sitting on the record, create the follow-up task before you navigate anywhere else. That is the whole habit. Type a title that would make sense to somebody who was not in the room. Set the status to to do, not to done, because if it is done you would not be creating it. And assign it to a named person, which means you, by name, today, because an unassigned task is a wish and a wish does not get done on Thursday. Now notice what just happened. A task has been created on a record, and that record will now tell the next person who opens it exactly what is outstanding and who owns it. Do that once and the system starts telling the truth. Do it every time and the pipeline starts running itself. That is the entire return on this object.",
  },
];

let n = 0;
for (const add of ADD) {
  if (add.skip) continue;
  const p = path.join("narrations", `${add.slug}.json`);
  const meta = JSON.parse(fs.readFileSync(p, "utf8"));
  const paras = meta.narration.paragraphs.filter((x) => x.eyebrow !== add.eyebrow);
  paras.push({ eyebrow: add.eyebrow, heading: add.heading, body: add.body, say: add.say });
  meta.narration.paragraphs = paras;
  fs.writeFileSync(p, JSON.stringify(meta, null, 2), "utf8");
  const w = paras.reduce((a, x) => a + (x.say || "").trim().split(/\s+/).length, 0);
  console.log(`${add.slug.padEnd(28)} ${paras.length} sections  ${w} words`);
  n++;
}
console.log(`extended ${n} narrations`);
