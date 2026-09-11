// ---------------------------------------------------------------------------
// 贴吧板块接口
//   ✔ 列表 / 详情 / 新增：后端已提供
//   ⚠ 编辑 / 删除：当前 bbs-app-backend 未提供（页面会给出「接口待提供」提示）
//     约定契约：PUT /api/bars/{id} 与 DELETE /api/bars/{id}（管理员）
// ---------------------------------------------------------------------------
import request from './request'

/**
 * 贴吧列表（后端返回数组，不是分页结构，前端自行分页）
 * GET /api/bars?keyword=
 */
export function fetchBars(params) {
  return request.get('/bars', { params })
}

/**
 * 贴吧详情
 * GET /api/bars/{id}
 */
export function fetchBarDetail(id) {
  return request.get(`/bars/${id}`)
}

/**
 * 新增贴吧（仅管理员）
 * POST /api/bars  body: { name, image, intro, owner, sort }（emoji 图标已废弃，不再传 icon）
 */
export function createBar(data) {
  return request.post('/bars', data)
}

/**
 * 编辑贴吧
 * PUT /api/bars/{id}  body: { name, image, intro, owner, sort }（emoji 图标已废弃，不再传 icon）
 */
export function updateBar(id, data) {
  return request.put(`/bars/${id}`, data)
}

/**
 * 删除贴吧（会级联删除吧内帖子/关注，后端需 ON DELETE CASCADE）
 * DELETE /api/bars/{id}   ← 后端待提供
 */
export function removeBar(id) {
  return request.delete(`/bars/${id}`)
}

/**
 * 吧内帖子分页（用于「查看吧内帖子」跳转帖子管理页）
 * GET /api/bars/{id}/posts?page&pageSize
 */
export function fetchBarPosts(id, params) {
  return request.get(`/bars/${id}/posts`, { params })
}
