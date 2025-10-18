// Модели данных для мессенджера
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');

// Создаем директорию для данных если она не существует
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Инициализация файлов данных
function initDataFiles() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(CHATS_FILE)) {
    fs.writeFileSync(CHATS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
  }
}

// Модель пользователя
class User {
  constructor(id, username, email, password, avatar = '', createdAt = new Date()) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password; // В продакшене нужно хешировать
    this.avatar = avatar;
    this.createdAt = createdAt;
    this.isOnline = false;
    this.lastSeen = new Date();
  }
}

// Модель чата
class Chat {
  constructor(id, name, type = 'group', participants = [], createdBy, createdAt = new Date()) {
    this.id = id;
    this.name = name;
    this.type = type; // 'group' или 'private'
    this.participants = participants; // массив ID пользователей
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.lastMessage = null;
    this.updatedAt = new Date();
  }
}

// Модель сообщения
class Message {
  constructor(id, chatId, senderId, content, type = 'text', createdAt = new Date()) {
    this.id = id;
    this.chatId = chatId;
    this.senderId = senderId;
    this.content = content;
    this.type = type;
    this.createdAt = createdAt;
    this.isRead = false;
    this.readBy = []; // массив ID пользователей, прочитавших сообщение
  }
}

// Утилиты для работы с данными
const DataUtils = {
  // Пользователи
  getUsers: () => {
    initDataFiles();
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data).map(user => ({
      ...user,
      createdAt: new Date(user.createdAt),
      lastSeen: new Date(user.lastSeen)
    }));
  },

  saveUsers: (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users));
  },

  findUserByEmail: (email) => {
    const users = DataUtils.getUsers();
    return users.find(user => user.email === email);
  },

  findUserById: (id) => {
    const users = DataUtils.getUsers();
    return users.find(user => user.id === id);
  },

  createUser: (userData) => {
    const users = DataUtils.getUsers();
    const newUser = new User(
      Date.now().toString(),
      userData.username,
      userData.email,
      userData.password,
      userData.avatar
    );
    users.push(newUser);
    DataUtils.saveUsers(users);
    return newUser;
  },

  // Чаты
  getChats: () => {
    initDataFiles();
    const data = fs.readFileSync(CHATS_FILE, 'utf8');
    return JSON.parse(data).map(chat => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt)
    }));
  },

  saveChats: (chats) => {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats));
  },

  findChatById: (id) => {
    const chats = DataUtils.getChats();
    return chats.find(chat => chat.id === id);
  },

  createChat: (chatData) => {
    const chats = DataUtils.getChats();
    const newChat = new Chat(
      Date.now().toString(),
      chatData.name,
      chatData.type,
      chatData.participants,
      chatData.createdBy
    );
    chats.push(newChat);
    DataUtils.saveChats(chats);
    return newChat;
  },

  updateChatLastMessage: (chatId, message) => {
    const chats = DataUtils.getChats();
    const chatIndex = chats.findIndex(chat => chat.id === chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].lastMessage = message;
      chats[chatIndex].updatedAt = new Date();
      DataUtils.saveChats(chats);
    }
  },

  // Сообщения
  getMessages: () => {
    initDataFiles();
    const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
    return JSON.parse(data).map(message => ({
      ...message,
      createdAt: new Date(message.createdAt)
    }));
  },

  saveMessages: (messages) => {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages));
  },

  getMessagesByChatId: (chatId) => {
    const messages = DataUtils.getMessages();
    return messages
      .filter(message => message.chatId === chatId)
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  createMessage: (messageData) => {
    const messages = DataUtils.getMessages();
    const newMessage = new Message(
      Date.now().toString(),
      messageData.chatId,
      messageData.senderId,
      messageData.content,
      messageData.type
    );
    messages.push(newMessage);
    DataUtils.saveMessages(messages);

    // Обновляем последний сообщение в чате
    DataUtils.updateChatLastMessage(messageData.chatId, {
      id: newMessage.id,
      content: newMessage.content,
      senderId: newMessage.senderId,
      createdAt: newMessage.createdAt
    });

    return newMessage;
  },

  markMessageAsRead: (messageId, userId) => {
    const messages = DataUtils.getMessages();
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1 && !messages[messageIndex].readBy.includes(userId)) {
      messages[messageIndex].readBy.push(userId);
      DataUtils.saveMessages(messages);
    }
  }
};

module.exports = { User, Chat, Message, DataUtils };