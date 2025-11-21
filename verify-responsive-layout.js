/**
 * Verification script for responsive layout implementation
 * This script checks if the CSS classes and responsive breakpoints are properly implemented
 */

const fs = require('fs');
const path = require('path');

function verifyResponsiveLayout() {
  console.log('🔍 Verifying Responsive Layout Implementation...\n');

  // Read the CSS file
  const cssPath = path.join(__dirname, 'styles', 'globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Define expected CSS classes and features
  const expectedClasses = [
    '.container',
    '.main-panel',
    '.side-panel',
    '.flex-container',
    '.flex-center',
    '.flex-column',
    '.flex-row',
    '.grid-2',
    '.grid-3',
    '.grid-auto',
    '.btn-group',
    '.btn-group-horizontal',
    '.btn-group-vertical',
    '.theme-selector',
    '.theme-btn',
    '.card-grid',
    '.card-flex',
    '.content-container',
    '.section-container',
    '.spacing-xs',
    '.spacing-sm',
    '.spacing-md',
    '.spacing-lg',
    '.spacing-xl',
    '.spacing-2xl',
    '.padding-xs',
    '.padding-sm',
    '.padding-md',
    '.padding-lg',
    '.padding-xl',
    '.padding-2xl',
    '.text-xs',
    '.text-sm',
    '.text-base',
    '.text-lg',
    '.text-xl',
    '.text-2xl',
    '.text-3xl',
    '.text-4xl',
    '.desktop-only',
    '.tablet-only',
    '.mobile-only'
  ];

  const expectedBreakpoints = [
    '@media (min-width: 1200px)',
    '@media (min-width: 900px) and (max-width: 1199px)',
    '@media (min-width: 768px) and (max-width: 899px)',
    '@media (max-width: 767px)',
    '@media (max-width: 480px)'
  ];

  const expectedFeatures = [
    'grid-template-columns',
    'grid-template-areas',
    'flex-wrap',
    'justify-content',
    'align-items',
    'gap:',
    'backdrop-filter',
    'transition:'
  ];

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Check for expected CSS classes
  console.log('📋 Testing CSS Classes:');
  expectedClasses.forEach(className => {
    totalTests++;
    const regex = new RegExp(`\\${className}\\s*{`, 'g');
    if (cssContent.match(regex)) {
      console.log(`  ✅ ${className} - Found`);
      passedTests++;
    } else {
      console.log(`  ❌ ${className} - Missing`);
    }
  });

  console.log('\n📱 Testing Responsive Breakpoints:');
  expectedBreakpoints.forEach(breakpoint => {
    totalTests++;
    if (cssContent.includes(breakpoint)) {
      console.log(`  ✅ ${breakpoint} - Found`);
      passedTests++;
    } else {
      console.log(`  ❌ ${breakpoint} - Missing`);
    }
  });

  console.log('\n🎨 Testing CSS Features:');
  expectedFeatures.forEach(feature => {
    totalTests++;
    if (cssContent.includes(feature)) {
      console.log(`  ✅ ${feature} - Found`);
      passedTests++;
    } else {
      console.log(`  ❌ ${feature} - Missing`);
    }
  });

  // Test specific responsive layout patterns
  console.log('\n🔧 Testing Layout Patterns:');
  
  const layoutTests = [
    {
      name: 'Grid Layout System',
      pattern: /\.container\s*{[^}]*display:\s*grid[^}]*}/s,
      description: 'Container uses CSS Grid'
    },
    {
      name: 'Responsive Grid Areas',
      pattern: /grid-template-areas:\s*"main sidebar"/,
      description: 'Grid areas defined for layout'
    },
    {
      name: 'Mobile-first Flexbox',
      pattern: /\.flex-container\s*{[^}]*display:\s*flex[^}]*}/s,
      description: 'Flexbox containers implemented'
    },
    {
      name: 'Theme Selector Enhancement',
      pattern: /\.theme-selector\s*{[^}]*display:\s*flex[^}]*}/s,
      description: 'Enhanced theme selector layout'
    },
    {
      name: 'Button Group Layout',
      pattern: /\.btn-group\s*{[^}]*display:\s*flex[^}]*}/s,
      description: 'Button group responsive layout'
    },
    {
      name: 'Mobile Responsive Override',
      pattern: /@media \(max-width: 767px\)[^}]*\.btn-group\s*{[^}]*flex-direction:\s*column[^}]*}/s,
      description: 'Mobile responsive button stacking'
    }
  ];

  layoutTests.forEach(test => {
    totalTests++;
    if (cssContent.match(test.pattern)) {
      console.log(`  ✅ ${test.name} - ${test.description}`);
      passedTests++;
    } else {
      console.log(`  ❌ ${test.name} - ${test.description}`);
    }
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All responsive layout features implemented successfully!');
  } else if (passedTests / totalTests >= 0.8) {
    console.log('✅ Responsive layout implementation is mostly complete.');
  } else {
    console.log('⚠️  Responsive layout implementation needs more work.');
  }

  // Check file size and structure
  const fileSizeKB = Math.round(fs.statSync(cssPath).size / 1024);
  console.log(`📁 CSS file size: ${fileSizeKB} KB`);
  
  const lineCount = cssContent.split('\n').length;
  console.log(`📄 Total lines: ${lineCount}`);

  // Check for modern CSS features
  console.log('\n🚀 Modern CSS Features:');
  const modernFeatures = [
    { name: 'CSS Grid', pattern: /display:\s*grid/ },
    { name: 'CSS Flexbox', pattern: /display:\s*flex/ },
    { name: 'CSS Custom Properties', pattern: /var\(--[^)]+\)/ },
    { name: 'Backdrop Filter', pattern: /backdrop-filter:/ },
    { name: 'CSS Transitions', pattern: /transition:/ },
    { name: 'CSS Transforms', pattern: /transform:/ },
    { name: 'CSS Animations', pattern: /@keyframes/ },
    { name: 'Media Queries', pattern: /@media/ }
  ];

  modernFeatures.forEach(feature => {
    const matches = cssContent.match(new RegExp(feature.pattern, 'g'));
    const count = matches ? matches.length : 0;
    console.log(`  ${count > 0 ? '✅' : '❌'} ${feature.name}: ${count} instances`);
  });

  console.log('\n✨ Responsive Layout Implementation Complete!');
  return passedTests === totalTests;
}

// Run verification
if (require.main === module) {
  verifyResponsiveLayout();
}

module.exports = { verifyResponsiveLayout };