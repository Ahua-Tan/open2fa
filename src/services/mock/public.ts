import type {
  PublicDeviceDetailResponse,
  PublicDeviceListResponse
} from './types';
import { mockStorage } from './storage';
import { waitRandom } from './utils';

export const listPublicDevices = async (): Promise<PublicDeviceListResponse> => {
  await waitRandom();
  return {
    success: true,
    devices: mockStorage.listDevices().map((item) => mockStorage.toPublicDevice(item))
  };
};

export const getDeviceBySn = async (
  deviceSn: string
): Promise<PublicDeviceDetailResponse> => {
  await waitRandom();
  const device = mockStorage.getDeviceBySn(deviceSn);
  if (!device) {
    throw new Error('未找到对应设备');
  }
  return {
    success: true,
    device: mockStorage.toPublicDetail(device)
  };
};

export const getDevice2fa = async (deviceId: string): Promise<PublicDeviceDetailResponse> => {
  await waitRandom();
  const device = mockStorage.getDevice(deviceId);
  if (!device) {
    throw new Error('未找到对应设备');
  }
  return {
    success: true,
    device: mockStorage.toPublicDetail(device)
  };
};
