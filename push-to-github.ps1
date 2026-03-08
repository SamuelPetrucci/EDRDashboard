# Run after creating a new empty repo on GitHub.
# Usage: .\push-to-github.ps1 https://github.com/YOUR_USERNAME/EDR-Dashboard.git
param(
    [Parameter(Mandatory = $true)]
    [string]$RepoUrl
)
$ErrorActionPreference = "Stop"
if (git remote get-url origin 2>$null) {
    git remote remove origin
}
git remote add origin $RepoUrl
git push -u origin main
