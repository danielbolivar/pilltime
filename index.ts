import '@/src/i18n';
import './src/theme/unistyles';

import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from '@/src/widgets/taskHandler';

registerWidgetTaskHandler(widgetTaskHandler);

import 'expo-router/entry';
