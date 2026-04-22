## 2024-04-22 - [Insecure Random Generation in Execution IDs]
**Vulnerability:** Use of `Math.random()` for generating sensitive process execution IDs.
**Learning:** `Math.random()` is predictable and cryptographically insecure, leading to potential identifier collisions or cross-execution manipulation.
**Prevention:** Always use cryptographically secure methods like `crypto.randomBytes` or secure UUIDs for sensitive identifiers.
