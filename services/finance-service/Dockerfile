# =============================================================================
# Finance Service - Spring Boot 3 / Java 17
# Build avec Maven, puis image légère JRE Alpine
# =============================================================================

FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Installer Maven
RUN apk add --no-cache maven

# Copier les fichiers source
COPY . .

# Compiler (sans tests car ils nécessitent une BDD)
RUN mvn package -Dmaven.test.skip=true -B

# --- Image finale légère ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copier le JAR compilé
COPY --from=build /app/target/*.jar app.jar

EXPOSE 6000

ENTRYPOINT ["java", "-jar", "app.jar"]
