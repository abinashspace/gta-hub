import 'react-native-gesture-handler';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { StoreProvider } from '@/lib/store';
import { useTheme, ThemeProvider } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <RootNavigator />
      </StoreProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { colors, mode } = useTheme();
  const [fontsLoaded] = useFonts({
    RussoOne: require('../../assets/fonts/RussoOne-Regular.ttf'),
    ChakraPetch: require('../../assets/fonts/ChakraPetch-Regular.ttf'),
    ChakraPetchMedium: require('../../assets/fonts/ChakraPetch-Medium.ttf'),
    ChakraPetchSemiBold: require('../../assets/fonts/ChakraPetch-SemiBold.ttf'),
    ChakraPetchBold: require('../../assets/fonts/ChakraPetch-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={[styles.boot, { backgroundColor: colors.bg }]} />;

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'ios_from_right',
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="games/[slug]/index" />
        <Stack.Screen name="games/[slug]/[section]" />
        <Stack.Screen name="browse/[section]" />
        <Stack.Screen
          name="search"
          options={{
            presentation: 'modal',
            animation: 'fade_from_bottom',
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="record/[slug]/[section]/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: colors.sheet },
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1 },
});
