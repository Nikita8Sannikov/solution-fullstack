import { measureSpeed } from './speed-test.js';

const input = process.argv[2];
let url;

try {
  url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS are supported');
  }
} catch {
  console.error('Usage: node index.mjs "https://example.com/large-file.jpg"');
  process.exit(1);
}

try {
  const result = await measureSpeed(url, ({ request, downloadedBytes, timeMs }) => {
    console.log(`${request}/10: ${downloadedBytes} bytes, ${timeMs.toFixed(1)} ms`);
  });

  console.log(`\nAverage request time: ${result.averageTimeMs.toFixed(1)} ms`);
  console.log(`Total downloaded: ${(result.totalBytes / 1_000_000).toFixed(2)} MB (${result.totalBytes} bytes)`);
  console.log(`Average download speed: ${result.speedMbps.toFixed(2)} Mbps`);
} catch (error) {
  console.error(`Measurement failed: ${error.message}`);
  process.exitCode = 1;
}
