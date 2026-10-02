// One local-calendar-day palette shared by the tracker and analytics page.
const dayThemes = [
  { name: 'Emerald', primary: '#10b981', light: '#a7f3d0', dark: '#065f46', secondary: '#6ee7b7' }, // Sunday: balance
  { name: 'Sapphire', primary: '#2563eb', light: '#93c5fd', dark: '#1e40af', secondary: '#60a5fa' }, // Monday: focus
  { name: 'Amethyst', primary: '#9333ea', light: '#d8b4fe', dark: '#6b21a8', secondary: '#c084fc' }, // Tuesday off: calm
  { name: 'Diamond', primary: '#e0f2fe', light: '#f0f9ff', dark: '#075985', secondary: '#7dd3fc' }, // Wednesday: clarity
  { name: 'Ruby', primary: '#dc143c', light: '#ff98a6', dark: '#881337', secondary: '#ff5c78' }, // Thursday: energy
  { name: 'Tourmaline', primary: '#ec4899', light: '#fbcfe8', dark: '#9d174d', secondary: '#f472b6' }, // Friday off: gentle
  { name: 'Topaz', primary: '#f59e0b', light: '#fde68a', dark: '#78350f', secondary: '#fbbf24' } // Saturday: warmth
];

function applyDayTheme() {
  const today = new Date();
  const theme = dayThemes[today.getDay()];
  const root = document.documentElement.style;
  root.setProperty('--primary', theme.primary);
  root.setProperty('--primary-light', theme.light);
  root.setProperty('--primary-dark', theme.dark);
  root.setProperty('--secondary', theme.secondary);
  root.setProperty('--success', theme.light);
  root.setProperty('--success-glow', `color-mix(in srgb, ${theme.light} 40%, transparent)`);
  root.setProperty('--info', theme.primary);
  root.setProperty('--primary-glow', `color-mix(in srgb, ${theme.primary} 45%, transparent)`);
  root.setProperty('--theme-soft', `color-mix(in srgb, ${theme.primary} 10%, transparent)`);
  root.setProperty('--theme-border', `color-mix(in srgb, ${theme.primary} 22%, transparent)`);
  root.setProperty('--theme-shadow', `color-mix(in srgb, ${theme.primary} 18%, transparent)`);
  root.setProperty('--theme-tint', `color-mix(in srgb, ${theme.primary} 11%, #0a0a0a)`);
  root.setProperty('--theme-name', `'${theme.name}'`);
  document.querySelector('meta[name="theme-color"]').content = '#0a0a0a';
  document.querySelectorAll('[data-day-theme]').forEach(el => {
    el.textContent = `${today.toLocaleDateString(undefined, { weekday: 'long' })} · ${theme.name}`;
  });
  return theme;
}

applyDayTheme();
