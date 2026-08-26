export function 读取持久化(键, 回退) {
  if (window.utools?.dbStorage) {
    const 值 = window.utools.dbStorage.getItem(键)
    return 值 ?? 回退
  }
  const 原始 = localStorage.getItem(键)
  if (原始 == null) return 回退
  try {
    return JSON.parse(原始)
  } catch {
    return 回退
  }
}

export function 写入持久化(键, 值) {
  if (window.utools?.dbStorage) {
    window.utools.dbStorage.setItem(键, 值)
    return
  }
  localStorage.setItem(键, JSON.stringify(值))
}
