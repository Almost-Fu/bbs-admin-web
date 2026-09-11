// ---------------------------------------------------------------------------
// 系统类接口（健康检查：用于顶栏显示后端连接状态）
// ---------------------------------------------------------------------------
import request from './request'

/**
 * 健康检查
 * GET /api/health → { service, db, dbMessage, time }
 * db=true 表示后端能连上 MySQL
 */
export function getHealth() {
  return request.get('/health')
}
