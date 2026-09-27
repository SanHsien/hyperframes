[CmdletBinding()]
param(
    [switch]$BuildPrereqs,
    [switch]$Full,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ExtraArgs = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$ffmpegCmd = Get-Command ffmpeg.exe -ErrorAction SilentlyContinue
if ($ffmpegCmd -and -not $env:FFMPEG_BIN) {
    $env:FFMPEG_BIN = $ffmpegCmd.Source
}

Write-Host "==> HyperFrames product verification (Windows)"

if ($BuildPrereqs) {
    Write-Host "==> Build test prerequisites"
    bun run --filter "@hyperframes/{parsers,lint,studio-server}" build
    if ($LASTEXITCODE -ne 0) { throw "build parsers/lint/studio-server failed" }
    bun run --cwd packages/core build
    if ($LASTEXITCODE -ne 0) { throw "build core failed" }
}

if ($Full) {
    Write-Host "==> Run unit tests across workspace"
    bun run test:unit @ExtraArgs
} else {
    Write-Host "==> Quick check: parsers and lint unit tests"
    bun run --filter "@hyperframes/{parsers,lint}" test @ExtraArgs
}

if ($LASTEXITCODE -ne 0) {
    throw "Product tests failed with exit code $LASTEXITCODE"
}

Write-Host "PRODUCT TESTS GREEN"
