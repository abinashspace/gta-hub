import React from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';

import { Space } from '@/theme';

/**
 * One-line, swipeable chip rail. Filters should never push the content they
 * filter off the screen — so a rail replaces a wrapping wall of chips.
 */
export function ChipRail({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.rail, style]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    paddingHorizontal: Space.xl,
    gap: Space.sm,
    paddingVertical: Space.sm,
    alignItems: 'center',
  },
});
