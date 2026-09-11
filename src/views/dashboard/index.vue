<template>
  <div>
    <!-- ============ 统计卡片 ============ -->
    <el-row :gutter="16">
      <el-col v-for="card in cards" :key="card.key" :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-body">
            <div class="stat-icon" :style="{ background: card.bg, color: card.color }">
              <el-icon :size="22"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-text">
              <div class="stat-label">{{ card.label }}</div>
              <div v-if="card.available" class="stat-value">{{ card.value }}</div>
              <div v-else class="stat-value gap">
                <el-tooltip content="统计接口暂时不可用（请检查后端服务是否已就绪）" placement="top">
                  <span>接口待提供</span>
                </el-tooltip>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt16">
      <!-- ============ 后端服务状态 ============ -->
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>后端服务状态</span>
              <el-button link type="primary" :loading="loading" @click="loadAll">刷新</el-button>
            </div>
          </template>

          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="接口地址">{{ apiBase }}</el-descriptions-item>
            <el-descriptions-item label="服务">{{ health.service || '-' }}</el-descriptions-item>
            <el-descriptions-item label="接口连通">
              <el-tag :type="health.reachable ? 'success' : 'danger'" size="small" effect="plain">
                {{ health.reachable ? '正常' : '不可用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="数据库">
              <el-tag :type="health.db ? 'success' : 'danger'" size="small" effect="plain">
                {{ health.db ? '已连接' : '未连接' }}
              </el-tag>
              <span v-if="!health.db" class="db-msg">{{ health.dbMessage }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="服务器时间">{{ health.time || '-' }}</el-descriptions-item>
          </el-descriptions>

          <el-alert
            v-if="health.reachable === false"
            class="mt12"
            type="error"
            :closable="false"
            show-icon
            title="无法连接后端服务"
            description="请先启动 bbs-app-backend：在该目录执行 .venv\Scripts\python.exe main.py（默认 http://127.0.0.1:8000）"
          />
        </el-card>
      </el-col>

      <!-- ============ 最新帖子 ============ -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>最新帖子</span>
              <el-button link type="primary" @click="router.push('/posts')">前往帖子管理</el-button>
            </div>
          </template>

          <el-table :data="latestPosts" v-loading="loading" size="small" border height="286">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column prop="barName" label="所属吧" width="110" />
            <el-table-column prop="author" label="作者" width="100" />
            <el-table-column prop="likes" label="点赞" width="70" align="center" />
            <el-table-column prop="commentCount" label="评论" width="70" align="center" />
            <el-table-column prop="time" label="时间" width="96" />
            <template #empty>暂无数据</template>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getHealth } from '@/api/system'
import { fetchBars } from '@/api/bar'
import { fetchPosts } from '@/api/post'
import { fetchUsers } from '@/api/user'
import { fetchComments } from '@/api/comment'

const router = useRouter()
const loading = ref(false)
const apiBase = import.meta.env.VITE_API_BASE || '/api'

// 统计数字：available=false 表示接口暂时不可用（多为后端未就绪），卡片显示占位提示
const stats = reactive({
  barCount: { value: 0, available: false },
  postCount: { value: 0, available: false },
  userCount: { value: 0, available: false },
  commentCount: { value: 0, available: false }
})

const health = reactive({ reachable: null, service: '', db: false, dbMessage: '', time: '' })
const latestPosts = ref([])

const cards = computed(() => [
  { key: 'bar', label: '贴吧板块数', icon: 'Grid', bg: '#ecf5ff', color: '#409eff', ...stats.barCount },
  { key: 'post', label: '帖子总数', icon: 'Document', bg: '#f0f9eb', color: '#67c23a', ...stats.postCount },
  { key: 'user', label: '用户总数', icon: 'User', bg: '#fdf6ec', color: '#e6a23c', ...stats.userCount },
  { key: 'comment', label: '评论总数', icon: 'ChatDotRound', bg: '#fef0f0', color: '#f56c6c', ...stats.commentCount }
])

/** 通用取数：接口不存在（404/405）时只把 available 置 false，不弹错误提示 */
async function loadStat(target, loader) {
  try {
    target.value = await loader()
    target.available = true
  } catch (e) {
    target.available = false
  }
}

async function loadAll() {
  loading.value = true

  // 1) 后端连通性（/api/health）
  try {
    const { data } = await getHealth()
    Object.assign(health, { reachable: true, ...data })
  } catch (e) {
    Object.assign(health, { reachable: false, service: '', db: false, dbMessage: '', time: '' })
  }

  // 2) 贴吧数：/api/bars 返回数组，取长度
  await loadStat(stats.barCount, async () => (await fetchBars()).data.length)

  // 3) 帖子总数：/api/posts 返回分页结构，取 total
  await loadStat(stats.postCount, async () => (await fetchPosts({ page: 1, pageSize: 1 })).data.total)

  // 4) 用户总数 / 评论总数：接口异常时自动降级为占位提示（不影响其它卡片）
  await loadStat(stats.userCount, async () => (await fetchUsers({ page: 1, pageSize: 1 })).data.total)
  await loadStat(stats.commentCount, async () => (await fetchComments({ page: 1, pageSize: 1 })).data.total)

  // 5) 最新 5 篇帖子
  try {
    const { data } = await fetchPosts({ page: 1, pageSize: 5 })
    latestPosts.value = data.list || []
  } catch (e) {
    latestPosts.value = []
  }

  loading.value = false
}

onMounted(loadAll)
</script>

<style scoped>
.stat-card :deep(.el-card__body) {
  padding: 16px;
}

.stat-body {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
}

.stat-label {
  color: #909399;
  font-size: 13px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
}

.stat-value.gap {
  font-size: 14px;
  color: #c0c4cc;
  cursor: help;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mt12 {
  margin-top: 12px;
}

.mt16 {
  margin-top: 16px;
}

.db-msg {
  margin-left: 8px;
  color: #f56c6c;
  font-size: 12px;
}
</style>

