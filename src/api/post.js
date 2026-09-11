// ---------------------------------------------------------------------------
// 帖子接口（后端已全部提供）
//   列表 GET /api/posts 支持 page / pageSize / barId / authorId / keyword / order
//   删除 DELETE /api/posts/{id} —— 后端允许「作者本人或管理员」，后台用管理员账号即可删任意帖
// ---------------------------------------------------------------------------
import request from './request'

/**
 * 帖子分页列表
 * @param {{page?: number, pageSize?: number, barId?: number, authorId?: number,
 *          keyword?: string, order?: 'latest'|'hot'}} params
 * @returns {Promise<{data: {list, page, pageSize, total, totalPages, hasMore}}>}
 */
export function fetchPosts(params) {
  return request.get('/posts', { params })
}

/**
 * 帖子详情（注意：后端会顺手把 view_count +1）
 * GET /api/posts/{id}
 */
export function fetchPostDetail(id) {
  return request.get(`/posts/${id}`)
}

/**
 * 删除帖子（后端为软删除：status=0）
 * DELETE /api/posts/{id}
 */
export function removePost(id) {
  return request.delete(`/posts/${id}`)
}
