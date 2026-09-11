import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// ===========================================================================
// 贴吧社区后台管理（bbs-admin-web）—— 仅适配 PC 浏览器
//   1. 没有引入任何移动端适配（无 postcss-px-to-viewport / rem 适配脚本）
//   2. @ 指向 src，方便跨层级引用
//   3. dev 环境把 /api（接口）与 /uploads（帖子图片）代理到 FastAPI，
//      这样浏览器同源访问，不依赖后端 CORS，也不会出现跨域预检问题
//   4. 生产环境：base 取 VITE_BASE_PATH（部署在域名根目录就是 /），
//      接口地址取 VITE_API_BASE（指向 Render 上的后端）
// ===========================================================================
export default defineConfig(({ mode }) => {
  // 读取 .env.[mode] 里的变量（VITE_ 前缀）
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || '/'

  return {
    base: basePath,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: '127.0.0.1',
      // 默认端口故意避开 5173：HBuilderX 运行 uni-app 到浏览器时占用的就是 5173，
      // 冲突会导致本后台被挤到 5174（见 README 常见问题）。端口被占时会自动往后找。
      port: 5180,
      // 不自动打开浏览器（想自动打开改成 true 即可）
      open: false,
      proxy: {
        '/api': {
          target: env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true
        },
        '/uploads': {
          target: env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      // Element Plus 全量引入后单包较大，放宽告警阈值
      chunkSizeWarningLimit: 1500
    }
  }
})
