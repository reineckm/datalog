## Datalog

Dieses Projekt ist ein Datenlogger, mit dem es möglichst einfach sein soll neue Datenquellen einzubinden und Werte schnell über die Zeit zu betrechten.
Dies wird durch folgende Designkriterien erreicht:
* Keinerlei Schema - die Daten sind Key Value Paare die mit einem Zeitstempel versehen werden wenn der Server Sie verarbeitet
* Der Client kümmert sich um die Aufbereitung der Daten. Grundlage dafür sind nur die KV Paare und unter umständen Postfixe an den Keys. So wird z.B. wenn der Key auf _degC endet automatisch eine Ansicht für Temperaturdaten gewählt, enthalten die Daten nur 0 und 1en als Werte, wird ein Statediagramm gewählt.
* Eine Möglichst einfache REST Schnittstelle - duuuuh ;-)

Dies führt natürlich auch zu einigen Einschränkungen:
* Die Ansicht der Daten kann unbrauchbar sein, wenn das Frontend keine geeignete Ansicht findet da z.B. erst Koordinaten, dann ein double und dann ein String gespeichert sind.
* Da der Timestamp am Server gesetzt wird, ist der Logger nicht für sehr schnell fluktuierende Werte benutzbar

### Features
* Verschiedene Clients
** Der Webclient ist die Hauptansicht und bietet die komfortabelste Oberfläche
** Weiterhin gibt es den ersten Entwurf eines Python Client der im Vollbildmodus Daten anzeigt - dieser tut aber auch andere Dinge weswegen er, wenn weitergführt in ein anderes Projekt umgesiedelt werden sollte
** Es gibt Funktionen um Daten einem 0.96 Zoll OLED Display zu zeigen
** Um Daten in den Logger zu bekommen gibt es einen Beispiel ESP8266 Arduino Client
* Bislang werden folgende Daten interpretiert:
** Zahlenwerte als Liniendiagramm
** 0/ 1 Werte als An/ Aus Daten.
** Koordinaten werden auf eine Karte geplotted

### Bestandteile
*TODO*

### Installation
*TODO*

### Todo's
* Benutzerverwaltung/ Zugangsschutz. Momentan kann jeder Daten speichern und jeder Daten lesen.
* Viel mehr Datenvisualisierungen.
