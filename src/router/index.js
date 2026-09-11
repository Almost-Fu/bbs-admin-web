// ---------------------------------------------------------------------------
// 路由表 + 全局守卫
//   - 所有后台页面都要求「已登录 + 管理员角色」(后端管理接口同样校验 role=admin)
//   - 页面组件用动态 import，按需加载
// ---------------------------------------------------------------------------
import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '管理员登录', public: true }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '概览' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/index.vue'),
        meta: { title: '用户管理' }
      },
      {
        // 管理员账号管理：仅高级管理员可见/可进（meta.superAdmin 由路由守卫校验）
        path: 'admins',
        name: 'Admins',
        component: () => import('@/views/admins/index.vue'),
        meta: { title: '管理员管理', superAdmin: true }
      },
      {
        path: 'bars',
        name: 'Bars',
        component: () => import('@/views/bars/index.vue'),
        meta: { title: '贴吧板块管理' }
      },
      {
        path: 'posts',
        name: 'Posts',
        component: () => import('@/views/posts/index.vue'),
        meta: { title: '帖子管理' }
      },
      {
        path: 'comments',
        name: 'Comments',
        component: () => import('@/views/comments/index.vue'),
        meta: { title: '评论管理' }
      }
    ]
  },
  // 兜底：未匹配到的地址回概览页
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  // BASE_URL 来自 vite 的 base 配置（VITE_BASE_PATH）：
  // 部署在域名根目录时是 "/"，部署在子路径（如 /admin/）时自动带上前缀，
  // 这样前端路由与静态资源路径都不会错位。
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  document.title = `${to.meta.title || '后台'} · 贴吧社区后台管理`

  const store = useUserStore()

  // 登录页：已登录的管理员直接进后台
  if (to.meta.public) {
    return store.isLogin && store.isAdmin ? { path: '/' } : true
  }

  // 未登录 → 去登录页，并记住来源地址
  if (!store.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 非管理员账号：不允许进入后台（清掉登录态，避免反复跳转）
  if (!store.isAdmin) {
    store.logout()
    ElMessage.error('该账号不是管理员，无法进入后台')
    return { path: '/login' }
  }

  // 需要「高级管理员」的页面（管理员账号管理）：普通管理员直接拦回概览页
  if (to.meta.superAdmin && !store.isSuperAdmin) {
    ElMessage.error('只有高级管理员才能访问「管理员管理」')
    return { path: '/dashboard' }
  }

  return true
})

export default router
