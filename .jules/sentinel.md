## 2024-05-24 - Command Injection in runGit fixed via execFileSync
**Vulnerability:** The `runGit` function in `src/utils/utils.ts` executed git commands by joining arguments into a single string and passing it to `child_process.execSync` (`execSync(\`git ${args.join(" ")}\`, ...)`), which evaluates it through a shell, allowing command injection via shell metacharacters (e.g. `;`, `&&`, `` ` ``).
**Learning:** Functions intended to run specific commands with arguments (like `git status`) should use direct execution APIs that don't invoke a shell.
**Prevention:** Use `child_process.execFileSync` (or `spawn` with `shell: false`) and pass arguments as an array instead of concatenating them into a string.
