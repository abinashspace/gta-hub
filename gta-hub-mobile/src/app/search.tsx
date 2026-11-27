import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecordArt } from '@/components/record-art';
import { AppText, Chip, Screen } from '@/components/ui';
import type { Game, SearchHit, SectionKey } from '@/lib/library';
import {
  SECTIONS,
  games,
  recordName,
  recordSubtitle,
  searchRecords,
  searchIndex,
  totalRecords,
} from '@/lib/library';
import { useStore } from '@/lib/store';
import { Radii, Space, useTheme } from '@/theme';

type Scope = 'all' | SectionKey;

type Row =
  | { type: 'heading'; key: string; title: string; count: number }
  | { type: 'record'; key: string; hit: SearchHit }
  | { type: 'game'; key: string; game: Game };

const SUGGESTIONS = ['Vice City', 'Infernus', 'Big Smoke', 'Cheats', 'Hydra', 'Tommy Vercetti'];

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { searches, pushSearch, clearSearches, recents } = useStore();
  const inputRef = useRef<any>(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');

  const clean = query.trim();
  const active = clean.length >= 2;

  const gameHits = useMemo(() => {
    if (!active) return [];
    const needle = clean.toLowerCase();
    return games.filter((game) =>
      [game.title, game.shortTitle, game.year, ...game.cities, ...game.protagonists]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [active, clean]);

  const recordHits = useMemo(
    () => (active ? searchRecords(clean, { section: scope, limit: 60 }) : []),
    [active, clean, scope]
  );

  const rows = useMemo<Row[]>(() => {
    if (!active) return [];
    const next: Row[] = [];
    if (scope === 'all' && gameHits.length) {
      next.push({ type: 'heading', key: 'games-head', title: 'Games', count: gameHits.length });
      gameHits.forEach((game) => next.push({ type: 'game', key: `g-${game.slug}`, game }));
    }
    for (const section of SECTIONS) {
      if (scope !== 'all' && scope !== section.key) continue;
      const hits = recordHits.filter((hit) => hit.section === section.key);
      if (!hits.length) continue;
      next.push({
        type: 'heading',
        key: `${section.key}-head`,
        title: section.label,
        count: hits.length,
      });
      hits.forEach((hit) => next.push({ type: 'record', key: hit.key, hit }));
    }
    return next;
  }, [active, gameHits, recordHits, scope]);

  const total = (scope === 'all' ? gameHits.length : 0) + recordHits.length;

  const openHit = (hit: SearchHit) => {
    pushSearch(clean);
    router.push({
      pathname: '/record/[slug]/[section]/[id]',
      params: { slug: hit.game.slug, section: hit.section, id: hit.item.id },
    });
  };

  return (
    <Screen edges={['top']}>
      <View style={[styles.searchRow, { paddingTop: 10 }]}>
        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Ionicons name="search" size={17} color={colors.textSecondary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => {
              if (clean) pushSearch(clean);
            }}
            autoFocus
            placeholder={`Search ${totalRecords.toLocaleString('en-US')} records`}
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.accent}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={[styles.input, { color: colors.text }]}
          />
          {query.length > 0 ? (
            <Pressable
              hitSlop={10}
              accessibilityLabel="Clear search"
              onPress={() => {
                setQuery('');
                inputRef.current?.focus();
              }}>
              <Ionicons name="close-circle" size={17} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          hitSlop={10}
          onPress={() => router.back()}
          accessibilityLabel="Cancel search"
          style={styles.cancel}>
          <AppText variant="callout" color={colors.accent}>
            Cancel
          </AppText>
        </Pressable>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 60 }]}
        ListHeaderComponent={
          active ? (
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scopeRow}>
                <Chip
                  label="All"
                  active={scope === 'all'}
                  count={active ? total : undefined}
                  onPress={() => setScope('all')}
                />
                {SECTIONS.map((section) => {
                  const count = searchIndex.filter(
                    (hit) =>
                      hit.section === section.key &&
                      hit.haystack.includes(clean.toLowerCase())
                  ).length;
                  return (
                    <Chip
                      key={section.key}
                      label={section.label}
                      count={count || undefined}
                      active={scope === section.key}
                      onPress={() => setScope(section.key)}
                    />
                  );
                })}
              </ScrollView>
              {total === 0 ? (
                <View style={styles.noResults}>
                  <View style={[styles.noIcon, { borderColor: colors.line }]}>
                    <Ionicons name="file-tray-outline" size={24} color={colors.textSecondary} />
                  </View>
                  <AppText variant="headline" style={{ textAlign: 'center' }}>
                    No file matches “{clean}”
                  </AppText>
                  <AppText
                    variant="callout"
                    color={colors.textSecondary}
                    style={styles.noBody}>
                    Try a game, a character, a car, or a cheat effect.
                  </AppText>
                </View>
              ) : (
                <AppText variant="label" color={colors.textTertiary} style={styles.resultCount}>
                  {total} {total === 1 ? 'RESULT' : 'RESULTS'}
                </AppText>
              )}
            </View>
          ) : (
            <IdleState
              searches={searches}
              recents={recents}
              onPick={(value) => setQuery(value)}
              onClear={clearSearches}
              onRecent={(key) => {
                const [slug, section, ...rest] = key.split(':');
                const id = rest.join(':');
                const hit = searchIndex.find(
                  (entry) => entry.game.slug === slug && entry.section === section && entry.item.id === id
                );
                if (hit) openHit(hit);
              }}
            />
          )
        }
        renderItem={({ item }) => {
          if (item.type === 'heading') {
            return (
              <View style={styles.groupHead}>
                <AppText variant="label" color={colors.textSecondary}>
                  {item.title}
                </AppText>
                <AppText variant="label" color={colors.textTertiary}>
                  {item.count}
                </AppText>
              </View>
            );
          }
          if (item.type === 'game') {
            return (
              <Pressable
                onPress={() => {
                  pushSearch(clean);
                  router.push({ pathname: '/games/[slug]', params: { slug: item.game.slug } });
                }}
                style={({ pressed }) => [
                  styles.resultRow,
                  { borderBottomColor: colors.lineSoft },
                  pressed && { backgroundColor: colors.surfacePressed },
                ]}>
                <View style={styles.gameRow}>
                  <View style={[styles.gameYear, { borderColor: colors.line }]}>
                    <AppText variant="label" color={colors.accent}>
                      {item.game.year}
                    </AppText>
                  </View>
                  <View style={styles.rowBody}>
                    <AppText variant="headline" numberOfLines={1}>
                      <Highlight text={item.game.shortTitle} query={clean} />
                    </AppText>
                    <AppText variant="caption" color={colors.textTertiary} numberOfLines={1}>
                      Game · {item.game.cities[0] ?? item.game.setting}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
                </View>
              </Pressable>
            );
          }
          return (
            <Pressable
              onPress={() => openHit(item.hit)}
              style={({ pressed }) => [
                styles.resultRow,
                { borderBottomColor: colors.lineSoft },
                pressed && { backgroundColor: colors.surfacePressed },
              ]}>
              <View style={styles.hitRow}>
                <RecordArt
                  item={item.hit.item}
                  section={item.hit.section}
                  gameTitle={item.hit.game.shortTitle}
                  size={46}
                  radius={Radii.small}
                />
                <View style={styles.rowBody}>
                  <AppText variant="headline" numberOfLines={1}>
                    <Highlight text={recordName(item.hit.item, item.hit.section)} query={clean} />
                  </AppText>
                  <AppText variant="caption" color={colors.textTertiary} numberOfLines={1}>
                    {item.hit.game.shortTitle}
                    {recordSubtitle(item.hit.item, item.hit.section)
                      ? `  ·  ${recordSubtitle(item.hit.item, item.hit.section)}`
                      : ''}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

function IdleState({
  searches,
  recents,
  onPick,
  onClear,
  onRecent,
}: {
  searches: string[];
  recents: string[];
  onPick: (value: string) => void;
  onClear: () => void;
  onRecent: (key: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.idle}>
      {searches.length > 0 ? (
        <View style={styles.idleBlock}>
          <View style={styles.idleHead}>
            <AppText variant="label" color={colors.textSecondary}>
              Recent searches
            </AppText>
            <Pressable onPress={onClear} hitSlop={10}>
              <AppText variant="label" color={colors.textTertiary}>
                CLEAR
              </AppText>
            </Pressable>
          </View>
          {searches.map((value) => (
            <Pressable
              key={value}
              onPress={() => onPick(value)}
              style={({ pressed }) => [
                styles.recentRow,
                { borderBottomColor: colors.lineSoft },
                pressed && { backgroundColor: colors.surfacePressed },
              ]}>
              <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
              <AppText variant="body" style={{ flex: 1 }} numberOfLines={1}>
                {value}
              </AppText>
              <Ionicons name="arrow-up-outline" size={14} color={colors.textTertiary} style={styles.recentArrow} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.idleBlock}>
        <AppText variant="label" color={colors.textSecondary} style={styles.idleHead}>
          Try
        </AppText>
        <View style={styles.chips}>
          {SUGGESTIONS.map((value) => (
            <Chip key={value} label={value} onPress={() => onPick(value)} />
          ))}
        </View>
      </View>

      {recents.length > 0 ? (
        <View style={styles.idleBlock}>
          <AppText variant="label" color={colors.textSecondary} style={styles.idleHead}>
            Last opened
          </AppText>
          <View style={styles.chips}>
            {recents.slice(0, 5).map((key) => (
              <Chip key={key} label={key.split(':')[2]?.replace(/-/g, ' ') ?? 'record'} onPress={() => onRecent(key)} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={[styles.tip, { borderColor: colors.line }]}>
        <Ionicons name="sparkles-outline" size={15} color={colors.accent} />
        <AppText variant="caption" color={colors.textSecondary} style={styles.tipText}>
          Search works across all {totalRecords.toLocaleString('en-US')} records — try a name, a
          car, a city, or a cheat effect like “tank”.
        </AppText>
      </View>
    </View>
  );
}

function Highlight({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const { colors } = useTheme();
  if (!query) return <>{text}</>;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <Text style={{ color: colors.accent }}>{text.slice(index, index + query.length)}</Text>
      {text.slice(index + query.length)}
    </>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Space.lg,
    paddingBottom: Space.md,
  },
  field: {
    flex: 1,
    height: 46,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 15, padding: 0, fontFamily: 'ChakraPetch' },
  cancel: { paddingVertical: 8 },
  list: { paddingBottom: 60 },
  scopeRow: { paddingHorizontal: Space.lg, gap: Space.sm, paddingVertical: Space.md },
  resultCount: {
    paddingHorizontal: Space.xl,
    paddingTop: Space.sm,
    paddingBottom: Space.sm,
    letterSpacing: 1.4,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.xl,
    paddingTop: Space.lg,
    paddingBottom: 6,
  },
  resultRow: {
    paddingHorizontal: Space.xl,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  hitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  gameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  gameYear: {
    width: 46,
    height: 34,
    borderRadius: Radii.small,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  noResults: { paddingHorizontal: Space.xl, paddingTop: 48, alignItems: 'center', gap: 10 },
  noIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  noBody: { textAlign: 'center', maxWidth: 250 },
  idle: { paddingHorizontal: Space.xl, paddingTop: Space.sm, gap: Space.xxl },
  idleBlock: { gap: Space.sm },
  idleHead: { marginBottom: 2 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  recentArrow: { transform: [{ rotate: '45deg' }] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  tip: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginTop: Space.sm,
  },
  tipText: { flex: 1, lineHeight: 18 },
});
