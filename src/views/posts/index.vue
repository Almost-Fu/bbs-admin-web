<template>
  <div class="page-card">
    <!-- ============ 筛选区 ============ -->
    <div class="toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="标题 / 正文 / 作者关键字"
        clearable
        style="width: 220px"
        @keyup.enter="handleSearch"
      />
      <el-select v-model="query.barId" placeholder="全部贴吧" clearable filterable style="width: 180px">
        <el-option v-for="bar in bars" :key="bar.id" :label="bar.name" :value="bar.id" />
      </el-select>
      <el-select v-model="query.order" style="width: 140px">
        <el-option v-for="item in POST_ORDER_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      <div class="toolbar-right">
        <el-button :icon="RefreshRight" :loading="loading" @click="load">刷新</el-button>
      </div>
    </div>

    <!-- ============ 帖子表格 ============ -->
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
      <el-table-column prop="barName" label="所属吧" width="110" show-overflow-tooltip />
      <el-table-column prop="author" label="作者" width="110" show-overflow-tooltip />
      <el-table-column prop="tag" label="标签" width="100" show-overflow-tooltip />
      <el-table-column label="配图" width="80" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.images && row.images.length" size="small" effect="plain">
            {{ row.images.length }} 张
          </el-tag>
          <span v-else class="text-muted">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="likes" label="点赞" width="80" align="center" />
      <el-table-column prop="commentCount" label="评论" width="80" align="center" />
      <el-table-column prop="views" label="浏览" width="80" align="center" />
      <el-table-column label="发布时间" width="170">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="190" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button link type="primary" @click="goComments(row)">评论</el-button>
          <el-button link type="danger" @click="handleRemove(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>暂无帖子数据</template>
    </el-table>

    <!-- ============ 分页（后端分页） ============ -->
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

    <!-- ============ 帖子详情弹窗 ============ -->
    <PostDetailDialog v-model="detailVisible" :post-id="currentPostId" />
  </div>
</template>

<script setup>
// ---------------------------------------------------------------------------
// 帖子管理（后端接口齐备，功能全部可用）
//   列表 GET /api/posts（分页 + 关键字 + 吧过滤 + 排序）
//   详情 GET /api/posts/{id}
//   删除 DELETE /api/posts/{id}（后端：作者本人或管理员；后台用管理员账号可删任意帖，软删除）
// ---------------------------------------------------------------------------
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, RefreshRight, Search } from '@element-plus/icons-vue'
import PostDetailDialog from '@/components/PostDetailDialog.vue'
import { fetchPosts, removePost } from '@/api/post'
import { fetchBars } from '@/api/bar'
import { PAGE_SIZE_OPTIONS, POST_ORDER_OPTIONS } from '@/utils/constants'
import { formatDateTime } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const bars = ref([]) // 下拉用的贴吧列表

const query = reactive({
  keyword: '',
  barId: null,
  order: 'latest',
  page: 1,
  pageSize: 10
})

/** 帖子分页列表 */
async function load() {
  loading.value = true
  try {
    const { data } = await fetchPosts({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      barId: query.barId || undefined,
      order: query.order
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

/** 吧下拉选项（从贴吧板块页跳转过来时也要能正确回显） */
async function loadBars() {
  try {
    const { data } = await fetchBars()
    bars.value = Array.isArray(data) ? data : []
  } catch (e) {
    bars.value = []
  }
}

function handleSearch() {
  query.page = 1
  load()
}

function handleReset() {
  query.keyword = ''
  query.barId = null
  query.order = 'latest'
  query.page = 1
  load()
}

// ---------------- 详情弹窗 ----------------
const detailVisible = ref(false)
const currentPostId = ref(null)

function openDetail(row) {
  currentPostId.value = row.id
  detailVisible.value = true
}

/** 跳到评论管理页并带上帖子 ID（该页「按帖子查看」标签会读取该参数） */
function goComments(row) {
  router.push({ path: '/comments', query: { postId: row.id } })
}

/** 删除帖子（后端软删除，可在数据库把 status 改回 1 恢复） */
async function handleRemove(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除帖子「${row.title}」吗？删除后 App 端将不再展示（后端为软删除）。`,
      '危险操作',
      { type: 'error', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }

  try {
    await removePost(row.id)
    ElMessage.success('已删除')
    // 删掉当前页最后一条时回退一页，避免停在空页
    if (list.value.length === 1 && query.page > 1) query.page -= 1
    load()
  } catch (e) {
    /* 错误提示已由 axios 拦截器统一处理 */
  }
}

onMounted(async () => {
  // 支持从「贴吧板块」页带 barId 跳转过来
  const barId = Number(route.query.barId)
  if (barId) query.barId = barId
  await loadBars()
  load()
})
</script>

