import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radii, Space, useTheme } from '@/theme';
import { hapticTap } from '@/lib/haptics';

export type IconName = keyof typeof Ionicons.glyphMap;

export function Icon({
  name,
  size = 20,
  color,
  style,
}: {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: TextStyle;
}) {
  const { colors } = useTheme();
  return (
    <Ionicons
      name={name as IconName}
      size={size}
      color={color ?? colors.text}
      style={style}
    />
  );
}

type Variant = 'display' | 'title' | 'headline' | 'body' | 'callout' | 'label' | 'caption';

export function AppText({
  variant = 'body',
  color,
  style,
  children,
  ...props
}: TextProps & { variant?: Variant; color?: string }) {
  const { colors } = useTheme();
  return (
    <Text
      allowFontScaling
      {...props}
      style={[styles[variant], { color: color ?? colors.text }, style]}>
      {children}
    </Text>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressProps = PressableProps & {
  scaleTo?: number;
  haptic?: boolean;
};

export const PressableScale = forwardRef<View, PressProps>(function PressableScale(
  { scaleTo = 0.97, haptic = true, onPressIn, onPressOut, style, children, ...props },
  ref
) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      ref={ref as never}
      {...props}
      onPressIn={(event) => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 420, mass: 0.5 }); // eslint-disable-line react-hooks/immutability
        if (haptic) hapticTap();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 16, stiffness: 320, mass: 0.6 }); // eslint-disable-line react-hooks/immutability
        onPressOut?.(event);
      }}
      style={[animated, style as never]}>
      {children}
    </AnimatedPressable>
  );
});

export function Screen({
  children,
  edges = ['top'],
  style,
  ...props
}: ViewProps & { edges?: ('top' | 'bottom' | 'left' | 'right')[] }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: colors.bg }, style]}
      {...props}>
      {children}
    </SafeAreaView>
  );
}

export function Chip({
  label,
  active,
  onPress,
  count,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  count?: number;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={() => {
        hapticTap();
        onPress?.();
      }}
      scaleTo={0.95}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accent : colors.surface,
          borderColor: active ? colors.accent : colors.line,
        },
      ]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={13}
          color={active ? colors.accentInk : colors.textSecondary}
        />
      ) : null}
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.accentInk : colors.textSecondary },
        ]}>
        {label}
        {typeof count === 'number' ? `  ${count}` : ''}
      </Text>
    </PressableScale>
  );
}

export function Badge({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'success';
  icon?: IconName;
}) {
  const { colors } = useTheme();
  const toneStyle =
    tone === 'accent'
      ? { bg: colors.accentSoft, fg: colors.accent }
      : tone === 'success'
        ? // Verified is brand yellow, not a second accent green.
          { bg: colors.accentSoft, fg: colors.accent }
        : { bg: colors.surfaceRaised, fg: colors.textSecondary };
  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.bg }]}>
      {icon ? <Ionicons name={icon} size={11} color={toneStyle.fg} /> : null}
      <Text style={[styles.badgeText, { color: toneStyle.fg }]}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionLabelDot, { backgroundColor: colors.accent }]} />
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }, style]}>{children}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: ViewProps['style'] }) {
  const { colors } = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }, style]} />;
}

export function EmptyState({
  icon = 'search',
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Ionicons name={icon} size={26} color={colors.textSecondary} />
      </View>
      <AppText variant="headline" style={{ marginTop: Space.lg, textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText
        variant="callout"
        color={colors.textSecondary}
        style={{ marginTop: Space.sm, textAlign: 'center', maxWidth: 280 }}>
        {body}
      </AppText>
      {action ? <View style={{ marginTop: Space.xl }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  display: {
    fontFamily: Fonts.display,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  headline: {
    fontFamily: Fonts.semibold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 21,
  },
  callout: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
  },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    lineHeight: 15,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    height: 34,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  chipText: {
    fontFamily: Fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.small,
  },
  badgeText: {
    fontFamily: Fonts.semibold,
    fontSize: 10.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabelDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  sectionLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space.xl,
    paddingVertical: Space.huge,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: Radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
