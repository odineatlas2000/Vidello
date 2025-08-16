# Convert YouTube cookies to environment variable format
# PowerShell Script to convert cookies/youtube.txt to YOUTUBE_COOKIES format

Write-Host "Converting YouTube cookies to environment variable format..." -ForegroundColor Cyan

# Cookie file path
$cookieFile = "cookies\youtube.txt"

# Check if file exists
if (-not (Test-Path $cookieFile)) {
    Write-Host "ERROR: Cookie file not found: $cookieFile" -ForegroundColor Red
    Write-Host "Please ensure cookies/youtube.txt exists" -ForegroundColor Yellow
    exit 1
}

# Read file content
try {
    $content = Get-Content $cookieFile -Raw -Encoding UTF8
    Write-Host "SUCCESS: Cookie file read successfully" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to read cookie file: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Convert newlines and tabs
$envValue = $content -replace "`r`n", "\n" -replace "`n", "\n" -replace "`t", "\t"

# Remove trailing whitespace
$envValue = $envValue.TrimEnd()

# Display result
Write-Host "`nYOUTUBE_COOKIES environment variable:" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Gray
Write-Host $envValue -ForegroundColor White
Write-Host "=" * 80 -ForegroundColor Gray

# Save to file
$outputFile = "YOUTUBE_COOKIES.txt"
try {
    $envValue | Out-File -FilePath $outputFile -Encoding UTF8 -NoNewline
    Write-Host "`nSUCCESS: Environment variable saved to: $outputFile" -ForegroundColor Green
} catch {
    Write-Host "`nERROR: Failed to save file: $($_.Exception.Message)" -ForegroundColor Red
}

# Usage instructions
Write-Host "`nUsage Instructions:" -ForegroundColor Cyan
Write-Host "1. Copy the content above" -ForegroundColor Yellow
Write-Host "2. Go to Render.com Dashboard" -ForegroundColor Yellow
Write-Host "3. Select your service > Environment" -ForegroundColor Yellow
Write-Host "4. Add new environment variable:" -ForegroundColor Yellow
Write-Host "   - Name: YOUTUBE_COOKIES" -ForegroundColor White
Write-Host "   - Value: (paste the copied content)" -ForegroundColor White
Write-Host "5. Save and redeploy" -ForegroundColor Yellow

# File information
Write-Host "`nFile Information:" -ForegroundColor Cyan
$fileInfo = Get-Item $cookieFile
Write-Host "Path: $($fileInfo.FullName)" -ForegroundColor White
Write-Host "Size: $($fileInfo.Length) bytes" -ForegroundColor White
Write-Host "Last Modified: $($fileInfo.LastWriteTime)" -ForegroundColor White

# Security warnings
Write-Host "`nSecurity Warnings:" -ForegroundColor Red
Write-Host "• Do not share cookies with anyone" -ForegroundColor Yellow
Write-Host "• Delete YOUTUBE_COOKIES.txt after copying" -ForegroundColor Yellow
Write-Host "• Ensure environment variable is protected in Render.com" -ForegroundColor Yellow

Write-Host "`nConversion completed successfully!" -ForegroundColor Green