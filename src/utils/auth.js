// ---------------------------------------------------------------------------
// 登录态本地存储：集中管理 token 与用户信息
// 单独抽成工具模块，避免 axios 封装与 Pinia store 互相 import 造成循环依赖
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'bbs_admin_token'
const USER_KEY = 'bbs_admin_user'

/** 读取 token（未登录返回空字符串） */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

/** 保存 token */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token || '')
}

/** 读取本地缓存的用户信息 */
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch (e) {
    return null
  }
}

/** 保存用户信息 */
export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user || null))
}

/** 清空登录态（退出登录 / token 失效时调用） */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
