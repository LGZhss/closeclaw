## 2024-03-29 - Regex Parsing Command Injection Enhancements

**Vulnerability:** The legacy `execAsync` utility manually tokenized string arguments using a flawed regex (`/(?:[^\s"]+|"[^"]*")+/g`) that failed to correctly handle backslash-escaped characters, explicitly empty strings (`""`), or single quotes. It could lead to command argument truncation or mangling when parsing untrusted input for safe `spawn(..., { shell: false })` execution.
**Learning:** Re-implementing a shell parser via naive string splitting frequently introduces subtle parameter injection or truncation vulnerabilities if quote-unwrapping logic doesn't correctly handle escaped strings.
**Prevention:** Always use the unrolled-loop pattern (`"[^"\\]*(?:\\.[^"\\]*)*"`) when matching quoted string literals via regular expressions to handle character escaping securely without introducing ReDoS (Regular Expression Denial of Service) vulnerabilities. Alternatively, depend on a well-tested community parser.
