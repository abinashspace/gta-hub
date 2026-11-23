import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useParams } from '@react-navigation/native';
import { useFonts, RussoOne, ChakraPetch } from '@expo-google-fonts/russo-one';
import { useFonts as useFonts2, ChakraPetch as ChakraPetch2 } from '@expo-google-fonts/chakra-petch';

const GamesDetailScreen = () => {
  const { slug, section } = useParams();
  const [fontsLoaded] = useFonts({
    RussoOne: require('@expo-google-fonts/russo-one/RussoOne-Regular.ttf'),
    ChakraPetch: require('@expo-google-fonts/chakra-petch/ChakraPetch-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  // Simulated data based on the GTA Hub website records
  const gameData: any = {
    'gta-v': {
      vehicles: [
        { name: 'Pinnacle', description: 'Super sports car' },
        { name: 'Buffalo', description: 'Muscle car' },
        { name: 'Comet', description: 'Classic sports car' },
        { name: 'Bus', description: 'Public transit bus' },
        { name: 'Marker', description: 'Police marker car' },
      ],
      characters: [
        { name: 'Michael', description: 'Retired bank robber' },
        { name: 'Franklin', description: 'Street dealer turned actor' },
        { name: 'Trevor', description: 'Unstable meth dealer' },
        { name: 'Trevor Philips', description: 'Crazy criminal' },
      ],
      missions: [
        { name: 'The Prologue', description: 'Introduction to the story' },
        { name: 'The Paleto Score', description: 'Heist at Paleto Bay' },
        { name: 'The Big Score', description: 'Ultimate heist' },
        { name: 'Fame or Shame', description: 'Kill a celebrity' },
      ],
    },
    'gta-san-andreas': {
      vehicles: [
        { name: 'Pavley', description: 'Off-road buggy' },
        { name: 'BF Injection', description: 'Dune buggy' },
        { name: 'Hydra', description: 'Attack helicopter' },
        { name: 'Ak-Chin', description: 'Lowrider' },
      ],
      characters: [
        { name: 'Carl Johnson', description: 'Grove Street Families leader' },
        { name: 'Sweet', description: 'Carl\'s sister' },
        { name: 'Big Smoke', description: 'Gang associate' },
      ],
      missions: [
        { name: 'First Base', description: 'Tutorial missions' },
        { name: 'Black Project', description: 'Top-secret mission' },
        { name: 'End of the Line', description: 'Final mission' },
      ],
    },
    'gta-vice-city': {
      vehicles: [
        { name: 'Pheonix', description: 'Muscle car' },
        { name: 'Sovereign', description: 'Luxury car' },
        { name: 'Tampa', description: 'Classic sedan' },
        { name: 'Patriot', description: 'SUV' },
      ],
      characters: [
        { name: 'Tommy Vercetti', description: 'Former mob enforcer' },
        { name: 'Lance Vance', description: 'Partner in crime' },
        { name: 'Kent Paul', description: 'Dealer and hustler' },
      ],
      missions: [
        { name: 'The Job', description: 'Heist setup' },
        { name: 'Rearm', description: 'Supply mission' },
        { name: 'All Hands on Deck', description: 'Final showdown' },
      ],
    },
    'gta-liberty-city-stories': {
      vehicles: [
        { name: 'Patriot', description: 'SUV' },
        { name: 'Enforcer', description: 'Police car' },
        { name: 'Securicar', description: 'Security van' },
      ],
      characters: [
        { name: 'Michael Townley', description: 'Protagonist' },
      ],
      missions: [
        { name: 'The Exchange', description: 'Drug deal' },
        { name: 'The Bum Deal', description: 'Mugging' },
      ],
    },
    'gta-vice-city-stories': {
      vehicles: [
        { name: 'Biff', description: 'Muscle car' },
        { name: 'Slamvan', description: 'Classic car' },
      ],
      characters: [
        { name: 'Victor Vance', description: 'Army officer' },
      ],
      missions: [
        { name: 'The Audition', description: 'Tryout mission' },
        { name: 'The Exchange', description: 'Drug deal' },
      ],
    },
    'gta-the-ballad-of-gay-tony': {
      vehicles: [
        { name: 'Pegassi Infernus', description: 'Super sports car' },
        { name: 'Benson', description: 'Utility van' },
        { name: 'Buccaneer', description: 'Classic car' },
      ],
      characters: [
        { name: 'Tony Prince', description: 'Club owner' },
      ],
      missions: [
        { name: 'Bang Bang', description: 'Club mission' },
        { name: 'Blog This', description: 'Social mission' },
      ],
    },
    'gta-online': {
      vehicles: [
        { name: 'Opressor', description: 'Flying motorcycle' },
        { name: 'Ruiner 2000', description: 'Muscle car' },
        { name: 'Pariah', description: 'Super sports car' },
      ],
      characters: [],
      missions: [
        { name: 'Cayo Perico Heist', description: 'Main heist mission' },
        { name: 'Diamond Casino Heist', description: 'Casino robbery' },
      ],
    },
    'gta-vi': {
      vehicles: [
        { name: 'Dewbauchee Z-Type', description: 'Classic car' },
        { name: 'Ocelot Virtue', description: 'Super sports car' },
        { name: 'BF Messer', description: 'Muscle car' },
      ],
      characters: [
        { name: 'Jason', description: 'Protagonist' },
        { name: 'Lucia', description: 'Co-protagonist' },
      ],
      missions: [
        { name: 'The Story Begins', description: 'Introduction' },
        { name: 'The Palmetto', description: 'Main mission' },
      ],
    },
    'gta-chinatown-wars': {
      vehicles: [
        { name: 'Hexer', description: 'Motorcycle' },
        { name: 'Zipline', description: 'Air vehicle' },
      ],
      characters: [],
      missions: [
        { name: 'The Heist', description: 'Main mission' },
      ],
    },
    'gta-advance': {
      vehicles: [],
      characters: [],
      missions: [
        { name: 'Mission 1', description: 'First mission' },
      ],
    },
    'gta-liberty-stories': {
      vehicles: [],
      characters: [],
      missions: [
        { name: 'Mission 1', description: 'First mission' },
      ],
    },
  };

  const data = gameData[slug as keyof typeof gameData];
  const items = data?.[section as keyof typeof data] || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{slug.toUpperCase()}</Text>
        <Text style={styles.subtitle}>{section.charAt(0).toUpperCase() + section.slice(1)}</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {items.map((item: any, index: number) => (
          <View key={index} style={styles.item}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#272C36',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'RussoOne',
    fontSize: 28,
    color: '#F3F5F8',
  },
  subtitle: {
    fontFamily: 'ChakraPetch',
    fontSize: 14,
    color: '#818B99',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 20,
  },
  listContent: {},
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C2028',
    marginBottom: 8,
  },
  itemTitle: {
    fontFamily: 'ChakraPetch',
    fontSize: 16,
    color: '#F3F5F8',
  },
  itemDesc: {
    fontFamily: 'ChakraPetch',
    fontSize: 13,
    color: '#B7C0CC',
    marginTop: 4,
  },
});