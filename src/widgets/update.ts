import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { renderWidgetByName, WIDGET_NAMES } from './render';

/** Push latest pill/dose state to all installed home-screen widgets. */
export async function syncHomeWidgets(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await Promise.all([
      requestWidgetUpdate({
        widgetName: WIDGET_NAMES.NextDose,
        renderWidget: () => renderWidgetByName(WIDGET_NAMES.NextDose),
      }),
      requestWidgetUpdate({
        widgetName: WIDGET_NAMES.Today,
        renderWidget: () => renderWidgetByName(WIDGET_NAMES.Today),
      }),
      requestWidgetUpdate({
        widgetName: WIDGET_NAMES.MonthAgenda,
        renderWidget: () => renderWidgetByName(WIDGET_NAMES.MonthAgenda),
      }),
    ]);
  } catch {
    // Widgets require a native build; ignore failures in Expo Go / web.
  }
}
