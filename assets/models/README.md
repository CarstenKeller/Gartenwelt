# MiDaS Small TFLite Modell

Das Modell `midas_small.tflite` (~14 MB) muss hier abgelegt werden, bevor die App gebaut wird.

## Download

```bash
curl -L -o midas_small.tflite \
  https://github.com/isl-org/MiDaS/releases/download/v2_1/model_small.tflite
```

## Spezifikationen
- Eingabe:  1 × 256 × 256 × 3  (float32, normalisiert [0,1])
- Ausgabe:  1 × 256 × 256      (float32, relative Tiefe)
- Größe:    ~14 MB
