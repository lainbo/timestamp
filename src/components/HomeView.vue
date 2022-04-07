<template>
  <div
    class="contain w-screen h-screen flex flex-col items-center pt-32px bg-white dark:bg-dark-300"
  >
    <div
      class="p-32px pt-16px rounded-8px shadow-xl w-11/12 min-w-500px dark:shadow-black dark:shadow-lg"
    >
      <div class="mb-16px flex justify-between items-center">
        <div class="space-x-10px">
          <a-radio-group
            v-model="timeType"
            @change="changeRadio"
            type="button"
            size="large"
          >
            <a-radio value="ms">毫秒</a-radio>
            <a-radio value="s">秒</a-radio>
          </a-radio-group>
          <a-select
            size="large"
            v-model:model-value="timeZone"
            :style="{ width: '235px' }"
            placeholder="请选择时区"
            allow-search
          >
            <a-option
              v-for="item in timezoneData"
              :key="item.value"
              :label="item.code"
              :value="item.value"
            >
            </a-option>
          </a-select>
          <span class="inline-block">
            <a-popover title="注意">
              <icon-exclamation-circle class="text-16px cursor-pointer " />
              <template #content>
                <p>时间戳→日期 操作中会根据对应国家是否执行夏令时</p>
                <p>自动进行转换，以转换结果为准，并不是普通的对时</p>
                <p>间进行加减</p>
              </template>
            </a-popover>
          </span>
        </div>
        <a-switch type="round" @change="changeTheme" v-model="pageIsDark">
          <template #checked>🌙</template>
          <template #unchecked>☀️</template>
        </a-switch>
      </div>

      <div class="flex flex-col items-center justify-center">
        <a-form :model="formData" auto-label-width layout="vertical">
          <a-form-item label="日期 → 时间戳：">
            <a-date-picker
              :style="{ width: '345px' }"
              v-model="formData.date"
              show-time
              :time-picker-props="{
                defaultValue: dayjs().startOf('day'),
              }"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <a-tooltip content="点击复制" position="top" mini>
              <span
                class="inline-block ml-16px cursor-pointer font-bold text-16px dark:text-white"
                v-clipboard:copy="timeStampText"
                v-clipboard:success="onCopy"
              >
                {{ timeStampText || '-' }}
              </span>
            </a-tooltip>
          </a-form-item>

          <a-divider></a-divider>

          <a-form-item :label="`时间戳 → 日期：(${timeZoneText})`">
            <a-input
              ref="timeInputRef"
              v-model="formData.time"
              placeholder="请输入时间戳"
              allow-clear
              :style="{ width: '345px' }"
            />
            <a-tooltip content="点击复制" position="top" mini>
              <span
                class="inline-block ml-16px cursor-pointer font-bold text-16px dark:text-white"
                v-clipboard:copy="timeText"
                v-clipboard:success="onCopy"
              >
                {{ timeText || '-' }}
              </span>
            </a-tooltip>
          </a-form-item>

          <a-divider></a-divider>

          <a-form-item :label="`当前时间戳${btnIsStop ? '（已暂停）' : ''}：`">
            <div class="flex justify-between flex-1">
              <div class="space-x-8px flex items-center">
                <div class="w-135px">
                  <a-tooltip content="点击复制" position="bottom" mini>
                    <span
                      class="cursor-pointer transition-all dynamic_timestamp inline-block dark:text-white"
                      :class="{
                        'text-blue-600 font-bold text-16px dark:text-white': btnIsStop,
                      }"
                      v-clipboard:copy="timeStamp"
                      v-clipboard:success="onCopy"
                    >
                      {{ timeStamp }}
                    </span>
                  </a-tooltip>
                </div>

                <a-button
                  type="text"
                  :status="btnIsStop ? 'success' : 'danger'"
                  @click="stopTimer"
                >
                  <template #icon>
                    <icon-play-arrow-fill v-if="btnIsStop" />
                    <icon-pause v-else />
                  </template>
                  <template #default>
                    {{ btnIsStop ? '继续' : '暂停' }}
                  </template>
                </a-button>
              </div>
              <div>
                <a-popconfirm
                  content-class="w-250px"
                  content="单位、时区、页面数据将恢复为初始值，确定吗？"
                  position="tr"
                  @ok="resetData"
                >
                  <a-button size="small">
                    <template #icon>
                      <icon-refresh />
                    </template>
                    <template #default>
                      清空数据
                    </template>
                  </a-button>
                </a-popconfirm>
              </div>
            </div>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { TimezoneData } from '@/assets/timezone/TimezoneData.js'
import { Message } from '@arco-design/web-vue'
import {
  IconPause,
  IconPlayArrowFill,
  IconExclamationCircle,
  IconRefresh,
} from '@arco-design/web-vue/es/icon'

const timeZone = useStorage('defaultTimeZone', 'Asia/Shanghai') // 默认时区
const timezoneData = ref(TimezoneData) // 时区数据

// 返回对应时区文字
const timeZoneText = computed(() => {
  return TimezoneData.find(
    item => item.value === timeZone.value
  ).code?.substring(12)
})

// 重置数据
const resetData = () => {
  formData.date = ''
  formData.time = undefined
  timeType.value = 'ms'
  timeZone.value = 'Asia/Shanghai'
}

const pageIsDark = ref(false) // 开关绑定值
// 手动切换主题
const changeTheme = val => {
  val ? setThemeDark() : setThemeLight()
}

const timeStamp = ref(0) // 底部动态时间戳
const timeType = useStorage('defaultUnit', 'ms') // 单选框值，默认毫秒

// 日期 → 时间戳后面的文字
const timeStampText = computed(() => {
  // 毫秒下的时间戳字符串
  if (!formData?.date) return '-'

  const msText = dayjs(formData.date)
    .tz(timeZone.value)
    .valueOf()

  // 秒下的时间戳字符串
  const sText = dayjs(formData.date)
    .tz(timeZone.value)
    .unix()

  return timeType.value === 'ms' ? msText : sText
})

// 时间戳 → 日期后面的文字
const timeText = computed(() => {
  const time = parseInt(formData.time)
  if (isNaN(time) || time < 0) return '-'

  // 毫秒单位的日期字符串
  const msDateText = dayjs(time)
    .tz(timeZone.value)
    .format('YYYY-MM-DD HH:mm:ss')

  // 秒单位的日期字符串
  const sDateText = dayjs
    .unix(time)
    .tz(timeZone.value)
    .format('YYYY-MM-DD HH:mm:ss')

  return timeType.value === 'ms' ? msDateText : sDateText
})

// 两个输入框
const formData = reactive({
  date: '', // 日期
  time: undefined, // 时间戳
})

onMounted(() => {
  init()
  utoolsSetTheme()
  if (!window?.utools) return
  utoolsInit()
})

const timer = ref(null) // 动态时间戳定时器
const btnIsStop = ref(false) // 按钮状态，是否停止
// 开始/停止按钮
const stopTimer = () => {
  if (timer.value) {
    btnIsStop.value = true
    clearInterval(timer.value)
    timer.value = null
  } else {
    btnIsStop.value = false
    init()
  }
}

// 页面数据初始化，并开始定时器
const init = () => {
  calctimeStamp()
  timer.value = setInterval(() => {
    calctimeStamp()
  }, 100)
}

// utools数据初始化
const timeInputRef = ref(null) // 文本输入框的dom
const utoolsInit = () => {
  window.utools.onPluginEnter(({ type, payload }) => {
    if (type === 'regex' && !!payload) {
      formData.time = parseInt(payload) || 0
      timeInputRef.value.focus()
    }
  })
  window.utools.subInputBlur()
}

const isDark = useDark() // 响应式：是否为暗色
// 监听是否暗色
watch(isDark, () => utoolsSetTheme())
const htmlDom = document.documentElement // html的dom

// 切换为深色
const setThemeDark = () => {
  pageIsDark.value = true
  htmlDom.classList.remove('light')
  htmlDom.classList.add('dark')
  document.body.setAttribute('arco-theme', 'dark')
}

// 切换为浅色
const setThemeLight = () => {
  pageIsDark.value = false
  htmlDom.classList.remove('dark')
  htmlDom.classList.add('light')
  document.body.removeAttribute('arco-theme')
}

// utools主题初始化
const utoolsSetTheme = () => {
  isDark.value ? setThemeDark() : setThemeLight()
}

// 切换单选，重新渲染底部动态时间戳的显示
const changeRadio = val => {
  localStorage.setItem('defaultUnit', val)
  btnIsStop.value ? calcStaticStamp() : calctimeStamp()
}

// 计算底部动态时间戳的值
const calctimeStamp = () => {
  // 毫秒时间戳文字
  const msText = String(
    dayjs()
      .tz(timeZone.value)
      .valueOf()
  )
    .substring(0, 10)
    .padEnd(13, '0')

  // 秒时间戳文字
  const sText = String(
    dayjs()
      .tz(timeZone.value)
      .unix()
  )
  timeStamp.value = timeType.value === 'ms' ? msText : sText
}

// 计算暂停时，底部动态时间戳的值
// 因为是暂停的，所以不需要dayjs，切割字符串即可
const calcStaticStamp = () => {
  // 毫秒时间戳文字
  const msText = String(timeStamp.value)
    .substring(0, 10)
    .padEnd(13, '0')

  // 秒时间戳文字
  const sText = String(timeStamp.value).substring(0, 10)
  timeStamp.value = timeType.value === 'ms' ? msText : sText
}

// 复制成功的提示
const onCopy = () => {
  Message.success({ content: '复制成功', duration: 900 })
}
</script>

<style lang="scss" scoped>
.dynamic_timestamp {
  // 等宽数字
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
</style>
