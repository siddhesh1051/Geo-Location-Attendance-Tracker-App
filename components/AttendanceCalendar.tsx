import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { eachDay, getTodayISTKey, isNonWorkingDay, monthEnd, monthStart, toDateKey } from '../utils/date';
import { getStatusColor, ThemePalette } from '../utils/theme';
import { AttendanceMap } from '../utils/types';
import { AppCard } from './ui/AppCard';

type Props = {
  month: Date;
  minMonth: Date;
  maxMonth: Date;
  records: AttendanceMap;
  theme: ThemePalette;
  onMonthChange: (month: Date) => void;
  onDayPress: (date: Date) => void;
};

export const AttendanceCalendar: React.FC<Props> = ({
  month,
  minMonth,
  maxMonth,
  records,
  theme,
  onMonthChange,
  onDayPress,
}) => {
  const start = useMemo(() => monthStart(month), [month]);
  const end = useMemo(() => monthEnd(month), [month]);
  const days = useMemo(() => eachDay(start, end), [start, end]);
  const todayISTKey = getTodayISTKey();

  const markedDates = useMemo(() => {
    const entries: Record<
      string,
      {
        disableTouchEvent?: boolean;
        customStyles: { container: object; text: object };
      }
    > = {};
    days.forEach((date) => {
      const key = toDateKey(date);
      const record = records[key];
      const nonWorkingDay = isNonWorkingDay(date);
      const isFutureInIST = key > todayISTKey;
      const isTodayInIST = key === todayISTKey;
      const isDisabled = isFutureInIST || nonWorkingDay;
      const resolvedStatus = nonWorkingDay
        ? 'weekend'
        : (record?.status ?? (!isFutureInIST ? 'unset' : undefined));
      const color = getStatusColor(resolvedStatus, theme);
      const hasExplicitStatus =
        !!record && (record.status === 'present' || record.status === 'wfh' || record.status === 'leave' || record.status === 'unset');

      const todayContainerStyle = isTodayInIST
        ? hasExplicitStatus
          ? {
              backgroundColor: color,
              borderColor: color,
              borderWidth: 2,
            }
          : {
              // Today defaults to "unset" styling if no explicit record exists.
              backgroundColor: `${theme.unset}33`,
              borderColor: theme.unset,
              borderWidth: 2,
            }
        : {};

      const todayTextColor =
        isTodayInIST && hasExplicitStatus
          ? resolvedStatus === 'wfh'
            ? '#111111'
            : '#FFFFFF'
          : isTodayInIST && !hasExplicitStatus
            ? theme.text
            : isDisabled
              ? theme.mutedText
              : theme.text;

      entries[key] = {
        disableTouchEvent: isDisabled,
        customStyles: {
          container: {
            backgroundColor: `${color}22`,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isTodayInIST ? theme.present : `${color}66`,
            borderStyle: 'solid',
            ...todayContainerStyle,
          },
          text: {
            color: todayTextColor,
            fontWeight: '600',
          },
        },
      };
    });
    return entries;
  }, [days, records, theme, todayISTKey]);

  return (
    <Animated.View entering={FadeInDown.duration(260)}>
      <AppCard theme={theme} style={styles.wrapper}>
        <Calendar
          key={`${theme.background}-${theme.text}`}
          current={toDateKey(start)}
          minDate={toDateKey(minMonth)}
          maxDate={toDateKey(new Date(maxMonth.getFullYear(), maxMonth.getMonth() + 1, 0))}
          onMonthChange={(d) => onMonthChange(new Date(d.year, d.month - 1, 1))}
          onDayPress={(d) => {
            const key = `${d.year}-${`${d.month}`.padStart(2, '0')}-${`${d.day}`.padStart(2, '0')}`;
            const day = new Date(d.year, d.month - 1, d.day);
            const nonWorkingDay = isNonWorkingDay(day);
            if (key > todayISTKey || nonWorkingDay) return;
            onDayPress(new Date(d.year, d.month - 1, d.day));
          }}
          markedDates={markedDates}
          markingType="custom"
          enableSwipeMonths
          hideExtraDays
          firstDay={0}
          disableAllTouchEventsForDisabledDays
          theme={{
            backgroundColor: theme.card,
            calendarBackground: theme.card,
            textSectionTitleColor: theme.mutedText,
            monthTextColor: theme.text,
            dayTextColor: theme.text,
            arrowColor: theme.text,
            indicatorColor: theme.text,
            todayTextColor: theme.present,
            textDisabledColor: theme.mutedText,
            selectedDayBackgroundColor: `${theme.present}33`,
            selectedDayTextColor: theme.text,
          }}
          renderHeader={(date) => (
            <View style={styles.headerWrap}>
              <Text style={[styles.headerLabel, { color: theme.text }]}>
                {date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Text>
            </View>
          )}
        />
      </AppCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    padding: 10,
  },
  headerWrap: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
});
