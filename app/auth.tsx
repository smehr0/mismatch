import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    const userKey = `user_${email}`;
    const saved = await AsyncStorage.getItem(userKey);

    if (mode === 'signup') {
      if (saved) {
        Alert.alert('User exists', 'Try logging in instead.');
        return;
      }
      await AsyncStorage.setItem(userKey, JSON.stringify({ email, password }));
      Alert.alert('Success', 'Account created.');
    } else {
      if (!saved) {
        Alert.alert('Not found', 'User not registered.');
        return;
      }
      const parsed = JSON.parse(saved);
      if (parsed.password !== password) {
        Alert.alert('Wrong password');
        return;
      }
    }

    await AsyncStorage.setItem('userProfile', JSON.stringify({ email }));
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'signup' ? 'Sign Up' : 'Login'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title={mode === 'signup' ? 'Sign Up' : 'Login'}
        onPress={handleSubmit}
        color="#A06CD5"
      />

      <View style={{ marginTop: 20 }}>
        <Button
          title={mode === 'signup' ? 'Already have an account? Login' : 'New here? Sign up'}
          onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          color="#888"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, padding: 12, marginBottom: 20, borderRadius: 6 },
});
