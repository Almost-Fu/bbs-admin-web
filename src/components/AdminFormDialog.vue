<template>
  <!-- 新增管理员账号弹窗（仅高级管理员可打开） -->
  <el-dialog
    :model-value="modelValue"
    title="新增管理员账号"
    width="540px"
    @update:model-value="close"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" maxlength="20" placeholder="登录用户名（2~20 字符，唯一）" />
      </el-form-item>
      <el-form-item label="初始密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          maxlength="32"
          placeholder="至少 6 位，创建后可在列表里重置"
        />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="form.nickname" maxlength="20" placeholder="选填，留空则用用户名" />
      </el-form-item>
      <el-form-item label="头像" prop="avatar">
        <el-input v-model="form.avatar" maxlength="255" placeholder="/static/avatars/avatar-1.png 或图片地址" />
        <span class="hint">头像图片地址（默认 /static/avatars/default.png，后端 /static/avatars 下内置了 8 张）</span>
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-radio-group v-model="form.role">
          <el-radio v-for="item in ADMIN_ROLE_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-alert
        type="info"
        :closable="false"
        title="普通管理员只能管理贴吧/帖子/评论；高级管理员额外可以管理管理员账号（含本页操作）。"
      />
    </el-form>

    <template #footer>
      <el-button @click="close(false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createAdmin } from '@/api/admin'
import { ADMIN_ROLE_OPTIONS } from '@/utils/constants'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'saved'])

/** 默认头像：后端内置头像图（数据库里存的就是这类图片地址） */
const DEFAULT_AVATAR = '/static/avatars/default.png'

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  avatar: DEFAULT_AVATAR,
  role: 'admin'
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度 2~20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度 6~32 位', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

// 每次打开都复位表单，避免上次输入残留
watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    Object.assign(form, { username: '', password: '', nickname: '', avatar: DEFAULT_AVATAR, role: 'admin' })
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
  try {
    const { message } = await createAdmin({
      username: form.username.trim(),
      password: form.password,
      nickname: form.nickname.trim(),
      avatar: form.avatar.trim() || DEFAULT_AVATAR,
      role: form.role
    })
    ElMessage.success(message || '管理员创建成功')
    close(false)
    emit('saved')
  } catch (e) {
    /* 错误提示已由 axios 拦截器统一处理（如用户名重复会提示 400） */
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
