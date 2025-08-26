// Initialize Socket.IO connection
const socket = io();

// Get DOM elements
const loginScreen = document.getElementById('login-screen');
const waitingScreen = document.getElementById('waiting-screen');
const chatScreen = document.getElementById('chat-screen');
const partnerLeftScreen = document.getElementById('partner-left-screen');

const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');
const cancelWaitBtn = document.getElementById('cancel-wait');
const findNewMatchBtn = document.getElementById('find-new-match');
const findAnotherMatchBtn = document.getElementById('find-another-match');

const partnerNameSpan = document.getElementById('partner-name');
const partnerNameTyping = document.getElementById('partner-name-typing');
const onlineStatus = document.getElementById('online-status');
const typingIndicator = document.getElementById('typing-indicator');
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const charCount = document.getElementById('char-count');

// Current user state
let currentUsername = '';
let currentRoomId = '';
let partnerUsername = '';
let typingTimer = null;
let isTyping = false;
let messageReactions = new Map(); // messageId -> {emoji -> count}

// Screen management
function showScreen(screenToShow) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the target screen
    screenToShow.classList.add('active');
}

// Clear chat messages
function clearChat() {
    messagesContainer.innerHTML = '<div class="welcome-message">🎉 You\'ve been matched! Say hello!</div>';
    messageReactions.clear();
}

// Format timestamp for display
function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Update character counter
function updateCharCounter() {
    const length = messageInput.value.length;
    charCount.textContent = length;
    
    const counter = charCount.parentElement;
    counter.className = 'char-counter';
    
    if (length > 450) {
        counter.classList.add('danger');
    } else if (length > 400) {
        counter.classList.add('warning');
    }
}

// Show typing indicator
function showTypingIndicator() {
    if (partnerUsername) {
        partnerNameTyping.textContent = partnerUsername;
    }
    typingIndicator.classList.remove('hidden');
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.classList.add('hidden');
}

// Handle typing detection
function handleTyping() {
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing_start');
    }
    
    // Clear existing timer
    if (typingTimer) {
        clearTimeout(typingTimer);
    }
    
    // Set timer to stop typing
    typingTimer = setTimeout(() => {
        isTyping = false;
        socket.emit('typing_stop');
    }, 1000);
}

// Add emoji reaction to message
function addReaction(emoji, messageId) {
    if (!messageId) {
        // Get the current reaction target
        const target = document.querySelector('.message[data-show-reactions="true"]');
        if (!target) return;
        messageId = target.dataset.messageId;
    }
    
    socket.emit('add_reaction', { messageId, emoji });
    hideAllReactionButtons();
}

// Show reaction buttons for a message
function showReactionButtons(messageElement) {
    hideAllReactionButtons();
    
    const existing = messageElement.querySelector('.reaction-buttons');
    if (existing) {
        existing.style.display = 'block';
        return;
    }
    
    const reactionButtons = createReactionButtons();
    messageElement.appendChild(reactionButtons);
    messageElement.dataset.showReactions = 'true';
    
    setTimeout(() => {
        reactionButtons.style.display = 'block';
    }, 10);
}

// Hide all reaction buttons
function hideAllReactionButtons() {
    document.querySelectorAll('.reaction-buttons').forEach(btn => {
        btn.style.display = 'none';
    });
    document.querySelectorAll('.message').forEach(msg => {
        delete msg.dataset.showReactions;
    });
}

// Create emoji reaction buttons
function createReactionButtons() {
    const div = document.createElement('div');
    div.className = 'reaction-buttons';
    div.innerHTML = `
        <button onclick="addReaction('👍')">👍</button>
        <button onclick="addReaction('❤️')">❤️</button>
        <button onclick="addReaction('😂')">😂</button>
        <button onclick="addReaction('😮')">😮</button>
        <button onclick="addReaction('😢')">😢</button>
        <button onclick="addReaction('😡')">😡</button>
    `;
    return div;
}

// Add message to chat
function addMessage(username, message, timestamp, messageId, isOwn = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
    messageDiv.dataset.messageId = messageId;
    messageDiv.style.position = 'relative';
    
    const messageText = document.createElement('div');
    messageText.textContent = message;
    
    const messageMeta = document.createElement('div');
    messageMeta.className = 'message-meta';
    
    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = isOwn ? 'You' : username;
    
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'message-timestamp';
    timestampSpan.textContent = formatTimestamp(timestamp);
    
    messageMeta.appendChild(usernameSpan);
    messageMeta.appendChild(timestampSpan);
    
    // Create reactions container
    const reactionsContainer = document.createElement('div');
    reactionsContainer.className = 'message-reactions';
    
    messageDiv.appendChild(messageText);
    messageDiv.appendChild(messageMeta);
    messageDiv.appendChild(reactionsContainer);
    
    // Add long press/double click for reactions
    let pressTimer;
    messageDiv.addEventListener('mousedown', () => {
        pressTimer = setTimeout(() => {
            showReactionButtons(messageDiv);
        }, 500);
    });
    
    messageDiv.addEventListener('mouseup', () => {
        if (pressTimer) clearTimeout(pressTimer);
    });
    
    messageDiv.addEventListener('dblclick', () => {
        showReactionButtons(messageDiv);
    });
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Socket event listeners
socket.on('waiting', () => {
    console.log('Waiting for a match...');
    showScreen(waitingScreen);
});

socket.on('matched', (data) => {
    console.log('Matched with:', data.partnerUsername);
    currentRoomId = data.roomId;
    partnerUsername = data.partnerUsername;
    partnerNameSpan.textContent = partnerUsername;
    clearChat();
    showScreen(chatScreen);
    
    // Focus on message input
    setTimeout(() => {
        messageInput.focus();
    }, 100);
});

socket.on('new_message', (data) => {
    console.log('New message:', data);
    const isOwn = data.username === currentUsername;
    addMessage(data.username, data.message, data.timestamp, data.messageId, isOwn);
});

socket.on('partner_left', () => {
    console.log('Partner left the chat');
    hideTypingIndicator();
    showScreen(partnerLeftScreen);
});

// New socket event listeners
socket.on('join_error', (data) => {
    alert(data.error);
    usernameInput.focus();
});

socket.on('partner_status', (data) => {
    if (data.online) {
        onlineStatus.textContent = '🟢 Online';
        onlineStatus.className = 'status-badge online';
    } else {
        onlineStatus.textContent = '🔴 Offline';
        onlineStatus.className = 'status-badge offline';
    }
});

socket.on('partner_typing', (data) => {
    if (data.typing) {
        showTypingIndicator();
    } else {
        hideTypingIndicator();
    }
});

socket.on('message_reaction', (data) => {
    const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (!messageElement) return;
    
    const reactionsContainer = messageElement.querySelector('.message-reactions');
    
    // Find existing reaction or create new one
    let reactionElement = reactionsContainer.querySelector(`[data-emoji="${data.emoji}"]`);
    
    if (!reactionElement) {
        reactionElement = document.createElement('span');
        reactionElement.className = 'reaction';
        reactionElement.dataset.emoji = data.emoji;
        reactionElement.dataset.count = '0';
        reactionsContainer.appendChild(reactionElement);
    }
    
    // Increment count
    const count = parseInt(reactionElement.dataset.count) + 1;
    reactionElement.dataset.count = count;
    reactionElement.textContent = `${data.emoji} ${count}`;
});

socket.on('rate_limited', (data) => {
    alert(data.error);
});

socket.on('message_error', (data) => {
    alert(data.error);
});

// Form event listeners
usernameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    if (!username) return;
    
    currentUsername = username;
    console.log('Joining with username:', username);
    
    // Join the matching system
    socket.emit('join', { username });
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    console.log('Sending message:', message);
    
    // Stop typing indicator
    if (isTyping) {
        isTyping = false;
        socket.emit('typing_stop');
    }
    
    // Send message to server
    socket.emit('chat_message', { message });
    
    // Clear input and update counter
    messageInput.value = '';
    updateCharCounter();
});

// Message input event listeners
messageInput.addEventListener('input', () => {
    updateCharCounter();
    handleTyping();
});

messageInput.addEventListener('keyup', () => {
    updateCharCounter();
});

messageInput.addEventListener('paste', () => {
    setTimeout(updateCharCounter, 10);
});

// Button event listeners
cancelWaitBtn.addEventListener('click', () => {
    console.log('Cancelled waiting');
    socket.disconnect();
    location.reload();
});

findNewMatchBtn.addEventListener('click', () => {
    console.log('Finding new match');
    socket.emit('find_new_match');
    showScreen(waitingScreen);
});

findAnotherMatchBtn.addEventListener('click', () => {
    console.log('Finding another match');
    socket.emit('find_new_match');
    showScreen(waitingScreen);
});

// Handle Enter key in message input
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit'));
    }
});

// Handle connection errors
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    alert('Unable to connect to the server. Please try refreshing the page.');
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
    if (reason === 'io server disconnect') {
        // Server disconnected the client, try to reconnect
        socket.connect();
    }
});

// Hide reaction buttons when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.message') && !e.target.closest('.reaction-buttons')) {
        hideAllReactionButtons();
    }
});

// Auto-focus username input when page loads
document.addEventListener('DOMContentLoaded', () => {
    usernameInput.focus();
    updateCharCounter(); // Initialize character counter
});

console.log('Dating app client initialized');
