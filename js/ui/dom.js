// Small DOM helpers.

export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return el;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function $(sel, root = document) {
  return root.querySelector(sel);
}

// Writes only when the text changes, so a once-a-second render touches nothing that stands still.
export function setText(el, text) {
  if (el && el.textContent !== text) el.textContent = text;
}

export function setAttr(el, name, value) {
  if (!el) return;
  if (value === null || value === undefined) { if (el.hasAttribute(name)) el.removeAttribute(name); return; }
  const v = String(value);
  if (el.getAttribute(name) !== v) el.setAttribute(name, v);
}

// An inline custom property, written only when it changes.
export function setVar(el, name, value) {
  if (!el) return;
  const v = String(value);
  if (el.style.getPropertyValue(name) !== v) el.style.setProperty(name, v);
}

export function visible(el) {
  return !!el && el.isConnected && el.offsetParent !== null;
}
