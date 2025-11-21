const { loadUsers, saveUsers, generateAnonymousName } = require('./users');

async function migrateUsersForClassrooms() {
  try {
    const users = await loadUsers();
    let hasChanges = false;
    
    const updatedUsers = users.map(user => {
      const updated = { ...user };
      
      // Add missing classroom-related fields
      if (!updated.joinedClassrooms) {
        updated.joinedClassrooms = [];
        hasChanges = true;
      }
      
      if (updated.isAnonymous === undefined) {
        updated.isAnonymous = false;
        hasChanges = true;
      }
      
      if (!updated.anonymousName) {
        updated.anonymousName = generateAnonymousName(updated.name);
        hasChanges = true;
      }
      
      if (updated.avatar === undefined) {
        updated.avatar = null;
        hasChanges = true;
      }
      
      return updated;
    });
    
    if (hasChanges) {
      await saveUsers(updatedUsers);
      console.log('Successfully migrated users for classroom features');
      return { success: true, migratedCount: users.length };
    } else {
      console.log('No migration needed - users already have classroom fields');
      return { success: true, migratedCount: 0 };
    }
  } catch (error) {
    console.error('Error migrating users:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  migrateUsersForClassrooms
};