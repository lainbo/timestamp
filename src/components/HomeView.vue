<template>
  <div
    class="contain w-screen h-screen flex flex-col items-center pt-8px bg-white dark:bg-#303133"
  >
    <div
      class="card p-32px pt-16px rounded-8px shadow-xl w-11/12 min-w-600px dark:shadow-#222 dark:shadow-lg"
    >
      <div class="mb-16px flex justify-between items-center">
        <div class="space-x-11px">
          <a-radio-group
            v-model="时间戳类型"
            type="button"
            size="large"
            @change="radio切换($event)"
          >
            <a-radio value="ms"> 毫秒 </a-radio>
            <a-radio value="s"> 秒 </a-radio>
          </a-radio-group>
          <a-select
            v-model:model-value="时区"
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
              <i
                class="i-majesticons-exclamation-circle-line text-20px dark:text-white"
              ></i>
              <template #content>
                <p>
                  下列操作中，会根据对应国家是否执行夏令时自动进行转换，以转换结果为准，并不是普通的对时间进行加减
                </p>
              </template>
            </a-popover>
          </span>
        </div>
        <a-switch v-model="pageIsDark" type="round" @change="变更主题($event)">
          <template #checked>
            <i class="i-fxemoji-crescentmoon text-16px mb-4px"></i>
          </template>
          <template #unchecked>
            <i class="i-twemoji-sun-with-face text-16px mb-4px"></i>
          </template>
        </a-switch>
      </div>
      <a-divider></a-divider>

      <div class="flex-c flex-col">
        <a-form
          :model="formData"
          auto-label-width
          layout="vertical"
          size="large"
        >
          <a-form-item :label="`日期 → （${时区文字}）时间戳：`">
            <a-date-picker
              v-model="formData.date"
              :style="{ width: '345px' }"
              show-time
              :time-picker-props="{
                defaultValue: dayjs().startOf('day')
              }"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <a-tooltip content="点击复制" position="top" mini>
              <span
                class="inline-block ml-16px cursor-pointer font-bold text-16px dynamic_timestamp dark:text-white"
                @click="复制(timeStampText)"
              >
                {{ timeStampText ?? '-' }}
              </span>
            </a-tooltip>
          </a-form-item>

          <a-divider />

          <a-form-item :label="`时间戳 → （${时区文字}）日期`">
            <a-input
              ref="timeInputRef"
              v-model="formData.time"
              placeholder="请输入时间戳"
              allow-clear
              :style="{ width: '345px' }"
            />
            <a-tooltip content="点击复制" position="top" mini>
              <span
                class="inline-block ml-16px cursor-pointer font-bold text-16px dynamic_timestamp dark:text-white"
                @click="复制(timeText)"
              >
                {{ timeText || '-' }}
              </span>
            </a-tooltip>
          </a-form-item>

          <a-divider />

          <a-form-item
            :label="`当前时间戳${按钮停止状态 ? '（已暂停）' : ''}：`"
          >
            <div class="flex justify-between flex-1">
              <div class="space-x-8px flex items-center">
                <div class="w-135px">
                  <a-tooltip content="点击复制" position="bottom" mini>
                    <span
                      class="dynamic_timestamp cursor-pointer transition-all inline-block dark:text-white"
                      :class="{
                        'text-blue-600 font-bold text-16px dark:text-white':
                          按钮停止状态
                      }"
                      @click="复制(底部动态时间戳)"
                    >
                      {{ 底部动态时间戳 }}
                    </span>
                  </a-tooltip>
                </div>

                <a-button
                  type="text"
                  :status="按钮停止状态 ? 'success' : 'danger'"
                  @click="暂停开始按钮()"
                >
                  <template #icon>
                    <i
                      :class="[
                        按钮停止状态 ? 'i-ri-play-fill' : 'i-ic-twotone-pause'
                      ]"
                    ></i>
                  </template>
                  <template #default>
                    {{ 按钮停止状态 ? '继续' : '暂停' }}
                  </template>
                </a-button>
              </div>
              <div>
                <a-popconfirm
                  content-class="w-250px"
                  content="时间戳的单位、时区、页面数据将恢复为初始值，确定吗？"
                  position="tr"
                  @ok="重置数据()"
                >
                  <a-button size="small">
                    <template #icon>
                      <i class="i-material-symbols-refresh-rounded"></i>
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
import TimezoneJson from '@/assets/timezone/TimezoneData.json'
import { Message } from '@arco-design/web-vue'

const 时区 = useStorage('defaultTimeZone', 'Asia/Shanghai') // 默认时区
const timezoneData = ref(TimezoneJson) // 时区数据

const 时区文字 = computed(() => {
  return TimezoneJson.find(item => item.value === 时区.value).code?.substring(
    12
  )
})

function 重置数据() {
  formData.date = ''
  formData.time = undefined
  时间戳类型.value = 'ms'
  时区.value = 'Asia/Shanghai'
  Message.success({ content: '已重置', duration: 1000 })
}

// 手动切换主题
function 变更主题(val) {
  setTheme(val)
}

const 底部动态时间戳 = ref(0)
const 时间戳类型 = useStorage('defaultUnit', 'ms') // 单选框值，默认毫秒

// 日期 → 时间戳后面的文字
const timeStampText = computed(() => {
  if (!formData?.date) return '-'

  const 毫秒文字 = dayjs(formData.date).tz(时区.value, true).valueOf()

  const 秒文字 = dayjs(formData.date).tz(时区.value, true).unix()

  return 时间戳类型.value === 'ms' ? 毫秒文字 : 秒文字
})

// 时间戳 → 日期后面的文字
const timeText = computed(() => {
  const time = parseInt(formData.time)
  if (isNaN(time)) return '-'

  // 毫秒单位的日期字符串
  const 毫秒日期文字 = dayjs(time).tz(时区.value).format('YYYY-MM-DD HH:mm:ss')

  // 秒单位的日期字符串
  const 秒日期文字 = dayjs
    .unix(time)
    .tz(时区.value)
    .format('YYYY-MM-DD HH:mm:ss')

  return 时间戳类型.value === 'ms' ? 毫秒日期文字 : 秒日期文字
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

const 按钮停止状态 = ref(false) // 按钮状态，是否停止
// 开始/停止按钮
function 暂停开始按钮() {
  if (!按钮停止状态.value) {
    pause()
    按钮停止状态.value = true
  } else {
    resume()
    按钮停止状态.value = false
  }
}
// 计算底部动态时间戳的值
function 计算动态时间戳文字() {
  const 毫秒文字 = String(dayjs().tz(时区.value).valueOf())
    .substring(0, 10)
    .padEnd(13, '0')

  const 秒文字 = String(dayjs().tz(时区.value).unix())
  底部动态时间戳.value = 时间戳类型.value === 'ms' ? 毫秒文字 : 秒文字
}

// 计算暂停时，底部动态时间戳的值
// 因为是暂停的，所以不需要dayjs，切割字符串即可
function 计算静态时间戳文字() {
  const 毫秒文字 = String(底部动态时间戳.value).substring(0, 10).padEnd(13, '0')
  const 秒文字 = String(底部动态时间戳.value).substring(0, 10)
  底部动态时间戳.value = 时间戳类型.value === 'ms' ? 毫秒文字 : 秒文字
}

// 页面自动初始化
const { pause, resume } = useRafFn(计算动态时间戳文字)

const utools = window?.utools
// utools数据初始化
const timeInputRef = ref() // 文本输入框的dom
const utoolsInit = () => {
  utools.onPluginEnter(({ code, payload }) => {
    if (code === 'timeStamp') {
      formData.time = payload || 0
      timeInputRef.value.focus()
    }
    if (code === 'date') {
      formData.date = dayjs(payload).format('YYYY-MM-DD HH:mm:ss')
    }
  })
  utools.subInputBlur()
  时间戳类型.value = utools.dbStorage.getItem('defaultUnit') || 'ms'
}

watch(
  () => 时间戳类型.value,
  val => {
    if (utools) {
      utools.dbStorage.setItem('defaultUnit', val)
    }
  }
)

// 切换单选，重新渲染底部动态时间戳的显示
function radio切换(val) {
  时间戳类型.value = val
  按钮停止状态.value ? 计算静态时间戳文字() : 计算动态时间戳文字()
}
const { copy } = useClipboard()
// 复制成功的提示
async function 复制(str = '') {
  await copy(str)
  Message.success({ content: '复制成功', duration: 1000 })
}
</script>

<style lang="scss" scoped>
.contain,
.card {
  transition: all 0.4s ease;
}
.dynamic_timestamp {
  // 等宽数字
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
</style>
