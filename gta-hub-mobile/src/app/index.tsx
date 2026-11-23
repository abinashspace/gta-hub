import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  AppState,
  AppStateStatus,
  RefreshControl,
} from 'react-native';
import { useFonts, RussoOne, ChakraPetch } from '@expo-google-fonts/russo-one';
import { useFonts as useFonts2, ChakraPetch as ChakraPetch2 } from '@expo-google-fonts/chakra-petch';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// GTA-inspired color palette
// Midnight City - deep blues like GTA V's night atmosphere
// Neon accents - purple/pink like GTA's neon lighting
// Yellow accent - GTA series signature color
const LIGHT = {
  bg: '#E8EDF5',
  bgSoft: '#FFFFFF',
  bgElev: '#F5F7FF',
  line: '#CBD5E1',
  lineSoft: '#E2E8F0',
  fg: '#0F172A',
  fgSoft: '#475569',
  fgDim: '#64748B',
  accent: '#A855F7', // Purple neon
  accentStrong: '#9F7AEA',
  accentInk: '#FFFFFF',
  ok: '#10B981', // Green like GTA success
  warn: '#F59E0B', // GTA yellow accent
  info: '#3B82F6', // Blue
  danger: '#EF4444', // Red
};

const DARK = {
  bg: '#0F0F23',
  bgSoft: '#111827',
  bgElev: '#1E293B',
  bgElev2: '#334155',
  line: '#0f172a',
  lineSoft: '#1e293b',
  fg: '#F8FAFC',
  fgSoft: '#94A3B8',
  fgDim: '#64748B',
  accent: '#F472B6', // Neon pink
  accentStrong: '#EC4899',
  accentInk: '#FFFFFF',
  ok: '#22C55E',
  warn: '#F59E0B', // GTA yellow
  info: '#60A5FA',
  danger: '#F87171',
};

const useAppFonts = () => {
  const [russoLoaded] = useFonts({
    RussoOne: require('@expo-google-fonts/russo-one/RussoOne-Regular.ttf'),
  });
  const [chakraLoaded] = useFonts({
    ChakraPetch: require('@expo-google-fonts/chakra-petch/ChakraPetch-Regular.ttf'),
  });
  return russoLoaded && chakraLoaded;
};

const useAppTheme = () => {
  const scheme = useColorScheme();
  const stored = JSON.parse(localStorage.getItem('gta-theme') || '{"theme":"dark"}');
  const theme = stored.theme || scheme;
  const style = theme === 'dark' ? DARK : LIGHT;
  return { theme, style, setTheme: (t: string) => { localStorage.setItem('gta-theme', JSON.stringify({ theme: t })); } };
};

const HomeScreen = () => {
  const { setTheme } = useAppTheme();
  const navigation = useNavigation();
  const [games, setGames] = useState([]);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.current);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const subscribe = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });
    return () => subscribe();
  }, []);

  useEffect(() => {
    const loadGames = async () => {
      setIsLoading(true);
      // Simulated game library data with delay for loading state
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const sampleGames = [
        { id: 1, name: 'GTA V', slug: 'gta-v', section: 'vehicles' },
        { id: 2, name: 'GTA San Andreas', slug: 'gta-san-andreas', section: 'missions' },
        { id: 3, name: 'GTA Vice City', slug: 'gta-vice-city', section: 'characters' },
        { id: 4, name: 'GTA III', slug: 'gta-iii', section: 'missions' },
        { id: 5, name: 'GTA Vice City Stories', slug: 'gta-vice-city-stories', section: 'missions' },
        { id: 6, name: 'GTA Liberty City Stories', slug: 'gta-liberty-city-stories', section: 'missions' },
        { id: 7, name: 'GTA IV', slug: 'gta-iv', section: 'missions' },
        { id: 8, name: 'GTA: Chinatown Wars', slug: 'gta-chinatown-wars', section: 'missions' },
        { id: 9, name: 'GTA: Advance', slug: 'gta-advance', section: 'missions' },
        { id: 10, name: 'GTA: Liberty Stories', slug: 'gta-liberty-stories', section: 'missions' },
        { id: 11, name: 'GTA V (2nd)', slug: 'gta-v', section: 'vehicles' },
        { id: 12, name: 'GTA San Andreas (2nd)', slug: 'gta-san-andreas', section: 'characters' },
        { id: 13, name: 'GTA Online', slug: 'gta-online', section: 'missions' },
        { id: 14, name: 'GTA VI', slug: 'gta-vi', section: 'characters' },
        { id: 15, name: 'GTA: The Ballad of Gay Tony', slug: 'gta-ballad', section: 'missions' },
        { id: 16, name: 'GTA: Liberty City Stories', slug: 'gta-liberty', section: 'vehicles' },
        { id: 17, name: 'GTA: San Andreas MP', slug: 'gta-samp', section: 'missions' },
      ];
      setGames(sampleGames);
      setIsLoading(false);
    };
    loadGames();
  }, [navigation]);

  // Pulse animation for the GTA logo
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => p + 1), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      {/* Glassmorphism header with pulse animation */}
      <View style={[styles.homeHeader, { background: `rgba(255,255,255,0.03)` }]}>
        <Text style={styles.headerPulse}>GTA Hub</Text>
        <Text style={styles.subtitle}>Grand Theft Auto Encyclopedia</Text>
      </View>

      {/* Search bar with glass effect */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchPlaceholder}>Search GTA hub…</Text>
        </View>
      </View>

      {/* Game grid with staggered animation */}
      <View style={styles.gameGrid}>
        {isLoading ? (
          <View style={styles.loadingSkeleton}>
            <AnimatedIcon />
          </View>
        ) : (
          games.map((game) => (
            <View
              key={game.id}
              style={styles.gameCardPreview}
              onPress={() => navigation.navigate('GameDetail', { game: game.slug, section: game.section })}
            >
              <Text style={styles.cardText}>{game.name}</Text>
            </View>
          ))
        )}
      </View>

      {/* Theme toggle with improved design */}
      <View style={styles.themeToggle}>
        <TouchableOpacity onPress={setTheme} style={styles.themeBtn}>
          <Text style={styles.themeText}>{DARK.bg === '#0F0F23' ? 'Light Mode' : 'Dark Mode'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SearchScreen = () => {
  const { setTheme } = useAppTheme();
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (text: string) => {
    setQuery(text);
    setIsSearching(true);
    const simulatedResults = [
      { id: 1, title: 'GTA V - Vehicles', snippet: 'Includes cars, bikes, aircraft' },
      { id: 2, title: 'GTA San Andreas - Missions', snippet: 'Includes 100+ missions' },
      { id: 3, title: 'GTA Vice City - Characters', snippet: 'Includes main characters' },
    ].filter((item) => item.title.toLowerCase().includes(text.toLowerCase()));
    setResults(simulatedResults);
    setIsSearching(false);
  };

  return (
    <View style={styles.container}>
      {/* Glassmorphism search header */}
      <View style={[styles.header, { background: `rgba(15, 15, 35, 0.8)` }]}>
        <Text style={styles.headerText}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Search records..."
            value={query}
            onChangeText={handleSearch}
            style={styles.input}
            autoCapitalize="none"
          />
        </View>
      </View>

      {results.length > 0 && (
        <View style={styles.resultsList}>
          {results.map((result) => (
            <View key={result.id} style={styles.resultItem}>
              <Text style={styles.resultText}>{result.title}</Text>
              <Text style={styles.resultSnippet}>{result.snippet}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.backButton}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to Library</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const GameDetailScreen = ({ route }: any) => {
  const { game } = route.params;
  const [section, setSection] = useState('vehicles');
  const { setTheme } = useAppTheme();

  const gtaVData = {
    vehicles: [
      { name: 'Pinnacle', description: 'Super sports car' },
      { name: 'Buffalo', description: 'Muscle car' },
      { name: 'Comet', description: 'Classic sports car' },
    ],
    characters: [
      { name: 'Michael', description: 'Retired bank robber' },
      { name: 'Franklin', description: 'Street dealer turned actor' },
      { name: 'Trevor', description: 'Unstable meth dealer' },
    ],
    missions: [
      { name: 'The Prologue', description: 'Introduction to the story' },
      { name: 'The Paleto Score', description: 'Heist at Paleto Bay' },
      { name: 'The Big Score', description: 'Ultimate heist' },
    ],
  };

  const sections = {
    vehicles: { title: 'Vehicles', data: gtaVData.vehicles },
    characters: { title: 'Characters', data: gtaVData.characters },
    missions: { title: 'Missions', data: gtaVData.missions },
  };

  return (
    <View style={styles.container}>
      {/* Game detail header with back button and theme toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{game.toUpperCase()}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={setTheme} style={styles.themeBtnSmall}>
            <Text style={styles.themeTextSmall}>{DARK.bg === '#0F0F23' ? 'Light' : 'Dark'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {Object.keys(sections).map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => setSection(key)}
            style={[
              styles.tabButton,
              { backgroundColor: section === key ? DARK.accent : DARK.bgElev },
            ]}
          >
            <Text style={styles.tabText}>{sections[key].title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.contentArea}>
        <View style={styles.sectionTitle}>
          <Text>{sections[section].title}</Text>
        </View>

        <View style={styles.sectionContent}>
          {sections[section].data.map((item: any, i: number) => (
            <View key={i} style={styles.sectionItem}>
              <Text style={styles.fontRussoOne}>{item.name}</Text>
              <Text style={styles.fontChakraPetch}>{item.description}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const TabNavigator = () => {
  const { navigate } = useNavigation();

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabItem} onPress={() => navigate('Home')}>
        <Text style={styles.tabText}>🚗 Games</Text>
      </View>
      <View style={styles.tabItem} onPress={() => navigate('Search')}>
        <Text style={styles.tabText}>🔍 Search</Text>
      </View>
      <View style={styles.tabItem} onPress={() => navigate('Detail')}>
        <Text style={styles.tabText}>📊 Data</Text>
      </View>
    </View>
  );
};

// ── Tab Navigator using expo-router file routing ──────────────────────
export default function GtaHubApp() {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return null;
  }

  return null; // expo-router handles navigation via file structure
}

// ── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },

  homeHeader: {
    padding: 32,
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: DARK.line,
    background: `rgba(15, 15, 35, 0.8)`,
    backdropFilter: 'blur(10px)',
  },
  subtitle: {
    marginTop: 4,
    fontFamily: 'ChakraPetch',
    fontSize: 14,
    color: DARK.fgDim,
  },

  // Pulse effect for header text
  headerPulse: {
    fontFamily: 'RussoOne',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: DARK.accent,
    textShadowColor: DARK.accent,
    textShadowRadius: 8,
  },

  // Game detail screen header styles
  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK.line,
    background: `rgba(15, 15, 35, 0.8)`,
    backdropFilter: 'blur(10px)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backArrow: {
    fontFamily: 'ChakraPetch',
    fontSize: 20,
    color: DARK.fgDim,
  },
  title: {
    fontFamily: 'RussoOne',
    fontSize: 22,
    color: DARK.fg,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerText: {
    fontFamily: 'RussoOne',
    fontSize: 24,
    fontWeight: '700',
    color: DARK.fg,
  },
  themeBtnSmall: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: DARK.bgElev,
  },
  themeTextSmall: {
    color: DARK.fgSoft,
    fontFamily: 'ChakraPetch',
    fontSize: 12,
  },

  searchContainer: {
    margin: 24,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK.bgElev,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },

  gameGrid: {
    marginHorizontal: 24,
    marginVertical: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  gameCardPreview: {
    width: '45%',
    aspectRatio: 3 / 4,
    backgroundColor: DARK.bgElev,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  cardBadge: {
    width: '100%',
    padding: 20,
    textAlign: 'center',
    background: `rgba(255,255,255,0.03)`,
  },
  cardText: {
    color: DARK.fg,
    fontFamily: 'RussoOne',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  themeToggle: {
    padding: 20,
    margin: 32,
    borderTopWidth: 1,
    borderTopColor: DARK.line,
    paddingBottom: 32,
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: DARK.bgElev,
    borderRadius: 28,
  },
  themeText: {
    color: DARK.fgSoft,
    fontFamily: 'ChakraPetch',
    fontSize: 14,
  },

  // Loading skeleton
  loadingSkeleton: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search screen styles
  searchInput: {
    height: 48,
    backgroundColor: DARK.bg,
    borderRadius: 24,
    paddingHorizontal: 20,
    color: DARK.fg,
    fontFamily: 'ChakraPetch',
    fontSize: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    }),
  },

  resultsList: {
    marginTop: 16,
    maxHeight: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: DARK.bgElev,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    }),
  },
  resultItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: DARK.bgElev,
    marginBottom: 12,
    transitionBackground: 'background-color 0.2s',
  },
  resultText: {
    fontFamily: 'ChakraPetch',
    fontSize: 16,
    color: DARK.fg,
    fontWeight: '500',
  },
  resultSnippet: {
    fontFamily: 'ChakraPetch',
    fontSize: 13,
    color: DARK.fgDim,
    marginTop: 4,
  },
  backButton: {
    padding: 20,
  },
  backText: {
    color: DARK.accent,
    fontFamily: 'ChakraPetch',
    fontSize: 16,
    fontWeight: '500',
  },

  // Game detail screen styles
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: DARK.line,
    backgroundColor: DARK.bgElev,
    borderRadius: 20,
    marginBottom: 24,
  },
  tabButton: {
    padding: 12,
    borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    }),
  },
  tabText: {
    fontFamily: 'ChakraPetch',
    fontSize: 14,
    color: DARK.fgDim,
  },
  contentArea: {
    flex: 1,
    padding: 32,
  },
  sectionTitle: {
    fontFamily: 'RussoOne',
    fontSize: 24,
    color: DARK.fg,
    marginBottom: 28,
    letterSpacing: -0.3,
  },
  sectionContent: {
    marginBottom: 36,
  },
  sectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: DARK.bgElev,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DARK.lineSoft,
  },

  // Tab bar styles
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: DARK.bg,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: DARK.line,
    marginTop: 40,
  },
  tabItem: {
    padding: 16,
    borderRadius: 28,
  },
  tabText: {
    color: DARK.fgDim,
    fontFamily: 'ChakraPetch',
    fontSize: 14,
  },
  tabItemActive: {
    backgroundColor: DARK.bgElev2,
    padding: 16,
    borderRadius: 28,
  },
  tabTextActive: {
    color: DARK.accent,
  },
});