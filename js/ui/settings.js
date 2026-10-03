// Settings: sync, backup, and appearance.
import { S, on, notify } from '../state.js';
import { h, icon, clear } from './dom.js';
import { cloudStorage } from '../gist.js';
import { connectGitHub, disconnectCloud, syncCloud, syncStatus, isSyncBusy } from '../sync.js';
import { downloadBackup, validateBackup, previewImport, applyImport } from '../backup.js';
import { readPrefs, writePrefs } from '../store.js';
import { parseDateKey } from '../dates.js';
import { formatShortDate } from '../format.js';
import { applyMode } from './shell.js';

let root = null;
let ui = { connecting: false, connectError: '', confirmDisconnect: false, importFile: null, importPreview: null, importError: '', syncNowBusy: false };

export function mountSettings(el) {
  root = el;
  on((type) => { if (type === 'sync' && root && root.isConnected && !document.activeElement?.matches?.('#tokenInput')) renderSettings(); });
  renderSettings();
}

function lastSyncText() {
  if (!cloudStorage.lastSync) return 'not yet';
  const d = new Date(cloudStorage.lastSync);
  return d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

function statusSentence() {
  const st = syncStatus();
  switch (st.state) {
    case 'local': return 'Your hours are saved in this browser only.';
    case 'syncing': return 'Syncing with your GitHub gist now.';
    case 'ok': return `Synced with your secret GitHub gist. Last sync ${lastSyncText()}.`;
    case 'offline': return 'You’re offline. Your hours are safe here and will sync when you’re back online.';
    case 'auth': return 'GitHub didn’t accept the saved token. Your hours are safe here. Disconnect and connect again with a new token.';
    case 'missing': return 'The sync gist couldn’t be found on GitHub. Your hours are safe here. Disconnect and connect again to create a new one.';
    case 'data': return 'The sync file on GitHub couldn’t be read, so nothing was overwritten. Your hours are safe here.';
    case 'retry': return 'GitHub couldn’t be reached just now. Your hours are safe here; FlowFocus will try again shortly.';
    default: return `Sync is on. Last sync ${lastSyncText()}.`;
  }
}

export function renderSettings() {
  if (!root) return;
  clear(root);
  root.append(
    h('header', { class: 'view-head' }, [
      h('h1', { class: 'view-title' }, 'Settings'),
      h('p', { class: 'view-lede' }, 'Sync between devices, backups, and how FlowFocus looks.')
    ]),
    syncSection(),
    backupSection(),
    appearanceSection()
  );
}

function syncSection() {
  const st = syncStatus();
  const body = [h('p', { class: `set-status set-status-${st.state}`, role: 'status' }, [icon(st.state === 'ok' ? 'cloud-check' : st.state === 'local' ? 'device' : (st.state === 'syncing' ? 'cloud' : 'cloud-alert')), h('span', {}, statusSentence())])];

  if (!cloudStorage.isConfigured) {
    const input = h('input', {
      id: 'tokenInput', class: 'field-input mono', type: 'password', autocomplete: 'off', spellcheck: 'false',
      placeholder: 'ghp_… or github_pat_…', 'aria-describedby': 'tokenHelp'
    });
    const connect = h('button', { class: 'btn btn-ink', type: 'button', disabled: ui.connecting || S.readOnly }, [icon('cloud'), h('span', {}, ui.connecting ? 'Checking token…' : 'Connect and sync')]);
    connect.addEventListener('click', async () => {
      const token = input.value.trim();
      if (!token) { ui.connectError = 'Paste a token first.'; renderSettings(); return; }
      ui.connecting = true; ui.connectError = ''; renderSettings();
      try {
        const res = await connectGitHub(token);
        notify('Sync connected', res.found ? 'Found your existing FlowFocus data and merged it with this device.' : 'Created a new secret gist for your hours.');
      } catch {
        ui.connectError = 'GitHub didn’t accept that token. Check that it has the “gist” scope and try again.';
      } finally {
        ui.connecting = false; renderSettings();
      }
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') connect.click(); });
    body.push(
      h('p', { class: 'set-text' }, 'Sync keeps your hours in step across your phone and computer, using a secret gist in your own GitHub account. Use the same token on each device.'),
      h('ol', { class: 'steps' }, [
        h('li', {}, ['Open ', h('a', { href: 'https://github.com/settings/tokens', target: '_blank', rel: 'noopener' }, 'GitHub token settings'), '.']),
        h('li', {}, 'Generate a classic token named “FlowFocus Sync”.'),
        h('li', {}, ['Tick the ', h('strong', {}, 'gist'), ' scope only, generate it, and copy it.']),
        h('li', {}, 'Paste it below. On your other devices, paste the same token.')
      ]),
      h('label', { class: 'field-label', for: 'tokenInput' }, 'GitHub token'),
      input,
      h('p', { class: 'field-help', id: 'tokenHelp' }, 'The token is saved in this browser only. Use sync on devices you trust.'),
      ui.connectError ? h('p', { class: 'field-error', role: 'alert' }, ui.connectError) : null,
      h('div', { class: 'set-actions' }, [connect])
    );
  } else {
    const syncNow = h('button', { class: 'btn btn-ink', type: 'button', disabled: ui.syncNowBusy || isSyncBusy() || S.readOnly }, [icon('sync'), h('span', {}, ui.syncNowBusy ? 'Syncing…' : 'Sync now')]);
    syncNow.addEventListener('click', async () => {
      ui.syncNowBusy = true; renderSettings();
      S.cloudError = null;
      const result = await syncCloud();
      ui.syncNowBusy = false;
      renderSettings();
      if (result.success) {
        notify('Up to date', result.pulledDays > 0 ? `${result.pulledDays} day${result.pulledDays === 1 ? '' : 's'} updated from your other device.` : 'Nothing new from your other devices.');
      }
    });
    const actions = [syncNow];
    if (ui.confirmDisconnect) {
      const yes = h('button', { class: 'btn btn-danger', type: 'button' }, 'Disconnect');
      const no = h('button', { class: 'btn btn-quiet', type: 'button' }, 'Keep sync');
      yes.addEventListener('click', () => { disconnectCloud(); ui.confirmDisconnect = false; renderSettings(); notify('Sync off', 'Your hours stay on this device.'); });
      no.addEventListener('click', () => { ui.confirmDisconnect = false; renderSettings(); });
      body.push(h('div', { class: 'confirm', role: 'group', 'aria-label': 'Confirm disconnect' }, [
        h('p', {}, 'Stop syncing on this device? Your hours stay here, and the gist stays in your GitHub account.'),
        h('div', { class: 'set-actions' }, [no, yes])
      ]));
    } else {
      const disconnect = h('button', { class: 'btn btn-quiet', type: 'button', disabled: S.readOnly }, [icon('unlink'), h('span', {}, 'Disconnect')]);
      disconnect.addEventListener('click', () => { ui.confirmDisconnect = true; renderSettings(); });
      actions.push(disconnect);
    }
    body.push(
      h('dl', { class: 'set-facts' }, [
        h('dt', {}, 'Last sync'), h('dd', {}, lastSyncText()),
        h('dt', {}, 'Gist'), h('dd', { class: 'mono' }, cloudStorage.gistId ? `${cloudStorage.gistId.slice(0, 8)}…` : 'not set')
      ]),
      h('div', { class: 'set-actions' }, actions),
      h('p', { class: 'field-help' }, 'Break time is tracked on each device separately and doesn’t sync.')
    );
  }
  return h('section', { class: 'set-section', 'aria-labelledby': 'set-sync' }, [h('h2', { class: 'label', id: 'set-sync' }, 'Sync'), ...body]);
}

function backupSection() {
  const download = h('button', { class: 'btn btn-quiet', type: 'button' }, [icon('download'), h('span', {}, 'Download a backup')]);
  download.addEventListener('click', () => { downloadBackup(); notify('Backup saved', 'A JSON file with your hours and notes was downloaded. It never includes your GitHub token.'); });

  const file = h('input', { type: 'file', accept: 'application/json,.json', class: 'visually-hidden', id: 'importFile' });
  const choose = h('label', { class: 'btn btn-quiet', for: 'importFile', role: 'button', tabindex: '0' }, [icon('upload'), h('span', {}, 'Restore from a backup')]);
  choose.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    ui.importError = ''; ui.importPreview = null; ui.importFile = null;
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      const v = validateBackup(parsed);
      if (!v.ok) ui.importError = v.error;
      else { ui.importFile = v.file; ui.importPreview = previewImport(v.file); }
    } catch {
      ui.importError = 'That file couldn’t be read as a FlowFocus backup.';
    }
    renderSettings();
  });

  const body = [
    h('p', { class: 'set-text' }, 'Keep a copy of your hours outside the browser. Restoring merges a backup with what’s here: for each day, the most recent edit wins.'),
    h('div', { class: 'set-actions' }, [download, choose, file])
  ];
  if (ui.importError) body.push(h('p', { class: 'field-error', role: 'alert' }, ui.importError));
  if (ui.importPreview) {
    const p = ui.importPreview;
    const apply = h('button', { class: 'btn btn-ink', type: 'button', disabled: S.readOnly || p.changed === 0 }, p.changed ? `Bring in ${p.changed} day${p.changed === 1 ? '' : 's'}` : 'Nothing to bring in');
    const cancel = h('button', { class: 'btn btn-quiet', type: 'button' }, 'Cancel');
    apply.addEventListener('click', () => {
      const n = applyImport(ui.importFile);
      ui.importFile = null; ui.importPreview = null;
      renderSettings();
      notify('Backup restored', `${n} day${n === 1 ? '' : 's'} updated.`);
    });
    cancel.addEventListener('click', () => { ui.importFile = null; ui.importPreview = null; renderSettings(); });
    body.push(h('div', { class: 'confirm', role: 'group', 'aria-label': 'Restore preview' }, [
      h('p', {}, `This backup holds ${p.days} day${p.days === 1 ? '' : 's'}, from ${formatShortDate(parseDateKey(p.from))} ${parseDateKey(p.from).getFullYear()} to ${formatShortDate(parseDateKey(p.to))} ${parseDateKey(p.to).getFullYear()}. ${p.changed} would change on this device.${p.skippedToday ? ' Today is left as it is, because time is already on its clock.' : ''}`),
      h('div', { class: 'set-actions' }, [cancel, apply])
    ]));
  }
  return h('section', { class: 'set-section', 'aria-labelledby': 'set-backup' }, [h('h2', { class: 'label', id: 'set-backup' }, 'Backup'), ...body]);
}

function appearanceSection() {
  const prefs = readPrefs();
  const choices = [['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']];
  const seg = h('div', { class: 'seg', role: 'radiogroup', 'aria-labelledby': 'set-look' }, choices.map(([v, label]) => {
    const b = h('button', { class: 'seg-btn', type: 'button', role: 'radio', 'aria-checked': prefs.mode === v ? 'true' : 'false' }, label);
    b.addEventListener('click', () => { writePrefs({ ...readPrefs(), mode: v }); applyMode(v); renderSettings(); requestAnimationFrame(() => root.querySelector('.set-section .seg-btn[aria-checked="true"]')?.focus()); });
    return b;
  }));
  return h('section', { class: 'set-section', 'aria-labelledby': 'set-look' }, [
    h('h2', { class: 'label', id: 'set-look' }, 'Appearance'),
    h('p', { class: 'set-text' }, 'The dial takes the colour of the day’s gem either way.'),
    seg
  ]);
}
