import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  clockToKey,
  describeReminderOffset,
  listOccurrenceDates,
  parseLocalDate,
  toExpoWeekday,
  toLocalDateString,
} from '@/src/domain/schedule';
import { t } from '@/src/i18n';
import type { ClockTime, Pill } from '@/src/domain/types';

/** Bump id when channel sound settings must change (Android channels are sticky). */
const CHANNEL_ID = 'pilltime-reminders-v2';
/** Keep dated schedules short — Android caps ~500 alarms per app. */
const AHEAD_DAYS = 14;
/** Stay under the OS alarm limit with headroom. */
const MAX_SCHEDULED = 400;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // Omit `sound` so Android uses the system default notification sound.
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: t('notifications.channelName'),
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#C2410C',
  });
}

export async function requestNotificationPermissions(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return { granted: true, canAskAgain: current.canAskAgain };
  }

  if (!current.canAskAgain && current.status === 'denied') {
    return { granted: false, canAskAgain: false };
  }

  const requested = await Notifications.requestPermissionsAsync();
  const granted =
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  return { granted, canAskAgain: requested.canAskAgain };
}

export async function getNotificationPermissionGranted(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function cancelAllAppNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

export async function cancelPillNotifications(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map(async (id) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // already gone
      }
    }),
  );
}

function buildContent(pill: Pill, offsetMinutes: number) {
  const early = offsetMinutes < 0;
  const late = offsetMinutes > 0;
  return {
    title: early || late ? describeReminderOffset(offsetMinutes) : t('notifications.timeForPill'),
    body: early || late ? pill.name : t('notifications.timeForName', { name: pill.name }),
    sound: true,
    data: {
      pillId: pill.id,
      screen: 'today',
    },
    ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
  };
}

function applyOffset(time: ClockTime, offsetMinutes: number): ClockTime {
  const total = time.hour * 60 + time.minute + offsetMinutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60,
  };
}

async function safeSchedule(
  request: Notifications.NotificationRequestInput,
): Promise<string | null> {
  try {
    return await Notifications.scheduleNotificationAsync(request);
  } catch (error) {
    console.warn('Skipped scheduling a reminder:', error);
    return null;
  }
}

type Planned = {
  pillId: string;
  fireAt: number;
  request: Notifications.NotificationRequestInput;
};

function planWeekly(pill: Pill, time: ClockTime, offsetMinutes: number): Planned[] {
  const triggerTime = applyOffset(time, offsetMinutes);
  const content = buildContent(pill, offsetMinutes);
  const now = Date.now();
  // Sort weekly near-term for budgeting — fireAt is next occurrence estimate
  return pill.daysOfWeek.map((day) => {
    const next = nextWeeklyFireDate(day, triggerTime);
    return {
      pillId: pill.id,
      fireAt: Math.max(next.getTime(), now + 1),
      request: {
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: toExpoWeekday(day),
          hour: triggerTime.hour,
          minute: triggerTime.minute,
          channelId: CHANNEL_ID,
        },
      },
    };
  });
}

function nextWeeklyFireDate(day: number, time: ClockTime): Date {
  const now = new Date();
  const result = new Date(now);
  const currentDay = now.getDay();
  let delta = day - currentDay;
  if (
    delta < 0 ||
    (delta === 0 &&
      (now.getHours() > time.hour ||
        (now.getHours() === time.hour && now.getMinutes() >= time.minute)))
  ) {
    delta += 7;
  }
  result.setDate(now.getDate() + delta);
  result.setHours(time.hour, time.minute, 0, 0);
  return result;
}

function planDatedWindow(pill: Pill, time: ClockTime, offsetMinutes: number): Planned[] {
  const today = toLocalDateString();
  const dates = listOccurrenceDates(pill, today, AHEAD_DAYS);
  const content = buildContent(pill, offsetMinutes);
  const now = Date.now();
  const planned: Planned[] = [];

  for (const dateStr of dates) {
    const base = parseLocalDate(dateStr);
    base.setHours(time.hour, time.minute, 0, 0);
    const fireAt = new Date(base.getTime() + offsetMinutes * 60_000);
    if (fireAt.getTime() <= now) continue;

    planned.push({
      pillId: pill.id,
      fireAt: fireAt.getTime(),
      request: {
        content: {
          ...content,
          data: {
            ...content.data,
            date: dateStr,
            time: clockToKey(time),
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
          channelId: CHANNEL_ID,
        },
      },
    });
  }

  return planned;
}

function planPill(pill: Pill): Planned[] {
  const planned: Planned[] = [];
  for (const time of pill.times) {
    for (const offset of pill.reminderOffsetsMinutes) {
      if (pill.duration.type === 'keep') {
        planned.push(...planWeekly(pill, time, offset));
      } else {
        planned.push(...planDatedWindow(pill, time, offset));
      }
    }
  }
  return planned;
}

/**
 * Wipe OS schedules and rebuild under the Android alarm budget.
 * Returns notification ids keyed by pill id.
 */
export async function rebuildAllNotifications(
  pills: Pill[],
): Promise<Record<string, string[]>> {
  await ensureAndroidChannel();
  await cancelAllAppNotifications();

  const planned = pills.flatMap(planPill).sort((a, b) => a.fireAt - b.fireAt);
  const limited = planned.slice(0, MAX_SCHEDULED);
  const byPill: Record<string, string[]> = Object.fromEntries(
    pills.map((pill) => [pill.id, [] as string[]]),
  );

  for (const item of limited) {
    const id = await safeSchedule(item.request);
    if (!id) break;
    byPill[item.pillId] = [...(byPill[item.pillId] ?? []), id];
  }

  return byPill;
}

/** Prefer rebuildAllNotifications — this helper is only for single-pill tests. */
export async function schedulePillNotifications(pill: Pill): Promise<string[]> {
  const map = await rebuildAllNotifications([pill]);
  return map[pill.id] ?? [];
}

export function addNotificationResponseListener(
  handler: (pillId?: string) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const pillId = response.notification.request.content.data?.pillId;
    handler(typeof pillId === 'string' ? pillId : undefined);
  });
}
