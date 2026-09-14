# Shyam Bhajan Sangrah

Community bhajan library for live satsangs — scales, singers, lyrics, YouTube timestamps,
tanpura / tabla, setlists, and private practice recordings. Installable PWA, works offline.

## Files
- `index.html` — the whole app (UI, Firestore sync, audio, recorder)
- `sw.js` — service worker: instant app-shell loading, cached fonts/SDK/samples
- `manifest.json`, `icon-192.png`, `icon-512.png` — install metadata
- `sounds/` — tabla bols and tanpura samples (offline fallback)
- `import*.html`, `transpose-feature.patch` — one-off admin/import tools, not used by the app

## Deploying an update
Bump `VERSION` in `sw.js` whenever `index.html` changes. Users see a
"new version ready — tap to update" toast; the app never reloads on its own.

## Recordings
Recordings are captured with `MediaRecorder` and stored on the device in IndexedDB.
They are never uploaded. Share/download uses the phone's own share sheet.
