import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { AttendanceCalendar } from '../components/AttendanceCalendar';
import { DayStatusModal } from '../components/DayStatusModal';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { useAttendance } from '../contexts/AttendanceContext';
import { addMonths, eachDay, isNonWorkingDay, toDateKey } from '../utils/date';
import { getTheme, isDarkResolved, palette } from '../utils/theme';

const formatDateDDMMYYYY = (date: Date): string => {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const parseDDMMYYYY = (value: string): Date | null => {
  const parsed = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!parsed) return null;
  const day = Number(parsed[1]);
  const month = Number(parsed[2]);
  const year = Number(parsed[3]);
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

export const CalendarScreen: React.FC = () => {
  const { records, setManualStatus, clearStatus, settings, refresh, lastRefreshedAt } = useAttendance();
  const systemScheme = useColorScheme();
  const theme = getTheme(isDarkResolved(settings.themeMode, systemScheme));
  const currentMonth = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), []);
  const minMonth = useMemo(() => addMonths(currentMonth, -24), [currentMonth]);
  const maxMonth = useMemo(() => addMonths(currentMonth, 24), [currentMonth]);
  const [month, setMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startDateInput, setStartDateInput] = useState(`01-01-${new Date().getFullYear()}`);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
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
    const start = parseDDMMYYYY(startDateInput);
    if (!start) return { valid: false, present: 0, wfh: 0, leave: 0, denominator: 0, percent: 0 };

    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (start > end) return { valid: false, present: 0, wfh: 0, leave: 0, denominator: 0, percent: 0 };

    const days = eachDay(start, end);
    const summary = days.reduce(
      (acc, day) => {
        if (isNonWorkingDay(day)) return acc;
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

  const startDateMarked = useMemo(() => {
    const selectedDate = parseDDMMYYYY(startDateInput);
    if (!selectedDate) return {};
    const key = toDateKey(selectedDate);
    return {
      [key]: {
        selected: true,
        selectedColor: `${theme.present}33`,
        selectedTextColor: theme.text,
      },
    };
  }, [startDateInput, theme.present, theme.text]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      alwaysBounceVertical
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
        <Text style={[styles.syncText, { color: theme.mutedText }]}>
          Last updated: {lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleTimeString() : '-'}
        </Text>
        <Text style={[styles.helpText, { color: theme.mutedText }]}>
          Enter your attendance start date (DD-MM-YYYY)
        </Text>
        <View style={styles.startDateRow}>
          <Pressable
            onPress={() => setShowStartDatePicker(true)}
            style={[
              styles.startDateInput,
              {
                borderColor: theme.border,
                backgroundColor: theme.inputBackground,
              },
            ]}
          >
            <Text style={{ color: theme.text }}>{startDateInput}</Text>
          </Pressable>
          <AppButton
            theme={theme}
            variant="ghost"
            onPress={() => {
              const today = new Date();
              setStartDateInput(`01-01-${today.getFullYear()}`);
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
            Invalid start date. Use format DD-MM-YYYY and keep it before today.
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

      <Modal
        visible={showStartDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStartDatePicker(false)}
      >
        <View style={[styles.pickerOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.pickerSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>Select start date</Text>
            <Calendar
              current={toDateKey(parseDDMMYYYY(startDateInput) ?? new Date())}
              maxDate={toDateKey(new Date())}
              markedDates={startDateMarked}
              onDayPress={(d) => {
                const selected = new Date(d.year, d.month - 1, d.day);
                setStartDateInput(formatDateDDMMYYYY(selected));
                setShowStartDatePicker(false);
              }}
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
              }}
            />
            <View style={styles.pickerActions}>
              <AppButton theme={theme} variant="ghost" onPress={() => setShowStartDatePicker(false)}>
                Cancel
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>
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
  syncText: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 12,
  },
  helpText: {
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
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
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
  pickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  pickerSheet: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  pickerActions: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
});
