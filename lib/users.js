<<<<<<< HEAD
import bcrypt from 'bcryptjs';
import { getStorageAdapter } from './storage/adapter.js';

const STORAGE_KEY = 'users';

async function ensureStore() {
  const storage = getStorageAdapter();
  const exists = await storage.exists(STORAGE_KEY);
  if (!exists) {
    await storage.set(STORAGE_KEY, []);
=======
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(USERS_FILE);
  } catch (e) {
    await fs.writeFile(USERS_FILE, JSON.stringify([]));
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
  }
}

async function loadUsers() {
  await ensureStore();
<<<<<<< HEAD
  const storage = getStorageAdapter();
  const users = await storage.get(STORAGE_KEY) || [];
=======
  const raw = await fs.readFile(USERS_FILE, 'utf8');
  const users = JSON.parse(raw || '[]');
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
  
  // Migrate existing users to add preferences if they don't have them
  let needsSave = false;
  users.forEach(user => {
    if (!user.preferences) {
      user.preferences = {
        notificationMusic: 'music1.mp3',
        theme: 'light'
      };
      needsSave = true;
    }
  });
  
  // Save migrated users
  if (needsSave) {
    await saveUsers(users);
  }
  
  return users;
}

async function saveUsers(users) {
  await ensureStore();
<<<<<<< HEAD
  const storage = getStorageAdapter();
  await storage.set(STORAGE_KEY, users);
=======
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
}

async function findUserByName(name) {
  const users = await loadUsers();
  return users.find(u => u.name.toLowerCase() === name.toLowerCase());
}

async function createUser({ name, password }) {
  const users = await loadUsers();
  if (users.find(u => u.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('already_exists');
  }
  const salt = bcrypt.genSaltSync(8);
  const hash = bcrypt.hashSync(password, salt);
  const user = {
    id: Date.now().toString(36),
    name,
    passwordHash: hash,
    points: 0,
    streak: 0,
    lastConfirm: null,
    createdAt: new Date().toISOString(),
    // New classroom-related fields - automatically join universal classroom
    joinedClassrooms: ['universal'],
    isAnonymous: false,
    anonymousName: generateAnonymousName(name),
    avatar: null,
    // User preferences including notification music
    preferences: {
      notificationMusic: 'music1.mp3',
      theme: 'light'
    }
  };
  users.push(user);
  await saveUsers(users);
  
  // Also add user to universal classroom members list
  try {
    const { addMemberToClassroom } = await import('./classrooms.js');
    await addMemberToClassroom('universal', user.id);
  } catch (error) {
    console.error('Failed to add user to universal classroom:', error);
    // Don't fail user creation if classroom addition fails
  }
  
  return user;
}

async function verifyCredentials({ name, password }) {
  const user = await findUserByName(name);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.passwordHash);
  return ok ? user : null;
}

async function updateUser(idOrUser, updates) {
  const users = await loadUsers();
  
  // Backward compatibility: if first parameter is an object with an id, treat it as a full user object
  if (typeof idOrUser === 'object' && idOrUser.id && !updates) {
    const idx = users.findIndex(u => u.id === idOrUser.id);
    if (idx === -1) throw new Error('not_found');
    users[idx] = idOrUser;
    await saveUsers(users);
    return users[idx];
  }
  
  // New API: updateUser(id, updates)
  const idx = users.findIndex(u => u.id === idOrUser);
  if (idx === -1) throw new Error('not_found');
  
  // Merge updates into existing user
  users[idx] = { ...users[idx], ...updates };
  
  await saveUsers(users);
  return users[idx];
}

// New: delete a user by id
async function deleteUserById(id) {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('not_found');
  users.splice(idx, 1);
  await saveUsers(users);
  return true;
}

function generateAnonymousName(name) {
  // Generate a consistent anonymous name based on user name
  const adjectives = ['Anonymous', 'Mystery', 'Hidden', 'Secret', 'Unknown', 'Phantom', 'Shadow', 'Invisible'];
  const nouns = ['Student', 'Learner', 'Scholar', 'User', 'Participant', 'Member', 'Guest', 'Visitor'];
  
  // Use name to generate consistent but anonymous name
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = Math.abs(hash >> 16) % 1000;
  
  return `${adjectives[adjIndex]} ${nouns[nounIndex]} ${number}`;
}

async function addUserToClassroom(userId, classroomId) {
  const users = await loadUsers();
  const userIdx = users.findIndex(u => u.id === userId);
  if (userIdx === -1) throw new Error('User not found');
  
  const user = users[userIdx];
  if (!user.joinedClassrooms) user.joinedClassrooms = [];
  
  if (!user.joinedClassrooms.includes(classroomId)) {
    user.joinedClassrooms.push(classroomId);
    users[userIdx] = user;
    await saveUsers(users);
  }
  
  return user;
}

async function removeUserFromClassroom(userId, classroomId) {
  const users = await loadUsers();
  const userIdx = users.findIndex(u => u.id === userId);
  if (userIdx === -1) throw new Error('User not found');
  
  const user = users[userIdx];
  if (!user.joinedClassrooms) user.joinedClassrooms = [];
  
  const classroomIdx = user.joinedClassrooms.indexOf(classroomId);
  if (classroomIdx !== -1) {
    user.joinedClassrooms.splice(classroomIdx, 1);
    users[userIdx] = user;
    await saveUsers(users);
  }
  
  return user;
}

async function toggleUserAnonymousMode(userId) {
  const users = await loadUsers();
  const userIdx = users.findIndex(u => u.id === userId);
  if (userIdx === -1) throw new Error('User not found');
  
  const user = users[userIdx];
  user.isAnonymous = !user.isAnonymous;
  
  // Ensure anonymous name exists
  if (!user.anonymousName) {
    user.anonymousName = generateAnonymousName(user.name);
  }
  
  users[userIdx] = user;
  await saveUsers(users);
  return user;
}

async function findUserById(id) {
  const users = await loadUsers();
  return users.find(u => u.id === id);
}

async function updateUserMusicPreference(userId, notificationMusic) {
  const users = await loadUsers();
  const userIdx = users.findIndex(u => u.id === userId);
  if (userIdx === -1) throw new Error('User not found');
  
  const user = users[userIdx];
  
  // Initialize preferences if they don't exist
  if (!user.preferences) {
    user.preferences = {
      notificationMusic: 'music1.mp3',
      theme: 'light'
    };
  }
  
  // Update notification music preference
  user.preferences.notificationMusic = notificationMusic;
  
  users[userIdx] = user;
  await saveUsers(users);
  return user;
}

// Aliases for backward compatibility
const readUsers = loadUsers;
const writeUsers = saveUsers;

export {
  loadUsers,
  saveUsers,
  readUsers,
  writeUsers,
  findUserByName,
  findUserById,
  createUser,
  verifyCredentials,
  updateUser,
  deleteUserById,
  addUserToClassroom,
  removeUserFromClassroom,
  toggleUserAnonymousMode,
  generateAnonymousName,
  updateUserMusicPreference
};