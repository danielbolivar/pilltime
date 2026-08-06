import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createId,
  doseLogKey,
  getTodayDoses as computeTodayDoses,
  toLocalDateString,
} from '@/src/domain/schedule';
import type {
  AppSettings,
  DoseLogEntry,
  Pill,
  PillInput,
  TodayDose,
} from '@/src/domain/types';
import {
  cancelPillNotifications,
  requestNotificationPermissions,
  schedulePillNotifications,
} from '@/src/notifications';

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

const defaultSettings: AppSettings = {
  defaultReminderOffsetsMinutes: [-5, 0],
  notificationsEnabled: false,
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

        const permission = await requestNotificationPermissions();
        const notificationIds = permission.granted
          ? await schedulePillNotifications(pill)
          : [];

        const saved = { ...pill, notificationIds };
        set((state) => ({
          pills: [...state.pills, saved],
          settings: {
            ...state.settings,
            notificationsEnabled: permission.granted || state.settings.notificationsEnabled,
          },
        }));
        return saved;
      },

      updatePill: async (id, input) => {
        const existing = get().pills.find((p) => p.id === id);
        if (!existing) return null;

        await cancelPillNotifications(existing.notificationIds);

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

        const permission = await requestNotificationPermissions();
        const notificationIds = permission.granted
          ? await schedulePillNotifications(updated)
          : [];

        const saved = { ...updated, notificationIds };
        set((state) => ({
          pills: state.pills.map((p) => (p.id === id ? saved : p)),
          settings: {
            ...state.settings,
            notificationsEnabled: permission.granted || state.settings.notificationsEnabled,
          },
        }));
        return saved;
      },

      deletePill: async (id) => {
        const existing = get().pills.find((p) => p.id === id);
        if (existing) {
          await cancelPillNotifications(existing.notificationIds);
        }
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
      },

      clearDoseStatus: (pillId, date, timeKey) => {
        const key = doseLogKey(pillId, date, timeKey);
        set((state) => {
          const next = { ...state.doseLog };
          delete next[key];
          return { doseLog: next };
        });
      },

      updateSettings: (partial) => {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }));
      },

      getTodayDoses: (now = new Date()) => {
        const { pills, doseLog } = get();
        return computeTodayDoses(pills, doseLog, now);
      },

      resyncAllNotifications: async () => {
        const { pills } = get();
        const permission = await requestNotificationPermissions();
        if (!permission.granted) {
          set((state) => ({
            settings: { ...state.settings, notificationsEnabled: false },
          }));
          return;
        }

        const nextPills: Pill[] = [];
        for (const pill of pills) {
          await cancelPillNotifications(pill.notificationIds);
          const notificationIds = await schedulePillNotifications(pill);
          nextPills.push({ ...pill, notificationIds });
        }
        set((state) => ({
          pills: nextPills,
          settings: { ...state.settings, notificationsEnabled: true },
        }));
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
        state?.setHydrated(true);
      },
    },
  ),
);

export function useTodayDoses(now?: Date): TodayDose[] {
  const pills = usePillStore((s) => s.pills);
  const doseLog = usePillStore((s) => s.doseLog);
  return computeTodayDoses(pills, doseLog, now ?? new Date());
}

export { toLocalDateString };
