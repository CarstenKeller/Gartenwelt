# PLAN.md – Gartenwelt Iteration 1

## Ziel
Android-App, die ein MP4-Gartenvideo in eine begehbare 3D-Punktwolke umwandelt.
Navigation wahlweise per virtuellem Joystick oder Swipe/Gyroscop.

## Architektur

```
3-Minuten-MP4
   ↓ 1 Frame/Sekunde extrahieren = ~180 Frames  (ffmpeg-kit)
   ↓ Pro Frame: MiDaS Small Tiefenkarte          (TFLite ~0,3s/Frame)
   ↓ Frame + Tiefenkarte → 3D-Punkte mit Farbe
   ↓ Alle Frames zusammenführen → Punktwolke
   ↓ Three.js Viewer mit freier Bewegung
```

## Stack
- Framework: Expo (EAS Dev Build)
- Frame-Extraktion: ffmpeg-kit-react-native
- Tiefenschätzung: react-native-fast-tflite + MiDaS Small (~14MB)
- 3D-Rendering: expo-gl + three.js + expo-three
- Gesten: react-native-gesture-handler
- Gyroscop: expo-sensors
- Navigation: expo-router

## App-Screens
1. Home – Video auswählen, Verarbeitung starten
2. Processing – Fortschritt (Frames → Tiefe → Punktwolke)
3. Viewer – 3D-Navigation mit umschaltbarer Steuerung

## Implementierungsschritte

- [x] Schritt 1   Expo-Projekt initialisieren + alle Abhängigkeiten installieren
- [x] Schritt 2   Home Screen: Video aus Galerie wählen (expo-document-picker)
- [x] Schritt 3   Frame-Extraktion (ffmpeg-kit-react-native, 1fps, ~180 Frames)
- [x] Schritt 4   MiDaS-Tiefenschätzung pro Frame (react-native-fast-tflite)
- [x] Schritt 5   Punktwolken-Erzeugung: RGB + Tiefe → 3D-Koordinaten
- [x] Schritt 6   Processing Screen mit Fortschrittsanzeige (3 Phasen)
- [x] Schritt 7   Three.js Viewer: Punktwolke laden + rendern (expo-gl)
- [x] Schritt 8   Steuerung Modus A: Virtueller Joystick
- [x] Schritt 9   Steuerung Modus B: Swipe + Gyroscop
- [x] Schritt 10  Steuerung umschalten: Toggle-Button im Viewer
- [ ] Schritt 11  Test mit echtem Gartenvideo + Performance-Optimierung
