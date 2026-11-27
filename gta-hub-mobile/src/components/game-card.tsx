import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { AppText, PressableScale } from '@/components/ui';
import { coverArt } from '@/data/art';
import type { Game } from '@/lib/library';
import { universeOf } from '@/lib/library';
import { Radii, useTheme } from '@/theme';

export function GameCard({
  game,
  width,
  style,
  showUniverse = true,
}: {
  game: Game;
  width?: number;
  style?: ViewStyle;
  showUniverse?: boolean;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const universe = universeOf(game);
  const compact = typeof width === 'number' && width < 150;

  return (
    <PressableScale
      haptic={false}
      scaleTo={0.975}
      onPress={() =>
        router.push({ pathname: '/games/[slug]', params: { slug: game.slug } })
      }
      style={[{ width }, style]}>
      <View
        style={[
          styles.cover,
          { backgroundColor: colors.surfaceRaised, borderColor: colors.line },
        ]}>
        <Image
          source={coverArt[game.slug]}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={240}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['rgba(6,6,7,0)', 'rgba(6,6,7,0.28)', 'rgba(6,6,7,0.94)']}
          locations={[0.35, 0.62, 1]}
          style={StyleSheet.absoluteFill}
        />
        {showUniverse ? (
          <AppText variant="label" color="rgba(246,244,239,0.62)" style={styles.universe}>
            {universe.short}
          </AppText>
        ) : null}
        <View style={styles.meta}>
          <AppText variant="label" color={colors.accent}>
            {game.year}
          </AppText>
          <AppText
            variant="headline"
            color="#F6F4EF"
            numberOfLines={compact ? 2 : 1}
            style={[styles.title, compact && styles.titleCompact]}>
            {game.shortTitle}
          </AppText>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  universe: {
    position: 'absolute',
    top: 10,
    left: 12,
    letterSpacing: 1.4,
  },
  meta: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    gap: 2,
  },
  title: { letterSpacing: -0.2 },
  titleCompact: { fontSize: 14.5, lineHeight: 16.5 },
});
