/** Calendar plausibility only; no registry lookup or identity verification. */
export function plausibleDate(value: string, century?: 1900 | 2000): boolean {
  const yy = Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4));
  const day = Number(value.slice(4, 6));
  const years = century ? [century + yy] : [1900 + yy, 2000 + yy];
  return years.some((year) => {
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  });
}
