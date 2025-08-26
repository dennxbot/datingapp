<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md text-center">
      <!-- Main Card -->
      <div class="glass-effect rounded-2xl shadow-2xl p-12 mb-6">
        <!-- Animated Hearts -->
        <div class="flex justify-center space-x-4 mb-8">
          <div class="text-4xl animate-pulse" style="animation-delay: 0ms">💕</div>
          <div class="text-4xl animate-pulse" style="animation-delay: 200ms">💖</div>
          <div class="text-4xl animate-pulse" style="animation-delay: 400ms">💗</div>
        </div>

        <!-- Header -->
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          🔍 Looking for someone...
        </h2>

        <!-- Spinner -->
        <div class="flex justify-center mb-6">
          <div class="relative">
            <div class="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <div class="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin-slow"></div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-gray-600 mb-8 leading-relaxed">
          Please wait while we find you a perfect match! 
          <br>
          <span class="text-sm opacity-75">This usually takes just a few seconds...</span>
        </p>

        <!-- Cancel Button -->
        <button
          @click="handleCancel"
          class="btn-secondary"
        >
          ❌ Cancel
        </button>
      </div>

      <!-- Tips -->
      <div class="glass-effect rounded-xl p-6">
        <h3 class="font-semibold text-gray-800 mb-4 flex items-center justify-center">
          <span class="mr-2">💡</span>
          Pro Tips
        </h3>
        <div class="space-y-3 text-sm text-gray-600">
          <div class="flex items-start">
            <span class="mr-2 mt-0.5">✨</span>
            <span>Be friendly and respectful to create great conversations</span>
          </div>
          <div class="flex items-start">
            <span class="mr-2 mt-0.5">🎭</span>
            <span>Express yourself with emoji reactions and replies</span>
          </div>
          <div class="flex items-start">
            <span class="mr-2 mt-0.5">🔄</span>
            <span>You can always find a new match if this one doesn't work out</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['cancel'])

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 4s linear infinite;
}
</style>
