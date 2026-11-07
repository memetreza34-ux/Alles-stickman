# Master Voice Reference (`stickman-user-clone`)

Hier liegt die fertig kalibrierte Master-Referenzstimme für das **100 % lokale Apple Silicon MLX Voice-Cloning (`Qwen3-TTS-12Hz-1.7B-Base-bf16`)**.

## Dateien im Verzeichnis

| Datei | Beschreibung |
| :--- | :--- |
| `user_voice_reference.wav` | 24 kHz Mono PCM Master-Referenz-Audio (18,48 s, entrauscht & EBU R128 normalisiert) |
| `user_voice_reference.json` | Exakte Transkription (`ref_text`) + kalibrierte Synthese-Parameter (`0.95x` Tempo, `0.30s` Pausen, `32` Wörter/Chunk) |

## Kalibrierte Parameter (Kanalübergreifender Standard)

- **Standard-Profil (`config/voice-policy.json`):** `stickman-user-clone` (`defaultProfile`)
- **Modell:** `mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16` (In-Context Voice Cloning)
- **Sprechtempo (`tempo`):** `0.95` (`-5%` via FFmpeg `atempo=0.95` — verlangsamt ausschließlich die Wort-Artikulation auf ~145–170 WPM)
- **Satzpausen (`maxPauseSeconds`):** `0.30 s` fest (vor `atempo=0.95` auf `0.285 s` skaliert, sodass die Pausen nach dem Time-Stretch exakt bei `0.300 s` bleiben)
- **Chunk-Größe (`maxWordsPerChunk`):** Max. `32` Wörter pro Generierungs-Block (verhindert das Hochbeschleunigen bei langen Absätzen)
- **Mastering (`voiceBoost`):** Highpass 75 Hz, De-Esser (6,6 kHz), Warmth-EQ (180 Hz), Präsenz-EQ (3,2 kHz), AI-Sheen-Taming (11,5 kHz), Röhrenwärme (`tanh`) & EBU R128 (`-16 LUFS`).

## Verwendung

```bash
npm run voice:youtube -- --dir "youtube/<woche>/<thema>"
```
