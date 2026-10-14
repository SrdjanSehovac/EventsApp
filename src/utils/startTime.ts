/** Parse a "YYYY-MM-DD" or "MM/DD/YYYY" date plus "19:00"/"7:00 PM" into a local ISO start (no zone; the server reads it as Toronto time). */
export function toIsoStart(dateRaw: string, timeRaw: string): string | null {
  const date = dateRaw.trim();
  const time = timeRaw.trim() || '19:00';
  let isoDate: string | null = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    isoDate = date;
  } else {
    const match = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      isoDate = `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    }
  }
  if (!isoDate) return null;

  const timeMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!timeMatch) return null;
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const meridiem = timeMatch[3]?.toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;

  return `${isoDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}
