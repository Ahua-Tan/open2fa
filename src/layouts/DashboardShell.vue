<template>
  <DashboardLayout
    :selected-key="activeMenuKey"
    :menu-items="menuItems"
    :title="currentTitle"
    @select="handleMenuSelect"
  >
    <template #logo>
      <div class="logo-box">
        <a-avatar shape="square" :size="40">2F</a-avatar>
      </div>
    </template>
    <template #title>
      <a-space align="center" size="small">
        <IconApps />
        <div class="header-text">
          <span class="header-title">{{ currentTitle }}</span>
          <span class="header-subtitle">{{ currentSubtitle }}</span>
        </div>
      </a-space>
    </template>
    <template #actions>
      <a-space align="center" size="small">
        <a-tag :color="authStore.isAdmin ? 'gold' : 'lime'">
          {{ authStore.isAdmin ? '超级管理员' : '普通用户' }}
        </a-tag>
        <a-divider direction="vertical" />
        <a-typography-text>{{ authStore.currentUser?.username }}</a-typography-text>
        <a-button type="text" size="small" @click="handleLogout">退出登录</a-button>
      </a-space>
    </template>
    <RouterView />
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { IconApps, IconScan } from '@arco-design/web-vue/es/icon';
import DashboardLayout, { type DashboardMenuItem } from './DashboardLayout.vue';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const menuItems: DashboardMenuItem[] = [
  { key: 'devices', label: '离线设备', icon: IconScan }
];

const currentTitle = computed(() => (route.meta.title as string) || 'Open2FA 控制台');
const currentSubtitle = computed(() => (route.meta.subtitle as string) || 'Open2FA 配置中心');
const activeMenuKey = computed(() => (route.meta.menuKey as string) || (route.name?.toString() ?? ''));

const handleMenuSelect = async (key: string) => {
  if (key === 'devices') {
    if (route.name !== 'devices') {
      await router.push({ name: 'devices' });
    }
    return;
  }
  Message.info('暂未开通该功能');
};

const handleLogout = async () => {
  await authStore.logout();
  router.replace({ name: 'login' });
};
</script>

<style scoped>
.logo-box {
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.header-subtitle {
  font-size: 12px;
  color: #4e5969;
}
</style>
