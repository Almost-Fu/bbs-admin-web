<template>
  <!-- 帖子详情弹窗：打开时请求 GET /api/posts/{id}（后端会顺手把浏览量 +1） -->
  <el-dialog
    :model-value="modelValue"
    title="帖子详情"
    width="760px"
    top="6vh"
    @update:model-value="close"
  >
    <div v-loading="loading">
      <template v-if="post.id">
        <h3 class="post-title">{{ post.title }}</h3>

        <div class="post-meta">
          <el-tag size="small" effect="plain">{{ post.barName }}</el-tag>
          <el-tag v-if="post.tag" size="small" type="info" effect="plain">{{ post.tag }}</el-tag>
          <span class="meta-item">{{ post.authorAvatar }} {{ post.author }}</span>
          <span class="meta-item">{{ formatDateTime(post.createdAt) }}</span>
        </div>

        <el-descriptions :column="4" border size="small" class="post-stats">
          <el-descriptions-item label="帖子ID">{{ post.id }}</el-descriptions-item>
          <el-descriptions-item label="点赞">{{ post.likes }}</el-descriptions-item>
          <el-descriptions-item label="评论">{{ post.commentCount }}</el-descriptions-item>
          <el-descriptions-item label="浏览">{{ post.views }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-label">正文</div>
        <div class="post-content">{{ post.content }}</div>

        <template v-if="post.images && post.images.length">
          <div class="section-label">配图（{{ post.images.length }} 张，最多 9 张）</div>
          <div class="image-list">
            <el-image
              v-for="(img, index) in post.images"
              :key="index"
              class="detail-image"
              :src="resolveImageUrl(img)"
              :preview-src-list="previewList"
              :initial-index="index"
              preview-teleported
              fit="cover"
            />
          </div>
        </template>
      </template>
    </div>

    <template #footer>
      <el-button @click="close(false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchPostDetail } from '@/api/post'
import { formatDateTime, resolveImageUrl } from '@/utils/format'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  postId: { type: [Number, String], default: null }
})
const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const post = ref({})

// 预览大图列表（需要带前缀，见 utils/format.js）
const previewList = computed(() => (post.value.images || []).map(resolveImageUrl))

// 弹窗每次打开都重新拉取详情，保证数据最新
watch(
  () => [props.modelValue, props.postId],
  async ([visible, id]) => {
    if (!visible || !id) return
    loading.value = true
    post.value = {}
    try {
      const { data } = await fetchPostDetail(id)
      post.value = data || {}
    } catch (e) {
      ElMessage.error('加载帖子详情失败')
    } finally {
      loading.value = false
    }
  }
)

function close(visible = false) {
  emit('update:modelValue', visible)
}
</script>

<style scoped>
.post-title {
  margin: 0 0 12px;
  font-size: 18px;
  color: #303133;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #606266;
  font-size: 13px;
  margin-bottom: 14px;
}

.post-stats {
  margin-bottom: 16px;
}

.section-label {
  font-weight: 600;
  color: #303133;
  margin: 12px 0 8px;
}

.post-content {
  background: #f7f8fa;
  border-radius: 6px;
  padding: 12px;
  line-height: 1.7;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-image {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}
</style>
