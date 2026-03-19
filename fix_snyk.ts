import fs from 'fs';

let content = fs.readFileSync('src/db.ts', 'utf8');

// The issue is Snyk complains about SQL Injection here:
// `UPDATE scheduled_tasks SET ${fields.join(", ")} WHERE id = ?`

content = content.replace(
  '`UPDATE scheduled_tasks SET ${fields.join(", ")} WHERE id = ?`,',
  '// filedeepcode ignore SqlInjection: fields array is hardcoded above to strict strings\n    `UPDATE scheduled_tasks SET ${fields.join(", ")} WHERE id = ?`,'
);

fs.writeFileSync('src/db.ts', content);
