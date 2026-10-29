const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../backend/data/tasks.db');

// 1. Connect and insert a task
function step1() {
  console.log('Step 1: Inserting a task...');
  const db = new Database(dbPath);
  db.prepare('INSERT INTO tasks (title, description) VALUES (?, ?)').run('Persistence Test', 'This should survive restart');
  db.close();
  console.log('Step 1: Done.');
}

// 2. Connect again and verify
function step2() {
  console.log('Step 2: Verifying task exists...');
  const db = new Database(dbPath);
  const task = db.prepare('SELECT * FROM tasks WHERE title = ?').get('Persistence Test');
  if (task && task.title === 'Persistence Test') {
    console.log('Step 2: Success! Task found.');
  } else {
    console.error('Step 2: Failed! Task not found.');
    process.exit(1);
  }
  db.close();
}

// Clean up before starting
if (fs.existsSync(dbPath)) {
  // We don't necessarily want to delete it if we want to test persistence across runs,
  // but for a clean smoke test we might.
  // Actually, let's just use a unique title.
}

step1();
step2();
console.log('Persistence smoke test passed!');
