FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./mvnw package -DskipTests 2>/dev/null || true

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar 2>/dev/null || true
EXPOSE 8006
ENTRYPOINT ["java", "-jar", "app.jar"]
