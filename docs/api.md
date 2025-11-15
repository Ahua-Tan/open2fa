# Open2FA 接口文档

本文档梳理了 Open2FA 示例后端的 RESTful 接口，覆盖用户登录、设备管理以及普通用户访问设备 2FA 信息的场景，供前端联调与产品验收参考。

## 1. 用户与登录接口

### 1.1 用户登录
- **方法**：`POST`
- **URL**：`/api/v1/auth/login`
- **请求参数**：`username`，`password`
- **响应参数**：
  - `success`：布尔值，登录是否成功
  - `token`：访问令牌，用于后续接口的身份认证
  - `role`：`admin` / `user`

### 1.2 获取当前用户信息
- **方法**：`GET`
- **URL**：`/api/v1/auth/profile`
- **认证方式**：`Authorization: Bearer {token}`
- **响应参数**：`user_id`，`username`，`role`

### 1.3 用户登出
- **方法**：`POST`
- **URL**：`/api/v1/auth/logout`
- **响应参数**：`success`

## 2. 设备管理接口（管理员）

### 2.1 创建设备（生成 2FA）
- **方法**：`POST`
- **URL**：`/api/v1/devices`
- **请求参数**：`device_sn`，`device_model`，`device_name`，`owner_org`
- **响应参数**：
  - `device_id`
  - `device_sn`
  - `device_model`
  - `secret_masked`
  - `otpauth_url`

### 2.2 更新设备信息
- **方法**：`PUT`
- **URL**：`/api/v1/devices/{device_id}`
- **请求参数**：`device_name`，`device_model`，`owner_org`，`remark`
- **响应参数**：`success`

### 2.3 重置设备 2FA
- **方法**：`POST`
- **URL**：`/api/v1/devices/{device_id}/reset-2fa`
- **请求参数**：`reason`（可选）
- **响应参数**：`success`，`secret_masked`，`otpauth_url`

### 2.4 查询设备列表
- **方法**：`GET`
- **URL**：`/api/v1/devices`
- **查询参数**：`device_sn` / `device_model` / `owner_org` / `page` / `page_size`
- **响应参数**：`devices[]`

### 2.5 查看设备详情
- **方法**：`GET`
- **URL**：`/api/v1/devices/{device_id}`
- **响应参数**：设备基础信息，必要时可返回 `secret_masked` 与 `otpauth_url`

## 3. 普通用户设备接口（查看 2FA）

### 3.1 根据序列号查询设备
- **方法**：`GET`
- **URL**：`/api/v1/public/devices/by-sn`
- **查询参数**：`device_sn`
- **响应参数**：`device_id`，`device_sn`，`device_model`，`device_name`，`owner_org`，`has_2fa`

### 3.2 获取设备 2FA 信息
- **方法**：`GET`
- **URL**：`/api/v1/public/devices/{device_id}/2fa`
- **响应参数**：`device_sn`，`device_model`，`device_name`，`otpauth_url`，`secret_masked`

### 3.3 获取用户可见设备列表（可选）
- **方法**：`GET`
- **URL**：`/api/v1/public/devices`
- **响应参数**：`devices[]`

## 4. 2FA 信息格式说明

`otpauth_url` 示例：

```
otpauth://totp/{issuer}:{label}?secret={SECRET}&issuer={issuer}&period=30&digits=6
```

前端处理建议：
- 直接使用 `otpauth_url` 生成二维码展示。
- 前端无需解析或存储 `SECRET` 明文。
- `secret_masked` 仅用于人工核对。
