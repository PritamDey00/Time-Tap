const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(USERS_FILE);
  } catch (e) {
    await fs.writeFile(USERS_FILE, JSON.stringify([]));
  }
}

async function loadUsers() {
  await ensureStore();
  const raw = await fs.readFile(USERS_FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

async function saveUsers(users) {
  await ensureStore();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
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
    createdAt: new Date().toISOString()
  };
  users.push(user);
  await saveUsers(users);
  return user;
}

async function verifyCredentials({ name, password }) {
  const user = await findUserByName(name);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.passwordHash);
  return ok ? user : null;
}

async function updateUser(updated) {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.id === updated.id);
  if (idx === -1) throw new Error('not_found');
  users[idx] = updated;
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

module.exports = {
  loadUsers,
  saveUsers,
  findUserByName,
  createUser,
  verifyCredentials,
  updateUser,
  deleteUserById
};