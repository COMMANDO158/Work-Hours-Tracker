// Choose one of the seven exact CSS palettes using the local calendar day.
const dayThemes = [
  { name: 'Emerald', id: 'emerald' }, // Sunday: balance
  { name: 'Sapphire', id: 'sapphire' }, // Monday: focus
  { name: 'Amethyst', id: 'amethyst' }, // Tuesday off: calm
  { name: 'Diamond', id: 'diamond' }, // Wednesday: clarity
  { name: 'Ruby', id: 'ruby' }, // Thursday: energy
  { name: 'Tourmaline', id: 'tourmaline' }, // Friday off: gentle
  { name: 'Topaz', id: 'topaz' } // Saturday: warmth
];

function applyDayTheme() {
  const today = new Date();
  const theme = dayThemes[today.getDay()];
  document.documentElement.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]').content = '#0a0a0a';
  document.querySelectorAll('[data-day-theme]').forEach(el => {
    el.textContent = `${today.toLocaleDateString(undefined, { weekday: 'long' })} · ${theme.name}`;
  });
  return theme;
}

applyDayTheme();
