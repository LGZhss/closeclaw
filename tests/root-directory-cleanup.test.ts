import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Root Directory Cleanup Bug Condition Tests
 * 
 * These tests validate the bug fix for root directory pollution.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */

const ROOT_DIR = path.resolve(__dirname, '..');

// Temporary files that should NOT exist in root directory
const TEMP_PYTHON_SCRIPTS = [
  'add_vote_temp.py',
  'add_vote.py',
  'addvote.py',
  'find_line_count.py',
  'find_votes.py',
  'find_votes2.py',
  'read_txt.py',
  'read_vote.py',
];

const TEMP_JS_FILES = [
  'findcodex.js',
  'js1.js',
  'script.js',
  'temp.js',
];

const TEMP_MD_FILES = [
  'clean_vote.md',
  'final_check.md',
  'original.md',
  'walkthrough.md',
];

const TEMP_TXT_FILES = [
  'votes_content_copy.txt',
  'votes_content.txt',
  'votes_out.txt',
  'encoding_check.txt',
];

const UNKNOWN_FILES = ["tash'"];

// Core files that MUST be preserved
const CORE_CONFIG_FILES = [
  'package.json',
  'tsconfig.json',
  'README.md',
  'RULES.md',
  'SECURITY.md',
  '.env.example',
  '.gitignore',
  'vitest.config.ts',
];

const CORE_DIRECTORIES = [
  'src',
  'docs',
  'scripts',
  'templates',
  'votes',
  'tests',
  'data',
  'dist',
  'gh_bin',
];

const IDE_CONFIG_DIRS = [
  '.arts',
  '.git',
  '.github',
  '.husky',
  '.idea',
  '.kiro',
];

describe('Property 1: Bug Condition - Root Directory Temporary Files', () => {
  /**
   * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
   * DO NOT attempt to fix the test or the code when it fails
   * GOAL: Surface counterexamples that demonstrate temporary files exist in root directory
   */

  it('should NOT have temporary Python scripts in root directory', () => {
    const existingFiles = TEMP_PYTHON_SCRIPTS.filter(file => 
      fs.existsSync(path.join(ROOT_DIR, file))
    );
    
    expect(existingFiles).toEqual([]);
  });

  it('should NOT have temporary JavaScript files in root directory', () => {
    const existingFiles = TEMP_JS_FILES.filter(file => 
      fs.existsSync(path.join(ROOT_DIR, file))
    );
    
    expect(existingFiles).toEqual([]);
  });

  it('should NOT have temporary Markdown documents in root directory', () => {
    const existingFiles = TEMP_MD_FILES.filter(file => 
      fs.existsSync(path.join(ROOT_DIR, file))
    );
    
    expect(existingFiles).toEqual([]);
  });

  it('should NOT have temporary output text files in root directory', () => {
    const existingFiles = TEMP_TXT_FILES.filter(file => 
      fs.existsSync(path.join(ROOT_DIR, file))
    );
    
    expect(existingFiles).toEqual([]);
  });

  it('should NOT have unknown files in root directory', () => {
    const existingFiles = UNKNOWN_FILES.filter(file => 
      fs.existsSync(path.join(ROOT_DIR, file))
    );
    
    expect(existingFiles).toEqual([]);
  });

  it('should NOT have logs-*.zip files in root directory', () => {
    const files = fs.readdirSync(ROOT_DIR);
    const logZipFiles = files.filter(file => /^logs-.*\.zip$/.test(file));
    
    expect(logZipFiles).toEqual([]);
  });

  it('should have temporary file ignore rules in .gitignore', () => {
    const gitignorePath = path.join(ROOT_DIR, '.gitignore');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    
    // Check for temporary file patterns
    const hasTemporaryRules = 
      gitignoreContent.includes('*_temp.*') &&
      gitignoreContent.includes('temp.*') &&
      gitignoreContent.includes('*_copy.*') &&
      gitignoreContent.includes('*_out.*');
    
    expect(hasTemporaryRules).toBe(true);
  });
});

describe('Property 2: Preservation - Core Files and Directories', () => {
  /**
   * IMPORTANT: These tests capture baseline behavior to preserve
   * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms what to preserve)
   */

  it('should preserve all core configuration files', () => {
    const missingFiles = CORE_CONFIG_FILES.filter(file => 
      !fs.existsSync(path.join(ROOT_DIR, file))
    );
    
    expect(missingFiles).toEqual([]);
  });

  it('should preserve all core directories', () => {
    const missingDirs = CORE_DIRECTORIES.filter(dir => {
      const dirPath = path.join(ROOT_DIR, dir);
      return !fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory();
    });
    
    expect(missingDirs).toEqual([]);
  });

  it('should preserve IDE configuration directories', () => {
    const missingDirs = IDE_CONFIG_DIRS.filter(dir => {
      const dirPath = path.join(ROOT_DIR, dir);
      return !fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory();
    });
    
    expect(missingDirs).toEqual([]);
  });

  it('should preserve existing .gitignore rules', () => {
    const gitignorePath = path.join(ROOT_DIR, '.gitignore');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    
    // Check for essential existing rules
    const hasEssentialRules = 
      gitignoreContent.includes('node_modules/') &&
      gitignoreContent.includes('dist/') &&
      gitignoreContent.includes('.env');
    
    expect(hasEssentialRules).toBe(true);
  });

  it('should preserve scripts directory functionality', () => {
    const scriptsDir = path.join(ROOT_DIR, 'scripts');
    expect(fs.existsSync(scriptsDir)).toBe(true);
    
    // Check that scripts directory contains files
    const scriptsFiles = fs.readdirSync(scriptsDir);
    expect(scriptsFiles.length).toBeGreaterThan(0);
  });
});
