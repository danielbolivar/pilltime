export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Local clock time, 24h */
export type ClockTime = {
  hour: number;
  minute: number;
};

export type DurationKeep = { type: 'keep' };
export type DurationUntil = { type: 'until'; endDate: string }; // YYYY-MM-DD
export type DurationDays = { type: 'days'; days: number; startDate: string }; // YYYY-MM-DD
export type PillDuration = DurationKeep | DurationUntil | DurationDays;

export type DoseStatus = 'pending' | 'taken' | 'skipped';

export type Pill = {
  id: string;
  name: string;
  notes?: string;
  times: ClockTime[];
  /** 0 = Sunday … 6 = Saturday (JS Date.getDay()) */
  daysOfWeek: Weekday[];
  duration: PillDuration;
  /** Minutes relative to dose time. Negative = before. Default [-5, 0] */
  reminderOffsetsMinutes: number[];
  notificationIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type DoseLogEntry = {
  key: string; // pillId|YYYY-MM-DD|HH:mm
  pillId: string;
  date: string;
  time: string; // HH:mm
  status: Exclude<DoseStatus, 'pending'>;
  updatedAt: string;
};

export type AppSettings = {
  notificationsEnabled: boolean;
  appearance: 'day' | 'night' | 'highContrast' | 'system';
  language: 'system' | 'en' | 'es';
};

export type TodayDose = {
  key: string;
  pillId: string;
  pillName: string;
  notes?: string;
  date: string;
  time: ClockTime;
  timeLabel: string;
  status: DoseStatus;
  isOverdue: boolean;
  sortMinutes: number;
};

export type PillInput = {
  name: string;
  notes?: string;
  times: ClockTime[];
  daysOfWeek: Weekday[];
  duration: PillDuration;
  reminderOffsetsMinutes: number[];
};
