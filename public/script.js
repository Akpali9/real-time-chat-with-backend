class ChatApp {
    constructor() {
        this.socket = io();
        this.currentUser = '';
        this.isTyping = false;
        this.typingTimeout = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupSocketListeners();
    }
    
    initializeElements() {
        // Login elements
        this.loginScreen = document.getElementById('login-screen');
        this.chatScreen = document.getElementById('chat-screen');
        this.usernameInput = document.getElementById('username-input');
        this.joinBtn = document.getElementById('join-btn');
        
        // Chat elements
        this.currentUserSpan = document.getElementById('current-user');
        this.leaveBtn = document.getElementById('leave-btn');
        this.messagesContainer = document.getElementById('messages-container');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.usersList = document.getElementById('users-list');
        this.userCount = document.getElementById('user-count');
        this.typingIndicator = document.getElementById('typing-indicator');
    }
    
    setupEventListeners() {
        // Login events
        this.joinBtn.addEventListener('click', () => this.joinChat());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinChat();
        });
        
        // Chat events
        this.leaveBtn.addEventListener('click', () => this.leaveChat());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Typing indicator
        this.messageInput.addEventListener('input', () => this.handleTyping());
    }
    
    setupSocketListeners() {
        this.socket.on('chat message', (data) => this.displayMessage(data));
        this.socket.on('user joined', (data) => this.displaySystemMessage(data.message, data.timestamp));
        this.socket.on('user left', (data) => this.displaySystemMessage(data.message, data.timestamp));
        this.socket.on('users list', (users) => this.updateUsersList(users));
        this.socket.on('update users', (users) => this.updateUsersList(users));
        this.socket.on('typing', (data) => this.showTypingIndicator(data));
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.displaySystemMessage('Connection lost. Please refresh the page.', new Date().toLocaleTimeString());
        });
    }
    
    joinChat() {
        const username = this.usernameInput.value.trim();
        if (username && username.length >= 2) {
            this.currentUser = username;
            this.currentUserSpan.textContent = username;
            
            // Switch to chat screen
            this.loginScreen.classList.remove('active');
            this.chatScreen.classList.add('active');
            
            // Join the chat
            this.socket.emit('join', username);
            
            // Focus on message input
            this.messageInput.focus();
        } else {
            alert('Please enter a username (at least 2 characters)');
        }
    }
    
    leaveChat() {
        this.socket.disconnect();
        this.chatScreen.classList.remove('active');
        this.loginScreen.classList.add('active');
        
        // Reset form
        this.usernameInput.value = '';
        this.messageInput.value = '';
        this.messagesContainer.innerHTML = '';
        this.usersList.innerHTML = '';
        this.typingIndicator.textContent = '';
        
        // Reconnect socket
        this.socket.connect();
    }
    
    sendMessage() {
        const message = this.messageInput.value.trim();
        if (message) {
            this.socket.emit('chat message', { message });
            this.messageInput.value = '';
            
            // Stop typing indicator
            if (this.isTyping) {
                this.isTyping = false;
                this.socket.emit('typing', { isTyping: false });
            }
        }
    }
    
    displayMessage(data) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${data.id === this.socket.id ? 'own' : 'other'}`;
        
        const isOwnMessage = data.id === this.socket.id;
        
        messageEl.innerHTML = `
            ${!isOwnMessage ? `<div class="message-header">${data.username}</div>` : ''}
            <div class="message-content">${this.escapeHtml(data.message)}</div>
            <div class="message-time">${data.timestamp}</div>
        `;
        
        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    displaySystemMessage(message, timestamp) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message system';
        messageEl.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-time">${timestamp}</div>
        `;
        
        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    updateUsersList(users) {
        this.usersList.innerHTML = '';
        this.userCount.textContent = users.length;
        
        users.forEach(username => {
            const userEl = document.createElement('div');
            userEl.className = 'user-item';
            userEl.textContent = username + (username === this.currentUser ? ' (You)' : '');
            this.usersList.appendChild(userEl);
        });
    }
    
    handleTyping() {
        if (!this.isTyping) {
            this.isTyping = true;
            this.socket.emit('typing', { isTyping: true });
        }
        
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            this.socket.emit('typing', { isTyping: false });
        }, 1000);
    }
    
    showTypingIndicator(data) {
        if (data.isTyping) {
            this.typingIndicator.textContent = `${data.username} is typing...`;
        } else {
            this.typingIndicator.textContent = '';
        }
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the chat app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});