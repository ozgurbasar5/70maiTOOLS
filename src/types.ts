export interface HardwareProfile {
  cpu: string;
  model: string;
  kernel: string;
  kameralar: string[];
  firmware: string;
  serial: string;
  mac: string;
  sd_card: string;
  boot_reason: string;
}

export interface SensorData {
  bat_min: string;
  bat_max: string;
  temp_max: string;
}

export interface DiagnosticResult {
  seviye: string;
  tani: string;
  detay: string;
  cozum: string;
}

export interface Anomaly {
  satir: number;
  mesaj: string;
}

export interface TechSummaryItem {
  durum: string;
  detay: string;
  renk: string;
  ikon_renk: string;
}

export interface TechnicianSummary {
  sd_kart: TechSummaryItem;
  guc_batarya: TechSummaryItem;
  termal: TechSummaryItem;
  kayit: TechSummaryItem;
}

export interface CameraStatus {
  focus_check: string;
  image_blur: string;
  sensor_pixel_error: string;
}

export interface StorageStatus {
  io_error: string;
  mount_fail: string;
  fs_health: string;
  write_speed: string;
  read_speed: string;
  random_write: string;
}

export interface PowerVideoStatus {
  thermal_shutdown: string;
  voltage_drop: string;
  encoder_crash: string;
}

export interface TempHistory {
  time: string;
  temp: number;
}

export interface AnalysisReport {
  donanim: HardwareProfile;
  sensorler: SensorData;
  kamera_durumu: CameraStatus;
  sd_detay: StorageStatus;
  guc_video_detay: PowerVideoStatus;
  cpu_sicaklik_gecmisi: TempHistory[];
  hatalar: string[];
  ai_teshis: DiagnosticResult[];
  anomaliler: Anomaly[];
  teknisyen_ozeti: TechnicianSummary;
  ham_log: string;
  sifre: string;
  health_score: number;
  cihaz_durumu: 'MÜKEMMEL' | 'NORMAL' | 'UYARI' | 'KRİTİK';
  error?: string;
  parca_dogrulama: {
    anakart_seri: { beklenen: string; okunan: string; durum: 'Orijinal' | 'Değişmiş' | 'Bilinmiyor' };
    kamera_sensor: { beklenen: string; okunan: string; durum: 'Orijinal' | 'Değişmiş' | 'Bilinmiyor' };
    wifi_mac: { beklenen: string; okunan: string; durum: 'Orijinal' | 'Değişmiş' | 'Bilinmiyor' };
  };
  nand_health: {
    bad_blocks: number;
    total_blocks: number;
    health_percentage: number;
  };
}

export interface HardwareTestRecord {
  id: string;
  serial: string;
  model: string;
  date: string;
  status: 'Başarılı' | 'Başarısız' | 'Test Ediliyor';
  tests: {
    screen: 'Bekliyor' | 'Başarılı' | 'Başarısız';
    audio: 'Bekliyor' | 'Başarılı' | 'Başarısız';
    gps: 'Bekliyor' | 'Başarılı' | 'Başarısız';
    wifi: 'Bekliyor' | 'Başarılı' | 'Başarısız';
    camera: 'Bekliyor' | 'Başarılı' | 'Başarısız';
    battery: 'Bekliyor' | 'Başarılı' | 'Başarısız';
  };
  method: 'Manuel' | 'UART';
}

export interface KnowledgeBaseFaq {
  id: string;
  title: string;
  description: string;
  category: 'Kritik' | 'Donanım' | 'Yazılım' | 'Genel';
}

export interface KnowledgeBaseLink {
  id: string;
  title: string;
  url: string;
  type: 'document' | 'download' | 'video';
}
