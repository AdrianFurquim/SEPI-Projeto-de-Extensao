# Requer: Git instalado, GitHub CLI (gh) instalado, e GH_TOKEN configurado como variável de ambiente.


$token = $env:GH_TOKEN
if(-not $token){
Write-Host "Variável de ambiente GH_TOKEN não encontrada. Defina GH_TOKEN com um Personal Access Token (com permissões de repo)."; exit 1
}


# Login temporário com token (gh lerá o token da entrada padrão)
$token | gh auth login --with-token


# Commit e push
git add -A
git commit -m "Auto commit: atualizando site de carros via script"
if($LASTEXITCODE -eq 0){
git push
} else {
Write-Host "Nada para commitar ou erro ao commitar"
}