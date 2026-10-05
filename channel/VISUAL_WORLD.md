# Eigene Bildwelt — Alles Stickman

Status: READY

Style-ID: `alles-stickman-editorial-v1`

## Ziel

Alles Stickman bekommt eine eigene, wiedererkennbare 2D-Erklärwelt. Die Referenzkanäle zeigen nur das Formatprinzip. Figuren, Linien, Farben, Cover und Kompositionen werden nicht kopiert.

Die Bildwelt soll für Evolution, Steinzeit, Antike, Alltag, Erfindungen, Ressourcen, Karten und einfache Infografiken funktionieren.

## Figuren

- vereinfachter Stickman-/Cartoon-Körper
- schlanke Gliedmaßen
- leicht ovaler bis runder Kopf
- warme Elfenbein-Kopffarbe statt reinem Digital-Weiß
- klare dunkle Außenlinie
- einfache große Augen und gut lesbare Pupillen
- ausdrucksstarke Augenbrauen
- klarer Mund
- Emotionen müssen auch als kleines YouTube-Bild lesbar sein
- Haare und Bärte leicht handgezeichnet und unregelmäßig
- Hände einfach halten, keine realistischen Finger-Details
- Kleidung reduziert, aber epochemäßig plausibel

## Linien

- dunkles Anthrazit
- mittelstarke Kontur
- leicht unregelmäßige Tintenwirkung
- keine sterile Vektorperfektion
- keine stark glänzende 3D-Schattierung

## Farben

Grundpalette:
- Charcoal `#242321`
- Warm Ivory `#F1E5CF`
- Sand `#D5B17A`
- Ochre `#C48A35`
- Rust `#A75842`
- Sage `#7B8A65`
- Muted Blue `#6B8FA3`
- Night Navy `#2B3948`

Regel:
- wenige dominante Farben je Szene
- natürliche, eher gedämpfte Grundpalette
- kräftige Akzente nur für Blickführung, Gefahr, Feuer oder Hauptobjekte

## Hintergründe

- reduziert bis mittel detailliert
- Ort und Epoche müssen sofort erkennbar sein
- Hintergrund darf die Hauptidee nicht überladen
- historische Architektur, Werkzeuge, Vegetation und Requisiten soweit möglich plausibel
- Vordergrund, Mittelgrund und Hintergrund dürfen klar getrennt sein

## Visual Forms

Nicht jede Szene braucht Menschen.

Erlaubt und erwünscht:
- Stickman-Handlungsszene
- Objekt-/Fundstück-Erklärung
- Vorher-Nachher-Vergleich
- Ursache-Wirkung
- Karte mit Route
- Zeitleiste
- Schritt-für-Schritt-Prozess
- Diagramm/Zahlenvergleich
- Querschnitt
- Split-Screen
- Umgebung ohne Menschen

## Cover / Bild 01

Bild 01 ist:
- Cover
- erste Videoszene
- einzige Bildreferenz für alle weiteren Bilder

Pro Video werden exakt drei Cover-Kandidaten erzeugt.

Ein starkes Cover hat:
- eine Hauptidee
- typischerweise 1–3 große Figuren oder 1 Figur plus 1 Hauptobjekt
- starke Emotion
- sehr einfache Blickführung
- reduzierten Hintergrund
- das Thema muss in ungefähr einer Sekunde verständlich sein

Wenn Text genutzt wird:
- maximal 2–4 kurze deutsche Wörter
- sehr groß
- sehr hoher Kontrast
- kein Pseudotext
- keine exakte Typografie eines Referenzkanals kopieren

## Referenzregel

Nach Auswahl des Cover-Gewinners gilt:

`Bild 01.png` = einzige visuelle Bildreferenz für `Bild 02.png` bis `Bild NN.png`.

Die Referenz stabilisiert:
- Linienführung
- Gesichtslogik
- Figurenwelt
- Farbgefühl
- allgemeine Illustrationssprache

Sie darf nicht mechanisch kopiert werden bei:
- Pose
- Kamera
- Hintergrund
- Figurenposition
- Komposition

Frühere Szenenbilder dürfen nicht als zusätzliche Referenz benutzt werden.

## Historische Plausibilität

Bei historischen Themen:
- Epoche beachten
- moderne Gegenstände vermeiden
- Kleidung und Werkzeuge plausibel halten
- bei Unsicherheit lieber vereinfachen als spezifische falsche Details erfinden

## Sichtbarer Text

- Deutsch
- keine Fantasieschrift
- keine langen Absätze
- kurze Labels erlaubt
- Karten und Diagramme dürfen kurze Beschriftungen enthalten

## Verboten

- direkte Stilkopie eines bestehenden Referenzkanals
- 3D-Pixar-Look
- Fotorealismus
- Anime/Manga-Look
- generische glänzende KI-3D-Optik
- Pseudotext
- deformierte Hände
- zusätzliche Gliedmaßen
- überladene Hintergründe ohne Erklärwert
- dieselbe Pose über viele Szenen
- unnötige Menschenmengen
- unplausible moderne Gegenstände in historischen Szenen
- fremde Logos oder Wasserzeichen

## Produktionsregel

Nach dem Cover werden alle übrigen Bilder in maximal 5er-Blöcken erzeugt. Jedes Nicht-Cover-Bild wird genau einmal erzeugt, außer bei technischem Fehlschlag oder eindeutig unbrauchbarem Output.

Am Ende liegen alle finalen Bilder gemeinsam und flach in:

`00-bildprompts/images/`

Nur:

`Bild 01.png` bis `Bild NN.png`
