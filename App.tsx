import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import ViewerScreen from './screens/ViewerScreen';

type Screen = 'home' | 'processing' | 'viewer';

interface Params {
  videoUri?: string;
  videoName?: string;
  cloudPath?: string;
  pointCount?: number;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [params, setParams] = useState<Params>({});

  function navigate(to: Screen, nextParams?: Params) {
    setParams(nextParams ?? {});
    setScreen(to);
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      {screen === 'home' && (
        <HomeScreen
          onStart={(uri, name) =>
            navigate('processing', { videoUri: uri, videoName: name })
          }
        />
      )}
      {screen === 'processing' && (
        <ProcessingScreen
          videoUri={params.videoUri!}
          videoName={params.videoName!}
          onDone={(path, count) =>
            navigate('viewer', { cloudPath: path, pointCount: count })
          }
          onBack={() => navigate('home')}
        />
      )}
      {screen === 'viewer' && (
        <ViewerScreen
          cloudPath={params.cloudPath!}
          pointCount={params.pointCount ?? 0}
          onBack={() => navigate('home')}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1f0d' },
});
