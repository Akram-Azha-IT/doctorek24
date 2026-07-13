# ── Doctorek backend (Spring Boot) ────────────────────────────────
# Build stage
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

COPY doctorek-backend/mvnw .
COPY doctorek-backend/.mvn .mvn
COPY doctorek-backend/pom.xml .
# Warm the dependency cache before copying sources (layer caching)
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q
COPY doctorek-backend/src src

RUN ./mvnw package -DskipTests -q

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Never run as root in production
RUN addgroup -S doctorek && adduser -S doctorek -G doctorek
USER doctorek

COPY --from=build --chown=doctorek:doctorek /app/target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3   CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
