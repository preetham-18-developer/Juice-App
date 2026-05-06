const { spawn } = require('child_process');

const child = spawn('npx', ['eas-cli', 'login'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true
});

child.stdin.write('Love1\n');
setTimeout(() => {
  child.stdin.write('Preetham-18\n');
  child.stdin.end();
}, 2000);

child.on('close', (code) => {
  console.log(`Login process exited with code ${code}`);
});
