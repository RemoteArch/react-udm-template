@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM --- Se placer dans le dossier du .bat ---
cd /d "%~dp0"

set "URL=https://cdn.jsdelivr.net/gh/remotearch/react-udm-template/build-jsx.js"

echo [%DATE% %TIME%] Dossier du bat: %CD%

REM --- Chercher build-jsx.js dans le PATH avec where ---
where build-jsx.js >nul 2>&1
if not errorlevel 1 (
  REM Trouvé dans le PATH, utiliser le chemin complet
  for /f "delims=" %%F in ('where build-jsx.js') do set "SCRIPT=%%F"
  echo [%DATE% %TIME%] build-jsx.js trouve dans PATH: "%SCRIPT%"
) else (
  REM Pas trouvé dans le PATH, utiliser le fichier local
  set "SCRIPT=build-jsx.js"
  echo [%DATE% %TIME%] build-jsx.js non trouve dans PATH, utilisation locale
  
  REM --- Télécharger build-jsx.js si absent localement ---
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
)

REM --- Vérifier Node.js ---
where node >nul 2>&1
if errorlevel 1 (
  echo [%DATE% %TIME%] ERREUR: node n'est pas trouve dans le PATH.
  exit /b 1
)

REM --- Lire l'argument (dossier ou fichier source) ---
if "%~1"=="" (
  echo Usage: %~nx0 ^<dossier_ou_fichier^>
  echo Exemple: %~nx0 components
  exit /b 1
)

REM --- Convertir en chemin absolu ---
set "INPUT=%~1"
for %%I in ("%INPUT%") do set "ABS=%%~fI"

REM --- Vérifier si c'est un fichier ou un dossier ---
if exist "!ABS!\" (
  REM C'est un dossier
  echo [%DATE% %TIME%] Dossier cible: "!ABS!"
  set "IS_FILE=0"
  
  if not exist "!ABS!\*" (
    echo [%DATE% %TIME%] ERREUR: Le dossier "!ABS!" n'existe pas.
    exit /b 1
  )
  
  REM --- Pas de comptage pour dossier non plus ---
) else (
  REM C'est un fichier
  echo [%DATE% %TIME%] Fichier cible: "!ABS!"
  set "IS_FILE=1"
  
  if not exist "!ABS!" (
    echo [%DATE% %TIME%] ERREUR: Le fichier "!ABS!" n'existe pas.
    exit /b 1
  )
  
  REM --- Vérifier que c'est un fichier .jsx ---
  echo !ABS! | find /i ".jsx" >nul
  if errorlevel 1 (
    echo [%DATE% %TIME%] ERREUR: Le fichier doit avoir l'extension .jsx
    exit /b 1
  )
  
  REM --- Pas de comptage pour fichier individuel ---
)

REM --- Executer le script Node avec le dossier en argument ---
echo [%DATE% %TIME%] Execution: node "%SCRIPT%" "!ABS!"
node "%SCRIPT%" "!ABS!"
set "RC=%ERRORLEVEL%"

if not "%RC%"=="0" (
  echo [%DATE% %TIME%] ERREUR: node a retourne le code %RC%
  exit /b %RC%
)

REM --- Si OK, terminer directement ---
if "%RC%"=="0" (
  echo [%DATE% %TIME%] Compilation terminee avec succes.
)

echo [%DATE% %TIME%] Termine.
exit /b 0
