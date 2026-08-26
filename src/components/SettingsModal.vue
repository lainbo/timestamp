<template>
  <a-modal
    v-model:visible="可见"
    title="设置"
    fullscreen
    unmount-on-close
    modal-class="settings-modal"
    @open="同步草稿"
  >
    <div class="settings-layout">
      <div class="timezone-block">
        <div class="timezone-label">时区列表</div>
        <a-transfer
          v-model="草稿.已选"
          class="timezone-transfer"
          :data="时区选项"
          show-search
          :title="['未选', '已选']"
          :source-input-search-props="{
            placeholder: '搜索未选时区(英文名能更好的匹配)'
          }"
          :target-input-search-props="{
            placeholder: '搜索已选时区(英文名能更好的匹配)'
          }"
        />
      </div>
      <a-form class="settings-form" layout="vertical" :model="草稿">
        <a-form-item label="默认时间戳单位">
          <a-radio-group v-model="草稿.单位" type="button">
            <a-radio value="ns">纳秒</a-radio>
            <a-radio value="ms">毫秒</a-radio>
            <a-radio value="s">秒</a-radio>
          </a-radio-group>
        </a-form-item>
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
          content="时间戳的单位、时区、页面数据将恢复为初始值，确定吗？"
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
import { reactive } from 'vue'
import { 主题偏好, 主题选项 } from '@/utils/theme.js'

defineProps({
  时区选项: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['重置'])
const 可见 = defineModel('visible', { type: Boolean })
const 已选时区 = defineModel('已选时区')
const 时间戳类型 = defineModel('时间戳类型')

const 草稿 = reactive({
  已选: [],
  单位: 'ms',
  主题: 'auto'
})

function 同步草稿() {
  草稿.已选 = [...已选时区.value]
  草稿.单位 = 时间戳类型.value
  草稿.主题 = 主题偏好.value
}

function 保存() {
  if (!草稿.已选.length) {
    Message.warning({ content: '至少保留一个时区', duration: 1000 })
    return false
  }
  已选时区.value = [...草稿.已选]
  时间戳类型.value = 草稿.单位
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
  草稿.单位 = 'ms'
}
</script>

<style lang="scss">
.settings-modal.arco-modal-fullscreen {
  .arco-modal-body {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-height: 0;
    overflow: auto;
  }
}

.settings-layout {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  gap: 30px;
  min-height: 100%;
}

.timezone-block {
  display: flex;
  flex: 1 0 280px;
  flex-direction: column;
  min-height: 280px;
}

.timezone-label {
  flex-shrink: 0;
  margin-bottom: 8px;
  color: var(--color-text-2);
}

.timezone-transfer.arco-transfer {
  align-items: stretch;
  flex: 1 1 0;
  width: 100%;
  min-height: 0;
}

.timezone-transfer .arco-transfer-view {
  flex: 1;
  width: auto;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.timezone-transfer .arco-transfer-view-body {
  min-height: 0;
}

.settings-form {
  flex-shrink: 0;

  .arco-form-item {
    margin-bottom: 30px;

    &:last-child {
      margin-bottom: 0;
    }
  }
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
