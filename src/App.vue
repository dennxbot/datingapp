<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
    <!-- Login Screen -->
    <LoginScreen 
      v-if="currentScreen === 'login'"
      @join="handleJoin"
    />
    
    <!-- Waiting Screen -->
    <WaitingScreen 
      v-else-if="currentScreen === 'waiting'"
      @cancel="handleCancelWait"
    />
    
    <!-- Chat Screen -->
    <ChatScreen 
      v-else-if="currentScreen === 'chat'"
      :partner-username="partnerUsername"
      :current-username="currentUsername"
      :is-partner-online="isPartnerOnline"
      :is-partner-typing="isPartnerTyping"
      :messages="messages"
      @send-message="handleSendMessage"
      @find-new-match="handleFindNewMatch"
      @add-reaction="handleAddReaction"
      @edit-message="handleEditMessage"
      @typing="handleTyping"
    />
    
    <!-- Partner Left Screen -->
    <PartnerLeftScreen 
      v-else-if="currentScreen === 'partner-left'"
      @find-another-match="handleFindNewMatch"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import LoginScreen from './components/LoginScreen.vue'
import WaitingScreen from './components/WaitingScreen.vue'
import ChatScreen from './components/ChatScreen.vue'
import PartnerLeftScreen from './components/PartnerLeftScreen.vue'

// Reactive state
const currentScreen = ref('login')
const currentUsername = ref('')
const partnerUsername = ref('')
const currentRoomId = ref('')
const isPartnerOnline = ref(false)
const isPartnerTyping = ref(false)
const messages = ref([])
const socket = ref(null)

// Socket.IO setup
onMounted(() => {
  socket.value = io()
  
  // Socket event listeners
  socket.value.on('waiting', () => {
    console.log('Waiting for a match...')
    currentScreen.value = 'waiting'
  })
  
  socket.value.on('matched', (data) => {
    console.log('Matched with:', data.partnerUsername)
    currentRoomId.value = data.roomId
    partnerUsername.value = data.partnerUsername
    messages.value = []
    currentScreen.value = 'chat'
  })
  
  socket.value.on('new_message', (data) => {
    console.log('New message:', data)
    const isOwn = data.username === currentUsername.value
    
    messages.value.push({
      id: data.messageId,
      username: data.username,
      text: data.message,
      timestamp: data.timestamp,
      isOwn,
      replyTo: data.replyTo,
      reactions: new Map()
    })
  })
  
  socket.value.on('partner_left', () => {
    console.log('Partner left the chat')
    isPartnerTyping.value = false
    currentScreen.value = 'partner-left'
  })
  
  socket.value.on('join_error', (data) => {
    alert(data.error)
  })
  
  socket.value.on('partner_status', (data) => {
    isPartnerOnline.value = data.online
  })
  
  socket.value.on('partner_typing', (data) => {
    isPartnerTyping.value = data.typing
  })
  
  socket.value.on('message_reaction', (data) => {
    const message = messages.value.find(m => m.id === data.messageId)
    if (message) {
      if (!message.reactions.has(data.emoji)) {
        message.reactions.set(data.emoji, 0)
      }
      message.reactions.set(data.emoji, message.reactions.get(data.emoji) + 1)
    }
  })
  
  socket.value.on('message_edited', (data) => {
    const message = messages.value.find(m => m.id === data.messageId)
    if (message) {
      message.text = data.newText
      message.isEdited = true
    }
  })
  
  socket.value.on('rate_limited', (data) => {
    alert(data.error)
  })
  
  socket.value.on('message_error', (data) => {
    alert(data.error)
  })
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect()
  }
})

// Event handlers
const handleJoin = (username) => {
  currentUsername.value = username
  socket.value.emit('join', { username })
}

const handleCancelWait = () => {
  socket.value.disconnect()
  location.reload()
}

const handleFindNewMatch = () => {
  socket.value.emit('find_new_match')
  currentScreen.value = 'waiting'
}

const handleSendMessage = (messageData) => {
  socket.value.emit('chat_message', messageData)
}

const handleAddReaction = (data) => {
  socket.value.emit('add_reaction', data)
}

const handleEditMessage = (data) => {
  socket.value.emit('edit_message', data)
}

let typingTimer = null
let isTyping = false

const handleTyping = () => {
  if (!isTyping) {
    isTyping = true
    socket.value.emit('typing_start')
  }
  
  if (typingTimer) {
    clearTimeout(typingTimer)
  }
  
  typingTimer = setTimeout(() => {
    isTyping = false
    socket.value.emit('typing_stop')
  }, 1000)
}
</script>
