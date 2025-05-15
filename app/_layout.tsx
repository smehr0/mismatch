import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StatusBar as RNStatusBar, StyleSheet, View } from 'react-native';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="dark" translucent backgroundColor="transparent" />

        <Tabs
          screenOptions={{
            headerShown: false, //no tab screen headers
            tabBarStyle: {
              backgroundColor: '#413756FF', 
              borderTopColor: '#11082600',
            },
          }}
        >
          
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
          <Tabs.Screen name="outfits" options={{ title: 'Outfits' }} />
          <Tabs.Screen name="upload" options={{ title: 'Upload' }} />
        </Tabs>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
    backgroundColor: '#412A4BFF', 
  },
});
