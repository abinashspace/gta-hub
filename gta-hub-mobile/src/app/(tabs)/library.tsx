import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { GameCard } from '@/components/game-card';
import { SearchPill } from '@/components/search-pill';
import { AppText, Chip, PressableScale, Screen } from '@/components/ui';
import { SECTIONS, UNIVERSES, games, sectionTotals, universeOf } from '@/lib/library';
import type { SectionKey } from '@/lib/library';
import { Radii, Space, useTheme } from '@/theme';

type Filter = 'all' | (typeof UNIVERSES)[number]['key'];

export default function LibraryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ era?: string }>();
  const { width } = useWindowDimensions();

  /** A deep link (?era=) pre-filters the grid without an effect round-trip. */
  const eraParam = useMemo<Filter | null>(() => {
    const era = params.era as Filter | undefined;
    return era && (era === 'all' || UNIVERSES.some((universe) => universe.key === era)) ? era : null;
  }, [params.era]);

  const [picked, setPicked] = useState<Filter | null>(null);
  const filter: Filter = picked ?? eraParam ?? 'all';
  const setFilter = setPicked;

  const cardWidth = (width - Space.xl * 2 - Space.md) / 2;

  const groups = useMemo(
    () =>
      UNIVERSES.map((universe) => ({
        ...universe,
        games: games.filter(
          (game) =>
            universeOf(game).key === universe.key && (filter === 'all' || filter === universe.key)
        ),
      })).filter((group) => group.games.length > 0),
    [filter]
  );

  return (
    <Screen edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="label" color={colors.accent}>
            The library
          </AppText>
          <AppText variant="display" style={styles.title}>
            THE SAGA
          </AppText>
          <AppText variant="callout" color={colors.textSecondary} style={styles.blurb}>
            Seventeen games. Four universes. One city at a time.
          </AppText>
        </View>

        <View style={styles.searchWrap}>
          <SearchPill label="Search every game and record" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          <Chip label="All" count={games.length} active={filter === 'all'} onPress={() => setFilter('all')} />
          {UNIVERSES.map((universe) => (
            <Chip
              key={universe.key}
              label={universe.short}
              count={games.filter((game) => universeOf(game).key === universe.key).length}
              active={filter === universe.key}
              onPress={() => setFilter(universe.key)}
            />
          ))}
        </ScrollView>

        {groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <View style={styles.groupHead}>
              <AppText variant="label" color={colors.textSecondary}>
                {group.label}
              </AppText>
              <AppText variant="caption" color={colors.textTertiary}>
                {group.range} · {group.games.length} {group.games.length === 1 ? 'title' : 'titles'}
              </AppText>
            </View>
            <View style={styles.grid}>
              {group.games.map((game) => (
                <GameCard key={game.slug} game={game} width={cardWidth} showUniverse={false} />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.crossHead}>
          <AppText variant="label" color={colors.textSecondary}>
            Across the saga
          </AppText>
          <AppText variant="caption" color={colors.textTertiary}>
            Every record, all 17 games
          </AppText>
        </View>

        <View style={styles.crossGrid}>
          {SECTIONS.map((section) => (
            <PressableScale
              key={section.key}
              scaleTo={0.97}
              onPress={() =>
                router.push({
                  pathname: '/browse/[section]',
                  params: { section: section.key },
                })
              }
              style={[styles.crossTile, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <AppText style={[styles.crossNumber, { color: colors.text }]}>
                {sectionTotals[section.key as SectionKey].toLocaleString('en-US')}
              </AppText>
              <AppText variant="headline">{section.label}</AppText>
              <AppText variant="caption" color={colors.textTertiary} numberOfLines={2}>
                {section.blurb}
              </AppText>
            </PressableScale>
          ))}
        </View>

        <View style={styles.footer}>
          <AppText variant="caption" color={colors.textTertiary}>
            Data compiled from GTA Wiki and Grand Theft Wiki. Coverage is declared per
            section — no record pretends to be complete when it isn&apos;t.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  header: { paddingHorizontal: Space.xl, paddingTop: 12, gap: 4 },
  title: { fontSize: 38, lineHeight: 42, letterSpacing: -0.8, marginTop: 2 },
  blurb: { maxWidth: 300, marginTop: 4 },
  searchWrap: { paddingHorizontal: Space.xl, marginTop: Space.lg },
  filters: {
    paddingHorizontal: Space.xl,
    gap: Space.sm,
    paddingVertical: Space.lg,
  },
  group: { marginTop: Space.lg },
  groupHead: {
    paddingHorizontal: Space.xl,
    marginBottom: Space.md,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  grid: {
    paddingHorizontal: Space.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.md,
  },
  crossHead: {
    paddingHorizontal: Space.xl,
    marginTop: Space.huge,
    marginBottom: Space.md,
    gap: 2,
  },
  crossGrid: {
    paddingHorizontal: Space.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.md,
  },
  crossTile: {
    width: '47.5%',
    flexGrow: 1,
    padding: 16,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: 2,
  },
  crossNumber: {
    fontFamily: 'RussoOne',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
    marginBottom: 6,
  },
  footer: { paddingHorizontal: Space.xl, marginTop: Space.xxl },
});
