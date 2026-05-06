const { spawn } = require('child_process');
const child = spawn('eas', ['login'], {
  stdio: 'pipe',
  shell: true
});

child.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('STDOUT:', output);
  if (output.includes('Email or username')) {
    console.log('Sending username...');
    child.stdin.write('Love1\n');
  }
  if (output.includes('Password')) {
    console.log('Sending password...');
    child.stdin.write('Preetham-18\n');
  }
});

child.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

child.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});
