# arrange-wiki

Wiki-App, die auf einem Webserver läuft, der mit [arrange-sso-server](https://github.com/hilderonny/arrange-sso-server),  [arrange-file-server](https://github.com/hilderonny/arrange-file-server) und [arrange-web-server](https://github.com/hilderonny/arrange-web-server) zusammenarbeitet. Diese App wird üblicherweise zusammen mit den genannten Servern in einer Docker-Komposition betrieben.

Der SSO-Server dient zur Benutzerauthentifizierung, der File-Server zum Speichern und Laden dynamischer Inhalte und der Webserver liefert einfach die Dateien aus dem hiesigen `html` Verzeichnis statisch aus.

## Installation

Die SSO- und File-Server müssen per Umgebungsvariable beim Starten mitgegeben werden und auf "/" enden.

```sh
# Einzeln
docker run --name arrange-wiki -d -v PATH_TO_THIS_HTML_FOLDER:/app/html -p 3002:3002 -e SSO_SERVER=http://sso-server.com -e FILE_SERVER=http://file-server.com hilderonny2024/arrange-web-server:latest
```

In `PATH_TO_THIS_HTML_FOLDER` wird der Pfad zum hiesigen `html` - Verzeichnis angegeben.

Es können auch SSO, File und Webserver zusammen gestartet werden, wenn es sich um kleine in sich geschlossene Anwendungen handelt.
Dazu kann entweder die [docker-compose.yml](docker/docker-compose.yml) direkt mit Umgebungsvariablen verwendet werden oder sie kann an die jeweiligen Bedürfnisse angepasst werden.

```sh
# Alle Server zusammen starten (ohne Leerzeichen vor &&!)
# Die Server-Adressen müssen von den Client-Browsern aus erreichbar sein, also kein Docker-internes Netzwerk aufbauen!
set TOKEN_SECRET=my_secret_token&& set SSO_SERVER=http://public-sso-server-hostname:3000&& set FILE_SERVER=http://public-file-server-hostname:3001&& docker compose -f docker/docker-compose.yml up -d
```

Für eine genauere Konfiguration und eventuellem Start ohne Umgebungsvariable kann die `docker-compose.yml` Datei einfach zu `docker/local-docker-compose.yml` kopiert und diese bearbeitet werden. Letztere Datei ist bereits in `.gitignore` aufgenommen, sodass das Repository einfach geklont und bearbeitet werden kann, ohne lokale Laufzeiteinstellungen zu verändern. Ein Aufruf sähe dann beispielsweise so aus.

```sh
docker compose -f docker/local-docker-compose.yml up -d
```

Und so sähe beispielhaft die `docker/local-docker-compose.yml` aus, wenn die Anwendung im lokalen Netzwerk auf einem Server mit der IP `192.168.0.2` betrieben würde.

```yml
name: arrange-wiki
services:
  sso_server:
    image: hilderonny2024/arrange-sso-server:0.1.2
    ports:
      - "3000:3000"
    volumes:
      - /var/arrange_sso_server_data:/app/data
    environment:
      - TOKEN_SECRET=my_very_secret_token
    restart: always
  file_server:
    image: hilderonny2024/arrange-file-server:0.1.1
    ports:
      - "3001:3001"
    volumes:
      - /var/arrange_file_server_data:/app/data
    environment:
      - TOKEN_SECRET=my_very_secret_token
    restart: always
  web_server:
    image: hilderonny2024/arrange-web-server:0.1.0
    ports:
      - "3002:3002"
    volumes:
      - ./html:/app
    environment:
      - SSO_SERVER=http://192.168.0.2:3000
      - FILE_SERVER=http://192.168.0.2:3001
    restart: always
```

Die Anwendung wäre dann unter http://192.168.0.2:3002 erreichbar.