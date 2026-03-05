# 🎯 Bingo App

Eine moderne, interaktive Bingo-Anwendung mit anpassbarer Grid-Größe, Joker-Feldern und umfangreichen Anpassungsoptionen. Perfekt für Spieleabende, Events oder Streaming-Sessions.

![Bingo App Screenshot](https://i.imgur.com/caMTz1E.png)

## ✨ Features

### 🎮 Kernfunktionen
- **Anpassbare Grid-Größe**: 3x3 bis 7x7 Felder
- **Joker-System**: Konfigurierbare Anzahl von Joker-Feldern (immer markiert)
- **Intelligente Bingo-Erkennung**: Zeilen, Spalten und Diagonalen
- **Echtzeit-Statistiken**: Markierte Felder, Gesamtanzahl, aktive Bingos

### 🎨 Anpassung & Design
- **Moderne UI**: Dunkles Theme mit CSS-Variablen
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Schriftgrößen-Steuerung**: 8px bis 32px einstellbar
- **Konfetti-Animation**: Feierliche Bingo-Celebration

### 📝 Feldverwaltung
- **Bulk-Editing**: Mehrere Felder gleichzeitig bearbeiten
- **Preset-System**: Vorgefertigte Feld-Sammlungen speichern und laden
- **XML Import/Export**: Presets als XML-Dateien austauschen
- **Automatisches Würfeln**: Zufällige Feld-Zuordnung aus Pool

### 🔧 Technische Features
- **Lokale Speicherung**: Automatische Speicherung des Spielstands
- **Stream-Ansicht**: Reine Board-Ansicht für OBS/Streaming
- **Keyboard-Shortcuts**: ESC zum Schließen von Modals
- **Cross-Browser-Support**: Funktioniert in allen modernen Browsern

## 📖 Verwendung

### Grundlegende Bedienung

1. **Felder markieren**: Klicken Sie auf ein Feld, um es zu markieren/entmarkieren
2. **Felder bearbeiten**: Doppelklick auf ein Feld zum Bearbeiten des Textes
3. **Neue Runde**: "Felder würfeln" für zufällige Neuverteilung
4. **Zurücksetzen**: "Zurücksetzen" entfernt alle Markierungen

### Erweiterte Funktionen

#### Grid-Größe ändern
- Wählen Sie im Einstellungsbereich eine neue Größe (3x3 bis 7x7)
- Bestätigen Sie die Änderung - alle Felder werden neu initialisiert

#### Joker konfigurieren
- Erhöhen/verringern Sie die Joker-Anzahl mit den +/- Buttons
- Joker werden zufällig platziert und sind immer markiert

#### Bulk-Editing
1. Klicken Sie "Felder bearbeiten"
2. Geben Sie jeden Feldtext in eine neue Zeile ein
3. Verwenden Sie Presets für vorgefertigte Sammlungen
4. Klicken Sie "Übernehmen" zum Speichern

#### Presets verwalten
- **Laden**: Wählen Sie ein Preset aus der Dropdown-Liste
- **Speichern**: Klicken Sie das "+"-Icon nach der Bearbeitung
- **Löschen**: Verwenden Sie das Mülleimer-Icon
- **Import/Export**: XML-Dateien für den Austausch

#### Stream-Ansicht
- Klicken Sie "Board-URL kopieren"
- Die URL enthält `?view=board` für eine reine Board-Ansicht
- Perfekt für OBS oder andere Streaming-Software

## 🔧 API & Funktionen

### Kern-Klasse: `BingoApp`

#### Konstruktor & Initialisierung
```javascript
const bingoApp = new BingoApp();
```
- Initialisiert alle DOM-Elemente
- Bindet Event-Listener
- Lädt gespeicherte Daten aus localStorage
- Generiert initiales Board

#### Board-Management

##### `generateBoard()`
Erstellt das Bingo-Board mit Labels und Zellen
- Verwendet `document.createDocumentFragment()` für Performance
- Fügt Zeilen-/Spalten-Labels hinzu (A, B, C... / 1, 2, 3...)
- Rendert Joker-Felder mit speziellem Icon

##### `assignJokers()`
Weist Joker-Felder zufällig zu
- Verwendet Fisher-Yates-Shuffle für echte Zufälligkeit
- Speichert vorherige Texte und stellt sie wieder her
- Setzt Joker als permanent markiert

##### `toggleCell(index)`
Schaltet Markierung eines Feldes um
- Joker können nicht entmarkiert werden
- Aktualisiert Statistiken und prüft auf Bingo

#### Bingo-Logik

##### `checkBingo()`
Prüft alle möglichen Bingo-Kombinationen
- **Zeilen**: Alle Felder in einer Reihe markiert
- **Spalten**: Alle Felder in einer Spalte markiert
- **Diagonalen**: Beide Hauptdiagonalen

**Rückgabe**: Array von Bingo-Objekten
```javascript
[
  { type: 'row', index: 2, cells: [10, 11, 12, 13, 14] },
  { type: 'diag1', cells: [0, 6, 12, 18, 24] }
]
```

##### `handleBingoCheck()`
Verarbeitet Bingo-Erkennung
- Vergleicht mit vorherigen Bingos
- Zeigt Modal bei neuen Bingos
- Aktualisiert Statistiken

#### Feldverwaltung

##### `openBulkEditModal()`
Öffnet Modal für Massenbearbeitung
- Initialisiert Feld-Pool aus aktuellen Feldern
- Lädt verfügbare Presets
- Zeigt Zeilen- und Anforderungs-Statistiken

##### `saveBulkEdit()`
Speichert Bulk-Änderungen
- Validiert Mindestanzahl von Zeilen
- Aktualisiert Feld-Pool
- Würfelt neue Felder und regeneriert Board

#### Preset-System

##### `saveCurrentAsPreset()`
Speichert aktuelle Feld-Sammlung als Preset
- Fordert Namen über Prompt ein
- Überschreibt bestehende Presets bei Bedarf
- Zeigt Erfolgsmeldung

##### `handlePresetChange()`
Lädt ausgewähltes Preset
- Warnt bei ungespeicherten Änderungen
- Aktualisiert Bulk-Edit-Textarea
- Setzt currentPresetName

##### `exportPresetsToXML()`
Exportiert alle Presets als XML
- Erstellt wohlgeformte XML-Struktur
- Verwendet `escapeXml()` für sichere Ausgabe
- Lädt Datei automatisch herunter

##### `parsePresetsFromXml(xmlString, isInitialLoad)`
Importiert Presets aus XML
- Parst XML mit DOMParser
- Behandelt Fehler graceful
- Merge-Logik für bestehende Presets

#### Aktionen

##### `shuffleCells()`
Würfelt Felder neu
- Verwendet Feld-Pool für zufällige Auswahl
- Beibehaltung von Joker-Positionen
- Setzt Markierungen zurück

##### `resetBoard()`
Setzt alle Markierungen zurück
- Behält Joker-Marker bei
- Leert Bingo-Zähler
- Zeigt Bestätigungsdialog

#### Einstellungen

##### `handleGridSizeChange()`
Ändert Board-Größe
- Validiert Änderung mit Bestätigung
- Lädt Preset nach bei Bedarf
- Passt Joker-Anzahl automatisch an

##### `changeJokerCount(delta)`
Ändert Joker-Anzahl
- Validiert Grenzen (0 bis Gesamt-Felder)
- Regeneriert Board mit neuen Jokern
- Aktualisiert Anzeige

##### `changeFontSize(delta)`
Ändert Schriftgröße
- Grenzen: 8px bis 32px
- CSS-Variable für Live-Update
- Speichert in localStorage

#### Speicherung

##### `saveToStorage()`
Speichert App-Zustand
- Serialisiert wichtige Daten als JSON
- Verwendet localStorage API
- Automatischer Aufruf bei Änderungen

##### `loadFromStorage()`
Lädt gespeicherten Zustand
- Parst JSON sicher mit try/catch
- Stellt Board und Einstellungen wieder her
- Lädt initiale Presets bei Bedarf

#### Hilfsfunktionen

##### `shuffleArray(array)`
Fisher-Yates-Shuffle Implementierung
- Erstellt Kopie des Arrays
- Garantiert echte Zufälligkeit

##### `createConfetti()`
Erzeugt Konfetti-Animation
- 50 farbige Partikel
- Zufällige Positionen und Verzögerungen
- CSS-Animation für realistischen Fall-Effekt

##### `showNotification(message)`
Zeigt temporäre Benachrichtigung
- Entfernt vorherige Notifications
- Auto-Hide nach 3 Sekunden mit Animation

##### `escapeXml(unsafe)`
Sicheres Escaping für XML-Export
- Verwendet Standard-XML-Entities
- Verhindert XML-Injection

## 🎨 Anpassung

### CSS-Variablen
Die App verwendet ein umfangreiches CSS-Variables-System:

```css
:root {
  --color-primary: hsl(262, 83%, 58%);
  --color-bg-primary: hsl(240, 21%, 15%);
  --spacing-md: 1rem;
  --radius-md: 0.75rem;
  /* ... weitere Variablen */
}
```

### Eigene Presets
Erstellen Sie `presets.xml` mit Ihrer Feld-Sammlung:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Presets>
    <Preset name="Tiernamen">
        <Field>Löwe</Field>
        <Field>Tiger</Field>
        <Field>Bär</Field>
        <!-- ... weitere Felder -->
    </Preset>
</Presets>
```

### Keyboard-Shortcuts
- **ESC**: Schließt alle offenen Modals
- **Enter**: Speichert Änderungen in Modals
