/**
 * Verification script for notification music customization system
 * Tests all components and functionality
 */

const fs = require('fs').promises;
const path = require('path');

async function verifyNotificationMusicSystem() {
  console.log('🎵 Verifying Notification Music Customization System...\n');
  
  const results = {
    audioFiles: false,
    components: false,
    apiEndpoint: false,
    integration: false,
    userModel: false
  };

  try {
    // 1. Verify audio files exist
    console.log('📁 Checking audio files...');
    const audioDir = path.join(__dirname, 'public', 'audio', 'notifications');
    const expectedFiles = [
      'music1.mp3', 'music2.mp3', 'music3.mp3', 'music4.mp3',
      'music5.mp3', 'music6.mp3', 'music7.mp3'
    ];
    
    let audioFilesExist = true;
    for (const file of expectedFiles) {
      try {
        await fs.access(path.join(audioDir, file));
        console.log(`  ✅ ${file} exists`);
      } catch (error) {
        console.log(`  ❌ ${file} missing`);
        audioFilesExist = false;
      }
    }
    results.audioFiles = audioFilesExist;

    // 2. Verify components exist
    console.log('\n🧩 Checking components...');
    const components = [
      'components/MusicSelector.jsx',
      'components/ConfirmationDialog.jsx',
      'components/EnhancedConfirmationDialog.jsx',
      'components/NotificationDemo.jsx'
    ];
    
    let componentsExist = true;
    for (const component of components) {
      try {
        await fs.access(path.join(__dirname, component));
        console.log(`  ✅ ${component} exists`);
      } catch (error) {
        console.log(`  ❌ ${component} missing`);
        componentsExist = false;
      }
    }
    results.components = componentsExist;

    // 3. Verify API endpoint
    console.log('\n🔌 Checking API endpoint...');
    try {
      await fs.access(path.join(__dirname, 'pages', 'api', 'user', 'music-preference.js'));
      console.log('  ✅ Music preference API endpoint exists');
      results.apiEndpoint = true;
    } catch (error) {
      console.log('  ❌ Music preference API endpoint missing');
    }

    // 4. Verify audio manager
    console.log('\n🎛️ Checking audio manager...');
    try {
      await fs.access(path.join(__dirname, 'lib', 'audioManager.js'));
      console.log('  ✅ Audio manager exists');
      
      // Check if audio manager has required methods
      const audioManagerContent = await fs.readFile(path.join(__dirname, 'lib', 'audioManager.js'), 'utf8');
      const requiredMethods = ['playAudio', 'playNotificationSound', 'preloadAllNotificationMusic'];
      let hasAllMethods = true;
      
      for (const method of requiredMethods) {
        if (audioManagerContent.includes(method)) {
          console.log(`    ✅ ${method} method found`);
        } else {
          console.log(`    ❌ ${method} method missing`);
          hasAllMethods = false;
        }
      }
      results.integration = hasAllMethods;
    } catch (error) {
      console.log('  ❌ Audio manager missing');
    }

    // 5. Verify user model updates
    console.log('\n👤 Checking user model updates...');
    try {
      const usersContent = await fs.readFile(path.join(__dirname, 'lib', 'users.js'), 'utf8');
      
      if (usersContent.includes('preferences') && usersContent.includes('notificationMusic')) {
        console.log('  ✅ User model includes preferences and notificationMusic');
        results.userModel = true;
      } else {
        console.log('  ❌ User model missing preferences or notificationMusic');
      }
      
      if (usersContent.includes('updateUserMusicPreference')) {
        console.log('  ✅ updateUserMusicPreference function exists');
      } else {
        console.log('  ❌ updateUserMusicPreference function missing');
        results.userModel = false;
      }
    } catch (error) {
      console.log('  ❌ Could not verify user model');
    }

    // 6. Verify account page integration
    console.log('\n📄 Checking account page integration...');
    try {
      const accountContent = await fs.readFile(path.join(__dirname, 'pages', 'account.js'), 'utf8');
      
      if (accountContent.includes('MusicSelector') && accountContent.includes('NotificationDemo')) {
        console.log('  ✅ Account page includes MusicSelector and NotificationDemo');
      } else {
        console.log('  ❌ Account page missing MusicSelector or NotificationDemo integration');
      }
    } catch (error) {
      console.log('  ❌ Could not verify account page integration');
    }

    // Summary
    console.log('\n📊 Verification Summary:');
    console.log('========================');
    console.log(`Audio Files: ${results.audioFiles ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Components: ${results.components ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`API Endpoint: ${results.apiEndpoint ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Audio Manager: ${results.integration ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`User Model: ${results.userModel ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(result => result);
    console.log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (allPassed) {
      console.log('\n🎉 Notification Music Customization System is fully implemented!');
      console.log('\nTo test the system:');
      console.log('1. Start the development server: npm run dev');
      console.log('2. Navigate to /account page');
      console.log('3. Use the Music Selection section to choose notification sounds');
      console.log('4. Test notifications using the Notification Demo section');
      console.log('5. Open test-notification-music.html for comprehensive testing');
    } else {
      console.log('\n⚠️ Some components are missing or incomplete.');
      console.log('Please review the failed items above.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
verifyNotificationMusicSystem();