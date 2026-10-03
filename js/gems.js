// The seven weekday gems, indexed by Date.getDay() (0 = Sunday).
export const GEMS = [
  { id: 'emerald', name: 'Emerald' },       // Sunday
  { id: 'sapphire', name: 'Sapphire' },     // Monday
  { id: 'amethyst', name: 'Amethyst' },     // Tuesday (rest day)
  { id: 'diamond', name: 'Diamond' },       // Wednesday
  { id: 'ruby', name: 'Ruby' },             // Thursday
  { id: 'tourmaline', name: 'Tourmaline' }, // Friday (rest day)
  { id: 'topaz', name: 'Topaz' }            // Saturday
];

export function gemFor(date) {
  return GEMS[date.getDay()];
}
