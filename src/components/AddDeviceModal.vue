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
      <a-form-item field="label" label="设备别名">
        <a-input v-model="form.label" placeholder="便于识别的别名，可选" allow-clear />
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
  (event: 'submit', payload: { serialNumber: string; label?: string }): void;
}>();

const formRef = ref<FormInstance>();
const form = reactive({
  serialNumber: '',
  label: ''
});

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      form.serialNumber = '';
      form.label = '';
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
    label: form.label
  });
};
</script>
