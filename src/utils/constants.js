// ---------------------------------------------------------------------------
// 下拉选项 / 标签映射常量（用户角色、账号状态、帖子排序等）
// ---------------------------------------------------------------------------

/** 用户角色：与后端 users.role 一致（ENUM('user','admin','super_admin')） */
export const ROLE_OPTIONS = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' },
  { label: '高级管理员', value: 'super_admin' }
]

/** 管理员角色选项（「管理员管理」页用：只能在这两档之间调整） */
export const ADMIN_ROLE_OPTIONS = ROLE_OPTIONS.filter((item) => item.value !== 'user')

export const ROLE_TAG_TYPE = {
  user: 'info',
  admin: 'warning',
  super_admin: 'danger'
}

export const ROLE_TEXT = {
  user: '普通用户',
  admin: '管理员',
  super_admin: '高级管理员'
}

/** 账号状态：与后端 users.status 一致（1 正常 / 0 禁用） */
export const STATUS_OPTIONS = [
  { label: '正常', value: 1 },
  { label: '已禁用', value: 0 }
]

export const STATUS_TAG_TYPE = {
  1: 'success',
  0: 'danger'
}

export const STATUS_TEXT = {
  1: '正常',
  0: '已禁用'
}

/** 帖子排序方式（对应后端 /api/posts 的 order 参数） */
export const POST_ORDER_OPTIONS = [
  { label: '最新发布', value: 'latest' },
  { label: '最多点赞', value: 'hot' }
]

/** 每页条数选项：后端 pageSize 上限为 50 */
export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]
