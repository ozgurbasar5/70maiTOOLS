import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modüllerde __dirname doğrudan gelmediği için manuel oluşturuyoruz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uygulamanın paketlenmiş mi yoksa dev modunda mı olduğunu anlıyoruz
const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true, // Node.js modüllerine erişim izni
      contextIsolation: false // Geliştirme kolaylığı için izolasyonu kapattık
    }
  });

  // Üstteki menü çubuğunu gizlemek istersen alttaki yorumu kaldırabilirsin:
  // mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    // Geliştirme ortamında Vite'ın çalıştığı porta bağlanıyoruz
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools(); // İstersen DevTools'u otomatik açabilirsin
  } else {
    // .exe alındığında derlenmiş React dosyalarını okutuyoruz
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

// Electron hazır olduğunda pencereyi oluştur
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // macOS için: Dock ikonuna tıklandığında açık pencere yoksa yenisini oluştur
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Tüm pencereler kapatıldığında uygulamadan çık (macOS hariç standart davranış)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});