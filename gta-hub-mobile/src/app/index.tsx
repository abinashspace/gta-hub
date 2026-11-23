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

const LIGHT = {
  bg: '#F7F6F3',
  bgSoft: '#FFFFFF',
  bgElev: '#F0EFEB',
  line: '#DCD9D1',
  lineSoft: '#E9E6DF',
  fg: '#14161A',
  fgSoft: '#454B54',
  fgDim: '#6A717B',
  accent: '#7C3AED',
  accentStrong: '#5B2C6F',
  accentInk: '#FFFFFF',
  ok: '#1F7A3A',
  warn: '#9A6400',
  info: '#0B5CAD',
  danger: '#B3121F',
};

const DARK = {
  bg: '#0F0F23',
  bgSoft: '#101217',
  bgElev: '#15181E',
  bgElev2: '#1B1F27',
  line: '#272C36',
  lineSoft: '#1C2028',
  fg: '#F3F5F8',
  fgSoft: '#B7C0CC',
  fgDim: '#818B99',
  accent: '#7C3AED',
  accentStrong: '#5A2D6D',
  accentInk: '#FFFFFF',
  ok: '#3ECF63',
  warn: '#FFB020',
  info: '#5AA9FF',
  danger: '#FF6B6B',
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

  useEffect(() => {
    const subscribe = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });
    return () => subscribe();
  }, []);

  useEffect(() => {
    // Simulated game library data
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
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[{ ...styles.headerText, color: DARK.fg }]}>GTA Hub</Text>
        <Text style={styles.subtitle}>Grand Theft Auto Encyclopedia</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchPlaceholder}>Search GTA hub…</Text>
        </View>
      </View>

      <View style={styles.gameGrid}>
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            onPress={() => navigation.navigate('GameDetail', { game: game.slug, section: game.section })}
            style={styles.gameCard}
          >
            <View style={styles.cardBadge}>
              <Text style={styles.cardText}>{game.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

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

  const handleSearch = (text: string) => {
    setQuery(text);
    const simulatedResults = [
      { id: 1, title: 'GTA V - Vehicles', snippet: 'Includes cars, bikes, aircraft' },
      { id: 2, title: 'GTA San Andreas - Missions', snippet: 'Includes 100+ missions' },
      { id: 3, title: 'GTA Vice City - Characters', snippet: 'Includes main characters' },
    ].filter((item) => item.title.toLowerCase().includes(text.toLowerCase()));
    setResults(simulatedResults);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[{ ...styles.headerText, color: DARK.fg }]}>Search</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>{game.toUpperCase()}</Text>
      </View>

      <View style={styles.tabContainer}>
        {Object.keys(sections).map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => setSection(key)}
            style={[
              styles.tabButton,
              { backgroundColor: section === key ? DARK.bgElev2 : DARK.bg },
            ]}
          >
            <Text style={styles.tabText}>{sections[key].title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.contentArea}>
        <View style={styles.sectionTitle}>
          <Text style={styles.fontChakraPetch}>{sections[section].title}</Text>
        </View>

        <View style={styles.sectionContent}>
          {sections[section].data.map((item: any, i: number) => (
            <View key={i} style={styles.sectionItem}>
              <Text style={styles.fontChakraPetch}>{item.name}</Text>
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
        <Text style={styles.tabText}>Games</Text>
      </View>
      <View style={styles.tabItem} onPress={() => navigate('Search')}>
        <Text style={styles.tabText}>Search</Text>
      </View>
      <View style={styles.tabItem} onPress={() => navigate('Detail')}>
        <Text style={styles.tabText}>Data</Text>
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

  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK.line,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: 'ChakraPetch',
    fontSize: 14,
    color: DARK.fgDim,
  },

  searchContainer: {
    margin: 24,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK.bgElev,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchPlaceholder: {
    flex: 1,
    color: DARK.fgDim,
    fontFamily: 'ChakraPetch',
    fontSize: 16,
  },

  gameGrid: {
    marginHorizontal: 24,
    marginVertical: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  gameCard: {
    width: '48%',
    aspectRatio: 3 / 4,
    backgroundColor: DARK.bgElev,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBadge: {
    width: '100%',
    padding: 16,
    textAlign: 'center',
  },
  cardText: {
    color: DARK.fg,
    fontFamily: 'ChakraPetch',
    fontSize: 14,
  },

  themeToggle: {
    padding: 16,
    margin: 24,
    borderTopWidth: 1,
    borderTopColor: DARK.line,
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeText: {
    color: DARK.fgSoft,
    fontFamily: 'ChakraPetch',
    fontSize: 14,
  },

  // Search screen styles
  searchInput: {
    height: 44,
    backgroundColor: DARK.bg,
    borderRadius: 22,
    paddingHorizontal: 16,
    color: DARK.fg,
    fontFamily: 'ChakraPetch',
  },

  resultsList: {
    marginTop: 12,
    maxHeight: 300,
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: DARK.bgElev,
    marginBottom: 8,
  },
  resultText: {
    fontFamily: 'ChakraPetch',
    fontSize: 16,
    color: DARK.fg,
  },
  resultSnippet: {
    fontFamily: 'ChakraPetch',
    fontSize: 13,
    color: DARK.fgDim,
    marginTop: 4,
  },
  backButton: {
    padding: 24,
  },
  backText: {
    color: DARK.accent,
    fontFamily: 'ChakraPetch',
    fontSize: 16,
  },

  // Game detail screen styles
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK.line,
  },
  tabButton: {
    padding: 8,
    borderRadius: 20,
  },
  tabText: {
    fontFamily: 'ChakraPetch',
    fontSize: 14,
    color: DARK.fgDim,
  },
  contentArea: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontFamily: 'ChakraPetch',
    fontSize: 18,
    color: DARK.fg,
    marginBottom: 20,
  },
  sectionContent: {
    marginBottom: 30,
  },
  sectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: DARK.lineSoft,
    marginBottom: 8,
  },

  // Tab bar styles
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: DARK.bg,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: DARK.line,
    marginTop: 32,
  },
  tabItem: {
    padding: 12,
    borderRadius: 20,
  },
  tabText: {
    color: DARK.fgDim,
    fontFamily: 'ChakraPetch',
    fontSize: 14,
  },
  tabItemActive: {
    backgroundColor: DARK.bgElev2,
    padding: 12,
    borderRadius: 20,
  },
  tabTextActive: {
    color: DARK.accent,
  },
});