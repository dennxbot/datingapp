const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Data structures for managing users and matches
const waitingQueue = [];
const activeChats = new Map(); // roomId -> {user1, user2}
const userSockets = new Map(); // socketId -> {username, roomId, lastMessage, messageCount}
const usedUsernames = new Set(); // Track active usernames
const typingUsers = new Map(); // roomId -> {user1Typing, user2Typing}

// Generate unique room ID
function generateRoomId() {
    return 'room_' + Math.random().toString(36).substr(2, 9) + Date.now();
}

// Validate username
function validateUsername(username) {
    // Check if username is provided
    if (!username || typeof username !== 'string') {
        return { valid: false, error: 'Username is required' };
    }
    
    // Check length
    if (username.length < 2) {
        return { valid: false, error: 'Username must be at least 2 characters long' };
    }
    
    if (username.length > 20) {
        return { valid: false, error: 'Username must be 20 characters or less' };
    }
    
    // Check for valid characters (alphanumeric, spaces, hyphens, underscores)
    if (!/^[a-zA-Z0-9\s_-]+$/.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, spaces, hyphens, and underscores' };
    }
    
    // Check for duplicate (case insensitive)
    const normalizedUsername = username.toLowerCase().trim();
    if (usedUsernames.has(normalizedUsername)) {
        return { valid: false, error: 'This username is already taken. Please choose another one.' };
    }
    
    return { valid: true, normalizedUsername };
}

// Rate limiting function
function checkRateLimit(socket, userInfo) {
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    const maxMessages = 20; // Max 20 messages per minute
    
    if (!userInfo.lastMessage) {
        userInfo.lastMessage = now;
        userInfo.messageCount = 1;
        return true;
    }
    
    // Reset counter if time window has passed
    if (now - userInfo.lastMessage > timeWindow) {
        userInfo.messageCount = 1;
        userInfo.lastMessage = now;
        return true;
    }
    
    // Check if under limit
    if (userInfo.messageCount >= maxMessages) {
        return false;
    }
    
    userInfo.messageCount++;
    return true;
}

// Find a match for the user
function findMatch(currentSocket, username) {
    // Check if there's someone waiting
    if (waitingQueue.length > 0) {
        const waitingUser = waitingQueue.shift();
        
        // Create a new chat room
        const roomId = generateRoomId();
        
        // Add both users to the room
        currentSocket.join(roomId);
        waitingUser.socket.join(roomId);
        
        // Store user information
        userSockets.set(currentSocket.id, { username, roomId });
        userSockets.set(waitingUser.socket.id, { username: waitingUser.username, roomId });
        
        // Store active chat
        activeChats.set(roomId, {
            user1: { socket: currentSocket, username },
            user2: { socket: waitingUser.socket, username: waitingUser.username }
        });
        
        // Notify both users they've been matched
        currentSocket.emit('matched', { 
            partnerUsername: waitingUser.username,
            roomId: roomId
        });
        waitingUser.socket.emit('matched', { 
            partnerUsername: username,
            roomId: roomId
        });
        
        // Send online status to both users
        setTimeout(() => {
            currentSocket.emit('partner_status', { online: true });
            waitingUser.socket.emit('partner_status', { online: true });
        }, 100);
        
        console.log(`Matched ${username} with ${waitingUser.username} in room ${roomId}`);
    } else {
        // Add user to waiting queue
        waitingQueue.push({ socket: currentSocket, username });
        userSockets.set(currentSocket.id, { username, roomId: null });
        currentSocket.emit('waiting');
        console.log(`${username} added to waiting queue`);
    }
}

// Remove user from waiting queue
function removeFromQueue(socket) {
    const index = waitingQueue.findIndex(user => user.socket.id === socket.id);
    if (index !== -1) {
        waitingQueue.splice(index, 1);
    }
}

// Leave current chat and find new match
function leaveCurrentChat(socket) {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo || !userInfo.roomId) return;
    
    const roomId = userInfo.roomId;
    const chatRoom = activeChats.get(roomId);
    
    if (chatRoom) {
        // Notify the partner that user left
        const partner = chatRoom.user1.socket.id === socket.id ? chatRoom.user2 : chatRoom.user1;
        partner.socket.emit('partner_left');
        partner.socket.leave(roomId);
        
        // Remove partner from their room info
        userSockets.set(partner.socket.id, { 
            username: userSockets.get(partner.socket.id).username, 
            roomId: null 
        });
        
        // Clean up
        activeChats.delete(roomId);
        socket.leave(roomId);
        
        console.log(`User ${userInfo.username} left chat room ${roomId}`);
    }
}

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);
    
    // Send online status to partner
    const sendOnlineStatus = (roomId, isOnline = true) => {
        const chatRoom = activeChats.get(roomId);
        if (!chatRoom) return;
        
        const partner = chatRoom.user1.socket.id === socket.id ? chatRoom.user2 : chatRoom.user1;
        partner.socket.emit('partner_status', { online: isOnline });
    };
    
    // Handle user joining with username
    socket.on('join', (data) => {
        const { username } = data;
        
        // Validate username
        const validation = validateUsername(username);
        if (!validation.valid) {
            socket.emit('join_error', { error: validation.error });
            return;
        }
        
        console.log(`User ${username} (${socket.id}) joined`);
        
        // Add to used usernames
        usedUsernames.add(validation.normalizedUsername);
        
        findMatch(socket, username);
    });
    
    // Handle chat messages
    socket.on('chat_message', (data) => {
        const userInfo = userSockets.get(socket.id);
        if (!userInfo || !userInfo.roomId) return;
        
        // Check rate limiting
        if (!checkRateLimit(socket, userInfo)) {
            socket.emit('rate_limited', { 
                error: 'You are sending messages too quickly. Please slow down.' 
            });
            return;
        }
        
        const { message, replyTo } = data;
        const roomId = userInfo.roomId;
        
        // Validate message
        if (!message || message.trim().length === 0) return;
        if (message.length > 500) {
            socket.emit('message_error', { error: 'Message too long (max 500 characters)' });
            return;
        }
        
        // Prepare message data
        const messageData = {
            username: userInfo.username,
            message: message.trim(),
            timestamp: new Date().toISOString(),
            messageId: Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        };
        
        // Add reply information if this is a reply
        if (replyTo) {
            messageData.replyTo = replyTo;
        }
        
        // Send message to everyone in the room
        io.to(roomId).emit('new_message', messageData);
        
        console.log(`Message in room ${roomId} from ${userInfo.username}: ${message}${replyTo ? ' (reply)' : ''}`);
    });
    
    // Handle typing indicators
    socket.on('typing_start', () => {
        const userInfo = userSockets.get(socket.id);
        if (!userInfo || !userInfo.roomId) return;
        
        const roomId = userInfo.roomId;
        socket.to(roomId).emit('partner_typing', { typing: true });
    });
    
    socket.on('typing_stop', () => {
        const userInfo = userSockets.get(socket.id);
        if (!userInfo || !userInfo.roomId) return;
        
        const roomId = userInfo.roomId;
        socket.to(roomId).emit('partner_typing', { typing: false });
    });
    
    // Handle emoji reactions
    socket.on('add_reaction', (data) => {
        const userInfo = userSockets.get(socket.id);
        if (!userInfo || !userInfo.roomId) {
            console.log('User not in room for reaction');
            return;
        }
        
        const { messageId, emoji } = data;
        const roomId = userInfo.roomId;
        
        console.log(`Reaction from ${userInfo.username}: ${emoji} on message ${messageId}`);
        
        // Validate emoji (basic check)
        const validEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];
        if (!validEmojis.includes(emoji)) {
            console.log('Invalid emoji:', emoji);
            return;
        }
        
        if (!messageId) {
            console.log('No message ID provided');
            return;
        }
        
        // Send reaction to room
        io.to(roomId).emit('message_reaction', {
            messageId,
            emoji,
            username: userInfo.username
        });
        
        console.log(`Sent reaction to room ${roomId}`);
    });
    
    // Handle message editing
    socket.on('edit_message', (data) => {
        const userInfo = userSockets.get(socket.id);
        if (!userInfo || !userInfo.roomId) {
            console.log('User not in room for message edit');
            return;
        }
        
        const { messageId, newText } = data;
        const roomId = userInfo.roomId;
        
        // Validate new text
        if (!newText || newText.trim().length === 0) {
            socket.emit('message_error', { error: 'Message cannot be empty' });
            return;
        }
        
        if (newText.length > 500) {
            socket.emit('message_error', { error: 'Message too long (max 500 characters)' });
            return;
        }
        
        if (!messageId) {
            console.log('No message ID provided for edit');
            return;
        }
        
        console.log(`Edit request from ${userInfo.username}: message ${messageId} -> "${newText.trim()}"`);
        
        // Send edit notification to room
        io.to(roomId).emit('message_edited', {
            messageId,
            newText: newText.trim(),
            username: userInfo.username,
            timestamp: new Date().toISOString()
        });
        
        console.log(`Sent message edit to room ${roomId}`);
    });
    
    // Handle finding new match
    socket.on('find_new_match', () => {
        const userInfo = userSockets.get(socket.id);
        if (!userInfo) return;
        
        console.log(`${userInfo.username} looking for new match`);
        
        // Leave current chat if in one
        leaveCurrentChat(socket);
        
        // Find new match
        findMatch(socket, userInfo.username);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        const userInfo = userSockets.get(socket.id);
        console.log(`User disconnected: ${socket.id}`, userInfo ? `(${userInfo.username})` : '');
        
        if (userInfo) {
            // Remove username from used set
            if (userInfo.username) {
                usedUsernames.delete(userInfo.username.toLowerCase().trim());
            }
            
            // Send offline status to partner
            if (userInfo.roomId) {
                sendOnlineStatus(userInfo.roomId, false);
            }
            
            // Remove from waiting queue if waiting
            removeFromQueue(socket);
            
            // Leave current chat if in one
            leaveCurrentChat(socket);
        }
        
        // Clean up user data
        userSockets.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Dating app server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
