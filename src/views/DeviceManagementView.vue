<template>
  <a-layout class="app-layout">
    <a-layout-header class="header">
      <div class="header-brand">
        <a-space align="center" size="medium">
          <a-avatar shape="square" :size="36">2F</a-avatar>
          <div>
            <div class="brand-title">Open2FA 配置中心</div>
            <div class="brand-subtitle">统一管理离线设备的二次验证</div>
          </div>
        </a-space>
      </div>
      <div class="header-actions">
        <a-space align="center" size="small">
          <a-tag v-if="authStore.isAdmin" color="gold">超级管理员</a-tag>
          <a-tag v-else color="lime">普通用户</a-tag>
          <a-divider direction="vertical" />
          <a-typography-text>{{ authStore.currentUser?.username }}</a-typography-text>
          <a-button type="text" size="small" @click="handleLogout">退出登录</a-button>
        </a-space>
      </div>
    </a-layout-header>
    <a-layout-content class="content">
      <div class="page-inner">
        <a-space direction="vertical" size="large" fill>
          <a-card :bordered="false" class="summary-card">
            <template #title>
              <a-space align="center">
                <IconApps />
                <span>平台概览</span>
              </a-space>
            </template>
            <a-row :gutter="24">
              <a-col :xs="12" :md="8" :lg="6">
                <a-statistic :value="deviceStore.total" title="设备数量" animation />
              </a-col>
              <a-col :xs="12" :md="8" :lg="6">
                <a-statistic :value="permissionLabel" title="当前权限" animation />
              </a-col>
              <a-col :xs="12" :md="8" :lg="6">
                <a-statistic
                  :value="deviceStore.devices[0]?.serialNumber || '—'"
                  title="最新添加设备"
                  animation
                />
              </a-col>
              <a-col :xs="12" :md="8" :lg="6">
                <a-statistic :value="formattedTime" title="当前时间" animation />
              </a-col>
            </a-row>
          </a-card>

          <a-card class="table-card" :bordered="false">
            <template #title>
              <a-space>
                <IconScan />
                <span>设备二维码列表</span>
              </a-space>
            </template>
            <template v-if="authStore.isAdmin" #extra>
              <a-button type="primary" @click="showAddModal = true">
                <template #icon>
                  <IconPlus />
                </template>
                添加设备
              </a-button>
            </template>
            <a-alert v-if="!authStore.isAdmin" type="info" class="tip" show-icon>
              您当前为普通用户，可查看所有离线设备的二次验证信息，若需新增或重置请联系超级管理员。
            </a-alert>
            <DeviceTable
              :devices="deviceStore.devices"
              :loading="deviceStore.loading"
              :is-admin="authStore.isAdmin"
              :fetch-two-factor="handleFetchTwoFactor"
              :on-reset="authStore.isAdmin ? handleReset : undefined"
            />
          </a-card>
        </a-space>
      </div>
    </a-layout-content>
  </a-layout>
  <AddDeviceModal
    v-if="authStore.isAdmin"
    v-model="showAddModal"
    :loading="creating"
    @submit="handleCreate"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { IconApps, IconPlus, IconScan } from '@arco-design/web-vue/es/icon';
import DeviceTable from '@/components/DeviceTable.vue';
import AddDeviceModal from '@/components/AddDeviceModal.vue';
import { useAuthStore } from '@/store/auth';
import { useDeviceStore } from '@/store/device';

const authStore = useAuthStore();
const deviceStore = useDeviceStore();
const router = useRouter();

const showAddModal = ref(false);
const creating = ref(false);

const permissionLabel = computed(() => (authStore.isAdmin ? '添加 + 查询 + 重置' : '仅查询'));
const formattedTime = computed(() => {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
});

onMounted(async () => {
  if (!authStore.initialized) {
    await authStore.restoreSession();
  }
  await deviceStore.fetchDevices();
});

watch(
  () => authStore.isAdmin,
  async () => {
    await deviceStore.fetchDevices();
  }
);

const handleLogout = async () => {
  await authStore.logout();
  router.replace({ name: 'login' });
};

const handleCreate = async ({
  serialNumber,
  deviceName,
  deviceModel,
  ownerOrg,
  remark
}: {
  serialNumber: string;
  deviceName: string;
  deviceModel: string;
  ownerOrg: string;
  remark?: string;
}) => {
  if (!authStore.isAdmin) {
    Message.warning('仅超级管理员可以添加设备');
    return;
  }
  try {
    creating.value = true;
    const device = await deviceStore.createDevice({
      deviceSn: serialNumber,
      deviceModel,
      deviceName,
      ownerOrg,
      remark
    });
    Message.success(`设备 ${device.device_sn} 创建成功`);
    showAddModal.value = false;
  } catch (error) {
    if (error instanceof Error && error.message) {
      Message.error(error.message);
    } else {
      Message.error('添加设备失败，请稍后重试');
    }
  } finally {
    creating.value = false;
  }
};

const handleFetchTwoFactor = async (deviceId: string) => {
  await deviceStore.ensureTwoFactor(deviceId);
};

const handleReset = async (deviceId: string) => {
  try {
    const result = await deviceStore.resetDevice(deviceId);
    Message.success(`已重置，新的密钥：${result.secret_masked}`);
  } catch (error) {
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error('重置失败，请稍后重试');
  }
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 16px rgba(15, 23, 42, 0.08);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-title {
  font-size: 18px;
  font-weight: 600;
}

.brand-subtitle {
  font-size: 12px;
  color: #86909c;
}

.header-actions {
  display: flex;
  align-items: center;
}

.content {
  padding: 32px;
  background: linear-gradient(180deg, #f4f7ff 0%, rgba(244, 247, 255, 0) 100%);
}

.page-inner {
  max-width: 1080px;
  margin: 0 auto;
}

.summary-card {
  border-radius: 16px;
  box-shadow: 0 20px 48px -32px rgba(22, 93, 255, 0.45);
}

.table-card {
  border-radius: 16px;
}

.tip {
  margin-bottom: 16px;
}
</style>
