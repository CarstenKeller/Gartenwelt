import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import GardenViewer from '../components/GardenViewer';
import JoystickControls, { JoystickOutput } from '../components/JoystickControls';
import SwipeTiltControls from '../components/SwipeTiltControls';
import { loadPointCloud, PointCloud } from '../services/pointCloudGenerator';

type ControlMode = 'joystick' | 'swipe';
const NEUTRAL: JoystickOutput = { moveX: 0, moveZ: 0, lookX: 0, lookY: 0 };

interface Props {
  cloudPath: string;
  pointCount: number;
  onBack: () => void;
}

export default function ViewerScreen({ cloudPath, pointCount, onBack }: Props) {
  const [cloud, setCloud] = useState<PointCloud | null>(null);
  const [mode, setMode] = useState<ControlMode>('joystick');
  const [showHud, setShowHud] = useState(true);
  const controlRef = useRef<JoystickOutput>(NEUTRAL);

  useEffect(() => {
    loadPointCloud(cloudPath).then(setCloud).catch(console.error);
  }, [cloudPath]);

  if (!cloud) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7ec87e" />
        <Text style={styles.loadingText}>Lade Punktwolke…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowHud(v => !v)}>
        <GardenViewer cloud={cloud} controlRef={controlRef} />
      </Pressable>

      {mode === 'joystick'
        ? <JoystickControls onUpdate={v => { controlRef.current = v; }} />
        : <SwipeTiltControls onUpdate={v => { controlRef.current = v; }} />
      }

      {showHud && (
        <SafeAreaView style={styles.hud} pointerEvents="box-none">
          <View style={styles.hudRow} pointerEvents="box-none">
            <Pressable style={styles.hudBtn} onPress={onBack}>
              <Text style={styles.hudBtnText}>✕</Text>
            </Pressable>
            <View style={styles.hudInfo}>
              <Text style={styles.hudPoints}>
                {pointCount.toLocaleString()} Punkte
              </Text>
            </View>
            <Pressable
              style={styles.hudBtn}
              onPress={() => setMode(m => m === 'joystick' ? 'swipe' : 'joystick')}
            >
              <Text style={styles.hudBtnText}>
                {mode === 'joystick' ? '🕹️' : '📱'}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1f0d' },
  loading: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 16, backgroundColor: '#0d1f0d',
  },
  loadingText: { color: '#7ec87e', fontSize: 16 },
  hud: { position: 'absolute', top: 0, left: 0, right: 0 },
  hudRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8,
  },
  hudBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  hudBtnText: { fontSize: 18, color: '#fff' },
  hudInfo: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
  },
  hudPoints: { color: '#7ec87e', fontSize: 12 },
});
