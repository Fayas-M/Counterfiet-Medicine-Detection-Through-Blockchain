import { fork } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting backend server from backend/server.js...');

const serverPath = join(__dirname, 'backend', 'server.js');
const serverCwd = join(__dirname, 'backend');

fork(serverPath, [], {
  stdio: 'inherit',
  cwd: serverCwd
});
