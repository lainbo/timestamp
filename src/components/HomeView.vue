<template>
  <div
    class="contain w-screen h-screen flex flex-col items-center pt-32px bg-white dark:bg-dark-300"
  >
    <div
      class="card p-32px pt-16px rounded-8px shadow-xl w-11/12 min-w-500px dark:shadow-black dark:shadow-lg"
    >
      <div class="mb-16px flex justify-between items-center">
        <div class="space-x-11px">
          <a-radio-group
            v-model="timeType"
            type="button"
            size="large"
            @change="changeRadio"
          >
            <a-radio value="ms"> 毫秒 </a-radio>
            <a-radio value="s"> 秒 </a-radio>
          </a-radio-group>
          <a-select
            v-model:model-value="timeZone"
            size="large"
            :style="{ width: '235px' }"
            placeholder="请选择时区"
            allow-search
          >
            <a-option
              v-for="item in timezoneData"
              :key="item.value"
              :label="item.code"
              :value="item.value"
            />
          </a-select>
          <span class="inline-block">
            <a-popover title="注意">
              <icon-exclamation-circle
                class="text-16px cursor-pointer dark:text-white"
              />
              <template #content>
                <p>
                  时间戳→日期操作中，会根据对应国家是否执行夏令时自动进行转换，以转换结果为准，并不是普通的对时间进行加减
                </p>
              </template>
            </a-popover>
          </span>
        </div>
        <a-switch v-model="pageIsDark" type="round" @change="changeTheme">
          <template #checked> 🌙 </template>
          <template #unchecked> ☀️ </template>
        </a-switch>
      </div>

      <div class="flex flex-col items-center justify-center">
        <a-form :model="formData" auto-label-width layout="vertical">
          <a-form-item label="日期 → 时间戳：">
            <a-date-picker
              v-model="formData.date"
              :style="{ width: '345px' }"
              show-time
              :time-picker-props="{
                defaultValue: '00:00:00'
              }"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <a-tooltip content="点击复制" position="top" mini>
              <span
                v-clipboard:copy="timeStampText"
                v-clipboard:success="onCopy"
                class="inline-block ml-16px cursor-pointer font-bold text-16px dark:text-white"
              >
                {{ timeStampText || '-' }}
              </span>
            </a-tooltip>
          </a-form-item>

          <a-divider />

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
                v-clipboard:copy="timeText"
                v-clipboard:success="onCopy"
                class="inline-block ml-16px cursor-pointer font-bold text-16px dark:text-white"
              >
                {{ timeText || '-' }}
              </span>
            </a-tooltip>
          </a-form-item>

          <a-divider />

          <a-form-item :label="`当前时间戳${btnIsStop ? '（已暂停）' : ''}：`">
            <div class="flex justify-between flex-1">
              <div class="space-x-8px flex items-center">
                <div class="w-135px">
                  <a-tooltip content="点击复制" position="bottom" mini>
                    <span
                      v-clipboard:copy="timeStamp"
                      v-clipboard:success="onCopy"
                      class="cursor-pointer transition-all dynamic_timestamp inline-block dark:text-white"
                      :class="{
                        'text-blue-600 font-bold text-16px dark:text-white':
                          btnIsStop
                      }"
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
                  content="时间戳的单位、时区、页面数据将恢复为初始值，确定吗？"
                  position="tr"
                  @ok="resetData"
                >
                  <a-button size="small">
                    <template #icon>
                      <icon-refresh />
                    </template>
                    <template #default> 重置数据 </template>
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
import { setTheme, pageIsDark } from '@/utils/theme.js'
import { TimezoneData } from '@/assets/timezone/TimezoneData.js'
import { Message } from '@arco-design/web-vue'
import {
  IconPause,
  IconPlayArrowFill,
  IconExclamationCircle,
  IconRefresh
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
  Message.success({ content: '已重置', duration: 1000 })
}

// 手动切换主题
const changeTheme = val => setTheme(val)

const timeStamp = ref(0) // 底部动态时间戳
const timeType = useStorage('defaultUnit', 'ms') // 单选框值，默认毫秒

// 日期 → 时间戳后面的文字
const timeStampText = computed(() => {
  if (!formData?.date) return '-'

  // 毫秒下的时间戳字符串
  const msText = dayjs(formData.date).tz(timeZone.value).valueOf()

  // 秒下的时间戳字符串
  const sText = dayjs(formData.date).tz(timeZone.value).unix()

  return timeType.value === 'ms' ? msText : sText
})

// 时间戳 → 日期后面的文字
const timeText = computed(() => {
  const time = parseInt(formData.time)
  if (isNaN(time)) return '-'

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
  time: undefined // 时间戳
})

onMounted(() => {
  if (!window?.utools) return
  utoolsInit()
})

const btnIsStop = ref(false) // 按钮状态，是否停止
// 开始/停止按钮
const stopTimer = () => {
  if (!btnIsStop.value) {
    pause()
    btnIsStop.value = true
  } else {
    resume()
    btnIsStop.value = false
  }
}
// 计算底部动态时间戳的值
const calctimeStamp = () => {
  // 毫秒时间戳文字
  const msText = String(dayjs().tz(timeZone.value).valueOf())
    .substring(0, 10)
    .padEnd(13, '0')

  // 秒时间戳文字
  const sText = String(dayjs().tz(timeZone.value).unix())
  timeStamp.value = timeType.value === 'ms' ? msText : sText
}

// 计算暂停时，底部动态时间戳的值
// 因为是暂停的，所以不需要dayjs，切割字符串即可
const calcStaticStamp = () => {
  // 毫秒时间戳文字
  const msText = String(timeStamp.value).substring(0, 10).padEnd(13, '0')

  // 秒时间戳文字
  const sText = String(timeStamp.value).substring(0, 10)
  timeStamp.value = timeType.value === 'ms' ? msText : sText
}

// 页面自动初始化
const { pause, resume } = useRafFn(calctimeStamp)

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

// 切换单选，重新渲染底部动态时间戳的显示
const changeRadio = val => {
  timeType.value = val
  btnIsStop.value ? calcStaticStamp() : calctimeStamp()
}

// 复制成功的提示
const onCopy = () => {
  Message.success({ content: '复制成功', duration: 1000 })
}
</script>

<style lang="scss" scoped>
.contain {
  transition: all 0.4s ease;
  .card {
    transition: all 0.4s ease;
  }
}
.dynamic_timestamp {
  // 等宽数字
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
</style>
