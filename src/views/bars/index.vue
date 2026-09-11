<template>
  <div class="page-card">
    <el-alert
      class="gap-alert"
      type="info"
      show-icon
      :closable="false"
      title="贴吧板块：列表 / 新增 / 编辑 / 删除均已可用"
      description="吧的形象统一用「吧图」（image 字段）；emoji 吧图标已废弃，数据库里也没有这一列了。"
    />

    <!-- ============ 筛选区 ============ -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="吧名关键字"
        clearable
        style="width: 220px"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增贴吧</el-button>
      </div>
    </div>

    <!-- ============ 贴吧表格（后端返回数组，分页在前端做） ============ -->
    <el-table :data="pagedBars" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="吧名" min-width="140" show-overflow-tooltip />
      <el-table-column label="吧图" width="90" align="center">
        <template #default="{ row }">
          <el-image
            v-if="row.img"
            class="table-thumb"
            :src="resolveImageUrl(row.img)"
            :preview-src-list="[resolveImageUrl(row.img)]"
            preview-teleported
            fit="cover"
          />
          <span v-else class="text-muted">未设置</span>
        </template>
      </el-table-column>
      <el-table-column prop="intro" label="简介" min-width="200" show-overflow-tooltip />
      <el-table-column prop="owner" label="吧主" width="110" show-overflow-tooltip />
      <el-table-column label="帖子数" width="90" align="center">
        <template #default="{ row }">{{ formatCount(row.postCount) }}</template>
      </el-table-column>
      <el-table-column label="关注数" width="90" align="center">
        <template #default="{ row }">{{ formatCount(row.followCount) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="goPosts(row)">帖子</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleRemove(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>暂无贴吧板块</template>
    </el-table>

    <!-- ============ 分页（前端分页） ============ -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="PAGE_SIZE_OPTIONS"
        :total="bars.length"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- ============ 新增 / 编辑弹窗 ============ -->
    <BarFormDialog v-model="dialogVisible" :mode="dialogMode" :bar="currentBar" @saved="load" />
  </div>
</template>

<script setup>
// ---------------------------------------------------------------------------
// 贴吧板块管理
//   ✔ 列表：GET /api/bars（后端返回数组 → 前端分页）
//   ✔ 新增：POST /api/bars（管理员）
//   ⚠ 编辑 / 删除：后端待提供 PUT /api/bars/{id}、DELETE /api/bars/{id}
// ---------------------------------------------------------------------------
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import BarFormDialog from '@/components/BarFormDialog.vue'
import { fetchBars, removeBar } from '@/api/bar'
import { PAGE_SIZE_OPTIONS } from '@/utils/constants'
import { formatCount, resolveImageUrl } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const keyword = ref('')
const bars = ref([])
const page = ref(1)
const pageSize = ref(10)

// 前端分页：后端 /api/bars 一次返回全部（16 个吧量级很小）
const pagedBars = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return bars.value.slice(start, start + pageSize.value)
})

/** 拉取贴吧列表 */
async function load() {
  loading.value = true
  try {
    const { data } = await fetchBars({ keyword: keyword.value || undefined })
    bars.value = Array.isArray(data) ? data : []
    // 数据量变化后避免停留在空页
    const maxPage = Math.max(1, Math.ceil(bars.value.length / pageSize.value))
    if (page.value > maxPage) page.value = maxPage
  } catch (e) {
    bars.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  load()
}

function handleReset() {
  keyword.value = ''
  page.value = 1
  load()
}

/** 查看吧内帖子：跳到帖子管理页并带上 barId 过滤 */
function goPosts(row) {
  router.push({ path: '/posts', query: { barId: row.id } })
}

// ---------------- 新增 / 编辑 ----------------
const dialogVisible = ref(false)
const dialogMode = ref('create') // create | edit
const currentBar = ref(null)

function openCreate() {
  dialogMode.value = 'create'
  currentBar.value = null
  dialogVisible.value = true
}

function openEdit(row) {
  dialogMode.value = 'edit'
  currentBar.value = { ...row }
  dialogVisible.value = true
}

/** 删除贴吧（会级联删除吧内帖子、关注关系，后端外键为 ON DELETE CASCADE） */
async function handleRemove(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除贴吧「${row.name}」吗？该吧下的帖子与关注关系会一并删除，且不可恢复。`,
      '危险操作',
      { type: 'error', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }

  try {
    await removeBar(row.id)
    ElMessage.success('已删除')
    load()
  } catch (e) {
    if (e.missing) {
      ElMessage.warning('后端暂未提供「删除贴吧」接口（DELETE /api/bars/{id}）')
    }
  }
}

onMounted(load)
</script>

<style scoped>
.text-muted {
  color: #c0c4cc;
  font-size: 12px;
}
</style>

