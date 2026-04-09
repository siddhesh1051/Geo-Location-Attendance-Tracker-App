import React, { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';

import { AttendanceCalendar } from '../components/AttendanceCalendar';
import { DayStatusModal } from '../components/DayStatusModal';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { useAttendance } from '../contexts/AttendanceContext';
import { addMonths, eachDay, isWeekend, toDateKey } from '../utils/date';
import { getTheme, isDarkResolved, palette } from '../utils/theme';

export const CalendarScreen: React.FC = () => {
  const { records, setManualStatus, clearStatus, settings, refresh } = useAttendance();
  const systemScheme = useColorScheme();
  const theme = getTheme(isDarkResolved(settings.themeMode, systemScheme));
  const currentMonth = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), []);
  const minMonth = useMemo(() => addMonths(currentMonth, -24), [currentMonth]);
  const maxMonth = useMemo(() => addMonths(currentMonth, 24), [currentMonth]);
  const [month, setMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startDateInput, setStartDateInput] = useState(`${new Date().getFullYear()}-01-01`);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onPullToRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const overallStats = useMemo(() => {
    const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDateInput);
    if (!parsed) return { valid: false, present: 0, wfh: 0, leave: 0, denominator: 0, percent: 0 };
    const start = new Date(Number(parsed[1]), Number(parsed[2]) - 1, Number(parsed[3]));
    const isValidDate = !Number.isNaN(start.getTime());
    if (!isValidDate) return { valid: false, present: 0, wfh: 0, leave: 0, denominator: 0, percent: 0 };

    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (start > end) return { valid: false, present: 0, wfh: 0, leave: 0, denominator: 0, percent: 0 };

    const days = eachDay(start, end);
    const summary = days.reduce(
      (acc, day) => {
        if (isWeekend(day)) return acc;
        const key = toDateKey(day);
        const status = records[key]?.status;
        if (status === 'leave') acc.leave += 1;
        else if (status === 'wfh') acc.wfh += 1;
        else if (status === 'present') acc.present += 1;
        acc.workingDays += 1;
        return acc;
      },
      { present: 0, wfh: 0, leave: 0, workingDays: 0 }
    );
    const denominator = Math.max(summary.workingDays - summary.leave, 0);
    const percent = denominator === 0 ? 0 : Math.round((summary.present / denominator) * 100);
    return { valid: true, ...summary, denominator, percent };
  }, [records, startDateInput]);

  const percentColor =
    overallStats.percent >= 60
      ? palette.present
      : overallStats.percent >= 40
        ? palette.wfh
        : palette.leave;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onPullToRefresh}
          tintColor={theme.text}
        />
      }
    >
      <AppCard theme={theme}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Overall Attendance (Till Date)</Text>
        <Text style={[styles.helpText, { color: theme.mutedText }]}>
          Enter your attendance start date (YYYY-MM-DD)
        </Text>
        <View style={styles.startDateRow}>
          <TextInput
            style={[
              styles.startDateInput,
              {
                borderColor: theme.border,
                backgroundColor: theme.inputBackground,
                color: theme.text,
              },
            ]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.mutedText}
            value={startDateInput}
            onChangeText={setStartDateInput}
          />
          <AppButton
            theme={theme}
            variant="ghost"
            onPress={() => {
              const today = new Date();
              setStartDateInput(`${today.getFullYear()}-01-01`);
              Alert.alert('Start date set', 'Using 1st Jan of current year.');
            }}
            style={styles.quickBtn}
          >
            This Year
          </AppButton>
        </View>

        {overallStats.valid ? (
          <>
            <Text style={[styles.percentText, { color: percentColor }]}>{overallStats.percent}%</Text>
            <Text style={[styles.statsText, { color: theme.mutedText }]}>
              Present {overallStats.present}  |  WFH {overallStats.wfh}  |  Leave {overallStats.leave}
            </Text>
          </>
        ) : (
          <Text style={[styles.invalidText, { color: palette.leave }]}>
            Invalid start date. Use format YYYY-MM-DD and keep it before today.
          </Text>
        )}
      </AppCard>

      <AttendanceCalendar
        month={month}
        minMonth={minMonth}
        maxMonth={maxMonth}
        records={records}
        theme={theme}
        onMonthChange={setMonth}
        onDayPress={setSelectedDate}
      />

      <DayStatusModal
        visible={!!selectedDate}
        dateLabel={selectedDate ? selectedDate.toDateString() : ''}
        theme={theme}
        currentStatus={
          selectedDate
            ? (records[toDateKey(selectedDate)]?.status ?? 'unset')
            : 'unset'
        }
        onClose={() => setSelectedDate(null)}
        onSelect={async (status) => {
          if (!selectedDate) return;
          await setManualStatus(toDateKey(selectedDate), status);
          setSelectedDate(null);
        }}
        onReset={async () => {
          if (!selectedDate) return;
          await clearStatus(toDateKey(selectedDate));
          setSelectedDate(null);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  helpText: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 12,
  },
  startDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startDateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
  },
  quickBtn: {
    paddingHorizontal: 10,
  },
  percentText: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: '800',
  },
  statsText: {
    marginTop: 4,
    fontSize: 12,
  },
  invalidText: {
    marginTop: 10,
    fontSize: 12,
  },
});
