/**
 * One timezone for the whole app.
 *
 * "Today" used to mean three different things: the dashboard's reviewed-today
 * count and the progress initializer both used the server's midnight (UTC on
 * Vercel, whatever the region), while the stats chart bucketed by Asia/Taipei.
 * For a learner in Taiwan that meant reviews done before 8am counted as
 * yesterday on the dashboard but today on the chart, and the daily progress bar
 * only reset at 8am local time.
 *
 * Hard-coded for now because this is a single-learner app. If accounts ever span
 * timezones this becomes a user_settings column and these helpers take it as an
 * argument -- every caller already goes through them.
 */
export const APP_TIME_ZONE = "Asia/Taipei";

/** YYYY-MM-DD for the given instant, as seen in the app timezone. */
export function localDateKey(date: Date, timeZone: string = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

/**
 * The instant at which the app-timezone day containing `date` began.
 *
 * Derived by measuring the zone's offset at that instant rather than assuming a
 * fixed +08:00, so it stays correct for any zone this is later pointed at.
 */
export function startOfLocalDay(date: Date, timeZone: string = APP_TIME_ZONE): Date {
  const key = localDateKey(date, timeZone);
  // Midnight of that calendar day, read as if it were UTC...
  const asUtc = new Date(`${key}T00:00:00.000Z`);
  // ...then shifted by the zone's real offset at that moment.
  return new Date(asUtc.getTime() - zoneOffsetMs(asUtc, timeZone));
}

function zoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  // Intl renders hour 24 for midnight under hour12:false; Date.UTC handles it.
  const asIfUtc = Date.UTC(
    lookup("year"),
    lookup("month") - 1,
    lookup("day"),
    lookup("hour"),
    lookup("minute"),
    lookup("second")
  );

  return asIfUtc - date.getTime();
}
