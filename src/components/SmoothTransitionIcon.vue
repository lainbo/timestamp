<template>
  <component :is="渲染标签" ref="组件的Ref" class="size-fit flex">
    <transition name="custom-fade">
      <i v-if="hover时候的class && 组件被hover" :class="[hover时候的class]" />

      <i v-else :class="[默认图标class]" />
    </transition>
  </component>
</template>

<script setup>
// 单图标渲染, hover 时渐隐渐显切换: 元素始终为正方形, 旋转时命中区域不变化, 避免 hover 边界抖动
import { ref } from 'vue'
import { useElementHover } from '@vueuse/core'

defineProps({
  默认图标class: {
    type: String,
    required: true
  },
  hover时候的class: {
    type: String
  },
  渲染标签: {
    type: String,
    default: 'span'
  }
})

const 组件的Ref = ref()
const 组件被hover = useElementHover(组件的Ref)
</script>
