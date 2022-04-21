const bodyDom = document.body // body的dom
const isDark = useDark() // 响应式：是否为暗色

export const pageIsDark = ref(false) // 开关绑定值
/**
 * 设置主题
 * @param {Boolean} val true: 深色，false: 浅色
 */
export function setTheme(val) {
  pageIsDark.value = val
  document.documentElement.classList.toggle('dark', val)
  val
    ? bodyDom.setAttribute('arco-theme', 'dark')
    : bodyDom.removeAttribute('arco-theme')
}

// 监听是否暗色
watchEffect(() => {
  setTheme(isDark.value)
})
