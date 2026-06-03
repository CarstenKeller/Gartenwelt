import { useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { extractFrames } from '../services/frameExtractor';
import { estimateDepth } from '../services/depthEstimator';
import {
  generatePointCloudFromFrame,
  mergePointClouds,
  savePointCloud,
} from '../services/pointCloudGenerator';

type Phase = 'frames' | 'depth' | 'cloud' | 'done' | 'error';

interface Props {
  videoUri: string;
  videoName: string;
  onDone: (cloudPath: string, pointCount: number) => void;
  onBack: () => void;
}

export default function ProcessingScreen({ videoUri, videoName, onDone, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('frames');
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const cancelled = useRef(false);

  useEffect(() => {
    runPipeline();
    return () => { cancelled.current = true; };
  }, []);

  async function runPipeline() {
    try {
      setPhase('frames');
      const { framePaths } = await extractFrames(videoUri, (cur, tot) => {
        setCurrent(cur);
        setTotal(tot);
      });

      if (cancelled.current) return;

      setPhase('depth');
      setCurrent(0);
      setTotal(framePaths.length);

      const chunks: Float32Array[] = [];
      const imgW = 256;
      const imgH = 256;

      for (let i = 0; i < framePaths.length; i++) {
        if (cancelled.current) return;

        const depthMap = await estimateDepth(framePaths[i], imgW, imgH);
        const dummyRgb = new Uint8ClampedArray(imgW * imgH * 4).fill(100);
        const offsetX = (i / Math.max(framePaths.length - 1, 1)) * 6 - 3;
        const chunk = generatePointCloudFromFrame(
          dummyRgb, imgW, imgH, depthMap, [offsetX, 0, -i * 0.3]
        );
        chunks.push(chunk);
        setCurrent(i + 1);
      }

      setPhase('cloud');
      setCurrent(0);
      setTotal(1);
      const cloud = mergePointClouds(chunks);
      const cloudPath = await savePointCloud(cloud);
      setCurrent(1);

      setPhase('done');
      onDone(cloudPath, cloud.pointCount);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }

  function phaseLabel() {
    switch (phase) {
      case 'frames': return 'Frames extrahieren…';
      case 'depth':  return 'Tiefenschätzung…';
      case 'cloud':  return 'Punktwolke erstellen…';
      case 'done':   return 'Fertig!';
      case 'error':  return 'Fehler';
    }
  }

  function stepIndex() {
    switch (phase) {
      case 'frames': return 0;
      case 'depth':  return 1;
      default:       return 2;
    }
  }

  const pct = total > 0 ? current / total : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Verarbeitung</Text>
        <Text style={styles.filename} numberOfLines={1}>{videoName}</Text>

        <View style={styles.stepsRow}>
          {['Frames', 'Tiefe', 'Wolke'].map((label, idx) => (
            <View key={label} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                stepIndex() > idx && styles.stepDone,
                stepIndex() === idx && styles.stepActive,
              ]}>
                <Text style={styles.stepNum}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct * 100}%` }]} />
        </View>

        <Text style={styles.phaseLabel}>{phaseLabel()}</Text>
        {total > 1 && phase !== 'done' && phase !== 'error' && (
          <Text style={styles.count}>{current} / {total}</Text>
        )}

        {phase === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Fehler bei der Verarbeitung</Text>
            <Text style={styles.errorMsg}>{errorMsg}</Text>
            <Pressable style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backBtnText}>Zurück</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d1f0d' },
  container: { flex: 1, padding: 24, alignItems: 'center', gap: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#7ec87e', marginTop: 20 },
  filename: { fontSize: 14, color: '#5a7a5a', maxWidth: '100%' },
  stepsRow: { flexDirection: 'row', gap: 32, marginTop: 20 },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1a2e1a', borderWidth: 2, borderColor: '#2d4a2d',
    alignItems: 'center', justifyContent: 'center',
  },
  stepActive: { borderColor: '#7ec87e', backgroundColor: '#2d4a2d' },
  stepDone: { borderColor: '#4a8a4a', backgroundColor: '#4a8a4a' },
  stepNum: { color: '#c8e6c8', fontWeight: 'bold' },
  stepLabel: { fontSize: 12, color: '#5a7a5a' },
  track: {
    width: '100%', height: 8, backgroundColor: '#1a2e1a',
    borderRadius: 4, marginTop: 16, overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#7ec87e', borderRadius: 4 },
  phaseLabel: { fontSize: 16, color: '#c8e6c8', fontWeight: '500' },
  count: { fontSize: 14, color: '#5a7a5a' },
  errorBox: {
    backgroundColor: '#2e1a1a', borderRadius: 12,
    padding: 20, width: '100%', gap: 10, marginTop: 20,
  },
  errorTitle: { color: '#e07070', fontWeight: 'bold', fontSize: 16 },
  errorMsg: { color: '#a07070', fontSize: 13, lineHeight: 20 },
  backBtn: {
    backgroundColor: '#4a2a2a', borderRadius: 10,
    padding: 12, alignItems: 'center', marginTop: 8,
  },
  backBtnText: { color: '#e07070', fontWeight: '600' },
});
