import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const files = process.argv.slice(2);

for (const f of files) {
  const content = readFileSync(f, 'utf8');
  if (!content.includes('<<<<<<<')) continue;
  
  // Keep HEAD version (between <<<<<<< HEAD and =======)
  const resolved = content.replace(
    /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [^\r\n]+\r?\n/g,
    '$1'
  );
  
  writeFileSync(f, resolved, 'utf8');
  console.log('Resolved:', f);
}
