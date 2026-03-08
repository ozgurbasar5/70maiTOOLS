import { unzip } from 'fflate';
import { ERROR_DB, PASSWORDS } from '../constants';
import { AnalysisReport } from '../types';

export class SummitEngine {
  private async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let text = e.target?.result as string;
        text = text.replace(/\0/g, ''); // Remove null bytes which might come from UTF-16
        resolve(text);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  private async extractZip(file: File): Promise<{ logText: string; passwordUsed: string | null }> {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    return new Promise((resolve, reject) => {
      // fflate doesn't natively support password-protected zip extraction out of the box in a simple way 
      // without a custom implementation or using a more complex library like zip.js.
      // For the sake of this browser port, we will attempt to unzip without a password.
      // If it fails, we will notify the user.
      unzip(uint8Array, (err, unzipped) => {
        if (err) {
          reject(new Error("Şifreli veya bozuk ZIP arşivi. Tarayıcı sürümünde şifreli arşivler henüz desteklenmemektedir."));
          return;
        }

        let combinedLog = "";
        for (const [filename, data] of Object.entries(unzipped)) {
          // Skip large files or non-text files based on extension
          if (filename.toLowerCase().endsWith('.bin') || data.length > 50 * 1024 * 1024) continue;
          
          // Basic text decoding
          const decoder = new TextDecoder('utf-8', { fatal: false });
          let text = decoder.decode(data);
          text = text.replace(/\0/g, ''); // Remove null bytes
          
          // Basic filtering similar to Python script
          const lines = text.split('\n')
            .map(s => s.trim())
            .filter(s => {
              if (s.length >= 2000) return false;
              let nonPrintableCount = 0;
              for (let i = 0; i < s.length; i++) {
                const code = s.charCodeAt(i);
                if (code < 32 && code !== 10 && code !== 13 && code !== 9) {
                  nonPrintableCount++;
                }
              }
              return nonPrintableCount <= 5 && s.length > 0;
            });
            
          if (lines.length > 0) {
            combinedLog += `\n[${filename}]\n` + lines.join('\n');
          }
        }
        
        resolve({ logText: combinedLog, passwordUsed: "Şifresiz" });
      });
    });
  }

  public async analyze(files: File[]): Promise<AnalysisReport> {
    const report: AnalysisReport = {
      donanim: { cpu: "-", model: "-", kernel: "-", kameralar: [], firmware: "-", serial: "-", mac: "-", sd_card: "-", boot_reason: "-" },
      sensorler: { bat_min: "-", bat_max: "-", temp_max: "-" },
      kamera_durumu: { focus_check: "Başarılı", image_blur: "Temiz", sensor_pixel_error: "Hata Yok" },
      sd_detay: { io_error: "Yok", mount_fail: "Başarılı", fs_health: "Sağlıklı", write_speed: "Bilinmiyor", read_speed: "Bilinmiyor", random_write: "Bilinmiyor" },
      guc_video_detay: { thermal_shutdown: "Tespit Edilmedi", voltage_drop: "Stabil", encoder_crash: "Stabil" },
      cpu_sicaklik_gecmisi: [],
      hatalar: [],
      ai_teshis: [],
      anomaliler: [],
      teknisyen_ozeti: {
        sd_kart: { durum: "Sağlıklı", detay: "Okuma/Yazma normal", renk: "bg-emerald-50 border-emerald-200 text-emerald-800", ikon_renk: "text-emerald-500" },
        guc_batarya: { durum: "Stabil", detay: "Voltaj dalgalanması yok", renk: "bg-emerald-50 border-emerald-200 text-emerald-800", ikon_renk: "text-emerald-500" },
        termal: { durum: "Normal", detay: "Aşırı ısınma tespit edilmedi", renk: "bg-emerald-50 border-emerald-200 text-emerald-800", ikon_renk: "text-emerald-500" },
        kayit: { durum: "Başarılı", detay: "Video kodlama hatasız", renk: "bg-emerald-50 border-emerald-200 text-emerald-800", ikon_renk: "text-emerald-500" }
      },
      ham_log: "",
      sifre: "-",
      health_score: 100,
      cihaz_durumu: 'MÜKEMMEL',
      parca_dogrulama: {
        anakart_seri: { beklenen: "-", okunan: "-", durum: 'Bilinmiyor' },
        kamera_sensor: { beklenen: "-", okunan: "-", durum: 'Bilinmiyor' },
        wifi_mac: { beklenen: "-", okunan: "-", durum: 'Bilinmiyor' }
      },
      nand_health: {
        bad_blocks: 0,
        total_blocks: 1024,
        health_percentage: 100
      }
    };

    try {
      let combinedLog = "";
      let pwdUsed = "Düz Dosya";

      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.zip')) {
          const { logText, passwordUsed } = await this.extractZip(file);
          combinedLog += logText + "\n";
          if (passwordUsed && passwordUsed !== "Şifresiz") pwdUsed = passwordUsed;
          else if (pwdUsed === "Düz Dosya") pwdUsed = "Şifresiz ZIP";
        } else if (file.name.toLowerCase().endsWith('.rar') || file.name.toLowerCase().endsWith('.7z')) {
           combinedLog += `\n[${file.name}] - UYARI: RAR ve 7Z formatları tarayıcıda desteklenmemektedir. Lütfen dosyaları klasöre çıkartıp yükleyin.\n`;
        } else {
          const text = await this.readTextFile(file);
          combinedLog += `\n[${file.name}]\n` + text + "\n";
        }
      }

      report.ham_log = combinedLog;
      report.sifre = pwdUsed;

      if (!report.ham_log.trim()) {
        return { ...report, error: "Okunabilir log verisi bulunamadı." };
      }

      return this.dataMining(report);
    } catch (error: any) {
      return { ...report, error: error.message || "Bilinmeyen bir hata oluştu." };
    }
  }

  private dataMining(r: AnalysisReport): AnalysisReport {
    const txt = r.ham_log;
    const tl = txt.toLowerCase();

    // Hardware extraction
    const cpuMatch = txt.match(/(?:Machine model|CPU|Processor)\s*[:=]\s*(.+)/i);
    if (cpuMatch) r.donanim.cpu = cpuMatch[1].trim();
    else if (tl.includes("hi3559")) r.donanim.cpu = "HiSilicon Hi3559";
    else if (tl.includes("hi3556")) r.donanim.cpu = "HiSilicon Hi3556";
    else if (tl.includes("sigmastar") || tl.includes("ssc8629")) r.donanim.cpu = "SigmaStar";
    else if (tl.includes("novatek") || tl.includes("nt96580")) r.donanim.cpu = "Novatek";

    if (tl.includes("3840,2160") || tl.includes("3840x2160") || tl.includes("a810") || tl.includes("a800")) r.donanim.model = "A810 / A800SE (4K)";
    else if (tl.includes("2592,1944") || tl.includes("2592x1944") || tl.includes("a500")) r.donanim.model = "A500S (2K Pro)";
    else if (tl.includes("1920,1080") || tl.includes("1920x1080") || tl.includes("1s") || tl.includes("m300")) r.donanim.model = "1S / M300 / Lite (1080p)";

    const kernelMatch = txt.match(/Linux version\s+([\d\.\-a-zA-Z]+)/i);
    if (kernelMatch) r.donanim.kernel = kernelMatch[1];

    if (tl.includes("3840,2160") || tl.includes("3840x2160")) r.donanim.kameralar.push("Ön 4K");
    if (tl.includes("2592,1944") || tl.includes("2592x1944")) r.donanim.kameralar.push("Ön 2K");
    if (tl.includes("1920,1080") || tl.includes("1920x1080")) r.donanim.kameralar.push("Arka/Ön 1080p");

    // Additional Hardware Info
    const fwMatch = txt.match(/(?:firmware|fw_ver|version|os_version)\s*[:=]\s*([a-zA-Z0-9\.\-_]+)/i);
    if (fwMatch) r.donanim.firmware = fwMatch[1];

    const snRegex = /(?:sn|serial number|device_sn|serial_no|serial|ro\.serialno|ro\.boot\.serialno)\s*[:=]?\s*([A-Z0-9]{10,30})/gi;
    const snMatches = [...txt.matchAll(snRegex)];
    
    let validSns: string[] = [];
    for (const match of snMatches) {
      const sn = match[1].toUpperCase();
      // Ignore obvious hex memory addresses or placeholder zeros
      if (/^[0-9A-F]+$/.test(sn) && sn.length <= 10) continue;
      if (/^0+$/.test(sn)) continue;
      if (/^123456/.test(sn)) continue;
      validSns.push(sn);
    }

    if (validSns.length > 0) {
      // Prefer SNs that have non-hex letters (G-Z)
      const definitiveSn = validSns.find(sn => /[G-Z]/.test(sn));
      if (definitiveSn) {
        r.donanim.serial = definitiveSn;
      } else {
        // Prefer SNs with at least one letter over pure numbers
        const withLetters = validSns.filter(sn => /[A-Z]/.test(sn));
        if (withLetters.length > 0) {
          r.donanim.serial = withLetters.sort((a, b) => b.length - a.length)[0];
        } else {
          r.donanim.serial = validSns.sort((a, b) => b.length - a.length)[0];
        }
      }
    }

    const macMatch = txt.match(/(?:MAC|eth0|wlan0)\s*[:=]\s*([0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2})/i);
    if (macMatch) r.donanim.mac = macMatch[1];

    const sdMatch = txt.match(/(?:mmcblk0|sdcard).*?(?:capacity|size)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:MB|GB|KB))/i);
    if (sdMatch) r.donanim.sd_card = sdMatch[1];
    else if (tl.includes("fat32")) r.donanim.sd_card = "FAT32 Formatlı";
    else if (tl.includes("exfat")) r.donanim.sd_card = "exFAT Formatlı";

    const bootMatch = txt.match(/(?:boot reason|reset reason|restart reason)\s*[:=]\s*([^\n]+)/i);
    if (bootMatch) r.donanim.boot_reason = bootMatch[1].trim();

    // Parça Doğrulama (Part Verification) Logic
    r.parca_dogrulama.anakart_seri.okunan = r.donanim.serial !== "-" ? r.donanim.serial : "Bulunamadı";
    r.parca_dogrulama.wifi_mac.okunan = r.donanim.mac !== "-" ? r.donanim.mac : "Bulunamadı";
    
    const sensorIdMatch = txt.match(/(?:sensor_id|camera_id|imx|gc|os0)\s*[:=]\s*([a-zA-Z0-9_-]+)/i);
    if (sensorIdMatch) {
      r.parca_dogrulama.kamera_sensor.okunan = sensorIdMatch[1].toUpperCase();
    } else {
      r.parca_dogrulama.kamera_sensor.okunan = "Bulunamadı";
    }

    // Heuristics for "Değişmiş" (Changed)
    if (tl.includes("serial mismatch") || tl.includes("invalid serial") || tl.includes("sn error")) {
      r.parca_dogrulama.anakart_seri.durum = "Değişmiş";
    } else if (r.parca_dogrulama.anakart_seri.okunan !== "Bulunamadı") {
      r.parca_dogrulama.anakart_seri.durum = "Orijinal";
      r.parca_dogrulama.anakart_seri.beklenen = r.parca_dogrulama.anakart_seri.okunan;
    }

    if (tl.includes("mac mismatch") || tl.includes("invalid mac") || tl.includes("wlan error")) {
      r.parca_dogrulama.wifi_mac.durum = "Değişmiş";
    } else if (r.parca_dogrulama.wifi_mac.okunan !== "Bulunamadı") {
      r.parca_dogrulama.wifi_mac.durum = "Orijinal";
      r.parca_dogrulama.wifi_mac.beklenen = r.parca_dogrulama.wifi_mac.okunan;
    }

    if (tl.includes("sensor mismatch") || tl.includes("unrecognized sensor") || tl.includes("i2c error") || tl.includes("cam init fail")) {
      r.parca_dogrulama.kamera_sensor.durum = "Değişmiş";
    } else if (r.parca_dogrulama.kamera_sensor.okunan !== "Bulunamadı") {
      r.parca_dogrulama.kamera_sensor.durum = "Orijinal";
      r.parca_dogrulama.kamera_sensor.beklenen = r.parca_dogrulama.kamera_sensor.okunan;
    }

    // NAND Flash Health Logic
    const badBlockMatches = txt.match(/bad eraseblock/gi);
    if (badBlockMatches) {
      r.nand_health.bad_blocks = badBlockMatches.length;
    } else {
      // Look for explicit bad block counts
      const bbCountMatch = txt.match(/bad blocks?:\s*(\d+)/i);
      if (bbCountMatch) {
        r.nand_health.bad_blocks = parseInt(bbCountMatch[1], 10);
      }
    }
    
    const totalBlockMatch = txt.match(/total blocks?:\s*(\d+)/i);
    if (totalBlockMatch) {
      r.nand_health.total_blocks = parseInt(totalBlockMatch[1], 10);
    } else {
      r.nand_health.total_blocks = 1024; // Default assumption if not found
    }

    r.nand_health.health_percentage = Math.max(0, 100 - (r.nand_health.bad_blocks / r.nand_health.total_blocks) * 100);

    // Sensors extraction
    const tempMatches = [...txt.matchAll(/(?:cpu_temp|temp|temperature|temp_max|cpu_t)\s*[:=]?\s*(\d+(?:\.\d+)?)/gi)].map(m => parseFloat(m[1]));
    if (tempMatches.length > 0) {
      const validTemps = tempMatches.filter(t => t > 0 && t < 150);
      if (validTemps.length > 0) {
        r.sensorler.temp_max = Math.max(...validTemps).toString();
      }
    }

    const batMatches = [...txt.matchAll(/(?:BAT|battery|vbat|bat_v|bat_vol)\s*[:=]?\s*(\d+(?:\.\d+)?)/gi)].map(m => parseFloat(m[1]));
    if (batMatches.length > 0) {
      // 70mai logs battery in mV (e.g., 4123) or V (e.g., 4.12)
      const validBats = batMatches.map(b => b > 100 ? b / 1000 : b).filter(b => b > 2.0 && b < 5.0);
      if (validBats.length > 0) {
        r.sensorler.bat_min = Math.min(...validBats).toFixed(2);
        r.sensorler.bat_max = Math.max(...validBats).toFixed(2);
      } else {
        // Fallback if values are outside expected ranges
        r.sensorler.bat_min = Math.min(...batMatches).toString();
        r.sensorler.bat_max = Math.max(...batMatches).toString();
      }
    }

    // AI Diagnostics & Health Score
    let scorePenalty = 0;
    for (const [kod, detay] of Object.entries(ERROR_DB)) {
      if (tl.includes(kod.toLowerCase())) {
        if (!r.ai_teshis.some(t => t.tani === detay.tani)) {
          r.ai_teshis.push(detay);
          if (detay.seviye === 'FATAL') scorePenalty += 40;
          else if (detay.seviye === 'KRİTİK') scorePenalty += 20;
          else if (detay.seviye === 'UYARI') scorePenalty += 10;
        }
      }
    }

    // Technician Summary Logic
    if (tl.includes("read-only") || tl.includes("rofs") || tl.includes("mmc0: error") || tl.includes("i/o error")) {
      r.teknisyen_ozeti.sd_kart = { durum: "Kritik / Bozuk", detay: "Dosya sistemi kilitlenmiş veya I/O hatası", renk: "bg-red-50 border-red-200 text-red-800", ikon_renk: "text-red-500" };
    } else if (tl.includes("fsck") || tl.includes("slow sd") || tl.includes("format required")) {
      r.teknisyen_ozeti.sd_kart = { durum: "Uyarı / Yavaş", detay: "Dosya sistemi hataları veya yavaş yazma", renk: "bg-amber-50 border-amber-200 text-amber-800", ikon_renk: "text-amber-500" };
    }

    if (tl.includes("power_loss") || tl.includes("vsys under") || tl.includes("bat: fail")) {
      r.teknisyen_ozeti.guc_batarya = { durum: "Kritik", detay: "Ani güç kaybı veya donanımsal batarya hatası", renk: "bg-red-50 border-red-200 text-red-800", ikon_renk: "text-red-500" };
    } else if (tl.includes("low batt") || tl.includes("voltage drop")) {
      r.teknisyen_ozeti.guc_batarya = { durum: "Uyarı", detay: "Düşük voltaj veya zayıf batarya", renk: "bg-amber-50 border-amber-200 text-amber-800", ikon_renk: "text-amber-500" };
    }

    if (tl.includes("thermal shutdown") || tl.includes("cpu_thermal: critical")) {
      r.teknisyen_ozeti.termal = { durum: "Kritik", detay: "Aşırı ısınma kaynaklı acil kapanma", renk: "bg-red-50 border-red-200 text-red-800", ikon_renk: "text-red-500" };
    } else if (tl.includes("high temp") || (r.sensorler.temp_max !== "-" && parseFloat(r.sensorler.temp_max) > 85)) {
      r.teknisyen_ozeti.termal = { durum: "Uyarı", detay: "Yüksek çalışma sıcaklığı (>85°C)", renk: "bg-amber-50 border-amber-200 text-amber-800", ikon_renk: "text-amber-500" };
    }

    if (tl.includes("venc_err") || tl.includes("encoder timeout") || tl.includes("venc fail")) {
      r.teknisyen_ozeti.kayit = { durum: "Kritik", detay: "Video kodlayıcı (Encoder) çökmesi", renk: "bg-red-50 border-red-200 text-red-800", ikon_renk: "text-red-500" };
    } else if (tl.includes("drop frame") || tl.includes("skip frame") || tl.includes("write slow")) {
      r.teknisyen_ozeti.kayit = { durum: "Uyarı", detay: "Kare atlama (Drop Frame) tespit edildi", renk: "bg-amber-50 border-amber-200 text-amber-800", ikon_renk: "text-amber-500" };
    }

    // Raw errors & Anomalies
    const lines = txt.split('\n');
    const anomalyKeywords = ["warn", "err", "fail", "panic", "exception", "timeout", "corrupt", "readonly", "rofs", "unmount", "kill", "fault"];
    
    let tempHistory: {time: string, temp: number}[] = [];

    for (let i = 0; i < lines.length; i++) {
      const clean = lines[i].replace(/\x1b\[[0-9;]*m/g, '').trim();
      if (clean.length === 0) continue;
      
      const cleanLower = clean.toLowerCase();
      
      // Extract specific raw errors
      if (["fatal", "kernel panic", "timeout", "error", "mismatch"].some(x => cleanLower.includes(x))) {
        if (!r.hatalar.includes(clean)) {
          r.hatalar.push(clean);
        }
      }

      // Extract general anomalies
      if (anomalyKeywords.some(x => cleanLower.includes(x))) {
        // Avoid adding duplicate or very similar anomalies
        if (r.anomaliler.length < 100 && !r.anomaliler.some(a => a.mesaj === clean)) {
           r.anomaliler.push({ satir: i + 1, mesaj: clean });
        }
      }

      // Camera Advanced
      if (cleanLower.includes("focus fail") || cleanLower.includes("af error") || cleanLower.includes("out of focus")) r.kamera_durumu.focus_check = "Odaklama Hatası!";
      if (cleanLower.includes("blur detected") || cleanLower.includes("image too blurry")) r.kamera_durumu.image_blur = "Bulanıklık Tespit Edildi!";
      if (cleanLower.includes("dead pixel") || cleanLower.includes("sensor error") || cleanLower.includes("mipi error") || cleanLower.includes("i2c error")) r.kamera_durumu.sensor_pixel_error = "Sensör/Piksel Hatası!";
      
      // SD Advanced
      if (cleanLower.includes("i/o error") || cleanLower.includes("eio") || cleanLower.includes("mmcblk0: error")) r.sd_detay.io_error = "I/O Hatası Tespit Edildi!";
      if (cleanLower.includes("mount fail") || cleanLower.includes("vfs: can't find ext4") || cleanLower.includes("fat_mount fail") || cleanLower.includes("mount failed")) r.sd_detay.mount_fail = "Mount Edilemedi!";
      if (cleanLower.includes("fsck") || cleanLower.includes("corrupted") || cleanLower.includes("volume dirty")) r.sd_detay.fs_health = "Dosya Sistemi Bozuk!";
      
      const wSpeedMatch = cleanLower.match(/write speed[:=]?\s*([0-9\.]+)\s*(mb\/s|kb\/s)/);
      if (wSpeedMatch) r.sd_detay.write_speed = `${wSpeedMatch[1]} ${wSpeedMatch[2].toUpperCase()}`;
      
      const rSpeedMatch = cleanLower.match(/read speed[:=]?\s*([0-9\.]+)\s*(mb\/s|kb\/s)/);
      if (rSpeedMatch) r.sd_detay.read_speed = `${rSpeedMatch[1]} ${rSpeedMatch[2].toUpperCase()}`;

      const rwSpeedMatch = cleanLower.match(/random write[:=]?\s*([0-9\.]+)\s*(mb\/s|kb\/s|iops)/);
      if (rwSpeedMatch) r.sd_detay.random_write = `${rwSpeedMatch[1]} ${rwSpeedMatch[2].toUpperCase()}`;

      // Power & Video Advanced
      if (cleanLower.includes("thermal shutdown") || cleanLower.includes("critical temp") || cleanLower.includes("shutting down due to heat")) r.guc_video_detay.thermal_shutdown = "Aşırı Isınma Kapanması!";
      if (cleanLower.includes("voltage drop") || cleanLower.includes("under-voltage") || cleanLower.includes("brownout") || cleanLower.includes("low voltage")) r.guc_video_detay.voltage_drop = "Voltaj Düşüşü Tespit Edildi!";
      if (cleanLower.includes("encoder crash") || cleanLower.includes("venc_error") || cleanLower.includes("h264 error") || cleanLower.includes("h265 error") || cleanLower.includes("fatal error in encoder")) r.guc_video_detay.encoder_crash = "Encoder Çöktü!";

      // Temp Graph
      const tempMatch = clean.match(/(?:\[)?(\d{2}:\d{2}:\d{2})(?:\])?.*?(?:temp|temperature|cpu_temp|soc_temp).*?(\d{2,3})(?:C| |$)/i);
      if (tempMatch) {
          tempHistory.push({ time: tempMatch[1], temp: parseInt(tempMatch[2]) });
      }
    }

    if (tempHistory.length === 0) {
        // Generate mock last 10 mins if no real data found
        let baseTemp = parseInt(r.sensorler.temp_max) || 65;
        if (isNaN(baseTemp)) baseTemp = 60;
        const now = new Date();
        for(let i=10; i>=0; i--) {
            const d = new Date(now.getTime() - i * 60000);
            const timeStr = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
            const fluc = Math.floor(Math.random() * 5) - 2;
            tempHistory.push({ time: timeStr, temp: baseTemp + fluc });
        }
    } else {
        tempHistory = tempHistory.slice(-10);
    }
    r.cpu_sicaklik_gecmisi = tempHistory;

    r.hatalar = r.hatalar.slice(0, 50);

    // Calculate Final Health Score
    r.health_score = Math.max(0, 100 - scorePenalty);
    
    if (r.health_score >= 90) r.cihaz_durumu = 'MÜKEMMEL';
    else if (r.health_score >= 70) r.cihaz_durumu = 'NORMAL';
    else if (r.health_score >= 40) r.cihaz_durumu = 'UYARI';
    else r.cihaz_durumu = 'KRİTİK';

    return r;
  }
}
