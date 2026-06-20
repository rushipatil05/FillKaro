# Auto-FormFiller — Backend

This document describes how to start the backend service locally.

## Prerequisites
- Java 17 or newer installed (`java -version`).
- Maven 3.6+ installed (`mvn -v`).
- (Optional) `JAVA_HOME` set to your JDK installation.

## Run from source (development)
1. Open a terminal and change to the `backend` folder:

```powershell
cd backend
```

2. Run with Maven:

```powershell
mvn spring-boot:run
```

This starts the application using the configuration in `src/main/resources/application.properties` (default port 8080).

## Build and run the packaged JAR
1. Build the project:

```powershell
cd backend
mvn clean package -DskipTests
```

2. Run the generated JAR (use the JAR file in `target/`):

```powershell
java -jar target/*.jar
```

You can override the port at startup, for example:

```powershell
java -jar target/*.jar --server.port=8081
```

## Troubleshooting
- If you see `port already in use`, either stop the process using the port or run the app on a different port (see example above).
- If Maven fails, ensure your network/proxy settings allow dependency downloads.

## Useful files
- Application configuration: [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties#L1)

If you'd like, I can also add a `docker-compose` or Dockerfile to simplify running the backend.
