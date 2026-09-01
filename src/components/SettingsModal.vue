<template>
  <a-modal
    v-model:visible="可见"
    title="设置"
    title-align="start"
    fullscreen
    unmount-on-close
    modal-animation-name="zoom-rb"
    :modal-class="['settings-modal', 是Mac ? 'is-mac' : '']"
    @before-open="同步草稿"
  >
    <div class="settings-layout">
      <div class="timezone-block">
        <div class="timezone-label">
          主页可选时区
          <span class="timezone-count">
            已选 {{ 草稿.已选.length }} / {{ 时区选项.length }}
          </span>
        </div>
        <div class="timezone-hint">
          勾选的时区会出现在主页的时区下拉框里，至少保留一个
        </div>
        <div class="timezone-toolbar">
          <a-input
            v-model="搜索词"
            class="timezone-search"
            placeholder="搜索时区名称、UTC 偏移或 ID"
            allow-clear
          >
            <template #prefix>
              <i class="i-material-symbols-search-rounded"></i>
            </template>
          </a-input>
        </div>
        <div class="timezone-list">
          <a-checkbox-group v-model="草稿.已选" class="timezone-grid">
            <a-checkbox
              v-for="项 in 过滤后选项"
              :key="项.value"
              :value="项.value"
              class="timezone-item"
            >
              <span class="timezone-item-name">{{ 项.name }}</span>
              <span class="timezone-item-meta">
                当前 {{ 项.utc偏移 }} · {{ 项.value }}
              </span>
            </a-checkbox>
          </a-checkbox-group>
          <a-empty
            v-if="!过滤后选项.length"
            class="timezone-empty"
            description="没有匹配的时区"
          />
        </div>
      </div>
      <a-form class="settings-form" layout="vertical" :model="草稿">
        <a-form-item label="主题">
          <a-radio-group v-model="草稿.主题" type="button">
            <a-radio v-for="项 in 主题选项" :key="项.value" :value="项.value">
              <i :class="项.icon"></i>
              {{ 项.label }}
            </a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </div>
    <template #footer>
      <div class="settings-footer">
        <a-popconfirm
          content-class="w-250px"
          content="时间戳的单位、时区列表、页面数据将恢复为初始值，确定吗？"
          @ok="重置"
        >
          <a-button>
            <template #icon>
              <i class="i-material-symbols-refresh-rounded"></i>
            </template>
            重置数据
          </a-button>
        </a-popconfirm>
        <div class="settings-footer-actions">
          <a-button @click="取消">取消</a-button>
          <a-button type="primary" @click="确认保存">保存</a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import { Message } from '@arco-design/web-vue'
import { computed, reactive, ref } from 'vue'
import { 主题偏好, 主题选项 } from '@/utils/theme.js'
import { 默认已选时区, 匹配时区选项 } from '@/utils/timezone.js'

const 是Mac = window.utools?.isMacOs() || false

const props = defineProps({
  时区选项: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['重置'])
const 可见 = defineModel('visible', { type: Boolean })
const 已选时区 = defineModel('已选时区')

const 草稿 = reactive({
  已选: [],
  主题: 'auto'
})

const 搜索词 = ref('')
// 打开弹窗那一刻的已选快照：已选置顶但会话内不随勾选变化重排，避免手滑取消后找不到
const 打开时已选 = ref(new Set())

const 排序选项 = computed(() => {
  const 置顶 = []
  const 其余 = []
  for (const 项 of props.时区选项) {
    ;(打开时已选.value.has(项.value) ? 置顶 : 其余).push(项)
  }
  return [...置顶, ...其余]
})

const 过滤后选项 = computed(() =>
  排序选项.value.filter(项 => 匹配时区选项(搜索词.value, 项))
)

function 同步草稿() {
  搜索词.value = ''
  草稿.已选 = [...已选时区.value]
  打开时已选.value = new Set(草稿.已选)
  草稿.主题 = 主题偏好.value
}

function 保存() {
  if (!草稿.已选.length) {
    Message.warning({ content: '至少保留一个时区', duration: 1000 })
    return false
  }
  已选时区.value = [...草稿.已选]
  主题偏好.value = 草稿.主题
  return true
}

function 确认保存() {
  if (保存() === false) return
  可见.value = false
}

function 取消() {
  可见.value = false
}

function 重置() {
  emit('重置')
  // defineModel 的 prop 要到下一次渲染才更新，直接取默认值而非回读
  草稿.已选 = [...默认已选时区]
}
</script>

<style lang="scss">
.zoom-rb-enter-from,
.zoom-rb-appear-from,
.zoom-rb-leave-to {
  transform: scale(0, 0);
  opacity: 0.1;
}

.zoom-rb-enter-to,
.zoom-rb-appear-to,
.zoom-rb-leave-from {
  transform: scale(1, 1);
  transform-origin: 100% 100%;
  opacity: 1;
}

.zoom-rb-enter-active,
.zoom-rb-appear-active,
.zoom-rb-leave-active {
  transform-origin: 100% 100%;
  transition: all 0.35s var(--ani-bezier);
}

.settings-modal.arco-modal {
  border-radius: 0 !important;
}

.settings-modal.is-mac {
  .arco-modal-header {
    flex-direction: row-reverse;
    padding-left: 16px;
  }

  .arco-modal-close-btn {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
    margin-left: 0;
    margin-right: 12px;
    color: transparent;
    background: #ff5f57;
    border-radius: 50%;
    box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 12%);

    .arco-icon-hover {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 12px;
      height: 12px;
      font-size: 8px;
      line-height: 1;

      &::before {
        display: none;
      }
    }

    .arco-icon {
      opacity: 0;
    }

    &:hover {
      color: #4c0002;

      .arco-icon {
        opacity: 1;
      }
    }
  }
}

.settings-modal.arco-modal-fullscreen {
  .arco-modal-body {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-height: 0;
    overflow: auto;
  }
}
</style>

<style lang="scss" scoped>
.settings-layout {
  --settings-gap: 30px;
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  gap: var(--settings-gap);
  min-height: 100%;
}

.settings-form {
  flex-shrink: 0;

  :deep(.arco-form-item) {
    margin-bottom: var(--settings-gap);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.timezone-block {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 340px;
}

.timezone-label {
  display: flex;
  flex-shrink: 0;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
  color: var(--color-text-2);
}

.timezone-count {
  font-size: 12px;
  color: var(--color-text-3);
}

.timezone-hint {
  flex-shrink: 0;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--color-text-3);
}

.timezone-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.timezone-search {
  width: 320px;
}

.timezone-list {
  flex: 1 1 0;
  min-height: 0;
  padding: 8px;
  overflow: auto;
  border: 1px solid var(--color-border-2);
  border-radius: var(--border-radius-medium);
}

.timezone-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2px;
}

.timezone-item {
  display: flex;
  align-items: center;
  margin-right: 0;
  padding: 6px 10px;
  border-radius: var(--border-radius-small);
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--color-fill-2);
  }

  &.arco-checkbox-checked {
    background-color: var(--color-primary-light-1);
  }

  :deep(.arco-checkbox-label) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.timezone-item-meta {
  margin-left: 8px;
  font-size: 12px;
  color: var(--color-text-3);
}

.timezone-empty {
  padding: 40px 0;
}

.settings-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.settings-footer-actions {
  display: flex;
  gap: 8px;
}
</style>
