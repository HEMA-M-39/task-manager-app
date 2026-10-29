const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 8100;
const serverScript = path.join(__dirname, '../backend/dist/index.js');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeRequest(method, urlPath, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, `http://localhost:${PORT}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function waitForServer(retries = 30, interval = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await makeRequest('GET', '/api/health');
      if (res.status === 200) {
        return true;
      }
    } catch (e) {
      // Ignore connection errors while waiting
    }
    await sleep(interval);
  }
  throw new Error('Server failed to start within timeout');
}

async function runTest() {
  console.log('=== Starting Persistence Verification Script ===');

  // Ensure backend is built
  console.log('Building backend...');
  const { execSync } = require('child_process');
  execSync('npm run build -w backend', { stdio: 'inherit' });

  const uniqueTitle = `Persistence Test Task - ${Date.now()}`;
  const uniqueDesc = 'Verifying task survives server stop & restart';

  console.log('1. Starting server instance 1...');
  const serverProcess1 = spawn('node', [serverScript], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(PORT) }
  });

  serverProcess1.stdout.on('data', (data) => {
    // console.log(`[Server 1] ${data.toString().trim()}`);
  });
  serverProcess1.stderr.on('data', (data) => {
    console.error(`[Server 1 Err] ${data.toString().trim()}`);
  });

  try {
    console.log('Waiting for server 1 to be ready...');
    await waitForServer();
    console.log('Server 1 is up and healthy.');

    console.log('2. Creating a task via API...');
    const createRes = await makeRequest('POST', '/api/tasks', {
      title: uniqueTitle,
      description: uniqueDesc,
      priority: 'high',
      status: 'todo'
    });

    if (createRes.status !== 201 || !createRes.body || !createRes.body.id) {
      throw new Error(`Failed to create task: status ${createRes.status}, body: ${JSON.stringify(createRes.body)}`);
    }

    const createdTaskId = createRes.body.id;
    console.log(`Task created successfully with ID: ${createdTaskId}`);

  } finally {
    console.log('3. Stopping server instance 1...');
    serverProcess1.kill('SIGTERM');
    await sleep(1000);
  }

  console.log('4. Restarting server (instance 2)...');
  const serverProcess2 = spawn('node', [serverScript], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(PORT) }
  });

  serverProcess2.stdout.on('data', (data) => {
    // console.log(`[Server 2] ${data.toString().trim()}`);
  });
  serverProcess2.stderr.on('data', (data) => {
    console.error(`[Server 2 Err] ${data.toString().trim()}`);
  });

  try {
    console.log('Waiting for server 2 to be ready...');
    await waitForServer();
    console.log('Server 2 is up and healthy.');

    console.log('5. Verifying the task still exists in the database via API...');
    const listRes = await makeRequest('GET', '/api/tasks');

    if (listRes.status !== 200 || !Array.isArray(listRes.body)) {
      throw new Error(`Failed to fetch tasks: status ${listRes.status}`);
    }

    const foundTask = listRes.body.find((t) => t.title === uniqueTitle);
    if (!foundTask) {
      throw new Error(`Persistence verification failed: Task with title "${uniqueTitle}" not found after restart!`);
    }

    console.log('Success! Task successfully retrieved after restart:', foundTask);
    console.log('=== Persistence Test PASSED Successfully ===');

  } finally {
    console.log('Stopping server instance 2...');
    serverProcess2.kill('SIGTERM');
    await sleep(1000);
  }
}

runTest().catch((err) => {
  console.error('Persistence verification FAILED:', err);
  process.exit(1);
});
