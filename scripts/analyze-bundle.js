const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const fs = require('fs');
const path = require('path');

async function analyzeBundle() {
  console.log('📊 Analyzing bundle...
');

  const statsFile = path.join(__dirname, '../dist/stats.json');
  
  if (!fs.existsSync(statsFile)) {
    console.error('❌ stats.json not found. Run build first with --json flag');
    process.exit(1);
  }

  const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));

  // Analyze modules
  const modules = stats.modules || [];
  const largeModules = modules
    .filter(m => m.size > 50000) // > 50KB
    .sort((a, b) => b.size - a.size)
    .slice(0, 20);

  console.log('🔍 Largest Modules (> 50KB):');
  largeModules.forEach(m => {
    const sizeMB = (m.size / 1024).toFixed(2);
    console.log(`  ${m.name}: ${sizeMB} KB`);
  });

  // Analyze chunks
  const chunks = stats.chunks || [];
  const largeChunks = chunks
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  console.log('
📦 Largest Chunks:');
  largeChunks.forEach(c => {
    const sizeMB = (c.size / 1024).toFixed(2);
    console.log(`  ${c.names.join(', ')}: ${sizeMB} KB`);
  });

  // Analyze assets
  const assets = stats.assets || [];
  const totalSize = assets.reduce((sum, a) => sum + a.size, 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

  console.log(`
📈 Total Bundle Size: ${totalSizeMB} MB`);

  // Check for duplicates
  const moduleNames = modules.map(m => m.name);
  const duplicates = moduleNames.filter((name, index) => 
    moduleNames.indexOf(name) !== index
  );

  if (duplicates.length > 0) {
    console.log('
⚠️  Duplicate Modules Found:');
    const uniqueDuplicates = [...new Set(duplicates)];
    uniqueDuplicates.forEach(name => {
      const count = moduleNames.filter(n => n === name).length;
      console.log(`  ${name}: ${count} instances`);
    });
  }

  // Recommendations
  console.log('
💡 Recommendations:');
  
  if (totalSize > 1024 * 1024) { // > 1MB
    console.log('  - Consider code splitting for large bundles');
  }
  
  if (largeModules.length > 0) {
    console.log('  - Review and optimize large modules');
  }
  
  if (duplicates.length > 0) {
    console.log('  - Remove duplicate dependencies');
  }

  // Generate report
  const reportPath = path.join(__dirname, '../dist/bundle-report.html');
  console.log(`
📄 Full report: ${reportPath}`);
}

analyzeBundle().catch(console.error);
