import * as auth from './auth';
import * as devices from './devices';
import * as publicApi from './public';

export const mockApi = {
  login: auth.login,
  profile: auth.profile,
  logout: auth.logout,
  listDevices: devices.listDevices,
  getDevice: devices.getDevice,
  createDevice: devices.createDevice,
  updateDevice: devices.updateDevice,
  resetDevice2fa: devices.resetDevice2fa,
  publicListDevices: publicApi.listPublicDevices,
  publicGetDeviceBySn: publicApi.getDeviceBySn,
  publicGetDevice2fa: publicApi.getDevice2fa
};

export type MockApi = typeof mockApi;

export * from './types';
