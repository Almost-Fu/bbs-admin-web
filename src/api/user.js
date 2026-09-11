// ---------------------------------------------------------------------------
// 用户管理接口
//
// ✔ 说明：后端已提供用户管理接口（GET /api/admin/users、GET /api/admin/users/{id}、
//    PATCH /api/admin/users/{id}/status），本页可直接使用。
//    契约与后端其它接口一致：camelCase 字段 + {code, message, data}：
//      用户对象 = { id, username, nickname, avatar, role, status, createdAt,
//                   postCount?, commentCount?, lastLoginAt? }
// ---------------------------------------------------------------------------
import request from './request'

/**
 * 用户列表（分页）
 * GET /api/admin/users?page&pageSize&keyword&role&status
 * @returns {Promise<{data: {list, page, pageSize, total, totalPages, hasMore}}>}
 */
export function fetchUsers(params) {
  return request.get('/admin/users', { params })
}

/**
 * 用户详情
 * GET /api/admin/users/{id}
 */
export function fetchUserDetail(id) {
  return request.get(`/admin/users/${id}`)
}

/**
 * 禁用 / 启用用户
 * PATCH /api/admin/users/{id}/status   body: { status: 1 | 0 }
 * @param {number} id
 * @param {number} status 1=正常(启用) 0=禁用
 */
export function updateUserStatus(id, status) {
  return request.patch(`/admin/users/${id}/status`, { status })
}
