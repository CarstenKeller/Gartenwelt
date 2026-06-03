# PLAN.md – Gartenwelt Iteration 1

## Ziel
Progressive Web App (Android-Browser), die ein MP4-Gartenvideo in
eine begehbare 3D-Punktwolke umwandelt.

## Plattform-Entscheidung
React Native / Expo → **Web App (Vite + TypeScript)**
Grund: Expo-Kompatibilitätsprobleme, Web bietet gleiche Qualität ohne Setup-Aufwand.

## Pipeline
```
MP4-Video
   ↓ Canvas-API: 1 Frame/Sekunde extrahieren
   ↓ TensorFlow.js MiDaS: Tiefenkarte pro Frame (WebGL-beschleunigt)
   ↓ Punktwolken-Generator: RGB + Tiefe → 3D-Koordinaten
   ↓ Three.js Viewer: Freie Navigation mit Touch-Steuerung
```

## Stack
- Build:      Vite + TypeScript
- 3D:         Three.js
- KI-Tiefe:   TensorFlow.js + MiDaS Small
- Steuerung:  Virtueller Joystick (Touch) + Gyroscop-Modus
- Verteilung: PWA (im Android-Browser installierbar)

## Implementierungsschritte

- [x] Schritt 1   Vite + TypeScript Projekt-Setup
- [x] Schritt 2   Home Screen: Video aus Galerie wählen
- [x] Schritt 3   Frame-Extraktion via Canvas-API (1fps)
- [x] Schritt 4   TF.js MiDaS Tiefenschätzung (mit Fallback)
- [x] Schritt 5   Punktwolken-Generator
- [x] Schritt 6   Processing Screen mit 3-Phasen-Fortschritt
- [x] Schritt 7   Three.js Viewer mit Fog + VertexColors
- [x] Schritt 8   Virtueller Joystick (zwei Sticks, Multi-Touch)
- [x] Schritt 9   Gyroscop-Modus als Alternative
- [x] Schritt 10  HUD: Zurück-Button + Modus-Toggle
- [ ] Schritt 11  Test mit echtem Gartenvideo

## Starten (Termux)
```bash
npm install
npm run dev
# Browser öffnen: http://192.168.x.x:5173
```
