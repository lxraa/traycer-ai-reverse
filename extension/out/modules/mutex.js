'use strict';

/**
 * Mutex and Semaphore - 异步互斥锁和信号量实现
 * 
 * 用于控制对共享资源的并发访问。
 */

// 取消锁请求时使用的默认错误
const LOCK_CANCELED_ERROR = new Error("request for lock canceled");

/**
 * 辅助函数：在数组中按优先级插入元素
 */
function insertByPriority(array, item) {
  const index = findInsertIndex(array, element => item.priority <= element.priority);
  array.splice(index + 1, 0, item);
}

/**
 * 辅助函数：查找插入位置
 */
function findInsertIndex(array, predicate) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      return i;
    }
  }
  return -1;
}

/**
 * 异步辅助函数 - 用于 runExclusive (R9e)
 */
function asyncHelper(thisArg, args, PromiseConstructor, generator) {
  function adopt(value) {
    return value instanceof PromiseConstructor 
      ? value 
      : new PromiseConstructor(function (resolve) { resolve(value); });
  }
  
  return new (PromiseConstructor || (PromiseConstructor = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (error) {
        reject(error);
      }
    }
    
    function rejected(value) {
      try {
        step(generator.throw(value));
      } catch (error) {
        reject(error);
      }
    }
    
    function step(result) {
      result.done 
        ? resolve(result.value) 
        : adopt(result.value).then(fulfilled, rejected);
    }
    
    step((generator = generator.apply(thisArg, args || [])).next());
  });
}

/**
 * 异步辅助函数 - 用于 Mutex.acquire (x9e)
 */
function asyncHelperX(thisArg, args, PromiseConstructor, generator) {
  function adopt(value) {
    return value instanceof PromiseConstructor 
      ? value 
      : new PromiseConstructor(function (resolve) { resolve(value); });
  }
  
  return new (PromiseConstructor || (PromiseConstructor = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (error) {
        reject(error);
      }
    }
    
    function rejected(value) {
      try {
        step(generator.throw(value));
      } catch (error) {
        reject(error);
      }
    }
    
    function step(result) {
      result.done 
        ? resolve(result.value) 
        : adopt(result.value).then(fulfilled, rejected);
    }
    
    step((generator = generator.apply(thisArg, args || [])).next());
  });
}

/**
 * Semaphore - 信号量
 * 
 * 允许最多 N 个并发操作访问资源。
 */
class Semaphore {
  constructor(maxValue, cancelError = LOCK_CANCELED_ERROR) {
    this._value = maxValue;
    this._cancelError = cancelError;
    this._queue = [];
    this._weightedWaiters = [];
  }

  /**
   * 获取信号量，可以指定权重和优先级
   * @param {number} weight - 权重（默认 1）
   * @param {number} priority - 优先级（默认 0）
   * @returns {Promise<[number, Function]>} 返回 [当前值, 释放函数]
   */
  acquire(weight = 1, priority = 0) {
    if (weight <= 0) {
      throw new Error("invalid weight " + weight + ": must be positive");
    }
    
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve,
        reject,
        weight,
        priority
      };
      
      const insertIndex = findInsertIndex(this._queue, item => priority <= item.priority);
      
      if (insertIndex === -1 && weight <= this._value) {
        // 可以立即获取
        this._dispatchItem(waiter);
      } else {
        // 加入队列
        this._queue.splice(insertIndex + 1, 0, waiter);
      }
    });
  }

  /**
   * 运行独占代码块
   * @param {Function} callback - 要执行的回调
   * @param {number} weight - 权重
   * @param {number} priority - 优先级
   */
  runExclusive(callback, weight = 1, priority = 0) {
    return asyncHelper(this, arguments, void 0, function* (fn, w, p) {
      const [value, release] = yield this.acquire(w, p);
      try {
        return yield fn(value);
      } finally {
        release();
      }
    });
  }

  /**
   * 等待直到可以获取指定权重的锁
   * @param {number} weight - 权重
   * @param {number} priority - 优先级
   */
  waitForUnlock(weight = 1, priority = 0) {
    if (weight <= 0) {
      throw new Error("invalid weight " + weight + ': must be positive');
    }
    
    if (this._couldLockImmediately(weight, priority)) {
      return Promise.resolve();
    }
    
    return new Promise(resolve => {
      if (!this._weightedWaiters[weight - 1]) {
        this._weightedWaiters[weight - 1] = [];
      }
      insertByPriority(this._weightedWaiters[weight - 1], { resolve, priority });
    });
  }

  /**
   * 检查是否已锁定
   */
  isLocked() {
    return this._value <= 0;
  }

  /**
   * 获取当前值
   */
  getValue() {
    return this._value;
  }

  /**
   * 设置值
   */
  setValue(value) {
    this._value = value;
    this._dispatchQueue();
  }

  /**
   * 释放指定权重
   * @param {number} weight - 要释放的权重
   */
  release(weight = 1) {
    if (weight <= 0) {
      throw new Error("invalid weight " + weight + ': must be positive');
    }
    this._value += weight;
    this._dispatchQueue();
  }

  /**
   * 取消所有等待的请求
   */
  cancel() {
    this._queue.forEach(waiter => waiter.reject(this._cancelError));
    this._queue = [];
  }

  /**
   * 分发队列中的等待者
   * @private
   */
  _dispatchQueue() {
    this._drainUnlockWaiters();
    while (this._queue.length > 0 && this._queue[0].weight <= this._value) {
      this._dispatchItem(this._queue.shift());
      this._drainUnlockWaiters();
    }
  }

  /**
   * 分发单个等待者
   * @private
   */
  _dispatchItem(waiter) {
    const currentValue = this._value;
    this._value -= waiter.weight;
    waiter.resolve([currentValue, this._newReleaser(waiter.weight)]);
  }

  /**
   * 创建新的释放函数
   * @private
   */
  _newReleaser(weight) {
    let released = false;
    return () => {
      if (!released) {
        released = true;
        this.release(weight);
      }
    };
  }

  /**
   * 清空等待解锁的等待者
   * @private
   */
  _drainUnlockWaiters() {
    if (this._queue.length === 0) {
      // 队列为空，唤醒所有可能的等待者
      for (let weight = this._value; weight > 0; weight--) {
        const waiters = this._weightedWaiters[weight - 1];
        if (waiters) {
          waiters.forEach(waiter => waiter.resolve());
          this._weightedWaiters[weight - 1] = [];
        }
      }
    } else {
      // 队列不为空，根据优先级唤醒等待者
      const highestPriority = this._queue[0].priority;
      for (let weight = this._value; weight > 0; weight--) {
        const waiters = this._weightedWaiters[weight - 1];
        if (!waiters) continue;
        
        const cutoffIndex = waiters.findIndex(w => w.priority <= highestPriority);
        const toResolve = cutoffIndex === -1 ? waiters : waiters.splice(0, cutoffIndex);
        toResolve.forEach(waiter => waiter.resolve());
      }
    }
  }

  /**
   * 检查是否可以立即获取锁
   * @private
   */
  _couldLockImmediately(weight, priority) {
    return (
      (this._queue.length === 0 || this._queue[0].priority < priority) &&
      weight <= this._value
    );
  }
}

/**
 * Mutex - 互斥锁
 * 
 * 基于 Semaphore 实现的互斥锁，确保同一时间只有一个操作可以访问资源。
 */
class Mutex {
  constructor(cancelError) {
    this._semaphore = new Semaphore(1, cancelError);
  }

  /**
   * 获取互斥锁
   * @param {number} priority - 优先级（默认 0）
   * @returns {Promise<Function>} 返回释放函数
   */
  acquire(priority = 0) {
    return asyncHelperX(this, arguments, void 0, function* (p = 0) {
      const [, release] = yield this._semaphore.acquire(1, p);
      return release;
    });
  }

  /**
   * 运行独占代码块
   * @param {Function} callback - 要执行的回调
   * @param {number} priority - 优先级
   */
  runExclusive(callback, priority = 0) {
    return this._semaphore.runExclusive(() => callback(), 1, priority);
  }

  /**
   * 检查是否已锁定
   */
  isLocked() {
    return this._semaphore.isLocked();
  }

  /**
   * 等待解锁
   * @param {number} priority - 优先级
   */
  waitForUnlock(priority = 0) {
    return this._semaphore.waitForUnlock(1, priority);
  }

  /**
   * 释放锁
   */
  release() {
    if (this._semaphore.isLocked()) {
      this._semaphore.release();
    }
  }

  /**
   * 取消所有等待的请求
   */
  cancel() {
    return this._semaphore.cancel();
  }
}

// CommonJS 导出
module.exports = {
  Semaphore,
  Mutex,
  LOCK_CANCELED_ERROR
};

