'use strict';

// 导入依赖
const workerpool_module = require("workerpool");
var { __esmModule } = require('./shared-env.js');

// WorkerPoolError 类
class WorkerPoolError extends Error {
  ["code"];
  ['workerType'];
  ["originalError"];
  constructor(_0x3bc3a4, _0x4c729b = 'WORKER_POOL_ERROR', _0x21686e, _0x4bb4b) {
    super(_0x3bc3a4), this.name = 'WorkerPoolError', this.code = _0x4c729b, this.workerType = _0x21686e, this.originalError = _0x4bb4b;
  }
}

// WorkerPoolManager 基类
class ex {
      ['pools'] = new Map();
      ['options'];
      ["logger"];
      constructor(_0x2bfe0a) {
        this.options = _0x2bfe0a, this.logger = _0x2bfe0a.logger;
      }
      ['isValidWorkerType'](_0xd5948a) {
        return this.getSupportedWorkerTypes().includes(_0xd5948a);
      }
      async ["initWorkerPool"]() {
        try {
          this.logger?.['trace']('Initializing\x20worker\x20pools...');
          let _0x2c7f77 = this.getSupportedWorkerTypes();
          for (let key of _0x2c7f77) {
            if (!this.isValidWorkerType(key)) throw new WorkerPoolError('Invalid\x20worker\x20type:\x20' + String(key), 'INVALID_WORKER_TYPE', String(key));
            this.options.minWorkers > 0 && this.getOrCreatePool(key);
          }
          this.logger?.["trace"]('Worker\x20pools\x20initialized\x20successfully\x20for\x20' + _0x2c7f77.length + " worker types");
        } catch (_0x307423) {
          throw this.logger?.['error'](_0x307423, 'Failed\x20to\x20initialize\x20worker\x20pools'), new WorkerPoolError("Failed to initialize worker pools: " + (_0x307423 instanceof Error ? _0x307423.message : String(_0x307423)), 'INITIALIZATION_FAILED', void 0, _0x307423 instanceof Error ? _0x307423 : void 0);
        }
      }
      async ["exec"](_0x1e0425, _0x543e19, _0x2b1ad6 = []) {
        if (!this.isValidWorkerType(_0x1e0425)) throw new WorkerPoolError("Invalid worker type: " + String(_0x1e0425), 'INVALID_WORKER_TYPE', String(_0x1e0425));
        return await this.getOrCreatePool(_0x1e0425).exec(_0x543e19, _0x2b1ad6);
      }
      ['getOrCreatePool'](_0x53667a) {
        if (!this.isValidWorkerType(_0x53667a)) throw new WorkerPoolError("Invalid worker type: " + String(_0x53667a), 'INVALID_WORKER_TYPE', String(_0x53667a));
        let _0x25a9f7 = this.pools.get(_0x53667a);
        if (!_0x25a9f7) {
          let _0xc88527 = this.getWorkerPath(_0x53667a);
          _0x25a9f7 = workerpool_module.pool(_0xc88527, {
            minWorkers: this.options.minWorkers,
            maxWorkers: this.options.maxWorkers,
            workerType: this.options.workerType
          }), this.pools.set(_0x53667a, _0x25a9f7), this.logger?.['trace']("Created worker pool for " + String(_0x53667a));
        }
        return _0x25a9f7;
      }
      async ['cleanup']() {
        try {
          this.logger?.["info"]('Starting\x20worker\x20pool\x20cleanup...');
          let _0x557bc3 = Array.from(this.pools.entries()).map(([_0x42284a, _0x30b6bf]) => _0x30b6bf.terminate().then(() => {
            this.logger?.['info']("Worker pool for " + String(_0x42284a) + " terminated successfully");
          }, _0x2fc720 => {
            this.logger?.['error'](_0x2fc720, "Error terminating worker pool for " + String(_0x42284a));
          }));
          await Promise.all(_0x557bc3), this.pools.clear(), this.logger?.['info']("All worker pools terminated successfully");
        } catch (_0x2b308c) {
          throw this.logger?.["error"](_0x2b308c, "Failed to cleanup worker pools"), new WorkerPoolError('Failed\x20to\x20cleanup\x20worker\x20pools:\x20' + (_0x2b308c instanceof Error ? _0x2b308c.message : String(_0x2b308c)), 'CLEANUP_FAILED', void 0, _0x2b308c instanceof Error ? _0x2b308c : void 0);
        }
      }
    };

// 导出
module.exports = {  
  ex
};

