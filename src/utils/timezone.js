import dayjs from 'dayjs'
import TimezoneJson from '@/assets/timezone/TimezoneData.json'
import 时区中文名表 from '@/assets/timezone/TimezoneNames.zh.json'
import { 读取持久化, 写入持久化 } from '@/utils/persist.js'

const 已选存储键 = 'selectedTimeZones'
const 名称覆盖 = Object.fromEntries(TimezoneJson.map(项 => [项.value, 项.name]))

export const 默认已选时区 = TimezoneJson.map(项 => 项.value)

function 运行时区清单() {
  if (
    typeof Intl === 'undefined' ||
    typeof Intl.supportedValuesOf !== 'function'
  ) {
    return []
  }
  return Intl.supportedValuesOf('timeZone')
}

function 时区中文名(id) {
  return 名称覆盖[id] || 时区中文名表[id] || id
}

function 时区偏移(id) {
  try {
    const 实例 = dayjs().tz(id)
    return {
      分钟: 实例.utcOffset(),
      文字: `UTC${实例.format('Z')}`
    }
  } catch {
    return { 分钟: 0, 文字: 'UTC' }
  }
}

export function 构建时区选项() {
  const 集合 = new Set(运行时区清单())
  for (const id of 默认已选时区) 集合.add(id)

  return [...集合]
    .map(id => {
      const { 分钟, 文字 } = 时区偏移(id)
      const name = 时区中文名(id)
      return {
        value: id,
        name,
        utc偏移: 文字,
        分钟,
        label: `${name}（${文字}，${id}）`,
        disabled: false
      }
    })
    .toSorted(
      (a, b) => a.分钟 - b.分钟 || a.label.localeCompare(b.label, 'zh-CN')
    )
}

export function 规范化已选(已选, 合法) {
  if (!Array.isArray(已选)) return [...默认已选时区]
  const 结果 = 已选.filter(id => 合法.has(id))
  return 结果.length ? 结果 : [...默认已选时区]
}

export function 回退当前时区(已选, 当前) {
  if (已选.includes(当前)) return 当前
  if (已选.includes('Asia/Shanghai')) return 'Asia/Shanghai'
  return 已选[0]
}

export function 读取已选时区(合法) {
  return 规范化已选(读取持久化(已选存储键, 默认已选时区), 合法)
}

export function 写入已选时区(已选) {
  写入持久化(已选存储键, 已选)
}
