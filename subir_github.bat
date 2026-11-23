@echo off
chcp 65001 >nul
title Publicar TecMarketing no GitHub
echo ========================================================
echo       🚀 TECMARKETING - PUBLICAR NO GITHUB
echo ========================================================
echo.
echo Repositório configurado: https://github.com/allabraga13-bot/tecmarketing
echo.

set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"

echo 1. Verificando status do Git...
git status
echo.

echo 2. Enviando arquivos para a branch main do GitHub...
echo (Se uma janela do navegador abrir, clique em 'Authorize' para confirmar o envio)
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================================
    echo  ❌ Houve uma falha no envio.
    echo.
    echo  Possíveis causas:
    echo  1. O GitHub precisa da sua autorização no navegador.
    echo  2. Você pode rodar: gh auth login
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  ✅ SUCESSO! SEU PROJETO JÁ ESTÁ NO GITHUB:
    echo  👉 https://github.com/allabraga13-bot/tecmarketing
    echo ========================================================
)

echo.
pause
