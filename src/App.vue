<template>
  <!-- 根组件：只承载路由出口，整体布局（侧边菜单 + 顶栏）在 src/layout/index.vue -->
  <router-view />
</template>

<script setup>
// 无需额外逻辑：登录页与后台页面的切换由路由与 src/router/index.js 的守卫控制
</script>
