import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GameCard } from '@/components/game-card';
import { HeroCarousel } from '@/components/hero-carousel';
import { SearchPill } from '@/components/search-pill';
import { AppText, PressableScale, Screen } from '@/components/ui';
import { coverArt } from '@/data/art';
import { archivePick, onThisDay } from '@/lib/discover';
import { hapticSuccess } from '@/lib/haptics';
import type { Game, SectionKey } from '@/lib/library';
import {
  SECTIONS,
  games,
  sectionTotals,
  totalRealImages,
  totalRecords,
  UNIVERSES,
  universeOf,
  imageUrl,
} from '@/lib/library';
import { useStore } from '@/lib/store';
import { Fonts, Radii, Space, useTheme } from '@/theme';

const SHORTCUTS: { section: SectionKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { section: 'cheats', icon: 'keypad' },
  { section: 'missions', icon: 'flag' },
  { section: 'characters', icon: 'people' },
  { section: 'vehicles', icon: 'car-sport' },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isSaved, toggleSave } = useStore();
  const anniversary = onThisDay();
  const archive = archivePick();
  const universeCounts = UNIVERSES.map((universe) => ({
    ...universe,
    count: games.filter((game) => universeOf(game).key === universe.key).length,
  }));

  return (
    <Screen edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        {/* Wordmark */}
        <View style={styles.header}>
          <View>
            <View style={styles.wordmark}>
              <AppText style={[styles.wordmarkGta, { color: colors.accent }]}>GTA</AppText>
              <AppText style={[styles.wordmarkHub, { color: colors.text }]}>HUB</AppText>
            </View>
            <AppText variant="label" color={colors.textTertiary} style={styles.tagline}>
              The complete file · {totalRecords.toLocaleString('en-US')} records
            </AppText>
          </View>
          <View style={[styles.pillCount, { borderColor: colors.line }]}>
            <AppText variant="label" color={colors.textSecondary}>
              17 GAMES
            </AppText>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <SearchPill label="Search games, characters, cheats…" />
        </View>

        <HeroCarousel />

        {/* Shortcuts */}
        <View style={styles.sectionGap}>
          <SectionHead title="Start here" color={colors.textTertiary} />
          <View style={styles.shortcuts}>
            {SHORTCUTS.map((shortcut) => {
              const meta = SECTIONS.find((section) => section.key === shortcut.section)!;
              return (
                <PressableScale
                  key={shortcut.section}
                  scaleTo={0.94}
                  onPress={() =>
                    router.push({
                      pathname: '/browse/[section]',
                      params: { section: shortcut.section },
                    })
                  }
                  style={[
                    styles.shortcut,
                    { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                  accessibilityLabel={`${meta.label}, ${sectionTotals[shortcut.section]} records`}>
                  <View style={styles.shortcutTop}>
                    <Ionicons name={shortcut.icon} size={14} color={colors.accent} />
                    <Ionicons
                      name="arrow-up-outline"
                      size={11}
                      color={colors.textTertiary}
                      style={styles.shortcutArrow}
                    />
                  </View>
                  <AppText style={[styles.shortcutCount, { color: colors.text }]}>
                    {sectionTotals[shortcut.section].toLocaleString('en-US')}
                  </AppText>
                  <AppText
                    variant="label"
                    color={colors.textSecondary}
                    numberOfLines={1}
                    style={styles.shortcutLabel}>
                    {meta.label}
                  </AppText>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* On this day */}
        {anniversary.kind !== 'none' ? (
          <AnniversaryCard
            anniversary={anniversary}
            onPress={(game) =>
              router.push({ pathname: '/games/[slug]', params: { slug: game.slug } })
            }
          />
        ) : null}

        {/* Archive */}
        {archive ? (
          <ArchiveCard
            archive={archive}
            saved={isSaved(archive.key)}
            onSave={() => {
              toggleSave(archive.key);
              hapticSuccess();
            }}
            onOpen={() =>
              router.push({
                pathname: '/record/[slug]/[section]/[id]',
                params: {
                  slug: archive.game.slug,
                  section: archive.section,
                  id: archive.item.id,
                },
              })
            }
          />
        ) : null}

        {/* Saga rail */}
        <View style={styles.sectionGap}>
          <Pressable
            onPress={() => router.push('/library')}
            accessibilityRole="button"
            accessibilityLabel="Open the library"
            style={styles.railHead}>
            <SectionHead title="The saga" color={colors.textTertiary} />
            <View style={styles.readRow}>
              <AppText variant="label" color={colors.textTertiary}>
                17 GAMES
              </AppText>
              <Ionicons name="arrow-forward" size={12} color={colors.textTertiary} />
            </View>
          </Pressable>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}>
            {games.map((game) => (
              <GameCard key={game.slug} game={game} width={118} showUniverse={false} />
            ))}
          </ScrollView>
        </View>

        {/* Universes */}
        <View style={styles.sectionGap}>
          <SectionHead title="Four universes" color={colors.textTertiary} right="1997 — now" />
          <View style={[styles.universeList, { borderColor: colors.line }]}>
            {universeCounts.map((universe, index) => (
              <Pressable
                key={universe.key}
                onPress={() =>
                  router.push({ pathname: '/library', params: { era: universe.key } })
                }
                style={({ pressed }) => [
                  styles.universeRow,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: colors.line },
                  pressed && { backgroundColor: colors.surfacePressed },
                ]}>
                <View style={styles.universeLeft}>
                  <AppText variant="headline">{universe.label}</AppText>
                  <AppText variant="caption" color={colors.textTertiary}>
                    {universe.range} · {universe.count} {universe.count === 1 ? 'game' : 'games'}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <AppText variant="label" color={colors.textTertiary}>
            {totalRecords.toLocaleString('en-US')} records · 17 games ·{' '}
            {totalRealImages.toLocaleString('en-US')} images
          </AppText>
          <AppText variant="caption" color={colors.textTertiary} style={styles.legal}>
            Unofficial fan archive. Not affiliated with Rockstar Games or Take-Two Interactive.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ArchiveCard({
  archive,
  saved,
  onSave,
  onOpen,
}: {
  archive: NonNullable<ReturnType<typeof archivePick>>;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  const { colors } = useTheme();
  const [failed, setFailed] = React.useState(false);
  const uri = imageUrl(archive.item.image);
  const section = SECTIONS.find((entry) => entry.key === archive.section);

  return (
    <View style={styles.sectionGap}>
      <SectionHead title="From the archive" color={colors.textTertiary} right="One a day" />
      <PressableScale haptic={false} scaleTo={0.985} onPress={onOpen} style={styles.archive}>
        <View style={styles.archiveImage}>
          {uri && !failed ? (
            <Image
              source={{ uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={260}
              cachePolicy="memory-disk"
              onError={() => setFailed(true)}
            />
          ) : (
            <View style={styles.archiveFallback}>
              <Ionicons
                name={(section?.icon ?? 'document-text') as keyof typeof Ionicons.glyphMap}
                size={72}
                color="rgba(246,244,239,0.10)"
              />
            </View>
          )}
          <LinearGradient
            colors={['rgba(6,6,7,0.05)', 'rgba(6,6,7,0.55)', 'rgba(6,6,7,0.97)']}
            locations={[0.25, 0.62, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityLabel={saved ? 'Remove from saved' : 'Save record'}
            hitSlop={8}
            onPress={onSave}
            style={[styles.save, { backgroundColor: 'rgba(6,6,7,0.55)', borderColor: 'rgba(246,244,239,0.18)' }]}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={saved ? colors.accent : '#F6F4EF'}
            />
          </Pressable>
          <View style={styles.archiveMeta}>
            <AppText variant="label" color={colors.accent}>
              {section?.singular ?? 'Record'} · {archive.game.year}
            </AppText>
            <AppText variant="title" color="#F6F4EF" numberOfLines={2}>
              {archive.name}
            </AppText>
          </View>
        </View>
        <View style={[styles.archiveBody, { borderColor: colors.line }]}>
          <AppText variant="callout" color={colors.textSecondary} numberOfLines={2}>
            {archive.item.summary ?? `${archive.game.shortTitle} · ${archive.subtitle || 'The archive'}`}
          </AppText>
          <View style={styles.archiveFoot}>
            <AppText variant="label" color={colors.textTertiary}>
              {archive.game.shortTitle}
            </AppText>
            <View style={styles.readRow}>
              <AppText variant="label" color={colors.accent}>
                READ THE FILE
              </AppText>
              <Ionicons name="arrow-forward" size={12} color={colors.accent} />
            </View>
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

function SectionHead({
  title,
  right,
}: {
  title: string;
  color?: string;
  right?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionHeadLeft}>
        <View style={[styles.dot, { backgroundColor: colors.accent }]} />
        <AppText variant="label" color={colors.textSecondary}>
          {title}
        </AppText>
      </View>
      {right ? (
        <AppText variant="label" color={colors.textTertiary}>
          {right}
        </AppText>
      ) : null}
    </View>
  );
}

function AnniversaryCard({
  anniversary,
  onPress,
}: {
  anniversary: ReturnType<typeof onThisDay>;
  onPress: (game: Game) => void;
}) {
  const { colors } = useTheme();
  const game = anniversary.games[0];
  if (!game) return null;
  const isDay = anniversary.kind === 'day';
  const isWeek = anniversary.kind === 'week';
  const years = anniversary.yearsAgo ?? 0;
  const days = anniversary.daysAgo ?? 0;

  const label = isDay
    ? years === 0
      ? 'LAUNCHED TODAY'
      : `${years} ${years === 1 ? 'YEAR' : 'YEARS'} AGO TODAY`
    : isWeek
      ? `${days} ${days === 1 ? 'DAY' : 'DAYS'} AGO`
      : `${game.released?.slice(8, 10)} ${anniversary.month} ${game.year}`;

  const headline = isDay
    ? `${game.shortTitle} launched`
    : isWeek
      ? `${game.shortTitle} is ${days === 1 ? 'a day' : `${days} days`} old`
      : `${game.shortTitle} is from this month`;

  return (
    <View style={styles.sectionGap}>
      <SectionHead
        title={isDay ? 'On this day' : isWeek ? 'Just landed' : 'This month'}
        color={colors.textTertiary}
        right={`${anniversary.day} ${anniversary.month}`}
      />
      <PressableScale
        haptic={false}
        scaleTo={0.985}
        onPress={() => onPress(game)}
        style={[styles.anniversary, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View style={styles.anniversaryDate}>
          <AppText style={[styles.anniversaryDay, { color: colors.text }]}>{anniversary.day}</AppText>
          <AppText variant="label" color={colors.textTertiary}>
            {anniversary.month}
          </AppText>
        </View>
        <View style={[styles.anniversaryRule, { backgroundColor: colors.line }]} />
        <View style={styles.anniversaryBody}>
          <AppText variant="label" color={colors.accent}>
            {label}
          </AppText>
          <AppText variant="headline" numberOfLines={1}>
            {headline}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {game.cities.join(', ') || game.setting}
          </AppText>
        </View>
        <Image
          source={coverArt[game.slug]}
          style={[styles.anniversaryCover, { borderColor: colors.line }]}
          contentFit="cover"
        />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  header: {
    paddingHorizontal: Space.xl,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  wordmark: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  wordmarkGta: { fontFamily: Fonts.display, fontSize: 26, letterSpacing: -0.6 },
  wordmarkHub: {
    fontFamily: Fonts.display,
    fontSize: 26,
    letterSpacing: -0.6,
    color: '#F6F4EF',
  },
  tagline: { marginTop: 4, letterSpacing: 1.2 },
  pillCount: {
    height: 26,
    paddingHorizontal: 9,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  searchWrap: { paddingHorizontal: Space.xl, paddingTop: Space.lg },
  sectionGap: { marginTop: Space.xxl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.xl,
    marginBottom: Space.md,
  },
  sectionHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
    paddingHorizontal: Space.xl,
  },
  shortcut: {
    width: '47%',
    flexGrow: 1,
    minHeight: 104,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    justifyContent: 'space-between',
  },
  shortcutTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 14,
  },
  shortcutArrow: { transform: [{ rotate: '45deg' }] },
  shortcutCount: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
    marginTop: 10,
  },
  shortcutLabel: { fontSize: 10, letterSpacing: 1 },
  anniversary: {
    marginHorizontal: Space.xl,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  anniversaryDate: { alignItems: 'center', width: 42 },
  anniversaryDay: {
    fontFamily: Fonts.display,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  anniversaryRule: { width: StyleSheet.hairlineWidth * 2, alignSelf: 'stretch' },
  anniversaryBody: { flex: 1, gap: 3 },
  anniversaryCover: {
    width: 52,
    height: 68,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  archive: {
    marginHorizontal: Space.xl,
    borderRadius: Radii.card,
    overflow: 'hidden',
  },
  archiveImage: {
    height: 230,
    justifyContent: 'flex-end',
    backgroundColor: '#151517',
  },
  archiveFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveMeta: { padding: 16, gap: 4 },
  save: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  archiveBody: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: Radii.card,
    borderBottomRightRadius: Radii.card,
    padding: 16,
    gap: 14,
  },
  archiveFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  railHead: { flexDirection: 'row', alignItems: 'center' },
  rail: { paddingHorizontal: Space.xl, gap: Space.md, paddingBottom: 2 },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  universeList: {
    marginHorizontal: Space.xl,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  universeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  universeLeft: { flex: 1, gap: 2 },
  universeDots: { flexDirection: 'row', gap: 4 },
  universeDot: { width: 4, height: 4, borderRadius: 2, opacity: 0.6 },
  footer: { paddingHorizontal: Space.xl, marginTop: Space.huge, gap: 8 },
  legal: { lineHeight: 17, maxWidth: 300 },
});
