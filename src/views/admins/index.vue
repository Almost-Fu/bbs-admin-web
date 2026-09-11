<template>
  <div class="page-card">
    <el-alert
      class="gap-alert"
      type="warning"
      show-icon
      :closable="false"
      title="本页仅「高级管理员」可见可用"
      description="可以新增管理员、调整角色（管理员 ⇄ 高级管理员）、启用/禁用、重置密码、撤销管理员权限。后端护栏：不能禁用/降级/撤销自己，也不能把最后一个启用状态的高级管理员禁用或降级。"
    />

    <!-- ============ 筛选区 ============ -->
    <div class="toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="用户名 / 昵称"
        clearable
        style="width: 200px"
        @keyup.enter="handleSearch"
      />
      <el-select v-model="query.role" placeholder="全部角色" clearable style="width: 160px">
        <el-option
          v-for="item in ADMIN_ROLE_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
        <el-option
          v-for="item in STATUS_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增管理员</el-button>
      </div>
    </div>

    <!-- ============ 管理员表格 ============ -->
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="头像" width="70" align="center">
        <template #default="{ row }">
          <el-avatar :size="32" :src="resolveImageUrl(row.avatar)" />
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" min-width="130" show-overflow-tooltip />
      <el-table-column prop="nickname" label="昵称" min-width="120" show-overflow-tooltip />
      <el-table-column label="角色" width="160" align="center">
        <template #default="{ row }">
          <el-tag :type="ROLE_TAG_TYPE[row.role] || 'info'" size="small" effect="plain">
            {{ row.roleText || ROLE_TEXT[row.role] }}
          </el-tag>
          <el-tag v-if="row.isSelf" class="ml6" type="success" size="small" effect="dark">我</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="STATUS_TAG_TYPE[row.status] || 'info'" size="small">
            {{ row.statusText || STATUS_TEXT[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="帖子数" width="90" align="center">
        <template #default="{ row }">{{ row.postCount ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="评论数" width="90" align="center">
        <template #default="{ row }">{{ row.commentCount ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" :disabled="row.isSelf" @click="openRole(row)">
            改角色
          </el-button>
          <el-button link type="primary" @click="handleResetPassword(row)">重置密码</el-button>

          <!-- 对自己的危险操作置灰（后端同样会拒绝） -->
          <el-tooltip :disabled="!row.isSelf" content="不能对自己执行该操作" placement="top">
            <span>
              <el-button
                link
                :type="row.status === 1 ? 'danger' : 'success'"
                :disabled="row.isSelf"
                @click="toggleStatus(row)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
            </span>
          </el-tooltip>

          <el-tooltip :disabled="!row.isSelf" content="不能撤销自己的管理员权限" placement="top">
            <span>
              <el-button link type="danger" :disabled="row.isSelf" @click="handleRevoke(row)">
                撤销
              </el-button>
            </span>
          </el-tooltip>
        </template>
      </el-table-column>
      <template #empty>暂无管理员账号</template>
    </el-table>

    <!-- ============ 分页 ============ -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :page-sizes="PAGE_SIZE_OPTIONS"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="load"
        @current-change="load"
      />
    </div>

    <!-- ============ 新增管理员弹窗 ============ -->
    <AdminFormDialog v-model="formVisible" @saved="load" />

    <!-- ============ 调整角色弹窗 ============ -->
    <el-dialog v-model="roleVisible" title="调整管理员角色" width="480px">
      <el-descriptions :column="1" border size="small" class="mb12">
        <el-descriptions-item label="账号">
          {{ current.username }}（{{ current.nickname }}）
        </el-descriptions-item>
        <el-descriptions-item label="当前角色">
          {{ current.roleText || ROLE_TEXT[current.role] }}
        </el-descriptions-item>
      </el-descriptions>

      <el-radio-group v-model="roleForm.role">
        <el-radio v-for="item in ADMIN_ROLE_OPTIONS" :key="item.value" :value="item.value">
          {{ item.label }}
        </el-radio>
      </el-radio-group>

      <el-alert
        class="mt12"
        type="info"
        :closable="false"
        title="高级管理员：可管理管理员账号；管理员：只能管理贴吧 / 帖子 / 评论。"
      />

      <template #footer>
        <el-button @click="roleVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleSubmitting" @click="submitRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// ---------------------------------------------------------------------------
// 管理员管理（仅「高级管理员」super_admin 可见可用）
//   对应后端接口（bbs-app-backend/main.py 第 13 节）：
//     GET    /api/admin/admins                  列表（分页 + 关键字 + 角色/状态筛选）
//     POST   /api/admin/admins                  新增管理员
//     PATCH  /api/admin/admins/{id}/role        调整角色（admin ⇄ super_admin）
//     PATCH  /api/admin/admins/{id}/status      启用 / 禁用
//     PATCH  /api/admin/admins/{id}/password    重置密码
//     DELETE /api/admin/admins/{id}             撤销管理员权限（降级为普通用户）
//   后端护栏：不能对自己执行 禁用/降级/撤销；不能把最后一个启用状态的高级管理员禁用或降级
// ---------------------------------------------------------------------------
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import AdminFormDialog from '@/components/AdminFormDialog.vue'
import {
  fetchAdmins,
  updateAdminRole,
  updateAdminStatus,
  resetAdminPassword,
  revokeAdmin
} from '@/api/admin'
import {
  ADMIN_ROLE_OPTIONS,
  PAGE_SIZE_OPTIONS,
  ROLE_TAG_TYPE,
  ROLE_TEXT,
  STATUS_OPTIONS,
  STATUS_TAG_TYPE,
  STATUS_TEXT
} from '@/utils/constants'
import { formatDateTime, resolveImageUrl } from '@/utils/format'

const loading = ref(false)
const list = ref([])
const total = ref(0)

const query = reactive({
  keyword: '',
  role: '',
  status: null,
  page: 1,
  pageSize: 10
})

/** 管理员分页列表 */
async function load() {
  loading.value = true
  try {
    const { data } = await fetchAdmins({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      role: query.role || undefined,
      status: query.status === null || query.status === '' ? undefined : query.status
    })
    list.value = data.list || []
    total.value = data.total || 0
  } catch (e) {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  load()
}

function handleReset() {
  query.keyword = ''
  query.role = ''
  query.status = null
  query.page = 1
  load()
}

// ---------------- 新增管理员 ----------------
const formVisible = ref(false)

function openCreate() {
  formVisible.value = true
}

// ---------------- 调整角色 ----------------
const roleVisible = ref(false)
const roleSubmitting = ref(false)
const current = ref({})
const roleForm = reactive({ role: 'admin' })

function openRole(row) {
  current.value = { ...row }
  roleForm.role = row.role
  roleVisible.value = true
}

async function submitRole() {
  if (roleForm.role === current.value.role) {
    roleVisible.value = false
    return
  }
  roleSubmitting.value = true
  try {
    const { message } = await updateAdminRole(current.value.id, roleForm.role)
    ElMessage.success(message || '角色已调整')
    roleVisible.value = false
    load()
  } catch (e) {
    /* 错误提示已由 axios 拦截器统一处理（如「至少需要保留一个启用状态的高级管理员」） */
  } finally {
    roleSubmitting.value = false
  }
}

// ---------------- 启用 / 禁用 ----------------
async function toggleStatus(row) {
  const nextStatus = row.status === 1 ? 0 : 1
  const actionText = nextStatus === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(
      nextStatus === 0
        ? `确定要禁用管理员「${row.nickname || row.username}」吗？禁用后该账号将无法登录后台。`
        : `确定要启用管理员「${row.nickname || row.username}」吗？`,
      '提示',
      { type: 'warning', confirmButtonText: `确定${actionText}`, cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }

  try {
    const { message } = await updateAdminStatus(row.id, nextStatus)
    ElMessage.success(message || `已${actionText}`)
    load()
  } catch (e) {
    /* 拦截器已提示 */
  }
}

// ---------------- 重置密码 ----------------
async function handleResetPassword(row) {
  let password = ''
  try {
    const { value } = await ElMessageBox.prompt(
      `请输入「${row.nickname || row.username}」的新密码（6~32 位）`,
      '重置管理员密码',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        inputType: 'password',
        inputPlaceholder: '新密码（至少 6 位）',
        inputValidator: (val) => (val && val.length >= 6 ? true : '密码至少 6 位')
      }
    )
    password = value
  } catch (e) {
    return
  }

  try {
    const { message } = await resetAdminPassword(row.id, password)
    ElMessage.success(message || '密码已重置')
  } catch (e) {
    /* 拦截器已提示 */
  }
}

// ---------------- 撤销管理员权限 ----------------
async function handleRevoke(row) {
  try {
    await ElMessageBox.confirm(
      `确定撤销「${row.nickname || row.username}」的管理员权限吗？\n该账号将降级为普通用户（帖子与评论保留），且无法再登录后台。`,
      '危险操作',
      { type: 'error', confirmButtonText: '确定撤销', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }

  try {
    const { message } = await revokeAdmin(row.id)
    ElMessage.success(message || '已撤销管理员权限')
    // 撤销当前页最后一条时回退一页
    if (list.value.length === 1 && query.page > 1) query.page -= 1
    load()
  } catch (e) {
    /* 拦截器已提示 */
  }
}

onMounted(load)
</script>

<style scoped>
.ml6 {
  margin-left: 6px;
}

.mb12 {
  margin-bottom: 12px;
}

.mt12 {
  margin-top: 12px;
}
</style>

