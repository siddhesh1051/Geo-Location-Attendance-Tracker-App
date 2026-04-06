import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type Props = {
  value: number;
  suffix?: string;
  color: string;
  style?: TextStyle;
};

export const AnimatedNumber: React.FC<Props> = ({ value, suffix = '', color, style }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(value);

  useEffect(() => {
    const start = performance.now();
    const duration = 450;
    const from = startRef.current;
    const to = value;

    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplayValue(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = to;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <Animated.Text entering={FadeInDown.duration(260)} style={[styles.value, { color }, style]}>
      {`${displayValue}${suffix}`}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  value: {
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
