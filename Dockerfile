# syntax=docker/dockerfile:1.7
# ── Doctorek backend (Spring Boot) ────────────────────────────────
# Build stage
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

COPY doctorek-backend/mvnw .
COPY doctorek-backend/.mvn .mvn
COPY doctorek-backend/pom.xml .
RUN chmod +x mvnw
COPY doctorek-backend/src src

# Un seul passage Maven résout les dépendances et construit le JAR. Le dépôt
# Maven est conservé par BuildKit entre deux builds sur la VM ; les délais
# empêchent qu'une connexion au dépôt Central bloque le déploiement sans fin.
RUN --mount=type=cache,id=doctorek-maven,target=/root/.m2,sharing=locked \
    ./mvnw -B --no-transfer-progress \
      -Daether.connector.connectTimeout=30000 \
      -Daether.connector.requestTimeout=120000 \
      -Dmaven.wagon.http.retryHandler.count=3 \
      -DskipTests package

# Runtime stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# wget for the container healthcheck; non-root user for production
RUN apt-get update && apt-get install -y --no-install-recommends wget     && rm -rf /var/lib/apt/lists/*     && groupadd -r doctorek && useradd -r -g doctorek doctorek
USER doctorek

COPY --from=build --chown=doctorek:doctorek /app/target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3   CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
