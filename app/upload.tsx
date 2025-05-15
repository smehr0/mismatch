import React, { useState, useEffect } from 'react';
import { SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';

import {
  View, Text, Button, Image, StyleSheet, TextInput, Alert, Dimensions, FlatList
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { TabView, TabBar, SceneMap, NavigationState } from 'react-native-tab-view';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
//import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const ATTRIBUTE_OPTIONS = {
  Pattern: ['Solid', 'Floral', 'Striped', 'Polka Dot', 'Checked'],
  Fabric: ['Smooth', 'Rough', 'Soft', 'Glossy', 'Matte'],
  Texture: ['Cotton', 'Silk', 'Denim', 'Linen', 'Wool', 'Polyester','Nylon','Rayon','Satin','Chiffon','Georgette'],
  Structure: ['Fitted', 'Loose', 'Structured'],
  Color: ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow'],
};

const categories = {
  Top: ['shirt', 't-shirt', 'blouse', 'hoodie'],
  Bottom: ['jeans', 'skirt', 'pants', 'leggings'],
  Outerwear: ['jacket', 'coat', 'blazer'],
  OnePiece: ['dress', 'jumpsuit'],
  Footwear: ['shoes', 'boots'],
  Accessory: ['hat', 'scarf', 'belt']
};

const autoDetectType = (item: string): string => {
  const lower = item.toLowerCase();
  for (const [type, keywords] of Object.entries(categories)) {
    if (keywords.some((k) => lower.includes(k))) return type;
  }
  return 'Other';
};

export default function UploadTab() {
  const [image, setImage] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [meta, setMeta] = useState({
    Color: '',
    Pattern: '',
    Fabric: '',
    Texture: '',
    Structure: '',
  });
  const [email, setEmail] = useState<string>('');
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'upload', title: 'Upload' },
    { key: 'wardrobe', title: 'My Wardrobe' }
  ]);

  const fileName = (email: string) => `${FileSystem.documentDirectory}wardrobe_${email.replace(/[^a-zA-Z0-9]/g, '')}.json`;

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem('userProfile');
      if (stored) {
        const parsed = JSON.parse(stored);
        const email = parsed.email;
        if (email) {
          setEmail(email);
          await loadWardrobe(email);
        }
      } else {
        setWardrobe([]); // Clear if not logged in
      }
    };
    loadUser();
  }, []);
  
  const loadWardrobe = async (userEmail: string) => {
    try {
      const path = fileName(userEmail);
      const exists = await FileSystem.getInfoAsync(path);
      if (exists.exists) {
        const content = await FileSystem.readAsStringAsync(path);
        setWardrobe(JSON.parse(content));
      } else {
        setWardrobe([]);
      }
    } catch (e) {
      console.log('Load error', e);
    }
  };

  const handlePick = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return alert('Permission needed');

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 1 });

      if (!result.canceled && result.assets?.[0]) {
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop();
      
        const documentDir = FileSystem.documentDirectory;
        if (!documentDir) {
          Alert.alert('Error', 'Document directory not available');
          return;
        }
      
        const newPath = documentDir + filename;
      
        try {
          await FileSystem.copyAsync({
            from: localUri,
            to: newPath,
          });
          setImage(newPath);
        } catch (error) {
          console.log('Copy failed', error);
          Alert.alert('Error copying file');
        }
      }
      
      
  };

  const handleMetaChange = (key: string, value: string) => {
    setMeta({ ...meta, [key]: value });
  };

  const handleSave = async () => {
    if (!itemName || Object.values(meta).some((v) => !v) || !image) {
      Alert.alert('Missing Info', 'Please complete all fields and select an image.');
      return;
    }

    const itemType = autoDetectType(itemName);
    const newItem = {
      image,
      itemName,
      type: itemType,
      ...meta
    };

    const path = fileName(email);
    const updated = [...wardrobe, newItem];
    await FileSystem.writeAsStringAsync(path, JSON.stringify(updated, null, 2));
    setWardrobe(updated);
    setImage(null);
    setItemName('');
    setMeta({ Color: '', Pattern: '', Fabric: '', Texture: '', Structure: '' });
    Alert.alert('Saved!', `Saved as ${itemType}`);
  };

  const UploadForm = () => {
    return (
      <View style={{ flex: 1, height: '100%' }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-start',
            padding: 20,
            paddingBottom: 120,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.title}>Upload Clothing Item</Text>
  
          {image && <Image source={{ uri: image }} style={styles.image} />}
          <Button title="Upload from Gallery" onPress={() => handlePick(false)} />
          <Button title="Take a Photo" onPress={() => handlePick(true)} />
  
          <TextInput
            style={styles.input}
            placeholder="Item name (e.g., red floral blouse)"
            value={itemName}
            onChangeText={setItemName}
          />
  
          {Object.keys(ATTRIBUTE_OPTIONS).map((key) => (
            <View key={key}>
              <Text style={styles.label}>{key}</Text>
              <Picker
                selectedValue={meta[key as keyof typeof meta]}
                onValueChange={(val) => handleMetaChange(key, val)}
                style={styles.picker}
              >
                <Picker.Item label={`Select ${key}`} value="" />
                {ATTRIBUTE_OPTIONS[key as keyof typeof ATTRIBUTE_OPTIONS].map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>
          ))}
  
          <View style={{ marginTop: 20 }}>
            <Button title="Save to Wardrobe" onPress={handleSave} />
          </View>
        </ScrollView>
      </View>
    );
  };
  
  

  const deleteItem = async (index: number) => {
    const updated = [...wardrobe];
    updated.splice(index, 1);
    setWardrobe(updated);
    const path = fileName(email);
    await FileSystem.writeAsStringAsync(path, JSON.stringify(updated, null, 2));
  };
  
  const WardrobeGallery = () => (
    <FlatList
      data={wardrobe}
      keyExtractor={(_, idx) => idx.toString()}
      renderItem={({ item, index }) => (
        <View style={{ marginBottom: 20 }}>
          <Image source={{ uri: item.image }} style={styles.image} />
          <Text style={styles.label}>{item.itemName} ({item.type})</Text>
          <Button title="Delete" color="red" onPress={() => deleteItem(index)} />
        </View>
      )}
      contentContainerStyle={{ padding: 20 }}
    />
  );
  

  const renderScene = SceneMap({
    upload: UploadForm,
    wardrobe: WardrobeGallery
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: Dimensions.get('window').width }}
      renderTabBar={(props: any) => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: 'black' }}
          style={{ backgroundColor: '#f5f5f5' }}
          renderLabel={({ route, focused }: { route: { title: string }; focused: boolean }) => (
            <Text style={{ color: focused ? 'black' : '#888', fontWeight: '600' }}>
              {route.title}
            </Text>
          )}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  image: { width: '100%', height: 200, resizeMode: 'contain', marginVertical: 10 },
  input: { borderWidth: 1, padding: 10, marginVertical: 10, borderRadius: 6 },
  label: { fontWeight: '600', marginTop: 10 },
  picker: { height: 50, width: '100%' },
});
