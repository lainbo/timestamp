<template>
  <a-trigger
    v-model:popup-visible="可见"
    trigger="click"
    position="bl"
    :popup-offset="4"
    animation-name="slide-dynamic-origin"
    auto-fit-transform-origin
    :click-to-close="false"
    prevent-focus
  >
    <div
      v-bind="$attrs"
      class="date-time-picker"
      :class="{ 'date-time-picker-focused': 可见 }"
    >
      <div class="date-time-picker-input">
        <input
          :value="显示文字"
          placeholder="请选择日期"
          @input="输入"
          @keydown.enter="确认"
        />
      </div>
      <div class="date-time-picker-suffix">
        <span v-if="显示文字" class="date-time-picker-clear" @click.stop="清空">
          <icon-close />
        </span>
        <span class="date-time-picker-suffix-icon">
          <icon-calendar />
        </span>
      </div>
    </div>
    <template #content>
      <div class="date-time-picker-popup">
        <div class="picker-panels">
          <div class="picker-panel" :class="`picker-panel-${模式}`">
            <div class="picker-header">
              <div
                v-for="按钮 in 翻页按钮.左"
                :key="按钮.步长"
                class="picker-header-icon"
                :class="{ 'picker-header-icon-hidden': !按钮.可用 }"
                @click="按钮.可用 && 翻页(按钮.步长)"
              >
                <component :is="按钮.图标" v-if="按钮.可用" />
              </div>
              <div class="picker-header-title">
                <template v-if="模式 === 'year'">
                  {{ 年代起 }}-{{ 年代起 + 9 }}
                </template>
                <template v-else>
                  <span class="picker-header-label" @click="模式 = 'year'">{{
                    String(表头年).padStart(4, '0')
                  }}</span>
                  <template v-if="模式 === 'date'">
                    <span>-</span>
                    <span class="picker-header-label" @click="模式 = 'month'">{{
                      String(表头月 + 1).padStart(2, '0')
                    }}</span>
                  </template>
                </template>
              </div>
              <div
                v-for="按钮 in 翻页按钮.右"
                :key="按钮.步长"
                class="picker-header-icon"
                :class="{ 'picker-header-icon-hidden': !按钮.可用 }"
                @click="按钮.可用 && 翻页(按钮.步长)"
              >
                <component :is="按钮.图标" v-if="按钮.可用" />
              </div>
            </div>
            <div v-if="模式 === 'date'" class="picker-week-list">
              <div v-for="名 in 周名" :key="名" class="picker-week-list-item">
                {{ 名 }}
              </div>
            </div>
            <div class="picker-body">
              <div v-for="(行, 行序) in 格子行" :key="行序" class="picker-row">
                <div
                  v-for="格 in 行"
                  :key="格.键"
                  class="picker-cell"
                  :class="{
                    'picker-cell-in-view': 格.在视图,
                    'picker-cell-selected': 格.选中,
                    'picker-cell-today': 格.今天,
                    'picker-cell-hidden': 格.隐藏
                  }"
                  @click="格.隐藏 || 格.选择()"
                >
                  <div class="picker-date">
                    <div class="picker-date-value">{{ 格.文字 }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="模式 === 'date'" class="time-panel">
            <header class="time-panel-title">选择时间</header>
            <div ref="时间列容器" class="time-columns">
              <div v-for="列 in 时间列" :key="列.单位" class="time-column">
                <ul>
                  <li
                    v-for="值 in 列.选项"
                    :key="值"
                    class="time-cell"
                    :class="{
                      'time-cell-selected': 值 === 面板值?.[列.单位]()
                    }"
                    @click="选时间(列.单位, 值)"
                  >
                    <div class="time-cell-inner">
                      {{ String(值).padStart(2, '0') }}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div v-if="模式 === 'date'" class="picker-footer">
          <div class="picker-footer-extra">
            <slot name="extra" />
          </div>
          <div class="picker-footer-btn">
            <a-button
              class="picker-btn-confirm"
              type="primary"
              size="mini"
              :disabled="!面板值"
              @click="确认"
            >
              确定
            </a-button>
          </div>
        </div>
      </div>
    </template>
  </a-trigger>
</template>

<script setup>
import {
  IconCalendar,
  IconClose,
  IconDoubleLeft,
  IconDoubleRight,
  IconLeft,
  IconRight
} from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { 日期格式, 墙钟转毫秒, 解析日期 } from '@/utils/datetime.js'

defineOptions({ inheritAttrs: false })

const 文字 = defineModel({ type: String, default: '' })
const 可见 = defineModel('popupVisible', { type: Boolean, default: false })

const 最小年 = 1
const 最大年 = 9999
const 周名 = [...'日一二三四五六']
const 月名 = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月'
]
const 序列 = 长度 => Array.from({ length: 长度 }, (_, 序) => 序)
const 分行 = (列表, 列数) =>
  序列(列表.length / 列数).map(行 => 列表.slice(行 * 列数, (行 + 1) * 列数))
const 有效年 = 年 => 年 >= 最小年 && 年 <= 最大年
const 时间列 = [
  { 单位: 'hour', 选项: 序列(24) },
  { 单位: 'minute', 选项: 序列(60) },
  { 单位: 'second', 选项: 序列(60) }
]

// 面板值一律是 UTC 模式的 dayjs，只表示墙钟上的年月日时分秒，与系统时区无关。
function 取今天() {
  const 现在 = new Date()
  return dayjs.utc(
    墙钟转毫秒(现在.getFullYear(), 现在.getMonth() + 1, 现在.getDate())
  )
}

const 今天 = shallowRef(取今天())
const 已选 = computed(() => {
  const 结果 = 解析日期(文字.value)
  return 结果 && dayjs.utc(结果.墙钟毫秒)
})
// 面板上点选、尚未确定的值；确定后才写回输入框的原文。
const 待选 = shallowRef()
const 面板值 = computed(() => 待选.value ?? 已选.value)
const 显示文字 = computed(() => 待选.value?.format(日期格式) ?? 文字.value)

const 模式 = ref('date')
const 月序之 = 值 => 值.year() * 12 + 值.month()
const 月序 = ref(月序之(今天.value))
const 表头年 = computed(() => Math.floor(月序.value / 12))
const 表头月 = computed(() => 月序.value % 12)
const 年代起 = computed(() => Math.floor(表头年.value / 10) * 10)

// 年份面板按十年翻页，目标十年里有可选年份即可翻过去。
function 可翻(步长) {
  const 目标年 = Math.floor((月序.value + 步长) / 12)
  const 起 = 模式.value === 'year' ? Math.floor(目标年 / 10) * 10 : 目标年
  const 止 = 模式.value === 'year' ? 起 + 9 : 目标年
  return 步长 !== 0 && 止 >= 最小年 && 起 <= 最大年
}

// 年份面板从 0010–0019 往前翻十年会落到 0 年，表头停在 0001 年 1 月。
function 翻页(步长) {
  月序.value = Math.max(月序.value + 步长, 最小年 * 12)
}

const 按钮 = (步长, 图标) => ({ 步长, 图标, 可用: 可翻(步长) })
const 翻页按钮 = computed(() => {
  const 大步 = 模式.value === 'year' ? 120 : 12
  const 小步 = 模式.value === 'date' ? 1 : 0
  return {
    左: [按钮(-大步, IconDoubleLeft), 按钮(-小步, IconLeft)],
    右: [按钮(小步, IconRight), 按钮(大步, IconDoubleRight)]
  }
})

const 格子行 = computed(() => {
  const 今天值 = 今天.value
  if (模式.value === 'year') {
    return 分行(
      序列(12).map(序 => {
        const 年 = 年代起.value - 1 + 序
        return {
          键: 年,
          文字: 年,
          在视图: 序 > 0 && 序 < 11,
          今天: 年 === 今天值.year(),
          隐藏: !有效年(年),
          选择: () => 选年(年)
        }
      }),
      3
    )
  }
  if (模式.value === 'month') {
    return 分行(
      月名.map((名, 月) => ({
        键: 月,
        文字: 名,
        在视图: true,
        今天: 今天值.year() === 表头年.value && 今天值.month() === 月,
        选择: () => 选月(月)
      })),
      3
    )
  }

  const 首日 = dayjs.utc(墙钟转毫秒(表头年.value, 表头月.value + 1, 1))
  const 选中键 = 面板值.value?.format('YYYY-MM-DD')
  const 今天键 = 今天值.format('YYYY-MM-DD')
  return 分行(
    序列(42).map(序 => {
      const 值 = 首日.add(序 - 首日.day(), 'day')
      const 键 = 值.format('YYYY-MM-DD')
      return {
        键,
        文字: 值.date(),
        在视图: 值.month() === 表头月.value,
        选中: 键 === 选中键,
        今天: 键 === 今天键,
        隐藏: !有效年(值.year()),
        选择: () => 选日期(值)
      }
    }),
    7
  )
})

function 输入(事件) {
  文字.value = 事件.target.value
  待选.value = undefined
  模式.value = 'date'
  可见.value = true
}

function 确认() {
  if (待选.value) 文字.value = 待选.value.format(日期格式)
  可见.value = false
}

function 清空() {
  文字.value = ''
  待选.value = undefined
}

function 选日期(日) {
  const 时间 = 面板值.value
  待选.value = 时间
    ? 日.hour(时间.hour()).minute(时间.minute()).second(时间.second())
    : 日
}

function 选时间(单位, 值) {
  待选.value = (面板值.value ?? 今天.value)[单位](值)
}

function 选年(年) {
  月序.value = 年 * 12 + 表头月.value
  模式.value = 'month'
}

function 选月(月) {
  月序.value = 表头年.value * 12 + 月
  模式.value = 'date'
}

watch(可见, 打开 => {
  待选.value = undefined
  模式.value = 'date'
  if (!打开) return
  今天.value = 取今天()
  月序.value = 月序之(面板值.value ?? 今天.value)
})

watch(面板值, 值 => {
  if (值) 月序.value = 月序之(值)
})

// 每列把选中的时间滚到顶部，没有选中时回到顶部。
const 时间列容器 = useTemplateRef('时间列容器')
function 滚动时间列(behavior) {
  for (const 列 of 时间列容器.value?.children ?? []) {
    列.scrollTo({
      top: 列.querySelector('.time-cell-selected')?.offsetTop ?? 0,
      behavior
    })
  }
}

// 弹层打开时 v-show 在渲染后才恢复显示，须等本轮更新全部完成再滚动。
watch([可见, 模式], async () => {
  await nextTick()
  滚动时间列('instant')
})
watch(
  () => 面板值.value?.format('HH:mm:ss'),
  () => 滚动时间列('smooth'),
  { flush: 'post' }
)
</script>

<style scoped>
.date-time-picker {
  position: relative;
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  height: 36px;
  padding: 4px 11px 4px 4px;
  line-height: 1.5715;
  background-color: var(--color-fill-2);
  border: 1px solid transparent;
  border-radius: var(--border-radius-small);
  transition: all 0.1s cubic-bezier(0, 0, 1, 1);
}

.date-time-picker:hover {
  background-color: var(--color-fill-3);
}

.date-time-picker-focused,
.date-time-picker-focused:hover {
  background-color: var(--color-bg-2);
  border-color: rgb(var(--primary-6));
}

.arco-form-item-status-error .date-time-picker {
  background-color: var(--color-danger-light-1);
}

.arco-form-item-status-error .date-time-picker:hover {
  background-color: var(--color-danger-light-2);
}

.arco-form-item-status-error .date-time-picker-focused,
.arco-form-item-status-error .date-time-picker-focused:hover {
  background-color: var(--color-bg-2);
  border-color: rgb(var(--danger-6));
}

.date-time-picker-input {
  display: inline-flex;
  flex: 1;
}

.date-time-picker-input input {
  width: 100%;
  padding: 0 0 0 8px;
  color: var(--color-text-2);
  font-size: 14px;
  line-height: 1.5715;
  background-color: transparent;
  border: none;
  outline: none;
}

.date-time-picker-input input::placeholder {
  color: var(--color-text-3);
}

.date-time-picker-suffix {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  color: var(--color-text-2);
}

.date-time-picker-clear {
  position: relative;
  display: none;
  font-size: 12px;
  line-height: 12px;
  cursor: pointer;
}

.date-time-picker-clear::before {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: var(--border-radius-circle);
  transform: translate(-50%, -50%);
  transition: background-color 0.1s cubic-bezier(0, 0, 1, 1);
  content: '';
}

.date-time-picker-clear:hover::before {
  background-color: var(--color-fill-2);
}

.date-time-picker-clear .arco-icon {
  position: relative;
}

.date-time-picker:hover .date-time-picker-clear {
  display: inline-block;
}

.date-time-picker:hover
  .date-time-picker-clear
  + .date-time-picker-suffix-icon {
  display: none;
}

.date-time-picker-popup {
  box-sizing: border-box;
  overflow: hidden;
  background-color: var(--color-bg-popup);
  border: 1px solid var(--color-neutral-3);
  border-radius: var(--border-radius-medium);
  box-shadow: 0 2px 5px rgb(0 0 0 / 10%);
}

.picker-panels {
  display: flex;
}

.picker-panel {
  width: 265px;
}

.picker-header {
  display: flex;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-neutral-3);
}

.picker-header-title {
  flex: 1;
  color: var(--color-text-1);
  font-size: 14px;
  line-height: 24px;
  text-align: center;
}

.picker-header-icon {
  width: 24px;
  height: 24px;
  margin: 0 2px;
  color: var(--color-text-2);
  font-size: 12px;
  line-height: 24px;
  text-align: center;
  border-radius: 50%;
  transition: all 0.1s cubic-bezier(0, 0, 1, 1);
  user-select: none;
}

.picker-header-icon:not(.picker-header-icon-hidden) {
  cursor: pointer;
}

.picker-header-icon:not(.picker-header-icon-hidden):hover,
.picker-header-label:hover {
  background-color: var(--color-fill-3);
}

.picker-header-label {
  padding: 2px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.1s;
}

.picker-week-list {
  display: flex;
  padding: 14px 16px 0;
}

.picker-week-list-item {
  flex: 1;
  height: 32px;
  color: #7d7d7f;
  line-height: 32px;
  text-align: center;
}

.picker-body {
  padding: 14px 16px;
}

.picker-panel-date .picker-body {
  padding-top: 0;
}

.picker-row {
  display: flex;
  padding: 2px 0;
}

.picker-cell {
  flex: 1;
}

.picker-date {
  display: flex;
  justify-content: center;
  padding: 4px 0;
  cursor: pointer;
}

.picker-date-value {
  min-width: 24px;
  height: 24px;
  color: var(--color-text-4);
  font-size: 14px;
  line-height: 24px;
  text-align: center;
  border-radius: var(--border-radius-circle);
}

.picker-panel-month .picker-date,
.picker-panel-year .picker-date {
  padding: 4px;
}

.picker-panel-month .picker-date-value,
.picker-panel-year .picker-date-value {
  width: 100%;
  border-radius: 24px;
}

.picker-cell-in-view .picker-date-value {
  color: var(--color-text-1);
  font-weight: 500;
}

.picker-cell-selected .picker-date-value {
  color: var(--color-white);
  background-color: rgb(var(--primary-6));
  transition: background-color 0.1s cubic-bezier(0, 0, 1, 1);
}

.picker-cell-in-view:not(.picker-cell-selected) .picker-date-value:hover {
  background-color: var(--color-fill-3);
}

.picker-cell-today {
  position: relative;
}

.picker-cell-today::after {
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 4px;
  height: 4px;
  margin-left: -2px;
  background-color: rgb(var(--primary-6));
  border-radius: 50%;
  content: '';
}

.picker-cell-hidden .picker-date {
  cursor: default;
}

.picker-cell-hidden .picker-date-value {
  visibility: hidden;
}

.time-panel {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-neutral-3);
}

.time-panel-title {
  height: 40px;
  color: var(--color-text-1);
  font-size: 14px;
  line-height: 40px;
  text-align: center;
  border-bottom: 1px solid var(--color-neutral-3);
}

.time-columns {
  display: flex;
  height: 276px;
  padding: 0 6px;
}

.time-column {
  position: relative;
  padding: 0 4px;
  overflow: hidden;
}

.time-column:hover {
  overflow-y: auto;
}

.time-column::-webkit-scrollbar {
  width: 0;
}

.time-column ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.time-column ul::after {
  display: block;
  height: 244px;
  content: '';
}

.time-cell {
  width: 36px;
  padding: 4px 0;
  color: var(--color-text-1);
  font-weight: 500;
  cursor: pointer;
}

.time-cell-inner {
  height: 24px;
  padding-left: 10px;
  font-size: 14px;
  line-height: 24px;
}

.time-cell:hover .time-cell-inner,
.time-cell-selected .time-cell-inner {
  background-color: var(--color-fill-2);
}

.picker-footer {
  display: flex;
  border-top: 1px solid var(--color-neutral-3);
}

.picker-footer-extra {
  flex: 1;
  padding: 8px 12px;
  color: var(--color-text-1);
  font-size: 12px;
}

.picker-footer-btn {
  padding: 3px 8px;
}

.picker-btn-confirm {
  margin: 5px 0;
}
</style>
