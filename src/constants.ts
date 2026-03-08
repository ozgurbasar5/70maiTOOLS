export const ERROR_DB: Record<string, { seviye: string; tani: string; detay: string; cozum: string }> = {
  "thermal": {
    seviye: "KRİTİK",
    tani: "AŞIRI ISINMA KAPANMASI",
    detay: "İşlemci (CPU) termal güvenlik sınırını aşarak donanımı korumak için sistemi acil olarak kapatmış. Isı transferinde veya işlemcide kayıp var.",
    cozum: "Cihazı doğrudan güneş ışığından koruyun. Araç içi sıcaklığı düşürün veya cihazın soğumasını bekleyin."
  },
  "high temp": {
    seviye: "UYARI",
    tani: "YÜKSEK ISI TESPİTİ",
    detay: "Anakart sensörleri normal çalışma limitlerinin üzerinde değerler okuyor. İşlemci frekans düşürüyor (Thermal Throttling) olabilir.",
    cozum: "Cihazın havalandırma deliklerinin açık olduğundan emin olun. Sürekli yüksek ısı donanım ömrünü kısaltır."
  },
  "power_loss": {
    seviye: "KRİTİK",
    tani: "ANİ GÜÇ KAYBI",
    detay: "Sistem enerjisi, normal kapatma prosedürü işletilemeden aniden kesilmiş. Batarya voltajı aniden çökmüş veya güç devresi (PMIC) çıkışı kesmiş.",
    cozum: "Araç şarj kablosunu ve çakmaklık adaptörünü kontrol edin. Temassızlık veya kablo hasarı olabilir."
  },
  "low batt": {
    seviye: "UYARI",
    tani: "KRİTİK BATARYA DÜŞÜŞÜ",
    detay: "İç batarya voltajı, sistemin stabil çalışması için gereken minimum eşiğin altına inmiş. Cihaz gücü dengeleyemiyor.",
    cozum: "Cihazın dahili bataryası ömrünü doldurmuş olabilir. Sürekli güce bağlı kullanın veya bataryayı değiştirin."
  },
  "BAT: fail": {
    seviye: "KRİTİK",
    tani: "BATARYA İLETİŞİM KOPUKLUĞU",
    detay: "Anakart ile batarya yönetim sistemi (BMS) arasındaki iletişim kopmuş. Voltaj okunmuyor veya donanımsal bağlantı yok.",
    cozum: "Donanımsal bir arıza. Batarya soketi çıkmış veya batarya devresi arızalanmış olabilir. Servis gerektirir."
  },
  "vsys under": {
    seviye: "KRİTİK",
    tani: "SİSTEM VOLTAJ ÇÖKMESİ",
    detay: "Dışarıdan gelen besleme voltajı anakartın ihtiyaç duyduğu stabil 5V seviyesini sağlayamıyor. Cihazda voltaj dalgalanması yaşanıyor.",
    cozum: "Kullandığınız adaptör veya kablo yetersiz kalıyor. Orijinal 70mai adaptör ve kablosunu kullanın."
  },
  "Sensor ID mismatch": {
    seviye: "KRİTİK",
    tani: "ÖN SENSÖR UYUŞMAZLIĞI",
    detay: "Ana işlemci (NPU), ön kamera lens modülü ile iletişim kuramıyor veya modülden gelen donanım kimliğini doğrulayamıyor.",
    cozum: "Kamera lens modülü arızalı veya anakart ile bağlantı filmi (flex kablo) hasar görmüş. Servis gerektirir."
  },
  "venc_err": {
    seviye: "KRİTİK",
    tani: "VİDEO ENCODER ÇÖKMESİ",
    detay: "Video kodlama (Encoder) çipi video işleme sırasında kilitlenmiş. Genellikle aşırı ısınma veya CPU lehimlerindeki yorulmadan kaynaklanır.",
    cozum: "Genellikle aşırı ısınma veya SD kartın yavaş kalmasından kaynaklanır. Kaliteli bir SD kart (U3/V30) kullanın."
  },
  "mmc0: error": {
    seviye: "UYARI",
    tani: "SD KART I/O HATASI",
    detay: "SD Kart okuma/yazma hattında veri yolu hatası oluşmuş. Kartın yazma ömrü bitmiş veya yuva pinlerinde sinyal kaybı var.",
    cozum: "SD kartınızın yazma ömrü bitmiş veya bozulmuş. Kartı biçimlendirmeyi deneyin, düzelmezse yeni bir 'High Endurance' SD kart alın."
  },
  "Kernel panic": {
    seviye: "FATAL",
    tani: "SİSTEM ÇEKİRDEK ÇÖKMESİ",
    detay: "İşletim sistemi çekirdeği (Kernel) kritik bir bellek veya donanım okuma hatasıyla karşılaşıp sistemi tamamen durdurmuş.",
    cozum: "Yazılımsal çökme veya donanım arızası. Cihazın Firmware (yazılım) güncellemesini yapmayı deneyin."
  },
  "apple panic": {
    seviye: "FATAL",
    tani: "APPLE PANIC / SİSTEM ÇÖKMESİ",
    detay: "Cihaz donanım veya yazılım kaynaklı kritik bir hata (Panic) yaşadı ve kendini yeniden başlattı.",
    cozum: "Anakart arızası, bozuk depolama birimi veya yazılım hatası olabilir. Firmware güncelleyin, düzelmezse anakart onarımı gerekir."
  },
  "panic": {
    seviye: "FATAL",
    tani: "SİSTEM PANİĞİ (KERNEL PANIC)",
    detay: "İşletim sistemi çekirdeği kritik bir hatayla karşılaşıp sistemi durdurdu.",
    cozum: "Yazılımsal çökme veya donanım arızası. Cihazın Firmware (yazılım) güncellemesini yapmayı deneyin."
  },
  "I2C Timeout": {
    seviye: "FATAL",
    tani: "ANAKART İLETİŞİM ZAMAN AŞIMI",
    detay: "Anakart üzerindeki I2C veri yolunda yer alan bir bileşen zaman aşımına uğruyor. İlgili veri yolunda muhtemel bir kısa devre mevcut.",
    cozum: "Anakart üzerinde kısa devre veya yanan bir bileşen olabilir. Cihazın donanımsal onarıma ihtiyacı var."
  },
  "get gps data timeout": {
    seviye: "UYARI",
    tani: "GPS VERİ KOPUKLUĞU",
    detay: "GPS modülünden (mount) beklenen konum ve hız sinyalleri işlemciye ulaşmıyor. Modül yanıt vermiyor veya pinlerde oksitlenme var.",
    cozum: "GPS modülü (cihazın takıldığı kızak) ile cihaz arasındaki pinleri temizleyin. Temassızlık olabilir."
  },
  "SAL_Subscribe": {
    seviye: "FATAL",
    tani: "FIRMWARE DÖNGÜ HATASI (NAND)",
    detay: "İşletim sistemi olay döngüsünde (Event ID) tıkanma yaşanıyor. NAND Flash üzerindeki yazılım bloklarında veya sektörlerde bozulma mevcut.",
    cozum: "Cihazın hafıza çipinde (NAND) bozuk sektörler var. Firmware'i baştan yüklemek (Unbrick) sorunu çözebilir."
  },
  "watchdog": {
    seviye: "FATAL",
    tani: "SİSTEM KİLİTLENMESİ (WATCHDOG)",
    detay: "Sistem yanıt vermeyi kestiği için donanımsal zamanlayıcı (Watchdog) cihazı zorla yeniden başlattı.",
    cozum: "Yazılım çökmesi veya aşırı ısınma. Firmware güncelleyin."
  },
  "out of memory": {
    seviye: "KRİTİK",
    tani: "BELLEK YETERSİZLİĞİ (OOM)",
    detay: "Cihazın RAM'i tamamen doldu ve işletim sistemi bazı işlemleri zorla kapattı.",
    cozum: "Yazılımsal bellek sızıntısı (Memory Leak). Cihazı fabrika ayarlarına döndürün."
  },
  "oom-killer": {
    seviye: "KRİTİK",
    tani: "BELLEK YETERSİZLİĞİ (OOM-KILLER)",
    detay: "Cihazın RAM'i tamamen doldu ve işletim sistemi bazı işlemleri zorla kapattı.",
    cozum: "Yazılımsal bellek sızıntısı (Memory Leak). Cihazı fabrika ayarlarına döndürün."
  },
  "read-only file system": {
    seviye: "KRİTİK",
    tani: "SD KART KORUMA MODU",
    detay: "SD kart bozulmaya karşı kendini salt-okunur (Read-Only) moda almış. Kayıt yapılamaz.",
    cozum: "SD kartınız bozulmuş. Yeni bir High Endurance SD kart satın alın."
  },
  "fsck": {
    seviye: "UYARI",
    tani: "DOSYA SİSTEMİ ONARIMI",
    detay: "Cihaz düzgün kapatılmadığı için dosya sistemi hataları onarılmaya çalışılıyor.",
    cozum: "Cihazın gücü aniden kesiliyor. Araç tesisatını ve bataryayı kontrol edin."
  },
  "mipi": {
    seviye: "KRİTİK",
    tani: "KAMERA VERİ YOLU HATASI",
    detay: "Kamera sensörü ile işlemci arasındaki yüksek hızlı veri yolunda (MIPI) sinyal kaybı var.",
    cozum: "Kamera lens modülü veya flex kablosu arızalı."
  }
};

export const PASSWORDS = ["70M_dashcam_^", "050120", "12345678", "70mai", "admin", ""];
