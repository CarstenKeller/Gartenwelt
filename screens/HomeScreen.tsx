import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface Props {
  onStart: (videoUri: string, videoName: string) => void;
}

interface VideoInfo {
  uri: string;
  name: string;
  size?: number;
}

export default function HomeScreen({ onStart }: Props) {
  const [video, setVideo] = useState<VideoInfo | null>(null);

  async function pickVideo() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/mp4',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setVideo({ uri: asset.uri, name: asset.name, size: asset.size ?? undefined });
  }

  function startProcessing() {
    if (!video) return;
    if ((video.size ?? 0) > 500 * 1024 * 1024) {
      Alert.alert('Datei zu groß', 'Bitte ein Video unter 500 MB wählen.');
      return;
    }
    onStart(video.uri, video.name);
  }

  function formatSize(bytes?: number) {
    if (!bytes) return '';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🌿</Text>
          <Text style={styles.title}>Gartenwelt</Text>
          <Text style={styles.subtitle}>
            Verwandle dein Gartenvideo in ein begehbares 3D-Modell
          </Text>
        </View>

        <View style={styles.card}>
          {video ? (
            <View style={styles.videoInfo}>
              <Text style={styles.videoName} numberOfLines={1}>
                {video.name}
              </Text>
              <Text style={styles.videoSize}>{formatSize(video.size)}</Text>
              <Pressable style={styles.changeBtn} onPress={pickVideo}>
                <Text style={styles.changeBtnText}>Anderes Video wählen</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.pickBtn} onPress={pickVideo}>
              <Text style={styles.pickBtnIcon}>📂</Text>
              <Text style={styles.pickBtnText}>Video auswählen</Text>
              <Text style={styles.pickBtnHint}>MP4-Format, 1–5 Minuten empfohlen</Text>
            </Pressable>
          )}
        </View>

        {video && (
          <Pressable style={styles.startBtn} onPress={startProcessing}>
            <Text style={styles.startBtnText}>3D-Modell erstellen</Text>
          </Pressable>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️  Die Verarbeitung dauert bei 3 Minuten Video ca. 2–3 Minuten.
            Das Gerät bleibt dabei aktiv – bitte nicht sperren.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d1f0d' },
  container: { flex: 1, padding: 24, gap: 20 },
  hero: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emoji: { fontSize: 56 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#7ec87e' },
  subtitle: { fontSize: 15, color: '#8a9e8a', textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: '#1a2e1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d4a2d',
  },
  pickBtn: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  pickBtnIcon: { fontSize: 40 },
  pickBtnText: { fontSize: 18, fontWeight: '600', color: '#7ec87e' },
  pickBtnHint: { fontSize: 13, color: '#5a7a5a' },
  videoInfo: { gap: 6 },
  videoName: { fontSize: 16, fontWeight: '600', color: '#c8e6c8' },
  videoSize: { fontSize: 13, color: '#5a7a5a' },
  changeBtn: { marginTop: 8 },
  changeBtnText: { fontSize: 14, color: '#7ec87e', textDecorationLine: 'underline' },
  startBtn: {
    backgroundColor: '#4a8a4a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnText: { fontSize: 17, fontWeight: 'bold', color: '#ffffff' },
  infoBox: {
    backgroundColor: '#0d1f0d',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#4a8a4a',
  },
  infoText: { fontSize: 13, color: '#6a8a6a', lineHeight: 20 },
});
