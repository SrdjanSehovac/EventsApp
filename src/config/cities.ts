/** Focus cities for SW Ontario. Always offered in city filters. */
export const SW_ONTARIO_CITIES = [
  'Toronto',
  'Ottawa',
  'London',
  'Mississauga',
] as const;

export type SwOntarioCity = (typeof SW_ONTARIO_CITIES)[number];
