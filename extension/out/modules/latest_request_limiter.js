'use strict';

// 导入依赖
const { RequestQueue } = require("./request_queue.js");
const { Logger } = require("./logger.js");

/**
 * LatestRequestLimiter - 最新请求限制器
 * 
 * 继承自 RequestQueue，用于限制同时只处理最新的请求。
 * 当有新请求到来时，会自动取消之前的请求。
 */
class LatestRequestLimiter extends RequestQueue {
  constructor() {
    super(1, 1000, 30000);
    this.currentRequest = null;
    this.abortController = null;
  }

  /**
   * 将请求加入队列
   * @param {Function} requestFn - 请求处理函数
   * @returns {Promise} 请求的 Promise
   */
  enqueueRequest(requestFn) {
    Logger.debug("LatestRequestLimiter: New request received");
    
    // 如果有正在处理的请求，取消它
    if (this.abortController) {
      Logger.debug("LatestRequestLimiter: Cancelling previous request");
      this.abortController.abort();
      this.abortController = null;
    }
    
    // 创建新的 AbortController
    this.abortController = new AbortController();
    
    const wrappedRequest = async () => {
      try {
        const signal = this.abortController.signal;
        
        // 创建一个会在请求被取消时 reject 的 Promise
        const cancelPromise = new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => {
            reject(new Error('Request cancelled'));
          });
        });
        
        // 竞态：要么请求完成，要么被取消
        const result = await Promise.race([
          requestFn(this.abortController),
          cancelPromise
        ]);
        
        Logger.debug('LatestRequestLimiter: Request completed successfully');
        return result;
      } catch (error) {
        // 区分取消和其他错误
        if (error instanceof Error && error.message === 'Request cancelled') {
          Logger.debug('LatestRequestLimiter: Request was cancelled');
        } else {
          Logger.warn('LatestRequestLimiter: Request failed', error);
        }
        throw error;
      }
    };
    
    // 调用父类的 enqueueRequest
    this.currentRequest = super.enqueueRequest(wrappedRequest);
    return this.currentRequest;
  }
}

// CommonJS 导出
module.exports = {
  LatestRequestLimiter
};

