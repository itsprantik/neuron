
@echo off
title NEURON - Local AI Tutor

cd /d "%~dp0"

echo.
echo ========================================
echo       NEURON - LOCAL AI TUTOR
echo ========================================
echo.

set "MODEL="

for %%f in (models\*.gguf) do set "MODEL=%%f"

if not defined MODEL (
    echo ERROR: No GGUF model found!
    echo Expected location: ai\models\
    pause
    exit /b 1
)

if not exist "llama-server.exe" (
    echo ERROR: llama-server.exe not found!
    echo Expected location: ai\
    pause
    exit /b 1
)

echo Model: %MODEL%
echo Server: http://127.0.0.1:8080
echo.
echo Starting NEURON AI...
echo Keep this window open while using the AI.
echo.

set "CORS_OPTION="
llama-server.exe --help 2>&1 | findstr /c:"--cors-origins" >nul
if not errorlevel 1 set "CORS_OPTION=--cors-origins localhost"

if defined CORS_OPTION (
    echo CORS restricted to localhost.
) else (
    echo WARNING: This llama.cpp build has no localhost CORS restriction flag.
    echo Keep this server local and do not expose it to other devices or public websites.
)
echo.

llama-server.exe -m "%MODEL%" --host 127.0.0.1 --port 8080 %CORS_OPTION% -c 4096 -t 4 --jinja --temp 0.7 --top-p 0.8 --top-k 20 --min-p 0 --presence-penalty 1.5

echo.
echo NEURON AI server stopped.
pause
