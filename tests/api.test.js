/**
 * =============================================================================
 * KageStream - Node.js API Test Suite
 * Day 13 Deliverable: Testing and Bug Fixes (#ALTABuilder30)
 * =============================================================================
 * Run using: node tests/api.test.js
 * Works with Node 18+ built-in test runner.
 */

const http = require('http');

const PORT = process.env.PORT || 5050;
const HOST = process.env.HOST || 'localhost';

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({
      hostname: HOST,
      port: PORT,
      path,
      method,
      headers: reqHeaders,
      timeout: 5000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

async function runAllTests() {
  console.log('\n===================================================================');
  console.log(`   KAGESTREAM NODE.JS API TESTS (Target: http://${HOST}:${PORT})`);
  console.log('===================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(title, fn) {
    const t0 = Date.now();
    try {
      await fn();
      const ms = Date.now() - t0;
      console.log(`  \x1b[32m✓ PASS\x1b[0m [${ms}ms] ${title}`);
      passed++;
    } catch (err) {
      const ms = Date.now() - t0;
      console.log(`  \x1b[31m✗ FAIL\x1b[0m [${ms}ms] ${title}: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('1. GET /api/health returns 200 and healthy status', async () => {
    const res = await request('GET', '/api/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.status !== 'healthy') throw new Error('Expected status healthy');
  });

  // 2. Anime Catalog
  await test('2. GET /api/anime returns paginated catalog list', async () => {
    const res = await request('GET', '/api/anime?page=1&limit=5');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.success) throw new Error('Expected success true');
    if (!Array.isArray(res.body.data?.anime)) throw new Error('Expected anime array');
  });

  // 3. Single Anime Details
  await test('3. GET /api/anime/1 returns details with relations', async () => {
    const res = await request('GET', '/api/anime/1');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.data?.id !== 1) throw new Error('Expected id 1');
  });

  // 4. Input validation: Bad registration data
  await test('4. POST /api/auth/register rejects short passwords with 400', async () => {
    const res = await request('POST', '/api/auth/register', {
      username: 'test_node_user',
      email: 'testnode@example.com',
      password: '123'
    });
    if (res.status !== 400) throw new Error(`Expected 400 for short password, got ${res.status}`);
  });

  // 5. Stream Multi-CDN Resolver
  await test('5. GET /api/stream/resolve/1 returns CDN servers and audio list', async () => {
    const res = await request('GET', '/api/stream/resolve/1');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const servers = res.body.data?.servers;
    if (!Array.isArray(servers) || servers.length < 2) {
      throw new Error('Expected at least 2 CDN servers');
    }
  });

  // 6. Watch progress sync
  await test('6. POST /api/stream/sync saves progress seconds', async () => {
    const res = await request('POST', '/api/stream/sync', {
      episode_id: 1,
      progress_seconds: 360,
      duration_seconds: 1440
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.data?.progress_seconds !== 360) {
      throw new Error(`Expected progress_seconds 360, got ${res.body.data?.progress_seconds}`);
    }
  });

  // 7. Bad Input Rejection: Missing episode_id
  await test('7. POST /api/stream/sync rejects missing episode_id with 400', async () => {
    const res = await request('POST', '/api/stream/sync', { progress_seconds: 300 });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 8. Episode Comments
  await test('8. POST /api/stream/episode/1/comments posts a comment', async () => {
    const res = await request('POST', '/api/stream/episode/1/comments', {
      content: 'Node.js automated integration test comment'
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
  });

  console.log('\n-------------------------------------------------------------------');
  console.log(`SUMMARY: ${passed + failed} Tests | \x1b[32m${passed} Passed\x1b[0m | \x1b[31m${failed} Failed\x1b[0m`);
  console.log('-------------------------------------------------------------------\n');

  if (failed > 0) process.exit(1);
  console.log('\x1b[32mAll Node.js API integration tests passed!\x1b[0m\n');
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
