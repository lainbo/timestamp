<template>
  <div
    class="contain main overflow-hidden px-23px pb-28px pt-6px w-screen h-screen flex flex-col items-center bg-white dark:bg-#303133 relative"
  >
    <div
      class="card p-32px pt-16px rounded-8px size-full bg-white dark:bg-#242425a6 border border-solid border-#e9e9e9 dark:border-#3d3d3d"
    >
      <div class="mb-16px space-x-11px">
        <a-select
          v-model:model-value="时区"
          size="large"
          :style="{ width: '380px' }"
          placeholder="请选择时区"
          allow-search
          :options="timezoneData"
          :virtual-list-props="{ height: 280 }"
        />
        <span class="inline-block">
          <a-popover title="注意">
            <i
              class="i-majesticons-exclamation-circle-line text-20px dark:text-white"
            ></i>
            <template #content>
              <p>
                时间戳本身不带时区。日期转时间戳时，会将输入视为所选时区的当地时间；反向转换时，会按所选时区显示，并自动处理夏令时
              </p>
            </template>
          </a-popover>
        </span>
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
              :style="{ width: '380px' }"
              show-time
              :time-picker-props="{
                defaultValue: dayjs().startOf('day')
              }"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
            <a-tooltip
              :content="`点击复制 / ${timeStampShortcut}`"
              position="top"
              mini
            >
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
              :style="{ width: '380px' }"
            />
            <a-tooltip
              :content="`点击复制 / ${timeTextShortcut}`"
              position="top"
              mini
            >
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
            <div class="space-x-12px flex items-center flex-1">
              <div class="w-235px">
                <a-tooltip
                  :content="`点击复制 / ${dynamicTimeStampShortcut}`"
                  position="bottom"
                  mini
                >
                  <span
                    class="dynamic_timestamp cursor-pointer transition-all text-16px inline-block dark:text-white"
                    :class="{
                      'text-blue-600 font-bold text-18px dark:text-white':
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
          </a-form-item>
        </a-form>
      </div>
    </div>
    <div class="absolute right-3px bottom-3px">
      <SmoothTransitionIcon
        class="icon"
        默认图标class="i-ci-settings-future mb-0"
        hover时候的class="i-eos-icons-rotating-gear mb-0"
        渲染标签="button"
        @click="设置可见 = true"
      />
    </div>
    <SettingsModal
      v-model:visible="设置可见"
      v-model:已选时区="已选时区"
      v-model:时间戳类型="时间戳类型"
      :时区选项="全部时区选项"
      @重置="重置数据"
    />
  </div>
</template>

<script setup>
import { Message } from '@arco-design/web-vue'
import {
  useClipboard,
  useMagicKeys,
  useRafFn,
  useStorage,
  whenever
} from '@vueuse/core'
import dayjs from 'dayjs'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SettingsModal from '@/components/SettingsModal.vue'
import SmoothTransitionIcon from '@/components/SmoothTransitionIcon.vue'
import { 同步主题偏好 } from '@/utils/theme.js'
import {
  构建时区选项,
  合法时区集合,
  默认已选时区,
  回退当前时区,
  读取已选时区,
  写入已选时区
} from '@/utils/timezone.js'
const utools = window?.utools
const keys = useMagicKeys()
const isMacOs = utools?.isMacOs() || false

// 定义快捷键，内部使用 'Meta'，外部展示 'Command'
const keyMappings = {
  timeStamp: {
    mac: 'Meta+Shift+Z',
    other: 'Ctrl+Shift+Z'
  },
  timeText: {
    mac: 'Meta+Shift+X',
    other: 'Ctrl+Shift+X'
  },
  dynamicTimeStamp: {
    mac: 'Meta+Shift+C',
    other: 'Ctrl+Shift+C'
  }
}

// 显示给用户的快捷键，Mac 上使用 'Command' 替代 'Meta'
const displayKeyMappings = {
  timeStamp: {
    mac: 'Command+Shift+Z',
    other: 'Ctrl+Shift+Z'
  },
  timeText: {
    mac: 'Command+Shift+X',
    other: 'Ctrl+Shift+X'
  },
  dynamicTimeStamp: {
    mac: 'Command+Shift+C',
    other: 'Ctrl+Shift+C'
  }
}

// 日期 → 时间戳后面的快捷键提示
const timeStampShortcut = computed(() =>
  isMacOs
    ? displayKeyMappings.timeStamp.mac
    : displayKeyMappings.timeStamp.other
)

// 时间戳 → 日期后面的快捷键提示
const timeTextShortcut = computed(() =>
  isMacOs ? displayKeyMappings.timeText.mac : displayKeyMappings.timeText.other
)

// 底部动态时间戳后面的快捷键提示
const dynamicTimeStampShortcut = computed(() =>
  isMacOs
    ? displayKeyMappings.dynamicTimeStamp.mac
    : displayKeyMappings.dynamicTimeStamp.other
)

// 快捷键绑定
whenever(keys[keyMappings.timeStamp[isMacOs ? 'mac' : 'other']], () =>
  复制(timeStampText.value)
)
whenever(keys[keyMappings.timeText[isMacOs ? 'mac' : 'other']], () =>
  复制(timeText.value)
)
whenever(keys[keyMappings.dynamicTimeStamp[isMacOs ? 'mac' : 'other']], () =>
  复制(底部动态时间戳.value)
)

const 时区 = useStorage('defaultTimeZone', 'Asia/Shanghai') // 默认时区
const 合法时区 = 合法时区集合()
const 已选时区 = ref(读取已选时区(合法时区))
时区.value = 回退当前时区(已选时区.value, 时区.value)
const 设置可见 = ref(false)
const timezoneData = computed(() => 构建时区选项(已选时区.value))
// 全量列表要为 ~420 个时区各算一次偏移，推迟到设置弹窗首次打开时构建
const 全部时区选项 = ref([])
watch(设置可见, 可见 => {
  if (可见 && !全部时区选项.value.length) {
    全部时区选项.value = 构建时区选项([...合法时区])
  }
})

const 时区文字 = computed(() => {
  const 项 = timezoneData.value.find(item => item.value === 时区.value)
  return 项 ? `${项.name} ${项.utc偏移}` : 时区.value
})

function 重置数据() {
  formData.date = ''
  formData.time = undefined
  时间戳类型.value = 'ms'
  已选时区.value = [...默认已选时区]
  时区.value = 回退当前时区(已选时区.value, 'Asia/Shanghai')
  按钮停止状态.value = false
  更新当前时间戳()
  resume()
  Message.success({ content: '已重置', duration: 1000 })
}

const 时间戳类型 = useStorage('defaultUnit', 'ms') // 单选框值，默认毫秒
const 每秒毫秒数 = 1000n
const 每毫秒纳秒数 = 1000000n
const 日期最大毫秒数 = 8640000000000000n

function 格式化时间戳(毫秒, 单位) {
  const 毫秒整数 = BigInt(毫秒)

  if (单位 === 's') return (毫秒整数 / 每秒毫秒数).toString()
  if (单位 === 'ms') return 毫秒整数.toString()
  return (毫秒整数 * 每毫秒纳秒数).toString()
}

function 纳秒转毫秒(纳秒) {
  const 毫秒 = 纳秒 / 每毫秒纳秒数
  const 存在不足一毫秒的负数余数 = 纳秒 < 0n && 纳秒 % 每毫秒纳秒数 !== 0n

  return 存在不足一毫秒的负数余数 ? 毫秒 - 1n : 毫秒
}

function 时间戳转毫秒(时间戳, 单位) {
  if (单位 === 's') return 时间戳 * 每秒毫秒数
  if (单位 === 'ms') return 时间戳
  if (单位 === 'ns') return 纳秒转毫秒(时间戳)
  return undefined
}

// 日期 → 时间戳后面的文字
const timeStampText = computed(() => {
  if (!formData.date) return '-'

  const 本地日期 = dayjs(formData.date)
  if (!本地日期.isValid()) return '-'

  const 时区日期 = 本地日期.tz(时区.value, true)
  const 毫秒 = 时区日期.valueOf()

  if (时间戳类型.value === 's') return 时区日期.unix().toString()
  return 格式化时间戳(毫秒, 时间戳类型.value)
})

// 时间戳 → 日期后面的文字
const timeText = computed(() => {
  const 输入文字 = String(formData.time ?? '').trim()
  if (!/^-?\d+$/.test(输入文字)) return '-'

  try {
    const 毫秒 = 时间戳转毫秒(BigInt(输入文字), 时间戳类型.value)
    if (毫秒 === undefined || 毫秒 > 日期最大毫秒数 || 毫秒 < -日期最大毫秒数) {
      return '-'
    }

    const 日期 = dayjs(Number(毫秒))
    if (!日期.isValid()) return '-'

    return 日期.tz(时区.value).format('YYYY-MM-DD HH:mm:ss')
  } catch {
    return '-'
  }
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

const 当前毫秒 = ref(Date.now())
const 底部动态时间戳 = computed(() =>
  格式化时间戳(当前毫秒.value, 时间戳类型.value)
)
const 按钮停止状态 = ref(false) // 按钮状态，是否停止

function 更新当前时间戳() {
  当前毫秒.value = Date.now()
}

// 页面自动初始化
const { pause, resume } = useRafFn(更新当前时间戳)

// 开始/停止按钮
function 暂停开始按钮() {
  if (!按钮停止状态.value) {
    pause()
    按钮停止状态.value = true
  } else {
    更新当前时间戳()
    resume()
    按钮停止状态.value = false
  }
}

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
  时间戳类型.value =
    utools.dbStorage.getItem('defaultUnit') || 时间戳类型.value || 'ms'
  已选时区.value = 读取已选时区(合法时区)
  时区.value = 回退当前时区(
    已选时区.value,
    utools.dbStorage.getItem('defaultTimeZone') ?? 时区.value
  )
  同步主题偏好()
}

watch(
  () => 时间戳类型.value,
  val => {
    if (utools) {
      utools.dbStorage.setItem('defaultUnit', val)
    }
  }
)

watch(
  () => 时区.value,
  val => {
    if (utools) {
      utools.dbStorage.setItem('defaultTimeZone', val)
    }
  }
)

watch(
  已选时区,
  值 => {
    if (!值.length) {
      已选时区.value = 合法时区.has(时区.value)
        ? [时区.value]
        : [...默认已选时区]
      return
    }
    写入已选时区(值)
    时区.value = 回退当前时区(值, 时区.value)
  },
  { deep: true }
)

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

.main {
  background-image: linear-gradient(
    to bottom,
    var(--main-bg-color-01) 0%,
    var(--main-bg-color-02) 50%
  );
}

.icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 22px;
  color: #999;
  transition: all 400ms var(--ani-bezier);

  &:hover {
    color: #666;
    transform: rotate(90deg);
  }

  &:active {
    color: #5b61ff;
  }
}

body[arco-theme='dark'] .icon:hover {
  color: #d9d9d9;
}
body[arco-theme='dark'] .icon:active {
  color: #fff;
}
</style>
