import { defineStore } from 'pinia';
import { createOtpAuthUrl, generateBase32Secret } from '@/utils/totp';

export interface DeviceRecord {
  id: string;
  serialNumber: string;
  label: string;
  secret: string;
  otpAuthUrl: string;
  createdAt: string;
}

const STORAGE_KEY = 'open2fa:devices';

const defaultDevices: DeviceRecord[] = [
  {
    id: 'demo-1',
    serialNumber: 'SN-001-OPEN2FA',
    label: '演示离线设备 A',
    secret: 'JBSWY3DPEHPK3PXP',
    otpAuthUrl: createOtpAuthUrl({ accountName: 'SN-001-OPEN2FA', secret: 'JBSWY3DPEHPK3PXP' }),
    createdAt: new Date('2024-11-01T09:00:00Z').toISOString()
  },
  {
    id: 'demo-2',
    serialNumber: 'SN-002-OPEN2FA',
    label: '演示离线设备 B',
    secret: 'KRUGS4ZANFZSAYJA',
    otpAuthUrl: createOtpAuthUrl({ accountName: 'SN-002-OPEN2FA', secret: 'KRUGS4ZANFZSAYJA' }),
    createdAt: new Date('2024-12-12T09:30:00Z').toISOString()
  }
];

const loadDevices = (): DeviceRecord[] => {
  if (typeof window === 'undefined') {
    return [...defaultDevices];
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [...defaultDevices];
  }
  try {
    const parsed = JSON.parse(raw) as DeviceRecord[];
    return parsed.length ? parsed : [...defaultDevices];
  } catch (error) {
    console.warn('无法解析设备列表，恢复为默认数据', error);
    localStorage.removeItem(STORAGE_KEY);
    return [...defaultDevices];
  }
};

const persistDevices = (devices: DeviceRecord[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
};

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useDeviceStore = defineStore('devices', {
  state: () => ({
    devices: loadDevices() as DeviceRecord[]
  }),
  getters: {
    total: (state) => state.devices.length
  },
  actions: {
    refreshFromStorage() {
      this.devices = loadDevices();
    },
    addDevice(serialNumber: string, label?: string) {
      const normalizedSerial = serialNumber.trim().toUpperCase();
      if (!normalizedSerial) {
        throw new Error('设备序列号不能为空');
      }
      const exists = this.devices.some((item) => item.serialNumber === normalizedSerial);
      if (exists) {
        throw new Error('该序列号已经存在，请勿重复添加');
      }

      const secret = generateBase32Secret(20);
      const device: DeviceRecord = {
        id: createId(),
        serialNumber: normalizedSerial,
        label: label?.trim() || `离线设备 ${normalizedSerial.slice(-4)}`,
        secret,
        otpAuthUrl: createOtpAuthUrl({ accountName: normalizedSerial, secret }),
        createdAt: new Date().toISOString()
      };

      this.devices = [device, ...this.devices];
      persistDevices(this.devices);
      return device;
    }
  }
});
