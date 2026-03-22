import fs from 'fs';

let content = fs.readFileSync('src/db.ts', 'utf8');
content = content.replace("('UPDATE scheduled_tasks SET ' + fields.join(', ') + ' WHERE id = ?'),", '`UPDATE scheduled_tasks SET ${fields.join(", ")} WHERE id = ?`,');
fs.writeFileSync('src/db.ts', content);
