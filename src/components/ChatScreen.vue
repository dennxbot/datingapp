<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
    <!-- Header -->
    <div class="glass-effect sticky top-0 z-10 px-4 py-4 border-b border-white/20">
      <div class="flex items-center justify-between max-w-4xl mx-auto">
        <div class="flex items-center space-x-4">
          <div class="text-2xl">💬</div>
          <div>
            <h2 class="text-lg font-semibold text-gray-800">
              Chat with <span class="text-purple-600">{{ partnerUsername }}</span>
            </h2>
            <div class="flex items-center space-x-2">
              <span 
                class="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full"
                :class="isPartnerOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                <span class="w-2 h-2 rounded-full mr-1" :class="isPartnerOnline ? 'bg-green-400' : 'bg-red-400'"></span>
                {{ isPartnerOnline ? 'Online' : 'Offline' }}
              </span>
            </div>
          </div>
        </div>
        
        <button
          @click="$emit('find-new-match')"
          class="btn-secondary text-sm py-2 px-4"
        >
          🔄 Find New Match
        </button>
      </div>
    </div>

    <!-- Messages Container -->
    <div 
      ref="messagesContainer"
      class="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-purple"
    >
      <div class="max-w-4xl mx-auto space-y-4">
        <!-- Welcome Message -->
        <div class="text-center py-8">
          <div class="glass-effect rounded-xl p-6 inline-block">
            <div class="text-3xl mb-2">🎉</div>
            <p class="text-gray-700 font-medium">You've been matched! Say hello!</p>
          </div>
        </div>

        <!-- Messages -->
        <MessageBubble
          v-for="message in messages"
          :key="message.id"
          :message="message"
          :current-username="currentUsername"
          @add-reaction="$emit('add-reaction', $event)"
          @edit-message="$emit('edit-message', $event)"
          @reply-to-message="handleReply"
        />
      </div>
    </div>

    <!-- Typing Indicator -->
    <div 
      v-if="isPartnerTyping"
      class="px-4 py-2"
    >
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center space-x-2 text-gray-500 text-sm">
          <span>{{ partnerUsername }} is typing</span>
          <div class="flex space-x-1">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reply Banner -->
    <div 
      v-if="replyingTo"
      class="bg-purple-100 border-2 border-purple-300 shadow-xl px-4 py-4 transition-all duration-300"
    >
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 flex-1 min-w-0">
            <div class="text-purple-600 text-2xl font-bold bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md">↩️</div>
            <div class="flex-1 min-w-0">
              <div class="text-base font-bold text-purple-800 mb-2">
                Replying to {{ replyingTo.isOwn ? 'yourself' : (replyingTo.username || 'User') }}
              </div>
              <div class="text-sm text-gray-800 bg-white px-3 py-2 rounded-lg border-l-4 border-purple-500 shadow-sm">
                {{ replyingTo.text }}
              </div>
            </div>
          </div>
          <button
            @click="cancelReply"
            class="flex-shrink-0 w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 flex items-center justify-center text-white font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105"
            title="Cancel reply"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="glass-effect border-t border-white/20 px-4 py-4">
      <div class="max-w-4xl mx-auto">
        <form @submit.prevent="handleSendMessage" class="flex items-end space-x-4">
          <div class="flex-1">
            <textarea
              v-model="messageText"
              @input="$emit('typing')"
              @keypress.enter.exact.prevent="handleSendMessage"
              placeholder="Type your message..."
              rows="1"
              maxlength="500"
              class="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm resize-none"
              style="max-height: 120px; min-height: 48px;"
            ></textarea>
            <div class="flex justify-between items-center mt-2 px-2">
              <span class="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</span>
              <span class="text-xs text-gray-500">{{ messageText.length }}/500</span>
            </div>
          </div>
          
          <button
            type="submit"
            :disabled="!messageText.trim()"
            class="btn-gradient disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none px-6 py-3"
          >
            <span class="text-lg">🚀</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import MessageBubble from './MessageBubble.vue'
import ReplyBanner from './ReplyBanner.vue'

const props = defineProps({
  partnerUsername: String,
  currentUsername: String,
  isPartnerOnline: Boolean,
  isPartnerTyping: Boolean,
  messages: Array
})

const emit = defineEmits(['send-message', 'find-new-match', 'add-reaction', 'edit-message', 'typing'])

const messageText = ref('')
const replyingTo = ref(null)
const messagesContainer = ref(null)

const handleSendMessage = () => {
  if (!messageText.value.trim()) return
  
  const messageData = {
    message: messageText.value.trim()
  }
  
  if (replyingTo.value) {
    messageData.replyTo = replyingTo.value
    cancelReply()
  }
  
  emit('send-message', messageData)
  messageText.value = ''
}

const handleReply = (event) => {
  console.log('ChatScreen: handleReply called with event:', event)
  console.log('ChatScreen: Setting replyingTo to:', event.message)
  replyingTo.value = event.message
  console.log('ChatScreen: replyingTo is now:', replyingTo.value)
}

const cancelReply = () => {
  replyingTo.value = null
}

// Auto-scroll to bottom when new messages arrive
watch(() => props.messages, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}, { deep: true })
</script>
