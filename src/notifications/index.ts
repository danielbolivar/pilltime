import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  clockToKey,
  listOccurrenceDates,
  parseLocalDate,
  toExpoWeekday,
  toLocalDateString,
} from '@/src/domain/schedule';
import type { ClockTime, Pill } from '@/src/domain/types';

const CHANNEL_ID = 'pilltime-reminders';
const AHEAD_DAYS = 60;

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
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Pill reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1F7A66',
    sound: 'default',
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
  const mins = Math.abs(offsetMinutes);
  return {
    title: early ? `In ${mins} minute${mins === 1 ? '' : 's'}` : 'Time for your pill',
    body: early ? `${pill.name}` : `Time for ${pill.name}`,
    sound: true as const,
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

async function scheduleWeekly(
  pill: Pill,
  time: ClockTime,
  offsetMinutes: number,
): Promise<string[]> {
  const ids: string[] = [];
  const triggerTime = applyOffset(time, offsetMinutes);
  const content = buildContent(pill, offsetMinutes);

  for (const day of pill.daysOfWeek) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(day),
        hour: triggerTime.hour,
        minute: triggerTime.minute,
        channelId: CHANNEL_ID,
      },
    });
    ids.push(id);
  }
  return ids;
}

async function scheduleDatedWindow(
  pill: Pill,
  time: ClockTime,
  offsetMinutes: number,
): Promise<string[]> {
  const ids: string[] = [];
  const today = toLocalDateString();
  const dates = listOccurrenceDates(pill, today, AHEAD_DAYS);
  const content = buildContent(pill, offsetMinutes);
  const now = Date.now();

  for (const dateStr of dates) {
    const base = parseLocalDate(dateStr);
    base.setHours(time.hour, time.minute, 0, 0);
    const fireAt = new Date(base.getTime() + offsetMinutes * 60_000);
    if (fireAt.getTime() <= now) continue;

    const id = await Notifications.scheduleNotificationAsync({
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
    });
    ids.push(id);
  }

  return ids;
}

export async function schedulePillNotifications(pill: Pill): Promise<string[]> {
  await ensureAndroidChannel();

  const ids: string[] = [];

  for (const time of pill.times) {
    for (const offset of pill.reminderOffsetsMinutes) {
      if (pill.duration.type === 'keep') {
        ids.push(...(await scheduleWeekly(pill, time, offset)));
      } else {
        ids.push(...(await scheduleDatedWindow(pill, time, offset)));
      }
    }
  }

  return ids;
}

export function addNotificationResponseListener(
  handler: (pillId?: string) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const pillId = response.notification.request.content.data?.pillId;
    handler(typeof pillId === 'string' ? pillId : undefined);
  });
}
