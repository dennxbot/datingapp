<template>
  <div 
    class="group"
    :class="message.isOwn ? 'flex justify-end' : 'flex justify-start'"
  >
    <div 
      class="relative max-w-xs md:max-w-md lg:max-w-lg"
      :class="message.isOwn ? 'order-2' : 'order-1'"
    >
      <!-- Reply Info -->
      <div 
        v-if="message.replyTo" 
        class="mb-2 px-3 py-2 rounded-lg bg-gray-100/70 border-l-4 border-purple-400 text-sm"
      >
        <div class="font-medium text-purple-600 text-xs mb-1">
          Replying to {{ message.replyTo.username }}
        </div>
        <div class="text-gray-600 truncate">
          {{ message.replyTo.text }}
        </div>
      </div>

      <!-- Message Bubble -->
      <div 
        class="relative px-4 py-3 rounded-2xl shadow-md transition-all duration-300 group-hover:shadow-lg cursor-pointer"
        :class="message.isOwn ? 
          'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md' : 
          'glass-effect text-gray-800 rounded-bl-md'"
        @contextmenu.prevent="showContextMenu"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <!-- Editing State -->
        <div v-if="isEditing" class="space-y-3">
          <textarea
            v-model="editText"
            class="w-full p-2 border rounded-lg bg-white text-gray-800 resize-none"
            rows="2"
            maxlength="500"
          ></textarea>
          <div class="flex space-x-2">
            <button 
              @click="saveEdit"
              class="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
            >
              Save
            </button>
            <button 
              @click="cancelEdit"
              class="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Normal Message -->
        <div v-else>
          <p class="break-words">{{ message.text }}</p>
          
          <!-- Message Meta -->
          <div class="flex items-center justify-between mt-2 text-xs opacity-75">
            <span>{{ message.isOwn ? 'You' : message.username }}</span>
            <div class="flex items-center space-x-2">
              <span>{{ formatTime(message.timestamp) }}</span>
              <span v-if="message.isEdited" class="italic">(edited)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Reactions -->
      <div v-if="message.reactions && message.reactions.size > 0" class="flex flex-wrap gap-1 mt-2">
        <span 
          v-for="[emoji, count] in message.reactions" 
          :key="emoji"
          class="inline-flex items-center px-2 py-1 bg-white/70 backdrop-blur-sm rounded-full text-sm border border-white/30 shadow-sm"
        >
          {{ emoji }} {{ count }}
        </span>
      </div>
    </div>
  </div>

  <!-- Context Menu -->
  <ContextMenu
    v-if="showMenu"
    :x="menuPosition.x"
    :y="menuPosition.y"
    :is-own-message="message.isOwn"
    @react="handleReaction"
    @reply="handleReply"
    @edit="startEdit"
    @copy="handleCopy"
    @close="hideContextMenu"
  />
</template>

<script setup>
import { ref } from 'vue'
import ContextMenu from './ContextMenu.vue'

const props = defineProps({
  message: Object,
  currentUsername: String
})

const emit = defineEmits(['add-reaction', 'edit-message', 'reply-to-message'])

const isEditing = ref(false)
const editText = ref('')
const showMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

let pressTimer = null
let isLongPress = false

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const showContextMenu = (event) => {
  event.preventDefault()
  menuPosition.value = { x: event.clientX, y: event.clientY }
  showMenu.value = true
}

const hideContextMenu = () => {
  showMenu.value = false
}

const handleMouseDown = (event) => {
  if (event.button !== 0) return
  
  isLongPress = false
  pressTimer = setTimeout(() => {
    isLongPress = true
    showContextMenu(event)
  }, 500)
}

const handleMouseUp = () => {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

const handleTouchStart = (event) => {
  const touch = event.touches[0]
  isLongPress = false
  pressTimer = setTimeout(() => {
    isLongPress = true
    showContextMenu({ 
      preventDefault: () => {},
      clientX: touch.clientX, 
      clientY: touch.clientY 
    })
  }, 500)
}

const handleTouchEnd = () => {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

const handleReaction = (emoji) => {
  emit('add-reaction', {
    messageId: props.message.id,
    emoji
  })
  hideContextMenu()
}

const handleReply = () => {
  console.log('MessageBubble: handleReply called')
  console.log('MessageBubble: About to emit reply-to-message with:', props.message)
  emit('reply-to-message', {
    messageId: props.message.id,
    message: props.message
  })
  console.log('MessageBubble: Event emitted, hiding context menu')
  hideContextMenu()
}

const startEdit = () => {
  isEditing.value = true
  editText.value = props.message.text
  hideContextMenu()
}

const saveEdit = () => {
  if (editText.value.trim() && editText.value.trim() !== props.message.text) {
    emit('edit-message', {
      messageId: props.message.id,
      newText: editText.value.trim()
    })
  }
  cancelEdit()
}

const cancelEdit = () => {
  isEditing.value = false
  editText.value = ''
}

const handleCopy = () => {
  navigator.clipboard.writeText(props.message.text)
  hideContextMenu()
}
</script>
