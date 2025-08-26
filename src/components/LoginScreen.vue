<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Welcome Card -->
      <div class="glass-effect rounded-2xl shadow-2xl p-8 mb-6">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="text-6xl mb-4 animate-bounce-gentle">💕</div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Dating App
          </h1>
          <p class="text-gray-600">Connect with someone special</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
              Choose your username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              maxlength="20"
              placeholder="Enter a unique username..."
              class="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm"
              :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-200': error }"
            >
            <div class="flex justify-between items-center mt-2">
              <span v-if="error" class="text-sm text-red-500">{{ error }}</span>
              <span class="text-sm text-gray-500 ml-auto">{{ username.length }}/20</span>
            </div>
          </div>

          <button
            type="submit"
            :disabled="!username.trim() || isLoading"
            class="w-full btn-gradient disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Joining...
            </span>
            <span v-else>
              🚀 Start Chatting
            </span>
          </button>
        </form>
      </div>

      <!-- Features -->
      <div class="grid grid-cols-1 gap-4">
        <div class="glass-effect rounded-xl p-4 text-center">
          <div class="text-2xl mb-2">⚡</div>
          <h3 class="font-semibold text-gray-800 mb-1">Instant Matching</h3>
          <p class="text-sm text-gray-600">Get matched with someone instantly</p>
        </div>
        
        <div class="glass-effect rounded-xl p-4 text-center">
          <div class="text-2xl mb-2">🔒</div>
          <h3 class="font-semibold text-gray-800 mb-1">Anonymous & Safe</h3>
          <p class="text-sm text-gray-600">No registration required, completely anonymous</p>
        </div>
        
        <div class="glass-effect rounded-xl p-4 text-center">
          <div class="text-2xl mb-2">💬</div>
          <h3 class="font-semibold text-gray-800 mb-1">Real-time Chat</h3>
          <p class="text-sm text-gray-600">Live messaging with reactions and replies</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['join'])

const username = ref('')
const isLoading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  error.value = ''
  
  if (!username.value.trim()) {
    error.value = 'Username is required'
    return
  }
  
  if (username.value.length < 2) {
    error.value = 'Username must be at least 2 characters'
    return
  }
  
  if (username.value.length > 20) {
    error.value = 'Username must be 20 characters or less'
    return
  }
  
  if (!/^[a-zA-Z0-9\s_-]+$/.test(username.value)) {
    error.value = 'Username can only contain letters, numbers, spaces, hyphens, and underscores'
    return
  }
  
  isLoading.value = true
  
  try {
    emit('join', username.value.trim())
  } catch (err) {
    error.value = 'Failed to join. Please try again.'
    isLoading.value = false
  }
}
</script>
