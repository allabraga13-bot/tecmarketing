@echo off
chcp 65001 >nul
echo ========================================================
echo       🚀 TECMARKETING - PUBLICAR NO GITHUB
echo ========================================================
echo.

setlocal enabledelayedexpansion

:: Add Git and GH to session path
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"

echo 1. Verificar Git...
git --version
if errorlevel 1 (
    echo [ERRO] Git não encontrado!
    pause
    exit /b 1
)

echo.
echo Escolha como deseja subir o repositório:
echo [1] Já criei o repositório no site do GitHub e tenho o link
echo [2] Quero autenticar com 'gh auth login' e criar automaticamente
echo.
set /p opcao="Digite a opção (1 ou 2): "

if "%opcao%"=="1" (
    echo.
    set /p repourl="Cole a URL do repositório (ex: https://github.com/seu-usuario/tecmarketing.git): "
    if "!repourl!"=="" (
        echo [ERRO] URL inválida!
        pause
        exit /b 1
    )
    git remote remove origin 2>nul
    git remote add origin !repourl!
    git branch -M main
    echo.
    echo Enviando arquivos para o GitHub...
    git push -u origin main
    if errorlevel 1 (
        echo.
        echo [AVISO] Se pediu senha/token, use um Personal Access Token ou faça login pelo navegador.
    ) else (
        echo.
        echo ========================================================
        echo  ✅ PROJETO PUBLICADO COM SUCESSO NO GITHUB!
        echo ========================================================
    )
) else (
    echo.
    echo Iniciando login com GitHub CLI...
    gh auth login
    echo.
    echo Criando e enviando repositório...
    gh repo create tecmarketing --public --source=. --remote=origin --push
    echo.
    echo ========================================================
    echo  ✅ PROJETO CRIADO E PUBLICADO COM SUCESSO!
    echo ========================================================
)

pause
