import dayjs from 'dayjs'

export const 日期格式 = 'YYYY-MM-DD HH:mm:ss'

export function 规范化日期(输入) {
  const 匹配 = String(输入 ?? '')
    .trim()
    .match(/^(\d{4})([-/])(\d{1,2})\2(\d{1,2}) (\d{2}:\d{2}:\d{2})$/)
  if (!匹配) return ''

  const [, 年, , 月, 日, 时间] = 匹配
  const 文字 = `${年}-${月.padStart(2, '0')}-${日.padStart(2, '0')} ${时间}`

  // UTC 仅用于校验日历字段，避免系统夏令时改写输入。
  return dayjs.utc(文字, 日期格式, true).isValid() ? 文字 : ''
}

export function 格式化时区日期(毫秒, 时区) {
  const 格式器 = new Intl.DateTimeFormat('en-US', {
    timeZone: 时区,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'longOffset'
  })
  const { year, month, day, hour, minute, second, timeZoneName } =
    Object.fromEntries(
      格式器.formatToParts(毫秒).map(({ type, value }) => [type, value])
    )

  return {
    文字: `${year.padStart(4, '0')}-${month}-${day} ${hour}:${minute}:${second}`,
    utc偏移:
      timeZoneName === 'GMT' ? 'UTC+00:00' : timeZoneName.replace('GMT', 'UTC')
  }
}
