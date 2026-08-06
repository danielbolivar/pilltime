import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { TodayDose } from '@/src/domain/types';
import { t } from '@/src/i18n';

import type { WidgetPalette } from './colors';

type Props = {
  colors: WidgetPalette;
  next: TodayDose | null;
  totalCount: number;
  pendingCount: number;
};

export function NextDoseWidget({ colors, next, totalCount, pendingCount }: Props) {
  const title = next
    ? t('widgets.nextUp')
    : totalCount === 0
      ? t('widgets.noPills')
      : t('widgets.allDone');

  const name = next?.pillName ?? (totalCount === 0 ? t('widgets.addAPill') : t('widgets.nothingPending'));
  const time = next?.timeLabel ?? '';
  const overdue = next?.isOverdue === true;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={
        next
          ? `${title}: ${name}, ${time}`
          : title
      }
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: overdue ? colors.dangerSoft : colors.bg,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: overdue ? colors.danger : colors.border,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <TextWidget
        text={title}
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: overdue ? colors.danger : colors.primary,
        }}
      />
      <FlexWidget style={{ flexDirection: 'column', flexGap: 2 }}>
        <TextWidget
          text={name}
          truncate="END"
          maxLines={2}
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: colors.ink,
          }}
        />
        {time ? (
          <TextWidget
            text={time}
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: overdue ? colors.danger : colors.inkSoft,
            }}
          />
        ) : null}
      </FlexWidget>
      {pendingCount > 0 ? (
        <TextWidget
          text={t('widgets.leftToday', { count: pendingCount })}
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.inkSoft,
          }}
        />
      ) : (
        <TextWidget
          text=" "
          style={{ fontSize: 13, color: colors.bg }}
        />
      )}
    </FlexWidget>
  );
}
