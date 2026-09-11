// ---------------------------------------------------------------------------
// 后台登录用户信息（Pinia）：token + 当前用户 + 是否管理员
// 数据同步写入 localStorage，刷新页面不丢登录态
// ---------------------------------------------------------------------------
import { defineStore } from 'pinia'
import { login as loginApi, getMe } from '@/api/auth'
import { getToken, setToken, getUser, setUser, clearAuth } from '@/utils/auth'
import { ROLE_TEXT } from '@/utils/constants'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    user: getUser()
  }),

  getters: {
    /** 是否已登录（本地有 token） */
    isLogin: (state) => !!state.token,
    /** 是否是管理员（admin / super_admin）：后台接口都要求其中之一 */
    isAdmin: (state) => ['admin', 'super_admin'].includes(state.user?.role),
    /** 是否是高级管理员：额外可以管理「管理员账号」 */
    isSuperAdmin: (state) => state.user?.role === 'super_admin',
    /** 角色中文名（顶栏展示用） */
    roleText: (state) => ROLE_TEXT[state.user?.role] || '未知角色',
    /** 顶栏展示用的昵称 */
    displayName: (state) => state.user?.nickname || state.user?.username || '未登录',
    /** 头像：后端存的是 emoji 字符 */
    avatar: (state) => state.user?.avatar || '🙂'
  },

  actions: {
    /**
     * 登录：后端 POST /api/auth/login
     * 返回 { token, tokenType, expiresIn, user: { id, username, nickname, avatar, role } }
     */
    async login(form) {
      const { data } = await loginApi(form)
      this.token = data.token
      this.user = data.user
      setToken(data.token)
      setUser(data.user)
      return data
    },

    /** 拉取最新用户信息：刷新页面后校验 token 是否仍有效 */
    async fetchMe() {
      const { data } = await getMe()
      this.user = data
      setUser(data)
      return data
    },

    /** 退出登录：只清本地登录态（后端无登出接口，JWT 到期自动失效） */
    logout() {
      this.token = ''
      this.user = null
      clearAuth()
    }
  }
})
