import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemePalette, palette } from '../utils/theme';
import { AttendanceStatus } from '../utils/types';

type Props = {
  visible: boolean;
  dateLabel: string;
  theme: ThemePalette;
  currentStatus: AttendanceStatus;
  onClose: () => void;
  onSelect: (status: AttendanceStatus) => void;
  onReset: () => void;
};

export const DayStatusModal: React.FC<Props> = ({
  visible,
  dateLabel,
  theme,
  currentStatus,
  onClose,
  onSelect,
  onReset,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [160, 0]) }],
    opacity: progress.value,
  }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Animated.View style={[styles.sheet, { backgroundColor: theme.card }, sheetStyle]}>
          <Text style={[styles.title, { color: theme.text }]}>Edit attendance</Text>
          <Text style={[styles.date, { color: theme.mutedText }]}>{dateLabel}</Text>
          <View style={styles.options}>
            <Pressable
              style={[
                styles.option,
                { borderColor: palette.present },
                currentStatus === 'present' && { backgroundColor: `${palette.present}22` },
              ]}
              onPress={() => onSelect('present')}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: palette.present },
                  currentStatus === 'present' && styles.activeOptionText,
                ]}
              >
                Present
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.option,
                { borderColor: palette.wfh },
                currentStatus === 'wfh' && { backgroundColor: `${palette.wfh}22` },
              ]}
              onPress={() => onSelect('wfh')}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: palette.wfh },
                  currentStatus === 'wfh' && styles.activeOptionText,
                ]}
              >
                WFH
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.option,
                { borderColor: palette.leave },
                currentStatus === 'leave' && { backgroundColor: `${palette.leave}22` },
              ]}
              onPress={() => onSelect('leave')}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: palette.leave },
                  currentStatus === 'leave' && styles.activeOptionText,
                ]}
              >
                Leave
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.option,
                { borderColor: palette.unset },
                currentStatus === 'unset' && { backgroundColor: `${palette.unset}22` },
              ]}
              onPress={onReset}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: palette.unset },
                  currentStatus === 'unset' && styles.activeOptionText,
                ]}
              >
                Reset (Unset)
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  date: {
    marginTop: 4,
    marginBottom: 20,
  },
  options: {
    gap: 12,
  },
  option: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeOptionText: {
    textDecorationLine: 'underline',
  },
});
