'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.stopWorker = exports.runTest = exports.submitFileResult = exports.submitTestResult = exports.submitAssertionResult = void 0;

var _types = require('@fault/types');

var _util = require('util');

const promiseSend =
  process.send !== undefined
    ? (0, _util.promisify)(process.send.bind(process))
    : undefined;

const submitAssertionResult = data => {
  const result = { ...data, type: _types.IPC.ASSERTION };
  return promiseSend(result);
};

exports.submitAssertionResult = submitAssertionResult;

const submitTestResult = async data => {
  const result = { ...data, type: _types.IPC.TEST };
  return await promiseSend(result);
};

exports.submitTestResult = submitTestResult;

const submitFileResult = data => {
  const result = { ...data, type: _types.IPC.FILE_FINISHED };
  return promiseSend(result);
};

exports.submitFileResult = submitFileResult;

const promiseWorkerSend = (worker, data) => {
  return new Promise((resolve, reject) => {
    worker.send(data, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const runTest = (worker, data) => {
  const result = {
    type: _types.IPC.RUN_TEST,
    ...data,
  };
  return promiseWorkerSend(worker, result);
};

exports.runTest = runTest;

const stopWorker = (worker, data) => {
  const result = {
    type: _types.IPC.STOP_WORKER,
    ...data,
  };
  return promiseWorkerSend(worker, result);
};

exports.stopWorker = stopWorker;
//# sourceMappingURL=index.js.map
