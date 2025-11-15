<template>
  <a-table
    :columns="columns"
    :data="dataSource"
    :pagination="false"
    :bordered="false"
    :loading="loading"
    row-key="id"
    @expand="handleExpand"
  >
    <template #createdAt="{ record }">
      {{ formatDate(record.createdAt) }}
    </template>
    <template #updatedAt="{ record }">
      {{ formatDate(record.updatedAt) }}
    </template>
    <template #secret="{ record }">
      <a-space>
        <a-typography-text>{{ record.secretMasked || '—' }}</a-typography-text>
        <a-button
          v-if="record.otpAuthUrl"
          type="text"
          size="mini"
          @click="copyOtp(record.otpAuthUrl)"
        >
          复制二维码链接
        </a-button>
      </a-space>
    </template>
    <template #has2fa="{ record }">
      <a-tag :color="record.has2fa ? 'arcoblue' : 'gray'">
        {{ record.has2fa ? '已启用' : '未启用' }}
      </a-tag>
    </template>
    <template #actions="{ record }">
      <a-button type="text" size="mini" @click="handleReset(record.id)">
        重置二次验证
      </a-button>
    </template>
    <template #expandedRowRender="{ record }">
      <div class="qr-wrapper">
        <template v-if="record.otpAuthUrl && qrCodes[record.id]">
          <img :src="qrCodes[record.id]" :alt="`${record.deviceName} 的二维码`" />
          <div class="qr-meta">
            <p class="qr-title">{{ record.deviceName }}</p>
            <p class="qr-subtitle">{{ record.serialNumber }}</p>
            <p class="qr-tip">使用验证器扫描上方二维码</p>
          </div>
        </template>
        <template v-else>
          <a-empty description="暂无二维码信息，可能未启用二次验证" />
        </template>
      </div>
    </template>
    <template #empty>
      <a-empty description="暂无设备，请联系管理员添加" />
    </template>
  </a-table>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import type { TableColumnData } from '@arco-design/web-vue/es/table/interface';
import { Message } from '@arco-design/web-vue';
import QRCode from 'qrcode';
import type { DeviceRecord } from '@/store/device';

const props = defineProps<{
  devices: DeviceRecord[];
  loading?: boolean;
  isAdmin?: boolean;
  fetchTwoFactor?: (deviceId: string) => Promise<DeviceRecord | void>;
  onReset?: (deviceId: string) => Promise<void>;
}>();

const dataSource = computed(() => props.devices);
const loading = computed(() => props.loading ?? false);

const columns = computed<TableColumnData[]>(() => {
  const baseColumns: TableColumnData[] = [
    {
      title: '序列号',
      dataIndex: 'serialNumber',
      width: 220
    },
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      ellipsis: true
    },
    {
      title: '设备型号',
      dataIndex: 'deviceModel',
      width: 180
    },
    {
      title: '所属组织',
      dataIndex: 'ownerOrg',
      width: 180
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      render: ({ record }) => record.remark || '—'
    }
  ];

  if (props.isAdmin) {
    baseColumns.push(
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        slotName: 'createdAt',
        width: 180
      },
      {
        title: '最近更新',
        dataIndex: 'updatedAt',
        slotName: 'updatedAt',
        width: 180
      },
      {
        title: '当前密钥',
        dataIndex: 'secretMasked',
        slotName: 'secret',
        width: 220
      },
      {
        title: '操作',
        dataIndex: 'actions',
        slotName: 'actions',
        width: 140,
        align: 'center'
      }
    );
  } else {
    baseColumns.push({
      title: '2FA 状态',
      dataIndex: 'has2fa',
      slotName: 'has2fa',
      width: 120,
      align: 'center'
    });
  }

  return baseColumns;
});

const qrCodes = reactive<Record<string, string>>({});

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

const generateQr = async (record: DeviceRecord) => {
  if (qrCodes[record.id]) return;
  if (!record.otpAuthUrl) return;
  try {
    qrCodes[record.id] = await QRCode.toDataURL(record.otpAuthUrl, {
      margin: 1,
      scale: 6
    });
  } catch (error) {
    console.error('二维码生成失败', error);
    Message.error('二维码生成失败，请刷新页面重试');
  }
};

const handleExpand = async (
  rowKey: string | number,
  expanded: boolean,
  record: DeviceRecord
) => {
  if (!expanded) return;
  try {
    if (props.fetchTwoFactor) {
      await props.fetchTwoFactor(record.id);
    }
    if (!record.otpAuthUrl) {
      Message.info('该设备尚未启用二次验证');
      return;
    }
    await generateQr(record);
  } catch (error) {
    if (error instanceof Error) {
      Message.error(error.message);
    } else {
      Message.error('加载二维码信息失败');
    }
  }
};

const handleReset = async (deviceId: string) => {
  if (!props.onReset) return;
  try {
    await props.onReset(deviceId);
    Message.success('二次验证已重置');
    qrCodes[deviceId] = '';
  } catch (error) {
    if (error instanceof Error) {
      Message.error(error.message);
    } else {
      Message.error('重置失败，请稍后重试');
    }
  }
};

const copyOtp = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    Message.success('二维码链接已复制');
  } catch (error) {
    console.warn('复制失败', error);
    Message.warning('复制失败，请手动复制');
  }
};
</script>

<style scoped>
.qr-wrapper {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  align-items: center;
  min-height: 160px;
}

.qr-wrapper img {
  width: 160px;
  height: 160px;
  border: 12px solid #fff;
  box-shadow: 0 12px 24px rgba(22, 93, 255, 0.15);
  border-radius: 12px;
}

.qr-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qr-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.qr-subtitle {
  margin: 0;
  color: #4e5969;
}

.qr-tip {
  margin: 0;
  color: #86909c;
  font-size: 12px;
}
</style>
