// GitHub Gist storage, ported from the original tracker. The payload format is
// unchanged so older copies of the app keep syncing with this one.
import { KEYS, GIST_FILE } from './config.js';
import * as store from './storage.js';

export class GitHubGistStorage {
  constructor() {
    this.reload();
    this.lastError = null; // { kind: offline|temporary|auth|missing|data, status }
  }

  reload() {
    this.gistId = store.read(KEYS.gistId);
    this.githubToken = store.read(KEYS.token);
    this.lastSync = store.read(KEYS.lastSync);
    this.isConfigured = !!this.githubToken;
  }

  // All GitHub calls go through here:
  //  - cache: 'no-store': GitHub sends max-age=60 on authenticated requests, so
  //    without this a second device can be served a stale gist for a minute.
  //  - a timeout, so a hung connection can't block syncing forever.
  async _fetch(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { cache: 'no-store', ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  _headers(extra = {}) {
    return { Authorization: `token ${this.githubToken}`, ...extra };
  }

  _fail(kind, status = 0) {
    this.lastError = { kind, status };
  }

  _failFromStatus(status) {
    if (status === 401 || status === 403) this._fail('auth', status);
    else if (status === 404) this._fail('missing', status);
    else this._fail('temporary', status);
  }

  _failFromException(error) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) this._fail('offline');
    else if (error && error.name === 'AbortError') this._fail('temporary');
    else if (error instanceof TypeError) this._fail('offline');
    else this._fail('temporary');
  }

  async configure(token) {
    this.githubToken = token;
    store.write(KEYS.token, token);
    try {
      const isValid = await this.testToken();
      if (!isValid) throw new Error('Invalid GitHub token');

      const existingGist = await this.findExistingGist();
      let found = false;
      if (existingGist) {
        this.gistId = existingGist.id;
        store.write(KEYS.gistId, existingGist.id);
        found = true;
      } else {
        await this.createGist();
      }
      this.isConfigured = true;
      this.updateLastSync();
      return { found };
    } catch (error) {
      console.error('GitHub setup failed:', error);
      this.disconnect();
      throw error;
    }
  }

  async testToken() {
    try {
      const response = await this._fetch('https://api.github.com/user', { headers: this._headers() });
      if (!response.ok) this._failFromStatus(response.status);
      return response.ok;
    } catch (error) {
      this._failFromException(error);
      return false;
    }
  }

  // Looks through up to 10 pages of gists for our data file.
  async findExistingGist() {
    try {
      for (let page = 1; page <= 10; page++) {
        const response = await this._fetch(`https://api.github.com/gists?per_page=100&page=${page}`, { headers: this._headers() });
        if (!response.ok) return null;
        const gists = await response.json();
        if (!Array.isArray(gists) || gists.length === 0) return null;
        const hit = gists.find((g) => g.files && g.files[GIST_FILE]);
        if (hit) return hit;
        if (gists.length < 100) return null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async createGist() {
    const initialData = { weekData: {}, streak: 0, createdAt: new Date().toISOString(), version: '1.0' };
    const response = await this._fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: this._headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        description: 'FlowFocus Tracker Data - DO NOT DELETE',
        public: false,
        files: { [GIST_FILE]: { content: JSON.stringify(initialData, null, 2) } }
      })
    });
    if (!response.ok) throw new Error('Failed to create gist');
    const gist = await response.json();
    this.gistId = gist.id;
    store.write(KEYS.gistId, gist.id);
    return gist;
  }

  async save(data, options = {}) {
    if (!this.isConfigured) return { success: false, message: 'Not configured' };
    try {
      const cloudData = {
        weekData: data.weekData || {},
        meta: data.meta || {},   // per-day last-modified times, used to merge devices
        streak: data.streak || 0,
        lastSync: new Date().toISOString(),
        version: '2.0',
        device: navigator.userAgent.substring(0, 100)
      };
      const body = JSON.stringify({
        description: `FlowFocus Data - Last sync: ${new Date().toLocaleString()}`,
        files: { [GIST_FILE]: { content: JSON.stringify(cloudData) } }
      });
      // keepalive requests are limited to 64KB of body.
      const keepalive = !!options.keepalive && body.length < 60000;
      const response = await this._fetch(`https://api.github.com/gists/${this.gistId}`, {
        method: 'PATCH',
        keepalive,
        headers: this._headers({ 'Content-Type': 'application/json' }),
        body
      });
      if (!response.ok) {
        this._failFromStatus(response.status);
        throw new Error('Failed to save to cloud');
      }
      this.updateLastSync();
      return { success: true, message: 'Synced to cloud' };
    } catch (error) {
      if (!this.lastError) this._failFromException(error);
      console.error('Cloud save failed:', error);
      return { success: false, message: error.message };
    }
  }

  // Returns the stored data object, or null if it could not be read.
  // (null must never be treated as "empty": that is how a dropped connection
  // used to wipe local data.)
  async load() {
    if (!this.isConfigured || !this.gistId) {
      this._fail('missing');
      return null;
    }
    this.lastError = null;
    try {
      let response;
      try {
        response = await this._fetch(`https://api.github.com/gists/${this.gistId}`, { headers: this._headers() });
      } catch (error) {
        this._failFromException(error);
        return null;
      }
      if (!response.ok) {
        this._failFromStatus(response.status);
        return null;
      }
      const gist = await response.json();
      const file = gist.files && gist.files[GIST_FILE];
      if (!file || file.truncated || typeof file.content !== 'string') {
        this._fail('data');
        return null;
      }
      const data = JSON.parse(file.content);
      if (!data || typeof data.weekData !== 'object' || data.weekData === null) {
        this._fail('data');
        return null;
      }
      return data;
    } catch (error) {
      console.error('Cloud load failed:', error);
      this._fail('data');
      return null;
    }
  }

  updateLastSync() {
    this.lastSync = new Date().toISOString();
    store.write(KEYS.lastSync, this.lastSync);
  }

  disconnect() {
    store.remove(KEYS.token);
    store.remove(KEYS.gistId);
    store.remove(KEYS.lastSync);
    this.githubToken = null;
    this.gistId = null;
    this.lastSync = null;
    this.isConfigured = false;
  }

  getStatus() {
    return { isConfigured: this.isConfigured, gistId: this.gistId, lastSync: this.lastSync };
  }
}

export const cloudStorage = new GitHubGistStorage();
