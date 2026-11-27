import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecordRow } from '@/components/record-row';
import { ChipRail } from '@/components/chip-rail';
import { AppText, Chip, Screen } from '@/components/ui';
import type { Game } from '@/lib/library';
import {
  SECTIONS,
  games,
  isSectionKey,
  sectionItems,
  sectionTotals,
} from '@/lib/library';
import { Space, useTheme } from '@/theme';

export default function BrowseSectionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ section?: string }>();
  const section = isSectionKey(params.section) ? params.section : 'characters';
  const meta = SECTIONS.find((entry) => entry.key === section)!;
  const [gameFilter, setGameFilter] = useState<string>('all');

  const groups = useMemo(
    () =>
      games
        .filter((game) => gameFilter === 'all' || game.slug === gameFilter)
        .map((game) => ({
          game,
          data: sectionItems(game, section).map((item) => ({
            ...item,
            __key: `${game.slug}:${item.id}`,
          })),
        }))
        .filter((group) => group.data.length > 0),
    [gameFilter, section]
  );

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Pressable
          hitSlop={12}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          style={[styles.back, { borderColor: colors.line }]}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <View style={styles.headerBody}>
          <AppText variant="label" color={colors.accent}>
            Across the saga
          </AppText>
          <AppText variant="title">{meta.label}</AppText>
        </View>
        <Pressable
          hitSlop={12}
          onPress={() => router.push('/search')}
          accessibilityLabel="Search"
          style={[styles.back, { borderColor: colors.line }]}>
          <Ionicons name="search" size={17} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.blurbRow}>
        <AppText variant="callout" color={colors.textSecondary} style={styles.blurb}>
          {meta.blurb}
        </AppText>
        <AppText variant="label" color={colors.textTertiary}>
          {sectionTotals[section].toLocaleString('en-US')}
        </AppText>
      </View>

      <SectionList
        sections={groups}
        keyExtractor={(item) => item.__key}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        ListHeaderComponent={
          <View style={styles.chipsWrap}>
            <ChipRail>
              {SECTIONS.map((entry) => (
                <Chip
                  key={entry.key}
                  label={entry.label}
                  active={entry.key === section}
                  onPress={() =>
                    router.replace({ pathname: '/browse/[section]', params: { section: entry.key } })
                  }
                />
              ))}
            </ChipRail>
            <View style={[styles.rule, { backgroundColor: colors.line }]} />
            <ChipRail>
              <Chip
                label="All games"
                active={gameFilter === 'all'}
                onPress={() => setGameFilter('all')}
              />
              {games.map((game) => (
                <Chip
                  key={game.slug}
                  label={game.shortTitle}
                  active={gameFilter === game.slug}
                  onPress={() => setGameFilter(game.slug)}
                />
              ))}
            </ChipRail>
          </View>
        }
        renderSectionHeader={({ section: group }) => (
          <GameHead game={group.game} count={group.data.length} />
        )}
        renderItem={({ item, section: group, index }) => (
          <RecordRow
            game={group.game}
            section={section}
            item={item}
            index={section === 'missions' && item.order ? String(item.order).padStart(2, '0') : undefined}
            onPress={() =>
              router.push({
                pathname: '/record/[slug]/[section]/[id]',
                params: {
                  slug: group.game.slug,
                  section,
                  id: item.id,
                },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText variant="headline">Nothing in this file</AppText>
            <AppText variant="callout" color={colors.textSecondary} style={styles.emptyBody}>
              This game genuinely has no {meta.label.toLowerCase()}. That\u2019s recorded honestly
              rather than left blank.
            </AppText>
          </View>
        }
      />
    </Screen>
  );
}

function GameHead({ game, count }: { game: Game; count: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.gameHead, { backgroundColor: colors.bg }]}>
      <View style={styles.gameHeadLeft}>
        <AppText variant="label" color={colors.accent}>
          {game.year}
        </AppText>
        <AppText variant="headline">{game.shortTitle}</AppText>
      </View>
      <AppText variant="caption" color={colors.textTertiary}>
        {count} {count === 1 ? 'record' : 'records'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Space.lg,
    paddingTop: 8,
    paddingBottom: 10,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBody: { flex: 1, gap: 1 },
  blurbRow: {
    paddingHorizontal: Space.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: Space.sm,
  },
  blurb: { flex: 1 },
  chipsWrap: { paddingTop: Space.sm },
  rule: { height: StyleSheet.hairlineWidth * 2, marginVertical: Space.sm, marginHorizontal: Space.xl },
  gameHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.xl,
    paddingTop: Space.lg,
    paddingBottom: Space.sm,
  },
  gameHeadLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  empty: { padding: Space.xl, paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyBody: { textAlign: 'center', maxWidth: 280 },
});
