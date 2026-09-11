<template>
  <div class="login-page">
    <div class="login-box">
      <!-- 左侧品牌区（PC 双栏布局） -->
      <div class="login-brand">
        <div class="brand-icon">🏠</div>
        <h1 class="brand-title">贴吧社区</h1>
        <p class="brand-sub">后台管理系统</p>
        <ul class="brand-list">
          <li>用户管理 · 禁用 / 启用账号</li>
          <li>贴吧板块 · 新增 / 编辑 / 删除</li>
          <li>帖子管理 · 列表 / 详情 / 删除</li>
          <li>评论管理 · 违规评论处理</li>
        </ul>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form">
        <h2 class="form-title">管理员登录</h2>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
          label-position="top"
          @keyup.enter="onSubmit"
        >
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" clearable />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="submit-btn" :loading="loading" @click="onSubmit">
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <el-alert type="info" :closable="false">
          <template #default>
            <div>高级管理员：<b>superadmin / super123456</b>（可管理管理员账号）</div>
            <div>普通管理员：<b>admin / admin123456</b></div>
            <div>需先启动后端 <code>bbs-app-backend</code>（默认 127.0.0.1:8000）</div>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: 'admin', password: '' })

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度 2~20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
}

async function onSubmit() {
  // 1) 表单校验
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  // 2) 请求后端登录（token 由 axios 拦截器统一处理 401/错误提示）
  loading.value = true
  try {
    const data = await userStore.login({ username: form.username.trim(), password: form.password })

    // 3) 后台只允许管理员 / 高级管理员进入；普通用户登录成功后立刻退出登录态
    if (!['admin', 'super_admin'].includes(data.user?.role)) {
      userStore.logout()
      ElMessage.error('该账号不是管理员，无法进入后台')
      return
    }

    ElMessage.success(`欢迎回来，${data.user.nickname || data.user.username}`)
    // 支持登录后回到原页面（守卫里记录的 redirect）
    router.replace(route.query.redirect || '/dashboard')
  } catch (e) {
    // 错误提示已在 axios 响应拦截器里统一处理，这里只需结束 loading
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f2d3d 0%, #2b4a63 60%, #1296db 100%);
}

.login-box {
  width: 820px;
  height: 440px;
  display: flex;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

/* 左侧品牌 */
.login-brand {
  width: 340px;
  padding: 48px 32px;
  color: #fff;
  background: linear-gradient(160deg, #1296db, #0f7bb4);
}

.brand-icon {
  font-size: 44px;
}

.brand-title {
  margin: 16px 0 4px;
  font-size: 28px;
  letter-spacing: 2px;
}

.brand-sub {
  margin: 0 0 28px;
  opacity: 0.85;
}

.brand-list {
  margin: 0;
  padding-left: 18px;
  line-height: 2;
  font-size: 13px;
  opacity: 0.9;
}

/* 右侧表单 */
.login-form {
  flex: 1;
  padding: 48px 40px;
}

.form-title {
  margin: 0 0 24px;
  font-size: 22px;
  color: #303133;
}

.submit-btn {
  width: 100%;
  letter-spacing: 4px;
}
</style>
