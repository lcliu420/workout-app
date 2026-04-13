# 健身 App

一个基于 `React + Vite + Express + Supabase` 的训练管理系统。

## 目录结构

- `frontend/`
  React 前端，负责登录、训练计划编辑、训练历史查看、个人资料维护。
- `backend/`
  Express + TypeScript 后端，负责认证校验、业务 API、Supabase 数据写入与读取。
- `backend/supabase/schema.sql`
  Supabase 数据库初始化脚本。

## 当前架构

- 前端只通过 `/api` 调后端，不再直接操作数据库。
- 后端统一负责：
  用户注册与登录
  用户资料更新
  当前周训练计划保存
  历史训练记录读取
- Supabase 负责：
  Auth 用户认证
  Profiles 用户资料表
  Training Weeks / Sessions / Exercises 训练业务表

## 初始化 Supabase

1. 在 Supabase 创建一个项目。
2. 打开 SQL Editor，执行 [backend/supabase/schema.sql](/c:/Users/lcliu/Desktop/code/git/健身app/backend/supabase/schema.sql:1)。
3. 在项目设置中获取：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 配置环境变量

后端：

1. 复制 `backend/.env.example` 为 `backend/.env`
2. 填入你的 Supabase 配置

前端：

1. 复制 `frontend/.env.example` 为 `frontend/.env.local`
2. 默认本地后端地址为 `http://127.0.0.1:4000/api`

## 本地启动

启动后端：

```powershell
cd backend
npm install
npm run dev
```

启动前端：

```powershell
cd frontend
npm install
npm run dev
```

默认地址：

- 前端：`http://127.0.0.1:3000`
- 后端健康检查：`http://127.0.0.1:4000/api/health`

## 已完成的核心能力

- 邮箱注册 / 登录
- 登录状态持久化
- 训练周、训练课、训练动作的数据建模
- 当前周训练计划编辑与云端保存
- 历史训练记录拉取与 Excel 导出
- 个人资料维护

## 校验状态

- `backend`: `npm run lint` 通过，`npm run build` 通过
- `frontend`: `npm run lint` 通过
- `frontend`: `npm run build` 在当前沙箱环境里被 `esbuild` 子进程权限限制拦住，不是代码层 TypeScript 错误
