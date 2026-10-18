# Skript-System — Pipeline v8

Ziel: Erklärgeschichten, bei denen der Zuschauer mitten drinsteckt. Keine Schulreferate. Grundlage: [Referenzanalyse](REFERENCE_ANALYSIS.md).

## Die Formel

| Teil | Was passiert | Beispiel (Längengrad) |
|---|---|---|
| **Hook** | du heute ↔ derselbe Moment früher, dann die Frage | „Dein Handy zeigt dir in einer Sekunde, wo du bist. Im Oktober 1707 wusste das auf vier Kriegsschiffen niemand …“ |
| **Fallhöhe** | Was stand auf dem Spiel? Konkret. | „… über tausend Seeleute kostete dieser Fehler das Leben.“ |
| **Kette** | Problem → Lösung → neues Problem (mind. 4×) | Zeit fehlt → Uhr → Pendel versagt → Preisgeld → niemand kann's → Tischler Harrison |
| **Beweise** | „Wir wissen das, weil …“ mit Fund/Jahr/Ort (mind. 3×, Quelle in RECHERCHE.md) | „… weil sie 1761 auf einer Fahrt nach Jamaika getestet wurde.“ |
| **Immersion** | „Stell dir vor, du …“ | „Stell dir vor, du bist Tischler in einem Dorf …“ |
| **Auflösung** | Frage klar beantworten | „Die Sonne verriet die Breite, eine genaue Uhr die Länge.“ |
| **Rückbezug** | Schluss greift den Hook auf, endet mit Gefühl | „Dein Handy macht heute dasselbe … die Idee eines Dorftischlers.“ |

Vollständiges Beispielskript: [test/fixtures/v8-laengengrad/voice-script.txt](../test/fixtures/v8-laengengrad/voice-script.txt).

## Automatische Prüfung (Phase 1)

`SCRIPT_PLAN.json → storyEngine` hält die Formel mit **exakten Ankern** fest: `openingContrast`, `stakes`, `escalation` (≥ 4), `evidence` (≥ 3, URL muss in RECHERCHE.md stehen), `callback`. Fehlt etwas oder steht ein Anker nicht im Skript, ist Phase 1 nicht bestanden.

Dazu misst `src/lib/script-quality.js`:

| Kennzahl | Fehler | Hinweis | GPS-Video | Ink Explainer |
|---|---|---|---|---|
| Zahlen/Jahre pro Minute | < 0,75 | < 1,5 | 0,5 | 1,3–7,2 |
| Vorsichtswörter pro 100 Wörter | > 2,0 | > 1,0 | 1,5 | 0,6–0,9 |
| „du“ pro Minute | – | < 3 | 1,5 | 6,9–8,7 |
| Fragen pro Minute | – | < 0,4 | 0,3 | – |

Unsicherheit **einmal klar benennen** („Wie genau, wissen wir nicht. Sicher ist …“), statt jeden Satz mit „vermutlich/konnte/ungefähr“ abzuschwächen.

## Weiterhin gültig

- Struktur Hook → Setup → Hauptteil → Auflösung → Schluss mit Startankern.
- Erster Satz ≤ 24 Wörter, Hook bis Setup ≤ 45 Wörter, kein „Hallo“ und kein „In diesem Video“.
- 150–170 Wörter pro Minute Zieldauer, Satz-Hard-Max 32 Wörter.
- Keine erfundenen Fakten. Jede Zahl steht in RECHERCHE.md.
- Kein Abo-Aufruf am Ende.
