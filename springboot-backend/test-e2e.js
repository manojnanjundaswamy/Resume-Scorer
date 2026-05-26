/**
 * End-to-end API test for Resume Scorer backend
 * Run: node test-e2e.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8080';
const TOKEN = process.env.JWT_TOKEN;
const RESUME_PATH = path.join(__dirname, 'test-resume.txt');

let passed = 0;
let failed = 0;
const results = [];

function log(label, status, detail) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  const line = `${icon} [${status}] ${label}${detail ? ': ' + detail : ''}`;
  console.log(line);
  results.push({ label, status, detail });
  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
}

function request(method, urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...options.headers,
    };
    if (options.json) {
      headers['Content-Type'] = 'application/json';
    }

    const body = options.json ? JSON.stringify(options.json) : options.body;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);

    const req = http.request(`${BASE}${urlPath}`, { method, headers, timeout: 120000 }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

function multipartRequest(urlPath, fields, files) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now();
    const CRLF = '\r\n';
    const parts = [];

    for (const [name, value] of Object.entries(fields)) {
      parts.push(Buffer.from(
        '--' + boundary + CRLF +
        `Content-Disposition: form-data; name="${name}"` + CRLF + CRLF
      ));
      parts.push(Buffer.from(String(value), 'utf8'));
      parts.push(Buffer.from(CRLF));
    }

    for (const [name, { path: filePath, type }] of Object.entries(files)) {
      const fileData = fs.readFileSync(filePath);
      const filename = path.basename(filePath);
      parts.push(Buffer.from(
        '--' + boundary + CRLF +
        `Content-Disposition: form-data; name="${name}"; filename="${filename}"` + CRLF +
        `Content-Type: ${type}` + CRLF + CRLF
      ));
      parts.push(fileData);
      parts.push(Buffer.from(CRLF));
    }

    parts.push(Buffer.from('--' + boundary + '--' + CRLF));
    const body = Buffer.concat(parts);

    const headers = {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    };

    const req = http.request(`${BASE}${urlPath}`, { method: 'POST', headers, timeout: 180000 }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log('  RESUME SCORER - END-TO-END API TESTS');
  console.log('========================================\n');

  // TEST 1: Health check (no auth)
  try {
    const r = await request('GET', '/api/health');
    r.status === 200 && r.data.status === 'ok'
      ? log('T1: GET /api/health', 'PASS', 'status=ok')
      : log('T1: GET /api/health', 'FAIL', `HTTP ${r.status}`);
  } catch (e) { log('T1: GET /api/health', 'FAIL', e.message); }

  // TEST 2: Protected endpoint without auth (expect 403)
  try {
    const r = await request('GET', '/api/users/me', { headers: {} });
    // Remove auth header manually
    const r2 = await new Promise((res) => {
      const req = http.request(`${BASE}/api/users/me`, { method: 'GET', timeout: 5000 }, (resp) => {
        resp.resume();
        res({ status: resp.statusCode });
      });
      req.on('error', () => res({ status: 0 }));
      req.end();
    });
    r2.status === 403 || r2.status === 401
      ? log('T2: No-auth request blocked', 'PASS', `HTTP ${r2.status}`)
      : log('T2: No-auth request blocked', 'FAIL', `Expected 401/403, got ${r2.status}`);
  } catch (e) { log('T2: No-auth request blocked', 'FAIL', e.message); }

  // TEST 3: GET /api/users/me (authenticated)
  try {
    const r = await request('GET', '/api/users/me');
    r.status === 200 && r.data.email
      ? log('T3: GET /api/users/me', 'PASS', `email=${r.data.email} credits=${r.data.creditsRemaining}`)
      : log('T3: GET /api/users/me', 'FAIL', `HTTP ${r.status} - ${JSON.stringify(r.data).substring(0, 100)}`);
  } catch (e) { log('T3: GET /api/users/me', 'FAIL', e.message); }

  // TEST 4: GET /api/history (authenticated, empty)
  try {
    const r = await request('GET', '/api/history');
    r.status === 200 && Array.isArray(r.data)
      ? log('T4: GET /api/history', 'PASS', `${r.data.length} entries`)
      : log('T4: GET /api/history', 'FAIL', `HTTP ${r.status}`);
  } catch (e) { log('T4: GET /api/history', 'FAIL', e.message); }

  // TEST 5: GET /api/results/{nonexistent} (expect 404)
  try {
    const r = await request('GET', '/api/results/00000000-0000-0000-0000-000000000000');
    r.status === 404
      ? log('T5: GET /api/results/nonexistent 404', 'PASS')
      : log('T5: GET /api/results/nonexistent 404', 'FAIL', `HTTP ${r.status}`);
  } catch (e) { log('T5: GET /api/results/nonexistent 404', 'FAIL', e.message); }

  // TEST 6: POST /api/credits/topup invalid amount (expect 400)
  try {
    const r = await request('POST', '/api/credits/topup', { json: { amount: -5 } });
    r.status === 400
      ? log('T6: Topup invalid amount → 400', 'PASS')
      : log('T6: Topup invalid amount → 400', 'FAIL', `HTTP ${r.status}`);
  } catch (e) { log('T6: Topup invalid amount → 400', 'FAIL', e.message); }

  // TEST 7: POST /api/analyze - empty file (expect 400)
  try {
    const emptyPath = path.join(__dirname, 'empty-test.txt');
    fs.writeFileSync(emptyPath, '');
    const r = await multipartRequest('/api/analyze', {}, {
      resume: { path: emptyPath, type: 'text/plain' }
    });
    r.status === 400
      ? log('T7: Empty resume → 400', 'PASS')
      : log('T7: Empty resume → 400', 'FAIL', `HTTP ${r.status} - ${JSON.stringify(r.data).substring(0, 100)}`);
    fs.unlinkSync(emptyPath);
  } catch (e) { log('T7: Empty resume → 400', 'FAIL', e.message); }

  // TEST 8: POST /api/analyze - unsupported file type (expect 4xx)
  try {
    const badPath = path.join(__dirname, 'bad.exe');
    fs.writeFileSync(badPath, 'fake binary content that is long enough to pass length check but wrong type');
    const r = await multipartRequest('/api/analyze', {}, {
      resume: { path: badPath, type: 'application/octet-stream' }
    });
    r.status >= 400 && r.status < 600
      ? log('T8: Unsupported file type → 4xx/5xx', 'PASS', `HTTP ${r.status}`)
      : log('T8: Unsupported file type → 4xx/5xx', 'FAIL', `HTTP ${r.status}`);
    fs.unlinkSync(badPath);
  } catch (e) { log('T8: Unsupported file type → 4xx/5xx', 'FAIL', e.message); }

  // TEST 9: POST /api/analyze - full analysis (the main test, calls OpenAI)
  console.log('\nℹ️  [INFO] T9: Running full AI analysis (this calls OpenAI - may take 30-90s)...');
  let analysisId = null;
  try {
    const r = await multipartRequest('/api/analyze',
      { jobDescription: 'Senior Backend Engineer. Java, Spring Boot, PostgreSQL, AWS required. 5+ years.' },
      { resume: { path: RESUME_PATH, type: 'text/plain' } }
    );
    if (r.status === 200 && r.data.analysisId && r.data.overallScore > 0) {
      analysisId = r.data.analysisId;
      log('T9: POST /api/analyze (full AI)', 'PASS',
        `id=${analysisId} score=${r.data.overallScore} grade=${r.data.grade} provider=${r.data.aiProvider}`);
      // Save full result
      fs.writeFileSync(path.join(__dirname, 'test-analysis-result.json'), JSON.stringify(r.data, null, 2));
      log('T9b: Full result saved', 'INFO', 'test-analysis-result.json');
    } else {
      log('T9: POST /api/analyze (full AI)', 'FAIL', `HTTP ${r.status} - ${JSON.stringify(r.data).substring(0, 200)}`);
    }
  } catch (e) { log('T9: POST /api/analyze (full AI)', 'FAIL', e.message); }

  // TEST 10: GET /api/results/{id} (retrieve the stored result)
  if (analysisId) {
    try {
      const r = await request('GET', `/api/results/${analysisId}`);
      r.status === 200 && r.data.overallScore > 0
        ? log('T10: GET /api/results/{id}', 'PASS', `score=${r.data.overallScore}`)
        : log('T10: GET /api/results/{id}', 'FAIL', `HTTP ${r.status}`);
    } catch (e) { log('T10: GET /api/results/{id}', 'FAIL', e.message); }
  }

  // TEST 11: GET /api/history (should now have 1 entry)
  try {
    const r = await request('GET', '/api/history');
    r.status === 200 && r.data.length > 0
      ? log('T11: GET /api/history (post-analysis)', 'PASS', `${r.data.length} entries, first score=${r.data[0]?.score}`)
      : log('T11: GET /api/history (post-analysis)', 'FAIL', `HTTP ${r.status} entries=${r.data?.length}`);
  } catch (e) { log('T11: GET /api/history (post-analysis)', 'FAIL', e.message); }

  // TEST 12: POST /api/credits/topup (valid)
  try {
    const before = (await request('GET', '/api/users/me')).data.creditsRemaining;
    const r = await request('POST', '/api/credits/topup', { json: { amount: 5 } });
    const after = (await request('GET', '/api/users/me')).data.creditsRemaining;
    r.status === 200 && r.data.added === 5 && after === before + 5
      ? log('T12: POST /api/credits/topup', 'PASS', `credits: ${before} → ${after}, response shows ${r.data.creditsRemaining}`)
      : log('T12: POST /api/credits/topup', 'FAIL', `HTTP ${r.status} before=${before} after=${after} added=${r.data.added} responseCredits=${r.data.creditsRemaining}`);
  } catch (e) { log('T12: POST /api/credits/topup', 'FAIL', e.message); }

  // TEST 13: POST /api/auth/google with invalid token (expect 500 or 400)
  try {
    const r = await new Promise((res) => {
      const body = JSON.stringify({ idToken: 'invalid_token_here' });
      const req = http.request(`${BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 10000
      }, (resp) => {
        resp.resume();
        res({ status: resp.statusCode });
      });
      req.on('error', () => res({ status: 0 }));
      req.write(body);
      req.end();
    });
    r.status >= 400
      ? log('T13: Google auth with bad token → 4xx/5xx', 'PASS', `HTTP ${r.status}`)
      : log('T13: Google auth with bad token → 4xx/5xx', 'FAIL', `HTTP ${r.status}`);
  } catch (e) { log('T13: Google auth with bad token → 4xx/5xx', 'FAIL', e.message); }

  // TEST 14: POST /api/auth/google missing token (expect 400)
  try {
    const r = await new Promise((res) => {
      const body = JSON.stringify({});
      const req = http.request(`${BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 5000
      }, (resp) => {
        resp.resume();
        res({ status: resp.statusCode });
      });
      req.on('error', () => res({ status: 0 }));
      req.write(body);
      req.end();
    });
    r.status === 400
      ? log('T14: Google auth missing token → 400', 'PASS')
      : log('T14: Google auth missing token → 400', 'FAIL', `HTTP ${r.status}`);
  } catch (e) { log('T14: Google auth missing token → 400', 'FAIL', e.message); }

  // TEST 15: Actuator health endpoint
  try {
    const r = await new Promise((res) => {
      const req = http.request(`${BASE}/actuator/health`, { method: 'GET', timeout: 5000 }, (resp) => {
        const chunks = [];
        resp.on('data', c => chunks.push(c));
        resp.on('end', () => res({ status: resp.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) }));
      });
      req.on('error', () => res({ status: 0, data: {} }));
      req.end();
    });
    r.status === 200 && r.data.status === 'UP'
      ? log('T15: GET /actuator/health', 'PASS', `status=${r.data.status}`)
      : log('T15: GET /actuator/health', 'FAIL', `HTTP ${r.status}`);
  } catch (e) { log('T15: GET /actuator/health', 'FAIL', e.message); }

  // SUMMARY
  console.log('\n========================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌ ${r.label}: ${r.detail || ''}`));
  }

  return { passed, failed };
}

if (!TOKEN) {
  console.error('ERROR: JWT_TOKEN env var required');
  process.exit(1);
}

runTests().catch(e => { console.error('Fatal:', e); process.exit(1); });
