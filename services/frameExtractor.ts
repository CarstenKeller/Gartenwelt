import * as FileSystem from 'expo-file-system';
import { Video, AVPlaybackStatus } from 'expo-av';

// Expo-av-basierte Frame-Extraktion über Video-Seeking + GLView-Snapshot.
// Ohne ffmpeg: Wir nutzen expo-av's getStatusAsync + einen nativen
// Thumbnail-Ansatz via expo-video-thumbnails.

export interface ExtractionResult {
  framePaths: string[];
  frameCount: number;
}

export async function extractFrames(
  videoUri: string,
  onProgress: (current: number, total: number) => void
): Promise<ExtractionResult> {
  // expo-video-thumbnails: generiert Thumbnails zu gegebenen Zeitstempeln
  const { VideoThumbnails } = await import('expo-video-thumbnails');

  const outputDir = FileSystem.cacheDirectory + 'gartenwelt_frames/';
  await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });

  // Bestehende Frames löschen
  const existing = await FileSystem.readDirectoryAsync(outputDir);
  await Promise.all(
    existing.map((f) => FileSystem.deleteAsync(outputDir + f, { idempotent: true }))
  );

  // Video-Dauer ermitteln
  const durationMs = await getVideoDuration(videoUri);
  const intervalMs = 1000; // 1 Frame pro Sekunde
  const frameCount = Math.floor(durationMs / intervalMs);

  onProgress(0, frameCount);

  const framePaths: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    const timeMs = i * intervalMs;

    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: timeMs,
        quality: 0.8,
      });

      // In Cache-Verzeichnis kopieren
      const destPath = outputDir + `frame_${String(i).padStart(4, '0')}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: destPath });
      framePaths.push(destPath);
    } catch {
      // Einzelner Frame-Fehler ist tolerierbar
    }

    onProgress(i + 1, frameCount);
  }

  return { framePaths, frameCount: framePaths.length };
}

async function getVideoDuration(videoUri: string): Promise<number> {
  const video = new Video();
  // expo-av: Metadaten lesen ohne Wiedergabe
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const { sound, status } = await Video.createAsync(
          { uri: videoUri },
          { shouldPlay: false }
        );
        const s = status as AVPlaybackStatus & { durationMillis?: number };
        const duration = s.isLoaded ? (s.durationMillis ?? 60000) : 60000;
        await sound.unloadAsync();
        resolve(duration);
      } catch {
        resolve(60000); // Fallback: 1 Minute
      }
    })();
  });
}

export async function cleanupFrames(): Promise<void> {
  const outputDir = FileSystem.cacheDirectory + 'gartenwelt_frames/';
  await FileSystem.deleteAsync(outputDir, { idempotent: true });
}
