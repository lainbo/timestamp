<template>
  <div
    class="contain main overflow-hidden px-23px pb-28px pt-6px w-screen h-screen flex flex-col items-center bg-white dark:bg-#303133 relative"
  >
    <div
      class="card p-32px pt-16px rounded-8px size-full bg-white dark:bg-#242425a6 border border-solid border-#e9e9e9 dark:border-#3d3d3d"
    >
      <div class="mb-16px space-x-11px">
        <a-radio-group v-model="时间戳类型" type="button" size="large">
          <a-radio value="ns">纳秒</a-radio>
          <a-radio value="ms">毫秒</a-radio>
          <a-radio value="s">秒</a-radio>
        </a-radio-group>
        <a-select
          v-model:model-value="时区"
          size="large"
          :style="{ width: '380px' }"
          placeholder="请选择时区"
          allow-search
          :filter-option="匹配时区选项"
          :options="timezoneData"
          :virtual-list-props="{ height: 280 }"
        />
      </div>
      <a-divider></a-divider>

      <div class="flex-c flex-col">
        <a-form
          :model="formData"
          auto-label-width
          layout="vertical"
          size="large"
        >
          <a-form-item
            :label="`日期（${日期时区文字}）→ 时间戳：`"
            :validate-status="日期转换结果.错误 ? 'error' : undefined"
            :help="日期转换结果.错误"
          >
            <template v-if="日期候选.length === 2" #help>
              <div class="ambiguous-time">
                <span class="ambiguous-time-title">
                  该当地时间因时钟回拨，会出现两次
                </span>
                <a-radio-group v-model="歧义选项">
                  <a-radio v-for="(项, 序) in 日期候选" :key="序" :value="序">
                    <template #radio="{ checked }">
                      <div
                        class="custom-radio-card"
                        :class="{ 'custom-radio-card-checked': checked }"
                      >
                        <div class="custom-radio-card-mask">
                          <div class="custom-radio-card-mask-dot" />
                        </div>
                        <div>
                          <div class="custom-radio-card-title">
                            {{ 序 === 0 ? '第一次' : '第二次' }}
                          </div>
                          <div class="custom-radio-card-text">
                            {{ 项.utc偏移 }}
                          </div>
                        </div>
                      </div>
                    </template>
                  </a-radio>
                </a-radio-group>
              </div>
            </template>
            <DateTimePicker
              v-model="formData.date"
              v-model:popup-visible="日期选择器可见"
              :style="{ width: '380px' }"
            >
              <template #extra>
                <a-button type="text" size="mini" @click="填入此刻">
                  此刻
                </a-button>
              </template>
            </DateTimePicker>
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

          <a-form-item :label="`时间戳 → （${时间戳时区文字}）日期`">
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
                <template v-if="时间戳转换结果">
                  <span>{{ 时间戳转换结果.文字 }}</span>
                  <span
                    v-if="时间戳转换结果.小数秒组.length"
                    class="fractional-seconds"
                    >.<span
                      v-for="(组, 序) in 时间戳转换结果.小数秒组"
                      :key="序"
                      >{{ 组 }}</span
                    ></span
                  >
                </template>
                <template v-else>-</template>
              </span>
            </a-tooltip>
          </a-form-item>

          <a-divider />

          <a-form-item :label="`当前时间戳（${时间戳单位文字}）：`">
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
      :时区选项="全部时区选项"
      @重置="重置数据"
    />
  </div>
</template>

<script setup>
import { Message } from '@arco-design/web-vue'
import {
  useClipboard,
  useDocumentVisibility,
  useEventListener,
  useIntervalFn,
  useMagicKeys,
  useRafFn,
  useStorage,
  whenever
} from '@vueuse/core'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import DateTimePicker from '@/components/DateTimePicker.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import SmoothTransitionIcon from '@/components/SmoothTransitionIcon.vue'
import { 解析日期, 格式化时区日期, 解析时区日期 } from '@/utils/datetime.js'
import {
  构建时区选项,
  合法时区集合,
  默认已选时区,
  回退当前时区,
  读取已选时区,
  写入已选时区,
  匹配时区选项
} from '@/utils/timezone.js'
const utools = window?.utools
const keys = useMagicKeys()
const isMacOs = utools?.isMacOs() || false

// useMagicKeys 识别 Meta，提示文字在 Mac 上写作 Command
const 修饰键 = isMacOs ? 'Meta' : 'Ctrl'
const 提示修饰键 = isMacOs ? 'Command' : 'Ctrl'

// 日期 → 时间戳
const timeStampShortcut = `${提示修饰键}+Shift+Z`
whenever(keys[`${修饰键}+Shift+Z`], () => 复制(timeStampText.value))

// 时间戳 → 日期
const timeTextShortcut = `${提示修饰键}+Shift+X`
whenever(keys[`${修饰键}+Shift+X`], () => 复制(timeText.value))

// 当前时间戳
const dynamicTimeStampShortcut = `${提示修饰键}+Shift+C`
whenever(keys[`${修饰键}+Shift+C`], () => 复制(底部动态时间戳.value))

const 时区 = useStorage('defaultTimeZone', 'Asia/Shanghai') // 默认时区
const 合法时区 = 合法时区集合()
const 已选时区 = ref(读取已选时区(合法时区))
时区.value = 回退当前时区(已选时区.value, 时区.value)
const 设置可见 = ref(false)
const 日期选择器可见 = ref(false)
const 页面可见性 = useDocumentVisibility()
const timezoneData = ref(构建时区选项(已选时区.value))
// 全量列表要为 ~420 个时区各算一次偏移，仅在设置弹窗打开时刷新。
const 全部时区选项 = ref([])

function 刷新时区选项() {
  if (页面可见性.value !== 'visible') return

  timezoneData.value = 构建时区选项(已选时区.value)
  if (设置可见.value) {
    全部时区选项.value = 构建时区选项([...合法时区])
  }
}

watch([已选时区, 设置可见, 页面可见性], 刷新时区选项, { deep: true })
useIntervalFn(刷新时区选项, 60_000)
useEventListener(window, 'focus', 刷新时区选项)

const 时区文字 = computed(() => {
  const 项 = timezoneData.value.find(item => item.value === 时区.value)
  return 项?.name ?? 时区.value
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
const 时间戳单位文字 = computed(
  () => ({ ns: '纳秒', ms: '毫秒', s: '秒' })[时间戳类型.value]
)
const 每毫秒纳秒数 = 1000000n
const 每秒纳秒数 = 1000000000n
const 单位纳秒数 = { s: 每秒纳秒数, ms: 每毫秒纳秒数, ns: 1n }
const 日期最大毫秒数 = 8640000000000000n

// BigInt 除法向零截断，1970 年以前的时间须向下取整。
function 向下整除(被除数, 除数) {
  const 商 = 被除数 / 除数
  return 被除数 % 除数 < 0n ? 商 - 1n : 商
}

function 格式化时间戳(纳秒, 单位) {
  return 向下整除(纳秒, 单位纳秒数[单位]).toString()
}

// 小数秒按三位一组，去掉末尾全为 0 的组，依精度保留 3、6 或 9 位，整秒为空数组。
function 小数秒分组(纳秒) {
  return (
    (纳秒 - 向下整除(纳秒, 每秒纳秒数) * 每秒纳秒数)
      .toString()
      .padStart(9, '0')
      .replace(/(?:000)+$/, '')
      .match(/\d{3}/g) ?? []
  )
}

const 歧义选项 = ref(0)

const 输入日期 = computed(() => 解析日期(formData.date))

const 日期候选 = computed(() =>
  输入日期.value ? 解析时区日期(输入日期.value, 时区.value) : []
)

const 日期转换结果 = computed(() => {
  if (!formData.date) return {}
  if (!输入日期.value) return { 错误: '日期无效，请检查日期格式和年月日' }

  const 候选 = 日期候选.value
  if (!候选.length) return { 错误: '该当地时间不存在（夏令时切换）' }

  return 候选[候选.length === 2 ? 歧义选项.value : 0]
})

const 日期时区文字 = computed(() =>
  [时区文字.value, 日期转换结果.value.utc偏移].filter(Boolean).join(' ')
)

// 日期 → 时间戳后面的文字
const timeStampText = computed(() => {
  const 毫秒 = 日期转换结果.value.毫秒
  if (毫秒 === undefined) return '-'

  const 纳秒 = BigInt(毫秒) * 每毫秒纳秒数 + 输入日期.value.秒内纳秒
  return 格式化时间戳(纳秒, 时间戳类型.value)
})

const 时间戳转换结果 = computed(() => {
  const 输入文字 = String(formData.time ?? '').trim()
  if (!/^-?\d+$/.test(输入文字)) return undefined

  const 纳秒 = BigInt(输入文字) * 单位纳秒数[时间戳类型.value]
  const 毫秒 = 向下整除(纳秒, 每毫秒纳秒数)
  if (毫秒 > 日期最大毫秒数 || 毫秒 < -日期最大毫秒数) return undefined

  return {
    ...格式化时区日期(Number(毫秒), 时区.value),
    小数秒组: 小数秒分组(纳秒)
  }
})

const 时间戳时区文字 = computed(() =>
  [时区文字.value, 时间戳转换结果.value?.utc偏移].filter(Boolean).join(' ')
)

// 时间戳 → 日期后面的文字
const timeText = computed(() => {
  const 结果 = 时间戳转换结果.value
  if (!结果) return '-'
  return [结果.文字, 结果.小数秒组.join('')].filter(Boolean).join('.')
})

// 两个输入框
const formData = reactive({
  date: '', // 日期
  time: undefined // 时间戳
})

async function 填入此刻() {
  const 此刻毫秒 = Math.floor(Date.now() / 1000) * 1000
  formData.date = 格式化时区日期(此刻毫秒, 时区.value).文字
  日期选择器可见.value = false

  // 等待日期监听重置选项后，再选中此刻对应的那次当地时间。
  await nextTick()
  歧义选项.value = 日期候选.value[1]?.毫秒 === 此刻毫秒 ? 1 : 0
}

watch([() => formData.date, 时区], () => {
  歧义选项.value = 0
})

onMounted(() => {
  if (!window?.utools) return
  utoolsInit()
})

const 当前毫秒 = ref(Date.now())
const 底部动态时间戳 = computed(() =>
  格式化时间戳(BigInt(当前毫秒.value) * 每毫秒纳秒数, 时间戳类型.value)
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
    刷新时区选项()
    if (code === 'timeStamp') {
      formData.time = payload || 0
      timeInputRef.value.focus()
    }
    if (code === 'date') {
      formData.date = 解析日期(payload)?.文字 ?? ''
      if (!formData.date) {
        Message.warning({
          content: '日期无效，请检查日期格式和年月日',
          duration: 2000
        })
      }
    }
  })
  utools.subInputBlur()
  时间戳类型.value =
    utools.dbStorage.getItem('defaultUnit') || 时间戳类型.value || 'ms'
  时区.value = 回退当前时区(
    已选时区.value,
    utools.dbStorage.getItem('defaultTimeZone') ?? 时区.value
  )
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

.fractional-seconds {
  font-weight: normal;
  color: var(--color-text-3);

  span + span {
    margin-left: 0.25em;
  }
}

.ambiguous-time {
  display: grid;
  gap: 8px;
}

.ambiguous-time-title {
  font-size: 12px;
  line-height: 18px;
  color: var(--color-text-3);
}

.ambiguous-time :deep(.arco-radio-group) {
  display: grid;
  grid-template-columns: repeat(2, max-content);
  gap: 8px;
}

.ambiguous-time :deep(.arco-radio) {
  padding-left: 0 !important;
}

.custom-radio-card {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 168px;
  padding: 7px 9px;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.custom-radio-card-mask {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 100%;
  box-sizing: border-box;
}

.custom-radio-card-mask-dot {
  width: 6px;
  height: 6px;
  border-radius: 100%;
}

.custom-radio-card-title {
  margin-bottom: 2px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--color-text-1);
}

.custom-radio-card-text {
  font-size: 11px;
  line-height: 15px;
  color: var(--color-text-3);
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

.custom-radio-card:hover,
.custom-radio-card-checked,
.custom-radio-card:hover .custom-radio-card-mask,
.custom-radio-card-checked .custom-radio-card-mask {
  border-color: rgb(var(--primary-6));
}

.custom-radio-card:hover .custom-radio-card-title,
.custom-radio-card-checked .custom-radio-card-title {
  color: rgb(var(--primary-6));
}

.custom-radio-card-checked {
  background-color: var(--color-primary-light-1);
}

.custom-radio-card-checked .custom-radio-card-mask-dot {
  background-color: rgb(var(--primary-6));
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
