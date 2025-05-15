import React from 'react';
import { View, Text, StyleSheet, Button, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('../assets/bg.jpg')} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>

        <View style={styles.buttonGroup}>
          <Button title="Upload Clothes" onPress={() => router.push('/upload')} color="#A06CD5" />
          <View style={{ height: 10 }} />
          <Button title="Get Outfit Ideas" onPress={() => router.push('/outfits')} color="#A06CD5" />
          <View style={{ height: 10 }} />
          <Button title="Login" onPress={() => router.push('/auth')} color="#A06CD5" />

        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7743DB',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#5e5e5e',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
  },
});
