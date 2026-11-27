import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecordArt } from '@/components/record-art';
import { AppText, PressableScale } from '@/components/ui';
import { coverArt } from '@/data/art';
import type { Game, RecordItem, SectionKey } from '@/lib/library';
import {
  SECTIONS,
  gamesBySlug,
  sectionCount,
  sectionItems,
  universeOf,
} from '@/lib/library';
import { Fonts, Radii, Space, useTheme } from '@/theme';

export default function GameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ slug?: string }>();
  const game = params.slug ? gamesBySlug[params.slug] : undefined;

  if (!game) {
    return (
      <View style={[styles.missing, { backgroundColor: colors.bg }]}>
        <AppText variant="title">Game not found</AppText>
        <Pressable onPress={() => router.back()}>
          <AppText color={colors.accent}>Go back</AppText>
        </Pressable>
      </View>
    );
  }

  const universe = universeOf(game);
  const cast = sectionItems(game, 'characters')
    .filter((item) => item.image && !/\.svg$/i.test(item.image))
    .slice(0, 10);
  const fleet = sectionItems(game, 'vehicles')
    .filter((item) => item.image && !/\.svg$/i.test(item.image))
    .slice(0, 10);
  const total = SECTIONS.reduce((sum, section) => sum + sectionCount(game, section.key), 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <StatusBar style="auto" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 60 }]}>
        {/* Title bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.iconBtn,
              { borderColor: colors.line, backgroundColor: pressed ? colors.surfacePressed : 'transparent' },
            ]}>
            <Ionicons name="chevron-back" size={19} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/search')}
            accessibilityLabel="Search"
            style={({ pressed }) => [
              styles.iconBtn,
              { borderColor: colors.line, backgroundColor: pressed ? colors.surfacePressed : 'transparent' },
            ]}>
            <Ionicons name="search" size={17} color={colors.text} />
          </Pressable>
        </View>

        {/* Identity */}
        <View style={styles.identity}>
          <View style={styles.coverWrap}>
            <Image
              source={coverArt[game.slug]}
              style={[styles.cover, { borderColor: colors.line }]}
              contentFit="cover"
              transition={240}
              cachePolicy="memory-disk"
            />
            {game.status === 'upcoming' ? (
              <View style={[styles.coverTag, { backgroundColor: colors.accent }]}>
                <AppText variant="label" color={colors.accentInk} style={styles.coverTagText}>
                  Upcoming
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.identityBody}>
            <AppText variant="label" color={colors.accent}>
              {universe.short} · {game.type}
            </AppText>
            <AppText variant="display" style={styles.identityTitle} numberOfLines={2}>
              {game.shortTitle}
            </AppText>
            <AppText variant="callout" color={colors.textSecondary} numberOfLines={2}>
              {game.setting}
            </AppText>
            <View style={styles.tagRow}>
              <View style={[styles.tag, { borderColor: colors.line }]}>
                <AppText variant="label" color={colors.textSecondary} style={styles.tagText}>
                  {game.year}
                </AppText>
              </View>
              {game.cities.slice(0, 1).map((city) => (
                <View key={city} style={[styles.tag, { borderColor: colors.line }]}>
                  <AppText variant="label" color={colors.textSecondary} style={styles.tagText}>
                    {city}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Meta strip */}
        <View style={[styles.meta, { borderColor: colors.line }]}>
          <Meta label="Released" value={formatDate(game.released)} />
          <View style={[styles.metaRule, { backgroundColor: colors.line }]} />
          <Meta label="Chapters" value={`${SECTIONS.length}`} />
          <View style={[styles.metaRule, { backgroundColor: colors.line }]} />
          <Meta label="Records" value={total.toLocaleString('en-US')} />
        </View>

        {game.notes ? (
          <AppText variant="callout" color={colors.textSecondary} style={styles.notes}>
            {game.notes}
          </AppText>
        ) : null}

        {/* Chapters */}
        <View style={[styles.blockHead, styles.chaptersHead]}>
          <AppText variant="label" color={colors.textSecondary}>
            The chapters
          </AppText>
          <AppText variant="label" color={colors.textTertiary}>
            SEVEN FILES
          </AppText>
        </View>
        <View style={styles.chapters}>
          {SECTIONS.map((section, index) => {
            const count = sectionCount(game, section.key);
            const coverage = game.coverage[section.key] ?? 'partial';
            return (
              <PressableScale
                key={section.key}
                scaleTo={0.97}
                onPress={() =>
                  router.push({
                    pathname: '/games/[slug]/[section]',
                    params: { slug: game.slug, section: section.key },
                  })
                }
                style={[
                  styles.chapter,
                  { backgroundColor: colors.surface, borderColor: colors.line },
                ]}>
                <View style={styles.chapterTop}>
                  <AppText variant="label" color={colors.textTertiary}>
                    {String(index + 1).padStart(2, '0')}
                  </AppText>
                  <Ionicons
                    name={section.icon as keyof typeof Ionicons.glyphMap}
                    size={15}
                    color={colors.textSecondary}
                  />
                </View>
                <AppText variant="headline" numberOfLines={1}>
                  {section.label}
                </AppText>
                <View style={styles.chapterFoot}>
                  <AppText
                    style={[styles.chapterCount, { color: count ? colors.text : colors.textTertiary }]}>
                    {count}
                  </AppText>
                  <CoverageTag coverage={coverage} empty={count === 0} />
                </View>
              </PressableScale>
            );
          })}
        </View>

        {/* Cast */}
        {cast.length ? (
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <AppText variant="label" color={colors.textSecondary}>
                The cast
              </AppText>
              <Pressable
                hitSlop={10}
                onPress={() =>
                  router.push({
                    pathname: '/games/[slug]/[section]',
                    params: { slug: game.slug, section: 'characters' },
                  })
                }>
                <AppText variant="label" color={colors.accent}>
                  ALL {sectionCount(game, 'characters')}
                </AppText>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}>
              {cast.map((item) => (
                <RailCard
                  key={item.id}
                  game={game}
                  section="characters"
                  item={item}
                  width={96}
                  onPress={() =>
                    router.push({
                      pathname: '/record/[slug]/[section]/[id]',
                      params: { slug: game.slug, section: 'characters', id: item.id },
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Fleet */}
        {fleet.length ? (
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <AppText variant="label" color={colors.textSecondary}>
                The fleet
              </AppText>
              <Pressable
                hitSlop={10}
                onPress={() =>
                  router.push({
                    pathname: '/games/[slug]/[section]',
                    params: { slug: game.slug, section: 'vehicles' },
                  })
                }>
                <AppText variant="label" color={colors.accent}>
                  ALL {sectionCount(game, 'vehicles')}
                </AppText>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}>
              {fleet.map((item) => (
                <RailCard
                  key={item.id}
                  game={game}
                  section="vehicles"
                  item={item}
                  width={104}
                  onPress={() =>
                    router.push({
                      pathname: '/record/[slug]/[section]/[id]',
                      params: { slug: game.slug, section: 'vehicles', id: item.id },
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Footnote */}
        <View style={styles.footer}>
          <AppText variant="caption" color={colors.textTertiary} style={styles.footerText}>
            {game.developer} · {game.publisher}
            {'\n'}
            {game.platforms.join(' · ')}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.metaCell}>
      <AppText variant="label" color={colors.textTertiary} style={styles.metaLabel}>
        {label}
      </AppText>
      <AppText variant="callout" numberOfLines={1} style={styles.metaValue}>
        {value}
      </AppText>
    </View>
  );
}

function CoverageTag({ coverage, empty }: { coverage: string; empty: boolean }) {
  const { colors } = useTheme();
  const map: Record<string, string> = {
    complete: 'FULL',
    partial: 'PARTIAL',
    limited: 'LIMITED',
    'official-only': 'OFFICIAL',
    empty: 'NONE',
  };
  const label = empty ? 'NONE' : map[coverage] ?? 'PARTIAL';
  // Monochrome on purpose: coverage is metadata, not a second accent.
  const tone = label === 'FULL' ? colors.textSecondary : colors.textTertiary;
  return (
    <AppText variant="label" color={tone} style={styles.coverage}>
      {label}
    </AppText>
  );
}

function RailCard({
  game,
  section,
  item,
  width,
  onPress,
}: {
  game: Game;
  section: SectionKey;
  item: RecordItem;
  width: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale haptic={false} scaleTo={0.96} onPress={onPress} style={{ width }}>
      <RecordArt
        item={item}
        section={section}
        gameTitle={game.shortTitle}
        size={width}
        radius={Radii.card}
      />
      <AppText variant="caption" numberOfLines={1} style={styles.railName}>
        {item.name}
      </AppText>
      <AppText variant="caption" color={colors.textTertiary} numberOfLines={1}>
        {section === 'characters' ? item.role ?? 'Character' : item.category ?? 'Vehicle'}
      </AppText>
    </PressableScale>
  );
}

function formatDate(value?: string) {
  if (!value) return '—';
  const [year, month, day] = value.split('-').map(Number);
  const names = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  if (!year || !month || !day) return value;
  return `${day} ${names[month - 1]} ${year}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 60 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  topBar: {
    paddingHorizontal: Space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Space.md,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  identity: {
    flexDirection: 'row',
    gap: Space.lg,
    paddingHorizontal: Space.xl,
    paddingTop: Space.sm,
    paddingBottom: Space.lg,
  },
  coverWrap: { width: 108 },
  cover: {
    width: 108,
    height: 144,
    borderRadius: Radii.small,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  coverTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 4,
    justifyContent: 'center',
  },
  coverTagText: { fontSize: 8, letterSpacing: 0.9 },
  identityBody: { flex: 1, justifyContent: 'center', gap: 4 },
  identityTitle: { fontSize: 32, lineHeight: 34, letterSpacing: -0.7 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  tag: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    justifyContent: 'center',
  },
  tagText: { fontSize: 8.5, letterSpacing: 0.9 },
  meta: {
    marginHorizontal: Space.xl,
    paddingVertical: Space.md,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaCell: { flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  metaLabel: { fontSize: 9, letterSpacing: 1 },
  metaValue: { fontSize: 12.5 },
  metaRule: { width: StyleSheet.hairlineWidth * 2, height: 26 },
  notes: { paddingHorizontal: Space.xl, marginTop: Space.lg },
  block: { marginTop: Space.xxl },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.xl,
    marginBottom: Space.md,
  },
  chaptersHead: { marginTop: Space.xxl },
  chapters: {
    paddingHorizontal: Space.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.md,
  },
  chapter: {
    width: '47.5%',
    flexGrow: 1,
    padding: 14,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: 2,
  },
  chapterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chapterFoot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  chapterCount: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  coverage: { fontSize: 8.5, letterSpacing: 1 },
  rail: { paddingHorizontal: Space.xl, gap: Space.md },
  railName: { marginTop: 6 },
  footer: { paddingHorizontal: Space.xl, marginTop: Space.huge },
  footerText: { lineHeight: 18 },
});
