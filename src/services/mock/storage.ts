import { createOtpAuthUrl, generateBase32Secret } from '@/utils/totp';
import type {
  DeviceCreatePayload,
  DeviceDetailResponse,
  DeviceEntity,
  DeviceListItem,
  DeviceResetResponse,
  DeviceUpdatePayload,
  PublicDeviceDetailResponse,
  PublicDeviceListItem,
  SessionUser
} from './types';
import { createDeviceId, maskSecret } from './utils';

const USERS: SessionUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 'user-operator',
    username: 'user',
    password: 'user123',
    role: 'user'
  }
];

const DEVICE_STORAGE_KEY = 'open2fa:mock-devices';

const DEFAULT_DEVICES: DeviceEntity[] = [
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

const readDevices = (): DeviceEntity[] => {
  if (typeof window === 'undefined') {
    return [...DEFAULT_DEVICES];
  }
  const raw = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (!raw) {
    return [...DEFAULT_DEVICES];
  }
  try {
    const parsed = JSON.parse(raw) as DeviceEntity[];
    return parsed.length ? parsed : [...DEFAULT_DEVICES];
  } catch (error) {
    console.warn('无法解析 mock 设备数据，回退默认数据', error);
    localStorage.removeItem(DEVICE_STORAGE_KEY);
    return [...DEFAULT_DEVICES];
  }
};

let deviceCache: DeviceEntity[] = readDevices();
const sessionTokens = new Map<string, string>();

const persistDevices = () => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(deviceCache));
};

const findUserByUsername = (username: string) =>
  USERS.find((item) => item.username === username.trim());

const getUserById = (id: string) => USERS.find((item) => item.id === id) ?? null;

const getSessionUser = (token: string): SessionUser | null => {
  const userId = sessionTokens.get(token);
  return userId ? getUserById(userId) : null;
};

const ensureSession = (token: string): SessionUser => {
  const user = getSessionUser(token);
  if (!user) {
    throw new Error('未授权访问');
  }
  return user;
};

const ensureAdmin = (token: string): SessionUser => {
  const user = ensureSession(token);
  if (user.role !== 'admin') {
    throw new Error('只有管理员可以执行该操作');
  }
  return user;
};

const findDeviceById = (deviceId: string) => deviceCache.find((item) => item.id === deviceId) ?? null;

const findDeviceBySn = (deviceSn: string) =>
  deviceCache.find((item) => item.deviceSn === deviceSn.trim().toUpperCase()) ?? null;

const toOtpAuthUrl = (device: DeviceEntity) =>
  createOtpAuthUrl({ accountName: device.deviceSn, secret: device.secret, issuer: 'Open2FA' });

const toAdminDevice = (device: DeviceEntity): DeviceListItem => ({
  device_id: device.id,
  device_sn: device.deviceSn,
  device_model: device.deviceModel,
  device_name: device.deviceName,
  owner_org: device.ownerOrg,
  remark: device.remark,
  created_at: device.createdAt,
  updated_at: device.updatedAt,
  secret_masked: maskSecret(device.secret),
  otpauth_url: toOtpAuthUrl(device)
});

const toPublicDevice = (device: DeviceEntity): PublicDeviceListItem => ({
  device_id: device.id,
  device_sn: device.deviceSn,
  device_model: device.deviceModel,
  device_name: device.deviceName,
  owner_org: device.ownerOrg,
  has_2fa: Boolean(device.secret)
});

const toPublicDetail = (device: DeviceEntity): PublicDeviceDetailResponse['device'] => ({
  ...toPublicDevice(device),
  otpauth_url: toOtpAuthUrl(device),
  secret_masked: maskSecret(device.secret)
});

const toResetResponse = (device: DeviceEntity): DeviceResetResponse => ({
  success: true,
  secret_masked: maskSecret(device.secret),
  otpauth_url: toOtpAuthUrl(device)
});

const toDetailResponse = (device: DeviceEntity): DeviceDetailResponse => ({
  success: true,
  device: toAdminDevice(device)
});

const applyRemark = (remark: string | null | undefined, fallback?: string) => {
  if (remark === undefined) return fallback;
  if (remark === null) return undefined;
  const trimmed = remark.trim();
  return trimmed ? trimmed : undefined;
};

const createDevice = (payload: DeviceCreatePayload): DeviceEntity => {
  const normalizedSn = payload.device_sn.trim().toUpperCase();
  if (findDeviceBySn(normalizedSn)) {
    throw new Error('该序列号已经存在，请勿重复添加');
  }
  const now = new Date().toISOString();
  const secret = generateBase32Secret(20);
  const entity: DeviceEntity = {
    id: createDeviceId(),
    deviceSn: normalizedSn,
    deviceModel: payload.device_model.trim(),
    deviceName: payload.device_name.trim(),
    ownerOrg: payload.owner_org.trim(),
    remark: payload.remark?.trim() || undefined,
    secret,
    createdAt: now,
    updatedAt: now
  };
  deviceCache = [entity, ...deviceCache];
  persistDevices();
  return entity;
};

const updateDevice = (deviceId: string, payload: DeviceUpdatePayload): DeviceEntity => {
  const index = deviceCache.findIndex((item) => item.id === deviceId);
  if (index === -1) {
    throw new Error('设备不存在');
  }
  const current = deviceCache[index];
  const updated: DeviceEntity = {
    ...current,
    deviceName: payload.device_name?.trim() || current.deviceName,
    deviceModel: payload.device_model?.trim() || current.deviceModel,
    ownerOrg: payload.owner_org?.trim() || current.ownerOrg,
    remark: applyRemark(payload.remark, current.remark),
    updatedAt: new Date().toISOString()
  };
  deviceCache.splice(index, 1, updated);
  persistDevices();
  return updated;
};

const resetDeviceSecret = (deviceId: string): DeviceEntity => {
  const index = deviceCache.findIndex((item) => item.id === deviceId);
  if (index === -1) {
    throw new Error('设备不存在');
  }
  const secret = generateBase32Secret(20);
  const updated: DeviceEntity = {
    ...deviceCache[index],
    secret,
    updatedAt: new Date().toISOString()
  };
  deviceCache.splice(index, 1, updated);
  persistDevices();
  return updated;
};

export const mockStorage = {
  findUserByUsername,
  getUserById,
  bindSession(token: string, userId: string) {
    sessionTokens.set(token, userId);
  },
  revokeSession(token: string) {
    sessionTokens.delete(token);
  },
  getSessionUser,
  ensureSession,
  ensureAdmin,
  listDevices(): DeviceEntity[] {
    return deviceCache.map((item) => ({ ...item }));
  },
  getDevice: findDeviceById,
  getDeviceBySn: findDeviceBySn,
  createDevice,
  updateDevice,
  resetDeviceSecret,
  toAdminDevice,
  toPublicDevice,
  toPublicDetail,
  toDetailResponse,
  toResetResponse
};
