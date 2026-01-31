const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Message validation functions
function validateMessage(message) {
  const errors = [];
  
  if (!message.classroomId || typeof message.classroomId !== 'string') {
    errors.push('ClassroomId is required and must be a string');
  }
  
  if (!message.userId || typeof message.userId !== 'string') {
    errors.push('UserId is required and must be a string');
  }
  
  if (!message.username || typeof message.username !== 'string' || message.username.trim().length === 0) {
    errors.push('Username is required and must be a non-empty string');
  }
  
  if (!message.message || typeof message.message !== 'string' || message.message.trim().length === 0) {
    errors.push('Message is required and must be a non-empty string');
  }
  
  if (message.message && message.message.length > 1000) {
    errors.push('Message must be 1000 characters or less');
  }
  
  if (message.isAnonymous !== undefined && typeof message.isAnonymous !== 'boolean') {
    errors.push('IsAnonymous must be a boolean');
  }
  
  return errors;
}

function sanitizeMessage(text) {
  // Basic XSS prevention - remove HTML tags and encode special characters
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(MESSAGES_FILE);
  } catch (e) {
    await fs.writeFile(MESSAGES_FILE, JSON.stringify([]));
  }
}

async function loadMessages() {
  await ensureStore();
  const raw = await fs.readFile(MESSAGES_FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

async function saveMessages(messages) {
  await ensureStore();
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

async function createMessage({ classroomId, userId, username, message, isAnonymous = false }) {
  const messageData = {
    classroomId,
    userId,
    username: isAnonymous ? generateAnonymousName(userId) : username,
    message: sanitizeMessage(message),
    isAnonymous
  };
  
  const errors = validateMessage(messageData);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  const messages = await loadMessages();
  
  const newMessage = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    ...messageData,
    timestamp: new Date().toISOString()
  };
  
  messages.push(newMessage);
  
  // Keep only last 1000 messages per classroom to prevent unlimited growth
  const classroomMessages = messages.filter(m => m.classroomId === classroomId);
  if (classroomMessages.length > 1000) {
    // Remove oldest messages for this classroom
    const messagesToRemove = classroomMessages
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(0, classroomMessages.length - 1000);
    
    const idsToRemove = new Set(messagesToRemove.map(m => m.id));
    const filteredMessages = messages.filter(m => !idsToRemove.has(m.id));
    filteredMessages.push(newMessage);
    await saveMessages(filteredMessages);
  } else {
    await saveMessages(messages);
  }
  
  return newMessage;
}

async function getClassroomMessages(classroomId, limit = 50) {
  const messages = await loadMessages();
  return messages
    .filter(m => m.classroomId === classroomId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
    .reverse(); // Return in chronological order (oldest first)
}

async function deleteMessage(messageId, userId) {
  const messages = await loadMessages();
  const messageIdx = messages.findIndex(m => m.id === messageId);
  
  if (messageIdx === -1) {
    throw new Error('Message not found');
  }
  
  const message = messages[messageIdx];
  
  // Only allow users to delete their own messages
  if (message.userId !== userId) {
    throw new Error('Unauthorized to delete this message');
  }
  
  messages.splice(messageIdx, 1);
  await saveMessages(messages);
  return true;
}

function generateAnonymousName(userId) {
  // Generate a consistent anonymous name based on userId
  const adjectives = ['Anonymous', 'Mystery', 'Hidden', 'Secret', 'Unknown', 'Phantom', 'Shadow', 'Invisible'];
  const nouns = ['Student', 'Learner', 'Scholar', 'User', 'Participant', 'Member', 'Guest', 'Visitor'];
  
  // Use userId to generate consistent but anonymous name
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = Math.abs(hash >> 16) % 1000;
  
  return `${adjectives[adjIndex]} ${nouns[nounIndex]} ${number}`;
}

async function getMessageStats(classroomId) {
  const messages = await loadMessages();
  const classroomMessages = messages.filter(m => m.classroomId === classroomId);
  
  return {
    totalMessages: classroomMessages.length,
    uniqueUsers: new Set(classroomMessages.map(m => m.userId)).size,
    lastMessage: classroomMessages.length > 0 
      ? classroomMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
      : null
  };
}

module.exports = {
  loadMessages,
  saveMessages,
  createMessage,
  getClassroomMessages,
  deleteMessage,
  generateAnonymousName,
  getMessageStats,
  validateMessage,
  sanitizeMessage
};