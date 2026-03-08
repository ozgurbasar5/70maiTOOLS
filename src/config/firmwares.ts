export interface FirmwareDef {
  id: string;
  name: string;
  file: string;
  targetName: string;
}

export const FIRMWARE_DB: FirmwareDef[] = [
  { id: 'A800S', name: '70mai Dash Cam 4K A800S', file: 'A800S_FW.bin', targetName: 'FW_DR000.bin' },
  { id: 'A500S', name: '70mai Dash Cam Pro Plus+ A500S', file: 'A500S_FW.bin', targetName: 'FW_DR000.bin' },
  { id: 'M300', name: '70mai Dash Cam M300', file: 'M300_FW.bin', targetName: 'FW_DR000.bin' },
  { id: '1S', name: '70mai Smart Dash Cam 1S', file: '1S_FW.bin', targetName: 'FW_DR000.bin' },
  { id: 'OMNI', name: '70mai Omni X200', file: 'OMNI_FW.bin', targetName: 'update.zip' },
  { id: 'A810', name: '70mai Dash Cam 4K A810', file: 'A810_FW.bin', targetName: 'FW_DR000.bin' },
];
