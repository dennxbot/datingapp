<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50"
      @click="$emit('close')"
    >
      <div
        ref="menuRef"
        class="absolute glass-effect rounded-xl shadow-2xl border border-white/30 py-2 min-w-48 z-50"
        :style="{ left: adjustedX + 'px', top: adjustedY + 'px' }"
        @click.stop
      >
        <!-- Emoji Reactions -->
        <div class="px-3 py-2 border-b border-white/20">
          <div class="text-xs font-medium text-gray-600 mb-2">React</div>
          <div class="flex space-x-1">
            <button
              v-for="emoji in emojis"
              :key="emoji"
              @click="$emit('react', emoji)"
              class="w-8 h-8 rounded-lg hover:bg-white/50 transition-colors duration-200 flex items-center justify-center text-lg"
            >
              {{ emoji }}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="py-1">
          <button
            @click="() => { console.log('Reply button clicked'); $emit('reply') }"
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-white/50 transition-colors duration-200 flex items-center"
          >
            <span class="mr-3">↩️</span>
            Reply
          </button>

          <button
            v-if="isOwnMessage"
            @click="$emit('edit')"
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-white/50 transition-colors duration-200 flex items-center"
          >
            <span class="mr-3">✏️</span>
            Edit
          </button>

          <button
            @click="$emit('copy')"
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-white/50 transition-colors duration-200 flex items-center"
          >
            <span class="mr-3">📋</span>
            Copy
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

const props = defineProps({
  x: Number,
  y: Number,
  isOwnMessage: Boolean
})

const emit = defineEmits(['react', 'reply', 'edit', 'copy', 'close'])

const menuRef = ref(null)
const visible = ref(true)

const emojis = ['❤️', '😂', '😮', '😢', '😡', '👍']

const adjustedX = computed(() => {
  if (!menuRef.value) return props.x
  
  const menuWidth = 192 // min-w-48 = 192px
  const viewportWidth = window.innerWidth
  
  if (props.x + menuWidth > viewportWidth - 20) {
    return Math.max(20, viewportWidth - menuWidth - 20)
  }
  
  return Math.max(20, props.x)
})

const adjustedY = computed(() => {
  if (!menuRef.value) return props.y
  
  const menuHeight = menuRef.value.offsetHeight
  const viewportHeight = window.innerHeight
  
  if (props.y + menuHeight > viewportHeight - 20) {
    return Math.max(20, props.y - menuHeight - 20)
  }
  
  return Math.max(20, props.y)
})

onMounted(async () => {
  await nextTick()
  // Focus trap for accessibility
  if (menuRef.value) {
    const firstButton = menuRef.value.querySelector('button')
    if (firstButton) {
      firstButton.focus()
    }
  }
})
</script>
