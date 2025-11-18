import { defineStore } from 'pinia';
import {
  mockApi,
  type DeviceCreatePayload,
  type DeviceListItem,
  type PublicDeviceListItem
} from '@/services/mock';
import { useAuthStore } from './auth';

export interface DeviceRecord {
  id: string;
  serialNumber: string;
  deviceModel: string;
  deviceName: string;
  ownerOrg: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  secretMasked?: string;
  otpAuthUrl?: string;
  has2fa?: boolean;
}

export interface DeviceCreateForm {
  deviceSn: string;
  deviceModel: string;
  deviceName: string;
  ownerOrg: string;
  remark?: string;
}

const mapAdminDevice = (device: DeviceListItem): DeviceRecord => ({
  id: device.device_id,
  serialNumber: device.device_sn,
  deviceModel: device.device_model,
  deviceName: device.device_name,
  ownerOrg: device.owner_org,
  remark: device.remark,
  createdAt: device.created_at,
  updatedAt: device.updated_at,
  secretMasked: device.secret_masked,
  otpAuthUrl: device.otpauth_url,
  has2fa: true
});

const mapPublicDevice = (item: PublicDeviceListItem): DeviceRecord => ({
  id: item.device_id,
  serialNumber: item.device_sn,
  deviceModel: item.device_model,
  deviceName: item.device_name,
  ownerOrg: item.owner_org,
  has2fa: item.has_2fa
});

export const useDeviceStore = defineStore('devices', {
  state: () => ({
    devices: [] as DeviceRecord[],
    loading: false
  }),
  getters: {
    total: (state) => state.devices.length
  },
  actions: {
    async fetchDevices() {
      this.loading = true;
      const authStore = useAuthStore();
      try {
        if (authStore.isAdmin && authStore.token) {
          const { devices } = await mockApi.listDevices(authStore.token);
          this.devices = devices.map(mapAdminDevice);
        } else {
          const response = await mockApi.publicListDevices();
          this.devices = response.devices.map((item) => mapPublicDevice(item));
        }
      } finally {
        this.loading = false;
      }
    },
    async createDevice(payload: DeviceCreateForm) {
      const authStore = useAuthStore();
      if (!authStore.isAdmin || !authStore.token) {
        throw new Error('仅超级管理员可以添加设备');
      }
      const request: DeviceCreatePayload = {
        device_sn: payload.deviceSn,
        device_model: payload.deviceModel,
        device_name: payload.deviceName,
        owner_org: payload.ownerOrg,
        remark: payload.remark
      };
      const { device } = await mockApi.createDevice(authStore.token, request);
      this.devices = [mapAdminDevice(device), ...this.devices];
      return device;
    },
    async resetDevice(deviceId: string) {
      const authStore = useAuthStore();
      if (!authStore.isAdmin || !authStore.token) {
        throw new Error('仅超级管理员可以重置二次验证');
      }
      const resetResult = await mockApi.resetDevice2fa(authStore.token, deviceId);
      const target = this.devices.find((item) => item.id === deviceId);
      if (target) {
        target.secretMasked = resetResult.secret_masked;
        target.otpAuthUrl = resetResult.otpauth_url;
        target.has2fa = true;
      }
      return resetResult;
    },
    async ensureTwoFactor(deviceId: string) {
      const existing = this.devices.find((item) => item.id === deviceId);
      if (!existing) {
        throw new Error('设备不存在');
      }
      if (existing.otpAuthUrl && existing.secretMasked) {
        return existing;
      }
      const authStore = useAuthStore();
      if (authStore.isAdmin && authStore.token) {
        const { device } = await mockApi.getDevice(authStore.token, deviceId);
        Object.assign(existing, mapAdminDevice(device));
        return existing;
      }
      const { device } = await mockApi.publicGetDevice2fa(deviceId);
      existing.secretMasked = device.secret_masked;
      existing.otpAuthUrl = device.otpauth_url;
      existing.has2fa = device.has_2fa;
      return existing;
    }
  }
});
