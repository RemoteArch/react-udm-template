@echo off
echo Building project...

cmd /c build-jsx components
cmd /c build-jsx modules
cmd /c build-jsx "%cd%"


REM Supprimer les dossiers de destination s'ils existent
if exist "dist" rmdir /s /q "dist"

REM Recréer les dossiers de destination
mkdir "dist"
mkdir "dist\components"
mkdir "dist\modules"

REM Copier tous les fichiers .js du dossier components vers dist/components
echo Copying JS files from components...
copy "components\*.js" "dist\components\" /Y

REM Copier tous les fichiers du dossier modules vers dist/modules
echo Copying modules...
copy "modules\*.js" "dist\modules\" /Y

REM Copier web-app.js vers dist
echo Copying web-app.js...
copy "web-app.js" "dist\" /Y

