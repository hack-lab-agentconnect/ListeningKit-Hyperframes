/**
 * lkclock.mjs - the timing constants every part of the build agrees on, in one place.
 *
 * build-beats.mjs places beats with them, lkdirector.mjs plans motion against them, and
 * scripts/lint-pacing.mjs checks the plan against them. They used to live in
 * build-beats.mjs, which meant a lint that wanted the same numbers had to copy them.
 * A second copy of a timing constant is a second thing to forget at tuning time.
 */
export const CLOCK = {
  INTRO: 0.8, // beat 0 must be on screen at t=0
  XF: 0.45, // legacy overlap: how long a beat outlives the next one's start (the tail guard)
  LEAD: 0.65, // J-cut: the next picture starts this long before its line is spoken
  // A beat's own animation starts this long after the beat does. The outgoing scene is
  // leaving for the first ~0.3s of a seam, and the incoming stage colour only exists once
  // the flare peaks; starting the content immediately is what made every cut a double
  // exposure. ENTER + the entrance duration still lands on the first word.
  ENTER: 0.34,
  OUTRO: 8.0, // the silent end card
};
