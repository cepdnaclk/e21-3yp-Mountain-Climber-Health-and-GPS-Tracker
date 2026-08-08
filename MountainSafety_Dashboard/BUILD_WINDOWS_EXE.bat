@echo off
echo MountainSafety Dashboard Builder
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0build_windows.ps1"
pause
