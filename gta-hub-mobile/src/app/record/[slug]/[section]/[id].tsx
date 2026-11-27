import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Badge, PressableScale } from '@/components/ui';
import { hapticSelect, hapticSuccess } from '@/lib/haptics';
import type { SectionKey } from '@/lib/library';
import {
  SECTIONS,
  gamesBySlug,
  imageUrl,
  isSectionKey,
  recordFacts,
  recordKey,
  recordName,
  recordSubtitle,
  sectionItems,
  sortRecords,
} from '@/lib/library';
import { useStore } from '@/lib/store';
import { Radii, Space, useTheme } from '@/theme';

export default function RecordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ slug?: string; section?: string; id?: string }>();
  const { isSaved, toggleSave, pushRecent } = useStore();
  const [copied, setCopied] = useState<string | null>(null);

  const game = params.slug ? gamesBySlug[params.slug] : undefined;
  const section: SectionKey = isSectionKey(params.section) ? params.section : 'characters';
  const meta = SECTIONS.find((entry) => entry.key === section)!;

  const ordered = useMemo(
    () => (game ? sortRecords(sectionItems(game, section), section) : []),
    [game, section]
  );
  const index = ordered.findIndex((entry) => entry.id === params.id);
  const item = index >= 0 ? ordered[index] : undefined;
  const key = item && game ? recordKey(game.slug, section, item.id) : '';
  const previous = index > 0 ? ordered[index - 1] : undefined;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined;

  useEffect(() => {
    if (key) pushRecent(key);
  }, [key, pushRecent]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!game || !item) {
    return (
      <View style={[styles.missing, { backgroundColor: colors.sheet }]}>
        <AppText variant="title">Record not found</AppText>
        <Pressable onPress={() => router.back()}>
          <AppText color={colors.accent}>Close</AppText>
        </Pressable>
      </View>
    );
  }

  const facts = recordFacts(item, section);
  const uri = imageUrl(item.image);
  const title = recordName(item, section);
  const subtitle = recordSubtitle(item, section);
  const saved = isSaved(key);

  const go = (targetId: string) =>
    router.replace({
      pathname: '/record/[slug]/[section]/[id]',
      params: { slug: game.slug, section, id: targetId },
    });

  const copyCode = async (code: string, platform: string) => {
    await Clipboard.setStringAsync(code).catch(() => {});
    setCopied(platform);
    hapticSuccess();
  };

  const bar = (
    <>
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Close record"
        style={[
          styles.heroBtn,
          uri ? null : [styles.flatBtn, { borderColor: colors.line }],
        ]}>
        <Ionicons
          name="chevron-down"
          size={19}
          color={uri ? '#F6F4EF' : colors.text}
        />
      </Pressable>
      <Pressable
        accessibilityLabel={saved ? 'Remove from saved' : 'Save record'}
        onPress={() => {
          toggleSave(key);
          hapticSelect();
        }}
        style={[
          styles.heroBtn,
          uri ? null : [styles.flatBtn, { borderColor: colors.line }],
        ]}>
        <Ionicons
          name={saved ? 'bookmark' : 'bookmark-outline'}
          size={17}
          color={saved ? colors.accent : uri ? '#F6F4EF' : colors.text}
        />
      </Pressable>
    </>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Hero — photo records get a full-bleed portrait; records without art
            get a flat typographic header so our type never sits on box art. */}
        {uri ? (
          <View style={styles.hero}>
            <Image
              source={{ uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={260}
              cachePolicy="memory-disk"
            />
            <LinearGradient
              colors={['rgba(6,6,7,0.6)', 'rgba(6,6,7,0.1)', 'rgba(6,6,7,0.62)', colors.bg]}
              locations={[0, 0.3, 0.68, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View style={[styles.heroTop, { paddingTop: insets.top + 8 }]}>{bar}</View>

            <View style={styles.heroBody}>
              <AppText variant="label" color={colors.accent}>
                {meta.singular} · {game.shortTitle} · {game.year}
              </AppText>
              <AppText variant="display" color="#F6F4EF" style={styles.heroTitle}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText variant="callout" color="rgba(246,244,239,0.72)" numberOfLines={2}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={{ paddingTop: insets.top + 8 }}>
            <View style={styles.flatBar}>{bar}</View>
            <View style={styles.flatHead}>
              <View
                style={[
                  styles.sectionBadge,
                  { borderColor: colors.line, backgroundColor: colors.surface },
                ]}>
                <Ionicons
                  name={meta.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={colors.accent}
                />
              </View>
              <AppText variant="label" color={colors.accent}>
                {meta.singular} · {game.shortTitle} · {game.year}
              </AppText>
              <AppText variant="display" style={styles.flatTitle}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText variant="callout" color={colors.textSecondary}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
          </View>
        )}

        {/* Facts */}
        {facts.length ? (
          <View style={styles.block}>
            <View style={styles.facts}>
              {facts.map((fact) => (
                <View key={fact.label} style={[styles.fact, { borderColor: colors.line }]}>
                  <AppText variant="label" color={colors.textTertiary} style={styles.factLabel}>
                    {fact.label}
                  </AppText>
                  <AppText variant="callout" style={styles.factValue}>
                    {fact.value}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Summary */}
        {item.summary ? (
          <View style={styles.block}>
            <AppText variant="label" color={colors.textSecondary} style={styles.blockLabel}>
              The file
            </AppText>
            <AppText variant="body" color={colors.text} style={styles.summary}>
              {item.summary}
            </AppText>
          </View>
        ) : null}

        {/* Cheat codes */}
        {section === 'cheats' && item.codes?.length ? (
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <AppText variant="label" color={colors.textSecondary}>
                The codes
              </AppText>
              <AppText variant="label" color={colors.textTertiary}>
                TAP TO COPY
              </AppText>
            </View>
            <View style={[styles.codes, { borderColor: colors.line }]}>
              {item.codes.map((code, codeIndex) => {
                const isCopied = copied === code.platform;
                return (
                  <Pressable
                    key={`${code.platform}-${codeIndex}`}
                    onPress={() => copyCode(code.code, code.platform)}
                    style={({ pressed }) => [
                      styles.codeRow,
                      codeIndex > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth * 2,
                        borderTopColor: colors.line,
                      },
                      pressed && { backgroundColor: colors.surfacePressed },
                    ]}>
                    <View style={styles.codeBody}>
                      <AppText variant="label" color={colors.textTertiary}>
                        {code.platform}
                        {code.input ? ` · ${code.input}` : ''}
                      </AppText>
                      <AppText selectable style={[styles.code, { color: colors.text }]}>
                        {code.code}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.copyBtn,
                        {
                          backgroundColor: isCopied ? colors.accent : 'transparent',
                          borderColor: isCopied ? colors.accent : colors.line,
                        },
                      ]}>
                      <Ionicons
                        name={isCopied ? 'checkmark' : 'copy-outline'}
                        size={14}
                        color={isCopied ? colors.accentInk : colors.textSecondary}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Provenance */}
        <View style={styles.block}>
          <View style={styles.provenance}>
            <Badge
              label={item.verified ? 'Verified' : 'Unverified'}
              tone={item.verified ? 'success' : 'neutral'}
              icon={item.verified ? 'checkmark-circle' : 'help-circle'}
            />
            {item.source ? (
              <AppText variant="caption" color={colors.textTertiary} style={styles.source}>
                {item.source}
              </AppText>
            ) : null}
          </View>
        </View>

        {/* Prev / next */}
        <View style={[styles.pager, { borderColor: colors.line }]}>
          <Pressable
            disabled={!previous}
            onPress={() => previous && go(previous.id)}
            style={({ pressed }) => [
              styles.pagerBtn,
              pressed && { backgroundColor: colors.surfacePressed },
              !previous && { opacity: 0.3 },
            ]}>
            <Ionicons name="arrow-back" size={15} color={colors.textSecondary} />
            <View style={styles.pagerBody}>
              <AppText variant="label" color={colors.textTertiary}>
                PREVIOUS
              </AppText>
              <AppText variant="caption" numberOfLines={1}>
                {previous ? recordName(previous, section) : 'Start of file'}
              </AppText>
            </View>
          </Pressable>
          <View style={[styles.pagerRule, { backgroundColor: colors.line }]} />
          <Pressable
            disabled={!next}
            onPress={() => next && go(next.id)}
            style={({ pressed }) => [
              styles.pagerBtn,
              styles.pagerRight,
              pressed && { backgroundColor: colors.surfacePressed },
              !next && { opacity: 0.3 },
            ]}>
            <View style={[styles.pagerBody, { alignItems: 'flex-end' }]}>
              <AppText variant="label" color={colors.textTertiary}>
                NEXT
              </AppText>
              <AppText variant="caption" numberOfLines={1}>
                {next ? recordName(next, section) : 'End of file'}
              </AppText>
            </View>
            <Ionicons name="arrow-forward" size={15} color={colors.textSecondary} />
          </Pressable>
        </View>

        <PressableScale
          onPress={() =>
            router.push({
              pathname: '/games/[slug]/[section]',
              params: { slug: game.slug, section },
            })
          }
          style={styles.openChapter}>
          <AppText variant="label" color={colors.accent}>
            OPEN ALL {meta.label.toUpperCase()} IN {game.shortTitle.toUpperCase()}
          </AppText>
          <Ionicons name="arrow-forward" size={12} color={colors.accent} />
        </PressableScale>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hero: { height: 380, justifyContent: 'flex-end' },
  flatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.lg,
    paddingBottom: Space.md,
  },
  flatBtn: { backgroundColor: 'transparent' },
  flatHead: { paddingHorizontal: Space.xl, paddingBottom: Space.lg, gap: 5 },
  sectionBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  flatTitle: { fontSize: 34, lineHeight: 36, letterSpacing: -0.9 },
  heroTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6,6,7,0.5)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(246,244,239,0.18)',
  },
  heroBody: { paddingHorizontal: Space.xl, paddingBottom: 22, gap: 4 },
  heroTitle: { fontSize: 40, lineHeight: 42, letterSpacing: -0.9 },
  block: { paddingHorizontal: Space.xl, marginTop: Space.xxl },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space.md,
  },
  blockLabel: { marginBottom: Space.sm },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  fact: {
    flexBasis: '46%',
    flexGrow: 1,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: 3,
  },
  factLabel: { fontSize: 9, letterSpacing: 1.2 },
  factValue: { lineHeight: 19 },
  summary: { lineHeight: 23 },
  codes: {
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  codeBody: { flex: 1, gap: 4 },
  code: {
    fontFamily: 'ChakraPetchSemiBold',
    fontSize: 15,
    letterSpacing: 0.4,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  provenance: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  source: { flex: 1, lineHeight: 16 },
  pager: {
    marginHorizontal: Space.xl,
    marginTop: Space.xxl,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  pagerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 62,
  },
  pagerRight: { justifyContent: 'flex-end' },
  pagerBody: { flex: 1, gap: 2 },
  pagerRule: { width: StyleSheet.hairlineWidth * 2 },
  openChapter: {
    marginHorizontal: Space.xl,
    marginTop: Space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
});
