<template>
  <a-layout class="dashboard-layout">
    <a-layout-sider
      class="dashboard-sider"
      :collapsed="collapsed"
      collapsible
      breakpoint="lg"
      :width="220"
      :collapsed-width="64"
      @collapse="collapsed = $event"
    >
      <div class="sider-logo">
        <slot name="logo">
          <span class="logo-text">Open2FA</span>
        </slot>
      </div>
      <a-menu :selected-keys="[activeKey]" :collapsed="collapsed" @menu-item-click="handleMenuClick">
        <a-menu-item v-for="item in resolvedMenuItems" :key="item.key">
          <a-space align="center" :size="collapsed ? 0 : 8">
            <component :is="item.icon" v-if="item.icon" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </a-space>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="dashboard-header">
        <div class="header-left">
          <slot name="title">
            <a-space align="center">
              <IconApps />
              <span class="header-title">{{ title }}</span>
            </a-space>
          </slot>
        </div>
        <div class="header-right">
          <slot name="actions" />
        </div>
      </a-layout-header>
      <a-layout-content class="dashboard-content">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Component } from 'vue';
import { IconApps } from '@arco-design/web-vue/es/icon';

export interface DashboardMenuItem {
  key: string;
  label: string;
  icon?: Component;
}

interface Props {
  title?: string;
  selectedKey?: string;
  menuItems?: DashboardMenuItem[];
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Open2FA 控制台',
  selectedKey: ''
});

const emit = defineEmits<{
  (event: 'select', key: string): void;
}>();

const collapsed = ref(false);

const resolvedMenuItems = computed<DashboardMenuItem[]>(() => {
  if (props.menuItems?.length) {
    return props.menuItems;
  }
  return [
    {
      key: 'dashboard',
      label: '控制面板',
      icon: IconApps
    }
  ];
});

const activeKey = computed(() => props.selectedKey || resolvedMenuItems.value[0]?.key || '');

const handleMenuClick = (key: string) => {
  emit('select', key);
};
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
}

.dashboard-sider {
  background: #0e1c4d;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding-top: 12px;
}

.sider-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  color: #fff;
}

.logo-text {
  letter-spacing: 0.08em;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 12px rgba(15, 23, 42, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.dashboard-content {
  padding: 24px 32px 40px;
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
}

:deep(.arco-menu) {
  background: transparent;
  border: none;
}

:deep(.arco-menu-item) {
  color: rgba(255, 255, 255, 0.85);
}

:deep(.arco-menu-item.arco-menu-selected) {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}
</style>
