export const 日期格式 = 'YYYY-MM-DD HH:mm:ss'

const 补零 = 值 => 值.padStart(2, '0')

// 返回规范化的日期文字，以及把它当作 UTC 墙钟时间得到的毫秒数；非法日期返回 undefined。
export function 解析日期(输入) {
  const 匹配 = String(输入 ?? '')
    .trim()
    .match(/^(\d{4})([-/])(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/)
  if (!匹配) return

  const [, 年, , 月, 日, 时, 分, 秒] = 匹配
  const 字段 = [年, 月, 日, 时, 分, 秒].map(Number)
  // Date.UTC 会把 0–99 年映射到 1900 年代，年份须用 setUTCFullYear 设置。
  const 日期 = new Date(0)
  日期.setUTCFullYear(字段[0], 字段[1] - 1, 字段[2])
  日期.setUTCHours(字段[3], 字段[4], 字段[5])
  const 回读 = [
    日期.getUTCFullYear(),
    日期.getUTCMonth() + 1,
    日期.getUTCDate(),
    日期.getUTCHours(),
    日期.getUTCMinutes(),
    日期.getUTCSeconds()
  ]
  // 越界字段会被 Date 进位，回读不一致即为非法；纪元记法中没有 0 年。
  if (字段[0] < 1 || 回读.some((值, 序) => 值 !== 字段[序])) return

  return {
    文字: `${年}-${补零(月)}-${补零(日)} ${补零(时)}:${补零(分)}:${补零(秒)}`,
    墙钟毫秒: 日期.getTime()
  }
}

export function 格式化时区日期(毫秒, 时区) {
  const 格式器 = new Intl.DateTimeFormat('en-US', {
    timeZone: 时区,
    era: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'longOffset'
  })
  const { era, year, month, day, hour, minute, second, timeZoneName } =
    Object.fromEntries(
      格式器.formatToParts(毫秒).map(({ type, value }) => [type, value])
    )

  return {
    文字: `${era === 'BC' ? '公元前 ' : ''}${year.padStart(4, '0')}-${month}-${day} ${hour}:${minute}:${second}`,
    utc偏移:
      timeZoneName === 'GMT' ? 'UTC+00:00' : timeZoneName.replace('GMT', 'UTC')
  }
}

function 取时区偏移(毫秒, 时区) {
  const 名称 = new Intl.DateTimeFormat('en-US', {
    timeZone: 时区,
    timeZoneName: 'longOffset'
  })
    .formatToParts(毫秒)
    .find(part => part.type === 'timeZoneName')?.value
  const 匹配 = 名称?.match(/^GMT([+-])(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!匹配) return 0
  return (
    (匹配[1] === '-' ? -1 : 1) *
    (Number(匹配[2]) * 3600 + Number(匹配[3]) * 60 + Number(匹配[4] ?? 0))
  )
}

// 枚举墙钟时间在某时区对应的所有瞬时：0 个表示该当地时间不存在，
// 2 个表示夏令时回拨后出现两次。dayjs.tz 对后者的取舍随运行季节漂移，故自行解析。
export function 解析时区日期({ 文字, 墙钟毫秒 }, 时区) {
  // 探测墙钟时间前后各两天的偏移，覆盖转换前后的两种偏移。
  const 偏移集合 = new Set(
    [墙钟毫秒 - 48 * 3600_000, 墙钟毫秒, 墙钟毫秒 + 48 * 3600_000].map(毫秒 =>
      取时区偏移(毫秒, 时区)
    )
  )

  const 候选 = []
  for (const 秒 of 偏移集合) {
    const 瞬时 = 墙钟毫秒 - 秒 * 1000
    const 结果 = 格式化时区日期(瞬时, 时区)
    if (结果.文字 === 文字) {
      候选.push({ 毫秒: 瞬时, 偏移秒: 秒, utc偏移: 结果.utc偏移 })
    }
  }
  候选.sort((a, b) => a.毫秒 - b.毫秒)
  return 候选
}
