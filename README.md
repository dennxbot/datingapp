# 💕 Quick Chat - Dating App

A simple web-based dating app built with Node.js, Express, and Socket.IO that allows users to connect and chat with random matches in real-time.

## Features

### Core Features
- **No Registration Required**: Users only need to enter a username to start
- **Instant Matching**: Automatically pairs users with available partners
- **Real-time Chat**: Live messaging using Socket.IO
- **Find New Match**: Users can leave current chat and find a new partner
- **Responsive Design**: Works on both desktop and mobile devices
- **Clean UI**: Modern, attractive interface with smooth animations

### Enhanced Features ✨
- **Username Validation**: Prevents duplicate usernames and validates character requirements
- **Typing Indicators**: See when your partner is typing a message
- **Online Status**: Real-time display of partner's connection status
- **Message Timestamps**: Shows when each message was sent
- **Emoji Reactions**: React to messages with emojis (long-press or double-click)
- **Character Counter**: Real-time character count with visual warnings
- **Rate Limiting**: Prevents spam with 20 messages per minute limit

## How It Works

1. **Enter Username**: Users provide a username (no password required)
2. **Matching**: The system either:
   - Matches you with someone already waiting, or
   - Puts you in a waiting queue until someone else joins
3. **Chat**: Once matched, both users enter a private chat room
4. **New Match**: Users can click "Find Another Match" to leave and find someone new

## Installation & Setup

1. Make sure you have Node.js installed
2. Navigate to the project directory
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open your browser and go to `http://localhost:3000`

## Testing

To fully test the app, you'll need to:
1. Start the server with `npm start`
2. Open multiple browser windows/tabs to `http://localhost:3000`
3. Enter different usernames in each window
4. Test the matching and chat functionality

## Project Structure

```
dating-app/
├── server.js          # Main server file with Express and Socket.IO
├── package.json       # Project configuration and dependencies
├── README.md         # This file
└── public/           # Frontend files
    ├── index.html    # Main HTML structure
    ├── style.css     # CSS styling
    └── app.js        # Frontend JavaScript and Socket.IO client
```

## Technical Details

### Backend (server.js)
- **Express Server**: Serves static files and handles HTTP requests
- **Socket.IO**: Manages real-time connections and messaging
- **User Management**: Tracks users, waiting queue, and active chat rooms
- **Matching Logic**: Pairs users automatically and manages chat rooms

### Frontend
- **HTML**: Clean, semantic structure with multiple screens
- **CSS**: Modern, gradient-based design with responsive layout
- **JavaScript**: Handles Socket.IO events, user interactions, and UI updates

## Socket Events

### Client to Server
- `join`: User joins with username
- `chat_message`: Send a chat message
- `find_new_match`: Request to find a new chat partner
- `typing_start`: User started typing
- `typing_stop`: User stopped typing
- `add_reaction`: Add emoji reaction to a message

### Server to Client
- `waiting`: User is in the waiting queue
- `matched`: User has been matched with someone
- `new_message`: New chat message received
- `partner_left`: Chat partner has left the conversation
- `join_error`: Username validation failed
- `partner_status`: Partner's online/offline status
- `partner_typing`: Partner typing indicator
- `message_reaction`: Emoji reaction added to message
- `rate_limited`: User sending messages too quickly
- `message_error`: Message validation failed

## New Feature Usage

### Emoji Reactions
- **Long-press** or **double-click** any message to show reaction options
- Choose from: 👍 ❤️ 😂 😮 😢 😡
- Reactions are shared between both chat partners

### Typing Indicators
- Automatically shows when your partner is typing
- Disappears after 1 second of inactivity

### Username Requirements
- 2-20 characters long
- Letters, numbers, spaces, hyphens, and underscores only
- Must be unique (case-insensitive)

### Rate Limiting
- Maximum 20 messages per minute
- Prevents spam and abuse

## Security Notes

This is a simple demonstration app. For production use, consider adding:
- User authentication and authorization
- Message moderation and filtering
- Rate limiting
- Input validation and sanitization
- HTTPS/SSL encryption
- User reporting and blocking features

## License

ISC
