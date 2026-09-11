# 贴吧社区后台管理（bbs-admin-web）

对接 **bbs-app-backend**（FastAPI + MySQL 原生 SQL）的 PC 端管理后台，用于管理贴吧社区的用户、板块、帖子与评论。

- 技术栈：**Vue 3 + Vite + Element Plus + Vue Router + Pinia + axios**
- **仅适配 PC 浏览器**：没有引入任何移动端适配（无 rem/vw 适配脚本），`index.html` 的 viewport 固定为 `width=1280`，页面最小宽度 1200px
- 表格 / 分页 / 弹窗 / 标签页全部使用 Element Plus 组件

## 目录结构

```
bbs-admin-web/
├── index.html                  # HTML 模板（PC viewport）
├── vite.config.js              # 别名 @ + dev 代理（/api、/uploads → 127.0.0.1:8000）
├── .env.development            # 开发环境：VITE_API_BASE=/api（走代理，天然同源）
├── .env.production             # 生产环境：可写后端完整地址
├── package.json
└── src/
    ├── main.js                 # 应用入口：Element Plus（中文语言包）+ 图标 + Pinia + Router
    ├── App.vue                 # 根组件（只放 router-view）
    ├── api/                    # ★ 接口层（每个模块一个文件）
    │   ├── request.js          # axios 统一封装：token 注入、统一响应体拆包、401 跳登录、404/405 标记
    │   ├── auth.js             # 登录 / 当前用户
    │   ├── admin.js            # 管理员账号管理（高级管理员，后端已提供）
    │   ├── user.js             # 用户管理（后端待提供）
    │   ├── bar.js              # 贴吧板块（新增可用；编辑/删除待提供）
    │   ├── post.js             # 帖子（全部可用）
    │   ├── comment.js          # 评论（按帖查看可用；全部列表/删除待提供）
    │   └── system.js           # 健康检查
    ├── stores/user.js          # Pinia：token + 用户信息 + 角色判断（isAdmin / isSuperAdmin）
    ├── router/index.js         # 路由 + 守卫（未登录 / 非管理员 / 非高级管理员）
    ├── layout/index.vue        # 后台布局：左侧菜单（按角色过滤）+ 顶栏（后端状态、角色、退出）
    ├── components/
    │   ├── AdminFormDialog.vue # 新增管理员弹窗
    │   ├── BarFormDialog.vue   # 贴吧新增/编辑弹窗
    │   └── PostDetailDialog.vue# 帖子详情弹窗（含图片预览）
    ├── views/
    │   ├── login/index.vue     # 管理员登录（管理员 / 高级管理员）
    │   ├── dashboard/index.vue # 概览（统计卡片、后端状态、最新帖子）
    │   ├── admins/index.vue    # ★ 管理员管理（仅高级管理员）
    │   ├── users/index.vue     # 用户管理
    │   ├── bars/index.vue      # 贴吧板块管理
    │   ├── posts/index.vue     # 帖子管理
    │   └── comments/index.vue  # 评论管理
    ├── utils/
    │   ├── auth.js             # token/用户信息本地存储
    │   ├── constants.js        # 角色/状态/排序等下拉与标签映射
    │   └── format.js           # 时间、数量、图片地址格式化
    └── styles/index.css        # 全局样式（PC 基线 + 复用容器类）
```

## 快速开始

```bat
:: 1. 先启动后端（另一个终端）
cd /d d:\项目\bbs-app-backend
.venv\Scripts\python.exe main.py            :: http://127.0.0.1:8000

:: 2. 启动本后台
cd /d d:\项目\bbs-admin-web
npm install                                  :: 国内网络可加 --registry=https://registry.npmmirror.com
npm run dev                                  :: http://127.0.0.1:5180（默认端口，可在 vite.config.js 改）

:: 3. 打包预览（可选）
npm run build
npm run preview                              :: http://127.0.0.1:5181
```

演示账号（三种角色）：
- **superadmin / super123456** —— 高级管理员：登录后左侧会多出「**管理员管理**」菜单，可新增/禁用/改角色/重置密码/撤销管理员。
- **admin / admin123456** —— 普通管理员：能管理贴吧、帖子、评论，但看不到也打不开「管理员管理」。
- **demo / demo123456** —— 普通用户：登录页会提示「该账号不是管理员」，路由守卫同样拦截。

## 功能清单与可用状态

| 模块 | 功能 | 接口 | 状态 |
|---|---|---|---|
| 登录 | 管理员/高级管理员登录、token 持久化、退出登录 | `POST /api/auth/login`、`GET /api/auth/me` | ✅ 可用 |
| 概览 | 贴吧数 / 帖子总数 / 最新帖子 / 后端与数据库状态 | `/api/health`、`/api/bars`、`/api/posts` | ✅ 可用 |
| **管理员管理** | 管理员列表（分页 + 关键字 / 角色 / 状态筛选） | `GET /api/admin/admins` | ✅ 可用（仅高级管理员） |
| **管理员管理** | 新增管理员（可选 admin / super_admin） | `POST /api/admin/admins` | ✅ 可用（仅高级管理员） |
| **管理员管理** | 调整角色（管理员 ⇄ 高级管理员） | `PATCH /api/admin/admins/{id}/role` | ✅ 可用（仅高级管理员） |
| **管理员管理** | 启用 / 禁用管理员 | `PATCH /api/admin/admins/{id}/status` | ✅ 可用（仅高级管理员） |
| **管理员管理** | 重置密码 | `PATCH /api/admin/admins/{id}/password` | ✅ 可用（仅高级管理员） |
| **管理员管理** | 撤销管理员权限（降级为普通用户） | `DELETE /api/admin/admins/{id}` | ✅ 可用（仅高级管理员） |
| 用户管理 | 用户列表（分页 + 搜索 + 角色/状态筛选） | `GET /api/admin/users` | ⚠️ 后端待提供 |
| 用户管理 | 查看用户信息 | `GET /api/admin/users/{id}` | ⚠️ 后端待提供 |
| 用户管理 | 禁用 / 启用用户 | `PATCH /api/admin/users/{id}/status` | ⚠️ 后端待提供 |
| 贴吧板块 | 列表（关键字搜索 + 前端分页） | `GET /api/bars` | ✅ 可用 |
| 贴吧板块 | 新增贴吧 | `POST /api/bars` | ✅ 可用 |
| 贴吧板块 | 编辑贴吧 | `PUT /api/bars/{id}` | ⚠️ 后端待提供 |
| 贴吧板块 | 删除贴吧 | `DELETE /api/bars/{id}` | ⚠️ 后端待提供 |
| 帖子管理 | 列表（分页 + 标题/正文搜索 + 按吧筛选 + 排序） | `GET /api/posts` | ✅ 可用 |
| 帖子管理 | 查看详情（含 9 图预览） | `GET /api/posts/{id}` | ✅ 可用 |
| 帖子管理 | 删除帖子（软删除） | `DELETE /api/posts/{id}` | ✅ 可用 |
| 评论管理 | 按帖子查看评论（分页、从帖子页可直达） | `GET /api/posts/{id}/comments` | ✅ 可用 |
| 评论管理 | 查看全部评论（分页 + 搜索） | `GET /api/admin/comments` | ⚠️ 后端待提供 |
| 评论管理 | 删除违规评论 | `DELETE /api/comments/{id}` | ⚠️ 后端待提供 |

**关于 ⚠️ 的说明**：本套管理后台按「不改动 bbs-app-backend」的要求开发，后端缺的接口前端**已经按统一 REST 约定写好调用**（见 `src/api/user.js`、`src/api/bar.js`、`src/api/comment.js` 的注释）。
请求这类接口时，axios 拦截器把 404/405 标记为 `missing`，页面**内联提示**「后端暂未提供该接口」并给出契约（不弹红叉、不白屏）；**后端补齐后前端无需改一行代码**。

## 接口缺口清单（需要在 bbs-app-backend 补充的接口）

以下接口是**新增**的（不影响已有接口与已有前端），字段风格与现有接口保持一致：统一响应体 `{code:0,message:'ok',data:...}`、camelCase、分页结构 `{list,page,pageSize,total,totalPages,hasMore}`，且都要求 `require_admin`。

| 方法 | 路径 | 用途 | 返回 data |
|---|---|---|---|
| GET | `/api/admin/users` | 用户列表 | 分页结构；每项 `{id,username,nickname,avatar,role,status,createdAt,postCount,commentCount}` |
| GET | `/api/admin/users/{id}` | 用户详情 | 同上单个对象 |
| PATCH | `/api/admin/users/{id}/status` | 禁用/启用 | body `{"status":0}` 或 `{"status":1}`；返回 `{id,status,statusText}` |
| PUT | `/api/bars/{id}` | 编辑贴吧 | body `{name,icon,image,intro,owner,sort}`；返回编辑后的吧对象 |
| DELETE | `/api/bars/{id}` | 删除贴吧 | 建议软删除或在库里把该吧帖子一并处理（外键已 CASCADE） |
| GET | `/api/admin/comments` | 全部评论 | 分页结构；每项 `{id,postId,postTitle,author,authorAvatar,text,likes,createdAt,status}` |
| DELETE | `/api/comments/{id}` | 删除评论 | 建议软删除 `status=0`，并把对应帖子的 `comment_count - 1` |

参考实现要点（沿用现有代码风格）：分页用小写 `Query(..., alias="pageSize")`、写操作放在 `transaction()` 里、需要管理员的路由依赖 `Depends(require_admin)`；用户禁用就是 `UPDATE users SET status=%s WHERE id=%s`（登录接口已经在校验 `status != 1 → 403 账号已被禁用`，所以禁用后 App 端立刻登不进）。

## 与后端对接的约定

| 事项 | 说明 |
|---|---|
| 接口基址 | 开发：`VITE_API_BASE=/api` + Vite 代理转发到 `http://127.0.0.1:8000`（同源，无跨域问题）；生产：改 `.env.production` |
| 鉴权 | 请求头 `Authorization: Bearer <token>`，token 由登录接口返回，存 `localStorage`（key：`bbs_admin_token`） |
| 统一响应体 | `{code, message, data}`；`code !== 0` 视为失败，拦截器统一弹提示 |
| 401 处理 | 清除登录态 → 跳登录页（带 `redirect` 参数，登录后回到原页面） |
| 分页参数 | `page`（从 1 开始）、`pageSize`（后端上限 50） |
| 帖子图片 | 后端返回 `/uploads/posts/YYYYMM/xxx.png`，通过 `resolveImageUrl()` 拼上 `VITE_STATIC_BASE`（开发环境走 `/uploads` 代理） |
| 字段命名 | 后端已是 camelCase（`barId / barName / authorAvatar / commentCount / liked / followed` 等），前端直接渲染 |

## 常见问题

| 现象 | 处理 |
|---|---|
| 登录提示「无法连接后端服务」 | 后端没启动：在 `bbs-app-backend` 执行 `.venv\Scripts\python.exe main.py` |
| 顶栏显示「后端已连接，数据库异常」 | MySQL 没启动：管理员终端执行 `net start MySQL`，并确认已导入 `sql/bbs_schema.sql` |
| 登录提示「该账号不是管理员」 | 用了普通用户（如 demo）；请用 `admin / admin123456` |
| 用户管理页显示「后端暂未提供用户管理接口」 | 正常现象，见上面的「接口缺口清单」，后端补齐后自动生效 |
| 贴吧「编辑 / 删除」提示接口待提供 | 同上（`PUT /api/bars/{id}`、`DELETE /api/bars/{id}` 待后端提供） |
| 图片不显示（生产 `npm run preview`） | `.env.production` 的 `VITE_STATIC_BASE` 要指向后端地址（默认已配好 `http://127.0.0.1:8000`） |
| 表格分页每页最多只能 50 条 | 后端对 `pageSize` 限制为 ≤50，属预期行为 |
| 启动后地址变成了 5181/5182… | 5180 被占用时 Vite 会自动往后找；本机 HBuilderX 运行 uni-app 到浏览器会占用 **5173**，所以本项目默认用 5180 避开它 |

