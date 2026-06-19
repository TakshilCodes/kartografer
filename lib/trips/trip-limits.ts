export const MAX_TRIP_DAYS = 15;
export const MAX_TRIP_PEOPLE = 20;
export const MAX_SPECIAL_NOTES_LENGTH = 500;

export function countNonWhitespaceCharacters(value: string) {
  return value.replace(/\s/g, "").length;
}
