<template>
  <div class="bg-purple-50 border border-purple-200 shadow-lg px-4 py-4 animate-in slide-in-from-bottom duration-200">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <!-- Reply Icon -->
          <div class="text-purple-600 text-xl font-bold">↩️</div>
          
          <!-- Reply Content -->
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-purple-700 mb-1">
              Replying to {{ replyTo.username || replyTo.isOwn ? 'You' : replyTo.username }}
            </div>
            <div class="text-sm text-gray-700 truncate bg-white/70 px-2 py-1 rounded border-l-4 border-purple-400">
              {{ replyTo.text }}
            </div>
          </div>
        </div>

        <!-- Cancel Button -->
        <button
          @click="$emit('cancel')"
          class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 transition-colors duration-200 flex items-center justify-center text-red-600 hover:text-red-700 font-bold text-lg"
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
