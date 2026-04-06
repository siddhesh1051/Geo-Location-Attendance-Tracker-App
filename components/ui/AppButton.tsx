import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { ThemePalette } from '../../utils/theme';

type Variant = 'primary' | 'ghost' | 'danger';

type Props = React.ComponentProps<typeof Pressable> & {
  theme: ThemePalette;
  variant?: Variant;
  children: React.ReactNode;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
};

export const AppButton: React.FC<Props> = ({
  theme,
  variant = 'primary',
  style,
  children,
  textStyle,
  leftIcon,
  ...props
}) => {
  const variantStyles: ViewStyle =
    variant === 'ghost'
      ? { backgroundColor: theme.buttonGhostBackground, borderColor: theme.border, borderWidth: 1 }
      : variant === 'danger'
        ? { backgroundColor: '#D63F3F' }
        : { backgroundColor: theme.buttonPrimaryBackground };

  const color = variant === 'primary' || variant === 'danger' ? theme.buttonPrimaryText : theme.text;

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.base,
        variantStyles,
        { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
        typeof style === 'function' ? undefined : style,
      ]}
    >
      <View style={styles.content}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <Text style={[styles.text, { color }, textStyle]}>{children}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
});
