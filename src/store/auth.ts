import { defineStore } from 'pinia';
import { mockApi } from '@/services/mockApi';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

interface AuthState {
  token: string | null;
  currentUser: AuthUser | null;
  initialized: boolean;
}

const TOKEN_STORAGE_KEY = 'open2fa:auth-token';
const USER_STORAGE_KEY = 'open2fa:auth-user';

const readToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
};

const readUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = sessionStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch (error) {
    console.warn('会话用户信息已损坏，即将清除', error);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

const persistSession = (token: string, user: AuthUser) => {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

const clearSessionStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
};

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: readToken(),
    currentUser: readUser(),
    initialized: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.currentUser),
    isAdmin: (state) => state.currentUser?.role === 'admin'
  },
  actions: {
    async restoreSession() {
      if (this.initialized) return;
      if (!this.token) {
        this.initialized = true;
        return;
      }
      try {
        const { user } = await mockApi.profile(this.token);
        this.currentUser = {
          id: user.user_id,
          username: user.username,
          role: user.role
        };
        persistSession(this.token, this.currentUser);
      } catch (error) {
        console.warn('登录会话已失效，将重新登录', error);
        this.clearSession();
      } finally {
        this.initialized = true;
      }
    },
    async login(username: string, password: string) {
      const { token } = await mockApi.login(username, password);
      const { user } = await mockApi.profile(token);
      const authUser: AuthUser = {
        id: user.user_id,
        username: user.username,
        role: user.role
      };
      this.token = token;
      this.currentUser = authUser;
      persistSession(token, authUser);
    },
    async logout() {
      if (this.token) {
        try {
          await mockApi.logout(this.token);
        } catch (error) {
          console.warn('注销时出现异常，将强制清除会话', error);
        }
      }
      this.clearSession();
    },
    clearSession() {
      this.token = null;
      this.currentUser = null;
      clearSessionStorage();
    }
  }
});
