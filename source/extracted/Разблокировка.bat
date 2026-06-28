@echo off
setlocal enabledelayedexpansion

set "folder=%~dp0"

for %%f in ("%folder%*.xlsm") do (
    echo Разблокировка файла: %%f
    echo. > "%%f":Zone.Identifier
)

echo Готово!