import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { measureSpeed } from './speed-test.js';

test('downloads 10 responses fully and sequentially', async () => {
  const payload = Buffer.alloc(1024, 'x');
  let receivedRequests = 0;
  let activeRequests = 0;
  let maxActiveRequests = 0;

  const server = createServer(async (_req, res) => {
    receivedRequests++;
    activeRequests++;
    maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
    res.on('finish', () => activeRequests--);

    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
    res.write(payload.subarray(0, 512));
    await new Promise((resolve) => setTimeout(resolve, 10));
    res.end(payload.subarray(512));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const { port } = server.address();
    const result = await measureSpeed(`http://127.0.0.1:${port}/file`);

    assert.equal(receivedRequests, 10);
    assert.equal(maxActiveRequests, 1);
    assert.equal(result.requests, 10);
    assert.equal(result.totalBytes, 10 * payload.length);
    assert.ok(result.averageTimeMs > 0);
    assert.ok(Number.isFinite(result.speedMbps));
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
