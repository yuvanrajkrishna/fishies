const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Load the real route handlers, using the project's existing TypeScript dependency.
const root = path.resolve(__dirname, '..');
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const module = {exports: {}};
  modules.set(file, module);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText;
  const localRequire = name => name.startsWith('@/') ? load(path.join(root, name.slice(2) + '.ts')) : require(name);
  vm.runInThisContext(`(function(require,module,exports){${output}\n})`, {filename: file})(localRequire, module, module.exports);
  return module.exports;
}
const routes = Object.fromEntries(['discover', 'inspect', 'recipes'].map(name => [name, load(path.join(root, 'app/api', name, 'route.ts')).POST]));
const {signedUrl, verifyToken} = load(path.join(root, 'lib/tinyfish.ts'));
const keyA = 'visitor-a-test-key-0000000000000000';
const keyB = 'visitor-b-test-key-1111111111111111';
const ownerKey = 'owner-sentinel-MUST-NEVER-BE-USED';
const originalFetch = global.fetch;
const originalEnv = process.env.TINYFISH_API_KEY;
const calls = [];
let requestNumber = 0;
function request(route, key, extra = {}) {
  const headers = {'Content-Type': 'application/json', 'X-Forwarded-For': `test-${++requestNumber}`};
  if (key !== undefined) headers['X-TinyFish-Key'] = key;
  return new Request(`https://fishies.example/api/${route}`, {method: 'POST', headers, body: JSON.stringify({species: 'salmon', route: 'eat', location: 'London', country: 'GB', ...extra})});
}

async function main() {
  process.env.TINYFISH_API_KEY = ownerKey;
  global.fetch = async (url, options) => {
    const credential = new Headers(options.headers).get('X-API-Key');
    assert.ok([keyA, keyB].includes(credential), 'Only a visitor credential can reach upstream');
    assert.equal(String(url).includes(credential), false, 'Credential must not be in a URL');
    assert.equal((options.body || '').includes(credential), false, 'Credential must not be in request content');
    calls.push({url: String(url), key: credential});
    if (String(url).startsWith('https://api.search.tinyfish.ai')) return Response.json({results: [{title: 'Sample menu', url: 'https://venue.example/menu', snippet: 'Atlantic salmon is on the menu.'}]});
    if (String(url) === 'https://api.fetch.tinyfish.ai') return Response.json({results: [{url: 'https://venue.example/menu', text: 'Atlantic salmon (Salmo salar) is named on this menu.'}]});
    if (String(url).startsWith('https://agent.tinyfish.ai/')) return new Response('data: {"type":"COMPLETE","status":"COMPLETED","result":{"venue":"Test venue"}}\n\n', {headers: {'Content-Type': 'text/event-stream'}});
    throw new Error('Unexpected upstream URL');
  };

  for (const [name, handler] of Object.entries(routes)) {
    for (const key of [undefined, '', 'short', 'invalid key with spaces']) {
      calls.length = 0;
      const response = await handler(request(name, key));
      assert.equal(response.status, 401, `${name} rejects absent or malformed credentials`);
      assert.equal(calls.length, 0, `${name} must not fall back to environment credentials`);
      assert.equal((await response.text()).includes(ownerKey), false);
    }
  }
  console.log('PASS: all three routes reject missing or malformed keys without upstream calls, even with an owner key in the environment.');

  calls.length = 0;
  const responses = await Promise.all([routes.discover(request('discover', keyA)), routes.discover(request('discover', keyB))]);
  assert.ok(responses.every(r => r.status === 200));
  const [discoveryA, discoveryB] = await Promise.all(responses.map(r => r.json()));
  assert.deepEqual(calls.filter(c => c.key === keyA).map(c => new URL(c.url).hostname).sort(), ['api.fetch.tinyfish.ai', 'api.search.tinyfish.ai']);
  assert.deepEqual(calls.filter(c => c.key === keyB).map(c => new URL(c.url).hostname).sort(), ['api.fetch.tinyfish.ai', 'api.search.tinyfish.ai']);
  assert.equal(verifyToken(discoveryA.results[0].token, keyA), 'https://venue.example/menu');
  assert.equal(verifyToken(discoveryB.results[0].token, keyB), 'https://venue.example/menu');
  for (const key of [ownerKey, keyA, keyB]) assert.equal(JSON.stringify([discoveryA, discoveryB]).includes(key), false);
  assert.throws(() => verifyToken(discoveryA.results[0].token, keyB));
  console.log('PASS: simultaneous Search + Fetch calls keep visitor credentials isolated and never expose them in results.');

  calls.length = 0;
  const mismatch = await routes.inspect(request('inspect', keyB, {token: discoveryA.results[0].token}));
  assert.notEqual(mismatch.status, 200);
  assert.equal(calls.length, 0);
  const inspected = await routes.inspect(request('inspect', keyA, {token: discoveryA.results[0].token}));
  assert.equal(inspected.status, 200);
  assert.equal(calls[0].key, keyA);
  assert.ok((await inspected.text()).includes('COMPLETED'));
  console.log('PASS: Agent rejects a result from a different key and forwards only the matching visitor key.');

  calls.length = 0;
  const recipe = await routes.recipes(request('recipes', keyB));
  assert.equal(recipe.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].key, keyB);
  console.log('PASS: recipe search uses the visitor key.');

  const token = signedUrl('https://venue.example/menu', keyA);
  assert.throws(() => verifyToken(token + '0', keyA));
  console.log('PASS: changed tokens are rejected.');
}
main().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {
  global.fetch = originalFetch;
  if (originalEnv === undefined) delete process.env.TINYFISH_API_KEY;
  else process.env.TINYFISH_API_KEY = originalEnv;
});
