#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple bundle analyzer for the Work Time Tracker application
 * Analyzes the built files and provides size information
 */

const DIST_DIR = path.join(__dirname, '..', 'dist');
const SIZE_LIMITS = {
  js: 500 * 1024, // 500KB for JS files
  css: 100 * 1024, // 100KB for CSS files
  html: 50 * 1024, // 50KB for HTML files
  assets: 1024 * 1024 // 1MB for asset files
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

function analyzeDirectory(dir) {
  const files = [];

  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        walkDir(itemPath);
      } else {
        const relativePath = path.relative(DIST_DIR, itemPath);
        const extension = getFileExtension(item);

        files.push({
          path: relativePath,
          name: item,
          size: stat.size,
          extension,
          type: getFileType(extension)
        });
      }
    }
  }

  walkDir(dir);
  return files;
}

function getFileType(extension) {
  const typeMap = {
    '.js': 'JavaScript',
    '.mjs': 'JavaScript Module',
    '.css': 'Stylesheet',
    '.html': 'HTML',
    '.svg': 'SVG',
    '.png': 'Image',
    '.jpg': 'Image',
    '.jpeg': 'Image',
    '.gif': 'Image',
    '.webp': 'Image',
    '.ico': 'Icon',
    '.json': 'Data',
    '.woff': 'Font',
    '.woff2': 'Font',
    '.ttf': 'Font',
    '.otf': 'Font'
  };

  return typeMap[extension] || 'Other';
}

function checkSizeLimits(files) {
  const warnings = [];

  for (const file of files) {
    let limit;

    switch (file.extension) {
      case '.js':
      case '.mjs':
        limit = SIZE_LIMITS.js;
        break;
      case '.css':
        limit = SIZE_LIMITS.css;
        break;
      case '.html':
        limit = SIZE_LIMITS.html;
        break;
      default:
        limit = SIZE_LIMITS.assets;
    }

    if (file.size > limit) {
      warnings.push({
        file: file.path,
        size: file.size,
        limit,
        type: file.type
      });
    }
  }

  return warnings;
}

function groupFilesByType(files) {
  const groups = {};

  for (const file of files) {
    if (!groups[file.type]) {
      groups[file.type] = [];
    }
    groups[file.type].push(file);
  }

  // Sort files within each group by size (largest first)
  for (const type in groups) {
    groups[type].sort((a, b) => b.size - a.size);
  }

  return groups;
}

function generateReport(files) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const groups = groupFilesByType(files);
  const warnings = checkSizeLimits(files);

  console.log('\n📦 Bundle Analysis Report');
  console.log('========================\n');

  // Overall stats
  console.log('📊 Overall Statistics:');
  console.log(`   Total Files: ${files.length}`);
  console.log(`   Total Size: ${formatBytes(totalSize)}`);
  console.log(`   Average File Size: ${formatBytes(totalSize / files.length)}\n`);

  // File type breakdown
  console.log('📁 Files by Type:');
  for (const [type, typeFiles] of Object.entries(groups)) {
    const typeSize = typeFiles.reduce((sum, file) => sum + file.size, 0);
    const percentage = ((typeSize / totalSize) * 100).toFixed(1);

    console.log(`   ${type}: ${typeFiles.length} files, ${formatBytes(typeSize)} (${percentage}%)`);

    // Show largest files in each category
    const topFiles = typeFiles.slice(0, 3);
    for (const file of topFiles) {
      console.log(`     • ${file.path}: ${formatBytes(file.size)}`);
    }

    if (typeFiles.length > 3) {
      console.log(`     ... and ${typeFiles.length - 3} more files`);
    }
    console.log();
  }

  // Size warnings
  if (warnings.length > 0) {
    console.log('⚠️  Size Warnings:');
    for (const warning of warnings) {
      console.log(
        `   • ${warning.file}: ${formatBytes(warning.size)} (exceeds ${formatBytes(warning.limit)} limit)`
      );
    }
    console.log();
  } else {
    console.log('✅ All files are within size limits!\n');
  }

  // Largest files overall
  const largestFiles = [...files].sort((a, b) => b.size - a.size).slice(0, 10);
  console.log('📈 Largest Files:');
  for (let i = 0; i < largestFiles.length; i++) {
    const file = largestFiles[i];
    console.log(`   ${i + 1}. ${file.path}: ${formatBytes(file.size)} (${file.type})`);
  }
  console.log();

  // Performance recommendations
  console.log('🚀 Performance Recommendations:');

  const jsSize = groups.JavaScript?.reduce((sum, file) => sum + file.size, 0) || 0;
  const cssSize = groups.Stylesheet?.reduce((sum, file) => sum + file.size, 0) || 0;

  if (jsSize > 300 * 1024) {
    console.log('   • Consider code splitting to reduce JavaScript bundle size');
  }

  if (cssSize > 50 * 1024) {
    console.log('   • Consider removing unused CSS or splitting stylesheets');
  }

  if (totalSize > 1024 * 1024) {
    console.log('   • Total bundle size is over 1MB - consider optimization');
  }

  if (files.some((f) => f.extension === '.png' || f.extension === '.jpg')) {
    console.log('   • Consider using WebP format for images');
  }

  if (warnings.length === 0 && totalSize < 512 * 1024) {
    console.log('   ✅ Bundle size looks optimal!');
  }

  console.log();

  return {
    totalSize,
    totalFiles: files.length,
    warnings: warnings.length,
    groups,
    success: warnings.length === 0
  };
}

// Main execution
try {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Dist directory not found. Please run "npm run build" first.');
    process.exit(1);
  }

  console.log('🔍 Analyzing bundle...');

  const files = analyzeDirectory(DIST_DIR);

  if (files.length === 0) {
    console.error('❌ No files found in dist directory.');
    process.exit(1);
  }

  const report = generateReport(files);

  // Exit with error code if there are warnings
  if (report.warnings > 0) {
    console.log(`⚠️  Bundle analysis completed with ${report.warnings} warnings.`);
    process.exit(1);
  } else {
    console.log('✅ Bundle analysis completed successfully!');
    process.exit(0);
  }
} catch (error) {
  console.error('❌ Error during bundle analysis:', error.message);
  process.exit(1);
}
