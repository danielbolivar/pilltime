import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { TodayDose } from '@/src/domain/types';
import { t } from '@/src/i18n';

import type { WidgetPalette } from './colors';
import type { WeekDayMark } from './data';

type Props = {
  colors: WidgetPalette;
  weekTitle: string;
  todayDate: string;
  weekMarks: WeekDayMark[];
  upcoming: TodayDose[];
};

function markColor(mark: WeekDayMark, colors: WidgetPalette): `#${string}` | null {
  const s = mark.summary;
  if (s.scheduled === 0) return null;
  if (s.pending > 0) return colors.danger;
  if (s.taken === s.scheduled) return colors.success;
  return colors.inkSoft;
}

export function MonthAgendaWidget({
  colors,
  weekTitle,
  todayDate,
  weekMarks,
  upcoming,
}: Props) {
  const nextRows = upcoming.slice(0, 3);

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={`${weekTitle}. ${t('widgets.upcoming')}`}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.bg,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: colors.border,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flexGap: 8,
      }}
    >
      <TextWidget
        text={weekTitle}
        style={{
          fontSize: 16,
          fontWeight: '800',
          color: colors.ink,
        }}
      />

      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
        }}
      >
        {weekMarks.map((cell) => {
          const tone = markColor(cell, colors);
          const isToday = cell.date === todayDate;
          return (
            <FlexWidget
              key={cell.date}
              style={{
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                flexGap: 2,
              }}
            >
              <TextWidget
                text={cell.weekdayShort}
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.inkSoft,
                }}
              />
              <FlexWidget
                style={{
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isToday ? colors.primarySoft : colors.bgMuted,
                  borderRadius: 8,
                  borderWidth: isToday ? 2 : 0,
                  borderColor: colors.primary,
                }}
              >
                <TextWidget
                  text={String(cell.dayNum)}
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: tone ?? colors.ink,
                  }}
                />
              </FlexWidget>
            </FlexWidget>
          );
        })}
      </FlexWidget>

      <TextWidget
        text={t('widgets.upcoming')}
        style={{
          fontSize: 14,
          fontWeight: '800',
          color: colors.primary,
        }}
      />

      {nextRows.length === 0 ? (
        <TextWidget
          text={t('widgets.nothingPending')}
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.inkSoft,
          }}
        />
      ) : (
        nextRows.map((dose) => (
          <FlexWidget
            key={dose.key}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 'match_parent',
              backgroundColor: dose.isOverdue ? colors.dangerSoft : colors.bgMuted,
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 6,
            }}
          >
            <TextWidget
              text={dose.pillName}
              truncate="END"
              maxLines={1}
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.ink,
              }}
            />
            <TextWidget
              text={dose.timeLabel}
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: dose.isOverdue ? colors.danger : colors.inkSoft,
              }}
            />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
