import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { extractFrames } from '../services/frameExtractor';
import { estimateDepth } from '../services/depthEstimator';
import {
  generatePointCloudFromFrame,
  mergePointClouds,
  savePointCloud,
} from '../services/pointCloudGenerator';

type Phase = 'frames' | 'depth' | 'cloud' | 'done' | 'error';

interface PhaseState {
  current: number;
  total: number;
}

export default function ProcessingScreen() {
  const { videoUri, videoName } = useLocalSearchParams<{
    videoUri: string;
    videoName: string;
  }>();

  const [phase, setPhase] = useState<Phase>('frames');
  const [progress, setProgress] = useState<PhaseState>({ current: 0, total: 1 });
  const [errorMsg, setErrorMsg] = useState('');
  const cancelled = useRef(false);

  useEffect(() => {
    if (!videoUri) return;
    runPipeline();
    return () => { cancelled.current = true; };
  }, []);

  async function runPipeline() {
    try {
      // Phase 1: Frames extrahieren
      setPhase('frames');
      const { framePaths } = await extractFrames(videoUri, (cur, tot) => {
        setProgress({ current: cur, total: tot });
      });

      if (cancelled.current) return;

      // Phase 2: Tiefenschätzung
      setPhase('depth');
      setProgress({ current: 0, total: framePaths.length });

      const chunks: Float32Array[] = [];
      // Dummy-Bildgröße bis echter Decoder integriert ist
      const imgW = 256;
      const imgH = 256;

      for (let i = 0; i < framePaths.length; i++) {
        if (cancelled.current) return;

        const depthMap = await estimateDepth(framePaths[i], imgW, imgH);

        // Phase 3 inline: Punktwolke aus diesem Frame erzeugen
        const dummyRgb = new Uint8ClampedArray(imgW * imgH * 4).fill(128);
        const offsetX = (i / framePaths.length) * 5 - 2.5;
        const chunk = generatePointCloudFromFrame(
          dummyRgb,
          imgW,
          imgH,
          depthMap,
          [offsetX, 0, -i * 0.3]
        );
        chunks.push(chunk);

        setProgress({ current: i + 1, total: framePaths.length });
      }

      // Phase 3: Zusammenführen + speichern
      setPhase('cloud');
      setProgress({ current: 0, total: 1 });
      const cloud = mergePointClouds(chunks);
      const cloudPath = await savePointCloud(cloud);
      setProgress({ current: 1, total: 1 });

      setPhase('done');

      router.replace({
        pathname: '/viewer',
        params: { cloudPath, pointCount: cloud.pointCount },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      setPhase('error');
    }
  }

  function getPhaseLabel() {
    switch (phase) {
      case 'frames': return 'Frames extrahieren…';
      case 'depth':  return 'Tiefenschätzung…';
      case 'cloud':  return 'Punktwolke erstellen…';
      case 'done':   return 'Fertig!';
      case 'error':  return 'Fehler';
    }
  }

  function getPhaseStep() {
    switch (phase) {
      case 'frames': return 1;
      case 'depth':  return 2;
      case 'cloud':  return 3;
      default:       return 3;
    }
  }

  const pct = progress.total > 0 ? progress.current / progress.total : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verarbeitung läuft</Text>
      <Text style={styles.filename} numberOfLines={1}>{videoName}</Text>

      <View style={styles.stepsRow}>
        {['Frames', 'Tiefe', 'Wolke'].map((label, idx) => (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepCircle, getPhaseStep() > idx && styles.stepDone,
              getPhaseStep() === idx + 1 && styles.stepActive]}>
              <Text style={styles.stepNum}>{idx + 1}</Text>
            </View>
            <Text style={styles.stepLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>

      <Text style={styles.phaseLabel}>{getPhaseLabel()}</Text>
      <Text style={styles.countLabel}>
        {phase !== 'done' && phase !== 'error' && progress.total > 1
          ? `${progress.current} / ${progress.total}`
          : ''}
      </Text>

      {phase === 'error' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Fehler bei der Verarbeitung</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Zurück</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7ec87e',
    marginTop: 20,
  },
  filename: {
    fontSize: 14,
    color: '#5a7a5a',
    maxWidth: '100%',
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 20,
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a2e1a',
    borderWidth: 2,
    borderColor: '#2d4a2d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    borderColor: '#7ec87e',
    backgroundColor: '#2d4a2d',
  },
  stepDone: {
    borderColor: '#4a8a4a',
    backgroundColor: '#4a8a4a',
  },
  stepNum: {
    color: '#c8e6c8',
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 12,
    color: '#5a7a5a',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#1a2e1a',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7ec87e',
    borderRadius: 4,
  },
  phaseLabel: {
    fontSize: 16,
    color: '#c8e6c8',
    fontWeight: '500',
  },
  countLabel: {
    fontSize: 14,
    color: '#5a7a5a',
    height: 20,
  },
  errorBox: {
    backgroundColor: '#2e1a1a',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    gap: 10,
    marginTop: 20,
  },
  errorTitle: {
    color: '#e07070',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorMsg: {
    color: '#a07070',
    fontSize: 13,
    lineHeight: 20,
  },
  backBtn: {
    backgroundColor: '#4a2a2a',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backBtnText: {
    color: '#e07070',
    fontWeight: '600',
  },
});
