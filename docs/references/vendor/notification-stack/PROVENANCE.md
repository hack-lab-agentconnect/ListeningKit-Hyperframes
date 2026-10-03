# notification-stack

Vendored for reading. Not a runtime dependency: nothing in src/ imports it.

- source: https://github.com/heygen-com/hyperframes
- commit: 835e0c16ec62681008682934c4751e630d9d5d7b
- licence: Apache-2.0 (the licence text is in the source repository; attribution is retained here)
- files: `registry/components/notification-stack/notification-stack.html`
- pulled: 2026-10-03

## Why it is here
Cards slide-settle into a stack on cues, newest on top: entrances driven by cue times rather than fixed offsets.

## What we took
- entrance times come from a cue list
- one card is grown slightly to carry focus

## Used by
src/lkdirector.mjs __dir.retime()
