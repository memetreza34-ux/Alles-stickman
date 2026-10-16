# StrichKosmos — DIE EINE verbindliche Bildwelt v14

Die **einzige maßgebliche englische Master-Bildwelt** ist [MASTER_VISUAL_STYLE_EN.txt](MASTER_VISUAL_STYLE_EN.txt). Sie gilt für **jedes Thema**, für jede Szene, jedes Cover, jede technische Grafik und jedes Diagramm. Ihr vollständiger Text wird **wörtlich in jeden kopierbaren Google-Flow-Prompt eingebettet**. Ein bloßer Verweis oder eine kurze Stilzusammenfassung ist ab v14 nicht ausreichend.

## Was gleich bleibt
- Premium-2D-Editorial-Zeichenkunst: dunkle leicht unregelmäßige Tuschekonturen, schöne gezeichnete Objekte, gezielter Schatten, klare Komposition.
- Alle gezeigten Menschen sind **eindeutige Stickman-Figuren**; Figuren nur, wenn sie wirklich helfen.
- Fachlich glaubwürdige Geräte und Bildzusammenhänge. Figurenlose Objekt-Sachgrafiken sind genauso wichtig wie lebendige Geschichtsszenen.

## Was variieren darf
- Farbpalette, Tageszeit, Ort, Epoche, Perspektive, grafischer Aufbau, Detailgrad und Einsatz von Text.
- Action-Szene, Vergleich, technische Illustration, historischer Querschnitt, Landschaft, Prozessgrafik und Infografik sind **gleichberechtigt**, sofern sie die jeweilige gesprochene Aussage am besten erklären.
- Dieselbe Bildwelt bedeutet eine gemeinsame Zeichensprache, **nicht dieselbe Hintergrundwelt**.

## Sprache und Qualitätskontrolle
- Prompts und Bild-KI-Anweisungen **komplett Englisch**.
- Im fertigen Bild ausschließlich **korrektes Deutsch**; normalerweise kein Text, sonst 1–2 große klare Labels, maximal 3 in sinnvoller Fachgrafik. Cover dürfen ihre genaue kurze deutsche Headline haben.
- Keine echten/semi-realistischen Menschen, keine 3D-Optik, keine billig-flachen grünen Cliparts, keine endlose Pergamentoptik oder winzige Schulbuch-Texttafeln.
- Nach dem Generieren echte Bilder ansehen und Fehler reparieren. **Ein erfolgreicher Promttest ersetzt keine visuelle Sichtung.**

## Fünf zusätzlich erhaltene Qualitätsbeispiele

Diese Beispiele sind **keine alternativen Bildwelten**, sondern zeigen die eine Bildwelt an unterschiedlichen Themen. Man übernimmt **deren Stilqualität, nicht automatisch ihre Gegenstände**.

| Szenentyp | Beispiel |
|---|---|
| Expressive Stickman-Handlung | [Reisender ohne GPS](style-reference-prompts/01_story_without_gps.txt) |
| Korrekte technische Grafik ohne Figur | [Stromkreis](style-reference-prompts/02_technical_circuit.txt) |
| Vorher/Nachher-Vergleich | [Türschwellen-Effekt](style-reference-prompts/03_psychology_doorway.txt) |
| Geschichte mit nützlichem Querschnitt | [Römisches Aquädukt](style-reference-prompts/04_roman_aqueduct.txt) |
| Kreativer natürlicher Ablauf | [Wasserkreislauf](style-reference-prompts/05_water_cycle.txt) |

## Automatische Anwendung
- **Quelle:** `channel/MASTER_VISUAL_STYLE_EN.txt`
- **Policy:** `config/visual-policy.json` (v14)
- **Projekterstellung:** `src/cli/create-youtube-project.js` ergänzt Master und Coverstarter aus der einen Quelle
- **Vollständige Phase 1:** Einzelbilder, Cover, Master und Batches müssen den *vollständigen* Text enthalten; der Validator prüft das
- **Status:** Nutzer-freigegebene kreative Stilrichtung, aber die fertig gerenderten Google-Flow-Bilder müssen weiterhin separat geprüft werden
