'use strict';

// 导入依赖
const p_retry_module = require("p-retry");
const { Logger } = require("./logger.js");

/**
 * 计算重试延迟时间
 * @param {number} maxSeconds - 最大延迟秒数
 * @param {number} attemptNumber - 尝试次数
 * @returns {{retryAfter: number}} 延迟时间对象
 */
function calculateRetryDelay(maxSeconds, attemptNumber) {
  let exponentialDelay = Math.pow(2, attemptNumber) * 1000;
  let jitterPercent = getRandomInt(50, 100);
  return {
    retryAfter: Math.min(exponentialDelay, maxSeconds * 1000) * (jitterPercent / 100)
  };
}

/**
 * 获取随机整数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机整数
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==================== 错误类 ====================

/**
 * 服务器断开连接错误
 */
class ServerDisconnectedError extends Error {
  constructor() {
    super('Server disconnected');
    this.name = "ServerDisconnectedError";
  }
}

/**
 * 未授权访问错误
 */
class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * 网络错误
 */
class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * 用户取消操作错误
 */
class UserCancelledError extends Error {
  constructor(message = "User cancelled the operation") {
    super(message);
    this.name = 'UserCancelledError';
  }
}

// ==================== 重试执行器 ====================

/**
 * 重试执行器类 - 提供带重试机制的操作执行
 */
class RetryExecutor {
  static DEFAULT_RETRIES = 4;

  /**
   * 执行带重试的操作
   * @param {Function} operation - 要执行的操作
   * @param {Object} options - 选项
   * @param {Function} options.shouldRetry - 判断是否应该重试的函数
   * @param {AbortSignal} options.signal - 中止信号
   * @param {number} options.retries - 重试次数
   */
  static async executeWithRetry(operation, options) {
    let { shouldRetry, signal } = options;
    
    if (signal?.aborted) {
      throw new UserCancelledError();
    }
    
    return await p_retry_module.default(operation, {
      retries: options.retries,
      signal: signal,
      onFailedAttempt: (error) => {
        if (!shouldRetry(error)) {
          throw error;
        }
        
        let retryDelay = calculateRetryDelay(10, error.attemptNumber);
        Logger.warn(
          `Failed attempt ${error.attemptNumber} due to error: ${error.message}, retrying in ${retryDelay.retryAfter}ms.`
        );
        
        return new Promise(resolve => setTimeout(resolve, retryDelay.retryAfter));
      }
    });
  }

  /**
   * 执行 Token 验证操作（带重试）
   */
  static async executeTokenValidation(operation, signal) {
    return this.executeWithRetry(operation, {
      retries: RetryExecutor.DEFAULT_RETRIES,
      shouldRetry: this.shouldRetryTokenOperation,
      signal: signal
    });
  }

  /**
   * 判断 Token 操作是否应该重试
   */
  static shouldRetryTokenOperation(error) {
    return !(error instanceof UnauthorizedError || error instanceof UserCancelledError);
  }
}

// 导出
module.exports = {
  // 工具函数
  calculateRetryDelay,
  
  // 错误类
  ServerDisconnectedError,
  UnauthorizedError,
  NetworkError,
  UserCancelledError,
  
  // 核心类
  RetryExecutor
};


