<template>
  <div class="glass-effect border-t border-white/20 px-4 py-3">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <!-- Reply Icon -->
          <div class="text-purple-600 text-lg">↩️</div>
          
          <!-- Reply Content -->
          <div class="flex-1 min-w-0">
            <div class="text-xs font-medium text-purple-600 mb-1">
              Replying to {{ replyTo.username }}
            </div>
            <div class="text-sm text-gray-700 truncate">
              {{ replyTo.text }}
            </div>
          </div>
        </div>

        <!-- Cancel Button -->
        <button
          @click="$emit('cancel')"
          class="flex-shrink-0 w-8 h-8 rounded-full hover:bg-white/50 transition-colors duration-200 flex items-center justify-center text-gray-500 hover:text-gray-700"
          title="Cancel reply"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  replyTo: {
    type: Object,
    required: true
  }
})

defineEmits(['cancel'])
</script>
