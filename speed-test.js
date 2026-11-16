import { performance } from 'node:perf_hooks';

const REQUEST_COUNT = 10;
const REQUEST_TIMEOUT_MS = 30_000;

export async function measureSpeed(url, onProgress = () => { }) {
  let totalBytes = 0;
  let totalTimeMs = 0;

  for (let i = 1; i <= REQUEST_COUNT; i++) {
    const start = performance.now();
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), //прерываем запрос, если он занимает слишком много времени
      headers: { 'Accept-Encoding': 'identity' }, //не сжимаем данные при передаче, чтобы измерить реальную скорость
    });

    if (!response.ok) {
      await response.body?.cancel(); //отменяем чтение тела ответа, если статус не ок
      throw new Error(`Request ${i}: HTTP ${response.status}`);
    }

    let downloadedBytes = 0;
    if (!response.body) {
      throw new Error(`Request ${i}: Response body is missing`);
    }

    for await (const chunk of response.body) {
      downloadedBytes += chunk.byteLength;
    }

    const timeMs = performance.now() - start;
    totalBytes += downloadedBytes;
    totalTimeMs += timeMs;
    onProgress({ request: i, downloadedBytes, timeMs });
  }

  return {
    requests: REQUEST_COUNT,
    averageTimeMs: totalTimeMs / REQUEST_COUNT,
    totalBytes,
    speedMbps: (totalBytes * 8) / (totalTimeMs / 1000) / 1_000_000,
  };
}
