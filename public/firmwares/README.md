# Yazılım (Firmware) Dosyalarını Ekleme ve Güncelleme Rehberi

Bu klasör (`public/firmwares/`), cihazlara yüklenecek olan yazılım (firmware) dosyalarını barındırır.

## Yeni Bir Yazılım Eklemek veya Güncellemek İçin Adımlar:

1. **Dosyayı Bu Klasöre Kopyalayın:**
   Yüklemek istediğiniz `.bin` uzantılı yazılım dosyasını doğrudan bu `public/firmwares/` klasörünün içine sürükleyip bırakın veya kopyalayın.
   *Örnek:* `FW_D07_1.0.12.bin`

2. **Veritabanını Güncelleyin:**
   VS Code üzerinden `src/config/firmwares.ts` dosyasını açın. Bu dosya, uygulamadaki "Yazılım Seçin" menüsünü besler.

3. **Yeni Kayıt Ekleyin:**
   `FIRMWARE_DB` dizisine yeni bir obje ekleyin.
   
   ```typescript
   export const FIRMWARE_DB: FirmwareDefinition[] = [
     // ... mevcut kayıtlar ...
     {
       id: "YENI_MODEL_KODU", // Log dosyasında geçen model adı (örn: "D07")
       name: "Yeni Model Adı", // Ekranda görünecek isim (örn: "70mai Dash Cam M300")
       file: "FW_D07_1.0.12.bin", // Bu klasöre attığınız dosyanın tam adı
       targetName: "FW_D07.bin" // SD karta yazılırken alacağı isim (Genelde cihazın beklediği sabit isimdir)
     }
   ];
   ```

4. **Değişiklikleri Kaydedin:**
   Dosyayı kaydettiğinizde uygulama otomatik olarak güncellenecek ve yeni yazılım seçilebilir hale gelecektir.

## Önemli Notlar:
* Tarayıcı üzerinden SD kartı gerçek anlamda (FAT32/exFAT olarak) "Biçimlendirmek (Format)" güvenlik nedeniyle mümkün değildir. Uygulamadaki "Kartı Temizle" butonu, kartın içindeki tüm dosya ve klasörleri silerek kartı boşaltır. Bu, yazılım yüklemesi için yeterlidir.
* `targetName` alanı çok önemlidir. Birçok cihaz, SD kartta belirli bir isimde yazılım dosyası arar (örneğin hep `update.bin` veya `FW_D07.bin` gibi). Cihazınızın hangi ismi beklediğinden emin olun.
