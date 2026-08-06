import type {
  ClockTime,
  DoseLogEntry,
  DoseStatus,
  Pill,
  PillDuration,
  TodayDose,
  Weekday,
} from './types';

export function createId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatClockTime(time: ClockTime, use24Hour = false): string {
  if (use24Hour) {
    return `${pad2(time.hour)}:${pad2(time.minute)}`;
  }
  const period = time.hour >= 12 ? 'PM' : 'AM';
  const hour12 = time.hour % 12 === 0 ? 12 : time.hour % 12;
  return `${hour12}:${pad2(time.minute)} ${period}`;
}

export function clockToKey(time: ClockTime): string {
  return `${pad2(time.hour)}:${pad2(time.minute)}`;
}

export function parseClockKey(key: string): ClockTime {
  const [h, m] = key.split(':').map(Number);
  return { hour: h, minute: m };
}

export function toLocalDateString(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

export function doseLogKey(pillId: string, date: string, time: ClockTime | string): string {
  const t = typeof time === 'string' ? time : clockToKey(time);
  return `${pillId}|${date}|${t}`;
}

export function getDurationEndDate(duration: PillDuration): string | null {
  if (duration.type === 'keep') return null;
  if (duration.type === 'until') return duration.endDate;
  return addDays(duration.startDate, Math.max(duration.days - 1, 0));
}

export function isPillActiveOnDate(pill: Pill, dateStr: string): boolean {
  const day = parseLocalDate(dateStr).getDay() as Weekday;
  if (!pill.daysOfWeek.includes(day)) return false;

  const createdDate = toLocalDateString(new Date(pill.createdAt));
  if (dateStr < createdDate) return false;

  if (pill.duration.type === 'days' && dateStr < pill.duration.startDate) {
    return false;
  }

  const end = getDurationEndDate(pill.duration);
  if (end && dateStr > end) return false;

  return true;
}

export function getTodayDoses(
  pills: Pill[],
  doseLog: Record<string, DoseLogEntry>,
  now = new Date(),
): TodayDose[] {
  const date = toLocalDateString(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const doses: TodayDose[] = [];

  for (const pill of pills) {
    if (!isPillActiveOnDate(pill, date)) continue;

    for (const time of pill.times) {
      const key = doseLogKey(pill.id, date, time);
      const logged = doseLog[key];
      const status: DoseStatus = logged ? logged.status : 'pending';
      const sortMinutes = time.hour * 60 + time.minute;
      const isOverdue = status === 'pending' && sortMinutes < nowMinutes - 5;

      doses.push({
        key,
        pillId: pill.id,
        pillName: pill.name,
        notes: pill.notes,
        date,
        time,
        timeLabel: formatClockTime(time),
        status,
        isOverdue,
        sortMinutes,
      });
    }
  }

  return doses.sort((a, b) => {
    const statusRank = (s: DoseStatus) => (s === 'pending' ? 0 : 1);
    const rankDiff = statusRank(a.status) - statusRank(b.status);
    if (rankDiff !== 0) return rankDiff;
    return a.sortMinutes - b.sortMinutes;
  });
}

export function getNextPendingDose(doses: TodayDose[]): TodayDose | null {
  return doses.find((d) => d.status === 'pending') ?? null;
}

export const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const DAY_LABELS: { day: Weekday; short: string; long: string }[] = [
  { day: 0, short: 'Sun', long: 'Sunday' },
  { day: 1, short: 'Mon', long: 'Monday' },
  { day: 2, short: 'Tue', long: 'Tuesday' },
  { day: 3, short: 'Wed', long: 'Wednesday' },
  { day: 4, short: 'Thu', long: 'Thursday' },
  { day: 5, short: 'Fri', long: 'Friday' },
  { day: 6, short: 'Sat', long: 'Saturday' },
];

/** expo-notifications weekday: 1 = Sunday … 7 = Saturday */
export function toExpoWeekday(day: Weekday): number {
  return day + 1;
}

export function listOccurrenceDates(
  pill: Pill,
  fromDate: string,
  aheadDays: number,
): string[] {
  const dates: string[] = [];
  for (let i = 0; i <= aheadDays; i++) {
    const d = addDays(fromDate, i);
    if (isPillActiveOnDate(pill, d)) {
      dates.push(d);
    }
  }
  return dates;
}

export function describeDuration(duration: PillDuration): string {
  if (duration.type === 'keep') return 'Keep reminding me';
  if (duration.type === 'until') {
    const d = parseLocalDate(duration.endDate);
    return `Until ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  return `For ${duration.days} day${duration.days === 1 ? '' : 's'}`;
}

export function describeDays(days: Weekday[]): string {
  if (days.length === 7) return 'Every day';
  if (days.length === 0) return 'No days selected';
  const sorted = [...days].sort((a, b) => a - b);
  return sorted
    .map((d) => DAY_LABELS.find((x) => x.day === d)?.short ?? '')
    .filter(Boolean)
    .join(', ');
}
