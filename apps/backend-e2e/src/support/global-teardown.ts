import { killPort } from '@nx/node/utils.js';
/* eslint-disable */

module.exports = async function () {
  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Hint: `globalThis` is shared between setup and teardown.
  if (process.env.SKIP_TEARDOWN) {
    console.log('\nSkipping teardown (SKIP_TEARDOWN is set)\n');
    return;
  }
  const port = process.env.PORT ? Number(process.env.PORT) : 3003;
  await killPort(port);
  console.log(globalThis.__TEARDOWN_MESSAGE__);
};
