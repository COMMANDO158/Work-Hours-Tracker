---
name: FlowFocus
description: A visual timer for contracted hours, 6 a workday and 30 a week. The day's gem colour floods the screen from the bottom up, and every figure fills like a vessel.
colors:
  ground: "#F3F3F1"
  surface: "#E6E6E2"
  raised: "#FBFBFA"
  ink: "#121316"
  muted: "#4F5258"
  still-mix: "#C3C3BE"
  track: "#D6D6D1"
  edge: "#7A7A76"
  break: "#12A39A"
  break-ink: "#0B6E68"
  break-on: "#0B1110"
  warn: "#A3122E"
  ground-dark: "#0B0C0E"
  surface-dark: "#17181B"
  raised-dark: "#1F2024"
  ink-dark: "#EDEDEA"
  muted-dark: "#A3A6AB"
  still-mix-dark: "#8E8F92"
  track-dark: "#2A2B2F"
  edge-dark: "#6E6F73"
  break-dark: "#2BBFB4"
  break-ink-dark: "#7BE0D7"
  warn-dark: "#FF9AAE"
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
  figure:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "clamp(48px, fitted, 400px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum, lnum"
  numeral:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "34px to 340px, set by its container"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum, lnum"
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "clamp(56px, 3rem + 3vw, 96px)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "clamp(30px, 1.4rem + 1.3vw, 52px)"
    fontWeight: 700
    lineHeight: 1.05
  mark:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.05
  status:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(19px, 0.95rem + 0.7vw, 27px)"
    fontWeight: 500
    lineHeight: 1.2
    fontFeature: "tnum"
  body:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  lede:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.45
  small:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.35
  button:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.2
  button-primary:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  none: "0"
  seat: "50%"
spacing:
  x0: "76px (64px under 1100px, 54px under 720px)"
  gut-r: "40px (28px, 18px)"
  top: "24px (16px under 720px)"
  gut: "clamp(20px, 3.6vw, 56px)"
  band: "10px (6px under 720px)"
  section: "128px between Insights sections, 112px between Log weeks"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.button-primary}"
    rounded: "{rounded.none}"
    height: "68px"
    padding: "0 40px"
  button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    height: "48px"
    padding: "0 22px"
    border: "2px solid {colors.ink}"
  button-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    height: "48px"
  button-warn:
    backgroundColor: "transparent"
    textColor: "{colors.warn}"
    border: "2px solid {colors.warn}"
    rounded: "{rounded.none}"
    height: "48px"
  stage-button:
    backgroundColor: "transparent"
    textColor: "the side's ink"
    border: "2px solid currentColor"
    rounded: "{rounded.none}"
    height: "56px"
  field:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "48px"
    padding: "0 14px"
    border-bottom: "2px solid {colors.edge}"
  note-field:
    backgroundColor: "transparent"
    border-bottom: "2px solid the side's ink at 55%"
    rounded: "{rounded.none}"
  segmented-option:
    backgroundColor: "transparent"
    border: "2px solid {colors.ink}"
    height: "44px"
    rounded: "{rounded.none}"
  segmented-option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  week-pane:
    backgroundColor: "{colors.surface}"
    width: "clamp(320px, 30vw, 440px)"
  bar:
    backgroundColor: "{colors.track}"
    height: "8px"
  dayband:
    backgroundColor: "{colors.track}"
    width: "{spacing.band}"
  editor:
    backgroundColor: "{colors.surface}"
    padding: "24px"
    rounded: "{rounded.none}"
  menu:
    backgroundColor: "{colors.ground}"
    width: "320px"
    shadow: "0 18px 48px rgb(0 0 0 / 0.18)"
  notice:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.none}"
    padding: "14px 8px 14px 18px"
  seat:
    rounded: "{rounded.seat}"
    width: "56px"
    height: "56px"
  app-icon:
    backgroundColor: "#F8F8FF"
    width: "512px"
    height: "512px"
---


# Design System: FlowFocus

## Overview

**Creative North Star: "The Flood"**

Today is a screen that fills. The day's gem colour rises from the bottom of the Today screen as a flat, hard-edged field, and it is full at 6 hours. Today's hours stand on the level line in enormous condensed figures, printed twice: in ground ink above the level and in the flood's ink below it, so the line cuts straight through them. The one thing to do sits right under them. A scale of hours runs up the left edge. Beside the stage (a swipe away on a phone) the week stands as seven figures, each a vessel filled to its day's level.

Every other number that matters is a **filled numeral**: an outlined, faintly tinted figure with a copy in its gem colour cut off flat at its level, against 6h for a day or 30h for a week. Log, Insights and the week pane are built from them. Nothing else carries colour except the gems, the break's teal and the one warning red.

Gems are the identity. Each weekday owns a gem: Saturday Topaz, Sunday Emerald, Monday Sapphire, Tuesday Amethyst, Wednesday Diamond, Thursday Ruby, Friday Tourmaline. Each has its own cut, built in CSS 3D (see Stone). The gem of the day plays its motion once at the top of Today, then rests; small still stones mark the days elsewhere.

**Key Characteristics:**
- Flat colour, hard edges, square corners. No cards, no glass, no gradients, no shadows except the floating menu and notices.
- One display face, Barlow Condensed 700, for every figure and heading; one text face, Barlow 400/500/600. Both self-hosted.
- The flood and the filled numerals move by clip-path and transform only, read from plain custom properties.
- Pale ground and dark ink in light; a near-black ground in dark. The gems shift lighter in dark.
- One primary action on Today: a solid block in the side's ink.

## Colors

### Neutrals
- **Ground** (ground): the page, and the part of the stage above the flood. Also the theme colour.
- **Surface** (surface): the week pane, the open correction, Insights' banded sections, mode choices, today's cell in Log.
- **Raised** (raised): the inside of text fields.
- **Ink** (ink) and **Muted** (muted): text, then secondary text. Muted holds at least 4.5:1 on ground and surface.
- **Track** (track): the empty part of every bar, the day band and the calendar squares, and the rule between Settings sections.
- **Edge** (edge) and **Void** (ink at 5 to 6%): the empty numeral's drawn outline (3:1 on ground and surface) and its faint inside.
- **Still mix** (still-mix): mixed 34% with the gem (or the teal) to quiet the flood while the clock is stopped.

### The weekday gems
Each gem is a triplet: the **fill** (`--g`: the flood, numeral fills, bars, calendar squares), the **ink** (`--gi`: the filled numeral's edge in light, and the dry figure on Today in light), and the **on** colour (`--go`: everything printed on the flood). Elements opt in with `data-gem`. The root carries today's gem, set before first paint.

### Break and warning
- **Break Teal** (break): the flood while on a break, the break line's field (24% into ground) and the synced status mark. **Break Ink** (break-ink): the break line and its label, and the dry figure on a break in light. **Break On** (break-on): print on the teal flood.
- **Warn** (warn): sync errors, the Disconnect button and field errors. Never decoration.

### Dark mode
Two identical paths: `prefers-color-scheme: dark` on `:root:not([data-mode="light"])`, and an explicit `:root[data-mode="dark"]` from Settings. The ground goes to #0B0C0E, the surface #17181B, the ink #EDEDEA; every gem lifts in lightness and its "on" colour turns near-black. Rules that differ by mode (a filled numeral's edge is its fill in dark, the dry figure is plain ink in dark, the step numbers lose their outline) are written once per path.

### Named Rules
**The Gem Means a Day Rule.** A gem colour appears only where it stands for its weekday or for today: the flood, a numeral's fill, a calendar square, a glass segment, a stone, the dayband. Never a button, link or status colour.

**The Teal Is the Break Rule.** Teal is the break: its flood, its line, and the synced mark in Settings. Nothing else is teal.

**The Colour Is Never Alone Rule.** Every level is also said in words (the figure, its sentence, its screen-reader text), and every sync state is also a shape (a dot when synced, a ring on this device, a square on a fault) and a word.

## Typography

**Display:** Barlow Condensed 700 (latin, woff2, OFL), preloaded. Fallbacks Arial Narrow, Roboto Condensed.
**Text:** Barlow 400, 500 and 600 (latin, woff2, OFL). Fallbacks Segoe UI, system-ui.
Both live in `assets/fonts/` with `font-display: swap`, so the app reads offline from the first load.

### Hierarchy
- **Figure** (700, fitted to the stage, up to 400px, line-height 1, -0.01em, word-spacing -0.12em, tabular lining): today's hours on the stage. The units are set at 0.36em. Its size is fitted so "6h 48m" spans the stage, and at most 40% of the stage height (20% on a phone).
- **Numeral** (700, sized by its container: 34 to 104px in rows, up to 340px for the week's pace): every filled numeral, written "6h30" (hours, then two-digit minutes).
- **Title** (700, 56 to 96px, line-height 0.9): the h1 of Log, Insights and Settings.
- **Headline** (700, 30 to 52px): week names in Log, section titles in Insights and Settings (40px).
- **Mark** (700, 26px; 24px on a phone): the day's name on Today and the FlowFocus name in the header.
- **Status** (500, 19 to 27px): "Working 0:30:56 this session" on the stage, the state in 600.
- **Body** (400, 17px, 1.5) and **Lede** (19px, 1.45): prose, capped near 46 to 60ch.
- **Small** (15px): dates, keys, hints, the scale.
- **Buttons** 600: 17px, 18px on the stage, 22px for the primary.

### Named Rules
**The Still Numbers Rule.** Every figure is tabular and lining, so a ticking clock never shifts its neighbours.

**The No Label Rule.** No eyebrows, no tracked uppercase labels, no monospace (the token field is ordinary text, masked). Headings are plain words in the display face.

**The Copy Says Break Rule.** The UI says "break", never "paid break". Copy is plain and calm: no praise, no scolding, no exclamation marks.

## Layout

- **Today (wide):** two panes the height of the window. The stage takes the rest of the width; the week pane is `clamp(320px, 30vw, 440px)` on Surface. On the stage, the scale sits in the left gutter (`--x0`, 76px), the mark, links and the gem of the day across the top, the readout centred on the level line, and the controls riding 40px under the readout. Both are clamped so they never leave the stage.
- **Today (under 1100px):** the links fold into a Menu; the controls stack (note, primary, secondary).
- **Today (phone, under 720px):** one pane wide, swiped sideways (scroll snap) to the week. The controls sit on the bottom: note, then Take a break and Finish day side by side, then the primary, then "This week 4h 15m of 30h · Week ›". The week pane has "‹ Today".
- **Log, Insights, Settings:** a header (the gem, FlowFocus, today's date and the sync state, then the links or the Menu), a 10px day band of today's level down the window's left edge, and a page head: the h1 on the left and its sentence on the right (stacked on a phone). Gutters are `clamp(20px, 3.6vw, 56px)`.
- **Log:** weeks newest first, each a headline, a total, a 30h bar and seven columns (two under 1100px, one on a phone), with a numeral over the day's name in each.
- **Insights:** sections 128px apart; "What stands out" and "Week by week" sit in full-bleed Surface bands.
- **Settings:** each section a two-column row (title and its sentence, then the body), divided by a 2px Track rule; one column under 1100px.
- **One h1 per screen.** The screen shown leads `<main>`; hidden screens are `hidden`.

## Elevation & Depth

Flat. Depth comes from the flood itself and from Surface bands, never from shadows. Two things float and carry the one shadow (`0 18px 48px rgb(0 0 0 / 0.18)`, 0.6 in dark): the Menu and the notices.

## Shapes

Square. Buttons, fields, the editor, the gap check, calendar squares, glasses and notices all have 0 radius. The only round things are the seat behind the gem of the day (50%), the synced status dot, the radio marks in Appearance, and the gems themselves.

## Components

### The flood (signature)
- **Field:** `.flood` covers the stage and is clipped from the top: `clip-path: inset(calc((1 - var(--level)) * 100%) 0 0 0)`. `--level` is today's total against 6h, stepped to the minute, so the flood rises once a minute in step with the figure, with a 1100ms `cubic-bezier(0.22, 0.8, 0.3, 1)` transition. On first paint it starts at 0 and rises in.
- **States** (`data-state` on the stage): working floods in the gem; paused and stopped mix the gem 34% into Still mix; on a break the flood turns Break Teal with Break On ink; at the 30-minute stop it mixes the teal 34% into Still mix; not started has no flood.
- **Two inks:** the figure, the status line and the sentence each hold two copies, `.i-dry` (ground ink, clipped below the level) and `.i-wet` (the flood's ink, clipped above it). `--cut` is where the level crosses each line, set in px from script.
- **Sides:** every control on the stage carries `data-ink` and is marked `.is-wet` when its resting place is under the level, which swaps its ink, ground and soft colours. The gem of the day sits on a round seat of the flood's ink once the flood reaches it, so a Topaz gem never vanishes into a Topaz screen.
- **Scale:** 1h to 6h ticks down the left gutter, drawn twice (muted above, the flood's soft ink inside).
- **Break line:** while on a break, a field from the level up to where the break would end (level + break left), in teal 24% into ground, under a 4px Break Ink line with "The break ends at this line" at its right (wide only). The field is a clip-path, the line a transform.
- **Readout:** the figure (sized to fit), the status line (the state, then the session clock or the break left), and one sentence ("1h 45m to 6h today."). Screen readers get "Today so far: 4 hours 15 minutes of 6 hours." and a polite announcement on each change of state.

### Filled numeral
- **Vessel:** `.nf`, the figures in Edge with a `max(1.5px, 0.012em)` stroke painted under a Void fill, its box trimmed to cap height and baseline (`text-box: trim-both cap alphabetic`), so the level is a share of the figures themselves.
- **Fill:** `.nf-fill`, the same figures in `--g` (edged in `--gi` in light, `--g` in dark), clipped flat at `--lvl`. Empty numerals hide the fill.
- **Week bands:** the week's pace numeral holds one `.nf-band` per day with time, each clipped to its own share of 30h (`--from`, `--to`), in that day's gem.
- **Rise:** a numeral starts empty and fills to its level the first time it is 40% in view, 80ms after its neighbour along a row (IntersectionObserver, unobserved once risen, released when its view removes it). Under reduced motion it is set at once.
- **Meaning:** past days and today fill against 6h; workdays ahead stand empty, outlined at what each needs for the week to reach 30h; rest days ahead say "Rest". Every numeral is `aria-hidden` and has a sentence beside it for screen readers.

### Buttons
- **Primary on Today:** a solid block in the side's ink with the side's ground as text, 68px tall, at least 240px wide (full width under 1100px), 22px 600. It says Start work, Pause, Resume, Back to work or Start again.
- **Stage buttons:** Take a break and Finish day, transparent with a 2px currentColor border, 56px (52px on a phone). Disabled is dashed and soft: "No break left today".
- **Plain buttons (`.b`):** 48px, 2px ink border, transparent; hover fills with ink. `.b-solid` is filled; `.b-warn` is Warn.
- **Focus:** a 3px outline in the side's ink (ink elsewhere) at a 3px offset. Press moves down 1px.

### Fields
- **Text field:** Raised fill, a 2px Edge bottom edge that turns Ink on focus and Warn when invalid, 48px, square. Label above in 15px 600.
- **Working on:** on the stage, a borderless line with a 2px bottom edge in the side's ink at 55%, labelled "Working on". Saved per day as you type.

### Week pane (Today)
"This week 24–30 Oct", the week's total at 60px with its 30h bar, the plan ("25h 45m to go. That is 5h 09m on each of the 5 workdays left, today included."), then seven rows, each a numeral and the day's gem, name, date and note ("Today", "Ahead", "Rest day"). Today's row sits on Ground. The key explains the outlines; "Log ›" goes to the log.

### Log correction
Tapping a past or current day opens an inline form under its week (wide) or its day (narrow): "Correct Tuesday 20 October", Hours and Note fields, Save and Cancel, and a hint ("Type 5:30, 5h 30m, 5.5 or 45m. A day holds 0 to 24h."). The day's cell turns to Ink with a ground-coloured numeral edge. Days ahead are a read-only group. A saved change shows a notice with Undo.

### Insights
This week's pace (one numeral filled day by day against 30h, the hours to go, the share per workday and the gems of the workdays left), What stands out (up to three plain sentences, each led in 600), the last 30 days (three figures and a calendar of small floods, each square a link to correct that day), the weekday rhythm (seven numerals over a 6h line, averaged over 4, 8, 12 weeks or all), week by week (ten glasses filled day by day in each day's colour, with a 30h line across each row) and streaks and records.

### Settings
Sync (a status line with its mark, then either the four token steps and a token field, or Sync now and Disconnect, which asks first), Backup (Download a backup, Restore from a file with a preview before anything changes), Appearance (Match device, Light, Dark, as square choices with a radio mark) and About (the four goals and the seven gems).

### Navigation
Plain text links (17px 500) with the current one underlined 3px; "Today 4h 15m" carries today's figure on the other screens. Under 1100px a Menu button opens a floating list (Ground, the one shadow) with the sync state at its foot. It closes on Escape, a click outside, or a link.

### Notices and the view-only banner
Notices are Ink blocks with Ground text, square, at the bottom right (at the top on a phone, clear of the primary button), with an optional underlined action (Undo) and a dismiss button; at most two at once. A second window shows a full-width Ink banner at the bottom: "FlowFocus is open in another window, so this one is view-only", with "Use here".

### Time counted while closed
After more than two hours closed (or asleep) with the timer running, a square, ink-bordered panel heads the controls on Today: what happened in a sentence, a "Stopped at" time, "Stop it at this time" and "Keep counting" (or "Keep it").

### Stone
Every gem is a convex solid built from flat faces in CSS 3D (`js/gem-cuts.js` holds the geometry, `js/ui/gem.js` builds one element per face, `css/gems.css` lights and moves them). Each cut comes from the gem's crystal or a classic cut:

| Gem | Cut | Gem-of-the-day motion (played once) |
|---|---|---|
| Emerald | Step cut: a long octagon, two crown steps, three pavilion steps | Rocks ±28° in the hand (3.5s each way) |
| Sapphire | Hexagonal bipyramid, barrel-shaped, upright | Turns in 10s and floats |
| Amethyst | Quartz cluster: three hexagonal points | The slowest drift: a 24s turn, for a rest day |
| Diamond | Round brilliant | A steady 12s turn with one four-point glint each time round |
| Ruby | Trillion, corner forward | A third of a turn, a rest, and again (9s) |
| Tourmaline | Long rounded-triangle prism on a diagonal | Rolls along its length in 14s |
| Topaz | Princess, corner forward | Turns in 12s and dips twice a turn |
| Clear | Raw octahedron | Never the gem of the day |

Each stone is cut glass: a three-stop OKLCH ramp per gem (`--c-deep`, `--c-mid`, `--c-hi` in `tokens.css`), lit live from each facet's normal by a key and a fill light, with a small bloom of its own colour. The gem of the day is 42px on Today (36px on a phone) with motion `hero`: it plays its motion once, on opening and on a new day, and when every animation has finished `shell.js` makes it a `hover` gem; the header shows a 36px stone that turns once on hover; days are marked with 20px still stones; About shows 32px stones that turn once on hover. A new day swaps the gem: the old one sinks away (240ms) and the new one rises in (320ms). Every gem loop is stepped at 30 a second and pauses while the window is hidden (`.is-away`).

### App icon
The installed-app mark is one gem: a Ruby brilliant in side view on a Ghost White tile (#F8F8FF), drawn flat on a 512-unit canvas, rendered from `icons/src/*.svg`.

## Motion

- **The rise** (1100ms, `cubic-bezier(0.22, 0.8, 0.3, 1)`): the flood, the readout, the controls, the two-ink cuts, the break line, the dayband and every numeral's fill. The level moves once a minute.
- **Everyday:** 160ms for hover and press colours, 400ms for a control's ink as the flood passes it, 700ms for the flood's colour between states, 900ms for bars.
- **Reduced motion:** every transition and animation is off; numerals are set at once and gems hold their pose.

### Named Rules
**The Memory Rule.** Never animate or transition a registered (`@property`) custom property. Smoothly animated registered properties fill Blink's computed-value cache with values that never repeat; left running, the gems once grew the renderer to about 7 GB. The gems' own motions are stepped keyframe tables at 30 a second, pause while hidden, and never loop: even stepped, a looping gem of the day held the main thread about two-thirds busy, the renderer near 1 GB and the GPU process near 900 MB, so it plays once and settles. Everything else transitions only standard properties (clip-path, transform, opacity, background-color, color) whose targets are plain, unregistered custom properties (`--lvl`, `--level`, `--cap`, `--cut`, `--fig-y`, `--ctl-y`, `--p`), written from the one-second tick only when they change. Views update text and levels in place; nothing is rebuilt every second.

## Do's and Don'ts

### Do:
- **Do** let the day's gem fill the Today screen from the bottom, flat and hard-edged, full at 6h.
- **Do** write every important figure as a filled numeral, "6h30", against 6h for a day or 30h for a week.
- **Do** keep corners square and colour flat; let the flood and the numerals carry the colour.
- **Do** say each level in words for screen readers, and pair every colour with a word or a shape.
- **Do** keep one primary action on Today, in the side's ink.
- **Do** map gems Saturday Topaz, Sunday Emerald, Monday Sapphire, Tuesday Amethyst, Wednesday Diamond, Thursday Ruby, Friday Tourmaline.
- **Do** write "break", never "paid break".

### Don't:
- **Don't** add cards, rounded panels, glass, gradients, glows or shadows (the menu and notices excepted).
- **Don't** use eyebrows, tracked uppercase labels or monospace.
- **Don't** animate a registered custom property, or drive an animation frame by frame from script.
- **Don't** rebuild a view's DOM on the clock; update it in place.
- **Don't** use a gem colour for a button, a link or a status.
- **Don't** show the gem of the day more than once on a screen.
