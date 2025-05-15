import React, { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
  View, Text, ScrollView, Button, Image, StyleSheet, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { loadAllDatasets } from './loadDatasets';

const ATTRIBUTE_KEYS = ['Color', 'Pattern', 'Fabric', 'Texture', 'Structure'];

const RecommendationScreen = () => {
  const [datasets, setDatasets] = useState<any>(null);
  const [email, setEmail] = useState('guest');
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const [userInput, setUserInput] = useState({
    skin: '',
    occasion: '',
    weather: '',
    body: ''
  });
  const [topOutfits, setTopOutfits] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem('userProfile');
      if (stored) {
        const profile = JSON.parse(stored);
        setEmail(profile.email || 'guest');
        const filePath = FileSystem.documentDirectory + 'wardrobe_' + (profile.email || 'guest').replace(/[^a-zA-Z0-9]/g, '') + '.json';
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          const data = await FileSystem.readAsStringAsync(filePath);
          setWardrobe(JSON.parse(data));
        }
      }

      const loadedDatasets = await loadAllDatasets();
      setDatasets(loadedDatasets);
    };

    load();
  }, []);

  const handleChange = (key: string, val: string) => {
    const updated = { ...userInput, [key]: val };
    setUserInput(updated);

    if (Object.values(updated).every(v => v)) {
      generateOutfit(updated);
    }
  };

  const scoreOutfit = (items: any[]) => {
    if (!datasets) return { score: 0, details: [] };

    let score = 0;
    const details: string[] = [];
    const {
      Pointsystem,
      ColorCompatibility,
      PatternCompatibility,
      TextureCompatibility,
      StructureCompatibility,
      SkinToneCompatibility,
      OccasionStyleCompatibility,
      ProportionCompatibility,
      StyleCompatibility,
      Stylebreakdown,
      WeatherCompatibility
    } = datasets;

    const primary = items.find(i => i.type === 'Top' || i.type === 'OnePiece') || items[0];

    // Skin
    if (userInput.skin && primary?.Color) {
      const skinMatch = SkinToneCompatibility.find((s: any) => s['Skin Tone / Undertone'].includes(userInput.skin));
      if (skinMatch) {
        const colorRanges = Object.values(skinMatch).flat();
        if (colorRanges.includes(primary.Color)) {
          score += 8;
          details.push('Skin tone matched');
        }
      }
    }

    // Color 
    const colors = items.map(i => i.Color);
    const colorHarmonyPoints = colors.reduce((acc, baseColor) => {
      const match = ColorCompatibility.find((c: any) => c['Base Color'] === baseColor);
      if (!match) return acc;
      const compatibles = Object.values(match).filter((c, i) => i !== 0);
      const matchCount = colors.filter(c => compatibles.includes(c)).length;
      return acc + matchCount;
    }, 0);
    if (colorHarmonyPoints > 0) {
      score += 10;
      details.push('Color harmony detected');
    }

    // Pattern 
    const patterns = items.map(i => i.Pattern).filter(Boolean);
    const patternScore = patterns.reduce((acc, p1) => {
      const match = PatternCompatibility.find((p: any) => p.Pattern === p1);
      if (!match) return acc;
      const compatibles = match['Compatible With'].split(',').map((p: string) => p.trim());
      return acc + patterns.filter(p2 => p2 !== p1 && compatibles.includes(p2)).length;
    }, 0);
    if (patternScore > 0) {
      score += 5;
      details.push('Pattern compatibility matched');
    }

    // Texture 
    const textures = items.map(i => i.Texture).filter(Boolean);
    const textureScore = textures.reduce((acc, t1) => {
      const match = TextureCompatibility.find((t: any) => t.Texture === t1);
      if (!match) return acc;
      const compatibles = match['Compatible With'].split(',').map((t: string) => t.trim());
      return acc + textures.filter(t2 => t2 !== t1 && compatibles.includes(t2)).length;
    }, 0);
    if (textureScore > 0) {
      score += 5;
      details.push('Texture compatibility matched');
    }

    // Structure 
    const structures = items.map(i => i.Structure).filter(Boolean);
    const structureScore = structures.reduce((acc, s, idx) => {
      return acc + (structures.indexOf(s) === idx ? 1 : 0); // diversity bonus
    }, 0);
    if (structureScore > 0) {
      score += 8;
      details.push('Structure harmony');
    }

    // Weather 
    if (userInput.weather) {
      const weatherMatch = WeatherCompatibility.find((w: any) => w['Season/Weather'].includes(userInput.weather));
      if (weatherMatch) {
        const fabrics = weatherMatch['Recommended Fabrics'].split(',').map((f: string) => f.trim());
        if (items.some(i => fabrics.includes(i.Fabric))) {
          score += 5;
          details.push('Weather-appropriate fabrics');
        }
      }
    }

    // Body 
    if (userInput.body) {
      const fitMatch = ProportionCompatibility.find((p: any) => p['Body Shape / Proportion'].includes(userInput.body));
      if (fitMatch) {
        const fits = fitMatch['Recommended Fits'].split(',').map((f: string) => f.trim());
        if (items.some(i => fits.includes(i.Structure))) {
          score += 10;
          details.push('Body fit matched');
        }
      }
    }

    // Occasion 
    if (userInput.occasion) {
      const occasionMatch = OccasionStyleCompatibility.find((o: any) => o['Occasion'].includes(userInput.occasion));
      if (occasionMatch) {
        const colorRange = occasionMatch['Color Range'].split(',').map((c: string) => c.trim());
        if (items.some(i => colorRange.includes(i.Color))) {
          score += 15;
          details.push('Color matches occasion');
        }
      }
    }

    return { score, details };
  };

  const generateOutfit = (inputs = userInput) => {
    const tops = wardrobe.filter(i => i.type === 'Top');
    const bottoms = wardrobe.filter(i => i.type === 'Bottom');
    const onepieces = wardrobe.filter(i => i.type === 'OnePiece');
    const outerwears = wardrobe.filter(i => i.type === 'Outerwear');
    const accessories = wardrobe.filter(i => i.type === 'Accessory');
    const footwears = wardrobe.filter(i => i.type === 'Footwear');

    const combos: any[] = [];

    // Top + Bottom
    tops.forEach(top => {
      bottoms.forEach(bottom => {
        const combo = [top, bottom];
        if (outerwears[0]) combo.push(outerwears[0]);
        if (accessories[0]) combo.push(accessories[0]);
        if (footwears[0]) combo.push(footwears[0]);

        const { score, details } = scoreOutfit(combo);
        combos.push({ items: combo, score, details });
      });
    });

    // One-piece
    onepieces.forEach(dress => {
      const combo = [dress];
      if (outerwears[0]) combo.push(outerwears[0]);
      if (accessories[0]) combo.push(accessories[0]);
      if (footwears[0]) combo.push(footwears[0]);

      const { score, details } = scoreOutfit(combo);
      combos.push({ items: combo, score, details });
    });

    if (combos.length === 0) {
      Alert.alert('Not enough clothing items', 'Upload at least a top & bottom or one-piece.');
      return;
    }

    combos.sort((a, b) => b.score - a.score);
    setTopOutfits(combos); 
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Find Your Best Outfit</Text>

      {datasets && (
  <>
    {/* Skin Tone */}
    <View style={styles.dropdown}>
      <Text style={styles.label}>Select Skin Tone</Text>
      <Picker
        selectedValue={userInput.skin}
        onValueChange={(val) => handleChange('skin', val)}
      >
        <Picker.Item label="Choose Skin Tone" value="" />
        {datasets.SkinToneCompatibility.map((s: any) => (
          <Picker.Item key={s["Skin Tone / Undertone"]} label={s["Skin Tone / Undertone"]} value={s["Skin Tone / Undertone"]} />
        ))}
      </Picker>
    </View>

    {/* Occasion */}
    <View style={styles.dropdown}>
      <Text style={styles.label}>Select Occasion</Text>
      <Picker
        selectedValue={userInput.occasion}
        onValueChange={(val) => handleChange('occasion', val)}
      >
        <Picker.Item label="Choose Occasion" value="" />
        {datasets.OccasionStyleCompatibility.map((o: any) => (
          <Picker.Item key={o["Occasion"]} label={o["Occasion"]} value={o["Occasion"]} />
        ))}
      </Picker>
    </View>

    {/* Weather */}
    <View style={styles.dropdown}>
      <Text style={styles.label}>Select Weather</Text>
      <Picker
        selectedValue={userInput.weather}
        onValueChange={(val) => handleChange('weather', val)}
      >
        <Picker.Item label="Choose Weather" value="" />
        {datasets.WeatherCompatibility.map((w: any) => (
          <Picker.Item key={w["Season/Weather"]} label={w["Season/Weather"]} value={w["Season/Weather"]} />
        ))}
      </Picker>
    </View>

    {/* Body Type */}
    <View style={styles.dropdown}>
      <Text style={styles.label}>Select Body Type</Text>
      <Picker
        selectedValue={userInput.body}
        onValueChange={(val) => handleChange('body', val)}
      >
        <Picker.Item label="Choose Body Type" value="" />
        {datasets.ProportionCompatibility.map((p: any) => (
          <Picker.Item key={p["Body Shape / Proportion"]} label={p["Body Shape / Proportion"]} value={p["Body Shape / Proportion"]} />
        ))}
      </Picker>
    </View>
  </>
)}

      <Button title="Generate Outfit" onPress={() => generateOutfit()} />

      {topOutfits.length > 0 && (
        <View style={styles.result}>
          <Text style={styles.subtitle}>Top Outfit Suggestions</Text>
          {topOutfits.map((outfit, idx) => (
            <View key={idx} style={{ marginBottom: 30 }}>
              <Text style={{ fontWeight: 'bold' }}>Outfit #{idx + 1} (Score: {outfit.score})</Text>
              {outfit.items.map((item: any, itemIdx: number) => (
                <View key={itemIdx} style={{ marginBottom: 10 }}>
                  <Image source={{ uri: item.image }} style={styles.image} />
                  <Text>{item.itemName} ({item.type})</Text>
                  <Text>{ATTRIBUTE_KEYS.map(k => `${k}: ${item[k]}`).join(' | ')}</Text>
                </View>
              ))}
              <Text>Reasons: {outfit.details.join(', ')}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontWeight: 'bold', marginTop: 10 },
  dropdown: { marginBottom: 10 },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  image: { width: '100%', height: 200, resizeMode: 'contain', marginVertical: 10 },
  result: { marginTop: 20 }
});

export default RecommendationScreen;
