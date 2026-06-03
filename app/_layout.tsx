import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a2e1a' },
          headerTintColor: '#7ec87e',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#0d1f0d' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Gartenwelt' }} />
        <Stack.Screen
          name="processing"
          options={{ title: 'Verarbeitung', headerBackVisible: false }}
        />
        <Stack.Screen
          name="viewer"
          options={{ title: '3D-Viewer', headerShown: false }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
