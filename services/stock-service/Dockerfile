# ─────────────────────────────────────────────────────────────
# Stage 1 : BUILD (Maven 3.9 + JDK 17 — pas besoin de Maven local)
# ─────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Télécharger les dépendances séparément pour profiter du cache Docker
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests

# ─────────────────────────────────────────────────────────────
# Stage 2 : RUN (JRE léger uniquement)
# ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Montage futur de la clé publique RSA pour valider les JWT
VOLUME /app/keys
COPY --from=build /app/target/stock-service-*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
