import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const CLASSROOMS_FILE = path.join(DATA_DIR, 'classrooms.json');

// Classroom validation functions
function validateClassroom(classroom) {
  const errors = [];
  
  if (!classroom.name || typeof classroom.name !== 'string' || classroom.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  
  if (classroom.name && classroom.name.length > 50) {
    errors.push('Name must be 50 characters or less');
  }
  
  if (classroom.description && typeof classroom.description !== 'string') {
    errors.push('Description must be a string');
  }
  
  if (classroom.description && classroom.description.length > 200) {
    errors.push('Description must be 200 characters or less');
  }
  
  if (classroom.password && typeof classroom.password !== 'string') {
    errors.push('Password must be a string');
  }
  
  if (classroom.avatar && typeof classroom.avatar !== 'string') {
    errors.push('Avatar must be a string');
  }
  
  if (classroom.settings) {
    if (typeof classroom.settings !== 'object') {
      errors.push('Settings must be an object');
    } else {
      if (classroom.settings.allowAnonymous !== undefined && typeof classroom.settings.allowAnonymous !== 'boolean') {
        errors.push('Settings.allowAnonymous must be a boolean');
      }
      
      if (classroom.settings.maxMembers !== undefined && (!Number.isInteger(classroom.settings.maxMembers) || classroom.settings.maxMembers < 1)) {
        errors.push('Settings.maxMembers must be a positive integer');
      }
    }
  }
  
  return errors;
}

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(CLASSROOMS_FILE);
  } catch (e) {
    // Create initial data with universal classroom
    const universalClassroom = {
      id: 'universal',
      name: 'Universal Classroom',
      description: 'A classroom for everyone to join and interact',
      avatar: '🌍',
      password: null,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      members: [],
      isUniversal: true,
      settings: {
        allowAnonymous: true,
        maxMembers: 1000
      }
    };
    await fs.writeFile(CLASSROOMS_FILE, JSON.stringify([universalClassroom], null, 2));
  }
}

async function loadClassrooms() {
  await ensureStore();
  const raw = await fs.readFile(CLASSROOMS_FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

async function saveClassrooms(classrooms) {
  await ensureStore();
  await fs.writeFile(CLASSROOMS_FILE, JSON.stringify(classrooms, null, 2));
}

async function findClassroomById(id) {
  const classrooms = await loadClassrooms();
  return classrooms.find(c => c.id === id);
}

async function createClassroom({ name, description, avatar, password, createdBy, settings = {} }) {
  const classroomData = {
    name: name?.trim(),
    description: description?.trim() || '',
    avatar: avatar || '📚',
    password,
    createdBy,
    settings: {
      allowAnonymous: true,
      maxMembers: 100,
      ...settings
    }
  };
  
  const errors = validateClassroom(classroomData);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  const classrooms = await loadClassrooms();
  
  // Check for duplicate names
  if (classrooms.find(c => c.name.toLowerCase() === classroomData.name.toLowerCase())) {
    throw new Error('A classroom with this name already exists');
  }
  
  const classroom = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    ...classroomData,
    passwordHash: password ? bcrypt.hashSync(password, 8) : null,
    createdAt: new Date().toISOString(),
    members: [],
    isUniversal: false
  };
  
  // Remove plain password from stored object
  delete classroom.password;
  
  classrooms.push(classroom);
  await saveClassrooms(classrooms);
  return classroom;
}

async function updateClassroom(id, updates) {
  const classrooms = await loadClassrooms();
  const idx = classrooms.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Classroom not found');
  
  const classroom = classrooms[idx];
  
  // Prepare update data
  const updateData = { ...updates };
  if (updateData.password !== undefined) {
    updateData.passwordHash = updateData.password ? bcrypt.hashSync(updateData.password, 8) : null;
    delete updateData.password;
  }
  
  const updatedClassroom = { ...classroom, ...updateData };
  
  // Validate updated classroom
  const errors = validateClassroom(updatedClassroom);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  classrooms[idx] = updatedClassroom;
  await saveClassrooms(classrooms);
  return classrooms[idx];
}

async function addMemberToClassroom(classroomId, userId) {
  const classrooms = await loadClassrooms();
  const idx = classrooms.findIndex(c => c.id === classroomId);
  if (idx === -1) throw new Error('Classroom not found');
  
  const classroom = classrooms[idx];
  
  // Check if user is already a member
  if (classroom.members.includes(userId)) {
    return classroom; // Already a member
  }
  
  // Check max members limit
  if (classroom.settings.maxMembers && classroom.members.length >= classroom.settings.maxMembers) {
    throw new Error('Classroom is full');
  }
  
  classroom.members.push(userId);
  classrooms[idx] = classroom;
  await saveClassrooms(classrooms);
  return classroom;
}

async function removeMemberFromClassroom(classroomId, userId) {
  const classrooms = await loadClassrooms();
  const idx = classrooms.findIndex(c => c.id === classroomId);
  if (idx === -1) throw new Error('Classroom not found');
  
  const classroom = classrooms[idx];
  const memberIdx = classroom.members.indexOf(userId);
  
  if (memberIdx === -1) {
    return classroom; // Not a member
  }
  
  classroom.members.splice(memberIdx, 1);
  classrooms[idx] = classroom;
  await saveClassrooms(classrooms);
  return classroom;
}

async function verifyClassroomPassword(classroomId, password) {
  const classroom = await findClassroomById(classroomId);
  if (!classroom) throw new Error('Classroom not found');
  
  // No password required
  if (!classroom.passwordHash) return true;
  
  // Password required but not provided
  if (!password) return false;
  
  return bcrypt.compareSync(password, classroom.passwordHash);
}

async function getUserClassrooms(userId) {
  const classrooms = await loadClassrooms();
  return classrooms.filter(c => c.members.includes(userId));
}

export {
  loadClassrooms,
  saveClassrooms,
  findClassroomById,
  createClassroom,
  updateClassroom,
  addMemberToClassroom,
  removeMemberFromClassroom,
  verifyClassroomPassword,
  getUserClassrooms,
  validateClassroom
};