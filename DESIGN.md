---
name: FlowFocus
description: A clean visual timer for contracted hours, 6 a workday and 30 a week, one gem per weekday.
colors:
  ground: "#F4F5F7"
  card: "#FFFFFF"
  card-edge: "#E5E7EB"
  panel: "#F6F7F9"
  ink: "#111317"
  ink-2: "#4B525C"
  ink-3: "#666D77"
  rule: "#ECEEF1"
  rule-strong: "#D7DBE0"
  face: "#FFFFFF"
  face-edge: "#E2E5E9"
  tick: "#1C1F24"
  tick-soft: "#A3AAB3"
  hub: "#111317"
  primary: "#16181C"
  primary-ink: "#FFFFFF"
  primary-hover: "#2A2D33"
  soft: "#F1F2F4"
  soft-hover: "#E7E9EC"
  break: "#12A39A"
  break-ink: "#0B6E68"
  break-on: "#FFFFFF"
  ok: "#16A34A"
  warn: "#C77A06"
  danger: "#C2263A"
  danger-soft: "#FBE9EB"
  focus: "#111317"
  selection: "#D6E2FB"
  topaz: "#F29A0E"
  topaz-ink: "#8F5A00"
  topaz-on: "#111317"
  emerald: "#17925C"
  emerald-ink: "#0C6440"
  emerald-on: "#FFFFFF"
  sapphire: "#2453CC"
  sapphire-ink: "#1A3E9E"
  sapphire-on: "#FFFFFF"
  amethyst: "#8444C6"
  amethyst-ink: "#612F97"
  amethyst-on: "#FFFFFF"
  diamond: "#A9D2E4"
  diamond-ink: "#2F6684"
  diamond-on: "#111317"
  ruby: "#D42A4C"
  ruby-ink: "#9A1533"
  ruby-on: "#FFFFFF"
  tourmaline: "#D6428A"
  tourmaline-ink: "#A12863"
  tourmaline-on: "#FFFFFF"
  clear: "#CDD2D9"
  clear-ink: "#5D646E"
  clear-on: "#111317"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  body-sm:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  micro:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.16em"
  label-tight:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
  button:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
  numeral:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    fontFeature: "tnum"
rounded:
  sm: "10px"
  md: "14px"
  field: "12px"
  cta: "16px"
  tile: "18px"
  card: "22px"
  pill: "999px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "20px"
  s-6: "24px"
  s-8: "32px"
  s-10: "40px"
  s-12: "48px"
  s-16: "64px"
  gutter: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-block:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.cta}"
    width: "100%"
    height: "58px"
  button-soft:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-soft-hover:
    backgroundColor: "{colors.soft-hover}"
  button-quiet:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-quiet-hover:
    backgroundColor: "{colors.panel}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.card}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-text:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "32px"
  button-text-hover:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "18px"
  tile:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.tile}"
    padding: "14px 12px 14px 14px"
  tile-label:
    textColor: "{colors.ink-3}"
    typography: "{typography.label-tight}"
  card-label:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
  break-line:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.md}"
    padding: "4px 4px 4px 12px"
    height: "48px"
  break-line-text:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
  button-break:
    backgroundColor: "{colors.card}"
    textColor: "{colors.break-ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "48px"
  note-field:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 12px"
    height: "44px"
  segmented:
    backgroundColor: "{colors.soft}"
    rounded: "{rounded.md}"
    padding: "4px"
  segmented-option:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "38px"
  segmented-option-selected:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
  segmented-rhythm:
    backgroundColor: "{colors.soft}"
    rounded: "{rounded.md}"
    padding: "4px"
    width: "420px"
  segmented-rhythm-option:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "0 6px"
    height: "38px"
  tab-bar:
    backgroundColor: "{colors.card}"
    height: "64px"
  tab:
    textColor: "{colors.ink-3}"
  tab-active:
    textColor: "{colors.ink}"
  sync-pill:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "40px"
  app-icon:
    backgroundColor: "{colors.primary}"
    width: "512px"
    height: "512px"
  notice:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.md}"
    padding: "12px 8px 12px 16px"
---


# Design System: FlowFocus

## Overview

**Creative North Star: "The Clean Visual Timer"**

Today's time is a white dial in a calm white card, filling clockwise with one flat sector in the day's gem. The break is the back of the same dial: taking a break turns it edge-on to a teal 30-minute face, and Back to work turns it home. A slim break line under the dial says what is used and what is left. Everything else is quiet: near-white ground, hairline-bordered cards with a faint lift, grey ticks and numerals on a white band at the rim, a small black hub, and Inter set big and tight for figures and small, tracked, and uppercase for the headings that name each card. The one loud object on a screen is the full-width black Start/Pause button.

Gems are the identity. Each weekday owns a gem: Saturday Topaz, Sunday Emerald, Monday Sapphire, Tuesday Amethyst, Wednesday Diamond, Thursday Ruby, Friday Tourmaline. Each gem has its own cut, built in CSS 3D. The day's gem turns beside the wordmark, moving in a way that belongs to it, and the same gem fills that day's dials, bars, and rosette wedges. A neutral eighth stone, Clear, stands for totals and is never a day.

The system is light-first with a true dark mode, built for an installed PWA on phone and desktop. Density is comfortable but tight enough that the whole Today column fits a 900px-tall desktop window. The system rejects neon-on-dark glow and an object costume for the timer (housings, knobs, hands).

**Key Characteristics:**
- White cards (22px radius, 1px hairline, faint two-layer shadow) on a near-white ground.
- White dials whose ticks and numerals sit on a white band at the rim, with one flat gem sector inside that band and a small black hub. No dial has a hand.
- One big dial with two faces: work in the day's gem, break in teal. Only one face shows at a time.
- Teal for everything about the break, and only the break.
- Gems in their own cuts, in CSS 3D: a turning gem of the day in the header, still stones on tiles and in the legend.
- Inter only: big tight figures, small tracked uppercase card headings, tabular numbers everywhere.
- One full-width black primary button per screen.
- Motion is short and functional (140ms and 220ms). The flip and the gem of the day are the two designed motions.

## Colors

A neutral grey-and-white field where colour means something: the day's gem, the break's teal, and status.

### Primary
- **Timer Black** (primary): the Start/Pause block button, the Today pill in Log, and the notice toast. In dark mode it inverts to near-white with black ink.
- **Hub Black** (hub, tick): the dial hub and the major ticks. It is the only solid mark at the centre of every dial.

### Secondary: the weekday gems
Each gem is a triplet: the **fill** (sector, stone girdle, bar), the **ink** (the sector's edge stroke, stone outline, the lap sector, and any gem-coloured text), and the **on** colour (marks printed over the fill). Elements opt in with `data-gem`, which sets `--g`, `--gi`, and `--go`. Since the rim band, no dial in the app prints a mark over its fill; the on colours survive in the tokens and in the app icon.
- **Topaz** (topaz / topaz-ink / topaz-on): Saturday. Dark marks on the fill.
- **Emerald** (emerald / emerald-ink / emerald-on): Sunday.
- **Sapphire** (sapphire / sapphire-ink / sapphire-on): Monday.
- **Amethyst** (amethyst / amethyst-ink / amethyst-on): Tuesday.
- **Diamond** (diamond / diamond-ink / diamond-on): Wednesday. A pale ice blue; dark marks on the fill.
- **Ruby** (ruby / ruby-ink / ruby-on): Thursday.
- **Tourmaline** (tourmaline / tourmaline-ink / tourmaline-on): Friday.
- **Clear** (clear / clear-ink / clear-on): not a day. It is reserved for the Week and To goal tiles' stones and for past-week dials.

### Tertiary: break and status
- **Break Teal** (break): the break face's sector, and the 14% tint of the break line while a break runs or has hit its stop. **Break Ink** (break-ink) edges the break sector and colours the cup icon and the "Take a break" text. **Break On** (break-on) is declared for marks over the teal fill; the rim band means none are drawn today.
- **Status** (ok, warn, danger, danger-soft): sync-dot states and destructive actions only. Danger is also the field-error text and the invalid-field ring. The idle and syncing sync dots are ink-2, never a gem.

### Neutral
- **Ground** (ground): the page behind everything, and the theme colour.
- **Card White** (card) with **Card Edge** (card-edge): every card, tile, tab bar, and quiet button.
- **Panel** (panel): recessed areas inside cards (the break line at rest, the note field, the open Log editor, hovered rows, the bar track).
- **Ink ramp** (ink, ink-2, ink-3): text, then secondary text (status line, lede, break line), then tertiary text and card headings. Ink-3 holds at least 4.5:1 on card and ground.
- **Rules** (rule, rule-strong): row dividers, then field and quiet-button strokes.
- **Face** (face, face-edge): the dial face and its 1px rim. **Tick Soft** (tick-soft) for minor ticks.
- **Soft** (soft, soft-hover): soft buttons, the segmented track, icon-button hover, rest-day dial faces.

### Dark mode
Two identical paths: `prefers-color-scheme: dark` on `:root:not([data-mode="light"])`, and an explicit `:root[data-mode="dark"]`. Every token is re-declared. Ground goes near-black (#0E0F11), cards dark grey (#17191C), the hub and primary invert to near-white, and gems lift in lightness. Every gem's "on" colour becomes near-black, and its ink becomes a pale tint used for edges and text. Clear darkens to a mid grey. Shadows deepen to plain black alpha. Nothing glows except a stone's own small bloom.

### Named Rules
**The Gem Means a Day Rule.** A gem colour appears only where it stands for its weekday: dial sectors, stones, rosette wedges, weekday bars, and the input caret on that day. Gems are never button, link, status, or decoration colours. The one fixed gem is the app icon, a portrait of the work dial in Topaz (see App icon).

**The Triplet Rule.** Use a gem only through its triplet. Fill with `--g`, edge and text with `--gi`, and marks over the fill with `--go`. Never set text in the fill shade.

**The Clear Is Not a Day Rule.** The Clear stone and sector mean totals: the Week and To goal tiles, and past weeks. Never assign Clear to a weekday or use it as a rest-day colour. Rest days use a Soft face and a Tick Soft hub.

**The Teal Is the Break Rule.** Teal is reserved for the break face, the break line, and break state. Nothing else is teal.

## Typography

**Display Font:** Inter (self-hosted variable woff2, weights 400 to 800), with system-ui fallback
**Body Font:** Inter
**Label/Mono Font:** Inter for labels. A system monospace stack exists for the rare code-like value (`.mono`, the gist id in Settings).

**Character:** one neutral grotesque doing everything. Hierarchy comes from size and weight: big and negatively tracked for figures, small and positively tracked uppercase for headings.

### Hierarchy
- **Display** (700, 3.25rem, line-height 1, -0.035em): today's worked figure ("3h 45m"). It steps down to 2.75rem in the wide layout. The Insights week figure uses the same treatment at 2.5rem.
- **Headline** (800, 1.75rem, -0.03em): the FlowFocus wordmark, and the Log, Insights, and Settings view titles (h1, -0.025em).
- **Title** (700, 1.125rem, -0.02em): tile figures (1.375rem when wide), Log week titles and totals.
- **Body** (400, 1rem, 1.5): the status line, notes, and records. Prose is capped at 60 to 65ch.
- **Body small** (0.875rem): the break line (one nowrap line with an ellipsis, its lead phrase in 600 ink), the "Take a break" button, the note field, field help, Log meta, legends, small buttons.
- **Micro** (0.6875rem, -0.01em, tabular): the week strip's hours on phones. They step up to 0.75rem from 480px.
- **Label** (600, 0.75rem, 0.16em, uppercase, ink-3): card headings ("Work session", "This week", and the Insights and Settings section titles, which carry the same shared label style), and the day line under the wordmark ("SATURDAY · TOPAZ").
- **Label tight** (600, 0.75rem, 0.08em, uppercase, ink-3): the tile headings ("Today", "Week", "To goal"), with tracking halved so they fit the narrow tiles beside their stones.
- **Numeral** (600, 19px in the 300-unit dial viewBox, tabular, ink): the big dial's numerals on the rim band, 0 to 5 on the work face and 0, 5, 10, 15, 20, 25 on the break face. They carry no halo.

### Named Rules
**The Label Is the Heading Rule.** The small tracked uppercase label is the card's actual heading (h2 or h3). It is never an eyebrow or kicker stacked above another heading.

**The One Label Rule.** Every card and section heading uses the one shared label style. Views never restyle it, except the tiles, which only tighten its tracking (0.08em).

**The Still Numbers Rule.** The body sets `font-variant-numeric: tabular-nums`. A ticking figure never shifts its neighbours.

**The Copy Says Break Rule.** The UI says "break", never "paid break".

## Layout

The layout is phone-first, with a single column of cards on a 16px gutter (max width 560px) and a 12px gap between cards. A fixed bottom tab bar (64px plus the safe area) holds Today, Log, and Insights. Settings is the gear in the header.

- **Header:** the gem of the day (52px, 44px under 400px wide) spans two rows at the left. The wordmark and the tools (sync pill, gear) share the first row; the day line (date, gem name) runs beneath both.
- **Work card, top to bottom:** the "Work session" heading with Finish day on the right (the heading stays "Work session" through a break); the display figure and the status line; the big dial, centred (up to 272px wide on phones, 232px when wide), with 16px above and below; the break line; the full-width Start/Pause button; the note field.
- **This week card:** seven equal columns. Each has a weekday abbreviation, a 44px day dial, and the hours. Today's column is set bold. Nothing sits under the row.
- **Tiles:** three equal tiles (Today, Week, To goal). Each has a 20px stone pinned to its top-right corner.
- **Log, Insights, Settings:** stacks of cards with 12px between them. Settings holds three sections: Sync, Backup, and Appearance.
- **Wide (min-width 1024px):** a two-column grid, with the Today column on the left (440 to 500px, then 540px at 1400px and up). The Today column is sticky, scrolls on its own, and is compacted so the whole column fits a 900px-tall window (the dial at 232px, the break line at 44px, the block button at 52px). The right column holds the active view (max 760px), and its tabs become an inline segmented strip with Today hidden. Notices move to the bottom right.
- **Rhythm:** a 4px base (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). Card padding is 16 to 20px, and tiles use 14px.

## Elevation & Depth

Depth is soft, layered, and quiet. Cards and tiles lift slightly off the ground with a two-layer ambient shadow and a 1px hairline. The big dial is the one element inside a card with its own lift, carried on the flip card so it holds through the turn. Toast notices float. Inside cards, depth goes down instead: recessed areas (the break line, the note field) use Panel, never a shadow.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgba(17,19,23,0.04), 0 6px 20px rgba(17,19,23,0.04)`): cards, tiles, the selected segment, the active wide tab.
- **Dial** (`box-shadow: 0 1px 2px rgba(17,19,23,0.06), 0 12px 28px rgba(17,19,23,0.08)`): the big dial's flip card only.
- **Float** (`box-shadow: 0 2px 6px rgba(17,19,23,0.08), 0 16px 36px rgba(17,19,23,0.14)`): notices.

In dark mode the same three roles use black alpha (0.25 to 0.5).

### Named Rules
**The Flat Face Rule.** Dial faces and sectors carry no gradient, glow, or bevel. Stones are the one exception: they are cut glass (see Stone), and their shine stays inside the stone and its own small bloom.

**The One Lifted Dial Rule.** Only the big dial (either face) gets the dial shadow, on its flip card. Day dials, past-week dials, and rosettes sit flat.

## Shapes

Shapes are soft rounded rectangles and true circles. Radii step up with the size of the container: 10px for small controls and rows, 12px for fields, 14px for buttons, the segmented track, and the break line, 16px for the block button, 18px for tiles, and 22px for cards. Pills (999px) are used only for the sync pill and the Today pill. Every dial is a full circle with a 1px face-edge rim, and its sector stops short of the rim, leaving a band of white face for the ticks and numerals. Each stone has its own cut (see Stone). Hairlines are always 1px.

## Components

### Buttons
Buttons are solid and plain, with weight carried by fill, never by outline tricks.
- **Shape:** gently rounded (14px). The block button is 16px, and small buttons are 10px.
- **Primary:** Timer Black with white ink, 48px tall, 20px side padding, 600 weight.
- **Block (Start/Pause):** full width, 58px tall (52px when wide), 1.125rem text, with a 22px play or pause glyph. The running stretch stopwatch rides on the button at 70% opacity while working, paused, on a break, and at the break stop; a break does not reset it.
- **Soft:** Soft fill with ink text, for secondary actions such as "Keep counting" on the gap banner.
- **Quiet:** card fill, a rule-strong 1px stroke, and ink text. The hover moves the fill to Panel and the stroke to ink-3.
- **Take a break:** the small quiet button (40px, 10px radius, 0.875rem) with Break Ink text. It sits at the right end of the break line and is removed while a break runs or when no break is left.
- **Danger:** danger fill with card-coloured text. Destructive confirmations only.
- **Text:** transparent with ink-2 text and a Soft fill on hover ("Finish day").
- **States:** 140ms colour transitions. Active is scale(0.985). Disabled is 45% opacity. Focus-visible is a 3px focus-colour outline at a 3px offset.

### Cards / Containers
- **Corner Style:** 22px for cards, 18px for tiles.
- **Background:** Card White.
- **Shadow Strategy:** the Card shadow (see Elevation).
- **Border:** 1px card-edge.
- **Internal Padding:** 16 to 20px for cards, 14px for tiles.
- **Heading:** a `card-head` row with the label heading on the left and at most one text action on the right.

### Inputs / Fields
- **Style:** card fill, a 1px rule-strong stroke, a 12px radius, 48px tall.
- **Focus:** the stroke turns ink, plus a 1px ink ring.
- **Error:** a danger stroke and ring, and 600-weight danger text below.
- **Note field:** a borderless Panel strip with a pencil icon, 44px tall. Its focus is an inset 1.5px ink ring.

### Segmented control
A Soft track with 4px padding and a 14px radius. Options are 38px tall, ink-2. The selected option takes Card White, ink text, and the Card shadow.
- **Weekday rhythm period (4 weeks, 8 weeks, 12 weeks, All):** the track becomes a four-column grid of equal options, stretched to a maximum of 420px. Its options use 6px side padding and never wrap, so "All" never sits alone on a second row.

### Navigation
- **Phone:** a fixed bottom bar on Card White with a top hairline and three equal tabs (23px icon over a 0.75rem 600 label). Inactive tabs are ink-3. The active tab is ink, with a 3px ink bar along the top edge.
- **Wide:** the tabs become an inline segmented strip above the view. The active tab is Card White with the Card shadow.
- **Header tools:** the sync pill (a 9px status dot plus a 0.875rem label, pill radius, Soft on hover) and a 44px gear icon button. The dot is ok when synced, ink-2 when idle or syncing, warn when offline or retrying, and danger (with danger label text) for auth, missing, or data errors.
- **Icons:** 24px stroked line icons (1.75 stroke, round caps), drawn in currentColor from an inline sprite.

### Big dial (signature)
One dial with two faces on a flip card. Both faces share one 300-unit geometry.
- **Face:** a white face (r147) with a 1px rim.
- **Rim band:** the sector is drawn to r103, inside the ticks. Ticks run from r108 (majors from r106) out to r120. Numerals sit at r126 on the sides and r134 at the poles, each anchored by its side of the dial (start on the right, end on the left, middle at top and bottom) so its inner edge clears the ticks. No sector ever covers a tick or numeral.
- **Ticks:** majors are 3px Hub Black, minors 1.5px Tick Soft.
- **Centre:** a 12-unit black hub, and no hand.
- **Work face:** today against 6 hours. One gem sector sweeps clockwise from 12 o'clock with a 1.5px gem-ink edge at full opacity, which keeps the pale gems (Topaz, Diamond) at 3:1 against the face. Past 6 hours, a second lap sector draws in gem ink at 50%. 24 ticks, every fourth major, numerals 0 to 5.
- **Break face:** break used against 30 minutes. One teal sector with a 1.5px Break Ink edge. 30 ticks, every fifth major, numerals 0, 5, 10, 15, 20, 25.
- **Which face:** the break face shows while on a break and stays, full, at the 30-minute stop until Back to work. Otherwise the work face shows. Only one face is ever displayed; the other is hidden, so nothing depends on backface rendering.
- **The flip:** the card turns edge-on (240ms ease-in, `cubic-bezier(0.55, 0, 1, 0.45)`, to rotateY 90deg), the face swaps, and it turns back from -90deg to 0 (320ms on the shared ease-out), under a 1100px perspective. It is instant on first render, under reduced motion, and when the page is hidden.
- **Lift:** the flip card carries the Dial shadow.

### Break line
A slim strip under the big dial that says what is used and what is left.
- **Shape:** a Panel strip, 48px tall (44px when wide), 14px radius, 12px left padding and 4px elsewhere, 12px above the block button.
- **Content:** a 20px cup icon in Break Ink, then one line of body-small text (ink-2, nowrap, ellipsis) whose lead phrase is 600 ink: "Break · 30m available", "18m used · 12m left", "On break · 18m used · 12m left", "30m used · break over" at the stop, or "30m used · no break left today". The Take a break button closes the line when a break is available.
- **Active:** while on a break and at the stop the strip tints to Break Teal mixed 14% into Card White, over 220ms.

### Day dial
A 40-unit mini dial with a 19.4 face, a gem sector to r14.6 inside a rim band of four ticks (r16.2 to 18.6, 1.2px Tick Soft), and a 3.2 hub. It is used in the week strip (44px, 38px when wide), in Log rows (34px), and in the Insights calendar.
- **Rest days:** the face turns Soft with a rule-strong rim, and the hub Tick Soft.
- **Future days:** the dial drops to 55% opacity.

### Past-week dial
The same mini dial with five ticks and one Clear sector against 30 hours. It is used for finished weeks in Week by week.

### Week rosette
One dial for the current week, used in the Insights This week card and as the current cell in Week by week. Each day's hours are laid end to end in its own gem against 30 hours, inside the rim band (sector r45 on a r58 face), with wedges separated by a 1.2px face-coloured stroke. Five heavy ticks (2.2px, r49 to 56) mark the 6-hour shares, around a small hub (r5). There is only ever one rosette, and it is always the current week.

### Stone
Every gem is a convex solid built from flat faces in CSS 3D (`js/gem-cuts.js` holds the geometry, `js/ui/gem.js` builds one element per face, `css/gems.css` lights and moves them). Each cut comes from the gem's crystal or a classic cut:

| Gem | Cut | Gem-of-the-day motion |
|---|---|---|
| Emerald | Step cut: a long octagon, two crown steps, three pavilion steps | Rocks ±28° in the hand (3.5s each way) so the steps catch the light in turn |
| Sapphire | Hexagonal bipyramid, barrel-shaped, upright | Turns in 10s and floats |
| Amethyst | Quartz cluster: three hexagonal points (one point under 32px) | The slowest drift: a 24s turn, for a rest day |
| Diamond | Round brilliant: table, star-and-kite crown, pavilion | A steady 12s turn with one four-point glint each time round |
| Ruby | Trillion: a triangular brilliant, corner forward | A third of a turn, a rest, and again (9s): a working cadence |
| Tourmaline | Long rounded-triangle prism with a low point, lying on a diagonal | Rolls along its length in 14s |
| Topaz | Princess: square table, inverted pyramid, corner forward | Turns in 12s and dips twice a turn to flash its table |
| Clear | Raw octahedron | Never the gem of the day |

Each stone is cut glass. Its colour is a three-stop OKLCH ramp (`--c-deep`, `--c-mid`, `--c-hi`, set per gem in `tokens.css`) that holds its chroma, so shaded facets go deep rather than grey and lit ones glow in their own colour. Two lights fall on it: a key from the upper left and front, and a fixed fill low on the right, so no side goes dead. The stylesheet works both out live from each facet's normal as the gem turns. Each facet has a bright bevelled edge, a streak and a brief power-curve flash when it squares up to the key light, and a depth gradient. Diamond and Clear add a narrow band of spectral fire inside the flash. From 32px up, every facet also has a mirrored inner skin, so the rear facets show through the front ones (`--glass`). A stone throws a small bloom of its own colour; in dark mode its deepest shade lifts toward the body colour (`--gem-deep-lift`) and the bloom strengthens (`--gem-bloom`). Under 32px a cut uses fewer faces, no inner skins, a finer bevel, and a single soft bloom. Without live CSS maths, each facet falls back to one flat tone set at rest. The gem of the day also catches two small four-point sparkles, out of step with each other. The gem of the day is 52px; stones are 20px on tiles and 18px in the Insights legend, still until their tile or legend cell is hovered, when they make one 900ms turn. A new day swaps the gem: the old one sinks away (240ms) and the new one rises in (320ms).

### App icon
The installed-app mark is the work dial itself, drawn flat from the light tokens on a 512-unit canvas, in the same proportions as the big face: the sector stops short of the rim and the ticks sit on the white band.
- **Tile:** a Timer Black square. The standard icon is a rounded tile (112-unit radius, inset 8 units). The maskable and Apple icons are full-bleed, so the platform applies its own mask.
- **Dial:** a white face with a face-edge hairline of about 1.2 units (radius 196 standard, 214 Apple and favicon, 160 maskable to stay inside the safe zone).
- **Sector:** one flat Topaz sector from 12 o'clock to 3h 45m, with its topaz-ink edge, inset to 103/147 of the face radius.
- **Ticks:** 24 ticks on the white band (106–124/147 of the radius). Majors are Major Tick and minors are Tick Soft; nothing is drawn over the fill.
- **Centre:** a black hub, and no hand and no numerals.
- **Favicon:** the 32px favicon uses a reduced source with the six major ticks only, on a rounded tile.
- **Sources:** `icons/src/icon.svg`, `icon-maskable.svg`, `icon-small.svg`, and `icon-apple.svg`. Every PNG in `icons/` is rendered from them, never drawn by hand.

### Notices
Timer Black toasts with a 14px radius and the Float shadow, docked above the tab bar (bottom right when wide). They enter in 220ms (rising 8px and fading in), and action buttons inside are outlined in currentColor.

### Motion
There are two everyday durations: 140ms for hover, press, and colour changes, and 220ms for notices and the break line's tint. Both use the cubic-bezier(0.16, 1, 0.3, 1) ease-out. The flip (240ms out, 320ms in, see Big dial) and the gem of the day (see Stone) are the two designed motions; a stone's one hover turn borrows the gem's. Reduced motion collapses everything to 1ms: the flip becomes an instant face swap, and every gem holds its pose. Sectors move only with the live update.

## Do's and Don'ts

### Do:
- **Do** put every Today block in a white card (22px radius, 1px card-edge, Card shadow) on the Ground.
- **Do** name each card with the small tracked uppercase label as its real h2 or h3 heading.
- **Do** fill the work face with one flat sector in today's gem, edged in the gem's ink at full opacity, under a black hub with no hand.
- **Do** stop every dial's sector short of the rim, so ticks and numerals sit on a white band and are never covered.
- **Do** show the break as the teal back face of the big dial, flipping to it on a break, holding it at the 30-minute stop, and flipping back on Back to work.
- **Do** say break used and left in the one slim break line under the dial.
- **Do** mark the day with its gem in its own cut, and use the Clear stone only for totals (Week, To goal) and past weeks.
- **Do** map gems Saturday Topaz, Sunday Emerald, Monday Sapphire, Tuesday Amethyst, Wednesday Diamond, Thursday Ruby, Friday Tourmaline.
- **Do** keep one full-width black Start/Pause button as the single primary action on Today.
- **Do** keep the wide Today column fitting a 900px-tall window.
- **Do** use 140ms and 220ms with the shared ease-out for everyday changes; the flip's 240ms out and 320ms back are its own.
- **Do** write "break", never "paid break".
- **Do** render every app icon from its SVG source: the work dial on a Timer Black tile, one flat Topaz sector, and a black hub with no hand.

### Don't:
- **Don't** add a hand, knob, housing, or any physical-object costume to a dial.
- **Don't** show both faces at once, or draw a separate break dial or break card beside the work dial.
- **Don't** animate anything else the way the flip or the gem of the day moves; they are the two designed motions. Stones elsewhere stay still until hovered.
- **Don't** use neon-on-dark glow, gradients, or bevels on dial faces or sectors. Only stones are rendered as glass, and their bloom stays small and in their own colour.
- **Don't** use a gem colour for buttons, links, or status, and don't give Clear to a weekday.
- **Don't** put an eyebrow or kicker above a heading. The label is the heading.
- **Don't** draw a second rosette. The rosette is the current week only, and past weeks are Clear mini dials.
- **Don't** add a second primary button to a screen.
