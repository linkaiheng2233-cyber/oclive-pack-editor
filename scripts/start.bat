@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0\.."

if not exist "node_modules\" (
  echo [oclive-pack-editor] Installing npm dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed.
    pause
    exit /b 1
  )
  echo.
)

if /i "%~1"=="/?" goto :usage
if /i "%~1"=="--help" goto :usage

if /i "%~1"=="web" goto :webdev
if /i "%~1"=="browser" goto :webdev
if /i "%~1"=="vite" goto :webdev

if "%~1"=="" goto :menu
if /i "%~1"=="tauri" goto :tauridev

echo Unknown option: %~1
goto :usage

:menu
echo.
echo  oclive pack editor — choose how to run
echo    [1] Tauri desktop ^(needs Rust^)
echo    [2] Browser only ^(Vite + open browser; no Rust^)
echo.
set "MODE="
set /p MODE=Enter 1 or 2 ^(default 1^): 
if "!MODE!"=="" set "MODE=1"
if "!MODE!"=="1" goto :tauridev
if "!MODE!"=="2" goto :webdev
echo Invalid input. Type 1 or 2 only.
goto :menu

:tauridev
echo.
echo [oclive-pack-editor] Starting Tauri ^(npm run tauri:dev^)...
echo Vite runs in the background; no extra browser tab. Close the app or press Ctrl+C here to stop.
call npm run tauri:dev
exit /b %errorlevel%

:webdev
echo.
echo [oclive-pack-editor] Browser only ^(npm run dev:browser^)...
echo This window stays open while the dev server runs. Press Ctrl+C to stop.
call npm run dev:browser
exit /b %errorlevel%

:usage
echo Usage:
echo   scripts\start.bat              - interactive menu: Tauri or browser
echo   scripts\start.bat tauri        - Tauri dev window
echo   scripts\start.bat web          - browser + Vite ^(opens tab^)
exit /b 0
