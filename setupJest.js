require('jest-fetch-mock').enableMocks()

process.on('unhandledRejection', (err) => {
  fail(err);
});