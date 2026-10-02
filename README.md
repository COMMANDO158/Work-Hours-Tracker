# FlowFocus

FlowFocus is a simple work hours tracker built for people who want a clear view of their time without a complicated timesheet. Start a timer, take a break, and see how your day and week are going.

**Open the app:** https://commando158.github.io/Work-Hours-Tracker/

## What it does

- Tracks work time against a 6-hour daily goal and a 30-hour weekly goal. Weeks run from Saturday through Friday.
- Includes a break timer. Up to 30 minutes of break time count toward today's total. The work timer pauses during the break, and extra break time is not counted. You can end the break early and use the remaining allowance later that day.
- Lets you pause, resume, finish a session, and manually adjust hours for today or past days.
- Shows a weekly review and a separate analytics dashboard with daily comparisons, a 30-day trend, streaks, and suggestions.
- Changes its gem-inspired color theme automatically using your device's local day of the week:

  | Day | Theme |
  | --- | --- |
  | Sunday | Emerald |
  | Monday | Sapphire |
  | Tuesday (off day) | Amethyst |
  | Wednesday | Diamond |
  | Thursday | Ruby |
  | Friday (off day) | Tourmaline |
  | Saturday | Topaz |

- Works as an installable web app and supports offline use after its files have been cached.

## Getting started

1. Open the app link above in your browser.
2. Select **Start** to track work. Use **Pause** when you need to stop without ending the session.
3. Select **Start Break** for paid break time. The break countdown and progress bar show the remaining allowance. At 30 minutes, paid time stops automatically; select **Start** when you return to work.
4. Select **Done** when your session is complete. Open **View Detailed Analytics** for the dashboard.

## Where your data lives

Progress is saved in your browser's local storage on the device where you use the app. Deploying a new version through GitHub Pages does not, by itself, clear that data. Clearing site data or switching browsers or devices can remove access to that local copy.

For optional cross-device syncing, select the cloud status in the app and connect a GitHub personal access token with **gist** access. FlowFocus stores work totals in a secret Gist in your GitHub account. Use the same token on another device to connect to that data. The token is saved in that browser's local storage, so use this option only on a device you trust. The repository contains the app code, not your personal work totals.

The 30-minute break allowance is tracked in local storage **per device**. Work totals sync through the Gist, but break allowance usage does not sync between devices. Avoid starting paid breaks on multiple devices on the same day if you want a strict 30-minute daily cap across them.

## Project files

- `index.html` — tracker, break timer, local storage, and optional Gist sync.
- `weekly-reflection.html` — analytics dashboard.
- `theme.js` and `themes.css` — weekday theme selection and the seven shared color palettes.
- `sw.js` and `manifest.json` — offline caching and installable app settings.

This is a static website: no build step or server setup is required to run it locally. Serve the repository directory with a local HTTP server (for example, `python3 -m http.server 8000`) and open `http://localhost:8000/`.
