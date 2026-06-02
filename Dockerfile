# Build stage
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

COPY doctorek-backend/mvnw .
COPY doctorek-backend/.mvn .mvn
COPY doctorek-backend/pom.xml .
COPY doctorek-backend/src src

RUN chmod +x mvnw && ./mvnw package -DskipTests -q

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
