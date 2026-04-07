@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

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
echo  oclive 角色包编写器 — 选择打开方式
echo    [1] Tauri 桌面窗口 ^(推荐；需已安装 Rust^)
echo    [2] 仅浏览器 ^(Vite，自动打开浏览器；无需 Rust^)
echo.
set "MODE="
set /p MODE=请输入 1 或 2 ^(直接回车默认为 1^): 
if "!MODE!"=="" set "MODE=1"
if "!MODE!"=="1" goto :tauridev
if "!MODE!"=="2" goto :webdev
echo 无效输入，请只输入 1 或 2。
goto :menu

:tauridev
echo.
echo [oclive-pack-editor] 启动 Tauri ^(npm run tauri:dev^)...
echo Vite 仅在后台服务，不会自动弹出系统浏览器；结束请关闭窗口或在此按 Ctrl+C。
call npm run tauri:dev
exit /b %errorlevel%

:webdev
echo.
echo [oclive-pack-editor] 仅浏览器 ^(npm run dev:browser^)...
echo 控制台保持运行属正常；结束请按 Ctrl+C。
call npm run dev:browser
exit /b %errorlevel%

:usage
echo Usage:
echo   start.bat              - 交互选择：Tauri 或 浏览器
echo   start.bat tauri        - 直接 Tauri 开发窗口
echo   start.bat web          - 直接仅浏览器 ^(含自动打开^)
exit /b 0
