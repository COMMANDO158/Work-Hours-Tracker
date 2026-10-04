# FlowFocus

FlowFocus is a visual timer for contracted work hours. Instead of a clock you have to read, today's time is a coloured sector that grows on a clean dial in the day's gem colour. Take a break and the dial flips over to its 30-minute break face. It is built for a brain that can't feel time passing.

**Open the app:** https://commando158.github.io/Work-Hours-Tracker/

## What it does

- Tracks work time against a 6-hour daily goal and a 30-hour weekly goal. Weeks run from Saturday through Friday. Tuesday and Friday are rest days; time you log on them still counts toward the week.
- **Today** is one card with today's total, the dial, a break line, and one big button. The button is Start, Pause, Resume or Back to work, depending on what's happening, and it shows how long the current stretch has run. *Finish day* sits in the card's corner. Below it, the week appears as seven small dials, with three tiles for Today, Week and To goal.
- **Break:** up to 30 minutes a day count toward today's hours. *Take a break* flips the dial to its break face, which fills in teal, and the clock keeps running with no reset. Come back early with *Back to work* and the rest stays available for later that day. Once the 30 minutes are used, the clock stops at exactly that moment and waits for *Back to work*, so extra break time is never counted.
- **Log** lists every week, newest first. Tap any day to correct its hours or note in place. You can type `5:30`, `5h30` or `5.5`, or step by 15 or 30 minutes, and every correction can be undone.
- **Insights** reads your hours back to you:
  - this week as a rosette, one gem per day;
  - plain observations, with no praise and no scolding;
  - the last 30 days as a calendar of dials;
  - your average for each weekday;
  - week-by-week totals;
  - streaks and records.
- **Streak:** workdays in a row with at least 30 minutes. Rest days neither add to it nor break it, and a new morning doesn't reset it before you've started.
- A running timer survives a reload or the phone closing the app. If FlowFocus was closed for more than two hours while the timer ran, it asks whether to keep that time or stop it at the time you choose. It never counts past one midnight.
- An optional "What are you working on?" note is saved for each day.
- Each weekday has its gem. The day's gem turns in the header, each gem in its own cut and its own motion, and today's dial takes that gem's colour:

  | Day | Gem |
  | --- | --- |
  | Saturday | Topaz |
  | Sunday | Emerald |
  | Monday | Sapphire |
  | Tuesday (rest day) | Amethyst |
  | Wednesday | Diamond |
  | Thursday | Ruby |
  | Friday (rest day) | Tourmaline |

- Light and dark appearance, following the device or set by hand in Settings.
- Works as an installable app and fully offline once loaded. Nothing is fetched from a CDN.

## Where your data lives

Your hours are saved in your browser's local storage, on the device where you use the app. Deploying a new version through GitHub Pages doesn't clear that data. Clearing site data, or switching browsers or devices, removes access to that local copy.

**Backup:** in Settings, *Download a backup* saves your hours and notes as a JSON file. *Restore from a backup* merges a file back in; for each day, the most recent edit wins. Backups never include your GitHub token.

**Sync (optional):** in Settings, connect a GitHub personal access token with **gist** access. FlowFocus keeps your hours in a secret Gist in your own GitHub account. Use the same token on your other devices. The token is saved in that browser's local storage, so only use sync on devices you trust. The sync format is the same as earlier versions of FlowFocus, so older copies keep syncing.

Some things are tracked separately on each device:

- **Break time.** Avoid starting breaks on two devices on the same day if you want a strict 30-minute cap.
- **Notes.** The per-day "working on" notes aren't synced.

If FlowFocus is open in two places on one device, for example the installed app and a browser tab, only one of them tracks. The other becomes view-only until you press *Use here*.

Known limitation: today's time from two devices is added together, but once midnight passes, yesterday merges by most recent edit. A few minutes logged on another device just before midnight can be lost if both devices edited that day.

## Project files

This is a static site with no build step:

- `index.html` — the app shell and icon sprite.
- `css/` — `tokens.css` (palette, gems, type, light and dark), `base.css`, `components.css` (dials, buttons, cards, notices), `views.css` (layouts for phone, the narrow desktop window, and wide screens), `gems.css` (the gems' light and motion).
- `js/` — the domain logic:
  - `timer.js`, `breaks.js` — the timer and break;
  - `store.js` — the saved ledger;
  - `sync.js`, `gist.js`, `merge.js` — Gist sync;
  - `insights.js` — analytics;
  - `today-state.js` — which button Today shows;
  - `backup.js` — export and import;
  - `lock.js` — one active window;
  - `dates.js`, `format.js` — dates and formatting;
  - `gems.js`, `gem-cuts.js` — the weekday gems and the 3D geometry of each gem's cut;
  - `app.js` — boot.
- `js/ui/` — the views (`today.js`, `log.js`, `insights-view.js`, `settings.js`), the frame (`shell.js`), the SVG dials (`dial.js`), and the CSS-3D gems (`gem.js`).
- `assets/fonts/` — Inter, self-hosted.
- `icons/` — app icons, rendered from the SVGs in `icons/src/`.
- `weekly-reflection.html` — redirects old bookmarks to Insights.
- `dev/gems-lab.html` — a development page showing every gem at every size, still and moving (not cached).
- `sw.js` and `manifest.json` — offline caching and installable-app settings. Bump `CACHE_VERSION` in `sw.js` on every deploy.
- `tests/` — logic tests: `node --test tests/logic.test.mjs`.
- `PRODUCT.md` — product facts and principles. `DESIGN.md` — the design system.

## Running it locally

Serve the folder over HTTP, because ES modules don't load from `file://`. For example, run `py -m http.server 8000` (or `python3 -m http.server 8000`) and open `http://localhost:8000/`.

On `localhost` only, you can add `?now=2026-10-02T23:59:30` to the URL to move the app's clock, which is handy for rehearsing midnight and week changes. Use `?now=reset` to go back to real time.
