const http = require('http');

// Helper to make HTTP requests
function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING TASKFLOW AUTOMATED TEST SUITE ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Health check
  const health = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  assert(health.status === 200 && health.data.status === 'online', '1. GET /api/health returns 200 online');

  // 2. Register user 1
  const testEmail1 = `testuser_${Date.now()}@test.com`;
  const reg1 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Alice Test', email: testEmail1, password: 'password123' });
  assert(reg1.status === 201 && reg1.data.token, '2. POST /api/auth/register creates user and returns JWT');
  const token1 = reg1.data.token;

  // 3. Duplicate register check
  const regDup = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Alice Test', email: testEmail1, password: 'password123' });
  assert(regDup.status === 409, '3. Duplicate registration is rejected with 409 Conflict');

  // 4. Login user 1
  const login1 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail1, password: 'password123' });
  assert(login1.status === 200 && login1.data.token, '4. POST /api/auth/login succeeds with valid credentials');

  // 5. Wrong password check
  const loginBad = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail1, password: 'wrongpassword' });
  assert(loginBad.status === 401, '5. Invalid password rejected with 401 Unauthorized');

  // 6. Get Current User Profile
  const me = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/me', method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  assert(me.status === 200 && me.data.user.email === testEmail1, '6. GET /api/auth/me validates Bearer token and returns user profile');

  // 7. Create Task
  const createTask = await request({
    hostname: 'localhost', port: 5000, path: '/api/tasks', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` }
  }, { title: 'Prepare Placement Portfolio', description: 'Complete full-stack TaskFlow system', priority: 'high', status: 'in_progress', due_date: '2026-11-01' });
  assert(createTask.status === 201 && createTask.data.task.title === 'Prepare Placement Portfolio', '7. POST /api/tasks creates task successfully');
  const taskId = createTask.data.task.id;

  // 8. List Tasks & Verify Statistics
  const listTasks = await request({
    hostname: 'localhost', port: 5000, path: '/api/tasks', method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  assert(listTasks.status === 200 && listTasks.data.tasks.length >= 1 && listTasks.data.stats.total >= 1 && listTasks.data.stats.in_progress >= 1, '8. GET /api/tasks returns task list and accurate aggregate stats');

  // 9. Update Task
  const updateTask = await request({
    hostname: 'localhost', port: 5000, path: `/api/tasks/${taskId}`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` }
  }, { status: 'completed' });
  assert(updateTask.status === 200 && updateTask.data.task.status === 'completed', '9. PUT /api/tasks/:id updates task status to completed');

  // 10. User Isolation Test
  const testEmail2 = `testuser2_${Date.now()}@test.com`;
  const reg2 = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Bob Test', email: testEmail2, password: 'password123' });
  const token2 = reg2.data.token;

  // User 2 tries to access User 1's task
  const user2Access = await request({
    hostname: 'localhost', port: 5000, path: `/api/tasks/${taskId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${token2}` }
  });
  assert(user2Access.status === 404, '10. USER ISOLATION: User B cannot access User A task (404/Unauthorized)');

  // User 2 tries to delete User 1's task
  const user2Delete = await request({
    hostname: 'localhost', port: 5000, path: `/api/tasks/${taskId}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token2}` }
  });
  assert(user2Delete.status === 404, '11. USER ISOLATION: User B cannot delete User A task (404/Unauthorized)');

  // 12. Delete Task by Owner
  const deleteTask = await request({
    hostname: 'localhost', port: 5000, path: `/api/tasks/${taskId}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  assert(deleteTask.status === 200, '12. DELETE /api/tasks/:id allows owner to delete task');

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  process.exit(failed > 0 ? 1 : 0);
}

// Start backend and run tests
require('./server.js');
setTimeout(runTests, 1000);