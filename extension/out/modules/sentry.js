var SENTRY_DEBUG = typeof __SENTRY_DEBUG__ > 'u' || __SENTRY_DEBUG__;
var SENTRY_VERSION = "10.30.0";

function getSentryCarrier(carrier) {
  let sentryGlobal = carrier.__SENTRY__ = carrier.__SENTRY__ || {};
  return sentryGlobal.version = sentryGlobal.version || SENTRY_VERSION, sentryGlobal[SENTRY_VERSION] = sentryGlobal[SENTRY_VERSION] || {};
}
function getOrCreateGlobalSingleton(key, factory, globalObj = __globalThis) {
  let sentryGlobal = globalObj.__SENTRY__ = globalObj.__SENTRY__ || {},
    versionedCarrier = sentryGlobal[SENTRY_VERSION] = sentryGlobal[SENTRY_VERSION] || {};
  return versionedCarrier[key] || (versionedCarrier[key] = factory());
}
function consoleSandbox(callback) {
  if (!('console' in __globalThis)) return callback();
  let consoleObj = __globalThis.console,
    backup = {},
    keys = Object.keys(originalConsoleMethods);
  keys.forEach(key => {
    let wrappedMethod = originalConsoleMethods[key];
    backup[key] = consoleObj[key], consoleObj[key] = wrappedMethod;
  });
  try {
    return callback();
  } finally {
    keys.forEach(key => {
      consoleObj[key] = backup[key];
    });
  }
}
function enableLogger() {
  getLoggerSettings().enabled = true;
}
function disableLogger() {
  getLoggerSettings().enabled = false;
}
function isLoggerEnabled() {
  return getLoggerSettings().enabled;
}
function logInfo(...args) {
  sentryLog("log", ...args);
}
function logWarn(...args) {
  sentryLog("warn", ...args);
}
function logError(...args) {
  sentryLog("error", ...args);
}
function sentryLog(level, ...args) {
  SENTRY_DEBUG && isLoggerEnabled() && consoleSandbox(() => {
    __globalThis.console[level]('Sentry\x20Logger\x20' + '[' + level + ']:', ...args);
  });
}
function getLoggerSettings() {
  return SENTRY_DEBUG ? getOrCreateGlobalSingleton('loggerSettings', () => ({
    enabled: false
  })) : {
    enabled: false
  };
}
var originalConsoleMethods = {},
  logger = {
    enable: enableLogger,
    disable: disableLogger,
    isEnabled: isLoggerEnabled,
    log: logInfo,
    warn: logWarn,
    error: logError
  };
function getFunctionName(_0x5e67d9) {
  try {
    return !_0x5e67d9 || typeof _0x5e67d9 != "function" ? "<anonymous>" : _0x5e67d9.name || "<anonymous>";
  } catch {
    return "<anonymous>";
  }
}
function getVueNodeType(_0x378561) {
  return "__v_isVNode" in _0x378561 && _0x378561.__v_isVNode ? '[VueVNode]' : "[VueViewModel]";
}

function getErrorType(_0x1efecb) {
  switch (Object.prototype.toString.call(_0x1efecb)) {
    case "[object Error]":
    case "[object Exception]":
    case "[object DOMException]":
    case '[object\x20WebAssembly.Exception]':
      return true;
    default:
      return safeInstanceOf(_0x1efecb, Error);
  }
}
function isObjectType(_0x117468, _0xea0583) {
  return Object.prototype.toString.call(_0x117468) === "[object " + _0xea0583 + ']';
}
function isString(_0x534b1a) {
  return isObjectType(_0x534b1a, "String");
}
function isPlainObject(_0x50eea6) {
  return isObjectType(_0x50eea6, 'Object');
}
function isDomEvent(_0x4d0536) {
  return typeof Event < 'u' && safeInstanceOf(_0x4d0536, Event);
}
function isDomElement(_0x1a904e) {
  return typeof Element < 'u' && safeInstanceOf(_0x1a904e, Element);
}
function isThenable(_0x10a599) {
  return !!(_0x10a599?.["then"] && typeof _0x10a599.then == "function");
}
function isSyntheticEvent(_0x11cdb0) {
  return isPlainObject(_0x11cdb0) && 'nativeEvent' in _0x11cdb0 && "preventDefault" in _0x11cdb0 && "stopPropagation" in _0x11cdb0;
}
function safeInstanceOf(_0x160087, _0x195195) {
  try {
    return _0x160087 instanceof _0x195195;
  } catch {
    return false;
  }
}
function isVueInstance(_0x2293cc) {
  return !!(typeof _0x2293cc == "object" && _0x2293cc !== null && (_0x2293cc.__isVue || _0x2293cc._isVue || _0x2293cc.__v_isVNode));
}
function buildDomPath(_0x509178, _0x7472c3 = {}) {
  if (!_0x509178) return "<unknown>";
  try {
    let _0x3731a6 = _0x509178,
      _0x54c133 = 5,
      _0x1924f3 = [],
      _0x523f5a = 0,
      _0x4832c3 = 0,
      _0x121251 = '\x20>\x20',
      _0x1b4298 = '\x20>\x20'.length,
      _0x22663c,
      _0x25ec69 = Array.isArray(_0x7472c3) ? _0x7472c3 : _0x7472c3.keyAttrs,
      _0x70e294 = !Array.isArray(_0x7472c3) && _0x7472c3.maxStringLength || 80;
    for (; _0x3731a6 && _0x523f5a++ < 5 && (_0x22663c = buildDomSelector(_0x3731a6, _0x25ec69), !(_0x22663c === 'html' || _0x523f5a > 1 && _0x4832c3 + _0x1924f3.length * _0x1b4298 + _0x22663c.length >= _0x70e294));) _0x1924f3.push(_0x22663c), _0x4832c3 += _0x22663c.length, _0x3731a6 = _0x3731a6.parentNode;
    return _0x1924f3.reverse().join('\x20>\x20');
  } catch {
    return "<unknown>";
  }
}
function buildDomSelector(_0x774290, _0x2262de) {
  let _0x5b31a6 = _0x774290,
    _0x502630 = [];
  if (!_0x5b31a6?.['tagName']) return '';
  if (__globalThis.HTMLElement && _0x5b31a6 instanceof HTMLElement && _0x5b31a6.dataset) {
    if (_0x5b31a6.dataset.sentryComponent) return _0x5b31a6.dataset.sentryComponent;
    if (_0x5b31a6.dataset.sentryElement) return _0x5b31a6.dataset.sentryElement;
  }
  _0x502630.push(_0x5b31a6.tagName.toLowerCase());
  let _0x535664 = _0x2262de?.['length'] ? _0x2262de.filter(_0x5d6792 => _0x5b31a6.getAttribute(_0x5d6792)).map(_0x22d3af => [_0x22d3af, _0x5b31a6.getAttribute(_0x22d3af)]) : null;
  if (_0x535664?.["length"]) _0x535664.forEach(_0x4060e9 => {
    _0x502630.push('[' + _0x4060e9[0] + '=\x22' + _0x4060e9[1] + '\x22]');
  });else {
    _0x5b31a6.id && _0x502630.push('#' + _0x5b31a6.id);
    let _0x12038c = _0x5b31a6.className;
    if (_0x12038c && isString(_0x12038c)) {
      let _0x1d4350 = _0x12038c.split(/\s+/);
      for (let key of _0x1d4350) _0x502630.push('.' + key);
    }
  }
  let _0x35fdf7 = ['aria-label', 'type', 'name', 'title', "alt"];
  for (let key of _0x35fdf7) {
    let _0x266552 = _0x5b31a6.getAttribute(key);
    _0x266552 && _0x502630.push('[' + key + '=\x22' + _0x266552 + '\x22]');
  }
  return _0x502630.join('');
}

function normalizeEventForSentry(_0x26f0de) {
  if (getErrorType(_0x26f0de)) return {
    message: _0x26f0de.message,
    name: _0x26f0de.name,
    stack: _0x26f0de.stack,
    ...shallowCopyObject(_0x26f0de)
  };
  if (isDomEvent(_0x26f0de)) {
    let _0x439184 = {
      type: _0x26f0de.type,
      target: getObjectDescription(_0x26f0de.target),
      currentTarget: getObjectDescription(_0x26f0de.currentTarget),
      ...shallowCopyObject(_0x26f0de)
    };
    return typeof CustomEvent < 'u' && safeInstanceOf(_0x26f0de, CustomEvent) && (_0x439184.detail = _0x26f0de.detail), _0x439184;
  } else return _0x26f0de;
}
function getObjectDescription(_0x2cf910) {
  try {
    return isDomElement(_0x2cf910) ? buildDomPath(_0x2cf910) : Object.prototype.toString.call(_0x2cf910);
  } catch {
    return '<unknown>';
  }
}
function shallowCopyObject(_0x4072e8) {
  if (typeof _0x4072e8 == 'object' && _0x4072e8 !== null) {
    let _0x2c2270 = {};
    for (let key in _0x4072e8) Object.prototype.hasOwnProperty.call(_0x4072e8, key) && (_0x2c2270[key] = _0x4072e8[key]);
    return _0x2c2270;
  } else return {};
}
/* [unbundle] yi = sentry_browser_module.Scope */;

/* [unbundle] k3e = require('@sentry/browser').withScope */

/* [unbundle] MX = require('@sentry/browser').withIsolationScope */

/* [unbundle] Uc = require('@sentry/browser').getCurrentScope */

/* [unbundle] Vc = require('@sentry/browser').getIsolationScope */

/* [unbundle] mk = require('@sentry/browser').getGlobalScope */

/* [unbundle] _k = require('@sentry/browser').withScope */

/* [unbundle] zr = require('@sentry/browser').getClient */

function normalizeAndSerialize(_0x1da2dd, _0x2cd223 = 100, _0x2e18c8 = 1 / 0) {
  try {
    return normalizeObjectForSentry('', _0x1da2dd, _0x2cd223, _0x2e18c8);
  } catch (_0x41c494) {
    return {
      ERROR: "**non-serializable** (" + _0x41c494 + ')'
    };
  }
}
function normalizeObjectForSentry(_0x2b4bdc, _0x49e62e, _0x57f599 = 1 / 0, _0x19fae0 = 1 / 0, _0x14c9f2 = createMemoizationTracker()) {
  let [_0x155247, _0x354585] = _0x14c9f2;
  if (_0x49e62e == null || ['boolean', 'string'].includes(typeof _0x49e62e) || typeof _0x49e62e == 'number' && Number.isFinite(_0x49e62e)) return _0x49e62e;
  let _0x108b56 = serializeSpecialValue(_0x2b4bdc, _0x49e62e);
  if (!_0x108b56.startsWith('[object\x20')) return _0x108b56;
  if (_0x49e62e.__sentry_skip_normalization__) return _0x49e62e;
  let _0xfff327 = typeof _0x49e62e.__sentry_override_normalization_depth__ == "number" ? _0x49e62e.__sentry_override_normalization_depth__ : _0x57f599;
  if (_0xfff327 === 0) return _0x108b56.replace('object\x20', '');
  if (_0x155247(_0x49e62e)) return '[Circular\x20~]';
  let _0x1b5828 = _0x49e62e;
  if (_0x1b5828 && typeof _0x1b5828.toJSON == 'function') try {
    let _0x1450c4 = _0x1b5828.toJSON();
    return normalizeObjectForSentry('', _0x1450c4, _0xfff327 - 1, _0x19fae0, _0x14c9f2);
  } catch {}
  let _0x4656dd = Array.isArray(_0x49e62e) ? [] : {},
    _0x55081f = 0,
    _0x39eccf = normalizeEventForSentry(_0x49e62e);
  for (let key in _0x39eccf) {
    if (!Object.prototype.hasOwnProperty.call(_0x39eccf, key)) continue;
    if (_0x55081f >= _0x19fae0) {
      _0x4656dd[key] = "[MaxProperties ~]";
      break;
    }
    let _0x210146 = _0x39eccf[key];
    _0x4656dd[key] = normalizeObjectForSentry(key, _0x210146, _0xfff327 - 1, _0x19fae0, _0x14c9f2), _0x55081f++;
  }
  return _0x354585(_0x49e62e), _0x4656dd;
}
function serializeSpecialValue(_0xe854e0, _0x8801c6) {
  try {
    if (_0xe854e0 === 'domain' && _0x8801c6 && typeof _0x8801c6 == 'object' && _0x8801c6._events) return "[Domain]";
    if (_0xe854e0 === 'domainEmitter') return '[DomainEmitter]';
    if (typeof global < 'u' && _0x8801c6 === global) return '[Global]';
    if (typeof window < 'u' && _0x8801c6 === window) return '[Window]';
    if (typeof document < 'u' && _0x8801c6 === document) return "[Document]";
    if (isVueInstance(_0x8801c6)) return getVueNodeType(_0x8801c6);
    if (isSyntheticEvent(_0x8801c6)) return "[SyntheticEvent]";
    if (typeof _0x8801c6 == "number" && !Number.isFinite(_0x8801c6)) return '[' + _0x8801c6 + ']';
    if (typeof _0x8801c6 == "function") return "[Function: " + getFunctionName(_0x8801c6) + ']';
    if (typeof _0x8801c6 == 'symbol') return '[' + String(_0x8801c6) + ']';
    if (typeof _0x8801c6 == 'bigint') return "[BigInt: " + String(_0x8801c6) + ']';
    let _0x2a8746 = getPrototypeName(_0x8801c6);
    return /^HTML(\w*)Element$/.test(_0x2a8746) ? '[HTMLElement:\x20' + _0x2a8746 + ']' : '[object\x20' + _0x2a8746 + ']';
  } catch (_0xc234c8) {
    return "**non-serializable** (" + _0xc234c8 + ')';
  }
}
function getPrototypeName(_0x21e378) {
  let _0x5def3e = Object.getPrototypeOf(_0x21e378);
  return _0x5def3e?.["constructor"] ? _0x5def3e.constructor.name : "null prototype";
}
function createMemoizationTracker() {
  let _0xa2d701 = new WeakSet();
  function _0x432e1d(_0x8b072a) {
    return _0xa2d701.has(_0x8b072a) ? true : (_0xa2d701.add(_0x8b072a), false);
  }
  function _0x4c4e1b(_0x5ea40a) {
    _0xa2d701.delete(_0x5ea40a);
  }
  return [_0x432e1d, _0x4c4e1b];
}
function createEnvelopeTuple(_0x428483, _0x4ce283 = []) {
  return [_0x428483, _0x4ce283];
}
function iterateEnvelopeItems(_0x3b74d9, _0x56131f) {
  let _0x16ddaf = _0x3b74d9[1];
  for (let key of _0x16ddaf) {
    let _0x57edc4 = key[0].type;
    if (_0x56131f(key, _0x57edc4)) return true;
  }
  return false;
}
function encodeTextToBytes(_0x5defa6) {
  let _0x250ff9 = getSentryCarrier(__globalThis);
  return _0x250ff9.encodePolyfill ? _0x250ff9.encodePolyfill(_0x5defa6) : new TextEncoder().encode(_0x5defa6);
}
function serializeEnvelopeToBuffer(_0x314640) {
  let [_0x4cabb8, _0x548433] = _0x314640,
    _0x54c72e = JSON.stringify(_0x4cabb8);
  function _0x284e2b(_0x2c0232) {
    typeof _0x54c72e == 'string' ? _0x54c72e = typeof _0x2c0232 == "string" ? _0x54c72e + _0x2c0232 : [encodeTextToBytes(_0x54c72e), _0x2c0232] : _0x54c72e.push(typeof _0x2c0232 == "string" ? encodeTextToBytes(_0x2c0232) : _0x2c0232);
  }
  for (let key of _0x548433) {
    let [_0x47f769, _0x46e4f5] = key;
    if (_0x284e2b('\x0a' + JSON.stringify(_0x47f769) + '\x0a'), typeof _0x46e4f5 == "string" || _0x46e4f5 instanceof Uint8Array) _0x284e2b(_0x46e4f5);else {
      let _0x4a2cf4;
      try {
        _0x4a2cf4 = JSON.stringify(_0x46e4f5);
      } catch {
        _0x4a2cf4 = JSON.stringify(normalizeAndSerialize(_0x46e4f5));
      }
      _0x284e2b(_0x4a2cf4);
    }
  }
  return typeof _0x54c72e == 'string' ? _0x54c72e : concatUint8Arrays(_0x54c72e);
}
function concatUint8Arrays(_0x32e774) {
  let _0x390424 = _0x32e774.reduce((_0xb552da, _0x3ef565) => _0xb552da + _0x3ef565.length, 0),
    _0x1ccabf = new Uint8Array(_0x390424),
    _0x4f24e7 = 0;
  for (let key of _0x32e774) _0x1ccabf.set(key, _0x4f24e7), _0x4f24e7 += key.length;
  return _0x1ccabf;
}
function getEnvelopeItemType(_0x25d411) {
  return rUe[_0x25d411];
}
var rUe = {
  session: 'session',
  sessions: "session",
  attachment: 'attachment',
  transaction: 'transaction',
  event: 'error',
  client_report: "internal",
  user_report: 'default',
  profile: 'profile',
  profile_chunk: 'profile',
  replay_event: 'replay',
  replay_recording: 'replay',
  check_in: "monitor",
  feedback: "feedback",
  span: 'span',
  raw_security: "security",
  log: "log_item",
  metric: "metric",
  trace_metric: 'metric'
};
function createResolvedSyncPromise(_0x43a8b6) {
  return new SyncPromise(_0x206660 => {
    _0x206660(_0x43a8b6);
  });
}
function createRejectedSyncPromise(_0x1d2507) {
  return new SyncPromise((_0x2ad1b3, _0x3714eb) => {
    _0x3714eb(_0x1d2507);
  });
}

class SyncPromise {
    constructor(_0x4042cd) {
      this._state = 0, this._handlers = [], this._runExecutor(_0x4042cd);
    }
    ["then"](_0x3c0195, _0x36eddc) {
      return new SyncPromise((_0x284e74, _0xe3dd1e) => {
        this._handlers.push([false, _0x2c4a0f => {
          if (!_0x3c0195) _0x284e74(_0x2c4a0f);else try {
            _0x284e74(_0x3c0195(_0x2c4a0f));
          } catch (_0x3b4708) {
            _0xe3dd1e(_0x3b4708);
          }
        }, _0x47d90a => {
          if (!_0x36eddc) _0xe3dd1e(_0x47d90a);else try {
            _0x284e74(_0x36eddc(_0x47d90a));
          } catch (_0x6ada08) {
            _0xe3dd1e(_0x6ada08);
          }
        }]), this._executeHandlers();
      });
    }
    ["catch"](_0x4b4398) {
      return this.then(_0x56be7f => _0x56be7f, _0x4b4398);
    }
    ["finally"](_0x17484d) {
      return new SyncPromise((_0x68f39e, _0x113d99) => {
        let _0x19d22d, _0x72e265;
        return this.then(_0x51c3e0 => {
          _0x72e265 = false, _0x19d22d = _0x51c3e0, _0x17484d && _0x17484d();
        }, _0xad844b => {
          _0x72e265 = true, _0x19d22d = _0xad844b, _0x17484d && _0x17484d();
        }).then(() => {
          if (_0x72e265) {
            _0x113d99(_0x19d22d);
            return;
          }
          _0x68f39e(_0x19d22d);
        });
      });
    }
    ['_executeHandlers']() {
      if (this._state === 0) return;
      let _0x3ca09e = this._handlers.slice();
      this._handlers = [], _0x3ca09e.forEach(_0x25bdbf => {
        _0x25bdbf[0] || (this._state === 1 && _0x25bdbf[1](this._value), this._state === 2 && _0x25bdbf[2](this._value), _0x25bdbf[0] = true);
      });
    }
    ['_runExecutor'](_0x1e6f5f) {
      let _0x25e01f = (_0x5302c1, _0x392ca5) => {
          if (this._state === 0) {
            if (isThenable(_0x392ca5)) {
              _0x392ca5.then(_0x239f81, _0x389498);
              return;
            }
            this._state = _0x5302c1, this._value = _0x392ca5, this._executeHandlers();
          }
        },
        _0x239f81 = _0x49e2ba => {
          _0x25e01f(1, _0x49e2ba);
        },
        _0x389498 = _0x4b99fd => {
          _0x25e01f(2, _0x4b99fd);
        };
      try {
        _0x1e6f5f(_0x239f81, _0x389498);
      } catch (_0x58844d) {
        _0x389498(_0x58844d);
      }
    }
  };

/* [unbundle] bk = require('@sentry/browser').captureException */

/* [unbundle] yS = require('@sentry/browser').captureEvent */

function createSyncPromise(_0x54eaed = 100) {
  let _0x4f5f29 = new Set();
  function _0x574b1f() {
    return _0x4f5f29.size < _0x54eaed;
  }
  function _0x402575(_0x399842) {
    _0x4f5f29.delete(_0x399842);
  }
  function _0x5ba442(_0x4401b8) {
    if (!_0x574b1f()) return createRejectedSyncPromise(Symbol.for('SentryBufferFullError'));
    let _0x45c5d9 = _0x4401b8();
    return _0x4f5f29.add(_0x45c5d9), _0x45c5d9.then(() => _0x402575(_0x45c5d9), () => _0x402575(_0x45c5d9)), _0x45c5d9;
  }
  function _0x24fb9d(_0x29114f) {
    if (!_0x4f5f29.size) return createResolvedSyncPromise(true);
    let _0x4257d2 = Promise.allSettled(Array.from(_0x4f5f29)).then(() => true);
    if (!_0x29114f) return _0x4257d2;
    let _0x6264e2 = [_0x4257d2, new Promise(_0x580efa => setTimeout(() => _0x580efa(false), _0x29114f))];
    return Promise.race(_0x6264e2);
  }
  return {
    get $() {
      return Array.from(_0x4f5f29);
    },
    add: _0x5ba442,
    drain: _0x24fb9d
  };
}
function getRateLimitForCategory(_0x5215f0, _0x276ee4) {
  return _0x5215f0[_0x276ee4] || _0x5215f0.all || 0;
}
function isRateLimited(_0x1cfbdb, _0x176a83, _0x149574 = Date.now()) {
  return getRateLimitForCategory(_0x1cfbdb, _0x176a83) > _0x149574;
}
function updateRateLimits(_0x24f919, {
  statusCode: _0x4feef5,
  headers: _0x443d52
}, _0x56ca46 = Date.now()) {
  let _0xa41479 = {
      ..._0x24f919
    },
    _0x27ebb3 = _0x443d52?.["x-sentry-rate-limits"],
    _0xcddbc = _0x443d52?.['retry-after'];
  if (_0x27ebb3) for (let _0x50f890 of _0x27ebb3.trim().split(',')) {
    let [_0x3e1f6c, _0x196a39,,, _0x21679b] = _0x50f890.split(':', 5),
      _0x549020 = parseInt(_0x3e1f6c, 10),
      _0x18f754 = (isNaN(_0x549020) ? 60 : _0x549020) * 1000;
    if (!_0x196a39) _0xa41479.all = _0x56ca46 + _0x18f754;else {
      for (let _0x28cdc7 of _0x196a39.split(';')) _0x28cdc7 === 'metric_bucket' ? (!_0x21679b || _0x21679b.split(';').includes("custom")) && (_0xa41479[_0x28cdc7] = _0x56ca46 + _0x18f754) : _0xa41479[_0x28cdc7] = _0x56ca46 + _0x18f754;
    }
  } else _0xcddbc ? _0xa41479.all = _0x56ca46 + CUe(_0xcddbc, _0x56ca46) : _0x4feef5 === 429 && (_0xa41479.all = _0x56ca46 + 60000);
  return _0xa41479;
}
function createSentryTransportWithRateLimit(_0x4e2f52, _0xd55f99, _0x35a7ac = createSyncPromise(_0x4e2f52.bufferSize || 64)) {
  let _0x5e2121 = {},
    _0x108f19 = _0x2c6b25 => _0x35a7ac.drain(_0x2c6b25);
  function _0x2a242f(_0x3b3345) {
    let _0x497058 = [];
    if (iterateEnvelopeItems(_0x3b3345, (_0x1feded, _0x55310b) => {
      let _0x1552b0 = getEnvelopeItemType(_0x55310b);
      isRateLimited(_0x5e2121, _0x1552b0) ? _0x4e2f52.recordDroppedEvent("ratelimit_backoff", _0x1552b0) : _0x497058.push(_0x1feded);
    }), _0x497058.length === 0) return Promise.resolve({});
    let _0x280d2e = createEnvelopeTuple(_0x3b3345[0], _0x497058),
      _0x54e2ba = _0x458001 => {
        iterateEnvelopeItems(_0x280d2e, (_0x2865bd, _0x2acd91) => {
          _0x4e2f52.recordDroppedEvent(_0x458001, getEnvelopeItemType(_0x2acd91));
        });
      },
      _0x1afb65 = () => _0xd55f99({
        body: serializeEnvelopeToBuffer(_0x280d2e)
      }).then(_0x44352f => (_0x44352f.statusCode !== void 0 && (_0x44352f.statusCode < 200 || _0x44352f.statusCode >= 300) && SENTRY_DEBUG && logger.warn("Sentry responded with status code " + _0x44352f.statusCode + " to sent event."), _0x5e2121 = updateRateLimits(_0x5e2121, _0x44352f), _0x44352f), _0xb812d5 => {
        throw _0x54e2ba("network_error"), SENTRY_DEBUG && logger.error('Encountered\x20error\x20running\x20transport\x20request:', _0xb812d5), _0xb812d5;
      });
    return _0x35a7ac.add(_0x1afb65).then(_0xe98c46 => _0xe98c46, _0x32f023 => {
      if (_0x32f023 === Symbol.for('SentryBufferFullError')) return SENTRY_DEBUG && logger.error('Skipped\x20sending\x20event\x20because\x20buffer\x20is\x20full.'), _0x54e2ba("queue_overflow"), Promise.resolve({});
      throw _0x32f023;
    });
  }
  return {
    send: _0x2a242f,
    flush: _0x108f19
  };
}

function isNativeFunction(_0x3b559e) {
  return _0x3b559e && /^function\s+\w+\(\)\s+\{\s+\[native code\]\s+\}$/.test(_0x3b559e.toString());
}

function createFetchTransport(_0x587d1e) {
  let _0x451690 = qk[_0x587d1e];
  if (_0x451690) return _0x451690;
  let _0x536380 = __globalThis[_0x587d1e];
  if (isNativeFunction(_0x536380)) return qk[_0x587d1e] = _0x536380.bind(__globalThis);
  let _0x580852 = __globalThis.document;
  if (_0x580852 && typeof _0x580852.createElement == 'function') try {
    let _0x99b07d = _0x580852.createElement("iframe");
    _0x99b07d.hidden = true, _0x580852.head.appendChild(_0x99b07d);
    let _0x4b436f = _0x99b07d.contentWindow;
    _0x4b436f?.[_0x587d1e] && (_0x536380 = _0x4b436f[_0x587d1e]), _0x580852.head.removeChild(_0x99b07d);
  } catch (_0x38822f) {
    typeof __SENTRY_DEBUG__ > 'u' || __SENTRY_DEBUG__ && logger.warn("Could not create sandbox iframe for " + _0x587d1e + " check, bailing to window." + _0x587d1e + ':\x20', _0x38822f);
  }
  return _0x536380 && (qk[_0x587d1e] = _0x536380.bind(__globalThis));
}
function deleteFromCache(_0x3634c2) {
  qk[_0x3634c2] = void 0;
}
var qk = {};
function createSentryFetchTransport(_0x231dbb, _0x34cf50 = createFetchTransport('fetch')) {
  let _0x354909 = 0,
    _0x1a4e21 = 0;
  async function _0x35217c(_0x5a0bce) {
    let _0x2b7464 = _0x5a0bce.body.length;
    _0x354909 += _0x2b7464, _0x1a4e21++;
    let _0x18b046 = {
      body: _0x5a0bce.body,
      method: 'POST',
      referrerPolicy: "strict-origin",
      headers: _0x231dbb.headers,
      keepalive: _0x354909 <= 60000 && _0x1a4e21 < 15,
      ..._0x231dbb.fetchOptions
    };
    try {
      let _0x3628ac = await _0x34cf50(_0x231dbb.url, _0x18b046);
      return {
        statusCode: _0x3628ac.status,
        headers: {
          'x-sentry-rate-limits': _0x3628ac.headers.get("X-Sentry-Rate-Limits"),
          'retry-after': _0x3628ac.headers.get('Retry-After')
        }
      };
    } catch (_0x49b21a) {
      throw deleteFromCache('fetch'), _0x49b21a;
    } finally {
      _0x354909 -= _0x2b7464, _0x1a4e21--;
    }
  }
  return createSentryTransportWithRateLimit(_0x231dbb, _0x35217c, createSyncPromise(_0x231dbb.bufferSize || 40));
}




module.exports = {
  createSentryFetchTransport
}