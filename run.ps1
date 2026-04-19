$ErrorActionPreference = "Stop"

$venvPython = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "Virtual environment not found. Run .\setup.ps1 first."
    exit 1
}

& $venvPython (Join-Path $PSScriptRoot "app.py")
