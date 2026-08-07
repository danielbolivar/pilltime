import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createId,
  doseLogKey,
  getDosesForDate,
  getTodayDoses as computeTodayDoses,
  toLocalDateString,
  addDays,
} from '@/src/domain/schedule';
import type {
  AppSettings,
  DoseLogEntry,
  Pill,
  PillInput,
  TodayDose,
} from '@/src/domain/types';
import {
  cancelAllAppNotifications,
  rebuildAllNotifications,
  requestNotificationPermissions,
} from '@/src/notifications';
import { syncHomeWidgets } from '@/src/widgets/update';

type PillStore = {
  pills: Pill[];
  doseLog: Record<string, DoseLogEntry>;
  settings: AppSettings;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  addPill: (input: PillInput) => Promise<Pill>;
  updatePill: (id: string, input: PillInput) => Promise<Pill | null>;
  deletePill: (id: string) => Promise<void>;
  setDoseStatus: (
    pillId: string,
    date: string,
    timeKey: string,
    status: 'taken' | 'skipped',
  ) => void;
  clearDoseStatus: (pillId: string, date: string, timeKey: string) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  getTodayDoses: (now?: Date) => TodayDose[];
  resyncAllNotifications: () => Promise<void>;
};

async function applyNotificationIds(
  set: (fn: (state: PillStore) => Partial<PillStore>) => void,
  get: () => PillStore,
) {
  const permission = await requestNotificationPermissions();
  if (!permission.granted) {
    await cancelAllAppNotifications();
    set((state) => ({
      settings: { ...state.settings, notificationsEnabled: false },
      pills: state.pills.map((pill) => ({ ...pill, notificationIds: [] })),
    }));
    return;
  }

  const idsByPill = await rebuildAllNotifications(get().pills);
  set((state) => ({
    settings: { ...state.settings, notificationsEnabled: true },
    pills: state.pills.map((pill) => ({
      ...pill,
      notificationIds: idsByPill[pill.id] ?? [],
    })),
  }));
}

const defaultSettings: AppSettings = {
  notificationsEnabled: false,
  appearance: 'day',
  language: 'system',
};

export const usePillStore = create<PillStore>()(
  persist(
    (set, get) => ({
      pills: [],
      doseLog: {},
      settings: defaultSettings,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),

      addPill: async (input) => {
        const now = new Date().toISOString();
        const pill: Pill = {
          id: createId(),
          name: input.name.trim(),
          notes: input.notes?.trim() || undefined,
          times: input.times,
          daysOfWeek: [...input.daysOfWeek].sort((a, b) => a - b) as Pill['daysOfWeek'],
          duration: input.duration,
          reminderOffsetsMinutes: [...input.reminderOffsetsMinutes].sort((a, b) => a - b),
          notificationIds: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({ pills: [...state.pills, pill] }));
        await applyNotificationIds(set, get);
        void syncHomeWidgets();
        return get().pills.find((p) => p.id === pill.id) ?? pill;
      },

      updatePill: async (id, input) => {
        const existing = get().pills.find((p) => p.id === id);
        if (!existing) return null;

        const updated: Pill = {
          ...existing,
          name: input.name.trim(),
          notes: input.notes?.trim() || undefined,
          times: input.times,
          daysOfWeek: [...input.daysOfWeek].sort((a, b) => a - b) as Pill['daysOfWeek'],
          duration: input.duration,
          reminderOffsetsMinutes: [...input.reminderOffsetsMinutes].sort((a, b) => a - b),
          updatedAt: new Date().toISOString(),
          notificationIds: [],
        };

        set((state) => ({
          pills: state.pills.map((p) => (p.id === id ? updated : p)),
        }));
        await applyNotificationIds(set, get);
        void syncHomeWidgets();
        return get().pills.find((p) => p.id === id) ?? updated;
      },

      deletePill: async (id) => {
        set((state) => {
          const nextLog = { ...state.doseLog };
          for (const key of Object.keys(nextLog)) {
            if (key.startsWith(`${id}|`)) {
              delete nextLog[key];
            }
          }
          return {
            pills: state.pills.filter((p) => p.id !== id),
            doseLog: nextLog,
          };
        });
        await applyNotificationIds(set, get);
        void syncHomeWidgets();
      },

      setDoseStatus: (pillId, date, timeKey, status) => {
        const key = doseLogKey(pillId, date, timeKey);
        const entry: DoseLogEntry = {
          key,
          pillId,
          date,
          time: timeKey,
          status,
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          doseLog: { ...state.doseLog, [key]: entry },
        }));
        void syncHomeWidgets();
      },

      clearDoseStatus: (pillId, date, timeKey) => {
        const key = doseLogKey(pillId, date, timeKey);
        set((state) => {
          const next = { ...state.doseLog };
          delete next[key];
          return { doseLog: next };
        });
        void syncHomeWidgets();
      },

      updateSettings: (partial) => {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }));
        void syncHomeWidgets();
      },

      getTodayDoses: (now = new Date()) => {
        const { pills, doseLog } = get();
        return computeTodayDoses(pills, doseLog, now);
      },

      resyncAllNotifications: async () => {
        await applyNotificationIds(set, get);
      },
    }),
    {
      name: 'pilltime-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pills: state.pills,
        doseLog: state.doseLog,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.settings = { ...defaultSettings, ...state.settings };
          state.setHydrated(true);
        }
      },
    },
  ),
);

export function useTodayDoses(now?: Date): TodayDose[] {
  const pills = usePillStore((s) => s.pills);
  const doseLog = usePillStore((s) => s.doseLog);
  return computeTodayDoses(pills, doseLog, now ?? new Date());
}

export function useDosesForDate(dateStr: string, now?: Date): TodayDose[] {
  const pills = usePillStore((s) => s.pills);
  const doseLog = usePillStore((s) => s.doseLog);
  return getDosesForDate(pills, doseLog, dateStr, now ?? new Date());
}

export function useHomeWindowDoses(now?: Date): {
  yesterday: TodayDose[];
  today: TodayDose[];
  yesterdayDate: string;
  todayDate: string;
} {
  const pills = usePillStore((s) => s.pills);
  const doseLog = usePillStore((s) => s.doseLog);
  const current = now ?? new Date();
  const todayDate = toLocalDateString(current);
  const yesterdayDate = addDays(todayDate, -1);
  return {
    yesterday: getDosesForDate(pills, doseLog, yesterdayDate, current),
    today: getDosesForDate(pills, doseLog, todayDate, current),
    yesterdayDate,
    todayDate,
  };
}

export { toLocalDateString };
