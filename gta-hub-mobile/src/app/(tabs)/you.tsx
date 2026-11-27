import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { RecordArt } from '@/components/record-art';
import { RecordRow } from '@/components/record-row';
import { AppText, Chip, PressableScale, Screen } from '@/components/ui';
import { coverArt } from '@/data/art';
import { hapticSelect, hapticTap } from '@/lib/haptics';
import type { Game } from '@/lib/library';
import {
  games,
  gamesBySlug,
  findRecord,
  sectionTotals,
  totalRealImages,
  totalRecords,
} from '@/lib/library';
import { useStore } from '@/lib/store';
import { Fonts, Radii, Space, useTheme } from '@/theme';

export default function YouScreen() {
  const { colors, mode, setMode } = useTheme();
  const router = useRouter();
  const {
    profile,
    setProfile,
    saved,
    toggleSave,
    recents,
    clearRecents,
  } = useStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  const favorite = profile.favorite ? gamesBySlug[profile.favorite] : undefined;
  const savedRecords = useMemo(
    () => saved.map((key) => findRecord(key)).filter((entry): entry is NonNullable<typeof entry> => !!entry),
    [saved]
  );
  const recentRecords = useMemo(
    () => recents.map((key) => findRecord(key)).filter((entry): entry is NonNullable<typeof entry> => !!entry),
    [recents]
  );

  return (
    <Screen edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="label" color={colors.accent}>
            Your file
          </AppText>
          <AppText variant="display" style={styles.title}>
            YOU
          </AppText>
        </View>

        {/* Profile */}
        <View style={[styles.profile, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityLabel="Choose your favorite game"
            style={styles.avatarWrap}>
            {favorite ? (
              <Image
                source={coverArt[favorite.slug]}
                style={[styles.avatar, { borderColor: colors.line }]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
                <AppText style={[styles.avatarText, { color: colors.accent }]}>GT</AppText>
              </View>
            )}
            <View style={[styles.avatarBadge, { backgroundColor: colors.accent, borderColor: colors.bg }]}>
              <Ionicons name="pencil" size={10} color={colors.accentInk} />
            </View>
          </Pressable>

          <View style={styles.profileBody}>
            <TextInput
              value={profile.name}
              onChangeText={(name) => setProfile({ name })}
              placeholder="Your handle"
              placeholderTextColor={colors.textTertiary}
              maxLength={24}
              returnKeyType="done"
              style={[styles.nameInput, { color: colors.text }]}
            />
            <AppText variant="caption" color={colors.textTertiary}>
              {favorite ? `Riding for ${favorite.shortTitle}` : 'Pick a favorite game'}
              {'  ·  '}
              {saved.length} saved
            </AppText>
          </View>
        </View>

        {/* Favorite game */}
        <Pressable
          onPress={() => {
            hapticTap();
            setPickerOpen(true);
          }}
          style={({ pressed }) => [
            styles.row,
            { borderColor: colors.line, backgroundColor: pressed ? colors.surfacePressed : 'transparent' },
          ]}>
          <View style={[styles.rowIcon, { borderColor: colors.line }]}>
            <Ionicons name="star" size={16} color={colors.accent} />
          </View>
          <View style={styles.rowBody}>
            <AppText variant="headline">Favorite game</AppText>
            <AppText variant="caption" color={colors.textTertiary}>
              {favorite ? `${favorite.shortTitle} · ${favorite.year}` : 'Choose from all 17'}
            </AppText>
          </View>
          {favorite ? (
            <Image
              source={coverArt[favorite.slug]}
              style={[styles.rowCover, { borderColor: colors.line }]}
              contentFit="cover"
            />
          ) : null}
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>

        {/* Saved */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText variant="label" color={colors.textSecondary}>
              Saved
            </AppText>
            <AppText variant="label" color={colors.textTertiary}>
              {savedRecords.length}
            </AppText>
          </View>

          {savedRecords.length === 0 ? (
            <View style={[styles.empty, { borderColor: colors.line }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Ionicons name="bookmark-outline" size={22} color={colors.textSecondary} />
              </View>
              <AppText variant="headline" style={styles.emptyTitle}>
                Nothing filed yet
              </AppText>
              <AppText variant="callout" color={colors.textSecondary} style={styles.emptyBody}>
                Tap the bookmark on any record — a character, a car, a cheat — and it lands
                here.
              </AppText>
              <PressableScale
                onPress={() => router.push('/library')}
                style={[styles.emptyCta, { backgroundColor: colors.accent }]}>
                <AppText variant="label" color={colors.accentInk}>
                  BROWSE THE SAGA
                </AppText>
              </PressableScale>
            </View>
          ) : (
            <View style={[styles.savedList, { borderColor: colors.line }]}>
              {savedRecords.map((record) => (
                <RecordRow
                  key={record.key}
                  game={record.game}
                  section={record.section}
                  item={record.item}
                  showGame
                  onPress={() =>
                    router.push({
                      pathname: '/record/[slug]/[section]/[id]',
                      params: {
                        slug: record.game.slug,
                        section: record.section,
                        id: record.item.id,
                      },
                    })
                  }
                  trailing={
                    <Pressable
                      hitSlop={12}
                      accessibilityLabel={`Remove ${record.name} from saved`}
                      onPress={() => {
                        toggleSave(record.key);
                        hapticSelect();
                      }}>
                      <Ionicons name="bookmark" size={18} color={colors.accent} />
                    </Pressable>
                  }
                />
              ))}
            </View>
          )}
        </View>

        {/* Recents */}
        {recentRecords.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <AppText variant="label" color={colors.textSecondary}>
                Recently viewed
              </AppText>
              <Pressable onPress={clearRecents} hitSlop={10}>
                <AppText variant="label" color={colors.textTertiary}>
                  CLEAR
                </AppText>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentRail}>
              {recentRecords.map((record) => (
                <PressableScale
                  key={record.key}
                  haptic={false}
                  scaleTo={0.96}
                  onPress={() =>
                    router.push({
                      pathname: '/record/[slug]/[section]/[id]',
                      params: {
                        slug: record.game.slug,
                        section: record.section,
                        id: record.item.id,
                      },
                    })
                  }
                  style={styles.recentCard}>
                  <RecordArt
                    item={record.item}
                    section={record.section}
                    gameTitle={record.game.shortTitle}
                    size={96}
                    radius={Radii.card}
                  />
                  <AppText variant="caption" numberOfLines={1} style={styles.recentName}>
                    {record.name}
                  </AppText>
                  <AppText variant="caption" color={colors.textTertiary} numberOfLines={1}>
                    {record.game.shortTitle}
                  </AppText>
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Appearance */}
        <View style={styles.section}>
          <AppText variant="label" color={colors.textSecondary} style={styles.sectionHead}>
            Appearance
          </AppText>
          <View style={styles.modeRow}>
            {(['system', 'light', 'dark'] as const).map((option) => (
              <Chip
                key={option}
                label={option === 'system' ? 'System' : option === 'light' ? 'Light' : 'Dark'}
                active={mode === option}
                onPress={() => setMode(option)}
              />
            ))}
          </View>
        </View>

        {/* Archive stats */}
        <View style={[styles.stats, { borderColor: colors.line }]}>
          <Stat value={totalRecords.toLocaleString('en-US')} label="Records" />
          <View style={[styles.statRule, { backgroundColor: colors.line }]} />
          <Stat value="17" label="Games" />
          <View style={[styles.statRule, { backgroundColor: colors.line }]} />
          <Stat value={totalRealImages.toLocaleString('en-US')} label="Images" />
          <View style={[styles.statRule, { backgroundColor: colors.line }]} />
          <Stat value={sectionTotals.cheats.toLocaleString('en-US')} label="Cheats" />
        </View>

        <View style={styles.footer}>
          <AppText variant="caption" color={colors.textTertiary} style={styles.legal}>
            Saved items and your profile live on this device only. No account, no tracking,
            no server.
          </AppText>
          <AppText variant="label" color={colors.textTertiary} style={styles.version}>
            GTA HUB · FAN ARCHIVE · V1.0
          </AppText>
        </View>
      </ScrollView>

      <FavoritePicker
        open={pickerOpen}
        current={profile.favorite}
        onClose={() => setPickerOpen(false)}
        onPick={(game) => {
          setProfile({ favorite: game.slug });
          hapticSelect();
          setPickerOpen(false);
        }}
      />
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <AppText style={[styles.statValue, { color: colors.text }]}>{value}</AppText>
      <AppText variant="label" color={colors.textTertiary}>
        {label}
      </AppText>
    </View>
  );
}

function FavoritePicker({
  open,
  current,
  onClose,
  onPick,
}: {
  open: boolean;
  current: string | null;
  onClose: () => void;
  onPick: (game: Game) => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <Screen edges={['top', 'bottom']}>
        <View style={styles.pickerHead}>
          <View>
            <AppText variant="label" color={colors.accent}>
              Your file
            </AppText>
            <AppText variant="title">Favorite game</AppText>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={[styles.pickerClose, { borderColor: colors.line }]}>
            <Ionicons name="close" size={18} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerList}>
          {games.map((game) => {
            const active = current === game.slug;
            return (
              <Pressable
                key={game.slug}
                onPress={() => onPick(game)}
                style={({ pressed }) => [
                  styles.pickerRow,
                  { borderBottomColor: colors.lineSoft },
                  pressed && { backgroundColor: colors.surfacePressed },
                ]}>
                <Image source={coverArt[game.slug]} style={styles.pickerCover} contentFit="cover" />
                <View style={styles.pickerBody}>
                  <AppText variant="headline" color={active ? colors.accent : colors.text}>
                    {game.shortTitle}
                  </AppText>
                  <AppText variant="caption" color={colors.textTertiary}>
                    {game.year} · {game.cities[0] ?? game.setting}
                  </AppText>
                </View>
                {active ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Screen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  header: { paddingHorizontal: Space.xl, paddingTop: 12, gap: 4 },
  title: { fontSize: 38, lineHeight: 42, letterSpacing: -0.8 },
  profile: {
    marginHorizontal: Space.xl,
    marginTop: Space.lg,
    padding: 16,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: { width: 64, height: 64 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Fonts.display, fontSize: 20, letterSpacing: -0.5 },
  avatarBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  profileBody: { flex: 1, gap: 2 },
  nameInput: {
    fontFamily: Fonts.semibold,
    fontSize: 21,
    padding: 0,
    margin: 0,
    letterSpacing: -0.3,
  },
  row: {
    marginHorizontal: Space.xl,
    marginTop: Space.md,
    padding: 14,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowCover: { width: 34, height: 44, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth * 2 },
  section: { paddingHorizontal: Space.xl, marginTop: Space.xxl, gap: Space.md },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  empty: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { textAlign: 'center' },
  emptyBody: { textAlign: 'center', maxWidth: 260, marginBottom: 8 },
  emptyCta: { height: 40, paddingHorizontal: 18, borderRadius: Radii.pill, justifyContent: 'center' },
  savedList: {
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    marginHorizontal: -0,
  },
  recentRail: { gap: Space.md, paddingRight: Space.xl },
  recentCard: { width: 96, gap: 4 },
  recentName: { marginTop: 4 },
  modeRow: { flexDirection: 'row', gap: Space.sm },
  stats: {
    marginHorizontal: Space.xl,
    marginTop: Space.xxl,
    paddingVertical: Space.lg,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: 20,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  statRule: { width: StyleSheet.hairlineWidth * 2, height: 26 },
  footer: { paddingHorizontal: Space.xl, marginTop: Space.xxl, gap: 14 },
  legal: { lineHeight: 17 },
  version: { letterSpacing: 1.4 },
  pickerHead: {
    paddingHorizontal: Space.xl,
    paddingVertical: Space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerList: { paddingBottom: 40 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: Space.xl,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  pickerCover: { width: 40, height: 52, borderRadius: 6 },
  pickerBody: { flex: 1, gap: 2 },
});
