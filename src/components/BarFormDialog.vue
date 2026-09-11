<template>
  <!-- 新增 / 编辑贴吧弹窗：mode=create 调 POST /api/bars；mode=edit 调 PUT /api/bars/{id} -->
  <el-dialog
    :model-value="modelValue"
    :title="mode === 'create' ? '新增贴吧板块' : '编辑贴吧板块'"
    width="560px"
    @update:model-value="close"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="吧名" prop="name">
        <el-input v-model="form.name" placeholder="如：前端吧" maxlength="32" show-word-limit />
      </el-form-item>
      <el-form-item label="图标" prop="icon">
        <el-input v-model="form.icon" placeholder="emoji，如 💻" maxlength="8" />
        <span class="hint">建议使用单个 emoji（App 端吧卡片直接展示该字符）</span>
      </el-form-item>
      <el-form-item label="吧图" prop="image">
        <el-input v-model="form.image" placeholder="图片地址，如 /uploads/bars/xxx.png（可留空）" />
      </el-form-item>
      <el-form-item label="简介" prop="intro">
        <el-input
          v-model="form.intro"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          placeholder="一句话介绍这个吧"
        />
      </el-form-item>
      <el-form-item label="吧主" prop="owner">
        <el-input v-model="form.owner" placeholder="吧主昵称" maxlength="32" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="form.sort" :min="0" :max="9999" />
        <span class="hint">数值越小越靠前</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="close(false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createBar, updateBar } from '@/api/bar'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  bar: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  name: '',
  icon: '💬',
  image: '',
  intro: '',
  owner: '官方',
  sort: 0
})

const rules = {
  name: [
    { required: true, message: '请输入吧名', trigger: 'blur' },
    { max: 32, message: '吧名最多 32 个字符', trigger: 'blur' }
  ],
  icon: [{ max: 8, message: '图标最多 8 个字符', trigger: 'blur' }]
}

// 打开弹窗时把数据回填（编辑）/ 复位（新增）
watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    const source = props.mode === 'edit' && props.bar ? props.bar : {}
    Object.assign(form, {
      name: source.name || '',
      icon: source.icon || '💬',
      image: source.img || source.image || '',
      intro: source.intro || source.desc || '',
      owner: source.owner || '官方',
      sort: Number(source.sort ?? 0)
    })
    formRef.value?.clearValidate()
  }
)

function close(visible = false) {
  emit('update:modelValue', visible)
}

async function submit() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  submitting.value = true
  const payload = {
    name: form.name.trim(),
    icon: form.icon.trim() || '💬',
    image: form.image.trim() || null,
    intro: form.intro.trim(),
    owner: form.owner.trim() || '官方',
    sort: Number(form.sort) || 0
  }

  try {
    if (props.mode === 'edit') {
      await updateBar(props.bar.id, payload)
      ElMessage.success('保存成功')
    } else {
      await createBar(payload)
      ElMessage.success('新增成功')
    }
    close(false)
    emit('saved')
  } catch (e) {
    if (e.missing) {
      ElMessage.warning('后端暂未提供「编辑贴吧」接口（PUT /api/bars/{id}），请先新增该接口')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.hint {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>
