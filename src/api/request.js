// ---------------------------------------------------------------------------
// axios 统一封装（全项目唯一的请求出口）
//   1. baseURL / 超时 / 请求头集中配置
//   2. 请求拦截器：自动带 Authorization: Bearer <token>
//   3. 响应拦截器：拆后端统一响应体 {code, message, data}，只把 data 交给业务
//   4. 401 自动清登录态并跳登录页；404/405 标记为「接口不存在」，由页面自己做降级说明
// ---------------------------------------------------------------------------
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, clearAuth } from '@/utils/auth'
import router from '@/router'

// 各状态码对应的友好文案（后端失败时也会返回 message，优先用后端的）
const HTTP_MESSAGE = {
  400: '请求参数有误',
  401: '登录已过期，请重新登录',
  403: '没有权限执行该操作（后台需要管理员账号）',
  404: '接口或数据不存在',
  405: '请求方法不被支持',
  422: '参数校验失败',
  500: '服务器内部错误',
  503: '数据库不可用，请确认 MySQL 已启动'
}

const service = axios.create({
  // 开发环境为 /api（走 vite 代理），生产环境见 .env.production
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// ------------------------------ 请求拦截 ------------------------------
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      // 后端用 HTTPBearer 解析：Authorization: Bearer <token>
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ------------------------------ 响应拦截 ------------------------------
service.interceptors.response.use(
  (response) => {
    const res = response.data
    // 后端约定：{code: 0, message: 'ok', data: ...}
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 0) {
        return res
      }
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(Object.assign(new Error(res.message || '请求失败'), { code: res.code }))
    }
    // 非统一响应体（例如静态文件），原样返回
    return res
  },
  (error) => {
    const { response, code } = error

    // 1) 请求没到达后端：后端没启动 / 断网 / 超时
    if (!response) {
      const message =
        code === 'ECONNABORTED'
          ? '请求超时，请稍后重试'
          : '无法连接后端服务，请确认 bbs-app-backend 已启动（默认 http://127.0.0.1:8000）'
      ElMessage.error(message)
      return Promise.reject(Object.assign(error, { network: true }))
    }

    const status = response.status
    const serverMessage = response.data && response.data.message

    // 2) 登录失效：清登录态并跳转登录页（带 redirect，登录后回到原页面）
    if (status === 401) {
      clearAuth()
      ElMessage.error(serverMessage || HTTP_MESSAGE[401])
      const current = router.currentRoute.value
      if (current.path !== '/login') {
        router.replace({ path: '/login', query: { redirect: current.fullPath } })
      }
      return Promise.reject(Object.assign(new Error('未登录'), { status }))
    }

    // 3) 接口不存在（后端还没实现该管理接口）：不弹错误提示，交给页面优雅降级
    if (status === 404 || status === 405) {
      return Promise.reject(
        Object.assign(new Error(serverMessage || HTTP_MESSAGE[status]), {
          status,
          missing: true
        })
      )
    }

    // 4) 其余错误：统一提示
    const message = serverMessage || HTTP_MESSAGE[status] || `请求失败（HTTP ${status}）`
    ElMessage.error(message)
    return Promise.reject(Object.assign(new Error(message), { status }))
  }
)

export default service
