import { createOtpAuthUrl, generateBase32Secret } from '@/utils/totp';
import type { UserRole } from '@/store/auth';

export interface LoginResponse {
  success: boolean;
  token: string;
  role: UserRole;
}

export interface ProfileResponse {
  success: boolean;
  user: {
    user_id: string;
    username: string;
    role: UserRole;
  };
}

export interface LogoutResponse {
  success: boolean;
}

export interface DeviceCreatePayload {
  device_sn: string;
  device_model: string;
  device_name: string;
  owner_org: string;
  remark?: string;
}

export interface DeviceUpdatePayload {
  device_name?: string;
  device_model?: string;
  owner_org?: string;
  remark?: string | null;
}

export interface DeviceListItem {
  device_id: string;
  device_sn: string;
  device_model: string;
  device_name: string;
  owner_org: string;
  remark?: string;
  created_at: string;
  updated_at: string;
  secret_masked: string;
  otpauth_url: string;
}

export interface DeviceListResponse {
  success: boolean;
  devices: DeviceListItem[];
}

export interface DeviceDetailResponse {
  success: boolean;
  device: DeviceListItem;
}

export interface DeviceResetResponse {
  success: boolean;
  secret_masked: string;
  otpauth_url: string;
}

export interface PublicDeviceListItem {
  device_id: string;
  device_sn: string;
  device_model: string;
  device_name: string;
  owner_org: string;
  has_2fa: boolean;
}

export interface PublicDeviceListResponse {
  success: boolean;
  devices: PublicDeviceListItem[];
}

export interface PublicDeviceDetailResponse {
  success: boolean;
  device: PublicDeviceListItem & {
    otpauth_url: string;
    secret_masked: string;
  };
}

const USERS = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    role: 'admin' as const
  },
  {
    id: 'user-operator',
    username: 'user',
    password: 'user123',
    role: 'user' as const
  }
];

interface DeviceRecord {
  id: string;
  deviceSn: string;
  deviceModel: string;
  deviceName: string;
  ownerOrg: string;
  remark?: string;
  secret: string;
  createdAt: string;
  updatedAt: string;
}

const DEVICE_STORAGE_KEY = 'open2fa:mock-devices';

const DEFAULT_DEVICES: DeviceRecord[] = [
  {
    id: 'device-1001',
    deviceSn: 'SN-1001-OPEN2FA',
    deviceModel: 'Industrial Edge 500',
    deviceName: '生产线边缘节点 A',
    ownerOrg: '制造事业部',
    remark: '安装于一号产线配电柜',
    secret: 'JBSWY3DPEHPK3PXP',
    createdAt: '2024-03-12T01:30:00.000Z',
    updatedAt: '2024-03-12T01:30:00.000Z'
  },
  {
    id: 'device-1002',
    deviceSn: 'SN-1002-OPEN2FA',
    deviceModel: 'Industrial Edge 500',
    deviceName: '生产线边缘节点 B',
    ownerOrg: '制造事业部',
    remark: '备用节点，定期巡检',
    secret: 'KRUGS4ZANFZSAYJA',
    createdAt: '2024-05-18T09:20:00.000Z',
    updatedAt: '2024-05-18T09:20:00.000Z'
  },
  {
    id: 'device-2001',
    deviceSn: 'SN-2001-OPEN2FA',
    deviceModel: 'Secure Gateway X',
    deviceName: '分支机构 VPN 网关',
    ownerOrg: '信息安全部',
    remark: '负责分支机构访问总部网络',
    secret: 'NB2W45DFOIZA====',
    createdAt: '2024-06-02T13:45:00.000Z',
    updatedAt: '2024-06-02T13:45:00.000Z'
  }
];

const randomDelay = () => 150 + Math.floor(Math.random() * 300);

const toMasked = (secret: string) =>
  secret
    .split('')
    .map((char, index) => (index < secret.length - 4 ? '*' : char))
    .join('');

const readDevices = (): DeviceRecord[] => {
  if (typeof window === 'undefined') {
    return [...DEFAULT_DEVICES];
  }
  const raw = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (!raw) {
    return [...DEFAULT_DEVICES];
  }
  try {
    const parsed = JSON.parse(raw) as DeviceRecord[];
    return parsed.length ? parsed : [...DEFAULT_DEVICES];
  } catch (error) {
    console.warn('无法解析 mock 设备数据，回退默认数据', error);
    localStorage.removeItem(DEVICE_STORAGE_KEY);
    return [...DEFAULT_DEVICES];
  }
};

const writeDevices = (devices: DeviceRecord[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(devices));
};

let deviceCache = readDevices();
const sessionTokens = new Map<string, string>();

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `device-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;

const ensureSession = (token: string) => {
  const userId = sessionTokens.get(token);
  if (!userId) {
    throw new Error('未授权访问');
  }
  const user = USERS.find((item) => item.id === userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  return user;
};

const mapDevice = (item: DeviceRecord): DeviceListItem => ({
  device_id: item.id,
  device_sn: item.deviceSn,
  device_model: item.deviceModel,
  device_name: item.deviceName,
  owner_org: item.ownerOrg,
  remark: item.remark,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
  secret_masked: toMasked(item.secret),
  otpauth_url: createOtpAuthUrl({
    accountName: item.deviceSn,
    secret: item.secret,
    issuer: 'Open2FA'
  })
});

const listPublicDevices = (): PublicDeviceListItem[] =>
  deviceCache.map((item) => ({
    device_id: item.id,
    device_sn: item.deviceSn,
    device_model: item.deviceModel,
    device_name: item.deviceName,
    owner_org: item.ownerOrg,
    has_2fa: Boolean(item.secret)
  }));

export const mockApi = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const user = USERS.find((item) => item.username === username.trim());
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!user || user.password !== password) {
          reject(new Error('用户名或密码错误'));
          return;
        }
        const token = `mock-token-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        sessionTokens.set(token, user.id);
        resolve({
          success: true,
          token,
          role: user.role
        });
      }, randomDelay());
    });
  },
  async profile(token: string): Promise<ProfileResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const user = ensureSession(token);
          resolve({
            success: true,
            user: {
              user_id: user.id,
              username: user.username,
              role: user.role
            }
          });
        } catch (error) {
          reject(error instanceof Error ? error : new Error('身份验证失败'));
        }
      }, randomDelay());
    });
  },
  async logout(token: string): Promise<LogoutResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        sessionTokens.delete(token);
        resolve({ success: true });
      }, randomDelay());
    });
  },
  async listDevices(token: string, filters?: {
    device_sn?: string;
    device_model?: string;
    owner_org?: string;
  }): Promise<DeviceListResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const user = ensureSession(token);
          if (user.role !== 'admin') {
            throw new Error('只有管理员可以查看设备列表');
          }
          let devices = [...deviceCache];
          if (filters?.device_sn) {
            const sn = filters.device_sn.toUpperCase();
            devices = devices.filter((item) => item.deviceSn.includes(sn));
          }
          if (filters?.device_model) {
            const model = filters.device_model.toLowerCase();
            devices = devices.filter((item) => item.deviceModel.toLowerCase().includes(model));
          }
          if (filters?.owner_org) {
            const owner = filters.owner_org.toLowerCase();
            devices = devices.filter((item) => item.ownerOrg.toLowerCase().includes(owner));
          }
          resolve({
            success: true,
            devices: devices.map(mapDevice)
          });
        } catch (error) {
          reject(error instanceof Error ? error : new Error('查询设备失败'));
        }
      }, randomDelay());
    });
  },
  async getDevice(token: string, deviceId: string): Promise<DeviceDetailResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const user = ensureSession(token);
          if (user.role !== 'admin') {
            throw new Error('只有管理员可以查看设备详情');
          }
          const found = deviceCache.find((item) => item.id === deviceId);
          if (!found) {
            throw new Error('设备不存在');
          }
          resolve({ success: true, device: mapDevice(found) });
        } catch (error) {
          reject(error instanceof Error ? error : new Error('查询设备详情失败'));
        }
      }, randomDelay());
    });
  },
  async createDevice(token: string, payload: DeviceCreatePayload): Promise<DeviceDetailResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const user = ensureSession(token);
          if (user.role !== 'admin') {
            throw new Error('只有管理员可以创建设备');
          }
          const serial = payload.device_sn.trim().toUpperCase();
          if (deviceCache.some((item) => item.deviceSn === serial)) {
            throw new Error('该序列号已经存在，请勿重复添加');
          }
          const now = new Date().toISOString();
          const secret = generateBase32Secret(20);
          const record: DeviceRecord = {
            id: createId(),
            deviceSn: serial,
            deviceModel: payload.device_model.trim(),
            deviceName: payload.device_name.trim(),
            ownerOrg: payload.owner_org.trim(),
            remark: payload.remark?.trim() || undefined,
            secret,
            createdAt: now,
            updatedAt: now
          };
          deviceCache = [record, ...deviceCache];
          writeDevices(deviceCache);
          resolve({ success: true, device: mapDevice(record) });
        } catch (error) {
          reject(error instanceof Error ? error : new Error('创建设备失败'));
        }
      }, randomDelay());
    });
  },
  async updateDevice(token: string, deviceId: string, payload: DeviceUpdatePayload): Promise<LogoutResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const user = ensureSession(token);
          if (user.role !== 'admin') {
            throw new Error('只有管理员可以更新设备');
          }
          const index = deviceCache.findIndex((item) => item.id === deviceId);
          if (index === -1) {
            throw new Error('设备不存在');
          }
          const target = deviceCache[index];
          const updated: DeviceRecord = {
            ...target,
            deviceName: payload.device_name?.trim() || target.deviceName,
            deviceModel: payload.device_model?.trim() || target.deviceModel,
            ownerOrg: payload.owner_org?.trim() || target.ownerOrg,
            remark:
              payload.remark === undefined
                ? target.remark
                : payload.remark === null || payload.remark.trim() === ''
                ? undefined
                : payload.remark.trim(),
            updatedAt: new Date().toISOString()
          };
          deviceCache.splice(index, 1, updated);
          writeDevices(deviceCache);
          resolve({ success: true });
        } catch (error) {
          reject(error instanceof Error ? error : new Error('更新设备失败'));
        }
      }, randomDelay());
    });
  },
  async resetDevice2fa(token: string, deviceId: string): Promise<DeviceResetResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const user = ensureSession(token);
          if (user.role !== 'admin') {
            throw new Error('只有管理员可以重置二次验证');
          }
          const index = deviceCache.findIndex((item) => item.id === deviceId);
          if (index === -1) {
            throw new Error('设备不存在');
          }
          const secret = generateBase32Secret(20);
          const updated: DeviceRecord = {
            ...deviceCache[index],
            secret,
            updatedAt: new Date().toISOString()
          };
          deviceCache.splice(index, 1, updated);
          writeDevices(deviceCache);
          resolve({
            success: true,
            secret_masked: toMasked(secret),
            otpauth_url: createOtpAuthUrl({
              accountName: updated.deviceSn,
              secret,
              issuer: 'Open2FA'
            })
          });
        } catch (error) {
          reject(error instanceof Error ? error : new Error('重置二次验证失败'));
        }
      }, randomDelay());
    });
  },
  async publicListDevices(): Promise<PublicDeviceListResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, devices: listPublicDevices() });
      }, randomDelay());
    });
  },
  async publicGetDeviceBySn(deviceSn: string): Promise<PublicDeviceDetailResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalized = deviceSn.trim().toUpperCase();
        const found = deviceCache.find((item) => item.deviceSn === normalized);
        if (!found) {
          reject(new Error('未找到对应设备'));
          return;
        }
        resolve({
          success: true,
          device: {
            device_id: found.id,
            device_sn: found.deviceSn,
            device_model: found.deviceModel,
            device_name: found.deviceName,
            owner_org: found.ownerOrg,
            has_2fa: Boolean(found.secret),
            otpauth_url: createOtpAuthUrl({
              accountName: found.deviceSn,
              secret: found.secret,
              issuer: 'Open2FA'
            }),
            secret_masked: toMasked(found.secret)
          }
        });
      }, randomDelay());
    });
  },
  async publicGetDevice2fa(deviceId: string): Promise<PublicDeviceDetailResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const found = deviceCache.find((item) => item.id === deviceId);
        if (!found) {
          reject(new Error('未找到对应设备'));
          return;
        }
        resolve({
          success: true,
          device: {
            device_id: found.id,
            device_sn: found.deviceSn,
            device_model: found.deviceModel,
            device_name: found.deviceName,
            owner_org: found.ownerOrg,
            has_2fa: Boolean(found.secret),
            otpauth_url: createOtpAuthUrl({
              accountName: found.deviceSn,
              secret: found.secret,
              issuer: 'Open2FA'
            }),
            secret_masked: toMasked(found.secret)
          }
        });
      }, randomDelay());
    });
  }
};

export type MockApi = typeof mockApi;
