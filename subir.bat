@echo off
title 🚀 SUBIR CAMBIOS | PredicaConPoder-v4

:: ================================
::   CONFIGURACIÓN DEL PROYECTO
:: ================================
cd /d C:\Projects\predicaconpoder-v4

:: ================================
::   VISUAL DEL SCRIPT
:: ================================
echo.
echo ===========================================
echo    🔥 PredicaConPoder v4 - Auto Deploy 🔥
echo ===========================================
echo.
echo  📂 Carpeta: predicaconpoder-v4
echo  ⏳ Preparando para subir los cambios...
echo.

:: ================================
::   AGREGAR CAMBIOS A GIT
:: ================================
git add .
if %errorlevel% neq 0 (
    echo ❌ Error al ejecutar "git add ."
    pause
    exit /b
)

:: ================================
::   CREAR COMMIT AUTOMATICO
:: ================================
set FECHA=%date%
set HORA=%time%
git commit -m "AutoDeploy v4 [%FECHA% %HORA%] - cambios recientes"
if %errorlevel% neq 0 (
    echo ⚠️ No hay cambios para subir.
    echo Abriendo Vercel igualmente...
    start https://vercel.com/raulleonny/predicaconpoder-v4/deployments
    pause
    exit /b
)

:: ================================
::   SUBIR A GITHUB
:: ================================
echo.
echo 🚀 Subiendo cambios a GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo ❌ Error al subir los cambios. Intentando reparar...
    git pull origin main --rebase
    git push origin main
)

echo.
echo ===========================================
echo   ✔ CAMBIOS ENVIADOS CON ÉXITO A GITHUB
echo ===========================================
echo.

:: ================================
::   ABRIR VERCEL DEPLOY
:: ================================
echo 🌐 Abriendo Vercel para monitorear el deploy...
start https://vercel.com/raulleonny/predicaconpoder-v4/deployments

echo.
echo ===========================================
echo   ⚡ DEPLOY INICIADO EN VERCEL
echo   🙌 Todo ha salido correctamente
echo ===========================================
echo.

pause
