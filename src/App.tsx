import React, { useState, useRef, useEffect } from 'react';
import { Upload, Cpu, Activity, ShieldAlert, FileText, Binary, AlertTriangle, CheckCircle2, XCircle, Thermometer, Battery, Camera, Info, ArrowRight, ChevronRight, FileArchive, HardDrive, Wifi, Hash, Power, Download, Trash2, Usb, CheckCircle, Zap, Terminal, Plug, Unplug, Play, Lock, Plus, X, Printer, Fingerprint, Focus, Monitor, Volume2, MapPin, BookOpen, Search, Video, Link as LinkIcon, HelpCircle, ListChecks } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SummitEngine } from './services/analyzer';
import { AnalysisReport, DiagnosticResult, HardwareTestRecord, KnowledgeBaseFaq, KnowledgeBaseLink } from './types';
import { FIRMWARE_DB } from './config/firmwares';
import { 
  CustomFirmware, saveCustomFirmware, getCustomFirmwares, getCustomFirmwareBlob, deleteCustomFirmware, 
  RegisteredDevice, saveRegisteredDevice, getRegisteredDevices, deleteRegisteredDevice, 
  saveHardwareTest, getHardwareTests, deleteHardwareTest, 
  saveKbFaq, getKbFaqs, deleteKbFaq, saveKbLink, getKbLinks, deleteKbLink, 
  servisKaydiniOlustur, 
} from './services/db';
const engine = new SummitEngine();

export default function App() {
  const [mainTab, setMainTab] = useState<'diagnostic' | 'flasher' | 'hardware' | 'knowledge'>('diagnostic');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'advanced' | 'verification' | 'anomalies' | 'raw'>('ai');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin Panel State
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [adminTab, setAdminTab] = useState<'firmware' | 'verification' | 'hardware' | 'knowledge'>('firmware');
  const [customFws, setCustomFws] = useState<CustomFirmware[]>([]);
  const [registeredDevices, setRegisteredDevices] = useState<RegisteredDevice[]>([]);
  const [hardwareTests, setHardwareTests] = useState<HardwareTestRecord[]>([]);
  const [kbFaqs, setKbFaqs] = useState<KnowledgeBaseFaq[]>([]);
  const [kbLinks, setKbLinks] = useState<KnowledgeBaseLink[]>([]);
  
  // New Firmware Form
  const [newFwName, setNewFwName] = useState('');
  const [newFwTarget, setNewFwTarget] = useState('FW_DR000.bin');
  const [newFwType, setNewFwType] = useState<'official' | 'custom'>('custom');
  const [newFwFile, setNewFwFile] = useState<File | null>(null);
  const [isSavingFw, setIsSavingFw] = useState(false);

  // New Device Form
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceMbSerial, setNewDeviceMbSerial] = useState('');
  const [newDeviceCameraSensor, setNewDeviceCameraSensor] = useState('');
  const [newDeviceWifiMac, setNewDeviceWifiMac] = useState('');
  const [isSavingDevice, setIsSavingDevice] = useState(false);

  // New FAQ Form
  const [newFaqTitle, setNewFaqTitle] = useState('');
  const [newFaqDesc, setNewFaqDesc] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState<'Kritik' | 'Donanım' | 'Yazılım' | 'Genel'>('Genel');

  // New Link Form
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<'document' | 'download' | 'video'>('document');

  // Hardware Test State
  const [activeHwTest, setActiveHwTest] = useState<HardwareTestRecord | null>(null);
  const [hwTestSerial, setHwTestSerial] = useState('');
  const [hwTestModel, setHwTestModel] = useState('');

  // UART State
  interface LiveAlert {
    id: string;
    time: string;
    message: string;
    type: 'critical' | 'warning';
    category: string;
  }
  const [uartConnected, setUartConnected] = useState(false);
  const [uartLogs, setUartLogs] = useState<string>('');
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [focusScore, setFocusScore] = useState<number | null>(null);
  const [isReading, setIsReading] = useState(false);
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Flasher State
  const [sdHandle, setSdHandle] = useState<any>(null);
  const [selectedFwId, setSelectedFwId] = useState<string>('');
  const [flashState, setFlashState] = useState<'idle' | 'clearing' | 'downloading' | 'writing' | 'success' | 'error'>('idle');
  const [flashMessage, setFlashMessage] = useState<string>('');

  // Knowledge Base Search
  const [kbSearchQuery, setKbSearchQuery] = useState('');

  // Auto-select firmware if report has a matching model
  useEffect(() => {
    if (report && report.donanim.model !== "-") {
      const match = FIRMWARE_DB.find(f => report.donanim.model.includes(f.id));
      if (match) {
        setSelectedFwId(match.id);
      }
    }
  }, [report]);

  useEffect(() => {
    loadCustomFirmwares();
    loadRegisteredDevices();
    loadHardwareTests();
    loadKbData();
  }, []);

  const loadCustomFirmwares = async () => {
    try {
      const fws = await getCustomFirmwares();
      setCustomFws(fws);
    } catch (e) {
      console.error("Failed to load custom firmwares", e);
    }
  };

  const loadRegisteredDevices = async () => {
    try {
      const devices = await getRegisteredDevices();
      setRegisteredDevices(devices);
    } catch (e) {
      console.error("Failed to load registered devices", e);
    }
  };

  const loadHardwareTests = async () => {
    try {
      const tests = await getHardwareTests();
      setHardwareTests(tests);
    } catch (e) {
      console.error("Failed to load hardware tests", e);
    }
  };

  const loadKbData = async () => {
    try {
      const faqs = await getKbFaqs();
      const links = await getKbLinks();
      setKbFaqs(faqs);
      setKbLinks(links);
    } catch (e) {
      console.error("Failed to load KB data", e);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPwd === 'summit2026') {
      setAdminAuth(true);
      setAdminPwd('');
    } else {
      alert("Hatalı şifre!");
    }
  };

  const handleSaveCustomFw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFwName || !newFwTarget || !newFwFile) return;
    
    setIsSavingFw(true);
    try {
      const id = 'CUSTOM_' + Date.now();
      const fw: CustomFirmware = {
        id,
        name: newFwName,
        file: newFwFile.name,
        targetName: newFwTarget,
        blob: newFwFile,
        isCustom: newFwType === 'custom'
      };
      await saveCustomFirmware(fw);
      await loadCustomFirmwares();
      
      setNewFwName('');
      setNewFwTarget('FW_DR000.bin');
      setNewFwType('custom');
      setNewFwFile(null);
      alert("Yazılım başarıyla eklendi!");
    } catch (err) {
      alert("Yazılım kaydedilirken hata oluştu.");
    } finally {
      setIsSavingFw(false);
    }
  };

  const handleDeleteCustomFw = async (id: string) => {
    if (!window.confirm("Bu yazılımı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteCustomFirmware(id);
      await loadCustomFirmwares();
    } catch (err) {
      alert("Silme hatası!");
    }
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName || !newDeviceMbSerial) return;
    
    setIsSavingDevice(true);
    try {
      const id = 'DEV_' + Date.now();
      const device: RegisteredDevice = {
        id,
        name: newDeviceName,
        mbSerial: newDeviceMbSerial,
        cameraSensor: newDeviceCameraSensor,
        wifiMac: newDeviceWifiMac
      };
      await saveRegisteredDevice(device);
      await loadRegisteredDevices();
      
      setNewDeviceName('');
      setNewDeviceMbSerial('');
      setNewDeviceCameraSensor('');
      setNewDeviceWifiMac('');
      alert("Cihaz başarıyla kaydedildi!");
    } catch (err) {
      alert("Cihaz kaydedilirken hata oluştu.");
    } finally {
      setIsSavingDevice(false);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!window.confirm("Bu cihazı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteRegisteredDevice(id);
      await loadRegisteredDevices();
    } catch (err) {
      alert("Silme hatası!");
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqTitle || !newFaqDesc) return;
    try {
      const faq: KnowledgeBaseFaq = {
        id: 'FAQ_' + Date.now(),
        title: newFaqTitle,
        description: newFaqDesc,
        category: newFaqCategory
      };
      await saveKbFaq(faq);
      await loadKbData();
      setNewFaqTitle('');
      setNewFaqDesc('');
      setNewFaqCategory('Genel');
      alert("SSS başarıyla eklendi!");
    } catch (err) {
      alert("SSS kaydedilirken hata oluştu.");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm("Bu SSS'yi silmek istediğinize emin misiniz?")) return;
    try {
      await deleteKbFaq(id);
      await loadKbData();
    } catch (err) {
      alert("Silme hatası!");
    }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl) return;
    try {
      const link: KnowledgeBaseLink = {
        id: 'LINK_' + Date.now(),
        title: newLinkTitle,
        url: newLinkUrl,
        type: newLinkType
      };
      await saveKbLink(link);
      await loadKbData();
      setNewLinkTitle('');
      setNewLinkUrl('');
      setNewLinkType('document');
      alert("Bağlantı başarıyla eklendi!");
    } catch (err) {
      alert("Bağlantı kaydedilirken hata oluştu.");
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm("Bu bağlantıyı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteKbLink(id);
      await loadKbData();
    } catch (err) {
      alert("Silme hatası!");
    }
  };

  const handleStartHwTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTestSerial || !hwTestModel) return;
    
    const newTest: HardwareTestRecord = {
      id: 'HW_' + Date.now(),
      serial: hwTestSerial,
      model: hwTestModel,
      date: new Date().toLocaleString('tr-TR'),
      status: 'Test Ediliyor',
      tests: {
        screen: 'Bekliyor',
        audio: 'Bekliyor',
        gps: 'Bekliyor',
        wifi: 'Bekliyor',
        camera: 'Bekliyor',
        battery: 'Bekliyor'
      },
      method: uartConnected ? 'UART' : 'Manuel'
    };
    
    try {
      await saveHardwareTest(newTest);
      await loadHardwareTests();
      setActiveHwTest(newTest);
      setHwTestSerial('');
      setHwTestModel('');
    } catch (err) {
      alert("Test başlatılamadı.");
    }
  };

  const handleUpdateHwTest = async (testKey: keyof HardwareTestRecord['tests'], result: 'Başarılı' | 'Başarısız') => {
    if (!activeHwTest) return;
    
    const updatedTests = { ...activeHwTest.tests, [testKey]: result };
    
    // Check if all tests are done
    const allDone = Object.values(updatedTests).every(val => val !== 'Bekliyor');
    const anyFailed = Object.values(updatedTests).some(val => val === 'Başarısız');
    
    let newStatus: HardwareTestRecord['status'] = 'Test Ediliyor';
    if (allDone) {
      newStatus = anyFailed ? 'Başarısız' : 'Başarılı';
    }

    const updatedRecord: HardwareTestRecord = {
      ...activeHwTest,
      tests: updatedTests,
      status: newStatus
    };

    try {
      await saveHardwareTest(updatedRecord);
      await loadHardwareTests();
      setActiveHwTest(updatedRecord);
      
      if (allDone) {
        alert(`Test tamamlandı! Sonuç: ${newStatus}`);
        setActiveHwTest(null); // Reset after completion
      }
    } catch (err) {
      alert("Test güncellenemedi.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    setMainTab('diagnostic');
    try {
      const result = await engine.analyze(files);
      if (result.error) {
        setError(result.error);
      } else {
        setReport(result);
        setActiveTab('ai');
      }
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // UART Functions
  const connectUart = async () => {
    try {
      if (!('serial' in navigator)) {
        throw new Error("Tarayıcınız Web Serial API desteklemiyor (Chrome/Edge kullanın).");
      }
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      setUartConnected(true);
      setIsReading(true);
      setUartLogs('');
      setLiveAlerts([]);
      setError(null);
      readLoop(port);
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        setError("UART Bağlantı Hatası: " + err.message);
      }
    }
  };

  const readLoop = async (port: any) => {
    const decoder = new TextDecoderStream();
    const inputDone = port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();
    readerRef.current = reader;
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          setUartLogs(prev => prev + value);
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // keep the last incomplete line

          for (const line of lines) {
            const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
            if (!cleanLine) continue;
            
            const lower = cleanLine.toLowerCase();

            // Focus Score Parsing
            const focusMatch = lower.match(/(?:focus(?:_score| val|:)?|af_val:?)\s*(\d+)/);
            if (focusMatch) {
              const score = parseInt(focusMatch[1], 10);
              if (score >= 0 && score <= 100) {
                setFocusScore(score);
              }
            }

            let type: 'critical' | 'warning' | null = null;
            let category = 'Sistem';

            // Critical errors
            if (lower.includes('kernel panic') || lower.includes('thermal shutdown') || lower.includes('voltage drop') || lower.includes('eio') || lower.includes('fatal') || lower.includes('mount fail') || lower.includes('encoder crash')) {
              type = 'critical';
            } 
            // Warnings
            else if (lower.includes('error') || lower.includes('fail') || lower.includes('timeout') || lower.includes('warn') || lower.includes('corrupt')) {
              type = 'warning';
            }

            if (type) {
              if (lower.includes('temp') || lower.includes('thermal') || lower.includes('heat')) category = 'Termal';
              else if (lower.includes('volt') || lower.includes('bat') || lower.includes('power')) category = 'Güç';
              else if (lower.includes('mmc') || lower.includes('sd') || lower.includes('fsck') || lower.includes('fat') || lower.includes('ext4')) category = 'Depolama';
              else if (lower.includes('cam') || lower.includes('mipi') || lower.includes('i2c') || lower.includes('focus') || lower.includes('sensor')) category = 'Kamera';
              else if (lower.includes('venc') || lower.includes('h264') || lower.includes('h265') || lower.includes('encoder')) category = 'Video';

              setLiveAlerts(prev => {
                // Avoid spamming the exact same message
                if (prev.length > 0 && prev[prev.length - 1].message === cleanLine) return prev;
                return [...prev, {
                  id: Math.random().toString(36).substring(7),
                  time: new Date().toLocaleTimeString('tr-TR', { hour12: false }),
                  message: cleanLine.length > 120 ? cleanLine.substring(0, 120) + '...' : cleanLine,
                  type,
                  category
                }].slice(-50); // Keep last 50
              });
            }
          }

          if (terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    } catch (error: any) {
      console.error("UART Read Error:", error);
      setUartLogs(prev => prev + `\n[SİSTEM] UART Bağlantısı koptu veya hata oluştu: ${error.message}\n`);
      setLiveAlerts(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        time: new Date().toLocaleTimeString('tr-TR', { hour12: false }),
        message: `Bağlantı koptu: ${error.message}`,
        type: 'critical',
        category: 'Sistem'
      }].slice(-50));
    } finally {
      reader.releaseLock();
    }
  };

  const disconnectUart = async () => {
    setIsReading(false);
    if (readerRef.current) {
      await readerRef.current.cancel();
      readerRef.current = null;
    }
    if (portRef.current) {
      await portRef.current.close();
      portRef.current = null;
    }
    setUartConnected(false);
  };

  const analyzeUartLogs = async () => {
    if (!uartLogs) return;
    setLoading(true);
    setError(null);
    try {
      const file = new File([uartLogs], "uart_capture.log", { type: "text/plain" });
      const result = await engine.analyze([file]);
      if (result.error) {
        setError(result.error);
      } else {
        setReport(result);
        setActiveTab('ai');
      }
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Flasher Functions
  const handleSelectSDCard = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert("Tarayıcınız SD Kart erişimini desteklemiyor. Lütfen Google Chrome veya Microsoft Edge kullanın.");
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker({
        id: 'sd-card',
        mode: 'readwrite'
      });
      setSdHandle(handle);
      setFlashState('idle');
      setFlashMessage('SD Kart seçildi: ' + handle.name);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setFlashState('error');
        setFlashMessage('SD Kart seçilemedi: ' + e.message);
      }
    }
  };
   

  const handleClearSDCard = async () => {
    if (!sdHandle) return;
    if (!window.confirm("DİKKAT: SD Karttaki TÜM DOSYALAR silinecek. Onaylıyor musunuz?")) return;
    
    setFlashState('clearing');
    setFlashMessage('SD Kart temizleniyor...');
    
    try {
      for await (const entry of sdHandle.values()) {
        if (entry.kind === 'file') {
          await sdHandle.removeEntry(entry.name);
        } else if (entry.kind === 'directory') {
          await sdHandle.removeEntry(entry.name, { recursive: true });
        }
      }
      setFlashState('success');
      setFlashMessage('SD Kart başarıyla temizlendi. (Format Atıldı)');
    } catch (e: any) {
      setFlashState('error');
      setFlashMessage('Temizleme hatası: ' + e.message);
    }
  };


  const handleFlashFirmware = async () => {
    if (!sdHandle || !selectedFwId) return;
    
    // Check if it's a custom firmware
    let fw: any = FIRMWARE_DB.find(f => f.id === selectedFwId);
    let isCustom = false;
    if (!fw) {
      fw = customFws.find(f => f.id === selectedFwId);
      if (fw) isCustom = true;
    }
    
    if (!fw) return;

    setFlashState('downloading');
    setFlashMessage(isCustom ? 'Yazılım veritabanından okunuyor...' : 'Yazılım sunucudan indiriliyor...');

    try {
      let blob: Blob;
      
      if (isCustom) {
        const customBlob = await getCustomFirmwareBlob(fw.id);
        if (!customBlob) throw new Error("Özel yazılım dosyası veritabanında bulunamadı.");
        blob = customBlob;
      } else {
        const res = await fetch(`/firmwares/${fw.file}`);
        if (!res.ok) {
          throw new Error(`Yazılım dosyası bulunamadı (${fw.file}). Lütfen VS Code üzerinden public/firmwares/ klasörüne ekleyin.`);
        }
        blob = await res.blob();
      }

      setFlashState('writing');
      setFlashMessage('Yazılım SD Karta yazılıyor. Lütfen kartı çıkarmayın...');
      
      const fileHandle = await sdHandle.getFileHandle(fw.targetName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      setFlashState('success');
      setFlashMessage(`Yazılım başarıyla yüklendi! (${fw.targetName})`);
    } catch (e: any) {
      setFlashState('error');
      setFlashMessage('Yazma hatası: ' + e.message);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  // --- AURA CLOUD (BULUT) VE SD KART BİRLEŞTİRİCİ MOTOR ---
  const handleStartServiceProcess = async () => {
    // 1. Önce kontrolleri yap
    if (!sdHandle || !selectedFwId) {
      alert("Lütfen önce model ve SD Kart seçimi yapın!");
      return;
    }

    let fw: any = FIRMWARE_DB.find(f => f.id === selectedFwId) || customFws.find(f => f.id === selectedFwId);
    let fwName = fw ? fw.name : "Özel Yazılım";

    try {
      // 2. SUPABASE'E (BULUTA) SERVİS FİŞİNİ KES
      setFlashState('downloading');
      setFlashMessage('Aura Cloud veritabanına kayıt işleniyor...');

      

      // 3. EĞER CHECKBOX SEÇİLİYSE SENİN FORMAT MOTORUNU ÇALIŞTIR
      if (servisFormat) {
        await handleClearSDCard();
        // Eğer kullanıcı Format sırasında "İptal"e basarsa veya hata olursa state değişir.
      }

      // 4. SON OLARAK SENİN KUSURSUZ YAZILIM MOTORUNU ÇALIŞTIR
      await handleFlashFirmware();

    } catch (e: any) {
      setFlashState('error');
      setFlashMessage("İşlem Hatası: " + e.message);
    }
  };

  const getHealthBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const generatePDF = () => {
    // We will use the browser's native print dialog which allows saving as PDF.
    // It's much more reliable and produces text-searchable PDFs.
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          {/* Summit Teknik Servis Logo */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-extrabold tracking-tighter text-[#2a3b8f]">summi</span>
                <span className="text-3xl font-extrabold tracking-tighter text-[#2a3b8f] flex items-center">
                  t
                  <span className="w-2 h-2 rounded-full bg-[#66c2a5] ml-0.5 -mt-3"></span>
                  <span className="w-2 h-2 rounded-full bg-[#f46d43] -ml-2 mt-2"></span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 tracking-widest uppercase -mt-1 ml-1">Teknik Servis</span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
          
          {/* 70mai Logo */}
          <div className="hidden md:flex items-center">
            <span className="text-3xl font-medium tracking-tighter text-[#333333]">70mai</span>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto whitespace-nowrap hide-scrollbar">
            <button 
              onClick={() => setMainTab('diagnostic')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${mainTab === 'diagnostic' ? 'bg-white text-[#2a3b8f] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Teşhis Merkezi
            </button>
            <button 
              onClick={() => setMainTab('flasher')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${mainTab === 'flasher' ? 'bg-white text-[#2a3b8f] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Yazılım Yükleme
            </button>
            <button 
              onClick={() => setMainTab('hardware')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${mainTab === 'hardware' ? 'bg-white text-[#2a3b8f] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Donanım Testi
            </button>
            <button 
              onClick={() => setMainTab('knowledge')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${mainTab === 'knowledge' ? 'bg-white text-[#2a3b8f] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Bilgi Bankası
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            onClick={(e) => { e.currentTarget.value = ''; }}
            className="hidden"
            accept=".txt,.log,.zip,.rar,.7z"
            multiple
          />
          <button
            onClick={triggerUpload}
            disabled={loading}
            className="bg-[#2a3b8f] hover:bg-[#1e2a6b] text-white font-medium py-2.5 px-6 rounded-full flex items-center gap-2 transition-all shadow-sm disabled:opacity-70"
          >
            <Upload size={18} />
            {loading ? "Analiz Ediliyor..." : "Log Dosyası Yükle"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-8">
        {mainTab === 'flasher' && (
          <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Download size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Yazılım Yükleme (Flasher)</h2>
                  <p className="text-slate-500 mt-1">SD Kartı temizleyin ve seçili modelin yazılımını tek tıkla yazdırın.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Step 1: Model Selection */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    Model Seçimi
                  </h3>
                  
                  {report && report.donanim.model !== "-" && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-sm flex items-start gap-2 mb-4">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                      <p>Log dosyasından <strong>{report.donanim.model}</strong> modeli tespit edildi ve otomatik seçildi.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Yazılım Seçin</label>
                    <select 
                      value={selectedFwId} 
                      onChange={(e) => setSelectedFwId(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-[#2a3b8f] focus:border-[#2a3b8f] outline-none transition-all"
                    >
                      <option value="">-- Manuel Model Seçin --</option>
                      <optgroup label="Resmi Yazılımlar">
                        {FIRMWARE_DB.map(fw => (
                          <option key={fw.id} value={fw.id}>{fw.name} ({fw.file})</option>
                        ))}
                        {customFws.filter(fw => !fw.isCustom).map(fw => (
                          <option key={fw.id} value={fw.id}>{fw.name} ({fw.file})</option>
                        ))}
                      </optgroup>
                      {customFws.filter(fw => fw.isCustom).length > 0 && (
                        <optgroup label="Özel Yazılımlar">
                          {customFws.filter(fw => fw.isCustom).map(fw => (
                            <option key={fw.id} value={fw.id}>{fw.name} ({fw.file})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>

                {/* Step 2: SD Card Selection */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    SD Kart İşlemleri
                  </h3>
                  
                  {!sdHandle ? (
                    <button 
                      onClick={handleSelectSDCard}
                      className="w-full border-2 border-dashed border-slate-300 hover:border-[#2a3b8f] hover:bg-blue-50 text-slate-600 font-medium py-6 px-4 rounded-2xl transition-all flex flex-col items-center justify-center gap-3"
                    >
                      <Usb size={32} className="text-slate-400" />
                      <span>Bilgisayara Takılı SD Kartı Seçin</span>
                    </button>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <HardDrive className="text-[#2a3b8f]" size={24} />
                          <div>
                            <p className="font-semibold text-slate-900">{sdHandle.name}</p>
                            <p className="text-xs text-slate-500">Bağlandı ve Hazır</p>
                          </div>
                        </div>
                        <button onClick={() => setSdHandle(null)} className="text-xs text-slate-500 hover:text-red-500 underline">Değiştir</button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button 
                          onClick={handleClearSDCard}
                          disabled={flashState === 'clearing' || flashState === 'writing'}
                          className="bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          Kartı Temizle
                        </button>
                        <button 
                          onClick={handleFlashFirmware}
                          disabled={!selectedFwId || flashState === 'clearing' || flashState === 'writing'}
                          className="bg-[#2a3b8f] text-white hover:bg-[#1e2a6b] py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                          <Download size={16} />
                          Yazılımı Yazdır
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Flash Status Area */}
              {flashState !== 'idle' && (
                <div className={`mt-8 p-4 rounded-xl border flex items-center gap-3 ${
                  flashState === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                  flashState === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  {flashState === 'error' && <AlertTriangle size={20} className="shrink-0" />}
                  {flashState === 'success' && <CheckCircle2 size={20} className="shrink-0" />}
                  {(flashState === 'clearing' || flashState === 'downloading' || flashState === 'writing') && (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                  )}
                  <p className="font-medium text-sm">{flashMessage}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {mainTab === 'diagnostic' && (
          <>
            {error && (
              <div className="mb-8 bg-red-50 border border-red-100 text-red-800 px-5 py-4 rounded-2xl flex items-start gap-3 shadow-sm">
                <AlertTriangle className="shrink-0 mt-0.5 text-red-500" size={20} />
                <div>
                  <h4 className="font-semibold">Analiz Hatası</h4>
                  <p className="text-sm mt-1 text-red-700">{error}</p>
                </div>
              </div>
            )}

            {!report && !loading && !error && (
              <div className={`grid grid-cols-1 ${uartConnected ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-8 max-w-6xl mx-auto py-12`}>
                {/* File Upload Card */}
                {!uartConnected && (
                  <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center transition-all hover:shadow-md">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-[#2a3b8f]">
                      <FileArchive size={36} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">Log Dosyası Yükle</h2>
                    <p className="text-slate-500 mb-8 text-sm">
                      SD karttan aldığınız log dosyalarını (.txt, .log, .zip) yükleyerek detaylı analiz raporu oluşturun.
                    </p>
                    <button
                      onClick={triggerUpload}
                      className="bg-white border-2 border-slate-200 hover:border-[#2a3b8f] hover:bg-blue-50 text-slate-700 font-semibold py-3 px-8 rounded-full transition-all flex items-center gap-2 w-full justify-center"
                    >
                      <Upload size={18} className="text-[#2a3b8f]" />
                      Dosya Seç
                    </button>
                  </div>
                )}

                {/* UART Connection Card */}
                <div className={`bg-white rounded-3xl p-10 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center transition-all hover:shadow-md relative overflow-hidden ${uartConnected ? 'min-h-[600px]' : ''}`}>
                  {uartConnected ? (
                    <div className="w-full h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          UART Canlı Bağlantı (115200)
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={analyzeUartLogs}
                            disabled={!uartLogs}
                            className="bg-[#2a3b8f] hover:bg-[#1e2a6b] text-white text-sm font-semibold py-2 px-6 rounded-full transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            <Play size={16} />
                            Tam Analiz
                          </button>
                          <button onClick={disconnectUart} className="text-slate-400 hover:text-red-500 transition-colors" title="Bağlantıyı Kes">
                            <Unplug size={20} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Terminal */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                          {focusScore !== null && (
                            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                <Focus size={24} />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-end mb-2">
                                  <div>
                                    <h4 className="text-white font-semibold text-sm">Canlı Netlik Puanı (Focus Score)</h4>
                                    <p className="text-slate-400 text-xs">Lensi çevirerek en yüksek değere ulaşın.</p>
                                  </div>
                                  <span className={`text-2xl font-bold ${focusScore >= 95 ? 'text-emerald-400' : focusScore >= 80 ? 'text-blue-400' : 'text-amber-400'}`}>
                                    %{focusScore}
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-300 ${focusScore >= 95 ? 'bg-emerald-500' : focusScore >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                    style={{ width: `${focusScore}%` }}
                                  ></div>
                                </div>
                                {focusScore >= 95 && (
                                  <p className="text-emerald-400 text-xs mt-2 font-medium flex items-center gap-1">
                                    <CheckCircle2 size={14} /> Lens Tam Net, Vidayı Sıkabilirsiniz.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-y-auto text-left custom-scrollbar relative flex flex-col min-h-[400px]">
                            <div className="text-slate-500 text-xs font-mono mb-2 border-b border-slate-800 pb-2 flex justify-between">
                              <span>// RAW TERMINAL OUTPUT</span>
                              <span>{uartLogs.length} bytes</span>
                            </div>
                            <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap break-all flex-1">
                              {uartLogs || "Cihazdan veri bekleniyor..."}
                            </pre>
                            <div ref={terminalEndRef} />
                          </div>
                        </div>

                        {/* Live Alerts */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl flex flex-col overflow-hidden max-h-[500px]">
                          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <Activity size={16} className="text-blue-500" /> Canlı Tespitler
                            </h3>
                            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                              {liveAlerts.length}
                            </span>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {liveAlerts.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                                <CheckCircle2 size={32} className="mb-2 opacity-50 text-emerald-500" />
                                <p className="text-sm">Şu an için hata veya uyarı tespit edilmedi.</p>
                              </div>
                            ) : (
                              liveAlerts.slice().reverse().map(alert => (
                                <div key={alert.id} className={`p-3 rounded-xl border text-left animate-in slide-in-from-left-2 ${
                                  alert.type === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                                }`}>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                      alert.type === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {alert.category}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">{alert.time}</span>
                                  </div>
                                  <p className={`text-xs font-medium leading-relaxed ${
                                    alert.type === 'critical' ? 'text-red-800' : 'text-amber-800'
                                  }`}>
                                    {alert.message}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                        <Terminal size={36} />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mb-3">Canlı UART Bağlantısı</h2>
                      <p className="text-slate-500 mb-8 text-sm">
                        Anakart üzerindeki UART pinlerinden (TX/RX) doğrudan canlı log okuyun ve anında analiz edin.
                      </p>
                      <button
                        onClick={connectUart}
                        className="bg-white border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 font-semibold py-3 px-8 rounded-full transition-all flex items-center gap-2 w-full justify-center"
                      >
                        <Plug size={18} className="text-emerald-600" />
                        UART Portuna Bağlan
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {report && (
              <div id="report-content" className="space-y-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700">
                
                {/* Report Header for PDF (Hidden in normal view) */}
                <div id="print-header" className="hidden flex-col items-center justify-center mb-8 border-b pb-8">
                  <div className="flex items-baseline gap-0.5 mb-2">
                    <span className="text-4xl font-extrabold tracking-tighter text-[#2a3b8f]">summi</span>
                    <span className="text-4xl font-extrabold tracking-tighter text-[#2a3b8f] flex items-center">
                      t
                      <span className="w-3 h-3 rounded-full bg-[#66c2a5] ml-0.5 -mt-4"></span>
                      <span className="w-3 h-3 rounded-full bg-[#f46d43] -ml-2 mt-3"></span>
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800">Teknik Servis Analiz Raporu</h1>
                  <p className="text-slate-500 mt-2">Tarih: {new Date().toLocaleDateString('tr-TR')} | Cihaz: {report.donanim.model} | SN: {report.donanim.serial}</p>
                </div>

                {/* Dashboard Top Section */}
                <div className="flex justify-end mb-4" id="pdf-button-container">
                  <button 
                    onClick={generatePDF}
                    disabled={loading}
                    className="bg-white border border-slate-200 hover:border-[#2a3b8f] hover:bg-blue-50 text-[#2a3b8f] font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-[#2a3b8f] border-t-transparent rounded-full animate-spin"></div> : <Printer size={18} />}
                    {loading ? 'Rapor Hazırlanıyor...' : 'Rapor Oluştur (PDF)'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Panel: Device Status & Health */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2a3b8f] to-[#66c2a5]"></div>
                    
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                      <Cpu size={40} className="text-[#2a3b8f]" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{report.donanim.model !== "-" ? report.donanim.model : "Bilinmeyen Cihaz"}</h2>
                    <div className={`mt-4 px-6 py-2 rounded-full border text-sm font-bold tracking-wide ${getHealthBg(report.health_score)}`}>
                      DURUM: {report.cihaz_durumu}
                    </div>
              </div>

              {/* Right Panel: Detailed Specs Grid */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Info size={16} /> Cihaz Ayrıntıları
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <SpecRow icon={<Cpu />} label="İşlemci (SoC)" value={report.donanim.cpu} />
                  <SpecRow icon={<Binary />} label="Firmware Sürümü" value={report.donanim.firmware} />
                  <SpecRow icon={<Hash />} label="Seri Numarası" value={report.donanim.serial} />
                  <SpecRow icon={<Wifi />} label="MAC Adresi" value={report.donanim.mac} />
                  <SpecRow icon={<Camera />} label="Kamera Kurulumu" value={report.donanim.kameralar.length > 0 ? report.donanim.kameralar.join(" + ") : "-"} />
                  <SpecRow icon={<HardDrive />} label="Depolama (SD)" value={report.donanim.sd_card} />
                  <SpecRow icon={<Battery />} label="Batarya (Min-Max)" value={report.sensorler.bat_min !== "-" ? `${report.sensorler.bat_min}V - ${report.sensorler.bat_max}V` : "-"} />
                  <SpecRow icon={<Thermometer />} label="Tepe Sıcaklık" value={report.sensorler.temp_max !== "-" ? `${report.sensorler.temp_max}°C` : "-"} />
                  <SpecRow icon={<Power />} label="Son Kapanma Nedeni" value={report.donanim.boot_reason} />
                  <SpecRow icon={<Activity />} label="İşletim Sistemi" value={report.donanim.kernel} />
                </div>
              </div>
            </div>

            {/* Technician Quick Glance */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Activity size={16} /> Teknisyen Hızlı Bakış
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <TechSummaryCard 
                  icon={<HardDrive size={24} />} 
                  title="SD Kart Durumu" 
                  item={report.teknisyen_ozeti.sd_kart} 
                />
                <TechSummaryCard 
                  icon={<Battery size={24} />} 
                  title="Güç ve Batarya" 
                  item={report.teknisyen_ozeti.guc_batarya} 
                />
                <TechSummaryCard 
                  icon={<Thermometer size={24} />} 
                  title="Termal Durum" 
                  item={report.teknisyen_ozeti.termal} 
                />
                <TechSummaryCard 
                  icon={<Camera size={24} />} 
                  title="Kayıt Stabilitesi" 
                  item={report.teknisyen_ozeti.kayit} 
                />
              </div>
            </div>

            {/* Main Content Tabs */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div id="tab-navigation" className="flex border-b border-slate-100 px-2 pt-2 overflow-x-auto custom-scrollbar">
                <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<Activity size={18} />} label="Yapay Zeka Teşhisi" badge={report.ai_teshis.length} />
                <TabButton active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} icon={<Zap size={18} />} label="Gelişmiş Analiz" />
                <TabButton active={activeTab === 'verification'} onClick={() => setActiveTab('verification')} icon={<Fingerprint size={18} />} label="Parça Doğrulama" />
                <TabButton active={activeTab === 'anomalies'} onClick={() => setActiveTab('anomalies')} icon={<AlertTriangle size={18} />} label="Tüm Anomaliler" badge={report.anomaliler.length} />
                <TabButton active={activeTab === 'raw'} onClick={() => setActiveTab('raw')} icon={<FileText size={18} />} label="Ham Log Verisi" />
              </div>

              <div id="tabs-content-container" className="p-6 md:p-8 bg-slate-50/50 min-h-[400px]">
                
                {/* AI Diagnostics Tab */}
                <div id="tab-ai" className={activeTab === 'ai' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-900">Kritik Sistem Analizi</h3>
                    </div>

                    {report.ai_teshis.length === 0 ? (
                      <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 size={32} className="text-emerald-500" />
                        </div>
                        <h4 className="text-xl font-semibold text-slate-900 mb-2">Sistem Sağlıklı</h4>
                        <p className="text-slate-500">Log kayıtlarında herhangi bir kritik donanım veya yazılım hatası tespit edilmedi.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {report.ai_teshis.map((item, i) => (
                          <DiagnosticCard key={i} item={item} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Advanced Diagnostics Tab */}
                <div id="tab-advanced" className={activeTab === 'advanced' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Camera Health */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Camera size={16} /> Kamera & Sensör Durumu
                        </h4>
                        <div className="space-y-3">
                          <SpecRow icon={<Activity />} label="Odaklama (Focus)" value={report.kamera_durumu.focus_check} />
                          <SpecRow icon={<Activity />} label="Bulanıklık (Blur)" value={report.kamera_durumu.image_blur} />
                          <SpecRow icon={<Activity />} label="Sensör / Piksel" value={report.kamera_durumu.sensor_pixel_error} />
                        </div>
                      </div>

                      {/* Storage Health */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <HardDrive size={16} /> Depolama (SD) Analizi
                        </h4>
                        <div className="space-y-3">
                          <SpecRow icon={<Activity />} label="I/O Hataları" value={report.sd_detay.io_error} />
                          <SpecRow icon={<Activity />} label="Mount Durumu" value={report.sd_detay.mount_fail} />
                          <SpecRow icon={<Activity />} label="Dosya Sistemi (FS)" value={report.sd_detay.fs_health} />
                          <SpecRow icon={<Activity />} label="Yazma Hızı" value={report.sd_detay.write_speed} />
                          <SpecRow icon={<Activity />} label="Okuma Hızı" value={report.sd_detay.read_speed} />
                          <SpecRow icon={<Activity />} label="Rastgele Yazma" value={report.sd_detay.random_write} />
                        </div>
                      </div>

                      {/* Power & Video Health */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm lg:col-span-2">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Power size={16} /> Güç, Termal & Video Stabilitesi
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <SpecRow icon={<Thermometer />} label="Termal Kapanma" value={report.guc_video_detay.thermal_shutdown} />
                          <SpecRow icon={<Battery />} label="Voltaj Düşüşü" value={report.guc_video_detay.voltage_drop} />
                          <SpecRow icon={<Camera />} label="Encoder Çökmesi" value={report.guc_video_detay.encoder_crash} />
                        </div>
                      </div>
                    </div>

                    {/* CPU Temp Graph */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Thermometer size={16} /> CPU Sıcaklık Grafiği (Son 10 Dakika)
                      </h4>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={report.cpu_sicaklik_gecmisi} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} unit="°C" />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="temp" 
                              name="Sıcaklık"
                              stroke="#f46d43" 
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#f46d43', strokeWidth: 2, stroke: '#fff' }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Tab */}
                <div id="tab-verification" className={activeTab === 'verification' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-900">Parça Doğrulama Raporu</h3>
                      <p className="text-sm text-slate-500">Cihaz bileşenlerinin orijinallik ve sağlık durumu</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Fingerprint size={16} /> Donanım Kimlik Doğrulaması
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                              <th className="pb-3 font-semibold">Bileşen</th>
                              <th className="pb-3 font-semibold">Okunan Değer</th>
                              <th className="pb-3 font-semibold">Durum</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            <tr className="border-b border-slate-100">
                              <td className="py-4 font-medium text-slate-700 flex items-center gap-2"><Cpu size={16} className="text-slate-400"/> Anakart Seri No</td>
                              <td className="py-4 font-mono text-slate-600">{report.parca_dogrulama.anakart_seri.okunan}</td>
                              <td className="py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${report.parca_dogrulama.anakart_seri.durum === 'Orijinal' ? 'bg-emerald-100 text-emerald-700' : report.parca_dogrulama.anakart_seri.durum === 'Değişmiş' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {report.parca_dogrulama.anakart_seri.durum}
                                </span>
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="py-4 font-medium text-slate-700 flex items-center gap-2"><Camera size={16} className="text-slate-400"/> Kamera Sensör ID</td>
                              <td className="py-4 font-mono text-slate-600">{report.parca_dogrulama.kamera_sensor.okunan}</td>
                              <td className="py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${report.parca_dogrulama.kamera_sensor.durum === 'Orijinal' ? 'bg-emerald-100 text-emerald-700' : report.parca_dogrulama.kamera_sensor.durum === 'Değişmiş' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {report.parca_dogrulama.kamera_sensor.durum}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="py-4 font-medium text-slate-700 flex items-center gap-2"><Wifi size={16} className="text-slate-400"/> Wi-Fi MAC Adresi</td>
                              <td className="py-4 font-mono text-slate-600">{report.parca_dogrulama.wifi_mac.okunan}</td>
                              <td className="py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${report.parca_dogrulama.wifi_mac.durum === 'Orijinal' ? 'bg-emerald-100 text-emerald-700' : report.parca_dogrulama.wifi_mac.durum === 'Değişmiş' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {report.parca_dogrulama.wifi_mac.durum}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <HardDrive size={16} /> NAND Flash Bellek Sağlığı
                      </h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Ölü Sektör (Bad Block) Oranı</span>
                        <span className={`text-lg font-bold ${report.nand_health.health_percentage >= 95 ? 'text-emerald-500' : report.nand_health.health_percentage >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                          %{report.nand_health.health_percentage.toFixed(1)} Sağlıklı
                        </span>
                      </div>
                      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                        <div 
                          className={`h-full transition-all duration-500 ${report.nand_health.health_percentage >= 95 ? 'bg-emerald-500' : report.nand_health.health_percentage >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${report.nand_health.health_percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Toplam Blok: {report.nand_health.total_blocks} | Arızalı Blok: {report.nand_health.bad_blocks}
                        {report.nand_health.bad_blocks > 0 && " (Yazılım atılmasına rağmen düzelmeyen sorunlar fiziksel hafıza çipi arızasından kaynaklanıyor olabilir.)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Anomalies Tab */}
                <div id="tab-anomalies" className={activeTab === 'anomalies' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-900">Tespit Edilen Tüm Anomaliler</h3>
                      <p className="text-sm text-slate-500">Log dosyalarındaki uyarı, hata ve istisnai durumlar</p>
                    </div>

                    {report.anomaliler.length === 0 ? (
                      <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 size={32} className="text-blue-500" />
                        </div>
                        <h4 className="text-xl font-semibold text-slate-900 mb-2">Anomali Bulunmadı</h4>
                        <p className="text-slate-500">Sistem loglarında şüpheli bir satıra rastlanmadı.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                              <tr>
                                <th className="px-6 py-3 font-semibold w-24">Satır</th>
                                <th className="px-6 py-3 font-semibold">Log Mesajı</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {report.anomaliler.map((anomaly, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-3 font-mono text-xs text-slate-400">#{anomaly.satir}</td>
                                  <td className="px-6 py-3 font-mono text-xs text-slate-700 break-all">{anomaly.mesaj}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Raw Log Tab */}
                <div id="tab-raw" className={activeTab === 'raw' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                  <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Ham Log Çıktısı</h3>
                      <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">Şifreleme: {report.sifre}</span>
                    </div>
                    <div className="overflow-auto max-h-[600px] custom-scrollbar">
                      <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
                        {report.ham_log}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
        )}

        {mainTab === 'hardware' && (
          <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700 max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <Cpu size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Donanım Testi Merkezi</h2>
                  <p className="text-slate-500 mt-1">Cihaz bileşenlerini manuel olarak test edin ve doğrulayın.</p>
                </div>
              </div>

              {!activeHwTest ? (
                <div className="max-w-md mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Yeni Test Başlat</h3>
                  <form onSubmit={handleStartHwTest} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cihaz Seri No</label>
                      <input 
                        type="text" 
                        required
                        value={hwTestSerial}
                        onChange={e => setHwTestSerial(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2a3b8f] outline-none"
                        placeholder="Örn: 70MAI12345678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cihaz Modeli</label>
                      <input 
                        type="text" 
                        required
                        value={hwTestModel}
                        onChange={e => setHwTestModel(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2a3b8f] outline-none"
                        placeholder="Örn: A810"
                      />
                    </div>
                    <div className="pt-2">
                      <button 
                        type="submit"
                        className="w-full bg-[#2a3b8f] hover:bg-[#1e2a6b] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Play size={18} />
                        {uartConnected ? 'UART ile Testi Başlat' : 'Manuel Testi Başlat'}
                      </button>
                      {!uartConnected && (
                        <p className="text-xs text-center text-amber-600 mt-3 flex items-center justify-center gap-1">
                          <AlertTriangle size={14} /> UART bağlantısı yok. Testler manuel kaydedilecek.
                        </p>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-sm text-slate-500">Aktif Test</p>
                      <p className="font-bold text-slate-800">{activeHwTest.model} - {activeHwTest.serial}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Yöntem</p>
                      <p className="font-bold text-[#2a3b8f]">{activeHwTest.method}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Screen Test */}
                    <div className={`border rounded-2xl p-6 transition-all ${activeHwTest.tests.screen === 'Başarılı' ? 'border-emerald-500 bg-emerald-50' : activeHwTest.tests.screen === 'Başarısız' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:shadow-md'}`}>
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                        <Monitor size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Ekran Testi</h3>
                      <p className="text-sm text-slate-500 mb-4">Ekranda ölü piksel, renk kayması veya dokunmatik sorunlarını kontrol edin.</p>
                      {activeHwTest.tests.screen === 'Bekliyor' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateHwTest('screen', 'Başarılı')} className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><CheckCircle2 size={16}/> Başarılı</button>
                          <button onClick={() => handleUpdateHwTest('screen', 'Başarısız')} className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><XCircle size={16}/> Başarısız</button>
                        </div>
                      ) : (
                        <div className={`font-bold text-center py-2 rounded-lg ${activeHwTest.tests.screen === 'Başarılı' ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                          {activeHwTest.tests.screen}
                        </div>
                      )}
                    </div>

                    {/* Audio Test */}
                    <div className={`border rounded-2xl p-6 transition-all ${activeHwTest.tests.audio === 'Başarılı' ? 'border-emerald-500 bg-emerald-50' : activeHwTest.tests.audio === 'Başarısız' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:shadow-md'}`}>
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                        <Volume2 size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Ses & Mikrofon</h3>
                      <p className="text-sm text-slate-500 mb-4">Hoparlör çıkışını ve mikrofon kayıt kalitesini test edin.</p>
                      {activeHwTest.tests.audio === 'Bekliyor' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateHwTest('audio', 'Başarılı')} className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><CheckCircle2 size={16}/> Başarılı</button>
                          <button onClick={() => handleUpdateHwTest('audio', 'Başarısız')} className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><XCircle size={16}/> Başarısız</button>
                        </div>
                      ) : (
                        <div className={`font-bold text-center py-2 rounded-lg ${activeHwTest.tests.audio === 'Başarılı' ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                          {activeHwTest.tests.audio}
                        </div>
                      )}
                    </div>

                    {/* GPS Test */}
                    <div className={`border rounded-2xl p-6 transition-all ${activeHwTest.tests.gps === 'Başarılı' ? 'border-emerald-500 bg-emerald-50' : activeHwTest.tests.gps === 'Başarısız' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:shadow-md'}`}>
                      <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                        <MapPin size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">GPS Modülü</h3>
                      <p className="text-sm text-slate-500 mb-4">Uydu bağlantı gücünü ve konum doğrulamasını kontrol edin.</p>
                      {activeHwTest.tests.gps === 'Bekliyor' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateHwTest('gps', 'Başarılı')} className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><CheckCircle2 size={16}/> Başarılı</button>
                          <button onClick={() => handleUpdateHwTest('gps', 'Başarısız')} className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><XCircle size={16}/> Başarısız</button>
                        </div>
                      ) : (
                        <div className={`font-bold text-center py-2 rounded-lg ${activeHwTest.tests.gps === 'Başarılı' ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                          {activeHwTest.tests.gps}
                        </div>
                      )}
                    </div>

                    {/* Wi-Fi Test */}
                    <div className={`border rounded-2xl p-6 transition-all ${activeHwTest.tests.wifi === 'Başarılı' ? 'border-emerald-500 bg-emerald-50' : activeHwTest.tests.wifi === 'Başarısız' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:shadow-md'}`}>
                      <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600 mb-4">
                        <Wifi size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Wi-Fi & Bluetooth</h3>
                      <p className="text-sm text-slate-500 mb-4">Kablosuz ağ bağlantı stabilitesini ve sinyal gücünü ölçün.</p>
                      {activeHwTest.tests.wifi === 'Bekliyor' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateHwTest('wifi', 'Başarılı')} className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><CheckCircle2 size={16}/> Başarılı</button>
                          <button onClick={() => handleUpdateHwTest('wifi', 'Başarısız')} className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><XCircle size={16}/> Başarısız</button>
                        </div>
                      ) : (
                        <div className={`font-bold text-center py-2 rounded-lg ${activeHwTest.tests.wifi === 'Başarılı' ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                          {activeHwTest.tests.wifi}
                        </div>
                      )}
                    </div>

                    {/* Camera Sensor Test */}
                    <div className={`border rounded-2xl p-6 transition-all ${activeHwTest.tests.camera === 'Başarılı' ? 'border-emerald-500 bg-emerald-50' : activeHwTest.tests.camera === 'Başarısız' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:shadow-md'}`}>
                      <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mb-4">
                        <Camera size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Kamera Sensörü</h3>
                      <p className="text-sm text-slate-500 mb-4">Görüntü sensörü durumunu, odaklamayı ve lens kalibrasyonunu test edin.</p>
                      {activeHwTest.tests.camera === 'Bekliyor' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateHwTest('camera', 'Başarılı')} className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><CheckCircle2 size={16}/> Başarılı</button>
                          <button onClick={() => handleUpdateHwTest('camera', 'Başarısız')} className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><XCircle size={16}/> Başarısız</button>
                        </div>
                      ) : (
                        <div className={`font-bold text-center py-2 rounded-lg ${activeHwTest.tests.camera === 'Başarılı' ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                          {activeHwTest.tests.camera}
                        </div>
                      )}
                    </div>

                    {/* Battery Test */}
                    <div className={`border rounded-2xl p-6 transition-all ${activeHwTest.tests.battery === 'Başarılı' ? 'border-emerald-500 bg-emerald-50' : activeHwTest.tests.battery === 'Başarısız' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:shadow-md'}`}>
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
                        <Battery size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Batarya & Güç</h3>
                      <p className="text-sm text-slate-500 mb-4">Batarya sağlığını, şarj akımını ve güç tüketimini analiz edin.</p>
                      {activeHwTest.tests.battery === 'Bekliyor' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateHwTest('battery', 'Başarılı')} className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><CheckCircle2 size={16}/> Başarılı</button>
                          <button onClick={() => handleUpdateHwTest('battery', 'Başarısız')} className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1"><XCircle size={16}/> Başarısız</button>
                        </div>
                      ) : (
                        <div className={`font-bold text-center py-2 rounded-lg ${activeHwTest.tests.battery === 'Başarılı' ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                          {activeHwTest.tests.battery}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {mainTab === 'knowledge' && (
          <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700 max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <BookOpen size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Bilgi Bankası & Çözümler</h2>
                  <p className="text-slate-500 mt-1">Sık karşılaşılan hatalar, hata kodları ve çözüm adımları.</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    value={kbSearchQuery}
                    onChange={(e) => setKbSearchQuery(e.target.value)}
                    placeholder="Hata kodu veya sorun arayın (örn: E01, SD Kart Hatası)..." 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2a3b8f] focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Sık Karşılaşılan Sorunlar</h3>
                    
                    {kbFaqs.filter(faq => 
                      faq.title.toLowerCase().includes(kbSearchQuery.toLowerCase()) || 
                      faq.description.toLowerCase().includes(kbSearchQuery.toLowerCase())
                    ).length === 0 ? (
                      <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                        {kbSearchQuery ? 'Aramanızla eşleşen sonuç bulunamadı.' : 'Henüz SSS eklenmemiş.'}
                      </div>
                    ) : (
                      kbFaqs.filter(faq => 
                        faq.title.toLowerCase().includes(kbSearchQuery.toLowerCase()) || 
                        faq.description.toLowerCase().includes(kbSearchQuery.toLowerCase())
                      ).map(faq => (
                        <div key={faq.id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors cursor-pointer bg-white">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded mb-2 ${
                                faq.category === 'Kritik' ? 'bg-red-100 text-red-700' :
                                faq.category === 'Donanım' ? 'bg-amber-100 text-amber-700' :
                                faq.category === 'Yazılım' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {faq.category}
                              </span>
                              <h4 className="font-bold text-slate-800 text-lg">{faq.title}</h4>
                              <p className="text-slate-600 text-sm mt-1">{faq.description}</p>
                            </div>
                            <ChevronRight className="text-slate-400 shrink-0 mt-2" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Hızlı Bağlantılar</h3>
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                      {kbLinks.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-sm">
                          Bağlantı bulunamadı.
                        </div>
                      ) : (
                        kbLinks.map(link => (
                          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-700 hover:text-[#2a3b8f] font-medium p-2 rounded-lg hover:bg-white transition-colors">
                            {link.type === 'document' && <FileText size={18} className="text-slate-400" />}
                            {link.type === 'download' && <Download size={18} className="text-slate-400" />}
                            {link.type === 'video' && <Video size={18} className="text-slate-400" />}
                            <span className="truncate">{link.title}</span>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <div className="fixed bottom-4 right-4 z-40">
        <button 
          onClick={() => setShowAdmin(true)}
          className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors bg-white/50 backdrop-blur px-2 py-1 rounded-md border border-slate-200/50 shadow-sm"
        >
          design by Başar Özgür Yanıklar
        </button>
      </div>

      {/* Admin Panel Modal */}
      {showAdmin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Lock size={18} className="text-[#2a3b8f]" />
                Admin Paneli
              </h2>
              <button onClick={() => setShowAdmin(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {!adminAuth ? (
                <form onSubmit={handleAdminLogin} className="max-w-sm mx-auto py-12 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#2a3b8f]">
                    <Lock size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Yönetici Girişi</h3>
                  <p className="text-slate-500 text-sm mb-6">Özel yazılım eklemek için şifrenizi girin.</p>
                  <input 
                    type="password" 
                    value={adminPwd}
                    onChange={e => setAdminPwd(e.target.value)}
                    placeholder="Şifre"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-[#2a3b8f] focus:border-[#2a3b8f] outline-none transition-all mb-4 text-center"
                    autoFocus
                  />
                  <button type="submit" className="w-full bg-[#2a3b8f] hover:bg-[#1e2a6b] text-white font-semibold py-3 rounded-xl transition-all">
                    Giriş Yap
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Admin Tabs */}
                  <div className="flex border-b border-slate-200 overflow-x-auto custom-scrollbar">
                    <button
                      onClick={() => setAdminTab('firmware')}
                      className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${adminTab === 'firmware' ? 'border-[#2a3b8f] text-[#2a3b8f]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      Yazılım Yönetimi
                    </button>
                    <button
                      onClick={() => setAdminTab('verification')}
                      className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${adminTab === 'verification' ? 'border-[#2a3b8f] text-[#2a3b8f]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      Parça Doğrulama
                    </button>
                    <button
                      onClick={() => setAdminTab('hardware')}
                      className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${adminTab === 'hardware' ? 'border-[#2a3b8f] text-[#2a3b8f]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      Donanım Testleri
                    </button>
                    <button
                      onClick={() => setAdminTab('knowledge')}
                      className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${adminTab === 'knowledge' ? 'border-[#2a3b8f] text-[#2a3b8f]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      Bilgi Bankası
                    </button>
                  </div>

                  {adminTab === 'firmware' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      {/* Add New Firmware */}
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Plus size={16} /> Yeni Yazılım Ekle
                        </h3>
                        <form onSubmit={handleSaveCustomFw} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Model / Yazılım Adı</label>
                              <input 
                                type="text" 
                                required
                                value={newFwName}
                                onChange={e => setNewFwName(e.target.value)}
                                placeholder="Örn: 70mai A810 Custom"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Hedef Dosya Adı (SD Kartta)</label>
                              <input 
                                type="text" 
                                required
                                value={newFwTarget}
                                onChange={e => setNewFwTarget(e.target.value)}
                                placeholder="Örn: FW_DR000.bin"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Yazılım Türü</label>
                              <select
                                value={newFwType}
                                onChange={e => setNewFwType(e.target.value as 'official' | 'custom')}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none bg-white"
                              >
                                <option value="official">Resmi Yazılım</option>
                                <option value="custom">Özel (Custom) Yazılım</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Yazılım Dosyası (.bin, .zip)</label>
                            <input 
                              type="file" 
                              required
                              onChange={e => setNewFwFile(e.target.files?.[0] || null)}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#2a3b8f] hover:file:bg-blue-100"
                            />
                          </div>
                          <button 
                            type="submit" 
                            disabled={isSavingFw}
                            className="w-full bg-[#2a3b8f] hover:bg-[#1e2a6b] text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isSavingFw ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Upload size={16} />}
                            {isSavingFw ? 'Kaydediliyor...' : 'Yazılımı Veritabanına Ekle'}
                          </button>
                        </form>
                      </div>

                      {/* List Custom Firmwares */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <HardDrive size={16} /> Eklenen Özel Yazılımlar
                        </h3>
                        {customFws.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">Henüz özel yazılım eklenmemiş.</p>
                        ) : (
                          <div className="space-y-2">
                            {customFws.map(fw => (
                              <div key={fw.id} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                                <div>
                                  <p className="font-semibold text-slate-800 text-sm">{fw.name}</p>
                                  <p className="text-xs text-slate-500 font-mono">{fw.file} → {fw.targetName}</p>
                                </div>
                                <button 
                                  onClick={() => handleDeleteCustomFw(fw.id)}
                                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                  title="Sil"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {adminTab === 'verification' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      
                      {/* Active Report Verification */}
                      {report ? (
                        <div className="bg-white rounded-2xl p-6 border border-[#2a3b8f] shadow-sm ring-1 ring-[#2a3b8f]/20">
                          <h3 className="text-sm font-bold text-[#2a3b8f] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity size={16} /> Aktif Rapor Doğrulaması
                          </h3>
                          
                          {(() => {
                            const matchedDevice = registeredDevices.find(d => d.mbSerial === report.donanim.serial);
                            
                            if (!matchedDevice) {
                              return (
                                <div className="bg-slate-50 border border-slate-200 text-slate-600 p-4 rounded-xl text-sm flex items-start gap-3">
                                  <Info size={20} className="shrink-0 text-slate-400" />
                                  <div>
                                    <p className="font-semibold text-slate-800">Cihaz Kayıtlı Değil</p>
                                    <p className="mt-1">Şu an incelenen cihazın anakart seri numarası ({report.donanim.serial}) veritabanında bulunamadı. Doğrulama yapılamıyor.</p>
                                  </div>
                                </div>
                              );
                            }

                            const mbMatch = report.parca_dogrulama.anakart_seri.okunan === matchedDevice.mbSerial;
                            const camMatch = !matchedDevice.cameraSensor || report.parca_dogrulama.kamera_sensor.okunan === matchedDevice.cameraSensor;
                            const wifiMatch = !matchedDevice.wifiMac || report.parca_dogrulama.wifi_mac.okunan === matchedDevice.wifiMac;
                            const allMatch = mbMatch && camMatch && wifiMatch;

                            return (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  <span className="text-sm font-semibold text-slate-700">Eşleşen Referans: {matchedDevice.name}</span>
                                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${allMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {allMatch ? 'TÜM PARÇALAR ORİJİNAL' : 'PARÇA DEĞİŞİMİ TESPİT EDİLDİ'}
                                  </span>
                                </div>

                                <table className="w-full text-left border-collapse text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                      <th className="pb-2 font-semibold">Bileşen</th>
                                      <th className="pb-2 font-semibold">Beklenen (Referans)</th>
                                      <th className="pb-2 font-semibold">Okunan (Cihaz)</th>
                                      <th className="pb-2 font-semibold">Durum</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-slate-100">
                                      <td className="py-3 font-medium text-slate-700">Anakart Seri No</td>
                                      <td className="py-3 font-mono text-slate-500">{matchedDevice.mbSerial}</td>
                                      <td className={`py-3 font-mono font-bold ${mbMatch ? 'text-emerald-600' : 'text-red-600'}`}>{report.parca_dogrulama.anakart_seri.okunan}</td>
                                      <td className="py-3">
                                        {mbMatch ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-red-500" />}
                                      </td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                      <td className="py-3 font-medium text-slate-700">Kamera Sensör ID</td>
                                      <td className="py-3 font-mono text-slate-500">{matchedDevice.cameraSensor || '-'}</td>
                                      <td className={`py-3 font-mono font-bold ${camMatch ? 'text-emerald-600' : 'text-red-600'}`}>{report.parca_dogrulama.kamera_sensor.okunan}</td>
                                      <td className="py-3">
                                        {camMatch ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-red-500" />}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="py-3 font-medium text-slate-700">Wi-Fi MAC</td>
                                      <td className="py-3 font-mono text-slate-500">{matchedDevice.wifiMac || '-'}</td>
                                      <td className={`py-3 font-mono font-bold ${wifiMatch ? 'text-emerald-600' : 'text-red-600'}`}>{report.parca_dogrulama.wifi_mac.okunan}</td>
                                      <td className="py-3">
                                        {wifiMatch ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-red-500" />}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
                          <Info size={24} className="mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600">Aktif bir rapor bulunmuyor. Doğrulama yapmak için önce bir log dosyası yükleyin.</p>
                        </div>
                      )}

                      {/* Add New Device */}
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Plus size={16} /> Yeni Referans Cihaz Ekle
                        </h3>
                        <form onSubmit={handleSaveDevice} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Cihaz Adı / Model</label>
                              <input 
                                type="text" 
                                required
                                value={newDeviceName}
                                onChange={e => setNewDeviceName(e.target.value)}
                                placeholder="Örn: Müşteri A - 70mai A810"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Anakart Seri No</label>
                              <input 
                                type="text" 
                                required
                                value={newDeviceMbSerial}
                                onChange={e => setNewDeviceMbSerial(e.target.value)}
                                placeholder="Örn: MB-12345678"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Kamera Sensör ID</label>
                              <input 
                                type="text" 
                                value={newDeviceCameraSensor}
                                onChange={e => setNewDeviceCameraSensor(e.target.value)}
                                placeholder="Örn: IMX415-001"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Wi-Fi MAC Adresi</label>
                              <input 
                                type="text" 
                                value={newDeviceWifiMac}
                                onChange={e => setNewDeviceWifiMac(e.target.value)}
                                placeholder="Örn: 00:1A:2B:3C:4D:5E"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none font-mono"
                              />
                            </div>
                          </div>
                          <button 
                            type="submit" 
                            disabled={isSavingDevice}
                            className="w-full bg-[#2a3b8f] hover:bg-[#1e2a6b] text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isSavingDevice ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Upload size={16} />}
                            {isSavingDevice ? 'Kaydediliyor...' : 'Referans Cihazı Kaydet'}
                          </button>
                        </form>
                      </div>

                      {/* List Registered Devices */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Fingerprint size={16} /> Kayıtlı Referans Cihazlar
                        </h3>
                        {registeredDevices.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">Henüz referans cihaz eklenmemiş.</p>
                        ) : (
                          <div className="space-y-3">
                            {registeredDevices.map(device => (
                              <div key={device.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                                  <p className="font-bold text-slate-800 text-sm">{device.name}</p>
                                  <button 
                                    onClick={() => handleDeleteDevice(device.id)}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    title="Sil"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                  <div>
                                    <p className="text-slate-500 font-medium mb-1">Anakart Seri No</p>
                                    <p className="font-mono text-slate-700">{device.mbSerial}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 font-medium mb-1">Kamera Sensörü</p>
                                    <p className="font-mono text-slate-700">{device.cameraSensor || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 font-medium mb-1">Wi-Fi MAC</p>
                                    <p className="font-mono text-slate-700">{device.wifiMac || '-'}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {adminTab === 'hardware' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <ListChecks size={16} /> Donanım Testi Kayıtları
                        </h3>
                        {hardwareTests.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">Henüz donanım testi kaydı bulunmuyor.</p>
                        ) : (
                          <div className="space-y-3">
                            {hardwareTests.map(test => (
                              <div key={test.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                                  <div>
                                    <p className="font-bold text-slate-800 text-sm">{test.model} - {test.serial}</p>
                                    <p className="text-xs text-slate-500">{test.date} • {test.method}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${test.status === 'Başarılı' ? 'bg-emerald-100 text-emerald-700' : test.status === 'Başarısız' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {test.status}
                                    </span>
                                    <button 
                                      onClick={async () => {
                                        if(window.confirm('Bu test kaydını silmek istediğinize emin misiniz?')) {
                                          await deleteHardwareTest(test.id);
                                          await loadHardwareTests();
                                        }
                                      }}
                                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                      title="Sil"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                                  {Object.entries(test.tests).map(([key, val]) => (
                                    <div key={key} className={`p-2 rounded-lg border text-center ${val === 'Başarılı' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : val === 'Başarısız' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                      <p className="font-semibold capitalize mb-1">{key}</p>
                                      <p>{val}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {adminTab === 'knowledge' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      {/* Add FAQ */}
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <HelpCircle size={16} /> Yeni SSS Ekle
                        </h3>
                        <form onSubmit={handleSaveFaq} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Soru Başlığı</label>
                              <input 
                                type="text" 
                                required
                                value={newFaqTitle}
                                onChange={e => setNewFaqTitle(e.target.value)}
                                placeholder="Örn: Cihaz açılmıyor, ne yapmalıyım?"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
                              <select
                                value={newFaqCategory}
                                onChange={e => setNewFaqCategory(e.target.value as any)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none bg-white"
                              >
                                <option value="Genel">Genel</option>
                                <option value="Donanım">Donanım</option>
                                <option value="Yazılım">Yazılım</option>
                                <option value="Kritik">Kritik</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Cevap / Açıklama</label>
                            <textarea 
                              required
                              value={newFaqDesc}
                              onChange={e => setNewFaqDesc(e.target.value)}
                              placeholder="Çözüm adımlarını buraya yazın..."
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none min-h-[100px]"
                            />
                          </div>
                          <button 
                            type="submit" 
                            className="w-full bg-[#2a3b8f] hover:bg-[#1e2a6b] text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={16} /> SSS Kaydet
                          </button>
                        </form>
                      </div>

                      {/* Add Link */}
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <LinkIcon size={16} /> Yeni Bağlantı Ekle
                        </h3>
                        <form onSubmit={handleSaveLink} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Bağlantı Başlığı</label>
                              <input 
                                type="text" 
                                required
                                value={newLinkTitle}
                                onChange={e => setNewLinkTitle(e.target.value)}
                                placeholder="Örn: A810 Söküm Videosu"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">URL</label>
                              <input 
                                type="url" 
                                required
                                value={newLinkUrl}
                                onChange={e => setNewLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Tür</label>
                              <select
                                value={newLinkType}
                                onChange={e => setNewLinkType(e.target.value as any)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2a3b8f] outline-none bg-white"
                              >
                                <option value="document">Döküman</option>
                                <option value="video">Video</option>
                                <option value="download">İndirme</option>
                              </select>
                            </div>
                          </div>
                          <button 
                            type="submit" 
                            className="w-full bg-[#2a3b8f] hover:bg-[#1e2a6b] text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={16} /> Bağlantı Kaydet
                          </button>
                        </form>
                      </div>

                      {/* List FAQs and Links */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <HelpCircle size={16} /> Kayıtlı SSS'ler
                          </h3>
                          {kbFaqs.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">Henüz SSS eklenmemiş.</p>
                          ) : (
                            <div className="space-y-3">
                              {kbFaqs.map(faq => (
                                <div key={faq.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <p className="font-bold text-slate-800 text-sm mb-1">{faq.title}</p>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">{faq.category}</span>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteFaq(faq.id)}
                                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <LinkIcon size={16} /> Kayıtlı Bağlantılar
                          </h3>
                          {kbLinks.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">Henüz bağlantı eklenmemiş.</p>
                          ) : (
                            <div className="space-y-3">
                              {kbLinks.map(link => (
                                <div key={link.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 text-sm truncate">{link.title}</p>
                                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">{link.url}</a>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteLink(link.id)}
                                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpecRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <div className="text-slate-400 shrink-0">
        {React.cloneElement(icon as React.ReactElement, { size: 18 })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate" title={value}>{value || "-"}</p>
      </div>
    </div>
  );
}

function TechSummaryCard({ icon, title, item }: { icon: React.ReactNode, title: string, item: any }) {
  return (
    <div className={`p-5 rounded-2xl border flex flex-col gap-3 transition-all ${item.renk}`}>
      <div className="flex items-center gap-3">
        <div className={`shrink-0 ${item.ikon_renk}`}>
          {icon}
        </div>
        <h4 className="font-bold text-sm uppercase tracking-wider opacity-80">{title}</h4>
      </div>
      <div>
        <p className="text-lg font-bold mb-1">{item.durum}</p>
        <p className="text-xs font-medium opacity-80 leading-snug">{item.detay}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 rounded-t-xl whitespace-nowrap ${
        active 
          ? 'border-[#2a3b8f] text-[#2a3b8f] bg-[#2a3b8f]/5' 
          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className={`ml-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full ${active ? 'bg-[#2a3b8f] text-white' : 'bg-slate-200 text-slate-600'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function DiagnosticCard({ item, key }: { item: DiagnosticResult, key?: React.Key }) {
  const isFatal = item.seviye === 'FATAL';
  const isCritical = item.seviye === 'KRİTİK';
  
  const colorClass = isFatal 
    ? 'bg-red-50 border-red-200 text-red-800' 
    : isCritical 
      ? 'bg-orange-50 border-orange-200 text-orange-800'
      : 'bg-amber-50 border-amber-200 text-amber-800';

  const iconColorClass = isFatal ? 'text-red-600' : isCritical ? 'text-orange-600' : 'text-amber-600';
  const badgeClass = isFatal ? 'bg-red-100 text-red-700' : isCritical ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700';

  return (
    <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-6 ${colorClass}`}>
      <div className="shrink-0 pt-1">
        <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm ${iconColorClass}`}>
          {isFatal ? <XCircle size={24} /> : <AlertTriangle size={24} />}
        </div>
      </div>
      
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${badgeClass}`}>
            {item.seviye}
          </span>
          <h4 className="text-lg font-bold">{item.tani}</h4>
        </div>
        
        <div className="space-y-4 mt-4">
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Sorun Detayı</h5>
            <p className="font-medium opacity-90 leading-relaxed">{item.detay}</p>
          </div>
          
          {item.cozum && (
            <div className="bg-white/60 rounded-xl p-4 border border-white/40">
              <h5 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 flex items-center gap-1">
                <Info size={14} /> Çözüm Önerisi
              </h5>
              <p className="font-semibold opacity-100">{item.cozum}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

