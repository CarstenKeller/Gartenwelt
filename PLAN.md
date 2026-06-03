# PLAN.md – Gartenwelt Iteration 1

## Ziel
Progressive Web App: begehbares 3D-Modell des Gartens im Android-Browser.
Verarbeitung via Luma AI (Cloud), Viewer läuft lokal.

## Workflow
```
1. Luma AI App → Garten aufnehmen → Cloud-Verarbeitung → .glb exportieren
2. Gartenwelt-App → .glb laden → Minecraft-Navigation
```

## Stack
- Vite + TypeScript
- Three.js (GLTF-Loader, DRACO-Decoder via CDN)
- Touch-Joystick (2 Sticks) + Gyroscop-Modus
- PWA (installierbar)

## App-Screens
1. Home – Anleitung Luma AI + GLB-Datei auswählen
2. Viewer – Laden-Overlay → 3D-Navigation

## Implementierungsschritte
- [x] Schritt 1   Vite + TypeScript Setup
- [x] Schritt 2   Home Screen mit Luma-AI-Anleitung + Datei-Picker
- [x] Schritt 3   Three.js GLTF-Loader mit DRACO-Support
- [x] Schritt 4   Automatische Kamera-Positionierung (Bounding Box)
- [x] Schritt 5   Minecraft-Navigation (Joystick + WASD)
- [x] Schritt 6   Gyroscop-Modus als Alternative
- [x] Schritt 7   HUD: Zurück + Modus-Toggle + Fade
- [x] Schritt 8   PWA-Manifest
- [ ] Schritt 9   Test mit echtem Luma-AI-Modell

## Starten (Termux)
```bash
npm install && npm run dev
# Im Android-Browser: http://192.168.x.x:5173
```
