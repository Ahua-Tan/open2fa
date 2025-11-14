<template>
  <a-table
    :columns="columns"
    :data="dataSource"
    :pagination="false"
    :bordered="false"
    row-key="id"
    @expand="handleExpand"
  >
    <template #createdAt="{ record }">
      {{ formatDate(record.createdAt) }}
    </template>
    <template #secret="{ record }">
      <a-space>
        <a-typography-text copyable>{{ record.secret }}</a-typography-text>
        <a-button type="text" size="mini" @click="copyOtp(record.otpAuthUrl)">
          复制二维码链接
        </a-button>
      </a-space>
    </template>
    <template #expandedRowRender="{ record }">
      <div class="qr-wrapper">
        <img :src="qrCodes[record.id]" :alt="`${record.label} 的二维码`" />
        <div class="qr-meta">
          <p class="qr-title">{{ record.label }}</p>
          <p class="qr-subtitle">{{ record.serialNumber }}</p>
          <p class="qr-tip">使用微软或谷歌验证器扫描上方二维码</p>
        </div>
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

const props = defineProps<{ devices: DeviceRecord[] }>();

const dataSource = computed(() => props.devices);

const columns = computed<TableColumnData[]>(() => [
  {
    title: '序列号',
    dataIndex: 'serialNumber',
    width: 220
  },
  {
    title: '别名',
    dataIndex: 'label',
    ellipsis: true
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    slotName: 'createdAt',
    width: 180
  },
  {
    title: '密钥',
    dataIndex: 'secret',
    slotName: 'secret',
    width: 220
  }
]);

const qrCodes = reactive<Record<string, string>>({});

const formatDate = (value: string) => {
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
  await generateQr(record);
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
