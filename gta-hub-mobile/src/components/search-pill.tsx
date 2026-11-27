import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { hapticTap } from '@/lib/haptics';
import { totalRecords } from '@/lib/library';
import { Radii, Space, useTheme } from '@/theme';

export function SearchPill({ label }: { label?: string }) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel="Search the archive"
      onPress={() => {
        hapticTap();
        router.push('/search');
      }}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: pressed ? colors.surfacePressed : colors.surface,
          borderColor: colors.line,
        },
      ]}>
      <Ionicons name="search" size={17} color={colors.textSecondary} />
      <AppText variant="callout" color={colors.textSecondary} style={styles.label} numberOfLines={1}>
        {label ?? `Search ${totalRecords.toLocaleString('en-US')} records`}
      </AppText>
      <View style={[styles.hint, { borderColor: colors.line }]}>
        <AppText variant="label" color={colors.textTertiary} style={styles.hintText}>
          ALL
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 46,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingHorizontal: 16,
  },
  label: { flex: 1 },
  hint: {
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: { fontSize: 9, letterSpacing: 1.2 },
});
