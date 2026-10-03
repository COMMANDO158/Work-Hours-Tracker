---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["weekly-reflection.html"]
---

# FlowFocus app surface

## Scope and mode

The whole app shell at `index.html`: Today, Log, Insights, and Settings, plus the `weekly-reflection.html` redirect. Visitor mode: **Operate**.

## Audience, job, constraints

- The owner (ADHD, contract hours) on an installed PWA, on phone and desktop.
- **Must be effortless:**
  - starting work;
  - knowing where today and the week stand at a glance;
  - breaks without overrun;
  - fixing forgotten time.
- **Must not feel:**
  - cheerleading;
  - a cold timesheet;
  - busy;
  - neon-on-dark glow.
- The UI says "break", never "paid break".
- Data and sync stay compatible (PRODUCT.md).

## Owner pin (2026-10-03)

After the first build, the owner asked for something cleaner and supplied a reference: `.impeccable/reference/owner-reference.png`. It is binding as a composition and inspiration, not as a pixel contract; its sample copy and dial numbering are placeholders.

- **Stones:** a faceted gem stone sits beside the day name, replacing the pie glyph.
- **Break (revised 2026-10-03, second pin):** the owner does like the flip. Taking a break flips the big dial to its 30-minute break face, and returning flips it back. A slim break line under the dial shows the minutes used and left, with the "Take a break" button. There is no separate break dial.
- **Break behaviour (owner, 2026-10-03):** the clock keeps running through a break with no reset. At 30 minutes of break in a day it stops at exactly that moment and waits for Back to work.
- **Sector (owner, 2026-10-03):** the gem sector stops short of the rim, leaving a band of the white face. The ticks and numerals sit on that band.
- **Primary control:** a full-width black Start/Pause button replaces the knob.
- **Week:** a "This week" row of seven dials.
- **Tiles:** Today, Week, and To goal tiles, each carrying a stone.

## Memorable moment

Today's dial fills in the day's gem, beside the stone that names the day.

## Direction contract

**THESIS:** Today's time is a clean visual timer: a flat gem-coloured sector that grows on a white dial in a calm card, and flips to a teal 30-minute face for a break. It refuses neon dark glow and an object costume.

**OWN-WORLD:**
- white cards (22px radius, a hairline border, a faint shadow) on a near-white ground;
- white dials with grey ticks and numerals on a white band at the rim, and one flat sector in the day's gem inside that band, with a small black hub;
- the break as the teal back face of the same dial;
- faceted gem stones as the identity mark: an octagonal brilliant in three tones of the gem;
- Inter, with small tracked uppercase section headings and big, tight figures;
- one full-width black primary button.

The design is light-first, with a true dark mode.

**STORY:**
- A glance shows today's figure and dial, the break line (used and left), the week as seven dials, and the Today, Week, and To goal tiles.
- One button starts and pauses work.
- Log fixes days, and Insights reads patterns.

**FIRST VIEWPORT:**
- **Phone, top to bottom:**
  1. The header: "FlowFocus", with "SATURDAY · TOPAZ" and a Topaz stone beneath it, and the sync dot and gear on the right.
  2. The work card:
     - the "Work session" heading with Finish day beside it;
     - "3h 45m" and its status line;
     - the work dial, centred, which flips to the break face during a break;
     - the slim break line;
     - the full-width Start/Pause button;
     - the note field.
  3. The This week card, then the three tiles.
- **Desktop:** the Today column on the left, with Log or Insights on the right.

**FORM:** The Visual Timer (the pick card, seed key 7534f67a, re-roll 1), recomposed to the owner's pinned reference. The signature interactions are the work dial filling in the day's gem and its flip to the break face and back.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
