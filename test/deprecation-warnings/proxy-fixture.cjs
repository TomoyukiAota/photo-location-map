// Keep global-agent's process-wide HTTP patches isolated from the test runner.
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');

async function main() {
  const originalRequest = http.request;
  const upstreamAgent = new http.Agent();
  let proxyRequests = 0;
  const target = http.createServer((request, response) => response.end('fixture response'));
  const proxy = http.createServer((request, response) => {
    proxyRequests++;
    const upstream = originalRequest(new URL(request.url), { agent: upstreamAgent }, (incoming) => incoming.pipe(response));
    upstream.on('error', (error) => response.destroy(error));
    request.pipe(upstream);
  });
  try {
    target.listen(0, '127.0.0.1');
    proxy.listen(0, '127.0.0.1');
    await Promise.all([once(target, 'listening'), once(proxy, 'listening')]);
    const targetUrl = `http://127.0.0.1:${target.address().port}/fixture`;
    process.env.GLOBAL_AGENT_HTTP_PROXY = `http://127.0.0.1:${proxy.address().port}`;
    process.env.ELECTRON_GET_USE_PROXY = 'true';
    require(process.argv[2]).initializeProxy();
    assert.ok(global.GLOBAL_AGENT, 'download proxy bootstrap must initialize the agent');

    const get = () => new Promise((resolve, reject) => {
      http.get(targetUrl, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => resolve(body));
        response.on('error', reject);
      }).on('error', reject);
    });
    assert.equal(await get(), 'fixture response');
    assert.equal(proxyRequests, 1);
    global.GLOBAL_AGENT.NO_PROXY = '127.0.0.1';
    assert.equal(await get(), 'fixture response');
    assert.equal(proxyRequests, 1, 'NO_PROXY requests must bypass the proxy');
  } finally {
    upstreamAgent.destroy();
    target.closeAllConnections();
    proxy.closeAllConnections();
    await Promise.all([
      new Promise((resolve) => target.close(resolve)),
      new Promise((resolve) => proxy.close(resolve))
    ]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
