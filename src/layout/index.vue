<template>
  <el-container class="admin-layout">
    <!-- ============ 左侧菜单 ============ -->
    <el-aside width="220px" class="aside">
      <div class="logo">
        <span class="logo-icon">🏠</span>
        <span class="logo-text">贴吧社区后台</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1f2d3d"
        text-color="#c0c4cc"
        active-text-color="#66b1ff"
      >
        <el-menu-item v-for="item in visibleMenus" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- ============ 顶栏 ============ -->
      <el-header class="header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>后台管理</el-breadcrumb-item>
          <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
        </el-breadcrumb>

        <div class="header-right">
          <!-- 后端连接状态：调 /api/health，db=false 也提示（通常是 MySQL 没起） -->
          <el-tag v-if="backendState === 'ok'" type="success" effect="plain" size="small">
            后端已连接
          </el-tag>
          <el-tag v-else-if="backendState === 'db-error'" type="warning" effect="plain" size="small">
            后端已连接，数据库异常
          </el-tag>
          <el-tag v-else-if="backendState === 'offline'" type="danger" effect="plain" size="small">
            后端未连接
          </el-tag>

          <el-dropdown @command="onCommand">
            <span class="user">
              <span class="avatar">{{ userStore.avatar }}</span>
              <span class="name">{{ userStore.displayName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  账号：{{ userStore.user?.username || '-' }}
                </el-dropdown-item>
                <el-dropdown-item disabled>
                  角色：{{ userStore.roleText }}
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- ============ 内容区 ============ -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getHealth } from '@/api/system'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 左侧菜单：path 与路由表保持一致（el-menu 配 router 属性后点击即跳转）
// superAdmin: true 表示仅高级管理员可见
const menus = [
  { path: '/dashboard', title: '概览', icon: 'Odometer' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/bars', title: '贴吧板块', icon: 'Grid' },
  { path: '/posts', title: '帖子管理', icon: 'Document' },
  { path: '/comments', title: '评论管理', icon: 'ChatDotRound' },
  { path: '/admins', title: '管理员管理', icon: 'Avatar', superAdmin: true }
]

// 按当前账号角色过滤菜单
const visibleMenus = computed(() =>
  menus.filter((item) => !item.superAdmin || userStore.isSuperAdmin)
)

// 当前高亮菜单：/posts 之类直接用 path 匹配即可
const activeMenu = computed(() => route.path)

// 后端连接状态：ok / db-error / offline / unknown
const backendState = ref('unknown')

async function checkBackend() {
  try {
    const { data } = await getHealth()
    backendState.value = data?.db ? 'ok' : 'db-error'
  } catch (e) {
    backendState.value = 'offline'
  }
}

onMounted(checkBackend)

async function onCommand(command) {
  if (command !== 'logout') return
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消'
    })
  } catch (e) {
    return // 用户点了取消
  }
  userStore.logout()
  ElMessage.success('已退出登录')
  router.replace('/login')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

/* 左侧菜单 */
.aside {
  background: #1f2d3d;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-icon {
  font-size: 20px;
  margin-right: 8px;
}

.aside :deep(.el-menu) {
  border-right: none;
}

/* 顶栏 */
.header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user {
  display: flex;
  align-items: center;
  cursor: pointer;
  outline: none;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ecf5ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 16px;
}

.name {
  margin-right: 4px;
  color: #303133;
}

/* 内容区 */
.main {
  background: #f0f2f5;
  padding: 16px;
  overflow-y: auto;
}
</style>
