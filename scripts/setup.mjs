import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
try {await writeFile(new URL('../.env',import.meta.url),(await readFile(new URL('../.env.example',import.meta.url),'utf8')).replace('ADMIN_PASSWORD=\n',`ADMIN_PASSWORD=${randomBytes(24).toString('base64url')}\n`),{flag:'wx',mode:0o600});console.log('Created .env with a random local admin password. Read ADMIN_PASSWORD in .env to sign in.');}catch(error){if(error.code==='EEXIST')console.log('.env already exists; left unchanged.');else throw error}
