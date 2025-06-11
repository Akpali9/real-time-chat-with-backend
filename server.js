const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));


// Store connected users
const users = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Handle user joining
  socket.on('join', (username) => {
    users.set(socket.id, {
      username: username,
      id: socket.id
    });
    
    // Notify all users about new user
    socket.broadcast.emit('user joined', {
      username: username,
      message: `${username} joined the chat`,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Send current users list to new user
    const usersList = Array.from(users.values()).map(user => user.username);
    socket.emit('users list', usersList);
    
    // Send users list to all clients
    io.emit('update users', usersList);
  });

  // Handle chat messages
  socket.on('chat message', (data) => {
    const user = users.get(socket.id);
    if (user) {
      const messageData = {
        username: user.username,
        message: data.message,
        timestamp: new Date().toLocaleTimeString(),
        id: socket.id
      };
      
      // Broadcast message to all users
      io.emit('chat message', messageData);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('typing', {
        username: user.username,
        isTyping: data.isTyping
      });
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      
      // Notify all users about user leaving
      socket.broadcast.emit('user left', {
        username: user.username,
        message: `${user.username} left the chat`,
        timestamp: new Date().toLocaleTimeString()
      });
      
      // Update users list
      const usersList = Array.from(users.values()).map(user => user.username);
      io.emit('update users', usersList);
    }
    
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
const IP = '127.0.0.1';
server.listen(PORT, IP, () => {
  console.log('Chat server running on port 3000');
  console.log('Visit http://localhost:3000 to start chatting! or http://127.0.0.1:3000');
});

