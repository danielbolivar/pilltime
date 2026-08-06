import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { TodayDose } from '@/src/domain/types';
import { t } from '@/src/i18n';

import type { WidgetPalette } from './colors';

type Props = {
  colors: WidgetPalette;
  doses: TodayDose[];
  pendingCount: number;
  takenCount: number;
  totalCount: number;
};

function statusLabel(dose: TodayDose): string {
  if (dose.status === 'taken') return t('dose.taken');
  if (dose.status === 'skipped') return t('dose.skipped');
  if (dose.isOverdue) return t('dose.overdue');
  return dose.timeLabel;
}

function statusColor(dose: TodayDose, colors: WidgetPalette): `#${string}` {
  if (dose.status === 'taken') return colors.success;
  if (dose.status === 'skipped') return colors.inkSoft;
  if (dose.isOverdue) return colors.danger;
  return colors.primary;
}

export function TodayWidget({
  colors,
  doses,
  pendingCount,
  takenCount,
  totalCount,
}: Props) {
  const headline =
    totalCount === 0
      ? t('widgets.noPills')
      : pendingCount === 0
        ? t('widgets.allDone')
        : t('widgets.todayTitle');

  const summary =
    totalCount === 0
      ? t('widgets.addAPill')
      : t('widgets.summary', { taken: takenCount, total: totalCount });

  const rows = doses.slice(0, 4);

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={`${headline}. ${summary}`}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.bg,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: colors.border,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flexGap: 8,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={headline}
          style={{
            fontSize: 18,
            fontWeight: '800',
            color: colors.ink,
          }}
        />
        <TextWidget
          text={summary}
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.inkSoft,
          }}
        />
      </FlexWidget>

      {rows.length === 0 ? (
        <TextWidget
          text={t('widgets.emptyToday')}
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.inkSoft,
          }}
        />
      ) : (
        rows.map((dose) => (
          <FlexWidget
            key={dose.key}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: 'match_parent',
              backgroundColor: dose.isOverdue && dose.status === 'pending'
                ? colors.dangerSoft
                : colors.bgMuted,
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
              <TextWidget
                text={dose.pillName}
                truncate="END"
                maxLines={1}
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.ink,
                }}
              />
              <TextWidget
                text={dose.timeLabel}
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.inkSoft,
                }}
              />
            </FlexWidget>
            <TextWidget
              text={statusLabel(dose)}
              style={{
                fontSize: 14,
                fontWeight: '800',
                color: statusColor(dose, colors),
              }}
            />
          </FlexWidget>
        ))
      )}

      {doses.length > 4 ? (
        <TextWidget
          text={t('widgets.more', { count: doses.length - 4 })}
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.inkSoft,
          }}
        />
      ) : null}
    </FlexWidget>
  );
}
