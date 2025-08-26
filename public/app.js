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
let contextMenuTarget = null; // Current message being context-menued
let replyingTo = null; // Message being replied to
let editingMessage = null; // Message being edited

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
        if (!target) {
            console.log('No target message found for reaction');
            return;
        }
        messageId = target.dataset.messageId;
    }
    
    console.log('Adding reaction:', emoji, 'to message:', messageId);
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
    
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];
    
    emojis.forEach(emoji => {
        const button = document.createElement('button');
        button.textContent = emoji;
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            addReaction(emoji);
        });
        div.appendChild(button);
    });
    
    return div;
}

// Context Menu Functions
function showContextMenu(x, y, messageElement) {
    const contextMenu = document.getElementById('message-context-menu');
    const isOwn = messageElement.classList.contains('own');
    
    contextMenuTarget = messageElement;
    
    // Enable/disable buttons based on message ownership
    const editBtn = document.getElementById('ctx-edit');
    editBtn.disabled = !isOwn;
    
    // Position the context menu
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    
    // Show the menu
    contextMenu.classList.remove('hidden');
    
    // Adjust position if it goes off screen
    const rect = contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (rect.right > viewportWidth) {
        contextMenu.style.left = (viewportWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > viewportHeight) {
        contextMenu.style.top = (y - rect.height - 10) + 'px';
    }
}

function hideContextMenu() {
    const contextMenu = document.getElementById('message-context-menu');
    contextMenu.classList.add('hidden');
    contextMenuTarget = null;
}

function copyMessageToClipboard(messageText) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(messageText).then(() => {
            // Could show a toast notification here
            console.log('Message copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy message:', err);
            // Fallback method
            fallbackCopyToClipboard(messageText);
        });
    } else {
        fallbackCopyToClipboard(messageText);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        console.log('Message copied to clipboard (fallback)');
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
}

function startReply(messageElement) {
    const messageText = messageElement.querySelector('.message-text').textContent;
    const messageUser = messageElement.classList.contains('own') ? 'You' : partnerUsername;
    
    replyingTo = {
        messageId: messageElement.dataset.messageId,
        text: messageText,
        username: messageUser
    };
    
    // Show reply banner
    const replyBanner = document.getElementById('reply-banner');
    const replyUsername = document.getElementById('reply-username');
    const replyPreview = document.getElementById('reply-message-preview');
    
    replyUsername.textContent = messageUser;
    replyPreview.textContent = messageText;
    
    replyBanner.classList.remove('hidden');
    messageInput.focus();
}

function cancelReply() {
    replyingTo = null;
    const replyBanner = document.getElementById('reply-banner');
    replyBanner.classList.add('hidden');
}

function startEdit(messageElement) {
    if (editingMessage) {
        cancelEdit();
    }
    
    editingMessage = messageElement;
    const messageText = messageElement.querySelector('.message-text');
    const originalText = messageText.textContent;
    
    // Create edit input
    const editInput = document.createElement('textarea');
    editInput.className = 'edit-input';
    editInput.value = originalText;
    editInput.rows = 1;
    
    // Create edit actions
    const editActions = document.createElement('div');
    editActions.className = 'edit-actions';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-save';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = () => saveEdit(messageElement, editInput.value);
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => cancelEdit();
    
    editActions.appendChild(saveBtn);
    editActions.appendChild(cancelBtn);
    
    // Add elements to message
    messageElement.appendChild(editInput);
    messageElement.appendChild(editActions);
    messageElement.classList.add('editing');
    
    // Focus and select text
    editInput.focus();
    editInput.select();
    
    // Auto-resize textarea
    editInput.addEventListener('input', () => {
        editInput.style.height = 'auto';
        editInput.style.height = editInput.scrollHeight + 'px';
    });
}

function saveEdit(messageElement, newText) {
    if (!newText.trim()) {
        cancelEdit();
        return;
    }
    
    const messageId = messageElement.dataset.messageId;
    
    // Send edit request to server
    socket.emit('edit_message', {
        messageId: messageId,
        newText: newText.trim()
    });
    
    cancelEdit();
}

function cancelEdit() {
    if (!editingMessage) return;
    
    editingMessage.classList.remove('editing');
    const editInput = editingMessage.querySelector('.edit-input');
    const editActions = editingMessage.querySelector('.edit-actions');
    
    if (editInput) editInput.remove();
    if (editActions) editActions.remove();
    
    editingMessage = null;
}

// Add message to chat
function addMessage(username, message, timestamp, messageId, isOwn = false, replyTo = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
    messageDiv.dataset.messageId = messageId;
    messageDiv.dataset.username = username;
    messageDiv.style.position = 'relative';
    
    // Add reply info if this is a reply
    if (replyTo) {
        const replyInfo = document.createElement('div');
        replyInfo.className = 'message-reply-info';
        
        const replyToUser = document.createElement('div');
        replyToUser.className = 'reply-to-user';
        replyToUser.textContent = `Replying to ${replyTo.username}`;
        
        const replyToMessage = document.createElement('div');
        replyToMessage.className = 'reply-to-message';
        replyToMessage.textContent = replyTo.text;
        
        replyInfo.appendChild(replyToUser);
        replyInfo.appendChild(replyToMessage);
        messageDiv.appendChild(replyInfo);
        messageDiv.classList.add('has-reply');
    }
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
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
    
    // Add context menu handlers
    let pressTimer;
    let startX, startY;
    
    messageDiv.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
        
        pressTimer = setTimeout(() => {
            showContextMenu(e.clientX, e.clientY, messageDiv);
        }, 500);
    });
    
    messageDiv.addEventListener('mousemove', (e) => {
        const distance = Math.sqrt(
            Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2)
        );
        
        if (distance > 10 && pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    });
    
    messageDiv.addEventListener('mouseup', () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    });
    
    messageDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY, messageDiv);
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

// Context Menu Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Emoji button listeners in context menu
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (contextMenuTarget) {
                const emoji = btn.dataset.emoji;
                const messageId = contextMenuTarget.dataset.messageId;
                addReaction(emoji, messageId);
                hideContextMenu();
            }
        });
    });
    
    // Context action listeners
    document.getElementById('ctx-edit').addEventListener('click', () => {
        if (contextMenuTarget) {
            startEdit(contextMenuTarget);
            hideContextMenu();
        }
    });
    
    document.getElementById('ctx-reply').addEventListener('click', () => {
        if (contextMenuTarget) {
            startReply(contextMenuTarget);
            hideContextMenu();
        }
    });
    
    document.getElementById('ctx-copy').addEventListener('click', () => {
        if (contextMenuTarget) {
            const messageText = contextMenuTarget.querySelector('.message-text').textContent;
            copyMessageToClipboard(messageText);
            hideContextMenu();
        }
    });
    
    // Reply banner cancel button
    document.getElementById('cancel-reply').addEventListener('click', cancelReply);
    
    // Hide context menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu') && !e.target.closest('.message')) {
            hideContextMenu();
        }
        
        if (!e.target.closest('.message') && !e.target.closest('.reaction-buttons')) {
            hideAllReactionButtons();
        }
    });
    
    // Hide context menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideContextMenu();
            if (editingMessage) {
                cancelEdit();
            }
            if (replyingTo) {
                cancelReply();
            }
        }
    });
    
    usernameInput.focus();
    updateCharCounter(); // Initialize character counter
});

// Enhanced message form submission with reply support
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
    
    // Prepare message data
    const messageData = { message };
    
    // Add reply information if replying
    if (replyingTo) {
        messageData.replyTo = replyingTo;
        cancelReply(); // Hide reply banner
    }
    
    // Send message to server
    socket.emit('chat_message', messageData);
    
    // Clear input and update counter
    messageInput.value = '';
    updateCharCounter();
});

console.log('Dating app client initialized');
