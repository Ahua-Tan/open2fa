import type {
  DeviceCreatePayload,
  DeviceDetailResponse,
  DeviceListResponse,
  DeviceResetResponse,
  DeviceUpdatePayload,
  LogoutResponse
} from './types';
import { mockStorage } from './storage';
import { waitRandom } from './utils';

export interface DeviceListFilters {
  device_sn?: string;
  device_model?: string;
  owner_org?: string;
}

export const listDevices = async (
  token: string,
  filters?: DeviceListFilters
): Promise<DeviceListResponse> => {
  await waitRandom();
  mockStorage.ensureAdmin(token);
  let devices = mockStorage.listDevices();
  if (filters?.device_sn) {
    const sn = filters.device_sn.trim().toUpperCase();
    devices = devices.filter((item) => item.deviceSn.includes(sn));
  }
  if (filters?.device_model) {
    const model = filters.device_model.trim().toLowerCase();
    devices = devices.filter((item) => item.deviceModel.toLowerCase().includes(model));
  }
  if (filters?.owner_org) {
    const owner = filters.owner_org.trim().toLowerCase();
    devices = devices.filter((item) => item.ownerOrg.toLowerCase().includes(owner));
  }
  return {
    success: true,
    devices: devices.map((item) => mockStorage.toAdminDevice(item))
  };
};

export const getDevice = async (
  token: string,
  deviceId: string
): Promise<DeviceDetailResponse> => {
  await waitRandom();
  mockStorage.ensureAdmin(token);
  const device = mockStorage.getDevice(deviceId);
  if (!device) {
    throw new Error('设备不存在');
  }
  return mockStorage.toDetailResponse(device);
};

export const createDevice = async (
  token: string,
  payload: DeviceCreatePayload
): Promise<DeviceDetailResponse> => {
  await waitRandom();
  mockStorage.ensureAdmin(token);
  const device = mockStorage.createDevice(payload);
  return mockStorage.toDetailResponse(device);
};

export const updateDevice = async (
  token: string,
  deviceId: string,
  payload: DeviceUpdatePayload
): Promise<LogoutResponse> => {
  await waitRandom();
  mockStorage.ensureAdmin(token);
  mockStorage.updateDevice(deviceId, payload);
  return { success: true };
};

export const resetDevice2fa = async (
  token: string,
  deviceId: string
): Promise<DeviceResetResponse> => {
  await waitRandom();
  mockStorage.ensureAdmin(token);
  const device = mockStorage.resetDeviceSecret(deviceId);
  return mockStorage.toResetResponse(device);
};
