# Figurenblatt der Hauptfigur

`hauptfigur.png` ist die feste Vorlage für die Hauptfigur mit rotem Schal. Sie wird **einmal für den ganzen Kanal** erzeugt, nicht pro Video.

- Fehlt die Datei, erzeugt Google Flow sie beim nächsten Video automatisch nach [FIGURENBLATT_PROMPT.txt](FIGURENBLATT_PROMPT.txt), prüft sie selbst und erzeugt bei Fehlern neu. Der Nutzer muss nichts korrigieren.
- Danach wird `hauptfigur.png` bei jedem Bild als Referenz angehängt. Nach jedem 5er-Block prüft Flow, ob die Figur der Vorlage gleicht.
- Niemals das aktuelle Cover oder ein vorheriges Szenenbild als Referenz nutzen: Sie kopieren Komposition statt Figur.
- Neue Figur gewünscht? `hauptfigur.png` löschen, dann entsteht beim nächsten Video eine neue.
