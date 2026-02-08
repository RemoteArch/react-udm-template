@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM --- Se placer dans le dossier du .bat ---
cd /d "%~dp0"

set "SCRIPT=build-jsx.js"
set "URL=https://cdn.jsdelivr.net/gh/remotearch/react-udm-template/build-jsx.js"

echo [%DATE% %TIME%] Dossier du bat: %CD%

REM --- Télécharger build-jsx.js si absent ---
if not exist "%SCRIPT%" (
  echo [%DATE% %TIME%] "%SCRIPT%" introuvable. Telechargement...
  powershell -NoProfile -ExecutionPolicy Bypass ^
    -Command "try { Invoke-WebRequest -Uri '%URL%' -OutFile '%SCRIPT%' -UseBasicParsing; exit 0 } catch { exit 1 }"
  if errorlevel 1 (
    echo [%DATE% %TIME%] ERREUR: Telechargement impossible depuis:
    echo %URL%
    exit /b 1
  )
)

REM --- Vérifier Node.js ---
where node >nul 2>&1
if errorlevel 1 (
  echo [%DATE% %TIME%] ERREUR: Node.js n'est pas trouve dans le PATH.
  exit /b 1
)

REM --- Lire l'argument (dossier source) ---
if "%~1"=="" (
  echo Usage: %~nx0 ^<dossier_components^>
  echo Exemple: %~nx0 "D:\TAF\project\PERSO\React UDM Template\components"
  echo Exemple: %~nx0 components
  exit /b 1
)

REM --- Convertir en chemin absolu ---
set "INPUT=%~1"
for %%I in ("%INPUT%") do set "ABS=%%~fI"

echo [%DATE% %TIME%] Dossier cible: "!ABS!"

if not exist "!ABS!\*" (
  echo [%DATE% %TIME%] ERREUR: Le dossier "!ABS!" n'existe pas.
  exit /b 1
)

REM --- Compter les .js AVANT compilation (recursif) ---
set /a BEFORE=0
for /r "!ABS!" %%F in (*.js) do set /a BEFORE+=1

REM --- Executer le script Node avec le dossier en argument ---
echo [%DATE% %TIME%] Execution: node "%SCRIPT%" "!ABS!"
node "%SCRIPT%" "!ABS!"
set "RC=%ERRORLEVEL%"

if not "%RC%"=="0" (
  echo [%DATE% %TIME%] ERREUR: node a retourne le code %RC%
  exit /b %RC%
)

REM --- Compter les .js APRES compilation ---
set /a AFTER=0
for /r "!ABS!" %%F in (*.js) do set /a AFTER+=1

echo [%DATE% %TIME%] .js avant: %BEFORE%  /  .js apres: %AFTER%

if %AFTER% GTR %BEFORE% (
  echo [%DATE% %TIME%] OK: des fichiers .js ont ete generes.
) else (
  echo [%DATE% %TIME%] INFO: aucun nouveau .js detecte (peut-etre deja a jour).
)

echo [%DATE% %TIME%] Termine.
exit /b 0
