import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  buildWeekDates,
  getDayDoseSummary,
  getHomeWindowPendingDoses,
  getNextPendingDose,
  getTodayDoses,
  toLocalDateString,
  type DayDoseSummary,
} from '@/src/domain/schedule';
import type {
  AppSettings,
  DoseLogEntry,
  Pill,
  TodayDose,
} from '@/src/domain/types';
import { applyLanguage, t } from '@/src/i18n';

const STORE_KEY = 'pilltime-store';

type PersistedSlice = {
  pills: Pill[];
  doseLog: Record<string, DoseLogEntry>;
  settings: AppSettings;
};

const defaultSettings: AppSettings = {
  notificationsEnabled: false,
  appearance: 'day',
  language: 'system',
};

export type WeekDayMark = {
  date: string;
  dayNum: number;
  weekdayShort: string;
  summary: DayDoseSummary;
};

export type WidgetSnapshot = {
  pills: Pill[];
  doseLog: Record<string, DoseLogEntry>;
  settings: AppSettings;
  doses: TodayDose[];
  next: TodayDose | null;
  pendingCount: number;
  takenCount: number;
  totalCount: number;
  upcoming: TodayDose[];
  weekMarks: WeekDayMark[];
  weekTitle: string;
  todayDate: string;
};

export async function loadWidgetSnapshot(now = new Date()): Promise<WidgetSnapshot> {
  const raw = await AsyncStorage.getItem(STORE_KEY);
  let pills: Pill[] = [];
  let doseLog: Record<string, DoseLogEntry> = {};
  let settings = defaultSettings;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { state?: PersistedSlice } | PersistedSlice;
      const state = 'state' in parsed && parsed.state ? parsed.state : (parsed as PersistedSlice);
      pills = state.pills ?? [];
      doseLog = state.doseLog ?? {};
      settings = { ...defaultSettings, ...state.settings };
    } catch {
      // keep defaults
    }
  }

  applyLanguage(settings.language);

  const todayDate = toLocalDateString(now);
  const doses = getTodayDoses(pills, doseLog, now);
  const upcoming = getHomeWindowPendingDoses(pills, doseLog, now);
  const next = getNextPendingDose(upcoming) ?? getNextPendingDose(doses);
  const pendingCount = doses.filter((d) => d.status === 'pending').length;
  const takenCount = doses.filter((d) => d.status === 'taken').length;

  const weekDates = buildWeekDates(now);
  const weekMarks: WeekDayMark[] = weekDates.map((date, index) => ({
    date,
    dayNum: Number(date.slice(-2)),
    weekdayShort: t(`days.short.${index}`),
    summary: getDayDoseSummary(pills, doseLog, date, now),
  }));

  return {
    pills,
    doseLog,
    settings,
    doses,
    next,
    pendingCount,
    takenCount,
    totalCount: doses.length,
    upcoming,
    weekMarks,
    weekTitle: t('widgets.weekTitle'),
    todayDate,
  };
}
