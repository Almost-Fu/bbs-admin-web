// ---------------------------------------------------------------------------
// 管理员账号管理接口（仅「高级管理员」super_admin 可用）
//   ✔ 后端已全部提供（见 bbs-app-backend/main.py 第 13 节）
//   权限说明：普通管理员调用会拿到 403「需要高级管理员权限」
//   安全护栏（后端已实现）：不能禁用/降级/撤销自己；不能动最后一个高级管理员
// ---------------------------------------------------------------------------
import request from './request'

/**
 * 管理员列表（分页）
 * GET /api/admin/admins?page&pageSize&keyword&role&status
 * @returns {Promise<{data: {list, page, pageSize, total, totalPages, hasMore}}>}
 */
export function fetchAdmins(params) {
  return request.get('/admin/admins', { params })
}

/**
 * 管理员详情
 * GET /api/admin/admins/{id}
 */
export function fetchAdminDetail(id) {
  return request.get(`/admin/admins/${id}`)
}

/**
 * 新增管理员账号
 * POST /api/admin/admins
 * @param {{username:string, password:string, nickname?:string, avatar?:string,
 *          role:'admin'|'super_admin'}} data
 */
export function createAdmin(data) {
  return request.post('/admin/admins', data)
}

/**
 * 启用 / 禁用管理员
 * PATCH /api/admin/admins/{id}/status  body: { status: 1 | 0 }
 */
export function updateAdminStatus(id, status) {
  return request.patch(`/admin/admins/${id}/status`, { status })
}

/**
 * 调整管理员角色（admin ⇄ super_admin）
 * PATCH /api/admin/admins/{id}/role  body: { role }
 */
export function updateAdminRole(id, role) {
  return request.patch(`/admin/admins/${id}/role`, { role })
}

/**
 * 重置管理员密码
 * PATCH /api/admin/admins/{id}/password  body: { password }
 */
export function resetAdminPassword(id, password) {
  return request.patch(`/admin/admins/${id}/password`, { password })
}

/**
 * 撤销管理员权限（该账号降级为普通用户，不删除账号与其帖子）
 * DELETE /api/admin/admins/{id}
 */
export function revokeAdmin(id) {
  return request.delete(`/admin/admins/${id}`)
}
