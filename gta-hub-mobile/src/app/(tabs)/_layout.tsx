import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Fonts, useTheme } from '@/theme';

const TABS: Record<string, { active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }> = {
  index: { active: 'home', idle: 'home-outline' },
  library: { active: 'albums', idle: 'albums-outline' },
  you: { active: 'bookmark', idle: 'bookmark-outline' },
};

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth * 2,
          height: Platform.OS === 'ios' ? 84 : 66,
          paddingTop: 9,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.semibold,
          fontSize: 10,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TABS[route.name] ?? TABS.index;
          return (
            <View style={styles.iconWrap}>
              <Ionicons
                name={focused ? icons.active : icons.idle}
                size={21}
                color={typeof color === 'string' ? color : colors.textTertiary}
              />
              {focused ? (
                <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
              ) : null}
            </View>
          );
        },
      })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="you" options={{ title: 'You' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', height: 26 },
  activeDot: {
    position: 'absolute',
    bottom: -7,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
