/** Julian Date for a JS Date (UTC; TT–UTC offset is irrelevant at this precision). */
export function dateToJD(d: Date): number {
  return d.getTime() / 86_400_000 + 2440587.5;
}

export function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86_400_000);
}

/** 'YYYY-MM-DD' → JD at 00:00 UTC */
export function isoToJD(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return dateToJD(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
}

export function jdToISO(jd: number): string {
  return jdToDate(jd).toISOString().slice(0, 10);
}

export const DAYS_PER_YEAR = 365.25;
