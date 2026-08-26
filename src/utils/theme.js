import { useColorMode } from '@vueuse/core'
import { ref, watch } from 'vue'

const 存储键 = 'defaultTheme'
const 合法主题 = new Set(['auto', 'light', 'dark'])

function 读取主题偏好() {
  const 原始 = window.utools?.dbStorage
    ? window.utools.dbStorage.getItem(存储键)
    : localStorage.getItem(存储键)
  return 合法主题.has(原始) ? 原始 : 'auto'
}

export const 主题选项 = [
  {
    value: 'auto',
    label: '自动',
    icon: 'i-fluent-dark-theme-24-filled'
  },
  {
    value: 'dark',
    label: '深色',
    icon: 'i-ph-moon-bold'
  },
  {
    value: 'light',
    label: '浅色',
    icon: 'i-ph-sun-bold'
  }
]

export const 主题偏好 = ref(读取主题偏好())

watch(主题偏好, 值 => {
  if (window.utools?.dbStorage) {
    window.utools.dbStorage.setItem(存储键, 值)
    return
  }
  localStorage.setItem(存储键, 值)
})

useColorMode({
  storageRef: 主题偏好,
  onChanged(mode, defaultHandler) {
    defaultHandler(mode)
    if (mode === 'dark') {
      document.body.setAttribute('arco-theme', 'dark')
      return
    }
    document.body.removeAttribute('arco-theme')
  }
})

export function 同步主题偏好() {
  主题偏好.value = 读取主题偏好()
}
