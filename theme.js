// One local-calendar-day palette shared by the tracker and analytics page.
const dayThemes = [
  { name: 'Emerald', primary: '#54cf9a', light: '#91ebc2', dark: '#176d4a', secondary: '#79dcb0' }, // Sunday: balance
  { name: 'Sapphire', primary: '#72a9f8', light: '#a7cbff', dark: '#2853a0', secondary: '#93bbef' }, // Monday: focus
  { name: 'Amethyst', primary: '#b794f4', light: '#d2b7ff', dark: '#654099', secondary: '#c5a6ed' }, // Tuesday off: calm
  { name: 'Diamond', primary: '#aedbe8', light: '#d8f4f7', dark: '#38647a', secondary: '#c0e9ed' }, // Wednesday: clarity
  { name: 'Ruby', primary: '#ed6577', light: '#ffa0ab', dark: '#8b253a', secondary: '#f38e9c' }, // Thursday: energy
  { name: 'Tourmaline', primary: '#ed8fb8', light: '#ffc0d9', dark: '#873965', secondary: '#dca6d3' }, // Friday off: gentle
  { name: 'Topaz', primary: '#edbd64', light: '#ffdda0', dark: '#87591b', secondary: '#f4ce87' } // Saturday: warmth
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
