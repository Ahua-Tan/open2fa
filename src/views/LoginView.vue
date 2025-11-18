<template>
  <div class="login-wrapper">
    <a-card class="login-card" :bordered="false" hoverable>
      <template #title>
        <div class="card-title">
          <span>Open2FA 控制台</span>
          <a-tag color="arcoblue" size="small">v1.0.0</a-tag>
        </div>
      </template>
      <a-form ref="formRef" :model="form" layout="vertical" @submit.prevent="handleSubmit">
        <a-form-item
          field="username"
          label="用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input v-model="form.username" placeholder="例如：admin 或 user" />
        </a-form-item>
        <a-form-item
          field="password"
          label="密码"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password v-model="form.password" placeholder="请输入密码" allow-clear />
        </a-form-item>
        <a-alert v-if="errorMessage" type="error" class="alert" show-icon>
          {{ errorMessage }}
        </a-alert>
        <a-space direction="vertical" fill>
          <a-button type="primary" html-type="submit" long :loading="loading">
            登录
          </a-button>
          <a-typography-text type="secondary" class="helper-text">
            超级管理员：admin / admin123 ，普通用户：user / user123
          </a-typography-text>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance } from '@arco-design/web-vue';
import { Message } from '@arco-design/web-vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth';

interface LoginForm {
  username: string;
  password: string;
}

const formRef = ref<FormInstance>();
const form = reactive<LoginForm>({
  username: '',
  password: ''
});
const loading = ref(false);
const errorMessage = ref('');

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const handleSubmit = async () => {
  if (loading.value) return;
  errorMessage.value = '';
  try {
    loading.value = true;
    await formRef.value?.validate();
    await authStore.login(form.username, form.password);
    Message.success(`欢迎回来，${authStore.currentUser?.username}`);
    const redirect = (route.query.redirect as string) || '/';
    router.replace(redirect);
  } catch (error) {
    if (error && typeof error === 'object' && 'errorFields' in error) {
      return;
    }
    if (error instanceof Error && error.message) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = '登录失败，请重试';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #ebf1ff 0%, #f7f8fb 45%, #eef3ff 100%);
  padding: 24px;
}

.login-card {
  width: 380px;
  box-shadow: 0 22px 48px -18px rgba(22, 93, 255, 0.35);
  border-radius: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
  font-weight: 600;
}

.alert {
  margin-bottom: 12px;
}

.helper-text {
  text-align: center;
}
</style>
