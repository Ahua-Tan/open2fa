import type { UserRole } from '@/types/auth';

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

export interface SessionUser {
  id: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface DeviceEntity {
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
