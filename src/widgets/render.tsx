import React from 'react';
import type { WidgetRepresentation } from 'react-native-android-widget';

import { paletteForAppearance } from './colors';
import { loadWidgetSnapshot, type WidgetSnapshot } from './data';
import { MonthAgendaWidget } from './MonthAgendaWidget';
import { NextDoseWidget } from './NextDoseWidget';
import { TodayWidget } from './TodayWidget';

export const WIDGET_NAMES = {
  NextDose: 'NextDose',
  Today: 'Today',
  MonthAgenda: 'MonthAgenda',
} as const;

export type WidgetName = (typeof WIDGET_NAMES)[keyof typeof WIDGET_NAMES];

function renderWithPalette(name: string, snapshot: WidgetSnapshot, mode: 'light' | 'dark') {
  const colors = paletteForAppearance(snapshot.settings.appearance, mode);

  if (name === WIDGET_NAMES.MonthAgenda) {
    return (
      <MonthAgendaWidget
        colors={colors}
        weekTitle={snapshot.weekTitle}
        todayDate={snapshot.todayDate}
        weekMarks={snapshot.weekMarks}
        upcoming={snapshot.upcoming}
      />
    );
  }

  if (name === WIDGET_NAMES.Today) {
    return (
      <TodayWidget
        colors={colors}
        doses={snapshot.doses}
        pendingCount={snapshot.pendingCount}
        takenCount={snapshot.takenCount}
        totalCount={snapshot.totalCount}
      />
    );
  }

  return (
    <NextDoseWidget
      colors={colors}
      next={snapshot.next}
      totalCount={snapshot.totalCount}
      pendingCount={snapshot.pendingCount}
    />
  );
}

export function buildWidgetRepresentation(
  widgetName: string,
  snapshot: WidgetSnapshot,
): WidgetRepresentation {
  const appearance = snapshot.settings.appearance;

  if (appearance === 'system') {
    return {
      light: renderWithPalette(widgetName, snapshot, 'light'),
      dark: renderWithPalette(widgetName, snapshot, 'dark'),
    };
  }

  const mode = appearance === 'night' ? 'dark' : 'light';
  return renderWithPalette(widgetName, snapshot, mode);
}

export async function renderWidgetByName(widgetName: string): Promise<WidgetRepresentation> {
  const snapshot = await loadWidgetSnapshot();
  return buildWidgetRepresentation(widgetName, snapshot);
}
