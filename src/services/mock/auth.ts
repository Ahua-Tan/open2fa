import type { LoginResponse, LogoutResponse, ProfileResponse } from './types';
import { mockStorage } from './storage';
import { createToken, waitRandom } from './utils';

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  await waitRandom();
  const user = mockStorage.findUserByUsername(username);
  if (!user || user.password !== password) {
    throw new Error('用户名或密码错误');
  }
  const token = createToken();
  mockStorage.bindSession(token, user.id);
  return {
    success: true,
    token,
    role: user.role
  };
};

export const profile = async (token: string): Promise<ProfileResponse> => {
  await waitRandom();
  const user = mockStorage.getSessionUser(token);
  if (!user) {
    throw new Error('身份验证失败');
  }
  return {
    success: true,
    user: {
      user_id: user.id,
      username: user.username,
      role: user.role
    }
  };
};

export const logout = async (token: string): Promise<LogoutResponse> => {
  await waitRandom();
  mockStorage.revokeSession(token);
  return { success: true };
};
