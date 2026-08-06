import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getNextPendingDose,
  getTodayDoses,
} from '@/src/domain/schedule';
import type {
  AppSettings,
  DoseLogEntry,
  Pill,
  TodayDose,
} from '@/src/domain/types';
import { applyLanguage } from '@/src/i18n';

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

export type WidgetSnapshot = {
  pills: Pill[];
  doseLog: Record<string, DoseLogEntry>;
  settings: AppSettings;
  doses: TodayDose[];
  next: TodayDose | null;
  pendingCount: number;
  takenCount: number;
  totalCount: number;
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

  const doses = getTodayDoses(pills, doseLog, now);
  const next = getNextPendingDose(doses);
  const pendingCount = doses.filter((d) => d.status === 'pending').length;
  const takenCount = doses.filter((d) => d.status === 'taken').length;

  return {
    pills,
    doseLog,
    settings,
    doses,
    next,
    pendingCount,
    takenCount,
    totalCount: doses.length,
  };
}
