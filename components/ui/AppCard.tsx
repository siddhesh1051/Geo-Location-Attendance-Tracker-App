import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { ThemePalette } from '../../utils/theme';

type Props = ViewProps & {
  theme: ThemePalette;
};

export const AppCard: React.FC<Props> = ({ theme, style, children, ...props }) => (
  <View
    {...props}
    style={[
      styles.card,
      {
        backgroundColor: theme.card,
        borderColor: theme.border,
        shadowColor: theme.cardShadow,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
