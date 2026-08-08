$ErrorActionPreference = "Stop"

$AppName = "MountainSafetyDashboard"
$PackageName = "MountainSafety_Basecamp_Dashboard_Windows_v1.0.0"

Write-Host "============================================================"
Write-Host "MountainSafety Dashboard Windows Builder"
Write-Host "============================================================"

if (!(Test-Path "app.py")) {
    Write-Host "ERROR: app.py not found. Run this script inside the build folder."
    exit 1
}

Write-Host "Creating Python virtual environment..."
python -m venv .venv

Write-Host "Activating virtual environment..."
& ".\.venv\Scripts\Activate.ps1"

Write-Host "Installing dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

Write-Host "Cleaning old build files..."
Remove-Item -Recurse -Force build, dist, "$AppName.spec", release -ErrorAction SilentlyContinue

Write-Host "Building Windows EXE with PyInstaller..."
pyinstaller --clean --onefile --name $AppName app.py

if (!(Test-Path "dist\$AppName.exe")) {
    Write-Host "ERROR: EXE build failed."
    exit 1
}

Write-Host "Creating customer package..."
New-Item -ItemType Directory -Force "release\$PackageName" | Out-Null
Copy-Item "dist\$AppName.exe" "release\$PackageName\$AppName.exe" -Force
Copy-Item "README_FIRST.txt" "release\$PackageName\README_FIRST.txt" -Force

Write-Host "Creating ZIP..."
Compress-Archive -Path "release\$PackageName" -DestinationPath "release\$PackageName.zip" -Force

Write-Host "============================================================"
Write-Host "DONE"
Write-Host "Final customer ZIP:"
Write-Host "release\$PackageName.zip"
Write-Host "============================================================"
