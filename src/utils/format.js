// ---------------------------------------------------------------------------
// 展示格式化工具（PC 表格里复用）
// ---------------------------------------------------------------------------

/**
 * 后端返回的图片地址形如 /uploads/posts/202609/xxx.png
 * 生产环境前后端不同源时，需要拼上 VITE_STATIC_BASE（见 .env.production）
 * 已经是 http(s):// 的地址原样返回（演示数据里有 picsum 占位图）
 */
export function resolveImageUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = import.meta.env.VITE_STATIC_BASE || ''
  return `${base}${url}`
}

/** 时间展示：后端已给 'YYYY-MM-DD HH:mm:ss'（createdAt），兜底用相对时间 time */
export function formatDateTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}

/** 文本超出长度截断，避免表格被撑开 */
export function ellipsis(text, max = 40) {
  const str = String(text ?? '')
  return str.length > max ? `${str.slice(0, max)}…` : str
}

/** 数量展示：12345 → 1.2万（与前端 App 的吧头部风格一致） */
export function formatCount(num) {
  const n = Number(num || 0)
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  return String(n)
}
