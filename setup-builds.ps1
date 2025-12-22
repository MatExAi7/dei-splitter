# DEI Splitter - Windows & Android Build Setup Script
# Run this script in the root of your dei-splitter repository

Write-Host "🚀 Setting up DEI Splitter for Windows and Android builds..." -ForegroundColor Green

# 1. Update vite.config.ts
Write-Host "📝 Updating vite.config.ts..." -ForegroundColor Yellow
$viteConfig = @"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./",
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
"@
Set-Content -Path "vite.config.ts" -Value $viteConfig

# 2. Update package.json to add new scripts and Capacitor dependencies
Write-Host "📝 Updating package.json..." -ForegroundColor Yellow
$packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "build:web" -Value "vite build" -Force
$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "dist:win" -Value "cd desktop-electron && npm install && npm run dist:win" -Force
$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "build:android" -Value "npm run build:web && npx cap sync android && cd android && .\gradlew.bat assembleDebug" -Force
$packageJson.dependencies | Add-Member -MemberType NoteProperty -Name "@capacitor/android" -Value "^6.0.0" -Force
$packageJson.dependencies | Add-Member -MemberType NoteProperty -Name "@capacitor/cli" -Value "^6.0.0" -Force
$packageJson.dependencies | Add-Member -MemberType NoteProperty -Name "@capacitor/core" -Value "^6.0.0" -Force
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path "package.json"

# 3. Create desktop-electron folder and files
Write-Host "📁 Creating desktop-electron structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "desktop-electron" | Out-Null

$desktopPackageJson = @"
{
  "name": "dei-splitter-desktop",
  "version": "1.0.0",
  "description": "DEI Splitter Desktop App",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dist:win": "electron-builder --win nsis"
  },
  "build": {
    "appId": "com.matexai.deisplitter",
    "productName": "DEI Splitter by MatExAi",
    "directories": {
      "output": "dist"
    },
    "files": [
      "../dist/**/*",
      "main.js",
      "package.json"
    ],
    "nsis": {
      "oneClick": true,
      "perMachine": false,
      "allowToChangeInstallationDirectory": false,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "win": {
      "target": "nsis"
    }
  },
  "devDependencies": {
    "electron": "^30.0.0",
    "electron-builder": "^24.13.3"
  }
}
"@
Set-Content -Path "desktop-electron\package.json" -Value $desktopPackageJson

$mainJs = @"
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
"@
Set-Content -Path "desktop-electron\main.js" -Value $mainJs

Write-Host "✅ Desktop electron structure created!" -ForegroundColor Green

Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm ci" -ForegroundColor White
Write-Host "2. Run: npx cap add android" -ForegroundColor White
Write-Host "3. Create .github/workflows folder and add workflow files manually" -ForegroundColor White
Write-Host "4. Commit and push to GitHub" -ForegroundColor White