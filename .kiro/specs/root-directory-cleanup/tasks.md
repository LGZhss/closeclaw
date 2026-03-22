# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Root Directory Temporary Files Exist
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate temporary files exist in root directory
  - **Scoped PBT Approach**: Check for specific temporary files listed in Bug Condition
  - Test that root directory contains temporary files from the following categories:
    - Temporary Python scripts: add_vote_temp.py, add_vote.py, addvote.py, find_line_count.py, find_votes.py, find_votes2.py, read_txt.py, read_vote.py
    - Temporary JavaScript files: findcodex.js, js1.js, script.js, temp.js
    - Temporary Markdown documents: clean_vote.md, final_check.md, original.md, walkthrough.md
    - Temporary output text files: votes_content_copy.txt, votes_content.txt, votes_out.txt, encoding_check.txt
    - Unknown files: tash', logs-*.zip
  - Test that .gitignore lacks temporary file ignore rules
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (which temporary files exist in root directory)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Core Files and Directories Preserved
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for core files and directories
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Core configuration files must remain unchanged: package.json, tsconfig.json, README.md, RULES.md, SECURITY.md, .env.example, .gitignore, vitest.config.ts
    - Standard directories must remain unchanged: src/, docs/, scripts/, templates/, votes/, tests/, data/, dist/, gh_bin/
    - IDE configuration directories must remain unchanged: .arts/, .codeartsdoer/, .dropstone/, .git/, .github/, .husky/, .idea/, .jules/, .kiro/, .lingma/, .qoder/
    - Existing .gitignore rules must continue to work
    - Scripts in scripts/ directory must continue to function
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for root directory cleanup

  - [ ] 3.1 Delete temporary Python scripts
    - Delete add_vote_temp.py
    - Delete add_vote.py
    - Delete addvote.py
    - Delete find_line_count.py
    - Delete find_votes.py
    - Delete find_votes2.py
    - Delete read_txt.py (if exists)
    - Delete read_vote.py (if exists)
    - _Bug_Condition: isBugCondition(file) where file.name IN ['add_vote_temp.py', 'add_vote.py', 'addvote.py', 'find_line_count.py', 'find_votes.py', 'find_votes2.py', 'read_txt.py', 'read_vote.py'] AND file.location == "root_directory"_
    - _Expected_Behavior: Root directory SHALL NOT contain temporary Python scripts_
    - _Preservation: Core configuration files and standard directories must remain unchanged_
    - _Requirements: 1.1, 1.2, 2.1_

  - [ ] 3.2 Delete temporary JavaScript files
    - Delete findcodex.js
    - Delete js1.js (if exists)
    - Delete script.js (if exists)
    - Delete temp.js (if exists)
    - _Bug_Condition: isBugCondition(file) where file.name IN ['findcodex.js', 'js1.js', 'script.js', 'temp.js'] AND file.location == "root_directory"_
    - _Expected_Behavior: Root directory SHALL NOT contain temporary JavaScript files_
    - _Preservation: Core configuration files and standard directories must remain unchanged_
    - _Requirements: 1.3, 2.2_

  - [ ] 3.3 Delete temporary Markdown documents
    - Delete clean_vote.md
    - Delete final_check.md
    - Delete original.md (if exists)
    - Delete walkthrough.md (if exists)
    - _Bug_Condition: isBugCondition(file) where file.name IN ['clean_vote.md', 'final_check.md', 'original.md', 'walkthrough.md'] AND file.location == "root_directory"_
    - _Expected_Behavior: Root directory SHALL NOT contain temporary Markdown documents_
    - _Preservation: Core Markdown files (README.md, RULES.md, SECURITY.md) must remain unchanged_
    - _Requirements: 1.4, 2.3_

  - [ ] 3.4 Delete temporary output text files
    - Delete votes_content_copy.txt (if exists)
    - Delete votes_content.txt (if exists)
    - Delete votes_out.txt (if exists)
    - Delete encoding_check.txt
    - _Bug_Condition: isBugCondition(file) where file.name IN ['votes_content_copy.txt', 'votes_content.txt', 'votes_out.txt', 'encoding_check.txt'] AND file.location == "root_directory"_
    - _Expected_Behavior: Root directory SHALL NOT contain temporary output text files_
    - _Preservation: Core configuration files must remain unchanged_
    - _Requirements: 1.5, 2.4_

  - [ ] 3.5 Delete unknown files and temporary logs
    - Delete tash' (if exists)
    - Delete all logs-*.zip files (if exist)
    - _Bug_Condition: isBugCondition(file) where file.name == "tash'" OR file.name MATCHES 'logs-*.zip' AND file.location == "root_directory"_
    - _Expected_Behavior: Root directory SHALL NOT contain unknown files or temporary log archives_
    - _Preservation: Core configuration files and standard directories must remain unchanged_
    - _Requirements: 1.6, 2.5_

  - [ ] 3.6 Update .gitignore rules
    - Add temporary file ignore rules to .gitignore
    - Add rules for: *.tmp, *.temp, .cache/, *_temp.*, temp.*, *_copy.*, *_out.*
    - Add root directory specific rules: /*.txt, /*.py, /*.js, /*.md
    - Add exceptions: !README.md, !RULES.md, !SECURITY.md, !CHANGELOG.md
    - _Bug_Condition: .gitignore lacks temporary file ignore rules_
    - _Expected_Behavior: .gitignore SHALL contain comprehensive temporary file ignore rules_
    - _Preservation: Existing .gitignore rules must continue to work_
    - _Requirements: 1.7, 2.6_

  - [ ] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Root Directory Clean
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Core Files and Directories Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
