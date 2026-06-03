import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

const BASE = 70;
const KNOB = 50;

export interface JoystickOutput {
  moveX: number;
  moveZ: number;
  lookX: number;
  lookY: number;
}

interface StickProps {
  onDelta: (dx: number, dy: number) => void;
}

function Stick({ onDelta }: StickProps) {
  const pos = useRef(new Animated.ValueXY()).current;

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      const dx = Math.max(-BASE, Math.min(BASE, g.dx));
      const dy = Math.max(-BASE, Math.min(BASE, g.dy));
      pos.setValue({ x: dx, y: dy });
      onDelta(dx / BASE, dy / BASE);
    },
    onPanResponderRelease: () => {
      Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      onDelta(0, 0);
    },
  });

  return (
    <View style={styles.base} {...responder.panHandlers}>
      <Animated.View
        style={[styles.knob, { transform: pos.getTranslateTransform() }]}
      />
    </View>
  );
}

interface Props {
  onUpdate: (out: JoystickOutput) => void;
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
    position: 'absolute', bottom: 40, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 40, pointerEvents: 'box-none',
  },
  base: {
    width: BASE * 2, height: BASE * 2, borderRadius: BASE,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2, borderColor: 'rgba(126,200,126,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  knob: {
    width: KNOB * 2, height: KNOB * 2, borderRadius: KNOB,
    backgroundColor: 'rgba(126,200,126,0.5)',
  },
});
