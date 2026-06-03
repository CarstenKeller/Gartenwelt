export interface Frame {
  imageData: ImageData;
  timeSeconds: number;
}

const OUT_SIZE = 256;

export async function extractFrames(
  file: File,
  onProgress: (current: number, total: number) => void
): Promise<Frame[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = reject;
    video.load();
  });

  const duration = video.duration;
  const interval = 1; // 1 Frame pro Sekunde
  const count = Math.floor(duration / interval);

  const canvas = document.createElement('canvas');
  canvas.width = OUT_SIZE;
  canvas.height = OUT_SIZE;
  const ctx = canvas.getContext('2d')!;

  const frames: Frame[] = [];
  onProgress(0, count);

  for (let i = 0; i < count; i++) {
    await seekTo(video, i * interval);
    ctx.drawImage(video, 0, 0, OUT_SIZE, OUT_SIZE);
    frames.push({ imageData: ctx.getImageData(0, 0, OUT_SIZE, OUT_SIZE), timeSeconds: i });
    onProgress(i + 1, count);
  }

  URL.revokeObjectURL(url);
  return frames;
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve(); };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
  });
}
