import type {
  ClockTime,
  DoseLogEntry,
  DoseStatus,
  Pill,
  PillDuration,
  TodayDose,
  Weekday,
} from './types';
import { t } from '@/src/i18n';

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

export type DayDoseSummary = {
  scheduled: number;
  taken: number;
  skipped: number;
  pending: number;
};

export function getDosesForDate(
  pills: Pill[],
  doseLog: Record<string, DoseLogEntry>,
  dateStr: string,
  now = new Date(),
): TodayDose[] {
  const today = toLocalDateString(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const doses: TodayDose[] = [];

  for (const pill of pills) {
    if (!isPillActiveOnDate(pill, dateStr)) continue;

    for (const time of pill.times) {
      const key = doseLogKey(pill.id, dateStr, time);
      const logged = doseLog[key];
      const status: DoseStatus = logged ? logged.status : 'pending';
      const sortMinutes = time.hour * 60 + time.minute;

      let isOverdue = false;
      if (status === 'pending') {
        if (dateStr < today) {
          isOverdue = true;
        } else if (dateStr === today) {
          isOverdue = sortMinutes < nowMinutes - 5;
        }
      }

      doses.push({
        key,
        pillId: pill.id,
        pillName: pill.name,
        notes: pill.notes,
        date: dateStr,
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

export function getTodayDoses(
  pills: Pill[],
  doseLog: Record<string, DoseLogEntry>,
  now = new Date(),
): TodayDose[] {
  return getDosesForDate(pills, doseLog, toLocalDateString(now), now);
}

export function getDayDoseSummary(
  pills: Pill[],
  doseLog: Record<string, DoseLogEntry>,
  dateStr: string,
  now = new Date(),
): DayDoseSummary {
  const doses = getDosesForDate(pills, doseLog, dateStr, now);
  return {
    scheduled: doses.length,
    taken: doses.filter((d) => d.status === 'taken').length,
    skipped: doses.filter((d) => d.status === 'skipped').length,
    pending: doses.filter((d) => d.status === 'pending').length,
  };
}

/** Pending doses from yesterday (overdue) then today, for home/widgets. */
export function getHomeWindowPendingDoses(
  pills: Pill[],
  doseLog: Record<string, DoseLogEntry>,
  now = new Date(),
): TodayDose[] {
  const today = toLocalDateString(now);
  const yesterday = addDays(today, -1);
  const yesterdayPending = getDosesForDate(pills, doseLog, yesterday, now).filter(
    (d) => d.status === 'pending',
  );
  const todayPending = getDosesForDate(pills, doseLog, today, now).filter(
    (d) => d.status === 'pending',
  );
  return [...yesterdayPending, ...todayPending];
}

export function getNextPendingDose(doses: TodayDose[]): TodayDose | null {
  return doses.find((d) => d.status === 'pending') ?? null;
}

export function canEditDosesForDate(dateStr: string, now = new Date()): boolean {
  return dateStr <= toLocalDateString(now);
}

export function monthKeyFromDate(dateStr: string): { year: number; month: number } {
  const d = parseLocalDate(dateStr);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function formatMonthTitle(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Days in month grid including leading/trailing blanks as null. */
export function buildMonthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const startPad = first.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];

  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${year}-${pad2(month + 1)}-${pad2(day)}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Current week Sun→Sat as local YYYY-MM-DD strings. */
export function buildWeekDates(now = new Date()): string[] {
  const today = toLocalDateString(now);
  const weekday = parseLocalDate(today).getDay(); // 0 = Sunday
  const sunday = addDays(today, -weekday);
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}

export const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export function getDayLabels(): { day: Weekday; short: string; long: string }[] {
  return ALL_DAYS.map((day) => ({
    day,
    short: t(`days.short.${day}`),
    long: t(`days.long.${day}`),
  }));
}

/** @deprecated use getDayLabels() for localized labels */
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
  if (duration.type === 'keep') return t('duration.keep');
  if (duration.type === 'until') {
    const d = parseLocalDate(duration.endDate);
    return t('duration.until', {
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    });
  }
  return t('duration.forDays', { count: duration.days });
}

/** offsetMinutes: 0 = on time, negative = minutes before */
export function describeReminderOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return t('reminders.onTime');
  if (offsetMinutes < 0) {
    const mins = Math.abs(offsetMinutes);
    if (mins >= 60 && mins % 60 === 0) {
      return t('reminders.hoursBefore', { count: mins / 60 });
    }
    return t('reminders.minutesBefore', { count: mins });
  }
  const mins = offsetMinutes;
  if (mins >= 60 && mins % 60 === 0) {
    return t('reminders.hoursAfter', { count: mins / 60 });
  }
  return t('reminders.minutesAfter', { count: mins });
}

export function describeReminderOffsets(offsets: number[]): string {
  if (offsets.length === 0) return t('reminders.none');
  return [...offsets]
    .sort((a, b) => a - b)
    .map(describeReminderOffset)
    .join(' · ');
}

export const REMINDER_PRESETS_MINUTES = [0, -5, -10, -15, -30, -60] as const;

export function describeDays(days: Weekday[]): string {
  if (days.length === 7) return t('days.everyDay');
  if (days.length === 0) return t('days.none');
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.map((d) => t(`days.short.${d}`)).join(', ');
}
