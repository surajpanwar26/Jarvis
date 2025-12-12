# PowerShell script to copy the Jarvis project to a new folder
# Save this file as copy-project.ps1 and run it from PowerShell

# Define source and destination paths
$sourcePath = "c:\Users\surpanwar\Desktop\Jarvis Render"
$destinationPath = "c:\Users\surpanwar\Desktop\Jarvis prod ready full"

# Check if source directory exists
if (-Not (Test-Path $sourcePath)) {
    Write-Host "Source directory does not exist: $sourcePath" -ForegroundColor Red
    exit 1
}

# Check if destination directory already exists
if (Test-Path $destinationPath) {
    Write-Host "Destination directory already exists: $destinationPath" -ForegroundColor Yellow
    $confirmation = Read-Host "Do you want to overwrite it? (y/n)"
    if ($confirmation -ne 'y') {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }
    # Remove existing directory
    Remove-Item -Path $destinationPath -Recurse -Force
}

# Copy the entire directory
Write-Host "Copying project from $sourcePath to $destinationPath..." -ForegroundColor Green
Copy-Item -Path $sourcePath -Destination $destinationPath -Recurse

Write-Host "Project copied successfully!" -ForegroundColor Green
Write-Host "New project location: $destinationPath" -ForegroundColor Cyan