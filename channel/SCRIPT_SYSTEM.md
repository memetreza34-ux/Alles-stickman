# Skript-System — Alles Stickman

Status: **verbindlich**

## Ziel

Die Skripte sollen wie kurze neugiergetriebene Erklärgeschichten funktionieren, nicht wie Schulreferate und nicht wie generische KI-Texte.

## Feste Struktur

### 1. Hook

Direkt mit der spannendsten Frage, einem Problem, einem Widerspruch oder einem überraschenden Fakt beginnen.

Nicht:
- „Hallo und willkommen …“
- „In diesem Video …“
- „Heute schauen wir uns …“

Der Zuschauer soll sofort verstehen, **warum die Frage interessant ist**.

### 2. Setup

Nur den Kontext erklären, der für den Hauptteil wirklich nötig ist. Keine lange Vorgeschichte.

### 3. Hauptteil

Bevorzugte Dramaturgie:

```text
Problem
→ Versuch / Entwicklung
→ neues Problem oder Einschränkung
→ Lösung / nächste Entwicklung
→ Folge
```

Nicht jedes Thema muss exakt diese fünf Schritte haben, aber der Hauptteil braucht eine erkennbare Entwicklung statt einer bloßen Faktenliste.

Ungefähr alle 20–40 Sekunden soll ein neuer Informationsimpuls kommen: neue Ursache, neue Frage, Wendung, Vergleich, Konsequenz oder überraschendes Detail.

### 4. Auflösung

Die Kernfrage des Hooks klar beantworten. Nicht ausweichen und nicht nur zusammenfassen.

### 5. Schluss

Sehr kurz. Ein letzter Gedanke, eine interessante Konsequenz oder eine natürliche Weiterführung reicht. Kein langes Outro und kein erzwungener CTA.

## Sprachregeln

- natürliches, direktes Deutsch
- kurze bis mittlere Sätze
- bevorzugt höchstens etwa 22 Wörter pro Satz
- 32 Wörter pro Satz sind Hard-Max
- keine unnötigen Wiederholungen
- keine Füllsätze
- keine KI-Floskeln
- Fachbegriffe sofort einfach erklären
- Zahlen nur nutzen, wenn sie wirklich etwas erklären
- Unsicherheiten in Geschichte, Evolution oder Wissenschaft sauber kennzeichnen
- keine erfundenen Fakten
- möglichst jeder Absatz muss visuell umsetzbar sein

## Längenregel

Die Wortzahl richtet sich nach der geplanten Videodauer. Als technischer Korridor gelten ungefähr **115–180 Wörter pro Minute** vor der finalen Audioanpassung.

Die Pipeline prüft die Wortzahl gegen `targetDurationSeconds`.

## SCRIPT_PLAN.json

Jedes Video besitzt zusätzlich:

`99-technik/SCRIPT_PLAN.json`

Darin stehen die fünf Abschnitte mit einem exakten Startanker aus dem Voice-over. Dadurch kann Phase 1 automatisch prüfen, dass:

- alle fünf Abschnitte vorhanden sind
- die Anker exakt im Skript vorkommen
- die Reihenfolge Hook → Setup → Hauptteil → Auflösung → Schluss stimmt
- der Hook tatsächlich am Anfang beginnt
- keine generische Begrüßung verwendet wird
- die Wortzahl zur Zielzeit passt

## Qualitätsprinzip

Ein starkes Skript soll drei Dinge gleichzeitig leisten:

1. **Neugier halten**
2. **korrekt erklären**
3. **gut visualisierbar sein**

Wenn einer dieser drei Punkte fehlt, ist das Skript noch nicht Phase-1-ready.
