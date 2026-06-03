import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const STICK_RADIUS = 50;
const BASE_RADIUS = 70;

export interface JoystickOutput {
  moveX: number; // -1..1
  moveZ: number; // -1..1
  lookX: number; // -1..1
  lookY: number; // -1..1
}

interface Props {
  onUpdate: (out: JoystickOutput) => void;
}

function Stick({ onDelta }: { onDelta: (dx: number, dy: number) => void }) {
  const knobX = useSharedValue(0);
  const knobY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const dx = Math.max(-BASE_RADIUS, Math.min(BASE_RADIUS, e.translationX));
      const dy = Math.max(-BASE_RADIUS, Math.min(BASE_RADIUS, e.translationY));
      knobX.value = dx;
      knobY.value = dy;
      onDelta(dx / BASE_RADIUS, dy / BASE_RADIUS);
    })
    .onEnd(() => {
      knobX.value = withSpring(0);
      knobY.value = withSpring(0);
      onDelta(0, 0);
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knobX.value }, { translateY: knobY.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.base}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </View>
    </GestureDetector>
  );
}

export default function JoystickControls({ onUpdate }: Props) {
  const state = useRef<JoystickOutput>({ moveX: 0, moveZ: 0, lookX: 0, lookY: 0 });

  function setMove(dx: number, dy: number) {
    state.current = { ...state.current, moveX: dx, moveZ: dy };
    onUpdate({ ...state.current });
  }

  function setLook(dx: number, dy: number) {
    state.current = { ...state.current, lookX: dx, lookY: dy };
    onUpdate({ ...state.current });
  }

  return (
    <View style={styles.row} pointerEvents="box-none">
      <Stick onDelta={setMove} />
      <Stick onDelta={setLook} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    pointerEvents: 'box-none',
  },
  base: {
    width: BASE_RADIUS * 2,
    height: BASE_RADIUS * 2,
    borderRadius: BASE_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(126,200,126,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  knob: {
    width: STICK_RADIUS * 2,
    height: STICK_RADIUS * 2,
    borderRadius: STICK_RADIUS,
    backgroundColor: 'rgba(126,200,126,0.5)',
  },
});
