import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RecordArt } from '@/components/record-art';
import { AppText } from '@/components/ui';
import { hapticTap } from '@/lib/haptics';
import type { Game, RecordItem, SectionKey } from '@/lib/library';
import { recordName, recordSubtitle } from '@/lib/library';
import { Radii, Space, useTheme } from '@/theme';

export function RecordRow({
  game,
  section,
  item,
  index,
  onPress,
  showGame = false,
  trailing,
}: {
  game: Game;
  section: SectionKey;
  item: RecordItem;
  index?: string;
  onPress?: () => void;
  showGame?: boolean;
  trailing?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const name = recordName(item, section);
  const subtitle = recordSubtitle(item, section);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${subtitle}`}
      onPress={() => {
        hapticTap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.lineSoft },
        pressed && { backgroundColor: colors.surfacePressed },
      ]}>
      {index ? (
        <AppText
          color={colors.textTertiary}
          style={styles.index}
          numberOfLines={1}>
          {index}
        </AppText>
      ) : null}

      <RecordArt item={item} section={section} gameTitle={game.shortTitle} size={54} radius={Radii.small} />

      <View style={styles.body}>
        <AppText variant="headline" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {showGame ? `${game.shortTitle}  ·  ${subtitle}` : subtitle || game.shortTitle}
        </AppText>
      </View>

      {trailing ?? (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingVertical: 11,
    paddingHorizontal: Space.xl,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    minHeight: 76,
  },
  index: {
    width: 22,
    textAlign: 'right',
    fontSize: 11,
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  body: { flex: 1, gap: 3 },
});
