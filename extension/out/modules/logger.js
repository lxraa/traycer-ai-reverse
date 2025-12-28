// 导入依赖
const sentry_browser_module = require("@sentry/browser");
const { config } = require("./config.js");

// 初始化Logger和Sentry
var sentryInstance = null;

function getSentryInstance() {
  return sentryInstance === null && (sentryInstance = new sentry_browser_module.Scope()), sentryInstance;
}

function initializeSentryClient() {
  let _0x580b61 = sentry_browser_module.getDefaultIntegrations({}).filter(_0x3b5607 => !['BrowserApiErrors', 'Breadcrumbs', 'GlobalHandlers'].includes(_0x3b5607.name)),
    _0x823f87 = new sentry_browser_module.BrowserClient({
      dsn: "https://97263dbc9f614fd87a3a67aea26d1181@o4507249693229056.ingest.us.sentry.io/4507252971798528",
      integrations: _0x580b61,
      beforeSend(_0xc069f3) {
        for (let key of _0xc069f3?.['exception']?.["values"] ?? []) for (let _0x1dfbc6 of key.stacktrace?.['frames'] ?? []) if (_0x1dfbc6.filename?.["includes"](config.extensionName)) return _0xc069f3;
        return null;
      },
      tracesSampleRate: 0.4,
      sampleRate: 1,
      attachStacktrace: true,
      environment: config.nodeEnv,
      transport: sentry_browser_module.makeFetchTransport,
      stackParser: sentry_browser_module.defaultStackParser
    });
  getSentryInstance().setTag("extention", config.extensionName), getSentryInstance().setClient(_0x823f87), _0x823f87.init();
}

function captureExceptionToSentry(exceptionError, captureContext) {
  return config.nodeEnv === "production" && getSentryInstance().captureException(exceptionError, captureContext), exceptionError;
}

function setSentryTag(tagName, tagValue) {
  getSentryInstance().setTag(tagName, tagValue);
}

async function closeSentryClient() {
  await getSentryInstance().getClient()?.["close"](200);
}

function throttle(logLevelStr) {
  switch (logLevelStr) {
    case 'off':
      return 0;
    case 'error':
      return 1;
    case 'warn':
      return 2;
    case 'info':
      return 3;
    case 'debug':
      return 4;
    case "trace":
      return 5;
    default:
      return 3;
  }
}

var Logger = new class {
  constructor() {
    this._isDebugging = false, this.level = 0, this._logLevel = "off";
  }
  ["configure"](_0x58fb5a, _0x1ce42b, _0x1cedf9 = false) {
    this.provider = _0x58fb5a, this._isDebugging = _0x1cedf9, this.logLevel = _0x1ce42b;
  }
  ['enabled'](_0x60137d) {
    return this.level >= throttle(_0x60137d);
  }
  ['dispose']() {
    this.output?.["hide"](), this.output?.["clear"](), this.output?.['dispose'](), this.output = void 0;
  }
  get ["isDebugging"]() {
    return this._isDebugging;
  }
  get ['logLevel']() {
    return this._logLevel;
  }
  set ['logLevel'](newLogLevel) {
    newLogLevel === 'off' && (console.log('Traycer: Defaulting log level to \x27error\x27 as \x27off\x27 is not allowed'), newLogLevel = "error"), this.isDebugging && (newLogLevel = "trace"), this._logLevel = newLogLevel, this.level = throttle(this._logLevel), this.output ??= this.provider.createChannel(this.provider.name);
  }
  get ['timestamp']() {
    let _0x10a8c6 = new Date(),
      _0x377578 = numValue => (numValue < 10 ? '0' : '') + numValue,
      _0x8b7079 = numValue => (numValue < 100 ? '0' : '') + (numValue < 10 ? '00' : '') + numValue;
    return _0x10a8c6.getFullYear() + '-' + _0x377578(_0x10a8c6.getMonth() + 1) + '-' + _0x377578(_0x10a8c6.getDate()) + ' ' + _0x377578(_0x10a8c6.getHours()) + ':' + _0x377578(_0x10a8c6.getMinutes()) + ':' + _0x377578(_0x10a8c6.getSeconds()) + '.' + _0x8b7079(_0x10a8c6.getMilliseconds());
  }
  ["trace"](_0x1c4f12, ..._0x17c1c7) {
    this.level < 5 || (this.isDebugging && console.trace(this.timestamp, _0x1c4f12 ?? '', ..._0x17c1c7), this.output?.['trace']?.(_0x1c4f12, ..._0x17c1c7));
  }
  ["debug"](_0x333991, ..._0x2fd09d) {
    this.level < 4 || (this.isDebugging && console.debug(this.timestamp, _0x333991 ?? '', ..._0x2fd09d), this.output?.["debug"]?.(_0x333991, ..._0x2fd09d));
  }
  ["error"](_0xfc345f, _0x176cd8, ..._0x59cb4c) {
    if (_0xfc345f ? _0xfc345f instanceof Error && _0xfc345f.message === 'Canceled' || captureExceptionToSentry(new Error("Error: " + String(_0xfc345f) + ', Message: ' + (_0x176cd8 ?? '')), {
      originalException: _0xfc345f
    }) : _0x176cd8 && captureExceptionToSentry(new Error(_0x176cd8)), !(this.level < 1 && !this.isDebugging)) {
      if (!_0x176cd8) {
        let _0x30c0e0 = _0xfc345f instanceof Error ? _0xfc345f.stack : void 0;
        if (_0x30c0e0) {
          let _0x414ff8 = /.*\s*?at\s(.+?)\s/.exec(_0x30c0e0);
          _0x414ff8 != null && (_0x176cd8 = _0x414ff8[1]);
        }
      }
      this.isDebugging && (_0xfc345f != null ? console.error(this.timestamp, _0x176cd8 ?? '', ..._0x59cb4c, _0xfc345f) : console.error(this.timestamp, _0x176cd8 ?? '', ..._0x59cb4c)), this.output?.['error']?.(_0xfc345f, _0x176cd8 ?? '', ..._0x59cb4c);
    }
  }
  ['info'](_0x499546, ..._0x207c22) {
    this.level < 3 && !this.isDebugging || (this.isDebugging && console.info(this.timestamp, _0x499546 ?? '', ..._0x207c22), this.output?.["info"]?.(_0x499546, ..._0x207c22));
  }
  ["warn"](_0x121631, ..._0x335a0f) {
    this.level < 2 && !this.isDebugging || (this.isDebugging && console.warn(this.timestamp, _0x121631 ?? '', ..._0x335a0f), this.output?.['warn']?.(_0x121631, ..._0x335a0f));
  }
}();

module.exports = {
    Logger,
    initializeSentryClient,
    captureExceptionToSentry,
    setSentryTag,
    closeSentryClient,
    getSentryInstance
};