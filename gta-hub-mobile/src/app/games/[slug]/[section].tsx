import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecordRow } from '@/components/record-row';
import { ChipRail } from '@/components/chip-rail';
import { AppText, Chip, Screen } from '@/components/ui';
import { coverArt } from '@/data/art';
import type { SectionKey } from '@/lib/library';
import {
  SECTIONS,
  isSectionKey,
  gamesBySlug,
  sectionFacet,
  sectionItems,
  sortRecords,
} from '@/lib/library';
import { Radii, Space, useTheme } from '@/theme';

export default function GameSectionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ slug?: string; section?: string }>();
  const game = params.slug ? gamesBySlug[params.slug] : undefined;
  const section: SectionKey = isSectionKey(params.section) ? params.section : 'characters';
  const meta = SECTIONS.find((entry) => entry.key === section)!;
  const [facet, setFacet] = useState<string>('all');

  const items = useMemo(() => {
    if (!game) return [];
    return sortRecords(sectionItems(game, section), section);
  }, [game, section]);

  const facets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const value = sectionFacet(item, section);
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [items, section]);

  const filtered = useMemo(
    () =>
      facet === 'all'
        ? items
        : items.filter((item) => sectionFacet(item, section) === facet),
    [facet, items, section]
  );

  const nextIndex = (SECTIONS.findIndex((entry) => entry.key === section) + 1) % SECTIONS.length;
  const nextSection = SECTIONS[nextIndex];

  if (!game) {
    return (
      <Screen edges={['top']}>
        <View style={styles.missing}>
          <AppText variant="title">Game not found</AppText>
          <Pressable onPress={() => router.back()}>
            <AppText color={colors.accent}>Go back</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Pressable
          hitSlop={12}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          style={[styles.iconBtn, { borderColor: colors.line }]}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <View style={styles.headerBody}>
          <AppText variant="label" color={colors.textTertiary}>
            {game.shortTitle} · {game.year}
          </AppText>
          <AppText variant="headline" numberOfLines={1}>
            {game.title}
          </AppText>
        </View>
        <Pressable
          hitSlop={12}
          onPress={() => router.push('/search')}
          accessibilityLabel="Search"
          style={[styles.iconBtn, { borderColor: colors.line }]}>
          <Ionicons name="search" size={17} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        ListHeaderComponent={
          <View>
            <View style={styles.chapter}>
              <Image
                source={coverArt[game.slug]}
                style={[styles.chapterCover, { borderColor: colors.line }]}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.chapterBody}>
                <AppText variant="label" color={colors.accent}>
                  Chapter {String(SECTIONS.findIndex((entry) => entry.key === section) + 1).padStart(2, '0')}
                </AppText>
                <AppText variant="title">{meta.label}</AppText>
                <AppText variant="caption" color={colors.textTertiary}>
                  {items.length.toLocaleString('en-US')} records ·{' '}
                  {coverageLabel(game.coverage[section])}
                </AppText>
              </View>
            </View>

            <AppText variant="callout" color={colors.textSecondary} style={styles.blurb}>
              {meta.blurb}
            </AppText>

            {facets.length > 1 ? (
              <ChipRail style={styles.chipRail}>
                <Chip
                  label="All"
                  count={items.length}
                  active={facet === 'all'}
                  onPress={() => setFacet('all')}
                />
                {facets.map(([value, count]) => (
                  <Chip
                    key={value}
                    label={value}
                    count={count}
                    active={facet === value}
                    onPress={() => setFacet(value)}
                  />
                ))}
              </ChipRail>
            ) : null}

            <View style={[styles.rule, { backgroundColor: colors.line }]} />
          </View>
        }
        renderItem={({ item }) => (
          <RecordRow
            game={game}
            section={section}
            item={item}
            index={
              section === 'missions' && item.order
                ? String(item.order).padStart(2, '0')
                : undefined
            }
            onPress={() =>
              router.push({
                pathname: '/record/[slug]/[section]/[id]',
                params: { slug: game.slug, section, id: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText variant="headline">No records here</AppText>
            <AppText variant="callout" color={colors.textSecondary} style={styles.emptyBody}>
              {game.coverage[section] === 'empty'
                ? `${game.shortTitle} genuinely has no ${meta.label.toLowerCase()}. The gap is recorded, not filled with guesses.`
                : 'Nothing matches this filter.'}
            </AppText>
          </View>
        }
        ListFooterComponent={
          <Pressable
            onPress={() =>
              router.replace({
                pathname: '/games/[slug]/[section]',
                params: { slug: game.slug, section: nextSection.key },
              })
            }
            style={({ pressed }) => [
              styles.next,
              { borderColor: colors.line },
              pressed && { backgroundColor: colors.surfacePressed },
            ]}>
            <View style={styles.nextBody}>
              <AppText variant="label" color={colors.textTertiary}>
                NEXT CHAPTER
              </AppText>
              <AppText variant="headline">{nextSection.label}</AppText>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.accent} />
          </Pressable>
        }
      />
    </Screen>
  );
}

function coverageLabel(value?: string) {
  switch (value) {
    case 'complete':
      return 'complete';
    case 'limited':
      return 'limited';
    case 'official-only':
      return 'official info only';
    case 'empty':
      return 'nothing to list';
    default:
      return 'partial';
  }
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Space.lg,
    paddingTop: 8,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBody: { flex: 1, gap: 1 },
  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: Space.xl,
    paddingTop: Space.md,
  },
  chapterCover: {
    width: 58,
    height: 76,
    borderRadius: Radii.small,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  chapterBody: { flex: 1, gap: 2 },
  blurb: { paddingHorizontal: Space.xl, marginTop: Space.md },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
    paddingHorizontal: Space.xl,
    paddingTop: Space.lg,
    paddingBottom: Space.md,
  },
  chipRail: { paddingHorizontal: Space.xl, paddingTop: Space.sm },
  rule: { height: StyleSheet.hairlineWidth * 2, marginHorizontal: Space.xl, marginBottom: Space.xs },
  empty: { padding: Space.xl, paddingTop: 48, alignItems: 'center', gap: 8 },
  emptyBody: { textAlign: 'center', maxWidth: 280 },
  next: {
    marginHorizontal: Space.xl,
    marginTop: Space.xxl,
    padding: 16,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextBody: { flex: 1, gap: 2 },
});
