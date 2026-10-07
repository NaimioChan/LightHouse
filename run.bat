@echo off
rem LightHouse: serve the whole entry page plus the four training grounds over http.
rem Closing the browser page closes this window too (see serve.py).
rem Works without python too: just double-click index.html (offline file:// mode)
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 goto nopython

python serve.py
goto end

:nopython
echo [lighthouse] python not found - opening index.html directly
start "" "index.html"

:end
