// ---------------------------------------------------------------------------
// 评论接口
//   ✔ 按帖子查看评论：后端已提供（GET /api/posts/{postId}/comments）
//   ⚠ 全部评论列表 / 删除评论：当前 bbs-app-backend 未提供
//     约定契约：
//       全部评论  GET    /api/admin/comments?page&pageSize&postId&keyword  → 分页结构
//                 评论对象 = { id, postId, postTitle, author, authorId, authorAvatar,
//                              text, likes, time, createdAt, status }
//       删除评论  DELETE /api/comments/{id}（管理员，建议软删除 status=0）
// ---------------------------------------------------------------------------
import request from './request'

/**
 * 全部评论（分页）
 * GET /api/admin/comments
 */
export function fetchComments(params) {
  return request.get('/admin/comments', { params })
}

/**
 * 某个帖子下的评论（分页）—— 后端已提供
 * GET /api/posts/{postId}/comments
 * @returns {Promise<{data: {list, page, pageSize, total, totalPages, hasMore}}>}
 */
export function fetchCommentsByPost(postId, params) {
  return request.get(`/posts/${postId}/comments`, { params })
}

/**
 * 删除违规评论（软删除 status=0，同时把帖子评论数 -1）
 * DELETE /api/comments/{id}
 */
export function removeComment(id) {
  return request.delete(`/comments/${id}`)
}
