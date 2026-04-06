import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ThemePalette } from '../utils/theme';

type Props = {
  label: string;
  value: number;
  color: string;
  theme: ThemePalette;
};

export const StatCard: React.FC<Props> = ({ label, value, color, theme }) => (
  <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.cardShadow }]}>
    <Text style={[styles.value, { color }]}>{value}</Text>
    <Text style={[styles.label, { color: theme.mutedText }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    marginTop: 4,
    fontSize: 12,
  },
});
