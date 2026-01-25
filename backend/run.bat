@echo off
set "JAVA_HOME=F:\Eclipse Temurin 21 for Windows x64"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME set to: %JAVA_HOME%
echo.
"%JAVA_HOME%\bin\java.exe" -version
echo.
echo Starting Spring Boot application...
echo.
mvn spring-boot:run
