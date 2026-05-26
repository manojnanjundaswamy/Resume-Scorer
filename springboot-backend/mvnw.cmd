@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one or more
@REM contributor license agreements.
@echo off

@setlocal

set ERROR_CODE=0
set "MAVEN_PROJECTBASEDIR=%~dp0"
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"

if not "%JAVA_HOME%" == "" goto OkJHome
for %%i in (java.exe) do set "JAVA_HOME=%%~$PATH:i"
if not "%JAVA_HOME%" == "" goto OkJHome
echo.
echo Error: JAVA_HOME not found in your environment. >&2
echo Please set the JAVA_HOME variable in your environment to match the >&2
echo location of your Java installation. >&2
echo.
goto error

:OkJHome
set JAVA_HOME=%JAVA_HOME:"=%
if exist "%JAVA_HOME%\bin\java.exe" goto OkJDir
echo.
echo Error: JAVA_HOME is set to an invalid directory. >&2
goto error

:OkJDir
set _JAVACMD=%JAVA_HOME%\bin\java.exe

set MAVEN_OPTS=%MAVEN_OPTS%

set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

if exist "%WRAPPER_JAR%" goto init

if not "%MVNW_REPOURL%" == "" set MVNW_DOWNLOAD_URL=%MVNW_REPOURL%/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar
if "%MVNW_DOWNLOAD_URL%" == "" set MVNW_DOWNLOAD_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar

PowerShell -Command "&{"^
    "$webclient = new-object System.Net.WebClient;"^
    "if (-not ([string]::IsNullOrEmpty('%MVNW_USERNAME%') -and [string]::IsNullOrEmpty('%MVNW_PASSWORD%'))) {"^
    "$webclient.Credentials = new-object System.Net.NetworkCredential('%MVNW_USERNAME%', '%MVNW_PASSWORD%');"^
    "}"^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;"^
    "$webclient.DownloadFile('%MVNW_DOWNLOAD_URL%', %WRAPPER_JAR%)"^
    "}"
if "%ERRORLEVEL%" NEQ "0" goto error

:init
set CLASSWORLDS_CONF=%MAVEN_PROJECTBASEDIR%\.mvn\jvm.config
if exist "%CLASSWORLDS_CONF%" (
    for /f "usebackq delims=" %%a in ("%CLASSWORLDS_CONF%") do (
        set MAVEN_OPTS=!MAVEN_OPTS! %%a
    )
)

:runMaven
"%_JAVACMD%" ^
    %MAVEN_OPTS% ^
    "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
    -classpath "%WRAPPER_JAR%" ^
    "%WRAPPER_LAUNCHER%" ^
    %MAVEN_CONFIG% %*
if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & exit /B %ERROR_CODE%
