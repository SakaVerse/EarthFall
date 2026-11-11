/**
 * Date utility for Earthfall: Beyond the Solar System
 * Formats current date strictly in Asia/Kolkata (IST = UTC+5:30) timezone
 * for clean 12:00 AM midnight daily resets.
 */

export function getTodayISTDateString(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const day = parts.find((p) => p.type === 'day')?.value || '01';

  return `${year}-${month}-${day}`;
}

export function getYesterdayISTDateString(): string {
  // 24 hours prior in IST
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(yesterday);

  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const day = parts.find((p) => p.type === 'day')?.value || '01';

  return `${year}-${month}-${day}`;
}

/**
 * Calculates remaining hours, minutes, and seconds until 12:00 AM midnight IST
 */
export function getTimeUntilMidnightIST(): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const now = new Date();
  // Get current time in Asia/Kolkata timezone
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = istFormatter.formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  const second = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);

  const currentSecondsInDay = hour * 3600 + minute * 60 + second;
  const totalSecondsInDay = 86400; // 24 * 3600
  let diffSeconds = totalSecondsInDay - currentSecondsInDay;
  if (diffSeconds < 0) diffSeconds = 0;

  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return { hours, minutes, seconds, formatted };
}
