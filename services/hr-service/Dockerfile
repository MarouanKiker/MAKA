# =============================================================================
# Dockerfile - HR Service (Spring Boot 3 / Java 17)
# Utilise l'image Maven officielle pour compiler sans mvnw
# =============================================================================

# --- Étape 1 : Build avec Maven ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# --- Étape 2 : Image légère pour l'exécution ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
