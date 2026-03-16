import { createClient } from '@supabase/supabase-js';
import { HardwareTestRecord, KnowledgeBaseFaq, KnowledgeBaseLink } from '../types';

// ==========================================
// 1. SUPABASE (BULUT) BAĞLANTISI VE AYARLARI
// ==========================================
const supabaseUrl = 'https://hcuqlnuattpwdnfzioim.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjdXFsbnVhdHRwd2RuZnppb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODYwMzIsImV4cCI6MjA4ODk2MjAzMn0.6_A70JXod3bF3Elqhjz33FffzRYCijh8CTVZr4FaBUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ServisFisi {
  device_model: string;
  serial_number: string;
  complaint: string;
  physical_condition: string;
  sd_drive: string;
  firmware_version: string;
  format_sd: boolean;
  change_region: boolean;
  clear_logs: boolean;
  technician_note: string;
}

export async function servisKaydiniOlustur(fisVerisi: ServisFisi) {
  const { data, error } = await supabase
    .from('service_tickets')
    .insert([fisVerisi])
    .select();

  if (error) {
    console.error("Aura Cloud'a yazılırken hata oluştu:", error.message);
    throw error;
  }
  return data;
}

// ==========================================
// 2. YEREL VERİTABANI (INDEXEDDB) ARAYÜZLERİ
// ==========================================
export interface CustomFirmware {
  id: string;
  name: string;
  file: string;
  targetName: string;
  blob?: Blob;
  isCustom: boolean;
}

export interface RegisteredDevice {
  id: string;
  name: string;
  mbSerial: string;
  cameraSensor: string;
  wifiMac: string;
}

// ==========================================
// 3. INDEXEDDB SABİTLERİ VE KURULUMU
// ==========================================
const DB_NAME = 'SummitAdminDB';
const STORE_NAME = 'custom_firmwares';
const DEVICES_STORE = 'registered_devices';
const HW_TESTS_STORE = 'hardware_tests';
const KB_FAQS_STORE = 'kb_faqs';
const KB_LINKS_STORE = 'kb_links';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DEVICES_STORE)) {
        db.createObjectStore(DEVICES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(HW_TESTS_STORE)) {
        db.createObjectStore(HW_TESTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(KB_FAQS_STORE)) {
        db.createObjectStore(KB_FAQS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(KB_LINKS_STORE)) {
        db.createObjectStore(KB_LINKS_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// ==========================================
// 4. YEREL DB İŞLEMLERİ (CUSTOM FIRMWARE)
// ==========================================
export const saveCustomFirmware = async (fw: CustomFirmware): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(fw);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const getCustomFirmwares = async (): Promise<CustomFirmware[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      // Omit blob to save memory when listing
      const items = request.result.map(item => ({ ...item, blob: undefined }));
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getCustomFirmwareBlob = async (id: string): Promise<Blob | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result?.blob);
    request.onerror = () => reject(request.error);
  });
};

export const deleteCustomFirmware = async (id: string): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

// ==========================================
// 5. YEREL DB İŞLEMLERİ (REGISTERED DEVICES)
// ==========================================
export const saveRegisteredDevice = async (device: RegisteredDevice): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DEVICES_STORE, 'readwrite');
    const store = tx.objectStore(DEVICES_STORE);
    store.put(device);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const getRegisteredDevices = async (): Promise<RegisteredDevice[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DEVICES_STORE, 'readonly');
    const store = tx.objectStore(DEVICES_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteRegisteredDevice = async (id: string): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DEVICES_STORE, 'readwrite');
    const store = tx.objectStore(DEVICES_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

// ==========================================
// 6. YEREL DB İŞLEMLERİ (HARDWARE TESTS)
// ==========================================
export const saveHardwareTest = async (test: HardwareTestRecord): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HW_TESTS_STORE, 'readwrite');
    const store = tx.objectStore(HW_TESTS_STORE);
    store.put(test);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const getHardwareTests = async (): Promise<HardwareTestRecord[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HW_TESTS_STORE, 'readonly');
    const store = tx.objectStore(HW_TESTS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteHardwareTest = async (id: string): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HW_TESTS_STORE, 'readwrite');
    const store = tx.objectStore(HW_TESTS_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

// ==========================================
// 7. YEREL DB İŞLEMLERİ (KNOWLEDGE BASE FAQS)
// ==========================================
export const saveKbFaq = async (faq: KnowledgeBaseFaq): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KB_FAQS_STORE, 'readwrite');
    const store = tx.objectStore(KB_FAQS_STORE);
    store.put(faq);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const getKbFaqs = async (): Promise<KnowledgeBaseFaq[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KB_FAQS_STORE, 'readonly');
    const store = tx.objectStore(KB_FAQS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteKbFaq = async (id: string): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KB_FAQS_STORE, 'readwrite');
    const store = tx.objectStore(KB_FAQS_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

// ==========================================
// 8. YEREL DB İŞLEMLERİ (KNOWLEDGE BASE LINKS)
// ==========================================
export const saveKbLink = async (link: KnowledgeBaseLink): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KB_LINKS_STORE, 'readwrite');
    const store = tx.objectStore(KB_LINKS_STORE);
    store.put(link);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const getKbLinks = async (): Promise<KnowledgeBaseLink[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KB_LINKS_STORE, 'readonly');
    const store = tx.objectStore(KB_LINKS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteKbLink = async (id: string): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KB_LINKS_STORE, 'readwrite');
    const store = tx.objectStore(KB_LINKS_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};