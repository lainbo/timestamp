<template>
  <div
    class="contain w-100vw h-100vh flex flex-col items-center pt-32px bg-white dark:bg-dark-300"
  >
    <div
      class="p-32px pt-16px rounded-8px shadow-xl w-11/12 min-w-500px dark:shadow-black dark:shadow-lg"
    >
      <div class="mb-16px flex justify-between items-center">
        <a-radio-group
          v-model="timeType"
          @change="changeRadio"
          type="button"
          size="large"
        >
          <a-radio value="ms">毫秒</a-radio>
          <a-radio value="s">秒</a-radio>
        </a-radio-group>
        <a-switch type="round" @change="changeTheme" v-model="pageIsDark">
          <template #checked>🌙</template>
          <template #unchecked>☀️</template>
        </a-switch>
      </div>
      <div class="flex flex-col items-center justify-center">
        <a-form :model="formData" auto-label-width layout="vertical">
          <a-form-item label="日期 → 时间戳：">
            <a-date-picker
              :style="{ width: '220px' }"
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
          <a-form-item label="时间戳 → 日期：">
            <a-input
              ref="timeInputRef"
              v-model="formData.time"
              placeholder="请输入时间戳"
              allow-clear
              :style="{ width: '220px' }"
            />
            <a-tooltip content="点击复制" position="top" mini>
              <span
                class="inline-block ml-16px cursor-pointer font-bold text-16px dark:text-white"
                v-clipboard:copy="timeText"
                v-clipboard:success="onCopy"
                >{{ timeText || '-' }}</span
              >
            </a-tooltip>
          </a-form-item>
          <a-divider></a-divider>
          <a-form-item :label="`当前时间戳${btnIsStop ? '（已暂停）' : ''}：`">
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
                <template #default>{{ btnIsStop ? '继续' : '暂停' }}</template>
              </a-button>
            </div>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { Message } from '@arco-design/web-vue'
import { IconPause, IconPlayArrowFill } from '@arco-design/web-vue/es/icon'

const pageIsDark = ref(false) // 开关绑定值
// 手动切换主题
const changeTheme = val => {
  val ? setThemeDark() : setThemeLight()
}

const timeStamp = ref(0) // 底部动态时间戳
const timeType = ref(localStorage.getItem('defaultUnit') || 'ms') // 单选框值，默认毫秒

// 日期 → 时间戳后面的文字
const timeStampText = computed(() => {
  return formData.date
    ? timeType.value === 'ms'
      ? dayjs(formData.date).valueOf()
      : dayjs(formData.date).unix()
    : '-'
})

// 时间戳 → 日期后面的文字
const timeText = computed(() => {
  const time = parseInt(formData.time)
  return time
    ? timeType.value === 'ms'
      ? dayjs(time).format('YYYY-MM-DD HH:mm:ss')
      : dayjs.unix(time).format('YYYY-MM-DD HH:mm:ss')
    : '-'
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
  if (isDark.value) {
    setThemeDark()
  } else {
    setThemeLight()
  }
}

// 切换单选，重新渲染底部动态时间戳的显示
const changeRadio = val => {
  localStorage.setItem('defaultUnit', val)
  btnIsStop.value ? calcStaticStamp() : calctimeStamp()
}

// 计算底部动态时间戳的值
const calctimeStamp = () => {
  timeStamp.value =
    timeType.value === 'ms'
      ? String(dayjs().valueOf())
          .substring(0, 10)
          .padEnd(13, '0')
      : String(dayjs().unix())
}

// 计算暂停时，底部动态时间戳的值
// 因为是暂停的，所以不需要dayjs，切割字符串即可
const calcStaticStamp = () => {
  timeStamp.value =
    timeType.value === 'ms'
      ? String(timeStamp.value)
          .substring(0, 10)
          .padEnd(13, '0')
      : String(timeStamp.value).substring(0, 10)
}

// 复制成功的提示
const onCopy = () => {
  Message.success('复制成功')
}
</script>

<style lang="scss" scoped>
.dynamic_timestamp {
  // 等宽数字
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
</style>
