<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md text-center">
      <!-- Main Card -->
      <div class="glass-effect rounded-2xl shadow-2xl p-12">
        <!-- Sad Emoji -->
        <div class="text-6xl mb-6 animate-bounce-gentle">😔</div>

        <!-- Header -->
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          Your chat partner left
        </h2>

        <!-- Description -->
        <p class="text-gray-600 mb-8 leading-relaxed">
          Don't worry! There are plenty of other people to chat with.
          <br>
          <span class="text-sm opacity-75">Every ending is a new beginning! 🌟</span>
        </p>

        <!-- Action Button -->
        <button
          @click="handleFindAnother"
          class="btn-gradient mb-4"
        >
          💫 Find Another Match
        </button>

        <!-- Encouraging Message -->
        <div class="glass-effect rounded-xl p-4 mt-6 bg-gradient-to-r from-green-50 to-blue-50">
          <div class="text-2xl mb-2">🌈</div>
          <p class="text-sm text-gray-700">
            <strong>Stay positive!</strong>
            <br>
            Sometimes connections don't work out, and that's perfectly normal.
            Your perfect match is just one click away!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['find-another-match'])

const handleFindAnother = () => {
  emit('find-another-match')
}
</script>
