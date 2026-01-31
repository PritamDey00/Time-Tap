// Unified storage interface for classroom management system
const classroomLib = require('./classrooms');
const messageLib = require('./messages');
const userLib = require('./users');
const { migrateUsersForClassrooms } = require('./migrations');

class StorageManager {
  constructor() {
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Run migrations to ensure existing users have classroom fields
      await migrateUsersForClassrooms();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }
  
  // Classroom operations
  async getClassrooms() {
    await this.initialize();
    return classroomLib.loadClassrooms();
  }
  
  async getClassroom(id) {
    await this.initialize();
    return classroomLib.findClassroomById(id);
  }
  
  async createClassroom(data) {
    await this.initialize();
    return classroomLib.createClassroom(data);
  }
  
  async updateClassroom(id, updates) {
    await this.initialize();
    return classroomLib.updateClassroom(id, updates);
  }
  
  async joinClassroom(classroomId, userId, password = null) {
    await this.initialize();
    
    // Verify password if required
    const isValidPassword = await classroomLib.verifyClassroomPassword(classroomId, password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }
    
    // Add user to classroom
    const classroom = await classroomLib.addMemberToClassroom(classroomId, userId);
    
    // Update user's joined classrooms
    await userLib.addUserToClassroom(userId, classroomId);
    
    return classroom;
  }
  
  async leaveClassroom(classroomId, userId) {
    await this.initialize();
    
    // Remove user from classroom
    const classroom = await classroomLib.removeMemberFromClassroom(classroomId, userId);
    
    // Update user's joined classrooms
    await userLib.removeUserFromClassroom(userId, classroomId);
    
    return classroom;
  }
  
  async getUserClassrooms(userId) {
    await this.initialize();
    return classroomLib.getUserClassrooms(userId);
  }
  
  // Message operations
  async getMessages(classroomId, limit = 50) {
    await this.initialize();
    return messageLib.getClassroomMessages(classroomId, limit);
  }
  
  async sendMessage(data) {
    await this.initialize();
    return messageLib.createMessage(data);
  }
  
  async deleteMessage(messageId, userId) {
    await this.initialize();
    return messageLib.deleteMessage(messageId, userId);
  }
  
  async getMessageStats(classroomId) {
    await this.initialize();
    return messageLib.getMessageStats(classroomId);
  }
  
  // User operations
  async getUser(id) {
    await this.initialize();
    return userLib.findUserById(id);
  }
  
  async getUserByName(name) {
    await this.initialize();
    return userLib.findUserByName(name);
  }
  
  async updateUser(user) {
    await this.initialize();
    return userLib.updateUser(user);
  }
  
  async toggleAnonymousMode(userId) {
    await this.initialize();
    return userLib.toggleUserAnonymousMode(userId);
  }
  
  // Utility operations
  async getClassroomWithStats(classroomId) {
    await this.initialize();
    const classroom = await this.getClassroom(classroomId);
    if (!classroom) return null;
    
    const stats = await this.getMessageStats(classroomId);
    
    return {
      ...classroom,
      stats
    };
  }
  
  async searchClassrooms(query) {
    await this.initialize();
    const classrooms = await this.getClassrooms();
    
    if (!query || query.trim() === '') {
      return classrooms;
    }
    
    const searchTerm = query.toLowerCase().trim();
    return classrooms.filter(classroom => 
      classroom.name.toLowerCase().includes(searchTerm) ||
      (classroom.description && classroom.description.toLowerCase().includes(searchTerm))
    );
  }
  
  async getClassroomMembers(classroomId) {
    await this.initialize();
    const classroom = await this.getClassroom(classroomId);
    if (!classroom) return [];
    
    const users = await userLib.loadUsers();
    return users.filter(user => classroom.members.includes(user.id))
      .map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        points: user.points,
        streak: user.streak,
        isAnonymous: user.isAnonymous,
        displayName: user.isAnonymous ? user.anonymousName : user.name
      }));
  }
}

// Export singleton instance
const storage = new StorageManager();

module.exports = storage;