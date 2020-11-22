module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  "automock": false,
    "setupFiles": [
      "./setupJest.js"
    ],
    "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$"
};