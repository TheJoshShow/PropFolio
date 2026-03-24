@echo off
REM Local Expo CLI — use when "npx expo" fails (paths with & e.g. "Realty & Holdings", bad npx resolution).
REM Usage: run-expo.cmd config --json
cd /d "%~dp0"
node "%~dp0node_modules\expo\bin\cli" %*
