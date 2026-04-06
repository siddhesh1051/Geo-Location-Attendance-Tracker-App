import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { getTheme, isDarkResolved } from '../utils/theme';

export const AppSplash: React.FC = () => {
  const systemScheme = useColorScheme();
  const isDark = isDarkResolved('system', systemScheme);
  const theme = getTheme(isDark);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={[styles.logoWrap, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Ionicons name="flash" size={28} color={theme.present} />
      </Animated.View>
      <Animated.Text entering={FadeIn.duration(700)} style={[styles.title, { color: theme.text }]}>
        Razor Attendance
      </Animated.Text>
      <Animated.Text entering={FadeIn.duration(900)} style={[styles.subtitle, { color: theme.mutedText }]}>
        Track your office presence beautifully
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
  },
});
