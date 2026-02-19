FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY src/Maka.CRM/Maka.CRM.csproj ./src/Maka.CRM/
RUN dotnet restore ./src/Maka.CRM/Maka.CRM.csproj

COPY src/Maka.CRM/ ./src/Maka.CRM/
RUN dotnet publish ./src/Maka.CRM/Maka.CRM.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8002
ENTRYPOINT ["dotnet", "Maka.CRM.dll"]
