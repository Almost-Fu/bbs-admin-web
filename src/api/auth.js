// ---------------------------------------------------------------------------
// 认证接口（后端已提供）
// ---------------------------------------------------------------------------
import request from './request'

/**
 * 管理员登录
 * POST /api/auth/login
 * @param {{ username: string, password: string }} data
 * @returns {Promise<{data: {token, tokenType, expiresIn, user}}>}
 */
export function login(data) {
  return request.post('/auth/login', data)
}

/**
 * 当前登录用户信息（用于刷新页面后校验 token 是否有效）
 * GET /api/auth/me
 */
export function getMe() {
  return request.get('/auth/me')
}
