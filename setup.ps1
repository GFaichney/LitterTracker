$ErrorActionPreference = "Stop"

$venvPath = Join-Path $PSScriptRoot ".venv"
$pythonCmd = "python"

if (-not (Test-Path $venvPath)) {
    Write-Host "Creating virtual environment..."
    & $pythonCmd -m venv $venvPath
}

$venvPython = Join-Path $venvPath "Scripts\python.exe"

Write-Host "Installing requirements..."
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $PSScriptRoot "requirements.txt")

Write-Host "Setup complete."
