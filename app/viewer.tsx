import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GardenViewer from '../components/GardenViewer';
import JoystickControls, { JoystickOutput } from '../components/JoystickControls';
import SwipeTiltControls from '../components/SwipeTiltControls';
import { loadPointCloud, PointCloud } from '../services/pointCloudGenerator';

type ControlMode = 'joystick' | 'swipe';

const DEFAULT_CONTROL: JoystickOutput = { moveX: 0, moveZ: 0, lookX: 0, lookY: 0 };

export default function ViewerScreen() {
  const { cloudPath, pointCount } = useLocalSearchParams<{
    cloudPath: string;
    pointCount: string;
  }>();

  const [cloud, setCloud] = useState<PointCloud | null>(null);
  const [controlMode, setControlMode] = useState<ControlMode>('joystick');
  const [showHud, setShowHud] = useState(true);
  const controlRef = useRef<JoystickOutput>(DEFAULT_CONTROL);

  useEffect(() => {
    if (!cloudPath) return;
    loadPointCloud(cloudPath).then(setCloud).catch(console.error);
  }, [cloudPath]);

  function handleControl(out: JoystickOutput) {
    controlRef.current = out;
  }

  if (!cloud) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7ec87e" />
        <Text style={styles.loadingText}>Lade Punktwolke…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GardenViewer cloud={cloud} controlRef={controlRef} />

      {controlMode === 'joystick' ? (
        <JoystickControls onUpdate={handleControl} />
      ) : (
        <SwipeTiltControls onUpdate={handleControl} />
      )}

      {showHud && (
        <SafeAreaView style={styles.hud} pointerEvents="box-none">
          <View style={styles.hudRow}>
            <Pressable style={styles.hudBtn} onPress={() => router.back()}>
              <Text style={styles.hudBtnText}>✕</Text>
            </Pressable>

            <View style={styles.hudInfo}>
              <Text style={styles.hudPoints}>
                {Number(pointCount ?? 0).toLocaleString()} Punkte
              </Text>
            </View>

            <Pressable
              style={styles.hudBtn}
              onPress={() => setControlMode(m => m === 'joystick' ? 'swipe' : 'joystick')}
            >
              <Text style={styles.hudBtnText}>
                {controlMode === 'joystick' ? '🕹️' : '📱'}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      )}

      {/* Tap-Zone zum Ausblenden des HUD */}
      <Pressable
        style={styles.tapZone}
        onPress={() => setShowHud(v => !v)}
        pointerEvents="box-only"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1f0d' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#0d1f0d',
  },
  loadingText: { color: '#7ec87e', fontSize: 16 },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    pointerEvents: 'box-none',
  },
  hudBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudBtnText: { fontSize: 18, color: '#fff' },
  hudInfo: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hudPoints: { color: '#7ec87e', fontSize: 12 },
  tapZone: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
});
