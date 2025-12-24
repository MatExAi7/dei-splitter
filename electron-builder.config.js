/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'com.matexai.dei-bill-splitter',
  productName: 'DEI Bill Splitter',
  copyright: 'Copyright © 2024 MatExAi',
  
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  
  files: [
    'dist/**/*',
    'electron.js',
    'package.json',
  ],
  
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    icon: 'public/favicon.ico',
    artifactName: '${productName}-${version}-Setup.${ext}',
  },
  
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'DEI Bill Splitter',
    installerIcon: 'public/favicon.ico',
    uninstallerIcon: 'public/favicon.ico',
    installerHeaderIcon: 'public/favicon.ico',
    license: 'LICENSE',
  },
  
  publish: {
    provider: 'github',
    releaseType: 'draft',
  },
};
