<template>
  <section class="device-page">
    <a-space direction="vertical" size="large" class="page-body" fill>
      <a-card class="summary-card" :bordered="false">
        <template #title>
          <a-space align="center">
            <IconApps />
            <span>平台概览</span>
          </a-space>
        </template>
        <a-grid :row-gap="16" :col-gap="16" :cols="{ xs: 1, sm: 2, md: 2, lg: 4 }">
          <a-grid-item>
            <a-statistic :value="deviceStore.total" title="设备数量" animation />
          </a-grid-item>
          <a-grid-item>
            <a-statistic :value="permissionLabel" title="当前权限" animation />
          </a-grid-item>
          <a-grid-item>
            <a-statistic :value="recentSerial" title="最新设备" animation />
          </a-grid-item>
          <a-grid-item>
            <a-statistic :value="formattedTime" title="当前时间" animation />
          </a-grid-item>
        </a-grid>
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
            新建设备
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
  </section>
  <AddDeviceModal
    v-if="authStore.isAdmin"
    v-model="showAddModal"
    :loading="creating"
    @submit="handleCreate"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { IconApps, IconPlus, IconScan } from '@arco-design/web-vue/es/icon';
import DeviceTable from '@/components/DeviceTable.vue';
import AddDeviceModal from '@/components/AddDeviceModal.vue';
import { useAuthStore } from '@/store/auth';
import { useDeviceStore } from '@/store/device';

const authStore = useAuthStore();
const deviceStore = useDeviceStore();

const showAddModal = ref(false);
const creating = ref(false);

const permissionLabel = computed(() => (authStore.isAdmin ? '添加 + 查询 + 重置' : '仅查询'));
const recentSerial = computed(() => deviceStore.devices[0]?.serialNumber || '—');
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
.device-page {
  width: 100%;
}

.page-body {
  width: 100%;
}

.summary-card {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.table-card {
  box-shadow: 0 12px 32px rgba(22, 93, 255, 0.08);
}

.tip {
  margin-bottom: 12px;
}
</style>
