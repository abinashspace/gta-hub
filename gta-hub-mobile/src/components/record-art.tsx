import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/components/ui';
import type { RecordItem, SectionKey } from '@/lib/library';
import { imageUrl, recordName } from '@/lib/library';
import { Fonts, Radii, useTheme } from '@/theme';

/**
 * Record artwork with a designed fallback. A missing or placeholder SVG becomes
 * a typographic plate instead of a broken image — the grid never shows holes.
 */
export function RecordArt({
  item,
  section,
  gameTitle,
  size = 56,
  radius = Radii.small,
  style,
}: {
  item: RecordItem;
  section: SectionKey;
  gameTitle?: string;
  size?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const uri = imageUrl(item.image);
  const name = recordName(item, section);
  const initials = name
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

  const frame = { width: size, height: size, borderRadius: radius };

  if (!uri || failed) {
    return (
      <View
        style={[
          frame,
          styles.fallback,
          { backgroundColor: colors.surface, borderColor: colors.line },
          style,
        ]}>
        <AppText
          style={{
            fontFamily: Fonts.display,
            fontSize: Math.max(13, size * 0.3),
            color: colors.textTertiary,
            letterSpacing: -0.5,
          }}>
          {initials || '—'}
        </AppText>
        <View style={[styles.tick, { backgroundColor: colors.accent }]} />
      </View>
    );
  }

  return (
    <View style={[frame, { backgroundColor: colors.surface }, style]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={220}
        cachePolicy="memory-disk"
        onError={() => setFailed(true)}
        accessibilityLabel={`${name}${gameTitle ? `, ${gameTitle}` : ''}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  tick: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 2,
    width: '38%',
  },
});
