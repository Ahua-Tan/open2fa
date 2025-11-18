<template>
  <a-modal
    :visible="modelValue"
    :confirm-loading="loading"
    title="添加离线设备"
    ok-text="生成二维码"
    @ok="handleOk"
    @cancel="handleCancel"
    unmount-on-close
  >
    <a-form ref="formRef" :model="form" layout="vertical">
      <a-form-item
        field="serialNumber"
        label="设备唯一序列号"
        :rules="[
          { required: true, message: '请输入设备序列号' },
          { match: /^[A-Za-z0-9-]{6,}$/u, message: '序列号需至少6位字符，可包含字母/数字/横杠' }
        ]"
      >
        <a-input v-model="form.serialNumber" placeholder="例如：SN-2025-0001" allow-clear />
      </a-form-item>
      <a-form-item
        field="deviceName"
        label="设备名称"
        :rules="[{ required: true, message: '请输入设备名称' }]"
      >
        <a-input v-model="form.deviceName" placeholder="如：分支机构 VPN 网关" allow-clear />
      </a-form-item>
      <a-form-item
        field="deviceModel"
        label="设备型号"
        :rules="[{ required: true, message: '请输入设备型号' }]"
      >
        <a-input v-model="form.deviceModel" placeholder="如：Secure Gateway X" allow-clear />
      </a-form-item>
      <a-form-item
        field="ownerOrg"
        label="所属组织"
        :rules="[{ required: true, message: '请输入所属组织' }]"
      >
        <a-input v-model="form.ownerOrg" placeholder="如：信息安全部" allow-clear />
      </a-form-item>
      <a-form-item field="remark" label="备注信息">
        <a-textarea
          v-model="form.remark"
          placeholder="可选，用于记录安装位置、用途等"
          :max-length="120"
          show-word-limit
          allow-clear
        />
      </a-form-item>
      <a-alert type="info" show-icon>
        序列号将作为动态密码生成依据，请确保填写真实且唯一的设备编号。
      </a-alert>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { FormInstance } from '@arco-design/web-vue';

const props = defineProps<{ modelValue: boolean; loading?: boolean }>();
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (
    event: 'submit',
    payload: {
      serialNumber: string;
      deviceName: string;
      deviceModel: string;
      ownerOrg: string;
      remark?: string;
    }
  ): void;
}>();

const formRef = ref<FormInstance>();
const form = reactive({
  serialNumber: '',
  deviceName: '',
  deviceModel: '',
  ownerOrg: '',
  remark: ''
});

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      form.serialNumber = '';
      form.deviceName = '';
      form.deviceModel = '';
      form.ownerOrg = '';
      form.remark = '';
      formRef.value?.clearValidate?.();
    }
  }
);

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleOk = async () => {
  await formRef.value?.validate();
  emit('submit', {
    serialNumber: form.serialNumber,
    deviceName: form.deviceName,
    deviceModel: form.deviceModel,
    ownerOrg: form.ownerOrg,
    remark: form.remark
  });
};
</script>
