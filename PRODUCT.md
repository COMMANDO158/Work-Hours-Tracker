# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person: the owner, an adult with ADHD who tracks their own contracted work hours. They use FlowFocus as an installed PWA on both a phone and a desktop computer, kept in step through optional GitHub Gist sync. There are no other audiences.

## Product Purpose

Make work time visible and easy to keep honest for a brain that cannot feel time passing. The owner should be able to start work with one action, know where today and the week stand at a glance, take the paid break without overrunning it, correct forgotten time quickly, and look back at patterns often. Success: the day's and the week's standing are known without thinking, and starting work never requires a decision first.

## Positioning

A personal ledger of contracted time, not a corporate timesheet and not a productivity game. Up to 30 paid break minutes a day count as work; weeks run Saturday to Friday against a 30-hour goal; Tuesday and Friday are rest days; every weekday carries its own gem identity.

## Operating Context

- Daytime at a home desk, with the app window docked beside the work and glanced at every few minutes.
- On the phone during breaks and in the evening, often to check the week or the analytics.
- Typical loop: start, pause, break, resume, finish the day; corrections afterwards for days the timer was forgotten; frequent look-backs at trends and history (the analytics are used often and matter).

## Capabilities and Constraints

- Work timer: start, pause, resume, finish the day. Time is measured from the wall clock. A session that is paused before midnight and resumed after banks its time to the earlier day; a running timer rolls over at midnight.
- A running session must survive a reload or the OS killing the app. If the app was closed for more than 2 hours while the timer ran, the owner is asked to keep or trim that time; time is never credited across more than one midnight.
- Break: up to 30 minutes a day count toward today's hours. The clock keeps running through a break with no reset. When the day's 30 minutes are used, the clock stops at exactly that moment and waits for Back to work, so extra break time is never counted. A break can end early and the remainder be used later that day. Break usage is tracked per device and does not sync (decided by the owner 2026-10-03).
- Goals: 6 hours per workday, 30 hours per Saturday-to-Friday week. Off days: Tuesday and Friday (time logged on them still counts toward hours).
- Streak: consecutive workdays with at least 30 minutes. Off days neither add to nor break the streak, and today being under 30 minutes so far does not reset it (decided 2026-10-03).
- Manual correction of any past or current day, clamped to 0–24 hours. Future days are read-only.
- Optional "working on" note, saved per day.
- Analytics: this week by day, pace to the weekly goal by remaining workdays, 30-day trend, weekday patterns, streaks, best day, plain observations.
- Data lives in browser localStorage. Existing keys (`flowFocusWeekData`, `flowFocusMeta`, `flowFocusStreak`, `flowFocusSyncBase`, `flowFocusBreakState`, `flowFocusLastReset`, `flowFocus_gistId`, `flowFocus_githubToken`, `flowFocus_lastSync`) and the Gist file `flowfocus.json` (version 2.0 payload) must stay compatible. Sync merges per day by newest edit and merges today additively across devices; a failed fetch is never treated as empty.
- JSON backup export and import. Only one window tracks at a time when the app is open in several places.
- Stack: static HTML, CSS and vanilla JavaScript with no build step, served from GitHub Pages, installable, and fully usable offline after first load.

## Brand Commitments

- Name: FlowFocus.
- Seven weekday gems, kept as identity data: Sunday Emerald, Monday Sapphire, Tuesday Amethyst, Wednesday Diamond, Thursday Ruby, Friday Tourmaline, Saturday Topaz. The idea stays; its visual expression is open.
- Voice: plain, calm, supportive without praise inflation, never judgmental. In the interface the break is called "break", never "paid break" (it is still the same paid allowance that counts toward hours).
- The owner explicitly rejects: cheerleading or gamification (confetti, badges, pushy streak pressure, emoji praise); a cold corporate timesheet feel; busy, noisy screens with competing numbers and cards; the generic neon-on-black glowing app look.

## Evidence on Hand

- The owner's own tracked hours in localStorage and in their secret Gist.
- Existing app icons in `icons/` (a stopwatch mark); replacing them is open.
- There are no other users, testimonials, metrics, or press. Never invent any.

## Product Principles

1. One obvious next action in every state.
2. Time is shown as a visible quantity, not only as digits.
3. Honest, kind numbers: no pressure, no guilt, no inflated praise.
4. Correcting the record is as easy as recording it.
5. Offline first; never lose an hour.

## Accessibility & Inclusion

- Designed for an ADHD user: low cognitive load, one primary action, no flashing, no anxious countdown styling.
- WCAG 2.2 AA contrast and focus visibility; reduced motion respected.
- Colour, including gem colour, is never the only way information is encoded.
