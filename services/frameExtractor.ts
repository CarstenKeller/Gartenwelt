import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';

export interface ExtractionResult {
  framePaths: string[];
  frameCount: number;
}

export async function extractFrames(
  videoUri: string,
  onProgress: (current: number, total: number) => void
): Promise<ExtractionResult> {
  const outputDir = FileSystem.cacheDirectory + 'gartenwelt_frames/';

  await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });

  // Leere altes Verzeichnis
  const existing = await FileSystem.readDirectoryAsync(outputDir);
  await Promise.all(
    existing.map((f) => FileSystem.deleteAsync(outputDir + f, { idempotent: true }))
  );

  // 1 Frame pro Sekunde extrahieren, max 512px breite Seite für Performance
  const outputPattern = outputDir + 'frame_%04d.jpg';
  const command = `-i "${videoUri}" -vf "fps=1,scale='if(gt(iw,ih),512,-2)':'if(gt(iw,ih),-2,512)'" -q:v 3 "${outputPattern}"`;

  onProgress(0, 1);

  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();

  if (!ReturnCode.isSuccess(returnCode)) {
    const logs = await session.getAllLogsAsString();
    throw new Error('Frame-Extraktion fehlgeschlagen: ' + logs);
  }

  const files = await FileSystem.readDirectoryAsync(outputDir);
  const framePaths = files
    .filter((f) => f.endsWith('.jpg'))
    .sort()
    .map((f) => outputDir + f);

  onProgress(framePaths.length, framePaths.length);

  return { framePaths, frameCount: framePaths.length };
}

export async function cleanupFrames(): Promise<void> {
  const outputDir = FileSystem.cacheDirectory + 'gartenwelt_frames/';
  await FileSystem.deleteAsync(outputDir, { idempotent: true });
}
