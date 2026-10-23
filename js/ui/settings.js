// Settings: sync, backup, appearance, and the goals FlowFocus measures against.
import { S, on } from '../state.js';
import { h, clear, setText } from './dom.js';
import { gem as gemStone } from './gem.js';
import { cloudStorage } from '../gist.js';
import { connectGitHub, disconnectCloud, syncCloud, isSyncBusy } from '../sync.js';
import { downloadBackup, buildBackup, validateBackup, previewImport, applyImport } from '../backup.js';
import { readPrefs, writePrefs } from '../store.js';
import { parseDateKey, todayKey } from '../dates.js';
import { GEMS } from '../gems.js';
import { applyMode, syncWords } from './shell.js';
import { longDate } from './words.js';

const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=FlowFocus%20Sync';

let root = null;
let els = null;
const ui = { connecting: false, syncing: false, confirmDisconnect: false, say: '', sayError: false, importFile: null, importName: '', importPreview: null };

export function mountSettings(el) {
  root = el;
  root.innerHTML = `
    <div class="page-head">
      <h1 tabindex="-1">Settings</h1>
      <p class="lede">Sync between your phone and computer, keep a backup, and choose how the screens look.</p>
    </div>

    <section class="set" aria-labelledby="sync-title">
      <div>
        <h2 id="sync-title">Sync</h2>
        <p class="set-about">Your hours live in this browser. Sync keeps a private copy in your own GitHub gist, so the phone and the computer stay in step.</p>
      </div>
      <div class="set-body" data-k="sync"></div>
    </section>

    <section class="set" aria-labelledby="backup-title">
      <div>
        <h2 id="backup-title">Backup</h2>
        <p class="set-about">A file with every day you have logged, and your notes. Keep one somewhere safe now and then.</p>
      </div>
      <div class="set-body">
        <div class="set-actions">
          <button class="b b-solid" type="button" data-k="download">Download a backup</button>
          <label class="b file-b">Restore from a file<input type="file" data-k="restore" accept=".json,application/json"></label>
        </div>
        <p>Restoring merges the file with what is here, day by day. Where both have the same day, the more recent edit wins. Nothing is deleted, and a backup never holds your GitHub token.</p>
        <div data-k="import"></div>
        <p class="say" data-k="backup-say" aria-live="polite"></p>
      </div>
    </section>

    <section class="set" aria-labelledby="look-title">
      <div>
        <h2 id="look-title">Appearance</h2>
        <p class="set-about">Light or dark, or follow the device. It changes at once.</p>
      </div>
      <div class="set-body">
        <fieldset class="modes">
          <legend class="sr-only">Appearance</legend>
          <label><input type="radio" name="mode" value="system"><span class="m-name">Match device</span><span class="m-note">Follows your phone or computer</span></label>
          <label><input type="radio" name="mode" value="light"><span class="m-name">Light</span><span class="m-note">Pale ground, dark ink</span></label>
          <label><input type="radio" name="mode" value="dark"><span class="m-name">Dark</span><span class="m-note">Near-black ground</span></label>
        </fieldset>
      </div>
    </section>

    <section class="set" aria-labelledby="about-title">
      <div>
        <h2 id="about-title">About</h2>
        <p class="set-about">The goals FlowFocus measures against. They are fixed facts, not settings.</p>
      </div>
      <div class="set-body">
        <dl class="goals">
          <div><dt>A workday is full at</dt><dd>6h</dd></div>
          <div><dt>A week, Saturday to Friday</dt><dd>30h</dd></div>
          <div><dt>Rest days, every week</dt><dd>Tue and Fri</dd></div>
          <div><dt>Of break a day, counted as work</dt><dd>30m</dd></div>
        </dl>
        <p>Time logged on a rest day still counts toward the week. Each weekday has its gem:</p>
        <ul class="gem-row"></ul>
      </div>
    </section>`;

  const k = (name) => root.querySelector(`[data-k="${name}"]`);
  els = { sync: k('sync'), download: k('download'), restore: k('restore'), importSlot: k('import'), backupSay: k('backup-say') };

  // Re-render on sync news, but never under someone typing a token.
  on((type) => {
    if (type === 'sync' && !(document.activeElement && document.activeElement.id === 'tokenInput')) renderSyncBody();
  });

  // ---------------------------------------------------------- backup
  els.download.addEventListener('click', () => {
    downloadBackup();
    const days = Object.values(buildBackup().weekData).filter((v) => v > 0).length;
    say(`Downloaded flowfocus-backup-${todayKey()}.json, with ${days} day${days === 1 ? '' : 's'} of hours.`, false);
  });
  els.restore.addEventListener('change', async () => {
    const f = els.restore.files && els.restore.files[0];
    ui.importFile = null;
    ui.importPreview = null;
    if (!f) return;
    try {
      const v = validateBackup(JSON.parse(await f.text()));
      if (!v.ok) say(`${v.error} Nothing was changed.`, true);
      else {
        ui.importFile = v.file;
        ui.importName = f.name;
        ui.importPreview = previewImport(v.file);
        say('', false);
      }
    } catch {
      say(`${f.name} isn’t a FlowFocus backup. Nothing was changed.`, true);
    }
    els.restore.value = '';
    renderImport();
  });

  // ---------------------------------------------------------- appearance
  const mode = readPrefs().mode;
  root.querySelectorAll('input[name="mode"]').forEach((input) => {
    input.checked = input.value === (mode === 'light' || mode === 'dark' ? mode : 'system');
    input.addEventListener('change', () => {
      if (!input.checked) return;
      writePrefs({ ...readPrefs(), mode: input.value });
      applyMode(input.value);
    });
  });

  // ---------------------------------------------------------- about: the gems, Saturday first
  const row = root.querySelector('.gem-row');
  [6, 0, 1, 2, 3, 4, 5].forEach((dow) => {
    const g = GEMS[dow];
    const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow];
    row.appendChild(h('li', { class: 'gem-host', 'data-gem': g.id }, [
      gemStone(g.id, 32, { motion: 'hover' }),
      h('span', {}, [h('strong', {}, day)]),
      h('span', {}, g.name)
    ]));
  });

  renderSettings();
}

export function renderSettings() {
  if (!root) return;
  renderSyncBody();
  renderImport();
  els.restore.disabled = S.readOnly;
}

function say(text, error) {
  setText(els.backupSay, text);
  els.backupSay.classList.toggle('is-error', error);
}

// ------------------------------------------------------------- sync

function renderSyncBody() {
  if (!els) return;
  const w = syncWords();
  const body = els.sync;
  const keepSay = ui.say;
  clear(body);
  body.appendChild(h('div', { class: `is-${w.kind}` }, [
    h('p', { class: 'status-line' }, [h('span', { class: 'status-mark', 'aria-hidden': 'true' }), h('span', { class: 'v' }, w.label)]),
    h('p', { class: 'status-detail' }, w.detail)
  ]));

  const sayEl = h('p', { class: `say${ui.sayError ? ' is-error' : ''}`, id: 'syncSay', 'aria-live': 'polite' }, keepSay);

  if (!cloudStorage.isConfigured) {
    const input = h('input', {
      id: 'tokenInput', type: 'password', autocomplete: 'off', spellcheck: 'false',
      placeholder: 'ghp_…', 'aria-describedby': 'syncSay', 'aria-invalid': ui.sayError ? 'true' : null,
      disabled: ui.connecting || S.readOnly
    });
    const connect = h('button', { class: 'b b-solid', type: 'submit', disabled: ui.connecting || S.readOnly }, ui.connecting ? 'Checking the token…' : 'Connect');
    const form = h('form', { class: 'token-row', novalidate: true }, [
      h('div', { class: 'field' }, [h('label', { for: 'tokenInput' }, 'GitHub token'), input]),
      connect
    ]);
    form.addEventListener('submit', (e) => { e.preventDefault(); connectToken(input.value.trim()); });
    body.append(
      h('ol', { class: 'steps', 'aria-label': 'Connect GitHub' }, [
        h('li', {}, [h('span', {}, [h('a', { href: TOKEN_URL, target: '_blank', rel: 'noopener' }, 'Open GitHub’s token settings'), ' in a new tab.'])]),
        h('li', {}, [h('span', {}, ['Make a classic token named ', h('strong', {}, 'FlowFocus Sync'), '.'])]),
        h('li', {}, [h('span', {}, ['Tick the ', h('strong', {}, 'gist'), ' scope only, and nothing else.'])]),
        h('li', {}, [h('span', {}, 'Copy the token and paste it below. Do the same on each of your devices.')])
      ]),
      form,
      h('p', {}, 'The token is kept in this browser only, so use sync on devices you trust.'),
      sayEl
    );
    return;
  }

  const busy = ui.syncing || isSyncBusy();
  if (ui.confirmDisconnect) {
    const keep = h('button', { class: 'b', type: 'button' }, 'Keep sync');
    const yes = h('button', { class: 'b b-warn', type: 'button' }, 'Disconnect');
    keep.addEventListener('click', () => { ui.confirmDisconnect = false; renderSyncBody(); focus('#syncDisconnect'); });
    yes.addEventListener('click', () => {
      disconnectCloud();
      ui.confirmDisconnect = false;
      ui.say = 'Disconnected. Your hours stay on this device.';
      ui.sayError = false;
      renderSyncBody();
      focus('#tokenInput');
    });
    body.appendChild(h('div', { class: 'confirm', role: 'group', 'aria-label': 'Confirm disconnect' }, [
      h('p', {}, 'Stop syncing on this device? Every hour stays here, and the gist stays in your GitHub account.'),
      h('div', { class: 'set-actions' }, [keep, yes])
    ]));
  } else {
    const now = h('button', { class: 'b b-solid', type: 'button', id: 'syncNow', disabled: busy || S.readOnly }, busy ? 'Syncing…' : w.kind === 'error' ? 'Try again now' : 'Sync now');
    const off = h('button', { class: 'b b-warn', type: 'button', id: 'syncDisconnect', disabled: S.readOnly }, 'Disconnect');
    now.addEventListener('click', syncNow);
    off.addEventListener('click', () => { ui.confirmDisconnect = true; ui.say = ''; renderSyncBody(); focus('.confirm .b'); });
    body.appendChild(h('div', { class: 'set-actions' }, [now, off]));
  }
  body.append(
    h('p', {}, 'Disconnecting keeps every hour on this device and leaves the gist on GitHub untouched. Break time and the working-on notes stay on each device; only hours sync.'),
    sayEl
  );
}

function focus(sel) {
  requestAnimationFrame(() => { const el = els.sync.querySelector(sel); if (el) el.focus(); });
}

async function connectToken(token) {
  if (!token || token.length < 20) {
    ui.say = token ? 'That token looks too short. Paste the whole token from GitHub.' : 'Paste your token first.';
    ui.sayError = true;
    renderSyncBody();
    focus('#tokenInput');
    return;
  }
  ui.connecting = true;
  ui.say = 'Checking the token with GitHub…';
  ui.sayError = false;
  renderSyncBody();
  try {
    const res = await connectGitHub(token);
    ui.say = res.found
      ? 'Connected. Your FlowFocus data on GitHub was found and merged with this device.'
      : 'Connected. A new secret gist now keeps your hours in step.';
    ui.sayError = false;
  } catch {
    ui.say = 'GitHub didn’t accept that token. Check that it has the gist scope, and try again.';
    ui.sayError = true;
  } finally {
    ui.connecting = false;
    renderSyncBody();
    focus(ui.sayError ? '#tokenInput' : '#syncNow');
  }
}

async function syncNow() {
  ui.syncing = true;
  ui.say = '';
  renderSyncBody();
  S.cloudError = null;
  const result = await syncCloud();
  ui.syncing = false;
  if (result.success) {
    ui.say = result.pulledDays > 0
      ? `Synced. ${result.pulledDays} day${result.pulledDays === 1 ? '' : 's'} updated from your other device.`
      : 'Synced. Nothing new from your other devices.';
    ui.sayError = false;
  } else {
    ui.say = 'Couldn’t sync just now. Your hours are safe here.';
    ui.sayError = true;
  }
  renderSyncBody();
  focus('#syncNow');
}

// ------------------------------------------------------------- restore

function renderImport() {
  if (!els) return;
  const slot = els.importSlot;
  clear(slot);
  const p = ui.importPreview;
  if (!p) return;
  const from = parseDateKey(p.from);
  const to = parseDateKey(p.to);
  const cancel = h('button', { class: 'b', type: 'button' }, 'Cancel');
  const apply = h('button', { class: 'b b-solid', type: 'button', disabled: S.readOnly || p.changed === 0 },
    p.changed ? `Bring in ${p.changed} day${p.changed === 1 ? '' : 's'}` : 'Nothing to bring in');
  cancel.addEventListener('click', () => {
    ui.importFile = null; ui.importPreview = null;
    renderImport();
    say('Nothing was changed.', false);
  });
  apply.addEventListener('click', () => {
    const n = applyImport(ui.importFile);
    const name = ui.importName;
    ui.importFile = null; ui.importPreview = null;
    renderImport();
    say(`Merged ${n} day${n === 1 ? '' : 's'} from ${name}.`, false);
  });
  slot.appendChild(h('div', { class: 'confirm', role: 'group', 'aria-label': 'Restore from a file' }, [
    h('p', {}, `${ui.importName} holds ${p.days} day${p.days === 1 ? '' : 's'}, from ${longDate(from)} ${from.getFullYear()} to ${longDate(to)} ${to.getFullYear()}. ${p.changed} would change on this device.${p.skippedToday ? ' Today is left as it is, because time is already on its clock.' : ''}`),
    h('div', { class: 'set-actions' }, [cancel, apply])
  ]));
  requestAnimationFrame(() => (p.changed ? apply : cancel).focus());
}
