import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Element Plus 样式（本项目面向 PC 后台，采用全量引入，配置直观、无需按需插件）
import 'element-plus/dist/index.css'
import '@/styles/index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// Element Plus：中文语言包（分页、弹窗按钮等文案）
app.use(ElementPlus, { locale: zhCn, size: 'default' })

// 全局注册所有图标组件，模板中可直接 <el-icon><User /></el-icon>
for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, component)
}

app.use(createPinia())
app.use(router)

app.mount('#app')
