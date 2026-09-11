<template>
  <div class="page-card">
    <el-tabs v-model="activeTab">
      <!-- ================= Tab1：全部评论 ================= -->
      <el-tab-pane label="全部评论" name="all">
        <el-alert
          v-if="allMissing"
          class="gap-alert"
          type="warning"
          show-icon
          :closable="false"
          title="后端暂未提供「全部评论」接口"
          description="本标签页需要后端新增 GET /api/admin/comments?page&pageSize&postId&keyword（返回统一分页结构）以及 DELETE /api/comments/{id}（删除违规评论）。契约见 src/api/comment.js 与 README 的「接口缺口清单」；补齐后前端无需改动。"
        />

        <div class="toolbar">
          <el-input
            v-model="allQuery.keyword"
            placeholder="评论内容 / 作者关键字"
            clearable
            style="width: 240px"
            @keyup.enter="handleAllSearch"
          />
          <el-button type="primary" :icon="Search" @click="handleAllSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleAllReset">重置</el-button>
          <div class="toolbar-right">
            <el-button :icon="RefreshRight" :loading="allLoading" @click="loadAll">刷新</el-button>
          </div>
        </div>

        <el-table :data="allList" v-loading="allLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="text" label="评论内容" min-width="260" show-overflow-tooltip />
          <el-table-column label="所属帖子" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.postId">#{{ row.postId }} {{ row.postTitle || '' }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="author" label="作者" width="120" show-overflow-tooltip />
          <el-table-column prop="likes" label="点赞" width="80" align="center" />
          <el-table-column label="评论时间" width="170">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="danger" @click="handleRemoveComment(row, 'all')">删除</el-button>
            </template>
          </el-table-column>
          <template #empty>暂无评论数据（或后端接口待提供）</template>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="allQuery.page"
            v-model:page-size="allQuery.pageSize"
            :page-sizes="PAGE_SIZE_OPTIONS"
            :total="allTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadAll"
            @current-change="loadAll"
          />
        </div>
      </el-tab-pane>

      <!-- ================= Tab2：按帖子查看（后端已有接口） ================= -->
      <el-tab-pane label="按帖子查看" name="byPost">
        <div class="toolbar">
          <el-select
            v-model="postId"
            filterable
            remote
            clearable
            :remote-method="searchPosts"
            :loading="postLoading"
            placeholder="输入标题关键字搜索帖子"
            style="width: 420px"
            @change="handlePostChange"
          >
            <el-option v-for="p in postOptions" :key="p.id" :label="`#${p.id} ${p.title}`" :value="p.id" />
          </el-select>
          <el-button type="primary" :icon="RefreshRight" :disabled="!postId" @click="loadByPost">
            加载评论
          </el-button>
        </div>

        <el-table :data="postComments" v-loading="postLoading" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="text" label="评论内容" min-width="300" show-overflow-tooltip />
          <el-table-column prop="author" label="作者" width="140" show-overflow-tooltip />
          <el-table-column prop="likes" label="点赞" width="80" align="center" />
          <el-table-column label="评论时间" width="170">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="danger" @click="handleRemoveComment(row, 'post')">删除</el-button>
            </template>
          </el-table-column>
          <template #empty>
            {{ postId ? '该帖子暂无评论' : '请先在上方选择帖子' }}
          </template>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="postQuery.page"
            v-model:page-size="postQuery.pageSize"
            :page-sizes="PAGE_SIZE_OPTIONS"
            :total="postTotal"
            :disabled="!postId"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadByPost"
            @current-change="loadByPost"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// ---------------------------------------------------------------------------
// 评论管理
//   Tab1「全部评论」：GET /api/admin/comments（后端已提供）
//   Tab2「按帖子查看」：GET /api/posts/{postId}/comments（后端已提供）
//   删除评论：DELETE /api/comments/{id}（后端已提供，软删除）
// ---------------------------------------------------------------------------
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, RefreshRight, Search } from '@element-plus/icons-vue'
import { fetchComments, fetchCommentsByPost, removeComment } from '@/api/comment'
import { fetchPosts, fetchPostDetail } from '@/api/post'
import { PAGE_SIZE_OPTIONS } from '@/utils/constants'
import { formatDateTime } from '@/utils/format'

const route = useRoute()
const activeTab = ref('all')

// ============================ Tab1：全部评论 ============================
const allLoading = ref(false)
const allMissing = ref(false)
const allList = ref([])
const allTotal = ref(0)
const allQuery = reactive({ keyword: '', page: 1, pageSize: 10 })

async function loadAll() {
  allLoading.value = true
  try {
    const { data } = await fetchComments({
      page: allQuery.page,
      pageSize: allQuery.pageSize,
      keyword: allQuery.keyword || undefined
    })
    allList.value = data.list || []
    allTotal.value = data.total || 0
    allMissing.value = false
  } catch (e) {
    if (e.missing) {
      allMissing.value = true
      allList.value = []
      allTotal.value = 0
    }
  } finally {
    allLoading.value = false
  }
}

function handleAllSearch() {
  allQuery.page = 1
  loadAll()
}

function handleAllReset() {
  allQuery.keyword = ''
  allQuery.page = 1
  loadAll()
}

// ============================ Tab2：按帖子查看 ============================
const postLoading = ref(false)
const postId = ref(null)
const postOptions = ref([])
const postComments = ref([])
const postTotal = ref(0)
const postQuery = reactive({ page: 1, pageSize: 10 })

/** 远程搜索帖子（标题关键字），最多取 20 条做下拉 */
async function searchPosts(keyword) {
  postLoading.value = true
  try {
    const { data } = await fetchPosts({ page: 1, pageSize: 20, keyword: keyword || undefined })
    postOptions.value = data.list || []
  } catch (e) {
    postOptions.value = []
  } finally {
    postLoading.value = false
  }
}

/** 加载所选帖子的评论 */
async function loadByPost() {
  if (!postId.value) return
  postLoading.value = true
  try {
    const { data } = await fetchCommentsByPost(postId.value, {
      page: postQuery.page,
      pageSize: postQuery.pageSize
    })
    postComments.value = data.list || []
    postTotal.value = data.total || 0
  } catch (e) {
    postComments.value = []
    postTotal.value = 0
  } finally {
    postLoading.value = false
  }
}

function handlePostChange() {
  postQuery.page = 1
  loadByPost()
}

/** 确保下拉里有当前选中的帖子（从帖子管理页带 postId 跳转过来时用） */
async function ensurePostOption(id) {
  if (postOptions.value.some((p) => p.id === id)) return
  try {
    const { data } = await fetchPostDetail(id)
    if (data) postOptions.value = [{ id: data.id, title: data.title }, ...postOptions.value]
  } catch (e) {
    /* 帖子可能已被删除，忽略即可 */
  }
}

// ============================ 删除违规评论 ============================
async function handleRemoveComment(row, from) {
  try {
    await ElMessageBox.confirm(
      `确定删除该评论吗？\n「${row.text}」`,
      '危险操作',
      { type: 'error', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }

  try {
    await removeComment(row.id)
    ElMessage.success('已删除')
    if (from === 'all') {
      loadAll()
    } else {
      loadByPost()
    }
  } catch (e) {
    if (e.missing) {
      ElMessage.warning('后端暂未提供「删除评论」接口（DELETE /api/comments/{id}）')
    }
  }
}

onMounted(async () => {
  // 从帖子管理页跳转过来：直接切到「按帖子查看」并预选该帖
  const queryPostId = Number(route.query.postId)
  if (queryPostId) {
    activeTab.value = 'byPost'
    postId.value = queryPostId
    await ensurePostOption(queryPostId)
    await loadByPost()
  }
  loadAll()
})
</script>

