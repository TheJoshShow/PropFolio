# Initialize a Git repository at the PropFolio project root.
# Optional Windows helper — on macOS/Linux run `git init` from the repo root instead.
# Requires Git on PATH (Git for Windows: https://git-scm.com/download/win).

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
  Write-Error "Git is not on PATH. Install Git for Windows, restart the terminal, then run: git init"
  exit 1
}

if (Test-Path (Join-Path $root ".git")) {
  Write-Host "Git is already initialized at $root"
  git status -sb
  exit 0
}

git init
Write-Host "Initialized empty Git repository in $root"
Write-Host "Next: git add -A && git commit -m `"Initial commit`""
