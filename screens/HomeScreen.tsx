import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { AnimatedNumber } from '../components/AnimatedNumber';
import { AttendanceCalendar } from '../components/AttendanceCalendar';
import { DayStatusModal } from '../components/DayStatusModal';
import { StatCard } from '../components/StatCard';
import { AppCard } from '../components/ui/AppCard';
import { useAttendance } from '../contexts/AttendanceContext';
import { addMonths, toDateKey } from '../utils/date';
import { getTheme, isDarkResolved, palette } from '../utils/theme';

export const HomeScreen: React.FC = () => {
  const { records, setManualStatus, clearStatus, getMonthlyStats, settings, refresh } = useAttendance();
  const systemScheme = useColorScheme();
  const theme = getTheme(isDarkResolved(settings.themeMode, systemScheme));
  const currentMonth = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), []);
  const minMonth = useMemo(() => addMonths(currentMonth, -24), [currentMonth]);
  const maxMonth = useMemo(() => addMonths(currentMonth, 24), [currentMonth]);
  const [month, setMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onPullToRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const stats = getMonthlyStats(month);
  const percentageColor =
    stats.attendancePercent >= 60
      ? palette.present
      : stats.attendancePercent >= 40
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
      <Animated.View entering={FadeInDown.duration(260)}>
        <AppCard theme={theme} style={styles.percentCard}>
          <Pressable style={styles.infoButton} onPress={() => setShowFormulaModal(true)}>
            <Ionicons name="information-circle-outline" size={18} color={theme.mutedText} />
          </Pressable>
          <Text style={[styles.percentLabel, { color: theme.mutedText }]}>Monthly Attendance</Text>
          <AnimatedNumber value={stats.attendancePercent} suffix="%" color={percentageColor} />
        </AppCard>
      </Animated.View>

      <View style={styles.statsRow}>
        <StatCard label="Present" value={stats.present} color={palette.present} theme={theme} />
        <StatCard label="WFH" value={stats.wfh} color={palette.wfh} theme={theme} />
        <StatCard label="Leave" value={stats.leave} color={palette.leave} theme={theme} />
      </View>

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
        transparent
        visible={showFormulaModal}
        animationType="fade"
        onRequestClose={() => setShowFormulaModal(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          onPress={() => setShowFormulaModal(false)}
        >
          <View style={[styles.infoModal, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>Attendance Formula</Text>
            <Text style={[styles.infoText, { color: theme.mutedText }]}>
              Attendance % = Present / (Working days excluding weekends and leave)
            </Text>
          </View>
        </Pressable>
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
    paddingBottom: 28,
    gap: 16,
  },
  percentCard: {
    paddingVertical: 20,
    alignItems: 'center',
    position: 'relative',
  },
  percentLabel: {
    color: palette.mutedText,
    fontSize: 14,
  },
  infoButton: {
    position: 'absolute',
    right: 14,
    top: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModal: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
