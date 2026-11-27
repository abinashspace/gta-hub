import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText, PressableScale } from '@/components/ui';
import { coverArt, heroArt } from '@/data/art';
import { featuredGames } from '@/lib/library';
import { Radii, Space, useTheme } from '@/theme';

const FEATURED = featuredGames();
const GAP = 12;

export function HeroCarousel() {
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = width - Space.xl * 2;
  const [index, setIndex] = useState(0);

  return (
    <View style={styles.wrap}>
      <FlatList
        data={FEATURED}
        keyExtractor={(item) => item.slug}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + GAP}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={styles.rail}
        onMomentumScrollEnd={(event) => {
          setIndex(Math.round(event.nativeEvent.contentOffset.x / (cardWidth + GAP)));
        }}
        renderItem={({ item }) => (
          <PressableScale
            haptic={false}
            scaleTo={0.985}
            onPress={() => router.push(`/games/${item.slug}`)}
            style={{ width: cardWidth }}
            accessibilityLabel={`${item.title}. Open the game file.`}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.media}>
                <Image
                  source={heroArt[item.slug] ?? coverArt[item.slug]}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={320}
                  cachePolicy="memory-disk"
                />
                <LinearGradient
                  colors={['rgba(6,6,7,0.32)', 'rgba(6,6,7,0.02)', 'rgba(6,6,7,0.46)']}
                  locations={[0, 0.4, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.stampRow}>
                  <View style={[styles.stamp, { borderColor: 'rgba(246,244,239,0.22)' }]}>
                    <AppText variant="label" color="#F6F4EF" style={styles.stampText}>
                      {item.type}
                    </AppText>
                  </View>
                  {item.status === 'upcoming' ? (
                    <View style={[styles.stamp, { borderColor: 'rgba(255,210,63,0.5)' }]}>
                      <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
                      <AppText variant="label" color={colors.accent} style={styles.stampText}>
                        Upcoming
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.body}>
                <View style={styles.bodyTop}>
                  <View style={styles.bodyLeft}>
                    <AppText variant="label" color={colors.accent}>
                      {item.year} · {item.cities[0] ?? 'The world'}
                    </AppText>
                    <AppText variant="display" numberOfLines={1} style={styles.title}>
                      {item.shortTitle}
                    </AppText>
                    <AppText
                      variant="callout"
                      color={colors.textSecondary}
                      numberOfLines={2}
                      style={styles.setting}>
                      {item.setting}
                    </AppText>
                  </View>
                  <View style={[styles.open, { borderColor: colors.line }]}>
                    <Ionicons name="arrow-forward" size={16} color={colors.accent} />
                  </View>
                </View>
              </View>
            </View>
          </PressableScale>
        )}
      />

      <View style={styles.dots}>
        {FEATURED.map((game, dotIndex) => (
          <View
            key={game.slug}
            style={[
              styles.dot,
              {
                width: index === dotIndex ? 18 : 5,
                backgroundColor:
                  index === dotIndex ? colors.accent : colors.textTertiary,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: Space.xl },
  rail: { paddingHorizontal: Space.xl, gap: GAP },
  card: {
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  media: { height: 210 },
  stampRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stamp: {
    height: 24,
    paddingHorizontal: 9,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    backgroundColor: 'rgba(6,6,7,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    alignSelf: 'flex-start',
  },
  stampText: { fontSize: 9, letterSpacing: 1.2 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  body: { padding: 16, gap: 10 },
  bodyTop: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  bodyLeft: { flex: 1, gap: 3 },
  title: { fontSize: 30, lineHeight: 33, letterSpacing: -0.7 },
  setting: { marginTop: 1 },
  open: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Space.xl,
    marginTop: 12,
  },
  dot: { height: 5, borderRadius: 3 },
});
