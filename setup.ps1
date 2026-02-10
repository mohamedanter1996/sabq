# Sabq Quick Start Script
# Run this script to set up and start the development environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   سبق (Sabq) - Quick Start Setup   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check .NET SDK
Write-Host "Checking .NET SDK..." -ForegroundColor Yellow
$dotnetVersion = dotnet --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ .NET SDK installed: $dotnetVersion" -ForegroundColor Green
} else {
    Write-Host "✗ .NET SDK not found. Please install .NET 9 SDK" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "⚠ Node.js not found. Web client won't work without it." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Step 1: Restore NuGet Packages   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
dotnet restore Sabq.sln

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Step 2: Database Setup   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if EF tools are installed
Write-Host "Checking EF Core tools..." -ForegroundColor Yellow
dotnet tool install --global dotnet-ef 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✓ EF Core tools already installed" -ForegroundColor Green
} else {
    Write-Host "✓ EF Core tools installed" -ForegroundColor Green
}

# Create migration and update database
Write-Host "Creating database and running migrations..." -ForegroundColor Yellow
Set-Location src\Sabq.Api

$migrationExists = dotnet ef migrations list --project ..\Sabq.Infrastructure 2>&1 | Select-String "InitialCreate"
if (-not $migrationExists) {
    Write-Host "Creating initial migration..." -ForegroundColor Yellow
    dotnet ef migrations add InitialCreate --project ..\Sabq.Infrastructure
}

Write-Host "Updating database..." -ForegroundColor Yellow
dotnet ef database update --project ..\Sabq.Infrastructure

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database created and seeded with 30 Arabic questions!" -ForegroundColor Green
} else {
    Write-Host "✗ Database setup failed. Check SQL Server is running." -ForegroundColor Red
    Set-Location ..\..
    exit 1
}

Set-Location ..\..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Step 3: Install Web Dependencies   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($nodeVersion) {
    Set-Location src\Sabq.Web
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Web dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "⚠ Web dependencies installation had issues" -ForegroundColor Yellow
    }
    Set-Location ..\..
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Setup Complete! 🎉   " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ready to start development!" -ForegroundColor Green
Write-Host ""
Write-Host "To run the application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 1 (API):" -ForegroundColor Cyan
Write-Host "    cd src\Sabq.Api" -ForegroundColor White
Write-Host "    dotnet run" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 2 (Web):" -ForegroundColor Cyan
Write-Host "    cd src\Sabq.Web" -ForegroundColor White
Write-Host "    npm start" -ForegroundColor White
Write-Host ""
Write-Host "  Then open: http://localhost:4200" -ForegroundColor Green
Write-Host ""
Write-Host "For MAUI Mobile (Android/Windows):" -ForegroundColor Yellow
Write-Host "  Open Sabq.sln in Visual Studio 2022" -ForegroundColor White
Write-Host "  Set Sabq.Mobile as startup project" -ForegroundColor White
Write-Host "  Select Android Emulator or Windows Machine" -ForegroundColor White
Write-Host "  Press F5 to run" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - README.md for full setup guide" -ForegroundColor White
Write-Host "  - BRANDING.md for design guidelines" -ForegroundColor White
Write-Host "  - DEVELOPMENT.md for developer notes" -ForegroundColor White
Write-Host ""
Write-Host "جاوب الأول… واكسب! 🏆" -ForegroundColor Gold
Write-Host ""
