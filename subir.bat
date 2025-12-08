@echo off
title SUBIDOR PRO - GITHUB + VERCEL

REM ===============================
REM   LIMPIAR PANTALLA
REM ===============================
cls

echo =============================================
echo         🚀 SUBIDOR PROFESIONAL PRO 🚀
echo =============================================
echo.

REM ===============================
REM   IR A LA CARPETA DEL PROYECTO
REM ===============================
cd /d C:\Projects\predicaconpoder-v4

echo Verificando cambios...
echo.

REM ===============================
REM   VERIFICAR SI HAY CAMBIOS
REM ===============================
git status --porcelain > temp_changes.txt

for /f %%i in (temp_changes.txt) do (
    set hayCambios=si
)

del temp_changes.txt >nul 2>&1

if "%hayCambios%"=="" (
    echo ❗ No hay cambios para subir. Nada que hacer.
    echo.
    pause
    exit /b
)

echo ✔ Se detectaron cambios en tu proyecto.
echo.

REM ===============================
REM   PEDIR MENSAJE DE COMMIT
REM ===============================
set /p mensaje=📝 Ingresa el mensaje del commit: 

if "%mensaje%"=="" (
    set mensaje=update automatico
)

echo.
echo Commit utilizado: "%mensaje%"
echo.

REM ===============================
REM   CONFIRMACION
REM ===============================
set /p confirmar=¿Deseas subir los cambios a GitHub? (s/n): 

if /I NOT "%confirmar%"=="s" (
    echo ❌ Operación cancelada por el usuario.
    pause
    exit /b
)

echo.
echo =============================================
echo 🚀 SUBIENDO CAMBIOS...
echo =============================================

REM ===============================
REM   EJECUTAR GIT
REM ===============================
git add .
git commit -m "%mensaje%"
git push origin main

if ERRORLEVEL 1 (
    echo.
    echo ❌ ERROR: Hubo un problema al subir a GitHub.
    echo Revisa tu conexión o permisos del repositorio.
    pause
    exit /b
)

echo.
echo =============================================
echo ✔ CAMBIOS SUBIDOS A GITHUB CORRECTAMENTE
echo =============================================
echo.

REM ===============================
REM   ABRIR DEPLOY EN VERCEL
REM ===============================
echo Abriendo Vercel para ver el deploy...
start https://vercel.com/planaileen1-ctrl/predicaconpoder-v4/deployments

echo.
echo =============================================
echo 🎉 DEPLOY INICIADO – TODO CORRECTO
echo =============================================
echo.

pause
exit
