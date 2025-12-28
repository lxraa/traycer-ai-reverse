'use strict';

const { Logger } = require("./logger.js");

/**
 * RequestQueue - 请求队列管理类
 * 用于控制并发请求数量和请求频率
 */
class RequestQueue {
  constructor(concurrencyLimit, breatherDuration, continuousRequestDuration) {
    this.concurrencyLimit = concurrencyLimit;
    this.breatherDuration = breatherDuration;
    this.continuousRequestDuration = continuousRequestDuration;
    this.inFlightRequests = 0;
    this.requestQueue = [];
    this.continuousRequestStart = Date.now();
    this.isBreatherActive = false;
  }

  /**
   * 将请求加入队列
   * @param {Function} requestFunc - 要执行的异步请求函数
   * @returns {Promise} 请求结果的 Promise
   */
  enqueueRequest(requestFunc) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          let result = await requestFunc();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.inFlightRequests--;
          this.processQueue();
        }
      });
      this.processQueue();
    });
  }

  /**
   * 处理队列中的请求
   * 控制并发数量和请求频率
   */
  processQueue() {
    // 如果正在休息中，等待所有请求完成后重置
    if (this.isBreatherActive) {
      if (this.inFlightRequests === 0) {
        this.continuousRequestStart = Date.now();
        this.isBreatherActive = false;
      } else {
        return;
      }
    }

    // 检查是否需要给 VS Code 一个休息时间
    if (Date.now() - this.continuousRequestStart >= this.continuousRequestDuration) {
      Logger.debug('Give VS Code a breather before scheduling more requests');
      this.isBreatherActive = true;
      setTimeout(() => {
        this.processQueue();
      }, this.breatherDuration);
      return;
    }

    // 处理队列中的请求，直到达到并发限制
    while (this.inFlightRequests < this.concurrencyLimit && this.requestQueue.length > 0) {
      let nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        this.inFlightRequests++;
        nextRequest();
      }
    }
  }
}

module.exports = {
  RequestQueue
};

