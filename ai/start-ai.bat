@echo off
cd /d "%~dp0"
set MODEL=
for %%f in (models\*.gguf) do set MODEL=%%f
if "%MODEL%"=="" (
  echo No .gguf file found in ai\models
  pause
  exit /b 1
)
if not exist llama-server.exe (k
  echo llama-server.exe not found in the ai folder
  pause
  exit /b 1
)
echo Starting the NEURON tutor with %MODEL%
echo Keep this window open. Close it to stop the tutor.
llama-server.exe -m "%MODEL%" --host 127.0.0.1 --port 8080 -c 4096 --jinja --reasoning-budget 0 --temp 0.7 --top-p 0.8 --top-k 20 --min-p 0 --presence-penalty 1.5
pause