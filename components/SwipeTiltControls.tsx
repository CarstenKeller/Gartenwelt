import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Gyroscope } from 'expo-sensors';
import type { JoystickOutput } from './JoystickControls';

interface Props {
  onUpdate: (out: JoystickOutput) => void;
}

export default function SwipeTiltControls({ onUpdate }: Props) {
  const stateRef = useRef<JoystickOutput>({ moveX: 0, moveZ: 0, lookX: 0, lookY: 0 });
  const gyroRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    Gyroscope.setUpdateInterval(50);
    const sub = Gyroscope.addListener(({ x, y }) => {
      // Kumulativer Look via Gyroscop (gedämpft)
      gyroRef.current.x = Math.max(-1, Math.min(1, gyroRef.current.x + y * 0.05));
      gyroRef.current.y = Math.max(-1, Math.min(1, gyroRef.current.y + x * 0.05));
      stateRef.current = {
        ...stateRef.current,
        lookX: gyroRef.current.x,
        lookY: gyroRef.current.y,
      };
      onUpdate({ ...stateRef.current });
    });
    return () => sub.remove();
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const mx = Math.max(-1, Math.min(1, e.translationX / 120));
      const mz = Math.max(-1, Math.min(1, e.translationY / 120));
      stateRef.current = { ...stateRef.current, moveX: mx, moveZ: mz };
      onUpdate({ ...stateRef.current });
    })
    .onEnd(() => {
      stateRef.current = { ...stateRef.current, moveX: 0, moveZ: 0 };
      onUpdate({ ...stateRef.current });
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.overlay} pointerEvents="box-only">
        {/* Unsichtbare Touch-Fläche für Swipe */}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
