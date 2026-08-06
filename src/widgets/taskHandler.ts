import type { WidgetTaskHandler } from 'react-native-android-widget';

import { renderWidgetByName } from './render';

export const widgetTaskHandler: WidgetTaskHandler = async ({
  widgetAction,
  widgetInfo,
  renderWidget,
}) => {
  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      renderWidget(await renderWidgetByName(widgetInfo.widgetName));
      break;
    case 'WIDGET_DELETED':
      break;
    case 'WIDGET_CLICK':
      // OPEN_APP is handled natively; custom clicks would land here.
      renderWidget(await renderWidgetByName(widgetInfo.widgetName));
      break;
    default:
      break;
  }
};
