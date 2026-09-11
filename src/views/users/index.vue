<template>
  <div class="page-card">
    <!-- 接口异常时的说明（正常情况下不显示；不弹错误提示，页面内联告知） -->
    <el-alert
      v-if="apiMissing"
      class="gap-alert"
      type="warning"
      show-icon
      :closable="false"
      title="用户管理接口暂时不可用"
      description="请确认后端服务已启动/部署完成（GET /api/admin/users）。服务恢复后点右侧「刷新」即可，本页无需改动。"
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
      <el-select v-model="query.role" placeholder="全部角色" clearable style="width: 140px">
        <el-option v-for="item in ROLE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
        <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      <div class="toolbar-right">
        <el-button :icon="RefreshRight" :loading="loading" @click="load">刷新</el-button>
      </div>
    </div>

    <!-- ============ 用户表格 ============ -->
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="头像" width="80" align="center">
        <template #default="{ row }">
          <el-avatar :size="34" :src="resolveImageUrl(row.avatar)" />
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" min-width="140" show-overflow-tooltip />
      <el-table-column prop="nickname" label="昵称" min-width="140" show-overflow-tooltip />
      <el-table-column label="角色" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="ROLE_TAG_TYPE[row.role] || 'info'" size="small" effect="plain">
            {{ ROLE_TEXT[row.role] || row.role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="STATUS_TAG_TYPE[row.status] || 'info'" size="small">
            {{ STATUS_TEXT[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="帖子数" width="90" align="center">
        <template #default="{ row }">{{ row.postCount ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="评论数" width="90" align="center">
        <template #default="{ row }">{{ row.commentCount ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="注册时间" width="170">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button
            link
            :type="row.status === 1 ? 'danger' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
      <template #empty>暂无用户数据</template>
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

    <!-- ============ 用户详情弹窗 ============ -->
    <el-dialog v-model="detailVisible" title="用户详情" width="560px">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detail.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ detail.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="头像">
          <el-avatar :size="44" :src="resolveImageUrl(detail.avatar)" />
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ ROLE_TEXT[detail.role] || detail.role }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ STATUS_TEXT[detail.status] || detail.status }}
        </el-descriptions-item>
        <el-descriptions-item label="帖子数">{{ detail.postCount ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="评论数">{{ detail.commentCount ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间" :span="2">
          {{ formatDateTime(detail.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// ---------------------------------------------------------------------------
// 用户管理：列表 / 详情 / 禁用启用（接口见 src/api/user.js，后端已提供）
// 若返回 404/405 则展示内联说明（多为后端未就绪，不是前端问题）
// ---------------------------------------------------------------------------
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, RefreshRight } from '@element-plus/icons-vue'
import { fetchUsers, fetchUserDetail, updateUserStatus } from '@/api/user'
import { ROLE_OPTIONS, STATUS_OPTIONS, ROLE_TAG_TYPE, ROLE_TEXT, STATUS_TAG_TYPE, STATUS_TEXT, PAGE_SIZE_OPTIONS } from '@/utils/constants'
import { formatDateTime, resolveImageUrl } from '@/utils/format'

const loading = ref(false)
const apiMissing = ref(false) // 后端未提供用户接口时置 true，用于展示提示条
const list = ref([])
const total = ref(0)

const query = reactive({
  keyword: '',
  role: '',
  status: null,
  page: 1,
  pageSize: 10
})

/** 查询用户列表（分页） */
async function load() {
  loading.value = true
  try {
    const { data } = await fetchUsers({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      role: query.role || undefined,
      status: query.status === null || query.status === '' ? undefined : query.status
    })
    list.value = data.list || []
    total.value = data.total || 0
    apiMissing.value = false
  } catch (e) {
    // 接口不存在（404/405）：静默降级；其它错误已由 axios 拦截器提示
    if (e.missing) {
      apiMissing.value = true
      list.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
  }
}

/** 条件查询：回到第一页 */
function handleSearch() {
  query.page = 1
  load()
}

/** 重置筛选条件 */
function handleReset() {
  query.keyword = ''
  query.role = ''
  query.status = null
  query.page = 1
  load()
}

// ---------------- 详情弹窗 ----------------
const detailVisible = ref(false)
const detail = ref({})

async function openDetail(row) {
  detail.value = { ...row }
  detailVisible.value = true
  try {
    const { data } = await fetchUserDetail(row.id)
    detail.value = data || row
  } catch (e) {
    if (e.missing) {
      ElMessage.warning('后端暂未提供「用户详情」接口，先展示列表中的数据')
    }
  }
}

/** 禁用 / 启用：调用 PATCH /api/admin/users/{id}/status */
async function toggleStatus(row) {
  const nextStatus = row.status === 1 ? 0 : 1
  const actionText = nextStatus === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(
      `确定要${actionText}用户「${row.nickname || row.username}」吗？${
        nextStatus === 0 ? '禁用后该账号将无法登录 App。' : ''
      }`,
      '提示',
      { type: 'warning', confirmButtonText: `确定${actionText}`, cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }

  try {
    await updateUserStatus(row.id, nextStatus)
    ElMessage.success(`已${actionText}`)
    load()
  } catch (e) {
    if (e.missing) {
      ElMessage.warning('后端暂未提供「禁用/启用用户」接口（PATCH /api/admin/users/{id}/status）')
    }
  }
}

onMounted(load)
</script>

<style scoped>
.emoji-avatar {
  font-size: 20px;
}
</style>

