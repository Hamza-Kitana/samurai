FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY SamuraiRealm.Api/SamuraiRealm.Api.csproj SamuraiRealm.Api/
RUN dotnet restore SamuraiRealm.Api/SamuraiRealm.Api.csproj
COPY SamuraiRealm.Api/ SamuraiRealm.Api/
WORKDIR /src/SamuraiRealm.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
ENV ConnectionStrings__DefaultConnection="Data Source=/data/samurai.db"
COPY --from=build /app/publish .
RUN mkdir -p /data /app/uploads/packages /app/uploads/images
VOLUME ["/data", "/app/uploads"]
EXPOSE 8080
ENTRYPOINT ["dotnet", "SamuraiRealm.Api.dll"]
