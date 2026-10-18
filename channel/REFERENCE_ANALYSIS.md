# Referenzanalyse — was Stickman-Erklärkanäle erfolgreich macht

Stand: 18.10.2026 · Methode: echte Videos geladen, Transkripte ausgewertet, Schnitte per Szenenerkennung gezählt, Frames und Thumbnails angesehen. Danach dieselben Messungen an unseren eigenen Videos (Wasser KW41, GPS KW42).

## Datengrundlage

| Kanal / Video | Aufrufe | Länge | Ø Shot | Zahlen/Min | „du/you“/Min |
|---|---|---|---|---|---|
| Ink Explainer – *What Did Ancient Humans Actually Do All Day?* | 14,5 Mio. | 11:12 | 2,7 s | 3,9 | 8,7 |
| Ink Explainer – *How Did Ancient Humans Travel the World?* | 857.000 | 9:22 | 2,5 s | 7,2 | 6,9 |
| Ink Explainer – *The Disturbing Ways Ancient Humans Survived Winter* | 1,05 Mio. | 11:30 | – | 1,3 | 7,4 |
| DrawnPast – *How Did Humans Find Their Way Without GPS?* | 24 | 3:20 | – | 3,4 | 6,7 |
| **Unser GPS-Video** | – | 6:07 | 4,8 s | **0,5** | **1,5** |
| **Unser Wasser-Video** | – | 5:55 | 4,6 s | **0,2** | **0,3** |

Ink Explainer startete im Mai 2026 und hat im Oktober 136.000 Abos, also genau unser Format: nur Stimme und Bilder. AskOddQuestions (6.900 Abos) lädt täglich 25-Minuten-Videos hoch und erreicht 6.000–26.000 Aufrufe pro Video. Die Suche nach „stickman history“ liefert dutzende KI-Kanäle mit 3–200 Aufrufen. Die Nische ist voll, nur Qualität setzt sich durch.

## Skript: die Formel der Gewinner

1. **Hook = du heute ↔ damals.** „Heute Morgen hat dich eine Maschine angeschrien …“ → „Spul 50.000 Jahre zurück.“ Der Zuschauer steckt in Satz 1 selbst in der Szene.
2. **Was auf dem Spiel stand**, früh und konkret: „Der Winter kam aus vier Richtungen: Kälte, Hunger, Tiere, Dunkelheit.“ Diese Liste ist zugleich die Kapitelstruktur.
3. **Mythos gegen Beweis:** „Das glaubten alle. Der Beweis, dass es falsch ist, lag im Boden.“
4. **Detektiv-Momente:** „Wir wissen das, weil Archäologen … gefunden haben.“ Fund, Ort, Jahr.
5. **Kette statt Liste:** Laufen → Fluss blockiert → Boot → zu schwere Beute → Schleppen → Hund → Pferd → Rad. Jede Lösung öffnet das nächste Problem.
6. **Immersion:** „Ich zeig dir einen normalen Tag. Du wachst bei Sonnenaufgang auf …“
7. **Rückbezug am Schluss:** Pendeln, WLAN, Heizung, also genau das Bild vom Anfang, dann ein emotionaler Satz statt Abo-Bitte.

Das Verlierer-Video (24 Aufrufe) hat ebenfalls „you“ und Zahlen, ist aber 3 Minuten Witz-Aufzählung ohne Kette, ohne Beweis und ohne Fallhöhe. Konkretheit und „du“ sind also nötig, reichen aber allein nicht.

## Bilder: was anders ist

- **Eine wiederkehrende Figur:** gleiche runde Kopfform, Punktaugen, minimale Mimik. Steinzeit-Version = gleicher Kopf + Haare + Fell.
- **Schnitt alle 2,5–2,7 s:** pro Halbsatz ein Bild, viele Close-ups (Wecker, Füße auf Steinen, Augen im Wald).
- **Text-Karten für Zahlen und Wendepunkte:** „100.000 YEARS AGO“, „REWIND 50,000 YEARS“, „TWO HIDES“. Das ist Schrift im Schnitt, nicht im gezeichneten Bild.
- **Einfacher, heller, flacher Stil** mit klaren Emotionen. Unser Editorial-Stil ist hochwertiger gezeichnet, aber langsamer lesbar.
- **Thumbnail:** 2 Wörter in Gelb mit schwarzer Kontur, ein großes Gesicht mit klarer Emotion, heller Himmel. Unser GPS-Thumbnail: dunkel, kleine Figuren, dünne weiße Schrift.

## Was wir übernehmen (Pipeline v8)

| Erkenntnis | Umsetzung |
|---|---|
| du-Hook, Fallhöhe, Kette, Beweise, Rückbezug | `SCRIPT_PLAN.storyEngine` wird in Phase 1 geprüft |
| Zahlen, „du“, wenig Abschwächung | `config/script-policy.json` → `scriptMetrics` |
| Wiederkehrende Figur | `config/visual-policy.json` → `protagonist` (roter Schal) |
| Schneller Schnitt | Ø 3–5 s statt 4,5–7,5 s |
| Text-Karten | Remotion-Overlay `overlay` pro Bild, nie Text im KI-Bild |
| Thumbnail-Formel | `uploadMetadata.thumbnailText` wird beim Export gesetzt |

## Was wir bewusst nicht kopieren

- Den flachen Ink-Explainer-Look 1:1. Unser handgezeichneter Stil bleibt das Erkennungsmerkmal. Ob ein einfacherer Stil besser läuft, ist ein Experiment im `IMPROVEMENT_LEDGER`.
- Englische Titel/Formulierungen und die 25-Minuten-Länge von AskOddQuestions.

## Quellen

- https://www.youtube.com/watch?v=49_Ph2q6uIM
- https://www.youtube.com/watch?v=QP1maS6hYn4
- https://www.youtube.com/watch?v=dp3jYZXKOos
- https://www.youtube.com/watch?v=9jq4DcrYqGY
- https://www.youtube.com/@AskOddQuestions/videos
