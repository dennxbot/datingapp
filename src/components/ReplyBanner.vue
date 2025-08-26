<template>
  <div class="bg-purple-100 border-2 border-purple-300 shadow-xl px-4 py-4 transition-all duration-300 transform translate-y-0">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <!-- Reply Icon -->
          <div class="text-purple-600 text-2xl font-bold bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md">↩️</div>
          
          <!-- Reply Content -->
          <div class="flex-1 min-w-0">
            <div class="text-base font-bold text-purple-800 mb-2">
              Replying to {{ replyTo.isOwn ? 'yourself' : (replyTo.username || 'User') }}
            </div>
            <div class="text-sm text-gray-800 bg-white px-3 py-2 rounded-lg border-l-4 border-purple-500 shadow-sm">
              {{ replyTo.text }}
            </div>
          </div>
        </div>

        <!-- Cancel Button -->
        <button
          @click="$emit('cancel')"
          class="flex-shrink-0 w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 flex items-center justify-center text-white font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105"
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
