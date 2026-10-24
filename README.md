# Silvan & Timo

Website von Silvan & Timo: Web-Apps für den Service in Gastronomiebetrieben in der Schweiz.

Die Seite ist bewusst kein Vorlagen-Look. Sie ist aufgebaut wie eine Küche: Bons auf der Schiene, Rechnung als Kassenzettel. Die drei Tools im Abschnitt «Ausprobieren» funktionieren wirklich (Bon-Schiene, Reservation, Dienstplan).

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
