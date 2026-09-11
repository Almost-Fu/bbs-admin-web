// ---------------------------------------------------------------------------
// 用户管理接口
//
// ⚠️ 说明：当前 bbs-app-backend 还没有「用户管理」相关接口，
//    下面 3 个函数按统一 REST 约定编写；后端补齐后本页即自动可用，
//    未补齐时页面会显示「接口待提供」提示（不会白屏或报错）。
//    约定的契约（与后端其它接口一致：camelCase 字段 + {code,message,data}）：
//      用户对象 = { id, username, nickname, avatar, role, status, createdAt,
//                   postCount?, commentCount?, lastLoginAt? }
// ---------------------------------------------------------------------------
import request from './request'

/**
 * 用户列表（分页）
 * GET /api/admin/users?page&pageSize&keyword&role&status   ← 后端待提供
 * @returns {Promise<{data: {list, page, pageSize, total, totalPages, hasMore}}>}
 */
export function fetchUsers(params) {
  return request.get('/admin/users', { params })
}

/**
 * 用户详情
 * GET /api/admin/users/{id}   ← 后端待提供
 */
export function fetchUserDetail(id) {
  return request.get(`/admin/users/${id}`)
}

/**
 * 禁用 / 启用用户
 * PATCH /api/admin/users/{id}/status   body: { status: 1 | 0 }   ← 后端待提供
 * @param {number} id
 * @param {number} status 1=正常(启用) 0=禁用
 */
export function updateUserStatus(id, status) {
  return request.patch(`/admin/users/${id}/status`, { status })
}
