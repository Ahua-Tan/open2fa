import { defineStore } from 'pinia';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  username: string;
  role: UserRole;
}

interface Credentials {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
}

const users: Credentials[] = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: '超级管理员'
  },
  {
    username: 'user',
    password: 'user123',
    role: 'user',
    displayName: '普通用户'
  }
];

const STORAGE_KEY = 'open2fa:auth-user';

const readUserFromStorage = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch (error) {
    console.warn('无法解析会话中的用户信息', error);
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: readUserFromStorage() as AuthUser | null
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.currentUser),
    isAdmin: (state) => state.currentUser?.role === 'admin'
  },
  actions: {
    login(username: string, password: string) {
      const matched = users.find(
        (item) => item.username === username.trim() && item.password === password
      );

      if (!matched) {
        throw new Error('用户名或密码错误');
      }

      const user: AuthUser = { username: matched.displayName, role: matched.role };
      this.currentUser = user;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      }
    },
    logout() {
      this.currentUser = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }
});
