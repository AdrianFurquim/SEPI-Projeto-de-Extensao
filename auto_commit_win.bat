@echo off
REM Script simples: Requer Git instalado e repo com 'origin' configurado.
cd /d %~dp0


git add -A
git commit -m "Auto commit: Atualizando conteudos do site"
IF %ERRORLEVEL% NEQ 0 (
echo Nao houve alteracoes para commitar ou ocorreu um erro.
) ELSE (
git push
)
pause