# Silvan & Timo

Website von Silvan & Timo: Web-Apps für den Service in Gastronomiebetrieben in der Schweiz.

Die Seite stellt das Startup vor (Über uns, Haltung, Ablauf, Modell, Kontakt) und zeigt drei kleine, funktionierende Beispiel-Tools. Sie ist bewusst kein Vorlagen-Look: aufgebaut wie eine Küche, mit Bons auf der Schiene und der Rechnung als Kassenzettel.

## Lokal ansehen

Keine Installation, kein Build. Am besten über einen kleinen Server:

```sh
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen.

## Struktur

- `index.html`: Inhalt und Texte
- `assets/styles.css`: Gestaltung (Farben oben unter `:root`)
- `assets/app.js`: die drei Demo-Tools, Uhr im Kopf, Kontaktformular
- `assets/fonts/`: Schriften (Big Shoulders Display, IBM Plex Mono, Hanken Grotesk) mit Lizenzen, alle SIL OFL. Liegen im Repo, damit keine Daten an Google o. ä. gehen.

## Hinweise

- Demo-Eingaben bleiben im Browser (`localStorage`) und werden nirgends hingeschickt.
- Das Kontaktformular öffnet das E-Mail-Programm (`mailto:`), es gibt kein Backend.
- Platzhalter: Kontaktadresse `kontakt@example.ch`, Impressum, Preise.

## Beispieltexte

Texte, die noch zu euch passen müssen (Geschichte, Rollen, Kurzbeschreibungen, «Wo wir stehen»), sind im HTML mit `<mark class="ph">` markiert und auf der Seite gepunktet unterstrichen. Fotos: Platzhalter `.photo` in `index.html` durch ein `<img>` ersetzen.
