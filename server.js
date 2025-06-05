const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple in-memory storage (for demo - use database in production)
const users = new Map(); // telegram_id -> username
const usernames = new Map(); // username -> telegram_id

// Bot Commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || `user_${chatId}`;
    
    // Save user
    users.set(chatId, username);
    usernames.set(username, chatId);
    
    const messageLink = `https://chupi-chupi.onrender.com/u/${username}`;
    
    bot.sendMessage(chatId, `
🎉 Welcome to Chupi_chupi

Your anonymous message link:
${messageLink}

Share this link with friends, and they can send you anonymous messages!

Commands:
/link - Get your link again
/help - Get help
    `);
});

bot.onText(/\/link/, (msg) => {
    const chatId = msg.chat.id;
    const username = users.get(chatId);
    
    if (username) {
        const messageLink = `https://chupi-chupi.onrender.com/u/${username}`;
        bot.sendMessage(chatId, `Your message link:\n${messageLink}`);
    } else {
        bot.sendMessage(chatId, 'Please send /start first!');
    }
});

// API Endpoints
app.post('/api/send-message', async (req, res) => {
    try {
        const { username, message, emoji } = req.body;
        
        if (!username || !message) {
            return res.status(400).json({ error: 'Username and message required' });
        }
        
        const chatId = usernames.get(username);
        
        if (!chatId) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const fullMessage = `💌 New anonymous message:\n${emoji ? emoji + ' ' : ''}"${message}"`;
        
        await bot.sendMessage(chatId, fullMessage);
        
        res.json({ success: true, message: 'Message sent!' });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Serve user message pages
app.get('/u/:username', (req, res) => {
    const { username } = req.params;
    
    // Check if user exists
    if (!usernames.has(username)) {
        return res.status(404).send('User not found');
    }
    
    // Send the message form HTML
    res.sendFile(__dirname + '/public/message-form.html');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Bot is active!`);
});
