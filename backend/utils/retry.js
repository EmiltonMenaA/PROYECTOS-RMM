async function retry(fn, attempts = 3, delayMs = 500) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const backoff = delayMs * Math.pow(2, i);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

module.exports = { retry };
