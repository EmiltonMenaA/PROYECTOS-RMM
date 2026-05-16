const test = require('node:test');
const assert = require('node:assert/strict');

const { retry } = require('./retry');

test('retry returns the first successful result after transient failures', async () => {
  let attempts = 0;

  const result = await retry(
    async () => {
      attempts += 1;

      if (attempts < 3) {
        throw new Error('temporary failure');
      }

      return 'ok';
    },
    3,
    0
  );

  assert.equal(result, 'ok');
  assert.equal(attempts, 3);
});

test('retry throws the last error when all attempts fail', async () => {
  let attempts = 0;

  await assert.rejects(
    retry(
      async () => {
        attempts += 1;
        throw new Error(`failure ${attempts}`);
      },
      2,
      0
    ),
    /failure 2/
  );

  assert.equal(attempts, 2);
});
